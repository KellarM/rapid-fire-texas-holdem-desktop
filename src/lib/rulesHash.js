import { VERSIONS_STORAGE_KEY, DEFAULT_VERSIONS } from '@/hooks/useGameVersions';
import {
  CARDED_HAND_PAYOUTS,
  HAND_RANK_PAYOUTS,
  COLOR_BOARD_PAYOUTS,
  LOW_HIGH_PAYOUT,
  RIVER_STATE_PAYOUTS,
} from '@/lib/payoutConstants';

export const RULES_HASH_KEY = 'rfth_last_rules_hash';

/**
 * Build a deterministic string that captures every rule that affects
 * how the game is played or what it pays. If ANY of these values change
 * the hash changes and the player sees the "rules updated" warning.
 */
export function buildRulesHash() {
  const v = (() => {
    try {
      const saved = localStorage.getItem(VERSIONS_STORAGE_KEY);
      return saved ? { ...DEFAULT_VERSIONS, ...JSON.parse(saved) } : { ...DEFAULT_VERSIONS };
    } catch {
      return { ...DEFAULT_VERSIONS };
    }
  })();

  const parts = [
    // Versions config
    `h${v.maxCardHands}`,
    `r${v.maxRankSlots}`,
    `rl${v.rankLockThreshold}`,
    `hl${v.handLockThreshold}`,
    `c${v.colorBothSides ? 1 : 0}`,
    // Hand payouts
    'HP:' + CARDED_HAND_PAYOUTS.join(','),
    // Rank payouts
    'RP:' + Object.values(HAND_RANK_PAYOUTS).join(','),
    // Color payouts
    'CP:' + Object.values(COLOR_BOARD_PAYOUTS).join(','),
    // River payouts
    'LH:' + LOW_HIGH_PAYOUT,
    'RS:' + Object.values(RIVER_STATE_PAYOUTS).map(o => `${o.LOW}/${o.HIGH}`).join(','),
  ];

  return parts.join('|');
}

/** Returns true if the rules have changed since the player last saw them */
export function rulesHaveChanged() {
  try {
    const current = buildRulesHash();
    const last    = localStorage.getItem(RULES_HASH_KEY);
    return last !== current;          // null (first visit) also triggers warning
  } catch {
    return false;
  }
}

/** Call this after the player dismisses / skips the overlay */
export function markRulesSeen() {
  try {
    localStorage.setItem(RULES_HASH_KEY, buildRulesHash());
  } catch {}
}
