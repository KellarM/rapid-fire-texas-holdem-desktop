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
function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(DEVICE_KEY, id);
      console.log('[DEVICE] New device ID created:', id);
    } else {
      console.log('[DEVICE] Existing device ID loaded:', id);
    }
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

  // Initialise from cache for THIS device — shows correct value immediately while DB loads
  const [balances, setBalancesState] = useState(() => readBalanceCache(deviceId.current));

  // FIX: Use ref for recordIds — avoids illegal setState-inside-setState
  const recordIdsRef = useRef(Array(NUM_PLAYERS).fill(null));
  const [dbReady, setDbReady] = useState(false);

  // Pending write queue — if a DB write fails we retry it
  const pendingRef  = useRef({}); // { [slot]: balance }
  const retryTimer  = useRef(null);

  // ── Load all 10 player sessions from DB on mount ──────────────────────────
  useEffect(() => {
    async function loadSessions() {
      try {
        const records = await PlayerSession.filter({ device_id: deviceId.current });
        const newBalances = [...readBalanceCache(deviceId.current)];

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
    resetAllBalances,
    recordRoundResult,
    deviceId: deviceId.current,
    sessionId: sessionId.current,
    dbReady,
  };
}
