import { useState, useEffect } from 'react';
import { X, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CARDED_HAND_PAYOUTS, COLOR_BOARD_PAYOUTS, LOW_HIGH_PAYOUT, RIVER_STATE_PAYOUTS } from '@/lib/payoutConstants';
import { VERSIONS_STORAGE_KEY, DEFAULT_VERSIONS } from '@/hooks/useGameVersions';

const FIXED_HANDS = [
  { id: 1,  label: 'A\u2666 / 10\u2665', payout: CARDED_HAND_PAYOUTS[0] },
  { id: 2,  label: 'K\u2663 / K\u2660',  payout: CARDED_HAND_PAYOUTS[1] },
  { id: 3,  label: 'Q\u2663 / J\u2660',  payout: CARDED_HAND_PAYOUTS[2] },
  { id: 4,  label: 'Q\u2660 / 10\u2660', payout: CARDED_HAND_PAYOUTS[3] },
  { id: 5,  label: 'J\u2663 / 9\u2663',  payout: CARDED_HAND_PAYOUTS[4] },
  { id: 6,  label: '8\u2666 / 6\u2666',  payout: CARDED_HAND_PAYOUTS[5] },
  { id: 7,  label: '7\u2666 / 7\u2660',  payout: CARDED_HAND_PAYOUTS[6] },
  { id: 8,  label: '4\u2665 / 2\u2665',  payout: CARDED_HAND_PAYOUTS[7] },
  { id: 9,  label: '3\u2663 / 3\u2665',  payout: CARDED_HAND_PAYOUTS[8] },
  { id: 10, label: 'A\u2665 / 5\u2666',  payout: CARDED_HAND_PAYOUTS[9] },
];

const RANK_BETS = [
  { name: 'Four of a Kind',  note: 'Odds vary by card hand', color: 'text-yellow-300' },
  { name: 'Full House',      note: 'Odds vary by card hand', color: 'text-green-300' },
  { name: 'Flush',           note: 'Odds vary by card hand', color: 'text-blue-300' },
  { name: 'Straight',        note: 'Odds vary by card hand', color: 'text-teal-300' },
  { name: 'Three of a Kind', note: 'Odds vary by card hand', color: 'text-green-300' },
  { name: 'Two Pair',        note: 'Odds vary by card hand', color: 'text-green-300' },
  { name: 'One Pair',        note: 'Odds vary by card hand', color: 'text-blue-300' },
];

const COLOR_BETS = [
  { key: '3 Red',   payout: `${COLOR_BOARD_PAYOUTS['3R']}:1` },
  { key: '4 Red',   payout: `${COLOR_BOARD_PAYOUTS['4R']}:1` },
  { key: '5 Red',   payout: `${COLOR_BOARD_PAYOUTS['5R']}:1` },
  { key: '3 Black', payout: `${COLOR_BOARD_PAYOUTS['3B']}:1` },
  { key: '4 Black', payout: `${COLOR_BOARD_PAYOUTS['4B']}:1` },
  { key: '5 Black', payout: `${COLOR_BOARD_PAYOUTS['5B']}:1` },
];

function loadVersions() {
  try {
    const saved = localStorage.getItem(VERSIONS_STORAGE_KEY);
    return saved ? { ...DEFAULT_VERSIONS, ...JSON.parse(saved) } : { ...DEFAULT_VERSIONS };
  } catch {
    return { ...DEFAULT_VERSIONS };
  }
}

function plural(n, word) {
  return `${n} ${word}${n !== 1 ? 's' : ''}`;
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 bg-slate-800/80 hover:bg-slate-700/60 transition-colors"
      >
        <span className="font-bold text-yellow-400 text-sm tracking-wide uppercase">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 py-4 bg-slate-900/40 text-sm text-gray-300 space-y-2">{children}</div>}
    </div>
  );
}

