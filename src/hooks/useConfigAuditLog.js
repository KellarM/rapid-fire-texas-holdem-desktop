/**
 * useConfigAuditLog — GLI-19 Phase 4: Tamper-evident configuration change log.
 *
 * GLI requirement:
 *   Every change to game configuration parameters must be recorded with:
 *   - Timestamp of the change
 *   - Previous values
 *   - New values
 *   - A field-level diff showing exactly what changed
 *   - Device identifier
 *   - Session identifier
 *   - Change type (operator save vs. reset to defaults)
 *
 * Records are NEVER deleted or updated after creation — append-only audit trail.
 * Writes are fire-and-forget with silent retry. Never blocks the UI.
 */

import { useCallback } from 'react';
import { ConfigAuditLog } from '@/api/entities';

/**
 * Produces a field-level diff object.
 * Returns only the fields that changed, with { from, to } pairs.
 * e.g. { maxCardHands: { from: 1, to: 2 }, colorBothSides: { from: false, to: true } }
 */
function buildDiff(prev, next) {
  const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
  const diff = {};
  for (const key of allKeys) {
    const oldVal = (prev || {})[key];
    const newVal = (next || {})[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { from: oldVal ?? null, to: newVal ?? null };
    }
  }
  return diff;
}

async function writeLogRecord(payload, attempt = 1) {
  try {
    await ConfigAuditLog.create(payload);
    console.log('[ConfigAuditLog] Written:', payload.change_type, payload.diff);
  } catch (e) {
    console.error(`[ConfigAuditLog] Write failed (attempt ${attempt}):`, e);
    if (attempt < 3) {
      setTimeout(() => writeLogRecord(payload, attempt + 1), 3000 * attempt);
    }
  }
}

export function useConfigAuditLog({ deviceId, sessionId }) {
  /**
   * logConfigChange — call this after every Versions save or reset.
   *
   * @param {Object} previousConfig - Config values BEFORE the change
   * @param {Object} newConfig      - Config values AFTER the change
   * @param {'save'|'reset'} changeType
   */
  const logConfigChange = useCallback((previousConfig, newConfig, changeType = 'save') => {
    const diff = buildDiff(previousConfig, newConfig);

    // If nothing actually changed, skip writing (e.g. user clicked Save without editing)
    if (Object.keys(diff).length === 0) {
      console.log('[ConfigAuditLog] No changes detected — skipping write');
      return;
    }

    const payload = {
      changed_at:      new Date().toISOString(),
      change_type:     changeType,
      previous_config: previousConfig ?? {},
      new_config:      newConfig ?? {},
      diff,
      device_id:       deviceId || 'unknown',
      session_id:      sessionId || 'unknown',
    };

    // Fire and forget — never blocks UI
    writeLogRecord(payload);
  }, [deviceId, sessionId]);

  return { logConfigChange };
}
