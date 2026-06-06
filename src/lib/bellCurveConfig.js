/**
 * BELL CURVE PAYOUT REDUCTION CONFIG — RAPID FIRE TEXAS HOLD'EM
 * ==============================================================
 * Controls the payout reduction multiplier applied when a player
 * bets on multiple hands simultaneously.
 *
 * HAND BET REDUCTIONS — indexed by number of hands bet (1–10)
 * RANK BET REDUCTIONS — indexed by number of rank positions bet (1–7)
 *
 * Values are REDUCTION PERCENTAGES (0–100).
 * e.g. 25 means payouts are reduced by 25% (player receives 75% of normal payout)
 *
 * Bell Curve Design Intent:
 * - 1–2 hands: no reduction (casual players unaffected)
 * - 5–6 hands: peak reduction (exploit zone crushed)
 * - 7–10 hands: reduction decreases (player naturally losing by spreading thin)
 * - 10 hands: minimal reduction (house wins by volume — encourage max table action)
 */

// ── HAND BET BELL CURVE ───────────────────────────────────────
// Index 0 = 1 hand bet, Index 9 = 10 hands bet
export const HAND_BET_REDUCTIONS = [
  0,    // 1 hand  — full payout
  0,    // 2 hands — full payout
  8,    // 3 hands — 8% reduction
  15,   // 4 hands — 15% reduction
  25,   // 5 hands — 25% reduction (PEAK — exploit zone)
  20,   // 6 hands — 20% reduction
  15,   // 7 hands — 15% reduction (bell curve descends)
  10,   // 8 hands — 10% reduction
  8,    // 9 hands — 8% reduction
  5,    // 10 hands — 5% reduction (encourage full table action)
];

// ── RANK BET BELL CURVE ───────────────────────────────────────
// Index 0 = 1 rank position bet, Index 6 = 7 rank positions bet
// Rank odds are tighter so curve starts slightly steeper from position 2
export const RANK_BET_REDUCTIONS = [
  0,    // 1 rank  — full payout
  10,   // 2 ranks — 10% reduction (steeper start for rank bets)
  18,   // 3 ranks — 18% reduction
  25,   // 4 ranks — 25% reduction (PEAK)
  20,   // 5 ranks — 20% reduction
  12,   // 6 ranks — 12% reduction
  5,    // 7 ranks — 5% reduction (spreading across all ranks — house wins naturally)
];

/**
 * Apply bell curve reduction to a payout ratio.
 * @param {number} ratio        — original payout ratio (e.g. 20.3)
 * @param {number} handsCount   — number of hands currently bet (1–10)
 * @param {'hand'|'rank'} type  — which bell curve to apply
 * @returns {number}            — adjusted payout ratio
 */
export function applyBellCurve(ratio, count, type = 'hand') {
  const reductions = type === 'rank' ? RANK_BET_REDUCTIONS : HAND_BET_REDUCTIONS;
  const index = Math.min(Math.max((count || 1) - 1, 0), reductions.length - 1);
  const reductionPct = reductions[index];
  return ratio * (1 - reductionPct / 100);
}

/**
 * Get the reduction percentage for display purposes.
 * @param {number} count — number of hands/ranks bet
 * @param {'hand'|'rank'} type
 * @returns {number} reduction percentage (0–100)
 */
export function getBellCurveReduction(count, type = 'hand') {
  const reductions = type === 'rank' ? RANK_BET_REDUCTIONS : HAND_BET_REDUCTIONS;
  const index = Math.min(Math.max((count || 1) - 1, 0), reductions.length - 1);
  return reductions[index];
}
