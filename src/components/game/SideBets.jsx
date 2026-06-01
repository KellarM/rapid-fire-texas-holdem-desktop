import { motion, AnimatePresence } from 'framer-motion';
import { cardColor } from '@/lib/gameEngine';
import { COLOR_BOARD_PAYOUTS, LOW_HIGH_PAYOUT, RIVER_STATE_PAYOUTS } from '@/lib/payoutConstants';
import { EnergyArcOverlay } from './GreedEngine';
import Chip from './Chip';

const RED_OPTIONS   = [
  { key: '3R', number: '3', payout: `${COLOR_BOARD_PAYOUTS['3R']}:1` },
  { key: '4R', number: '4', payout: `${COLOR_BOARD_PAYOUTS['4R']}:1` },
  { key: '5R', number: '5', payout: `${COLOR_BOARD_PAYOUTS['5R']}:1` },
];
const BLACK_OPTIONS = [
  { key: '3B', number: '3', payout: `${COLOR_BOARD_PAYOUTS['3B']}:1` },
  { key: '4B', number: '4', payout: `${COLOR_BOARD_PAYOUTS['4B']}:1` },
  { key: '5B', number: '5', payout: `${COLOR_BOARD_PAYOUTS['5B']}:1` },
];


const goldEmbossText = {
  color: 'transparent',
  background: 'linear-gradient(180deg, #ffe566 0%, #c9960a 45%, #ffe566 80%, #a07005 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: 'none',
  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.7))',
};

// Low ranks: 2,3,4,5,6,7  High ranks: 8,9,10,J,Q,K,A
const LOW_RANKS = new Set(['2','3','4','5','6','7']);

/**
 * Derive the river board-state key from the 4 community cards visible after the turn.
 * Returns e.g. '3L1H', '2L2H', etc.
 * Falls back to null if fewer than 4 cards are showing.
 */
function getTurnBoardStateFromCards(cards) {
  if (!cards || cards.length < 4) return null;
  const turnCards = cards.slice(0, 4);
  const lowCount = turnCards.filter(c => LOW_RANKS.has(c.rank)).length;
  return `${lowCount}L${4 - lowCount}H`;
}


