/**
 * CENTRALIZED PAYOUT CONSTANTS — RAPID FIRE TEXAS HOLD'EM
 * =========================================================
 * MASTER ODDS UPDATE — RAPID_FIRE_CONFIG (image_826d4a.png)
 *
 * All payouts stored as RATIOS (e.g., 14.5 means 14.5:1)
 * Total return to player per unit bet = bet × (1 + ratio)
 *
 * These values are authoritative for:
 *   • Payout Engine (credit win calculation)
 *   • Table Layout (felt label text)
 *   • Game Rules / How to Play modal
 *   • Simulation Worker (2-million-hand AGLC audit)
 *
 * BETTING CONSTRAINTS (Updated 2026-05-06):
 * - 0 Card Hand bets: rank board fully locked
 * - 1 Card Hand bet: exactly 1 rank bet allowed
 * - 2 Card Hand bets: up to 2 rank bets allowed
 * - 3+ Card Hand bets: kill switch fires — all side markets locked
 * - Rank bet total cannot exceed hand bet total
 * - Color/River unlock: rank total must EXACTLY EQUAL hand total
 * - Color max = hand + rank total; River max = hand + rank + color total
 * - All Hand Rank bets are fixed-odds — no progressives
 * - One Pair isolation rule REMOVED (2026-05-06) — One Pair is a standard rank bet
 * - Minimum qualifying rank: One Pair
 * - Maximum qualifying rank: Four of a Kind (Straight Flush removed 2026-04-14)
 *
 * NOTE: Progressive jackpots removed as of 2026-04-01.
 */

// ── CARDED HANDS ──────────────────────────────────────────────
// Win condition: this hand must be the table winner (highest 7-card rank)
export const CARDED_HAND_PAYOUTS = [
  20.3,   // Hand 1:  A♦/10♥
  4.35,    // Hand 2:  K♣/K♠
  15.8,  // Hand 3:  Q♣/J♠
  9.0,   // Hand 4:  Q♠/10♠
  7.4,   // Hand 5:  J♣/9♣
  5.9,    // Hand 6:  8♦/6♦
  6.8,   // Hand 7:  7♦/7♠
  7.3,    // Hand 8:  4♥/2♥
  9.1,    // Hand 9:  3♣/3♥
  15.8,   // Hand 10: A♥/5♦
];

// ── HAND RANK PAYOUTS ─────────────────────────────────────────
// Win condition: best 7-card rank across all 10 hands equals this rank
// 6-rank model: Four of a Kind (max) → Two Pair (min). Straight Flush removed 2026-04-14.
export const HAND_RANK_PAYOUTS = {
  'Four of a Kind':  12.4,
  'Full House':      2.55,
  'Flush':           3.1,
  'Straight':        5.1,
  'Three of a Kind': 3.95,
  'Two Pair':        16.8,
  'One Pair':        35.0,
};

// ── COLOR BOARD PAYOUTS ───────────────────────────────────────
// Win condition: EXACTLY N cards of that color in the 5 community cards.
// 3R wins only when exactly 3 reds show (not 4 or 5).
// 4R wins only when exactly 4 reds show (not 5).
// 5R wins only when exactly 5 reds show (unchanged from before — was always exact).
// NOTE: 3R and 4R payouts below are PLACEHOLDER — run calibration to confirm final values.
export const COLOR_BOARD_PAYOUTS = {
  '3R': 1.87,  // PLACEHOLDER — needs recalibration (exact-3 is less frequent than >=3)
  '3B': 1.87,  // PLACEHOLDER — needs recalibration
  '4R': 5.65,  // PLACEHOLDER — needs recalibration (exact-4 is less frequent than >=4)
  '4B': 5.65,  // PLACEHOLDER — needs recalibration
  '5R': 43.0,  // unchanged — exact-5 was already the only way to hit this
  '5B': 43.0,  // unchanged
};

// ── LOW / HIGH PAYOUT ─────────────────────────────────────────
// Win condition: river card rank — LOW = 2–7, HIGH = 8–A
// Flat fallback payout (used when board state is unknown / pre-turn)
export const LOW_HIGH_PAYOUT = 0.904;

