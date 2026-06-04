/**
 * RoundRecoveryModal — GLI-19 Phase 3
 * Shown on page load if an incomplete round is detected.
 * Player must choose: Resume or Abandon.
 */
import { motion, AnimatePresence } from 'framer-motion';

const SUITS_DISPLAY = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

function formatTime(isoString) {
  if (!isoString) return 'unknown time';
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return 'unknown time'; }
}

function BetSummaryLine({ label, bets }) {
  const entries = Object.entries(bets || {}).filter(([, v]) => v > 0);
  if (!entries.length) return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-gray-400 w-14 flex-shrink-0">{label}</span>
      <span className="text-white">
        {entries.map(([k, v]) => `${k}: $${v}`).join(' · ')}
      </span>
    </div>
  );
}

export default function RoundRecoveryModal({ isOpen, restoredState, onResume, onAbandon }) {
  if (!isOpen || !restoredState) return null;

  const {
    openedAt,
    totalWagered,
    balanceBefore,
    handBets,
    rankBets,
    colorBets,
    lowHighBet,
  } = restoredState;

  return (
    <AnimatePresence>
      {isOpen && (
        /* Backdrop */
        <motion.div
          key="recovery-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            key="recovery-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm mx-4 rounded-2xl border-2 overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #1a0a00 0%, #0d1a0d 50%, #0a0a1a 100%)',
              borderColor: '#f59e0b',
              boxShadow: '0 0 40px rgba(245,158,11,0.35), inset 0 0 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Amber header bar */}
            <div
              className="px-5 py-3 flex items-center gap-3"
              style={{ background: 'linear-gradient(90deg, #92400e, #b45309, #92400e)' }}
            >
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-white font-black text-sm tracking-wider uppercase">
                  Incomplete Round Detected
                </div>
                <div className="text-amber-200 text-xs mt-0.5">
                  Round interrupted at {formatTime(openedAt)}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                Your last round was interrupted before it completed.
                Your bets are preserved — you can resume where you left off
                or abandon the round.
              </p>

              {/* Bet snapshot */}
              <div
                className="rounded-xl border border-amber-800/40 p-3 space-y-1.5"
                style={{ background: 'rgba(245,158,11,0.06)' }}
              >
                <div className="text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                  Bets Placed
                </div>
                <BetSummaryLine label="Hands" bets={handBets} />
                <BetSummaryLine label="Rank"  bets={rankBets} />
                <BetSummaryLine label="Color" bets={colorBets} />
                {lowHighBet?.amount > 0 && (
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-gray-400 w-14 flex-shrink-0">River</span>
                    <span className="text-white">
                      {lowHighBet.type}: ${lowHighBet.amount}
                    </span>
                  </div>
                )}
                {!Object.values(handBets || {}).some(v => v > 0) &&
                 !Object.values(rankBets || {}).some(v => v > 0) &&
                 !Object.values(colorBets || {}).some(v => v > 0) &&
                 !(lowHighBet?.amount > 0) && (
                  <div className="text-gray-500 text-xs italic">No bets recorded</div>
                )}
                <div className="border-t border-amber-800/30 pt-1.5 mt-1.5 flex justify-between text-xs">
                  <span className="text-gray-400">Total wagered</span>
                  <span className="text-amber-400 font-bold">${(totalWagered || 0).toLocaleString()}</span>
                </div>
                {balanceBefore !== null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Balance before round</span>
                    <span className="text-white font-bold">${(balanceBefore || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* GLI compliance note */}
              <p className="text-gray-500 text-xs leading-relaxed">
                Per GLI-19 §7.4: all interrupted rounds are recorded and preserved.
                Abandoning this round will mark it as void in the audit log.
              </p>
            </div>

            {/* Buttons */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={onAbandon}
                className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 text-sm font-bold
                           hover:border-red-500 hover:text-red-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                Abandon Round
              </button>
              <button
                onClick={onResume}
                className="flex-2 flex-grow-[2] py-3 rounded-xl text-black font-black text-sm
                           hover:brightness-110 active:scale-95 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
                }}
              >
                ▶ Resume Round
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
