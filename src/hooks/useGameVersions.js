import { useState, useEffect } from 'react';

export const VERSIONS_STORAGE_KEY = 'rapidFireGameVersions';

export const DEFAULT_VERSIONS = {
  maxCardHands: 1,        // Max card hands a player can bet on
  maxRankSlots: 1,        // Max rank slots a player can bet on
  rankLockThreshold: 1,   // Rank locks when hands selected >= this
  handLockThreshold: 1,   // Remaining hands lock when hands selected >= this
  colorBothSides: false,  // false = Red OR Black only, true = both allowed
};

export function useGameVersions() {
  const [versions, setVersions] = useState(() => {
    try {
      const saved = localStorage.getItem(VERSIONS_STORAGE_KEY);
      return saved ? { ...DEFAULT_VERSIONS, ...JSON.parse(saved) } : DEFAULT_VERSIONS;
    } catch {
      return DEFAULT_VERSIONS;
    }
  });

  useEffect(() => {
    function handleUpdate(e) {
      if (e.detail) setVersions({ ...DEFAULT_VERSIONS, ...e.detail });
    }
    window.addEventListener('gameVersions:updated', handleUpdate);
    return () => window.removeEventListener('gameVersions:updated', handleUpdate);
  }, []);

  return { versions };
}
