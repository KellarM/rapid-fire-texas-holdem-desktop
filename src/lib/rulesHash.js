import {
  CARDED_HAND_PAYOUTS,
  HAND_RANK_PAYOUTS,
  COLOR_BOARD_PAYOUTS,
  LOW_HIGH_PAYOUT,
  RIVER_STATE_PAYOUTS,
} from '@/lib/payoutConstants';

export const RULES_HASH_KEY = 'rfth_last_rules_hash';

/**
 * Build a deterministic string from a versions config object.
 * Pass the DB-loaded versions object — do NOT read from localStorage here.
 * This ensures every device compares against the same server-authoritative values.
 */
export function buildRulesHash(versions = {}) {
  const v = versions;

  const parts = [
    // Versions config — these come from the DB, not localStorage
    `h${v.maxCardHands  ?? 1}`,
    `r${v.maxRankSlots  ?? 1}`,
    `rl${v.rankLockThreshold ?? 1}`,
    `c${v.colorBothSides ? 1 : 0}`,
    // Payout constants (these are code-level, same on all devices)
    'HP:' + CARDED_HAND_PAYOUTS.join(','),
    'RP:' + Object.values(HAND_RANK_PAYOUTS).join(','),
    'CP:' + Object.values(COLOR_BOARD_PAYOUTS).join(','),
    'LH:' + LOW_HIGH_PAYOUT,
    'RS:' + Object.values(RIVER_STATE_PAYOUTS).map(o => `${o.LOW}/${o.HIGH}`).join(','),
  ];

  return parts.join('|');
}

/**
 * Returns true if the DB-current rules differ from what the player last acknowledged.
 * Pass the already-fetched DB versions object.
 */
export function rulesHaveChanged(versions) {
  try {
    const current = buildRulesHash(versions);
    const last    = localStorage.getItem(RULES_HASH_KEY);
    return last !== current; // null (first visit / new device) also triggers warning
  } catch {
    return false;
  }
}

/**
 * Call this after the player dismisses / skips the overlay.
 * Stamps the hash of the DB versions the player just acknowledged.
 */
export function markRulesSeen(versions) {
  try {
    localStorage.setItem(RULES_HASH_KEY, buildRulesHash(versions));
  } catch {}
}
