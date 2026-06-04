/**
 * useAuditRound — GLI-19 Phase 2: Per-round immutable audit trail.
 *
 * Design:
 *  - On DEAL (flop): write an AuditRound record with status="open".
 *    Records bets placed, balance_before, device_id, session_id, versions_snapshot.
 *  - On SETTLE: update the record to status="settled" with full outcome fields.
 *  - On ABANDON (reset mid-round, page close): update to status="abandoned".
 *  - Records are never deleted. Updates are only to add outcome — bets & balance_before are immutable once written.
 *  - If DB write fails: queued silently, retried. Never blocks gameplay.
 *
 * GLI-19 mandatory fields covered:
 *   ✅ round_number         — sequential per device
 *   ✅ timestamp_open       — when bets were locked (flop dealt)
 *   ✅ timestamp_settled    — when outcome was determined
 *   ✅ balance_before       — authoritative balance BEFORE bets deducted
 *   ✅ balance_after        — authoritative balance AFTER payout applied
 *   ✅ total_wagered        — sum of all bets this round
 *   ✅ total_returned       — sum of all payouts this round
 *   ✅ net_result           — returned minus wagered
 *   ✅ hand_bets            — map of hand_id → amount
 *   ✅ rank_bets            — map of rank_key → amount
 *   ✅ color_bets           — map of color_key → amount
 *   ✅ low_high_bet         — { type, amount }
 *   ✅ community_cards      — full 5-card board
 *   ✅ winner_hand_ids      — winning hand(s)
 *   ✅ winning_rank         — poker rank of winning hand
 *   ✅ winning_colors       — color board result(s)
 *   ✅ winning_low_high     — river result
 *   ✅ kill_switch_active   — whether side bets were locked
 *   ✅ is_board_win         — community board win flag
 *   ✅ card_win/rank_win/color_win/river_win — per-board outcome flags
 *   ✅ versions_snapshot    — game config in effect at time of round
 *   ✅ status               — open / settled / abandoned
 */

import { useRef, useCallback } from 'react';
import { AuditRound } from '@/api/entities';

const ROUND_KEY = 'rfth_audit_round_number'; // monotonically increasing per device

function getNextRoundNumber() {
  try {
    const n = parseInt(localStorage.getItem(ROUND_KEY) || '0', 10);
    const next = n + 1;
    localStorage.setItem(ROUND_KEY, String(next));
    return next;
  } catch {
    return Date.now(); // fallback: timestamp as round number
  }
}

export function useAuditRound({ deviceId, sessionId }) {
  // currentRecordId: the DB id of the currently open round record
  const currentRecordId = useRef(null);
  const pendingOpen = useRef(null);   // queued open payload if DB write failed
  const pendingSettle = useRef(null); // queued settle payload if DB write failed

  // ── openRound — called at flop deal (bets locked in) ─────────────────────
  const openRound = useCallback(async ({
    roundNumber,
    balanceBefore,
    handBets,
    rankBets,
    colorBets,
    lowHighBet,
    totalWagered,
    killSwitchActive,
    playerSlot,
    versionsSnapshot,
  }) => {
    const payload = {
      session_id:       sessionId,
      device_id:        deviceId,
      player_slot:      playerSlot,
      round_number:     roundNumber,
      timestamp_open:   new Date().toISOString(),
      balance_before:   balanceBefore,
      total_wagered:    totalWagered,
      hand_bets:        handBets,
      rank_bets:        rankBets,
      color_bets:       colorBets,
      low_high_bet:     lowHighBet,
      kill_switch_active: killSwitchActive,
      versions_snapshot: versionsSnapshot,
      status:           'open',
    };

    try {
      const rec = await AuditRound.create(payload);
      currentRecordId.current = rec.id;
      pendingOpen.current = null;
      console.log('[AuditRound] Opened:', rec.id, 'round', roundNumber);
    } catch (e) {
      console.error('[AuditRound] Open failed, queuing:', e);
      pendingOpen.current = payload; // will retry on settle
    }
  }, [deviceId, sessionId]);

  // ── settleRound — called after all payouts calculated ────────────────────
  const settleRound = useCallback(async ({
    communityCards,
    winnerHandIds,
    winningRank,
    winningColors,
    winningLowHigh,
    isBoardWin,
    cardWin,
    rankWin,
    colorWin,
    riverWin,
    totalReturned,
    balanceAfter,
  }) => {
    const settlePayload = {
      timestamp_settled: new Date().toISOString(),
      community_cards:   communityCards,
      winner_hand_ids:   winnerHandIds,
      winning_rank:      winningRank,
      winning_colors:    winningColors,
      winning_low_high:  winningLowHigh,
      is_board_win:      isBoardWin,
      card_win:          cardWin,
      rank_win:          rankWin,
      color_win:         colorWin,
      river_win:         riverWin,
      total_returned:    totalReturned,
      balance_after:     balanceAfter,
      net_result:        totalReturned - (pendingOpen.current?.total_wagered ?? 0),
      status:            'settled',
    };

    const rid = currentRecordId.current;

    // If we never got a DB record (open failed), create a full record now
    if (!rid && pendingOpen.current) {
      try {
        const full = { ...pendingOpen.current, ...settlePayload };
        const rec = await AuditRound.create(full);
        currentRecordId.current = rec.id;
        pendingOpen.current = null;
        pendingSettle.current = null;
        console.log('[AuditRound] Settled (late create):', rec.id);
      } catch (e) {
        console.error('[AuditRound] Settle (late create) failed:', e);
        pendingSettle.current = settlePayload;
      }
      return;
    }

    if (!rid) {
      console.warn('[AuditRound] No open record to settle');
      return;
    }

    try {
      await AuditRound.update(rid, settlePayload);
      currentRecordId.current = null;
      pendingSettle.current = null;
      console.log('[AuditRound] Settled:', rid);
    } catch (e) {
      console.error('[AuditRound] Settle failed, queuing:', e);
      pendingSettle.current = settlePayload;
      // Retry in 3 seconds
      setTimeout(async () => {
        if (pendingSettle.current && currentRecordId.current) {
          try {
            await AuditRound.update(currentRecordId.current, pendingSettle.current);
            pendingSettle.current = null;
          } catch {}
        }
      }, 3000);
    }
  }, []);

  // ── abandonRound — called if round is cleared before settlement ──────────
  const abandonRound = useCallback(async () => {
    const rid = currentRecordId.current;
    if (!rid) return;
    try {
      await AuditRound.update(rid, {
        status:            'abandoned',
        timestamp_settled: new Date().toISOString(),
      });
      currentRecordId.current = null;
      console.log('[AuditRound] Abandoned:', rid);
    } catch (e) {
      console.error('[AuditRound] Abandon failed:', e);
    }
  }, []);

  // ── resumeRound — called when player resumes a recovered round ─────────────
  // Injects the existing DB record id so settleRound completes the correct record
  const resumeRound = useCallback((existingRecordId) => {
    currentRecordId.current = existingRecordId;
    console.log('[AuditRound] Resumed with existing record:', existingRecordId);
  }, []);

  return { openRound, settleRound, abandonRound, resumeRound, getNextRoundNumber };
}