// ── RIVER STATE PAYOUTS ───────────────────────────────────────
// Dynamic river payouts based on the exact 4-card turn board state.
// The bet unlocks after the turn — all 4 community cards are visible.
//
// Deck composition: 32 cards — exactly 16 LOW (2–7) and 16 HIGH (8–A).
// After seeing 4 community cards, 28 cards remain.
//
// Board state key: '<lowCount>L<highCount>H'
//   e.g. '2L2H' = 2 low + 2 high showing after the turn
//
// Theoretical probabilities (32-card deck, exact):
//   2L2H → LOW: 14/28 = 50.00%  HIGH: 14/28 = 50.00%
//   3L1H → LOW: 13/28 = 46.43%  HIGH: 15/28 = 53.57%
//   3H1L → LOW: 15/28 = 53.57%  HIGH: 13/28 = 46.43%  (mirror of 3L1H)
//   4L0H → LOW: 12/28 = 42.86%  HIGH: 16/28 = 57.14%
//   4H0L → LOW: 16/28 = 57.14%  HIGH: 12/28 = 42.86%  (mirror of 4L0H)
//
// NOTE: All values below are PLACEHOLDER (0.904) pending calibration.
// After running the lhState audit tests, replace with calibrated values.
export const RIVER_STATE_PAYOUTS = {
  '2L2H': { LOW: 0.904, HIGH: 0.904 }, // balanced — symmetric
  '3L1H': { LOW: 1.06, HIGH: 0.79 }, // HIGH more likely — PLACEHOLDER
  '3H1L': { LOW: 0.79, HIGH: 1.06 }, // LOW more likely  — PLACEHOLDER
  '4L0H': { LOW: 1.23, HIGH: 0.68 }, // HIGH strongly favoured — PLACEHOLDER
  '4H0L': { LOW: 0.68, HIGH: 1.23 }, // LOW strongly favoured  — PLACEHOLDER
};

/**
 * Get the river payout for a given board state and direction.
 * Falls back to LOW_HIGH_PAYOUT if the state is not found.
 * @param {string} boardState — e.g. '3L1H'
 * @param {'LOW'|'HIGH'} direction
 * @returns {number} payout ratio
 */
export function getRiverPayout(boardState, direction) {
  const state = RIVER_STATE_PAYOUTS[boardState];
  if (state && direction in state) return state[direction];
  return LOW_HIGH_PAYOUT;
}

/**
 * Compute the turn board state key from 4 community cards.
 * Each card is an encoded integer: rank = card >> 2, suit bits determine color.
 * Low = rank index 0–5 (2,3,4,5,6,7), High = rank index 6–12 (8,9,10,J,Q,K,A)
 * @param {number[]} turnCards — array of 4 encoded card integers
 * @returns {string} board state key e.g. '3L1H'
 */
export function getTurnBoardState(turnCards) {
  let low = 0;
  for (const c of turnCards) {
    if ((c >> 2) <= 5) low++;
  }
  const high = 4 - low;
  return `${low}L${high}H`;
}

/**
 * Calculate total payout from bet and ratio
 * Returns: total amount returned to player (including original stake)
 */
export function calculatePayout(bet, ratio) {
  if (ratio === null || ratio === undefined) return 0;
  return bet * (1 + ratio);
}

/**
 * Verify all payout constants are valid numbers
 */
export function validateAllPayouts() {
  const errors = [];

  CARDED_HAND_PAYOUTS.forEach((payout, idx) => {
    if (typeof payout !== 'number' || payout < 0) {
      errors.push(`Hand ${idx + 1} has invalid payout: ${payout}`);
    }
  });

  Object.entries(HAND_RANK_PAYOUTS).forEach(([rank, payout]) => {
    if (typeof payout !== 'number' || payout < 0) {
      errors.push(`Rank "${rank}" has invalid payout: ${payout}`);
    }
  });

  Object.entries(COLOR_BOARD_PAYOUTS).forEach(([key, payout]) => {
    if (typeof payout !== 'number' || payout < 0) {
      errors.push(`Color "${key}" has invalid payout: ${payout}`);
    }
  });

  if (typeof LOW_HIGH_PAYOUT !== 'number' || LOW_HIGH_PAYOUT < 0) {
    errors.push(`Low/High has invalid payout: ${LOW_HIGH_PAYOUT}`);
  }

  if (errors.length > 0) {
    throw new Error(`Payout validation failed:\n${errors.join('\n')}`);
  }
}

validateAllPayouts();
