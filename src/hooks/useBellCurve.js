import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { HAND_BET_REDUCTIONS, RANK_BET_REDUCTIONS } from '@/lib/bellCurveConfig';

export const BELL_CURVE_STORAGE_KEY = 'rapidfire_bell_curve_config';

export const DEFAULT_BELL_CURVE = {
  handReductions: HAND_BET_REDUCTIONS,
  rankReductions: RANK_BET_REDUCTIONS,
};

function readLocal() {
  try {
    const saved = localStorage.getItem(BELL_CURVE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        handReductions: parsed.handReductions || HAND_BET_REDUCTIONS,
        rankReductions: parsed.rankReductions || RANK_BET_REDUCTIONS,
      };
    }
  } catch {}
  return null;
}

function writeLocal(config) {
  try {
    localStorage.setItem(BELL_CURVE_STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export async function loadBellCurveFromDB() {
  try {
    const records = await base44.entities.BellCurveConfig.filter({ config_key: 'default' });
    if (records && records.length > 0) {
      const sorted = records.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
      const rec = sorted[0];
      const config = {
        handReductions: rec.handReductions || HAND_BET_REDUCTIONS,
        rankReductions: rec.rankReductions || RANK_BET_REDUCTIONS,
      };
      writeLocal(config);
      return { config, recordId: rec.id };
    }
  } catch (e) {
    console.error('[BellCurve] DB load failed, using localStorage fallback:', e);
  }
  return { config: readLocal() || { ...DEFAULT_BELL_CURVE }, recordId: null };
}

export async function saveBellCurveToDB(config, recordId) {
  writeLocal(config);
  try {
    let rid = recordId;
    if (!rid) {
      const existing = await base44.entities.BellCurveConfig.filter({ config_key: 'default' });
      if (existing && existing.length > 0) {
        const sorted = existing.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
        rid = sorted[0].id;
      }
    }
    if (rid) {
      await base44.entities.BellCurveConfig.update(rid, {
        handReductions: config.handReductions,
        rankReductions: config.rankReductions,
      });
      return rid;
    } else {
      const rec = await base44.entities.BellCurveConfig.create({
        config_key: 'default',
        handReductions: config.handReductions,
        rankReductions: config.rankReductions,
      });
      return rec.id;
    }
  } catch (e) {
    console.error('[BellCurve] DB save failed — settings will NOT persist across devices:', e);
  }
  return recordId;
}

export function useBellCurve() {
  const [bellCurve, setBellCurve] = useState(() => readLocal() || { ...DEFAULT_BELL_CURVE });
  const [recordId, setRecordId] = useState(null);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    loadBellCurveFromDB().then(({ config, recordId: rid }) => {
      setBellCurve(config);
      setRecordId(rid);
      setDbLoaded(true);
      writeLocal(config);
      window.dispatchEvent(new CustomEvent('bellCurve:updated', { detail: config }));
    });
  }, []);

  useEffect(() => {
    function handleUpdate(e) {
      if (e.detail) setBellCurve(e.detail);
    }
    window.addEventListener('bellCurve:updated', handleUpdate);
    return () => window.removeEventListener('bellCurve:updated', handleUpdate);
  }, []);

  return { bellCurve, recordId, dbLoaded };
}