function Rule({ label, children }) {
  return (
    <div className="flex gap-2">
      <span className="text-yellow-500 mt-0.5 flex-shrink-0">•</span>
      <div><span className="text-white font-semibold">{label}</span>{children && <span className="text-gray-300"> — {children}</span>}</div>
    </div>
  );
}

function VersionBadge({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 text-xs font-bold">
      {label}: <span className="text-white">{value}</span>
    </span>
  );
}

export default function GameRulesModal({ asMenuItem = false }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(DEFAULT_VERSIONS);

  // Load versions each time modal opens
  useEffect(() => {
    if (open) setV(loadVersions());
  }, [open]);

  const maxHands       = v.maxCardHands ?? 1;
  const maxRanks       = v.maxRankSlots ?? 1;
  const rankLockAt     = v.rankLockThreshold ?? 1;
  const handLockAt     = v.handLockThreshold ?? 1;
  const colorBothSides = v.colorBothSides ?? false;

  return (
    <>
      {asMenuItem ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 8,
            border: '1px solid rgba(59,130,246,0.4)',
            background: 'rgba(59,130,246,0.08)',
            color: '#93c5fd', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          📖 Game Rules
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-700/50 bg-blue-900/20 text-blue-300 text-xs font-bold hover:border-blue-500 hover:bg-blue-900/40 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Game Rules
        </button>
      )}

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-yellow-700/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-700/30 bg-gradient-to-r from-yellow-900/30 to-orange-900/20 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-xl font-black text-yellow-400" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      RAPID FIRE TEXAS HOLD'EM — GAME RULES
                    </h2>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">Everything you need to know to play</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current version config strip */}
              <div className="flex flex-wrap gap-2 px-6 py-2.5 border-b border-yellow-700/20 bg-black/30">
                <VersionBadge label="Max Hands" value={maxHands} />
                <VersionBadge label="Max Ranks" value={maxRanks} />
                <VersionBadge label="Rank Locks At" value={`${rankLockAt}+ hands`} />
                <VersionBadge label="Hand Grid Locks At" value={`${handLockAt}+ hands`} />
                <VersionBadge label="Color Rule" value={colorBothSides ? 'Red & Black' : 'One Side Only'} />
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

                <Section title="How the Game Works">
                  <Rule label="Objective">Bet on which of the 10 hands wins the round.</Rule>
                  <Rule label="Minimum Bet">$5 per betting spot.</Rule>
                  <Rule label="Hand Selection">
                    You may select up to <strong className="text-yellow-300">{plural(maxHands, 'card hand')}</strong> per round.
                    Once you have selected <strong className="text-yellow-300">{plural(handLockAt, 'hand')}</strong>, all remaining unselected hands lock automatically.
                    You may move your bet to a locked hand by dragging your chip onto it.
                  </Rule>
                  <Rule label="Maximum Bet per Hand">$500 maximum bet per individual card hand.</Rule>
                </Section>

                <Section title="Unlocking Side Bets">
                  <Rule label="Rank Board">
                    The Rank board is available as long as you have selected fewer than <strong className="text-yellow-300">{plural(rankLockAt, 'hand')}</strong>.
                    Once you select <strong className="text-red-400">{rankLockAt} or more hands</strong>, the Rank board locks and any existing rank bets are refunded.
                  </Rule>
                  <Rule label="Rank Slots">
                    You may place up to <strong className="text-yellow-300">{plural(maxRanks, 'Rank bet')}</strong> per round.
                  </Rule>
                  <Rule label="Color & River">To unlock Color and River bets, your total Rank bets must match your total Hand bets.</Rule>
                </Section>

                <Section title="Snowball Caps">
                  <p className="text-gray-400 text-xs mb-3">Your previous bets determine the ceiling for each subsequent tier.</p>
                  <Rule label="Rank total">Cannot exceed your total Hand bets. To unlock Color and River, Rank bets must exactly equal Hand bets.</Rule>
                  <Rule label="Color total">Cannot exceed Hand + Rank bets combined.</Rule>
                  <Rule label="Color side">
                    {colorBothSides
                      ? 'You may bet on both Red AND Black in the same round.'
                      : 'You may only bet on Red OR Black in a single round — betting one side locks the other for that round.'}
                  </Rule>
                  <Rule label="River total">Cannot exceed Hand + Rank + Color bets combined.</Rule>
                </Section>

                <Section title="Rank Betting — Payouts">
                  <p className="text-gray-400 text-xs mb-3">
                    Bet on what poker rank will win the round. It doesn't matter which hand wins — as long as the winning hand achieves the rank you bet.
                    Odds are tied to the actual winning hand. One Pair is the minimum qualifying rank.
                    Up to <strong className="text-yellow-300">{plural(maxRanks, 'Rank bet')}</strong> may be placed per round.
                  </p>
                  <div className="space-y-1.5">
                    {RANK_BETS.map(r => (
                      <div key={r.name} className="flex justify-between items-center bg-slate-800/60 rounded-lg px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-xs ${r.color}`}>{r.name}</span>
                          {r.note && <span className="text-gray-500 text-xs italic">{r.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Winning">
                  <Rule label="Hand bets">Pay if the hand you backed forms the highest 5-card poker rank from its 7 available cards (2 pocket + 5 community) and beats all 9 other hands.</Rule>
                  <Rule label="Rank bets">Pay if ANY hand wins the round by the rank you bet — you do not need to have bet on the winning hand. Payout odds are tied to the actual winning hand's rank table.</Rule>
                  <Rule label="Color bets">
                    Pay based on the <strong>exact</strong> number of Red or Black cards in the 5 community cards.
                    3 Red wins only when exactly 3 red cards appear. 4 Red wins only when exactly 4. 5 Red wins only when exactly 5. Same applies for Black.
                    {colorBothSides
                      ? ' Both Red and Black bets may be placed in the same round.'
                      : ' Only one color side may be bet per round — choosing Red locks Black and vice versa.'}
                  </Rule>
                  <Rule label="River (Low/High) bets">Pay based solely on the 5th community card. Low wins if the river card is 7 or below. High wins if 8 or above. Odds depend on the 4-card board state after the Turn.</Rule>
                  <Rule label="Board Win">If the community board beats all 10 player hands, all hand bets are collected. Color Board and River bets still resolve independently.</Rule>
                </Section>

                <Section title="Card Hand Payouts" defaultOpen={false}>
                  <p className="text-gray-400 text-xs mb-3">Each hand has fixed payout odds. Hands are listed from highest to lowest payout.</p>
                  <div className="space-y-1.5">
                    {FIXED_HANDS.map(h => (
                      <div key={h.id} className="flex justify-between items-center bg-slate-800/60 rounded-lg px-3 py-1.5">
                        <span className="text-white font-bold text-xs">{h.label}</span>
                        <span className="text-yellow-300 font-bold text-xs">{h.payout}:1</span>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Color Board Payouts" defaultOpen={false}>
                  <div className="space-y-1.5">
                    {COLOR_BETS.map(b => (
                      <div key={b.key} className="flex justify-between items-center bg-slate-800/60 rounded-lg px-3 py-1.5">
                        <span className="text-white font-bold text-xs">{b.key}</span>
                        <span className="text-yellow-300 font-bold text-xs">{b.payout}</span>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="River Bet Payouts" defaultOpen={false}>
                  <p className="text-gray-400 text-xs mb-3">Payouts vary based on the 4-card board state after the Turn.</p>
                  <div className="space-y-1.5">
                    {Object.entries(RIVER_STATE_PAYOUTS).map(([state, odds]) => (
                      <div key={state} className="flex justify-between items-center bg-slate-800/60 rounded-lg px-3 py-1.5">
                        <span className="text-white font-bold text-xs">{state}</span>
                        <div className="flex gap-3">
                          <span className="text-blue-300 text-xs">Low: {odds.low}:1</span>
                          <span className="text-red-300 text-xs">High: {odds.high}:1</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}