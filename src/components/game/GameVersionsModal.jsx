import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { VERSIONS_STORAGE_KEY, DEFAULT_VERSIONS } from '@/hooks/useGameVersions';

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

// Preview table: shows rank slots available for 1..maxCardHands
function RankPreviewTable({ maxCardHands, rankCombinedMax, rankLockThreshold }) {
  const rows = [];
  for (let h = 1; h <= Math.min(maxCardHands, 6); h++) {
    const locked = h >= rankLockThreshold;
    const slots = locked ? 0 : Math.max(0, rankCombinedMax - h);
    rows.push({ h, slots, locked });
  }
  return (
    <div className="mt-2 rounded-lg border border-yellow-700/20 overflow-hidden">
      <div className="grid grid-cols-3 text-[10px] font-bold uppercase tracking-widest text-yellow-400/50 px-3 py-1.5 border-b border-yellow-700/20">
        <span>Hands</span><span className="text-center">Rank Slots</span><span className="text-right">Status</span>
      </div>
      {rows.map(({ h, slots, locked }) => (
        <div key={h} className={`grid grid-cols-3 px-3 py-1 text-[11px] \${locked ? 'text-red-400/60' : 'text-green-300/80'}`}>
          <span>{h} hand{h > 1 ? 's' : ''}</span>
          <span className="text-center font-bold">{locked ? '—' : slots}</span>
          <span className="text-right">{locked ? '🔒 locked' : '✓ open'}</span>
        </div>
      ))}
    </div>
  );
}

export default function GameVersionsModal({ isOpen, onClose }) {
  const [v, setV] = useState(() => {
    try {
      const saved = localStorage.getItem(VERSIONS_STORAGE_KEY);
      return saved ? { ...DEFAULT_VERSIONS, ...JSON.parse(saved) } : { ...DEFAULT_VERSIONS };
    } catch {
      return { ...DEFAULT_VERSIONS };
    }
  });

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(VERSIONS_STORAGE_KEY);
        if (saved) setV({ ...DEFAULT_VERSIONS, ...JSON.parse(saved) });
        else setV({ ...DEFAULT_VERSIONS });
      } catch {}
    }
  }, [isOpen]);

  const set = (key, val) => setV(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(v));
    window.dispatchEvent(new CustomEvent('gameVersions:updated', { detail: v }));
    onClose();
  };

  const handleReset = () => {
    setV({ ...DEFAULT_VERSIONS });
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
              <div className="px-5 py-4 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>

                {/* SECTION: Card Hand Rules */}
                <div>
                  <p className="text-yellow-400/50 text-[10px] font-bold uppercase tracking-widest mb-3">Card Hand Rules</p>
                  <div className="space-y-3">
                    <Row step="1" label="Max card hands selectable"
                      description="Maximum number of hands a player can select per round.">
                      <NumInput value={v.maxCardHands} onChange={val => set('maxCardHands', val)} min={1} max={10} />
                      <span className="text-gray-500 text-xs">hands</span>
                    </Row>
                  </div>
                </div>

                <div className="border-t border-yellow-700/20" />

                {/* SECTION: Rank Bet Rules */}
                <div>
                  <p className="text-yellow-400/50 text-[10px] font-bold uppercase tracking-widest mb-3">Rank Bet Rules</p>
                  <div className="space-y-3">

                    <Row step="2" label="Max combined (hands + ranks)"
                      description="Total combined selections allowed. e.g. 3 means: 1 hand = 2 ranks, 2 hands = 1 rank.">
                      <NumInput value={v.rankCombinedMax} onChange={val => set('rankCombinedMax', val)} min={2} max={10} />
                      <span className="text-gray-500 text-xs">total</span>
                    </Row>

                    <Row step="3" label="Rank locks when hands ≥"
                      description="Rank board locks entirely once player hits this hand count (0 rank slots).">
                      <NumInput value={v.rankLockThreshold} onChange={val => set('rankLockThreshold', val)} min={1} max={10} />
                      <span className="text-gray-500 text-xs">hands</span>
                    </Row>

                    {/* Live preview table */}
                    <RankPreviewTable
                      maxCardHands={v.maxCardHands}
                      rankCombinedMax={v.rankCombinedMax}
                      rankLockThreshold={v.rankLockThreshold}
                    />

                  </div>
                </div>

                <div className="border-t border-yellow-700/20" />

                {/* SECTION: Color Bet Rules */}
                <div>
                  <p className="text-yellow-400/50 text-[10px] font-bold uppercase tracking-widest mb-3">Color Bet Rules</p>
                  <div className="space-y-3">
                    <Row step="4" label="Allow betting both Red & Black"
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
