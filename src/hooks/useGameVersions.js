import { useState, useEffect } from 'react';

export const VERSIONS_STORAGE_KEY = 'rapidFireGameVersions';

export const DEFAULT_VERSIONS = {
  maxCardHands: 1,
  rankUnlockThreshold: 1,   // Rank available when hands selected <= this
  rankLockThreshold: 2,     // Rank locks when hands selected >= this
  rankScaling: false,       // false = fixed cap, true = per-hand ratio
  rankFixedCap: 1,          // total rank slots allowed (scaling OFF)
  rankPerHand: 1,           // rank slots per hand selected (scaling ON)
  colorBothSides: false,    // false = Red OR Black only, true = both allowed
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
