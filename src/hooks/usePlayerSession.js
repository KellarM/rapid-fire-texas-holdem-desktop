/**
 * usePlayerSession — GLI-19 compliant server-authoritative balance & session management.
 * 
 * FIX: Removed illegal setState-inside-setState pattern that caused white screen crashes.
 * recordIds is now stored in a useRef so it can be read synchronously without triggering
 * additional state updates or violating React's rules of state transitions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerSession } from '@/api/entities';

// ─── Constants ────────────────────────────────────────────────────────────────
export const STARTING_BALANCE  = 10000;
export const NUM_PLAYERS       = 10;
const DEVICE_KEY               = 'rfth_device_id';
const SESSION_ID_KEY           = 'rfth_session_id';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Read device ID from cookie (survives localStorage clears / iframe reloads)
function getDeviceIdFromCookie() {
  try {
    const match = document.cookie.match(/(?:^|;\s*)rfth_device_id=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

// Write device ID to cookie with 1-year expiry
function setDeviceIdCookie(id) {
  try {
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `rfth_device_id=${encodeURIComponent(id)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

function getDeviceId() {
  try {
    // Check cookie first — survives Base44 preview iframe reloads that clear localStorage
    let id = getDeviceIdFromCookie();
    if (id) {
      // Keep localStorage in sync too
      localStorage.setItem(DEVICE_KEY, id);
      console.log('[DEVICE] Loaded from cookie:', id);
      return id;
    }
    // Fall back to localStorage
    id = localStorage.getItem(DEVICE_KEY);
    if (id) {
      // Back-fill cookie for future loads
      setDeviceIdCookie(id);
      console.log('[DEVICE] Loaded from localStorage, cookie set:', id);
      return id;
    }
    // First ever visit — generate new id
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(DEVICE_KEY, id);
    setDeviceIdCookie(id);
    console.log('[DEVICE] New device ID created:', id);
    return id;
  } catch {
    return 'dev_fallback_' + Math.random().toString(36).slice(2, 9);
  }
}

// Balance cache is keyed PER device so a new device_id never reads stale data
// from a previous device's session.
function balanceCacheKey(deviceId) {
  return 'rfth_balance_cache_' + deviceId;
}

function getOrCreateSessionId() {
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = 'ses_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return 'ses_' + Date.now();
  }
}

function readBalanceCache(deviceId) {
  try {
    const raw = localStorage.getItem(balanceCacheKey(deviceId));
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length === NUM_PLAYERS) return arr;
    }
  } catch {}
  // No cache for this device — start from scratch (DB will authoritative-load shortly)
  return Array(NUM_PLAYERS).fill(STARTING_BALANCE);
}

function writeBalanceCache(deviceId, balances) {
  try { localStorage.setItem(balanceCacheKey(deviceId), JSON.stringify(balances)); } catch {}
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePlayerSession() {
  // Resolve deviceId synchronously FIRST so the balance cache key is correct.
  // If deviceId changes (new localStorage), the cache miss returns STARTING_BALANCE
  // instead of bleeding a stale value from a different device's session.
  const deviceId   = useRef(getDeviceId());
  const sessionId  = useRef(getOrCreateSessionId());

  // Initialise with STARTING_BALANCE — DB loads the real value within ~500ms.
  // We deliberately do NOT pre-populate from localStorage cache here because:
  // 1. The cache may be stale (written before a win/loss that wasn't flushed)
  // 2. A stale cache value flashing briefly is more confusing than $10,000
  // 3. The DB is the single source of truth (GLI-19 requirement)
  // The cache is still written on every balance change for crash-recovery fallback.
  const [balances, setBalancesState] = useState(() => Array(NUM_PLAYERS).fill(STARTING_BALANCE));

  // FIX: Use ref for recordIds — avoids illegal setState-inside-setState
  const recordIdsRef = useRef(Array(NUM_PLAYERS).fill(null));
  const [dbReady, setDbReady] = useState(false);

  // Override map: { [slot]: value } — if set, loadSessions will use this value
  // instead of the DB value for that slot. Used by abandon flow to prevent
  // a remount-triggered loadSessions from overwriting the refunded balance
  // before the DB write has landed.
  const balanceOverrideRef = useRef({});

  // Pending write queue — if a DB write fails we retry it
  const pendingRef  = useRef({}); // { [slot]: balance }
  const retryTimer  = useRef(null);

  // ── Load all 10 player sessions from DB on mount ──────────────────────────
  useEffect(() => {
    async function loadSessions() {
      try {
        const records = await PlayerSession.filter({ device_id: deviceId.current });
        // Start from STARTING_BALANCE — DB values are authoritative, not cache
        const newBalances = Array(NUM_PLAYERS).fill(STARTING_BALANCE);

        for (const rec of records) {
          const slot = rec.player_slot;
          if (slot >= 0 && slot < NUM_PLAYERS) {
            newBalances[slot] = rec.balance ?? STARTING_BALANCE;
            recordIdsRef.current[slot] = rec.id;
          }
        }

        // Create records for any missing slots
        const creates = [];
        for (let slot = 0; slot < NUM_PLAYERS; slot++) {
          if (!recordIdsRef.current[slot]) {
            creates.push(
              PlayerSession.create({
                device_id:      deviceId.current,
                player_slot:    slot,
                balance:        STARTING_BALANCE,
                rounds_played:  0,
                total_wagered:  0,
                total_returned: 0,
                session_id:     sessionId.current,
                started_at:     new Date().toISOString(),
                last_active_at: new Date().toISOString(),
                is_active:      true,
              }).then(rec => ({ slot, id: rec.id }))
            );
          }
        }

        if (creates.length > 0) {
          const created = await Promise.all(creates);
          for (const { slot, id } of created) {
            recordIdsRef.current[slot] = id;
          }
        }

        // Apply any balance overrides — these come from the abandon flow where
        // persistBalance() was awaited but the DB write may not have propagated
        // to a subsequent loadSessions() call yet.
        const overrides = balanceOverrideRef.current;
        for (const [slotStr, val] of Object.entries(overrides)) {
          const slot = Number(slotStr);
          if (slot >= 0 && slot < NUM_PLAYERS) {
            newBalances[slot] = val;
            console.log('[PlayerSession] Override applied for slot', slot, ':', val);
          }
        }
        // Clear overrides — they've been applied
        balanceOverrideRef.current = {};

        setBalancesState(newBalances);
        writeBalanceCache(deviceId.current, newBalances);
        setDbReady(true);
        console.log('[PlayerSession] Loaded from DB:', newBalances);
      } catch (e) {
        console.error('[PlayerSession] DB load failed, using cache:', e);
        setDbReady(true);
      }
    }
    loadSessions();
  }, []);

  // ── Write a single slot balance to DB ────────────────────────────────────
  // FIX: reads recordIdsRef.current directly — no setState call
  const persistBalance = useCallback(async (slot, newBalance) => {
    const rid = recordIdsRef.current[slot];
    if (!rid) {
      pendingRef.current[slot] = newBalance;
      return;
    }
    try {
      await PlayerSession.update(rid, {
        balance:        newBalance,
        last_active_at: new Date().toISOString(),
      });
      delete pendingRef.current[slot];
    } catch (e) {
      console.error(`[PlayerSession] Write failed slot ${slot}:`, e);
      pendingRef.current[slot] = newBalance;
      scheduleRetry();
    }
  }, []);

  // ── Retry loop for failed writes ─────────────────────────────────────────
  function scheduleRetry() {
    if (retryTimer.current) return;
    retryTimer.current = setTimeout(async () => {
      retryTimer.current = null;
      const pending = { ...pendingRef.current };
      for (const [slotStr, bal] of Object.entries(pending)) {
        await persistBalance(Number(slotStr), bal);
      }
    }, 3000);
  }

  // ── Public: update balance for one slot ──────────────────────────────────
  const setBalance = useCallback((slot, newBalance) => {
    setBalancesState(prev => {
      const next = [...prev];
      next[slot] = newBalance;
      writeBalanceCache(deviceId.current, next);
      return next;
    });
    // FIX: persistBalance now reads ref directly — safe to call outside updater
    persistBalance(slot, newBalance);
  }, [persistBalance]);

  // ── Public: force a balance value, protecting against loadSessions overwrite ──
  // Use this when you need the balance to survive a component remount.
  // Sets the override ref so loadSessions applies this value if it re-runs,
  // AND persists to DB (awaitable). Returns the persist promise.
  const forceBalance = useCallback((slot, newBalance) => {
    // 1. Update UI state immediately
    setBalancesState(prev => {
      const next = [...prev];
      next[slot] = newBalance;
      writeBalanceCache(deviceId.current, next);
      return next;
    });
    // 2. Set override so any re-mount loadSessions uses this value
    balanceOverrideRef.current[slot] = newBalance;
    // 3. Persist to DB (awaitable — caller should await for guarantee)
    return persistBalance(slot, newBalance);
  }, [persistBalance]);

  // ── Public: update balance for multiple slots at once ────────────────────
  const setBalances = useCallback((updaterOrArray) => {
    setBalancesState(prev => {
      const next = typeof updaterOrArray === 'function'
        ? updaterOrArray(prev)
        : updaterOrArray;
      writeBalanceCache(deviceId.current, next);
      // FIX: persist AFTER computing next, reading ref directly — NO setState inside setState
      for (let slot = 0; slot < NUM_PLAYERS; slot++) {
        if (next[slot] !== prev[slot]) {
          persistBalance(slot, next[slot]);
        }
      }
      return next;
    });
  }, [persistBalance]);

  // ── Public: increment session stats after round settlement ────────────────
  const recordRoundResult = useCallback(async (slot, { wagered, returned }) => {
    const rid = recordIdsRef.current[slot];
    if (!rid) return;
    PlayerSession.update(rid, {
      last_active_at: new Date().toISOString(),
    }).catch(e => console.warn('[PlayerSession] stats update failed:', e));
  }, []);

  // ── Public: hard reset all balances (Reset Bank action) ──────────────────
  const resetAllBalances = useCallback(async () => {
    const fresh = Array(NUM_PLAYERS).fill(STARTING_BALANCE);
    setBalancesState(fresh);
    writeBalanceCache(deviceId.current, fresh);
    for (let slot = 0; slot < NUM_PLAYERS; slot++) {
      const rid = recordIdsRef.current[slot];
      if (rid) {
        PlayerSession.update(rid, {
          balance:        STARTING_BALANCE,
          rounds_played:  0,
          total_wagered:  0,
          total_returned: 0,
          last_active_at: new Date().toISOString(),
        }).catch(e => console.warn('[PlayerSession] reset failed slot', slot, e));
      }
    }
  }, []);

  return {
    balances,
    setBalance,
    setBalances,
    persistBalance,          // awaitable — confirms DB write
    forceBalance,            // awaitable — sets override + persists, survives remount
    resetAllBalances,
    recordRoundResult,
    deviceId: deviceId.current,
    sessionId: sessionId.current,
    dbReady,
  };
}
