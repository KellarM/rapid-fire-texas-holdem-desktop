import { useState, useEffect } from 'react';
import { GameVersions } from '@/api/entities';

export const VERSIONS_STORAGE_KEY = 'rapidFireGameVersions';

export const DEFAULT_VERSIONS = {
  maxCardHands: 1,
  maxRankSlots: 1,
  rankLockThreshold: 1,
  colorBothSides: false,
};

function readLocal() {
  try {
    const saved = localStorage.getItem(VERSIONS_STORAGE_KEY);
    return saved ? { ...DEFAULT_VERSIONS, ...JSON.parse(saved) } : null;
  } catch {
    return null;
  }
}

function writeLocal(v) {
  try {
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(v));
  } catch {}
}

// Fetch from DB and cache locally. Returns the config object.
export async function loadVersionsFromDB() {
  try {
    const records = await GameVersions.filter({ config_key: 'default' });
    if (records && records.length > 0) {
      const rec = records[0];
      const v = {
        maxCardHands:      rec.maxCardHands      ?? DEFAULT_VERSIONS.maxCardHands,
        maxRankSlots:      rec.maxRankSlots      ?? DEFAULT_VERSIONS.maxRankSlots,
        rankLockThreshold: rec.rankLockThreshold ?? DEFAULT_VERSIONS.rankLockThreshold,
        colorBothSides:    rec.colorBothSides    ?? DEFAULT_VERSIONS.colorBothSides,
      };
      writeLocal(v);
      return { config: v, recordId: rec.id };
    }
  } catch (e) {
    console.warn('GameVersions DB load failed, using localStorage fallback:', e);
  }
  return { config: readLocal() || { ...DEFAULT_VERSIONS }, recordId: null };
}

// Save to both DB and localStorage.
export async function saveVersionsToDB(v, recordId) {
  writeLocal(v);
  try {
    if (recordId) {
      await GameVersions.update(recordId, {
        maxCardHands:      v.maxCardHands,
        maxRankSlots:      v.maxRankSlots,
        rankLockThreshold: v.rankLockThreshold,
        colorBothSides:    v.colorBothSides,
      });
    } else {
      // No record yet — create one
      const rec = await GameVersions.create({ config_key: 'default', ...v });
      return rec.id;
    }
  } catch (e) {
    console.warn('GameVersions DB save failed:', e);
  }
  return recordId;
}

export function useGameVersions() {
  const [versions,  setVersions]  = useState(() => readLocal() || { ...DEFAULT_VERSIONS });
  const [recordId,  setRecordId]  = useState(null);
  const [dbLoaded,  setDbLoaded]  = useState(false);

  // On mount: load from DB (authoritative source)
  useEffect(() => {
    loadVersionsFromDB().then(({ config, recordId: rid }) => {
      setVersions(config);
      setRecordId(rid);
      setDbLoaded(true);
      // Broadcast so any open modal syncs immediately
      window.dispatchEvent(new CustomEvent('gameVersions:updated', { detail: config }));
    });
  }, []);

  // Listen for in-session updates (from the Versions modal save)
  useEffect(() => {
    function handleUpdate(e) {
      if (e.detail) setVersions({ ...DEFAULT_VERSIONS, ...e.detail });
    }
    window.addEventListener('gameVersions:updated', handleUpdate);
    return () => window.removeEventListener('gameVersions:updated', handleUpdate);
  }, []);

  return { versions, recordId, dbLoaded };
}
