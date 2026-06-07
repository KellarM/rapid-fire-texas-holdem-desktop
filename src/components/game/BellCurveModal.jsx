import { useState } from 'react';
import { X, TrendingUp, BarChart2, RotateCcw } from 'lucide-react';
import { saveBellCurveToDB } from '@/hooks/useBellCurve';

// Default values matching bellCurveConfig.js
const DEFAULT_HAND_REDUCTIONS = [0, 0, 8, 15, 25, 20, 15, 10, 8, 5];
const DEFAULT_RANK_REDUCTIONS = [0, 10, 18, 25, 20, 12, 5];

const HAND_LABELS = ['1 Hand','2 Hands','3 Hands','4 Hands','5 Hands','6 Hands','7 Hands','8 Hands','9 Hands','10 Hands'];
const RANK_LABELS = ['1 Rank','2 Ranks','3 Ranks','4 Ranks','5 Ranks','6 Ranks','7 Ranks'];

const EXPLOIT_ZONE_HAND = [4, 5]; // index 4=5hands, 5=6hands
const EXPLOIT_ZONE_RANK = [3, 4]; // index 3=4ranks, 4=5ranks

export default function BellCurveModal({ onClose, onSave, recordId: initialRecordId }) {
  function loadSavedConfig() {
    try {
      const saved = localStorage.getItem('rapidfire_bell_curve_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          hand: parsed.handReductions || DEFAULT_HAND_REDUCTIONS,
          rank: parsed.rankReductions || DEFAULT_RANK_REDUCTIONS,
        };
      }
    } catch {}
    return { hand: DEFAULT_HAND_REDUCTIONS, rank: DEFAULT_RANK_REDUCTIONS };
  }

  const savedConfig = loadSavedConfig();
  const [handReductions, setHandReductions] = useState([...savedConfig.hand]);
  const [rankReductions, setRankReductions] = useState([...savedConfig.rank]);
  const [activeTab, setActiveTab] = useState('hand');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateHand(index, value) {
    const clamped = Math.min(100, Math.max(0, Number(value) || 0));
    setHandReductions(prev => {
      const next = [...prev];
      next[index] = clamped;
      return next;
    });
    setSaved(false);
  }

  function updateRank(index, value) {
    const clamped = Math.min(100, Math.max(0, Number(value) || 0));
    setRankReductions(prev => {
      const next = [...prev];
      next[index] = clamped;
      return next;
    });
    setSaved(false);
  }

  function handleReset() {
    setHandReductions([...DEFAULT_HAND_REDUCTIONS]);
    setRankReductions([...DEFAULT_RANK_REDUCTIONS]);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const config = { handReductions, rankReductions };
    await saveBellCurveToDB(config, initialRecordId);
    window.dispatchEvent(new CustomEvent('bellCurve:updated', { detail: config }));
    onSave?.(config);
    setSaved(true);
    setSaving(false);
  }

  const reductions = activeTab === 'hand' ? handReductions : rankReductions;
  const labels = activeTab === 'hand' ? HAND_LABELS : RANK_LABELS;
  const exploitZone = activeTab === 'hand' ? EXPLOIT_ZONE_HAND : EXPLOIT_ZONE_RANK;
  const updateFn = activeTab === 'hand' ? updateHand : updateRank;
  const maxVal = Math.max(...reductions, 1);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-yellow-700/40 rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-yellow-700/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <h2 className="text-yellow-300 font-bold text-base tracking-wide">Bell Curve Config</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-yellow-700/20">
          <button
            onClick={() => setActiveTab('hand')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors
              ${activeTab === 'hand'
                ? 'text-yellow-300 border-b-2 border-yellow-400 bg-yellow-900/10'
                : 'text-gray-500 hover:text-gray-300'}`}
          >
            <BarChart2 className="w-4 h-4" />
            Hand Bets (10 Hands)
          </button>
          <button
            onClick={() => setActiveTab('rank')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors
              ${activeTab === 'rank'
                ? 'text-yellow-300 border-b-2 border-yellow-400 bg-yellow-900/10'
                : 'text-gray-500 hover:text-gray-300'}`}
          >
            <TrendingUp className="w-4 h-4" />
            Rank Bets (7 Positions)
          </button>
        </div>

        {/* Description */}
        <div className="px-5 py-3 bg-slate-800/40 border-b border-yellow-700/10">
          <p className="text-xs text-gray-400">
            {activeTab === 'hand'
              ? 'Payout reduction applied when player bets multiple hands simultaneously. Peak penalty at 5–6 hands crushes the exploit zone.'
              : 'Payout reduction applied when player bets multiple rank positions. Steeper curve from position 2 due to tighter rank odds.'}
          </p>
        </div>

        {/* Bell Curve Visual Bar Chart */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-end gap-1.5 h-16">
            {reductions.map((val, i) => {
              const isExploit = exploitZone.includes(i);
              const height = maxVal > 0 ? Math.max((val / maxVal) * 100, 2) : 2;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isExploit ? 'bg-red-500/70' : val === 0 ? 'bg-green-500/50' : 'bg-yellow-500/60'
                    }`}
                    style={{ height: `${height}%`, minHeight: '3px' }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5 mt-1">
            {labels.map((l, i) => (
              <div key={i} className="flex-1 text-center text-[8px] text-gray-600 truncate">{i + 1}</div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-red-500/70" /><span className="text-[10px] text-gray-500">Exploit Zone</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-yellow-500/60" /><span className="text-[10px] text-gray-500">Reduced</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-green-500/50" /><span className="text-[10px] text-gray-500">Full Payout</span></div>
          </div>
        </div>

        {/* Input Grid */}
        <div className="px-5 py-3 grid grid-cols-2 gap-2">
          {labels.map((label, i) => {
            const isExploit = exploitZone.includes(i);
            const val = reductions[i];
            return (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors
                  ${isExploit
                    ? 'border-red-600/40 bg-red-900/10'
                    : val === 0
                    ? 'border-green-600/30 bg-green-900/10'
                    : 'border-yellow-700/20 bg-slate-800/40'}`}
              >
                <div>
                  <p className={`text-xs font-semibold ${isExploit ? 'text-red-300' : val === 0 ? 'text-green-300' : 'text-gray-300'}`}>
                    {label}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {val === 0 ? 'Full payout' : `${100 - val}% of payout`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={val}
                    onChange={e => updateFn(i, e.target.value)}
                    className={`w-14 text-center text-sm font-bold rounded-lg border bg-slate-900 px-2 py-1 focus:outline-none focus:ring-1
                      ${isExploit
                        ? 'border-red-600/50 text-red-300 focus:ring-red-500'
                        : val === 0
                        ? 'border-green-600/40 text-green-300 focus:ring-green-500'
                        : 'border-yellow-700/40 text-yellow-300 focus:ring-yellow-500'}`}
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-yellow-700/20 gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-600/40 text-gray-400 hover:text-gray-200 hover:border-gray-500 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
              ${saved
                ? 'bg-green-700/60 border border-green-600/40 text-green-200'
                : 'bg-yellow-700/40 border border-yellow-600/40 text-yellow-200 hover:bg-yellow-700/60'}`}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved to Game Engine' : 'Save Configuration'}
          </button>
        </div>

      </div>
    </div>
  );
}