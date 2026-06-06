import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const DEFAULT_TIMING = {
  bettingClose: 14,
  flopReveal: 8,
  turnReveal: 2,
  riverBetting: 14,
  riverReveal: 5,
  endOfRound: 14,
};

export function useGameTiming() {
  const [timing, setTiming] = useState(DEFAULT_TIMING);
  const [recordId, setRecordId] = useState(null);
  const timerRef = useRef(null);

  // Load timing from DB on mount
  useEffect(() => {
    base44.entities.GameTiming.list().then(records => {
      if (records && records.length > 0) {
        const rec = records[0];
        setRecordId(rec.id);
        setTiming({ ...DEFAULT_TIMING, ...rec });
      }
    }).catch(() => {});
  }, []);

  // Listen for timing updates saved from GameTimingModal
  const reloadTiming = useCallback(() => {
    base44.entities.GameTiming.list().then(records => {
      if (records && records.length > 0) {
        const rec = records[0];
        setRecordId(rec.id);
        setTiming({ ...DEFAULT_TIMING, ...rec });
      }
    }).catch(() => {});
  }, []);

  const startTimer = useCallback((duration, onTick, onComplete) => {
    if (timerRef.current) clearInterval(timerRef.current);

    let remaining = duration;
    onTick(remaining);

    timerRef.current = setInterval(() => {
      remaining -= 0.1;
      onTick(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        onComplete?.();
      }
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { timing, recordId, startTimer, stopTimer, reloadTiming };
}