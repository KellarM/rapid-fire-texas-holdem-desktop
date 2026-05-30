// ============================================================
// AnalyticsDashboard — Live Game Analytics Panel
// Reads GameEvent records from the Base44 backend.
// Shows rounds, bets, payouts, win rates — all real data.
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, BarChart2, RefreshCw, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const fmt = (n) => typeof n === 'number' ? n.toFixed(2) : '—';
const fmtPct = (n) => typeof n === 'number' ? (Math.min(n, 1) * 100).toFixed(1) + '%' : '—';
const fmtC = (n) => typeof n === 'number' ? (n >= 0 ? '+$' : '-$') + Math.abs(n).toFixed(0) : '—';

function StatCard({ label, value, sub, color = 'yellow' }) {
  const colors = {
    yellow: 'border-yellow-700/40 bg-yellow-900/10 text-yellow-300',
    green:  'border-green-700/40  bg-green-900/10  text-green-300',
    red:    'border-red-700/40    bg-red-900/10    text-red-300',
    blue:   'border-blue-700/40   bg-blue-900/10   text-blue-300',
    purple: 'border-purple-700/40 bg-purple-900/10 text-purple-300',
  };
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${colors[color]}`}>
      <div className="text-[10px] font-semibold tracking-wider uppercase opacity-60 mb-1">{label}</div>
      <div className="text-xl font-bold leading-none">{value}</div>
      {sub && <div className="text-[10px] opacity-50 mt-1">{sub}</div>}
    </div>
  );
}

function BarRow({ label, value, max, color = '#eab308' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[10px] text-gray-400 w-20 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-gray-300 w-8 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

export default function AnalyticsDashboard({ isOpen, onClose }) {
  const [loading, setLoading]   = useState(false);
  const [clearing, setClearing] = useState(false);
  const [stats, setStats]       = useState(null);
  const [tab, setTab]           = useState('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('gameAnalytics', { action: 'summary' });
      setStats(res?.data || null);
    } catch (e) {
      console.error('[Analytics] load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  const handleClear = async () => {
    if (!window.confirm('Clear ALL game analytics events? This cannot be undone.')) return;
    setClearing(true);
    try {
      await base44.functions.invoke('gameAnalytics', { action: 'clear' });
      setStats(null);
    } catch (e) { console.error('[Analytics] clear error', e); }
    finally { setClearing(false); }
  };

  if (!isOpen) return null;

  const s = stats;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-yellow-700/40 bg-slate-950 shadow-2xl shadow-black/80 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-yellow-700/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300 font-bold tracking-wide text-sm uppercase">Game Analytics</span>
              {s && <span className="text-[10px] text-yellow-400/50 ml-1">{s.totalRounds} rounds recorded</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} disabled={loading}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-yellow-300 hover:bg-yellow-900/20 transition-colors disabled:opacity-40">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button onClick={handleClear} disabled={clearing}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-red-300 hover:bg-red-900/20 transition-colors disabled:opacity-40">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
              <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-3 flex-shrink-0">
            {['overview', 'boards', 'hands'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors
                  ${tab === t ? 'bg-yellow-700/40 text-yellow-300 border border-yellow-600/40' : 'text-gray-500 hover:text-gray-300'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0" style={{ scrollbarWidth: 'none' }}>
            {loading && (
              <div className="flex items-center justify-center h-40">
                <div className="text-yellow-400/50 text-sm animate-pulse">Loading analytics…</div>
              </div>
            )}

            {!loading && !s && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <BarChart2 className="w-10 h-10 text-yellow-700/40" />
                <div className="text-gray-500 text-sm text-center">
                  No data yet.<br />Play some rounds and come back!
                </div>
              </div>
            )}

            {!loading && s && tab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <StatCard label="Rounds"       value={s.totalRounds}              color="yellow" />
                  <StatCard label="Total Bet"    value={`$${(s.totalBet||0).toFixed(0)}`}    color="blue"   />
                  <StatCard label="Total Payout" value={`$${(s.totalPayout||0).toFixed(0)}`} color="green"  />
                  <StatCard label="House Edge"   value={fmtPct(s.houseEdge)}        color={s.houseEdge > 0 ? 'red' : 'green'} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Avg Bet / Round"    value={`$${fmt(s.avgBet)}`}    color="blue"   />
                  <StatCard label="Avg Payout / Round" value={`$${fmt(s.avgPayout)}`} color="green"  />
                  <StatCard label="Net (Player P&L)"   value={fmtC(s.netResult)}      color={s.netResult >= 0 ? 'green' : 'red'} />
                  <StatCard label="Win Rate"           value={fmtPct(s.winRate)}      color="purple" />
                </div>

                <div className="border border-yellow-700/20 rounded-xl p-3">
                  <div className="text-yellow-400/60 text-[10px] font-semibold uppercase tracking-wider mb-2">Board Win Rates <span className="text-gray-600 normal-case font-normal">(wins / rounds where bet was placed)</span></div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[
                      { label: 'Card Board',  val: s.cardWinRate,  count: s.withCardBetCount  },
                      { label: 'Rank Board',  val: s.rankWinRate,  count: s.withRankBetCount  },
                      { label: 'Color Board', val: s.colorWinRate, count: s.withColorBetCount },
                      { label: 'River Board', val: s.riverWinRate, count: s.withRiverBetCount },
                    ].map(({ label, val, count }) => (
                      <div key={label} className="flex justify-between items-center text-xs py-1 border-b border-slate-800">
                        <span className="text-gray-400">{label}<span className="text-gray-600 ml-1">({count || 0}r)</span></span>
                        <span className={val === null ? 'text-gray-600' : val > 0.5 ? 'text-green-400' : 'text-yellow-300'}>
                          {val === null ? 'N/A' : fmtPct(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-yellow-700/20 rounded-xl p-3">
                  <div className="text-yellow-400/60 text-[10px] font-semibold uppercase tracking-wider mb-2">Side Bet Gate Closure (Kill Switch)</div>
                  <div className="flex items-center gap-4 mb-1">
                    <div>
                      <span className="text-2xl font-bold text-orange-400">{fmtPct(s.killSwitchRate)}</span>
                      <span className="text-xs text-gray-500 ml-2">of rounds where Color/River was blocked</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {s.killSwitchRate > 0.3
                        ? <><TrendingUp className="w-3 h-3 text-orange-400" /> High</>
                        : <><TrendingDown className="w-3 h-3 text-green-400" /> Normal</>}
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-600">Gate closes when Rank bet total ≠ Card bet total, locking out Color &amp; River boards.</div>
                </div>

                <div className="border border-yellow-700/20 rounded-xl p-3">
                  <div className="text-yellow-400/60 text-[10px] font-semibold uppercase tracking-wider mb-3">Betting Patterns</div>
                  {s.bettingPatterns && (() => {
                    const total = s.totalRounds;
                    const patterns = [
                      { key: 'cardsOnly',      label: 'Cards Only',                color: '#6b7280' },
                      { key: 'cardsRank',      label: 'Cards + Rank',              color: '#a78bfa' },
                      { key: 'cardsRankColor', label: 'Cards + Rank + Color',      color: '#f59e0b' },
                      { key: 'cardsRankRiver', label: 'Cards + Rank + River',      color: '#34d399' },
                      { key: 'allFour',        label: 'All 4 Boards',              color: '#f87171' },
                    ];
                    return (
                      <div className="space-y-1.5">
                        {patterns.map(({ key, label, color }) => {
                          const count = s.bettingPatterns[key] || 0;
                          const pct = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-36 flex-shrink-0">{label}</span>
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                              </div>
                              <span className="text-[10px] text-gray-300 w-12 text-right flex-shrink-0">{count} <span className="text-gray-600">({pct.toFixed(0)}%)</span></span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {!loading && s && tab === 'boards' && (
              <div className="space-y-4">
                <div className="border border-yellow-700/20 rounded-xl p-3">
                  <div className="text-yellow-400/60 text-[10px] font-semibold uppercase tracking-wider mb-3">Winning Ranks (Top Occurrences)</div>
                  {s.rankBreakdown && Object.entries(s.rankBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([rank, count]) => (
                      <BarRow key={rank} label={rank} value={count}
                        max={Math.max(...Object.values(s.rankBreakdown))}
                        color="#a78bfa" />
                    ))}
                </div>

                <div className="border border-yellow-700/20 rounded-xl p-3">
                  <div className="text-yellow-400/60 text-[10px] font-semibold uppercase tracking-wider mb-3">Color Board Results</div>
                  {s.colorBreakdown && Object.entries(s.colorBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([color, count]) => (
                      <BarRow key={color} label={color} value={count}
                        max={Math.max(...Object.values(s.colorBreakdown))}
                        color={color.includes('R') ? '#f87171' : '#60a5fa'} />
                    ))}
                </div>

                <div className="border border-yellow-700/20 rounded-xl p-3">
                  <div className="text-yellow-400/60 text-[10px] font-semibold uppercase tracking-wider mb-3">River Board (Low / High)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="LOW wins" value={s.riverBreakdown?.LOW || 0} color="green" />
                    <StatCard label="HIGH wins" value={s.riverBreakdown?.HIGH || 0} color="blue" />
                  </div>
                </div>
              </div>
            )}

            {!loading && s && tab === 'hands' && (
              <div className="space-y-4">
                <div className="border border-yellow-700/20 rounded-xl p-3">
                  <div className="text-yellow-400/60 text-[10px] font-semibold uppercase tracking-wider mb-3">Hand Win Frequency</div>
                  {s.handWinBreakdown && Object.entries(s.handWinBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([hid, count]) => (
                      <BarRow key={hid} label={`Hand ${hid}`} value={count}
                        max={Math.max(...Object.values(s.handWinBreakdown))}
                        color="#eab308" />
                    ))}
                </div>

                <div className="border border-yellow-700/20 rounded-xl p-3">
                  <div className="text-yellow-400/60 text-[10px] font-semibold uppercase tracking-wider mb-2">Most Bet Hands</div>
                  {s.handBetBreakdown && Object.entries(s.handBetBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([hid, count]) => (
                      <BarRow key={hid} label={`Hand ${hid}`} value={count}
                        max={Math.max(...Object.values(s.handBetBreakdown))}
                        color="#34d399" />
                    ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}