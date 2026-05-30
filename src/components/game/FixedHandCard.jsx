import { useState } from 'react';
import PlayingCard from './PlayingCard';
import { SUITS, evaluateBestHand } from '@/lib/gameEngine';
import { getCardImageUrl } from '@/lib/cardImages';
import { motion, AnimatePresence } from 'framer-motion';
import Chip from './Chip';


export default function FixedHandCard({
  hand,
  isLeading,
  isWinner,
  communityCards,
  betAmount,
  allHandBets,
  playerCount,
  activePlayerId,
  onBet,
  onRemoveBet,
  onDropChip,
  gamePhase,
  disabled,
  disabledByConstraint,
  onAttemptLockedBet
}) {
  const allBets = [];
  for (let i = 0; i < (playerCount || 1); i++) {
    const amt = (allHandBets || {})[i]?.[hand?.id] || 0;
    if (amt > 0) allBets.push({ pid: i, amt });
  }

  const [hovered, setHovered] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const canBet = gamePhase === 'betting' && !disabled && !disabledByConstraint;
  const isBettingPhase = gamePhase === 'betting';

  let currentEval = null;
  if (communityCards && communityCards.length > 0) {
    currentEval = evaluateBestHand(hand.cards, communityCards);
  }

  const cardDisplayName = hand.cards.map((c) => `${c.rank}${SUITS[c.suit]}`).join('/');

  // Border class
  // isLeading/isWinner = gold bg, black border, black text
  // All other states retain their original styling
  const isActive = isLeading || isWinner;
  let borderCls;
  if (isActive) borderCls = 'border-black shadow-black/60 shadow-xl';
  else if (disabledByConstraint) borderCls = 'slot-border-dormant bg-black/25';
  else if (dragOver && isBettingPhase) borderCls = 'slot-border-active bg-yellow-900/20';
  else if (hovered && canBet) borderCls = 'slot-border-active bg-black/30';
  else borderCls = 'slot-border-dormant bg-black/25';

  return (
    <motion.div
      style={isActive ? { background: 'linear-gradient(135deg, #b8860b 0%, #d4a017 30%, #c9900e 60%, #8B6914 100%)' } : undefined}
      className={`relative rounded-xl p-1.5 ${isActive ? 'border-[5px]' : 'border-[3px]'} cursor-pointer transition-colors duration-200 select-none flex flex-col justify-between ${borderCls}`}
      animate={isLeading && !isWinner ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, repeat: isLeading && !isWinner ? Infinity : 0, repeatDelay: 1.5 }}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        // Ignore mousedown that originates from a draggable chip — it's a drag, not a bet
        if (e.target.closest('[data-chip]')) return;
        if (isBettingPhase) {
          if (disabledByConstraint) {
            onAttemptLockedBet?.();
          } else {
            onBet(hand.id);
          }
        }
      }}
      onContextMenu={(e) => {e.preventDefault();if (isBettingPhase) onRemoveBet(hand.id);}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Drop target
      onDragOver={(e) => {if (isBettingPhase) {e.preventDefault();setDragOver(true);}}}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!isBettingPhase) return;
        const data = e.dataTransfer.getData('text/plain');
        if (!data) return;
        try {
          const parsed = JSON.parse(data);
          const { from, pid, type, amount } = parsed;
          if (type === 'hand' && from !== hand.id) {
            onDropChip(from, hand.id, pid);
          }
        } catch (e) {}
      }}>
      
      {/* Gold bg replaces the old pulse overlay — no overlay needed */}

      {/* Payout — top center */}
      <div className="mb-1 flex items-center justify-center">
        <span style={{
          color: isActive ? '#000000' : '#e8b84b',
          fontFamily: 'Oswald, sans-serif',
          fontWeight: isActive ? 900 : 700,
          fontSize: '0.85rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textShadow: isActive ? 'none' : '0 0 2px #000, 1px 1px 2px #000, -1px -1px 2px #000, 2px 2px 0 #000',
        }}>{hand.payout}:1</span>
      </div>

      {/* Cards */}
      <div className="flex gap-0.5 justify-center card-felt-shadow flex-1 items-center" style={{ transform: 'scale(0.9)', transformOrigin: 'center center' }}>
        {hand.cards.map((card, i) => {
          const imgUrl = getCardImageUrl(card);
          return imgUrl
            ? <img key={i} src={imgUrl} alt={`${card.rank} of ${card.suit}`} className="w-[3.9rem] h-[5.5rem] rounded-lg shadow-lg object-cover" />
            : <PlayingCard key={i} card={card} size="sm" glow={isLeading || isWinner} />;
        })}
      </div>

      {/* Card names — always hidden, space reserved to prevent layout shift */}
      <div className="text-center text-xs text-yellow-200/70 truncate leading-none text-halo">
        {'\u00A0'}
      </div>

      {/* Current eval — always occupies the same space to prevent layout shift */}
      <div className={`text-center text-xs leading-none mt-0.5 truncate
          ${isActive ? 'text-black font-black' : 'text-yellow-100/60 font-semibold'}`}>
        {currentEval && currentEval.name !== 'No Hand' && currentEval.name !== 'High Card'
          ? currentEval.name
          : '\u00A0'}
      </div>


      {/* Bet chips — left side (P1–P5) and right side (P6–P10), stacked vertically */}
      {allBets && allBets.length > 0 && (() => {
        const leftBets = allBets.filter(b => b.pid < 5);
        const rightBets = allBets.filter(b => b.pid >= 5);
        const renderChip = ({ pid, amt }, idx) => (
          <Chip
            key={pid}
            playerId={pid}
            amount={amt}
            scale={0.75}
            draggable={isBettingPhase && pid === activePlayerId}
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData('text/plain', JSON.stringify({ from: hand.id, pid, type: 'hand' }));
              e.dataTransfer.effectAllowed = 'move';
            }}
            style={{ zIndex: 10 + idx }}
            className="transition-transform hover:scale-110"
            title={`P${pid + 1}: $${amt} — drag to move`}
          />
        );
        return (
          <>
            {/* Left column: Players 1–5 */}
            {leftBets.length > 0 && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10">
                {leftBets.map(renderChip)}
              </div>
            )}
            {/* Right column: Players 6–10 */}
            {rightBets.length > 0 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10">
                {rightBets.map(renderChip)}
              </div>
            )}
          </>
        );
      })()}

      {/* Winner banner */}
      {isWinner &&
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -top-2.5 -right-2.5 bg-black text-yellow-400 text-xs font-black px-1.5 py-0.5 rounded-full whitespace-nowrap z-20">
          WIN!
        </motion.div>
      }

      {/* Lock icon — cards stay visible, only a lock badge on top */}
      {disabledByConstraint &&
      <div className="absolute inset-0 rounded-xl pointer-events-none flex flex-col items-center justify-center z-20">
        <div style={{
          fontSize: '2rem',
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))',
        }}>🔒</div>
        <span style={{
          color: '#ff4444',
          fontSize: '0.6rem',
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginTop: '4px',
          textShadow: '0 1px 4px #000, 0 0 8px #000',
        }}>LOCKED</span>
      </div>
      }

      {/* Bet prompt */}
      {canBet && hovered && betAmount === 0 &&
      <div className="absolute inset-0 rounded-xl bg-yellow-400/10 flex items-center justify-center pointer-events-none">
          <span className="text-yellow-300 font-bold text-xs">BET</span>
        </div>
      }
    </motion.div>);

}