export default function SideBets({
  communityCards,
  allRedBlackBets,
  allLowHighBets,
  redBlackBets,
  lowHighBet,
  onRedBlackBet,
  onRemoveRedBlackBet,
  onLowHighBet,
  onRemoveLowHighBet,
  gamePhase,
  winningRedBlack,
  winningLowHigh,
  disabled,
  killSwitchActive,
  rankBetActive,
  activeColorSide,
  onColorSideConflict,
  playerCount,
  totalInvestment,
  hoveredRiverType,
  onHoverRiver,
  riverWinFlash,
  selectedChip,
  hoveredRankRow,
  isRankBetPlaced,
  compactLandscape,   // landscape mode: hides headers, flips color grid to 3×2
}) {
  const colorLocked = killSwitchActive || !rankBetActive;
  const riverLocked = !rankBetActive;
  const canBetRB = (gamePhase === 'betting') && !disabled && !colorLocked;
  // Color side lock: if activeColorSide is set, the opposite side is locked
  const redSideLocked  = colorLocked || activeColorSide === 'black';
  const blackSideLocked = colorLocked || activeColorSide === 'red';
  const canBetRed   = (gamePhase === 'betting') && !disabled && !redSideLocked;
  const canBetBlack = (gamePhase === 'betting') && !disabled && !blackSideLocked;
  const canBetLH = (gamePhase === 'lowHighBetting') && !disabled && !riverLocked;

  const reds = communityCards.filter(c => cardColor(c) === 'red').length;

  // Dynamic river payout based on turn board state (4 cards visible after turn)
  const turnBoardState = getTurnBoardStateFromCards(communityCards);
  const riverPayouts = {
    LOW:  (turnBoardState && RIVER_STATE_PAYOUTS[turnBoardState])
            ? RIVER_STATE_PAYOUTS[turnBoardState].LOW
            : LOW_HIGH_PAYOUT,
    HIGH: (turnBoardState && RIVER_STATE_PAYOUTS[turnBoardState])
            ? RIVER_STATE_PAYOUTS[turnBoardState].HIGH
            : LOW_HIGH_PAYOUT,
  };
  const blacks = communityCards.filter(c => cardColor(c) === 'black').length;

  const liveRedBlack = [];
  // Exact match rule: each bet wins only when count equals exactly that number
  if (reds === 3) liveRedBlack.push('3R');
  if (reds === 4) liveRedBlack.push('4R');
  if (reds === 5) liveRedBlack.push('5R');
  if (blacks === 3) liveRedBlack.push('3B');
  if (blacks === 4) liveRedBlack.push('4B');
  if (blacks === 5) liveRedBlack.push('5B');

  const hasColorBet = Object.keys(redBlackBets || {}).some(k => (redBlackBets[k] || 0) > 0);
  const hasRiverBet = lowHighBet && lowHighBet.amount > 0;

  const renderRBCell = (opt, isRed) => {
    const isWinner = winningRedBlack && winningRedBlack.includes(opt.key);
    const isLive = liveRedBlack.includes(opt.key) && !isWinner && communityCards.length > 0 && communityCards.length < 5;
    const hasBet = (redBlackBets[opt.key] || 0) > 0;

    const chipsHere = [];
    for (let i = 0; i < playerCount; i++) {
      const amt = (allRedBlackBets[i] || {})[opt.key] || 0;
      if (amt > 0) chipsHere.push({ pid: i, amt });
    }

    // Per-side canBet: red cells use canBetRed, black cells use canBetBlack
    const canBetThisCell = isRed ? canBetRed : canBetBlack;
    const isSideLocked = isRed ? redSideLocked : blackSideLocked;

    let blockStyle;
    const isActive = isWinner || isLive;
    if (isActive) {
      // Gold bg + black border — consistent with hand card and rank board treatment
      blockStyle = {
        background: 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%, #e8c22a 100%)',
        boxShadow: '0 0 16px rgba(255,200,50,0.7), inset 0 1px 2px rgba(255,255,200,0.6)',
        border: '3px solid #000000',
      };
    } else if (hasBet) {
      blockStyle = isRed
        ? { background: 'linear-gradient(160deg, #c01c1c 0%, #7a0909 100%)', border: '1px solid #111' }
        : { background: 'linear-gradient(160deg, #141414 0%, #000 100%)', border: '1px solid #333' };
    } else if (canBetThisCell) {
      blockStyle = isRed
        ? { background: 'linear-gradient(160deg, #e02020 0%, #8c0e0e 100%)', border: '1px solid #111', cursor: 'pointer' }
        : { background: 'linear-gradient(160deg, #222 0%, #000 100%)', border: '1px solid #2a2a2a', cursor: 'pointer' };
    } else {
      // Locked — dimmed; if locked by color-side rule, show a crossed cursor
      blockStyle = isRed
        ? { background: 'linear-gradient(160deg, #8a1414 0%, #4a0505 100%)', border: '1px solid #111', opacity: 0.45, cursor: isSideLocked && !colorLocked ? 'not-allowed' : 'default' }
        : { background: 'linear-gradient(160deg, #111 0%, #000 100%)', border: '1px solid #1a1a1a', opacity: 0.45, cursor: isSideLocked && !colorLocked ? 'not-allowed' : 'default' };
    }

    return (
      <motion.button
        key={opt.key}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (gamePhase !== 'betting') return;
          // If locked by color-side rule (opposite color chosen), fire the conflict alert
          if (isSideLocked && !colorLocked && !hasBet) { if (onColorSideConflict) onColorSideConflict(); return; }
          onRedBlackBet(opt.key);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (gamePhase !== 'betting') return;
          // Tap on chip = remove; tap elsewhere = add
          if (hasBet && e.target.closest('[data-chip]')) {
            onRemoveRedBlackBet(opt.key);
          } else {
            if (isSideLocked && !colorLocked && !hasBet) { if (onColorSideConflict) onColorSideConflict(); return; }
            onRedBlackBet(opt.key);
          }
        }}
        onContextMenu={(e) => { e.preventDefault(); if (gamePhase === 'betting') onRemoveRedBlackBet(opt.key); }}
        onDragOver={(e) => { if (gamePhase === 'betting') { e.preventDefault(); e.stopPropagation(); } }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (gamePhase !== 'betting') return;
          const data = e.dataTransfer.getData('text/plain');
          if (!data) return;
          try {
            const { from, type } = JSON.parse(data);
            if (type === 'rb' && from !== opt.key) {
              const amt = (redBlackBets[from] || 0);
              if (amt > 0) { onRemoveRedBlackBet(from); onRedBlackBet(opt.key); }
            }
          } catch (_) {}
        }}
        whileTap={canBetThisCell ? { scale: 0.95 } : {}}
        style={{ ...blockStyle, borderRadius: '8px', position: 'relative', overflow: 'visible' }}
        className={`relative flex-1 transition-all duration-300 ${canBetThisCell ? 'hover:brightness-110 lp-magnetic' : ''}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0 pointer-events-none z-0">
          <span style={isActive ? { color: '#000', fontWeight: 900, fontSize: '1.25rem', lineHeight: 1 } : { ...goldEmbossText, fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>
            {opt.number}
          </span>
          <span style={isActive ? { color: '#000', fontWeight: 900, fontSize: '0.72rem', lineHeight: 1.1 } : { ...goldEmbossText, fontSize: '0.72rem', fontWeight: 800, lineHeight: 1.1 }}>
            {opt.payout}
          </span>
        </div>

        {chipsHere.length > 0 && (
          <div
            className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-around"
            style={{ padding: '3px 4px', overflow: 'visible' }}
          >
            {/* Row 1: P1–P5 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 2, overflow: 'visible' }}>
              {Array.from({ length: 5 }, (_, i) => {
                const chip = chipsHere.find(c => c.pid === i);
                if (!chip) return <span key={i} style={{ width: Math.round(24 * 0.6), height: Math.round(24 * 0.6) + 4, display: 'inline-block', flexShrink: 0 }} />;
                return (
                  <Chip
                    key={i}
                    playerId={chip.pid}
                    amount={chip.amt}
                    scale={0.6}
                    draggable={gamePhase === 'betting'}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData('text/plain', JSON.stringify({ from: opt.key, type: 'rb', pid: chip.pid, amount: (redBlackBets[opt.key] || 0) }));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="transition-transform hover:scale-110"
                    title={`P${chip.pid + 1}: $${chip.amt}`}
                    style={{ pointerEvents: 'auto', flexShrink: 0 }}
                  />
                );
              })}
            </div>
            {/* Row 2: P6–P10 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 2, overflow: 'visible' }}>
              {Array.from({ length: 5 }, (_, i) => {
                const pid = i + 5;
                const chip = chipsHere.find(c => c.pid === pid);
                if (!chip) return <span key={pid} style={{ width: Math.round(24 * 0.6), height: Math.round(24 * 0.6) + 4, display: 'inline-block', flexShrink: 0 }} />;
                return (
                  <Chip
                    key={pid}
                    playerId={chip.pid}
                    amount={chip.amt}
                    scale={0.6}
                    draggable={gamePhase === 'betting'}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData('text/plain', JSON.stringify({ from: opt.key, type: 'rb', pid: chip.pid, amount: (redBlackBets[opt.key] || 0) }));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="transition-transform hover:scale-110"
                    title={`P${chip.pid + 1}: $${chip.amt}`}
                    style={{ pointerEvents: 'auto', flexShrink: 0 }}
                  />
                );
              })}
            </div>
          </div>
        )}
        {isWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-2.5 -right-2.5 bg-black text-yellow-400 text-xs font-black px-1.5 py-0.5 rounded-full whitespace-nowrap z-20 pointer-events-none">
            WIN!
          </motion.div>
        )}
      </motion.button>
    );
  };

  const goldBlockStyle = {
    background: 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%, #e8c22a 100%)',
    boxShadow: 'inset 0 1px 2px rgba(255,255,200,0.6), inset 0 -1px 2px rgba(100,60,0,0.5), 0 1px 4px rgba(0,0,0,0.5)',
    border: '1px solid #000',
    borderRadius: '8px',
  };
  const goldBlockDim = {
    background: 'linear-gradient(135deg, #c9a820 0%, #b08a14 30%, #d4b830 55%, #8a6504 80%, #b08a14 100%)',
    boxShadow: 'inset 0 1px 2px rgba(200,170,80,0.3)',
    border: '1px solid #000',
    borderRadius: '8px',
    opacity: 0.6,
  };
  const goldBlockWinner = {
    background: 'linear-gradient(135deg, #fff176 0%, #ffd600 40%, #ffe57a 70%, #ffab00 100%)',
    boxShadow: '0 0 16px rgba(255,200,50,0.7)',
    border: '1px solid #a07005',
    borderRadius: '8px',
  };

  return (
    <div className="flex flex-col h-full gap-1">
      {/* Color Board */}
      <div className="relative flex flex-col min-h-0" style={{ flex: '3 1 0' }}>
        {/* Header — hidden in landscape to save space */}
        {!compactLandscape && (
          <div
            className="text-xs font-black tracking-wider uppercase mb-1 text-center flex-shrink-0"
            style={{ ...goldEmbossText, fontSize: '0.7rem', letterSpacing: '0.1em' }}
          >
            Color Board
          </div>
        )}

        {/* Kill Switch Overlay */}
        {killSwitchActive && gamePhase === 'betting' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-black/80 border-2 border-red-700/60 backdrop-blur-sm">
            <span className="text-red-400 font-black text-base mb-1">LOCKED</span>
            <span className="text-red-300 text-xs font-semibold text-center px-2">4 Hands: Side Bets Disabled</span>
          </div>
        )}

        {/* Smoked Glass Vault — Rank Bet Required */}
        {!killSwitchActive && !rankBetActive && (gamePhase === 'betting' || gamePhase === 'flop' || gamePhase === 'lowHighBetting') && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl"
            style={{
              backdropFilter: 'blur(6px)',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(15,10,5,0.82) 100%)',
              border: '1.5px solid rgba(251,191,36,0.25)',
              boxShadow: 'inset 0 0 20px rgba(251,191,36,0.05)',
            }}
          >
            <div className="text-base mb-1" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' }}>
              🏆
            </div>
            <span className="text-yellow-400 font-black text-xs mb-1 text-center px-2 leading-tight">
              UPGRADE YOUR WIN
            </span>
            <span className="text-yellow-300/60 text-xs text-center px-3 leading-snug">
              Match your Rank bet total to your Hand bet total to unlock
            </span>
          </div>
        )}

        {/* Ghost chip preview on rank hover */}
        <AnimatePresence>
          {hoveredRankRow && gamePhase === 'betting' && rankBetActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1 right-1 z-10 pointer-events-none"
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-yellow-300 flex items-center justify-center text-xs font-black text-yellow-300"
                style={{
                  background: 'rgba(251,191,36,0.25)',
                  boxShadow: '0 0 8px rgba(251,191,36,0.5)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                {selectedChip >= 100 ? '99+' : selectedChip}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {compactLandscape ? (
          /* Landscape: 3 columns × 2 rows — red row on top, black row on bottom */
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gridTemplateRows:'repeat(2,1fr)', gap:3, flex:1, minHeight:0 }}>
            {RED_OPTIONS.map(opt => renderRBCell(opt, true))}
            {BLACK_OPTIONS.map(opt => renderRBCell(opt, false))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 flex-1 min-h-0" style={{ gridTemplateRows: '1fr' }}>
            <div className="flex flex-col gap-1">
              {RED_OPTIONS.map(opt => renderRBCell(opt, true))}
            </div>
            <div className="flex flex-col gap-1">
              {BLACK_OPTIONS.map(opt => renderRBCell(opt, false))}
            </div>
          </div>
        )}
      </div>

      {/* River — Low / High */}
      <div className="relative flex flex-col min-h-0" style={{ flex: '2 1 0' }}>
        {/* Header — hidden in landscape to save space */}
        {!compactLandscape && (
          <div
            className={`text-xs font-black tracking-wider uppercase mb-1 text-center flex-shrink-0 ${canBetLH && !hoveredRiverType ? 'animate-pulse' : ''}`}
            style={{ ...goldEmbossText, fontSize: '0.7rem', letterSpacing: '0.1em' }}
          >
            River — Low / High
          </div>
        )}

        {/* Smoked Glass Vault — River locked before turn is dealt OR rank gate not met */}
        {(gamePhase === 'betting' || gamePhase === 'flop' || (gamePhase === 'lowHighBetting' && !rankBetActive)) && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl"
            style={{
              backdropFilter: 'blur(6px)',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(5,10,20,0.82) 100%)',
              border: '1.5px solid rgba(251,191,36,0.25)',
              boxShadow: 'inset 0 0 20px rgba(251,191,36,0.05)',
            }}
          >
            {(gamePhase === 'betting' || gamePhase === 'flop') ? (
              <>
                <div className="text-base mb-1">🔒</div>
                <span className="text-yellow-400 font-black text-xs mb-1 text-center px-2 leading-tight">
                  OPENS AFTER TURN
                </span>
                <span className="text-yellow-300/60 text-xs text-center px-3 leading-snug">
                  River bet available once the Turn card is dealt
                </span>
              </>
            ) : (
              <>
                <div className="text-base mb-1" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' }}>
                  🏆
                </div>
                <span className="text-yellow-400 font-black text-xs mb-1 text-center px-2 leading-tight">
                  UPGRADE YOUR WIN
                </span>
                <span className="text-yellow-300/60 text-xs text-center px-3 leading-snug">
                  Match your Rank bet total to your Hand bet total to unlock
                </span>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 flex-1 min-h-0">
          {['LOW', 'HIGH'].map(type => {
            const isLow = type === 'LOW';
            const isWinner = winningLowHigh === type;
            const isHovered = hoveredRiverType === type;
            const hasBet = lowHighBet && lowHighBet.type === type && lowHighBet.amount > 0;

            let riverBlockStyle;
            if (isWinner) {
              riverBlockStyle = goldBlockWinner;
            } else if (isHovered && canBetLH) {
              riverBlockStyle = {
                ...goldBlockStyle,
                boxShadow: 'inset 0 1px 2px rgba(255,255,200,0.8), 0 0 12px rgba(255,200,50,0.4)',
              };
            } else if (canBetLH || hasBet) {
              riverBlockStyle = goldBlockStyle;
            } else {
              riverBlockStyle = goldBlockDim;
            }

            const chipsHere = [];
            for (let i = 0; i < playerCount; i++) {
              const plh = allLowHighBets[i];
              if (plh && plh.type === type && plh.amount > 0) chipsHere.push({ pid: i, amt: plh.amount });
            }

            return (
              <motion.button
                key={type}
                onMouseEnter={() => onHoverRiver && onHoverRiver(type)}
                onMouseLeave={() => onHoverRiver && onHoverRiver(null)}
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (gamePhase !== 'lowHighBetting') return;
                  const hasBetHere = lowHighBet && lowHighBet.type === type && lowHighBet.amount > 0;
                  // Tapping chip icon removes; tapping button body adds
                  if (hasBetHere && (e.target.dataset.chip || e.target.closest('[data-chip]'))) {
                    onRemoveLowHighBet();
                  } else {
                    onLowHighBet(type);
                  }
                }}
                onContextMenu={(e) => { e.preventDefault(); if (gamePhase === 'lowHighBetting' && lowHighBet && lowHighBet.type === type && lowHighBet.amount > 0) onRemoveLowHighBet(); }}
                whileTap={canBetLH ? { scale: 0.95 } : {}}
                style={{ ...riverBlockStyle, position: 'relative', overflow: 'visible', touchAction: 'none', minHeight: 34 }}
                className={`relative transition-all duration-200 ${canBetLH ? 'cursor-pointer hover:brightness-110 lp-magnetic' : 'cursor-default'}`}
              >
                <EnergyArcOverlay active={isHovered && canBetLH} />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0 z-0 pointer-events-none">
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, lineHeight: 1, color: '#000' }}>
                    {type}
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1.1, color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                    {isLow ? '2–7' : '8–A'}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 900, lineHeight: 1, color: '#000' }}>
                    {isLow ? riverPayouts.LOW : riverPayouts.HIGH}:1
                  </span>
                </div>

                {chipsHere.length > 0 && (
                  <div
                    className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-around"
                    style={{ padding: '3px 4px', overflow: 'visible' }}
                  >
                    {/* Row 1: P1–P5 */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, overflow: 'visible' }}>
                      {Array.from({ length: 5 }, (_, i) => {
                        const chip = chipsHere.find(c => c.pid === i);
                        if (!chip) return <span key={i} style={{ width: Math.round(24 * 0.6), height: Math.round(24 * 0.6) + 4, display: 'inline-block', flexShrink: 0 }} />;
                        return (
                          <Chip
                            key={i}
                            playerId={chip.pid}
                            amount={chip.amt}
                            scale={0.6}
                            title={`P${chip.pid + 1}: $${chip.amt}`}
                            style={{ flexShrink: 0 }}
                          />
                        );
                      })}
                    </div>
                    {/* Row 2: P6–P10 */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, overflow: 'visible' }}>
                      {Array.from({ length: 5 }, (_, i) => {
                        const pid = i + 5;
                        const chip = chipsHere.find(c => c.pid === pid);
                        if (!chip) return <span key={pid} style={{ width: Math.round(24 * 0.6), height: Math.round(24 * 0.6) + 4, display: 'inline-block', flexShrink: 0 }} />;
                        return (
                          <Chip
                            key={pid}
                            playerId={chip.pid}
                            amount={chip.amt}
                            scale={0.6}
                            title={`P${chip.pid + 1}: $${chip.amt}`}
                            style={{ flexShrink: 0 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
                {isWinner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-2.5 -right-2.5 bg-black text-yellow-400 text-xs font-black px-1.5 py-0.5 rounded-full whitespace-nowrap z-20 pointer-events-none">
                    WIN!
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}