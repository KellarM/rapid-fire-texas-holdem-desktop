import { useState, useEffect } from 'react';

export const VERSIONS_STORAGE_KEY = 'rapidFireGameVersions';

export const DEFAULT_VERSIONS = {
  maxCardHands: 4,          // Max card hands a player can select per round
  rankCombinedMax: 3,       // Max combined (hands + ranks). e.g. 3 = 1h+2r or 2h+1r
  rankLockThreshold: 3,     // Rank locks entirely when hands selected >= this
  colorBothSides: false,    // false = Red OR Black only, true = both allowed
};

export function useGameVersions() {
  const [versions, setVersions] = useState(() => {
    try {
      const saved = localStorage.getItem(VERSIONS_STORAGE_KEY);
      // Merge with defaults so old saved configs get new keys
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
