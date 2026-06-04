/**
 * useIncompleteRoundRecovery — GLI-19 Phase 3: Incomplete game recovery.
 *
 * GLI-19 requirement:
 *   "If a game is interrupted before completion, the system must present
 *    the incomplete game to the player upon reconnection and allow them
 *    to either complete or abandon it."
 *
 * How it works:
 *  1. On page load, query AuditRound for any record with:
 *       device_id = this device, status = "open"
 *  2. If found → return the recovery payload so the game can restore state.
 *  3. Player sees a modal: "Resume incomplete round" or "Abandon".
 *  4. Resume  → restore bets, skip back to 'flop' phase, reuse the AuditRound record.
 *  5. Abandon → update record to status="abandoned", start fresh.
 *
 * The hook is intentionally minimal — it only detects & exposes the open round.
 * The game component decides what to do with it.
 */

import { useState, useEffect, useCallback } from 'react';
import { AuditRound } from '@/api/entities';

export function useIncompleteRoundRecovery({ deviceId, onRecordId }) {
  const [incompleteRound, setIncompleteRound] = useState(null); // the open AuditRound record
  const [checking, setChecking]               = useState(true);  // true while DB query runs

  useEffect(() => {
    if (!deviceId) return;

    async function checkForOpenRound() {
      try {
        const records = await AuditRound.filter({ device_id: deviceId, status: 'open' });
        if (records && records.length > 0) {
          // Sort by timestamp_open descending — use the most recent open round
          const sorted = records.sort(
            (a, b) => new Date(b.timestamp_open) - new Date(a.timestamp_open)
          );
          const latest = sorted[0];

          // Sanity: if this open record is older than 24 hours, auto-abandon it
          // (hardware reset, power failure days ago — not worth restoring)
          const ageMs = Date.now() - new Date(latest.timestamp_open).getTime();
          const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
          if (ageMs > MAX_AGE_MS) {
            await AuditRound.update(latest.id, {
              status:            'abandoned',
              timestamp_settled: new Date().toISOString(),
            });
            console.log('[Recovery] Auto-abandoned stale open round:', latest.id);
            setChecking(false);
            return;
          }

          // Also abandon any older open records (duplicates from multiple tabs etc.)
          for (let i = 1; i < sorted.length; i++) {
            AuditRound.update(sorted[i].id, {
              status:            'abandoned',
              timestamp_settled: new Date().toISOString(),
            }).catch(() => {});
          }

          setIncompleteRound(latest);
          // Expose the record id to the audit hook so it can complete settlement
          if (onRecordId) onRecordId(latest.id);
        }
      } catch (e) {
        console.error('[Recovery] Check failed:', e);
      } finally {
        setChecking(false);
      }
    }

    checkForOpenRound();
  }, [deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Called when player clicks "Resume" — returns the bet state to restore
  const getRestoredBetState = useCallback(() => {
    if (!incompleteRound) return null;
    return {
      recordId:       incompleteRound.id,
      roundNumber:    incompleteRound.round_number,
      handBets:       incompleteRound.hand_bets        || {},
      rankBets:       incompleteRound.rank_bets        || {},
      colorBets:      incompleteRound.color_bets       || {},
      lowHighBet:     incompleteRound.low_high_bet     || null,
      balanceBefore:  incompleteRound.balance_before   ?? null,
      totalWagered:   incompleteRound.total_wagered    ?? 0,
      killSwitchActive: incompleteRound.kill_switch_active ?? false,
      versionsSnapshot: incompleteRound.versions_snapshot ?? {},
      openedAt:       incompleteRound.timestamp_open,
    };
  }, [incompleteRound]);

  // Called when player clicks "Abandon"
  const abandonIncompleteRound = useCallback(async () => {
    if (!incompleteRound) return;
    try {
      await AuditRound.update(incompleteRound.id, {
        status:            'abandoned',
        timestamp_settled: new Date().toISOString(),
      });
      console.log('[Recovery] Player abandoned open round:', incompleteRound.id);
    } catch (e) {
      console.error('[Recovery] Abandon failed:', e);
    } finally {
      setIncompleteRound(null);
    }
  }, [incompleteRound]);

  // Called after successful resume — clears the recovery state
  const clearRecovery = useCallback(() => {
    setIncompleteRound(null);
  }, []);

  return {
    checking,           // true while DB query is in flight
    incompleteRound,    // the raw DB record if one exists, else null
    getRestoredBetState,
    abandonIncompleteRound,
    clearRecovery,
  };
}
