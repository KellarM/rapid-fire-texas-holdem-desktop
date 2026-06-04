import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { VERSIONS_STORAGE_KEY, DEFAULT_VERSIONS, saveVersionsToDB, loadVersionsFromDB } from '@/hooks/useGameVersions';
import { useConfigAuditLog } from '@/hooks/useConfigAuditLog';

function NumInput({ value, onChange, min = 1, max = 10 }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
      className="w-14 text-center text-sm font-bold rounded-lg border border-yellow-700/50 bg-black/50 text-yellow-300 py-1.5 focus:outline-none focus:border-yellow-400 transition-colors"
    />
  );
}

function Toggle({ value, onChange, labelOn = 'ON', labelOff = 'OFF' }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all \${
        value
          ? 'border-green-500 bg-green-900/40 text-green-300'
          : 'border-gray-600 bg-gray-800/40 text-gray-400'
      }`}
    >
      <span className={`w-2 h-2 rounded-full \${value ? 'bg-green-400' : 'bg-gray-600'}`} />
      {value ? labelOn : labelOff}
    </button>
  );
}

function Row({ step, label, description, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full border border-yellow-700/50 bg-yellow-900/20 flex items-center justify-center mt-0.5">
        <span className="text-yellow-400 text-[10px] font-bold">{step}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold">{label}</div>
        <p className="text-gray-500 text-[11px] mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
    </div>
  );
}

export default function GameVersionsModal({ isOpen, onClose }) {
  const [v, setV]           = useState({ ...DEFAULT_VERSIONS });
  const [recordId, setRecordId] = useState(null);

  // Phase 4 GLI-19: config audit log
  // configAtOpen captures the config that was active when the modal opened
  // so we can diff it against what the operator saves.
  const configAtOpen = useState(null);
  const configAtOpenRef = { current: null };

  // Get device/session id from localStorage (set by usePlayerSession)
  const deviceId  = (() => { try { return localStorage.getItem('rfth_device_id')  || 'unknown'; } catch { return 'unknown'; } })();
  const sessionId = (() => { try { return localStorage.getItem('rfth_session_id') || 'unknown'; } catch { return 'unknown'; } })();
  const { logConfigChange } = useConfigAuditLog({ deviceId, sessionId });

  useEffect(() => {
    if (isOpen) {
      loadVersionsFromDB().then(({ config, recordId: rid }) => {
        setV(config);
        setRecordId(rid);
        // Phase 4: snapshot the config at the moment operator opened the modal
        configAtOpenRef.current = { ...config };
      });
    }
  }, [isOpen]);

  const set = (key, val) => setV(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    const newId = await saveVersionsToDB(v, recordId);
    if (newId && newId !== recordId) setRecordId(newId);
    // Phase 4 GLI-19: log config change
    logConfigChange(configAtOpenRef.current || {}, v, 'save');
    window.dispatchEvent(new CustomEvent('gameVersions:updated', { detail: v }));
    onClose();
  };

  const handleReset = async () => {
    const prevConfig = { ...v }; // capture current values before reset
    await saveVersionsToDB({ ...DEFAULT_VERSIONS }, recordId);
    setV({ ...DEFAULT_VERSIONS });
    // Phase 4 GLI-19: log reset to defaults
    logConfigChange(prevConfig, { ...DEFAULT_VERSIONS }, 'reset');
    window.dispatchEvent(new CustomEvent('gameVersions:updated', { detail: { ...DEFAULT_VERSIONS } }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md rounded-2xl border border-yellow-700/50 shadow-2xl shadow-black/80 overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #1a1205 100%)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-yellow-700/30"
                style={{ background: 'rgba(0,0,0,0.4)' }}>
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-300 font-black text-base tracking-wide"
                    style={{ fontFamily: 'Oswald, sans-serif' }}>
                    VERSIONS
                  </span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>

                {/* SECTION: Card Hand Rules */}
                <div>
                  <p className="text-yellow-400/50 text-[10px] font-bold uppercase tracking-widest mb-3">Card Hand Rules</p>
                  <div className="space-y-4">
                    <Row step="1" label="How many card hands allowed to bet on"
                      description="Maximum number of card hands a player can select per round. Once this limit is reached, all remaining hands lock automatically.">
                      <NumInput value={v.maxCardHands} onChange={val => set('maxCardHands', val)} min={1} max={10} />
                      <span className="text-gray-500 text-xs">hands</span>
                    </Row>

                    <Row step="2" label="How many card hands before rank is locked"
                      description={`If a player selects \${v.rankLockThreshold} or more card hand\${v.rankLockThreshold !== 1 ? 's' : ''}, the Rank board locks and rank bets are unavailable.`}>
                      <NumInput value={v.rankLockThreshold} onChange={val => set('rankLockThreshold', val)} min={1} max={10} />
                      <span className="text-gray-500 text-xs">hands</span>
                    </Row>
                  </div>
                </div>

                <div className="border-t border-yellow-700/20" />

                {/* SECTION: Rank Bet Rules */}
                <div>
                  <p className="text-yellow-400/50 text-[10px] font-bold uppercase tracking-widest mb-3">Rank Bet Rules</p>
                  <div className="space-y-4">
                    <Row step="3" label="How many ranks allowed to bet on"
                      description="Maximum number of rank positions a player can bet on per round.">
                      <NumInput value={v.maxRankSlots} onChange={val => set('maxRankSlots', val)} min={1} max={9} />
                      <span className="text-gray-500 text-xs">ranks</span>
                    </Row>
                  </div>
                </div>

                <div className="border-t border-yellow-700/20" />

                {/* SECTION: Color Bet Rules */}
                <div>
                  <p className="text-yellow-400/50 text-[10px] font-bold uppercase tracking-widest mb-3">Color Bet Rules</p>
                  <div className="space-y-3">
                    <Row step="5" label="Allow betting both Red & Black"
                      description={v.colorBothSides
                        ? 'Player can bet Red AND Black simultaneously.'
                        : 'Player can only bet one side — Red OR Black, not both.'}>
                      <Toggle
                        value={v.colorBothSides}
                        onChange={val => set('colorBothSides', val)}
                        labelOn="BOTH"
                        labelOff="ONE SIDE"
                      />
                    </Row>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-yellow-700/30"
                style={{ background: 'rgba(0,0,0,0.3)' }}>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700/60 bg-gray-800/40 text-gray-400 text-xs font-semibold hover:bg-gray-700/40 hover:text-white transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Defaults
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg border border-gray-700/60 bg-gray-800/40 text-gray-400 text-xs font-semibold hover:bg-gray-700/40 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 rounded-lg border border-yellow-600 bg-yellow-700/30 text-yellow-300 text-xs font-bold hover:bg-yellow-700/50 hover:text-white transition-all"
                  >
                    Save Versions
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
