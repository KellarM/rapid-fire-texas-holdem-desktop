// ============================================================
// analytics.js — Rapid Fire Texas Hold'em Event Tracking
// Fires GA4 custom events for every round outcome.
// Uses window.gtag if available (no-op silently if not loaded).
// ============================================================

/**
 * Safe gtag wrapper — never throws, silently skips if GA not loaded.
 * @param {string} eventName
 * @param {Object} params
 */
function fire(eventName, params) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch (_) {}
}

/**
 * trackRoundOutcome — called once per settled round.
 * Fires up to 5 events depending on what bets were active:
 *
 *  rfth_card_outcome   — Card board result  (always fired)
 *  rfth_rank_outcome   — Rank board result  (fired if player had rank bets)
 *  rfth_color_outcome  — Color board result (fired if player had color bets)
 *  rfth_river_outcome  — River board result (fired if player had river/low-high bet)
 *  rfth_round_summary  — Full round summary (always fired)
 *
 * @param {Object} roundData — the roundData object from settle() in RapidFireGame.jsx
 */
export function trackRoundOutcome(roundData) {
  if (!roundData) return;

  const {
    roundId,
    communityCards    = [],
    winnerHandIds     = [],
    winningRank       = null,
    winningColors     = [],
    winningLowHigh    = null,
    isBoardWin        = false,
    handBets          = {},
    rankBets          = {},
    colorBets         = {},
    lowHighBet        = null,
    killSwitchActive  = false,
    totalBet          = 0,
    totalPayout       = 0,
    netResult         = 0,
    redsCount         = 0,
    blacksCount       = 0,
    riverCard         = null,
  } = roundData;

  // ── Derived values ────────────────────────────────────────────────────────
  const boardCards      = communityCards.map(c => (c?.rank ?? '') + (c?.suit ?? '')).join(',');
  const handBetCount    = Object.values(handBets).filter(v => v > 0).length;
  const hasRankBet      = Object.values(rankBets).some(v => v > 0);
  const hasColorBet     = Object.values(colorBets).some(v => v > 0);
  const hasRiverBet     = !!(lowHighBet?.amount > 0);
  const cardWin         = winnerHandIds.length > 0 || isBoardWin;
  const colorWin        = winningColors.length > 0;
  const rankWin         = !!winningRank && hasRankBet;
  const riverWin        = !!winningLowHigh;
  const outcome         = netResult > 0 ? 'win' : netResult < 0 ? 'loss' : 'push';

  // ── 1. Card board outcome (always fired) ─────────────────────────────────
  fire('rfth_card_outcome', {
    round_id:          roundId,
    board_cards:       boardCards,
    winner_hand_ids:   winnerHandIds.join(',') || 'none',
    is_board_win:      isBoardWin,
    card_win:          cardWin,
    hands_bet_count:   handBetCount,
    kill_switch:       killSwitchActive,
    reds_count:        redsCount,
    blacks_count:      blacksCount,
  });

  // ── 2. Rank board outcome (only if rank bet placed) ──────────────────────
  if (hasRankBet) {
    fire('rfth_rank_outcome', {
      round_id:        roundId,
      winning_rank:    winningRank || 'none',
      rank_bet_keys:   Object.keys(rankBets).filter(k => rankBets[k] > 0).join(','),
      rank_win:        rankWin,
    });
  }

  // ── 3. Color board outcome (only if color bet placed) ────────────────────
  if (hasColorBet) {
    fire('rfth_color_outcome', {
      round_id:        roundId,
      reds_count:      redsCount,
      blacks_count:    blacksCount,
      winning_colors:  winningColors.join(',') || 'none',
      color_bet_keys:  Object.keys(colorBets).filter(k => colorBets[k] > 0).join(','),
      color_win:       colorWin,
    });
  }

  // ── 4. River board outcome (only if low/high bet placed) ─────────────────
  if (hasRiverBet) {
    fire('rfth_river_outcome', {
      round_id:        roundId,
      river_card:      riverCard || 'none',
      low_high_bet:    lowHighBet?.type || 'none',
      winning_low_high:winningLowHigh || 'none',
      river_win:       riverWin,
    });
  }

  // ── 5. Full round summary (always fired) ─────────────────────────────────
  fire('rfth_round_summary', {
    round_id:          roundId,
    total_bet:         totalBet,
    total_payout:      totalPayout,
    net_result:        netResult,
    outcome,
    card_win:          cardWin,
    rank_win:          rankWin,
    color_win:         colorWin,
    river_win:         riverWin,
    kill_switch:       killSwitchActive,
  });
}
