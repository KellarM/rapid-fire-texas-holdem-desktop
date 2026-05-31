import { getCardImageUrl } from '@/lib/cardImages';
import { evaluateBestHand, FIXED_HANDS } from '@/lib/gameEngine';
import CommunityCards from './CommunityCards';
import RankBets from './RankBets';
import SideBets from './SideBets';
import DealerAnnouncement from './DealerAnnouncement';
import Chip from './Chip';
import CountdownClock from './CountdownClock';
import DetailedPayoutDisplay from './DetailedPayoutDisplay';
import GameRulesModal from './GameRulesModal';
import ToolsMenu from './ToolsMenu';
import HandBetLimitAlert from './HandBetLimitAlert';
import RankBetLimitAlert from './RankBetLimitAlert';
import InsufficientFundsAlert from './InsufficientFundsAlert';
import AutoTrimToast from './AutoTrimToast';
import ColorSideAlert from './ColorSideAlert';
import VolumeControl from './VolumeControl';

const CHIP_VALUES = [5, 25, 100];

const LOGO_URLS = {
  red:   'https://media.base44.com/images/public/69f3a45ad82dff5b772d4de2/2667063a3_image.png',
  blue:  'https://media.base44.com/images/public/69fbe99a6a81578f42265ae6/864b277e3_RapidFireGreenLogo.png',
  green: 'https://media.base44.com/images/public/69fbe99a6a81578f42265ae6/864b277e3_RapidFireGreenLogo.png',
};

// ── Portrait-optimised hand card ─────────────────────────────────────────
function MobileHandCard({
  hand, isLeading, isWinner, communityCards,
  betAmount, onBet, onRemoveBet,
  gamePhase, disabled, disabledByConstraint, onAttemptLockedBet,
}) {
  const isBettingPhase = gamePhase === 'betting';
  const isActive = isLeading || isWinner;

  let borderCls;
  if (isActive)                  borderCls = 'border-black shadow-black/60 shadow-xl';
  else if (disabledByConstraint) borderCls = 'slot-border-dormant bg-black/25';
  else if (betAmount > 0)        borderCls = 'slot-border-active bg-black/25';
  else                           borderCls = 'slot-border-dormant bg-black/25';

  const W = 29, H = 40;
  const card0 = hand.cards[0];
  const card1 = hand.cards[1];
  const img0 = getCardImageUrl(card0);
  const img1 = getCardImageUrl(card1);

  return (
    <div
      className={`relative rounded-lg border-2 cursor-pointer select-none flex flex-col items-center justify-between overflow-visible ${borderCls}`}
      style={{
        padding: '3px 2px 3px',
        height: '100%',
        ...(isActive ? { background: 'linear-gradient(135deg,#b8860b 0%,#d4a017 30%,#c9900e 60%,#8B6914 100%)' } : {}),
      }}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        if (isBettingPhase) {
          if (disabledByConstraint) onAttemptLockedBet?.();
          else onBet(hand.id);
        }
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        if (isBettingPhase) {
          if (disabledByConstraint) onAttemptLockedBet?.();
          else onBet(hand.id);
        }
      }}
      onContextMenu={(e) => { e.preventDefault(); if (isBettingPhase) onRemoveBet(hand.id); }}
    >
      {/* Payout label */}
      <div style={{
        fontSize: '0.55rem',
        color: isActive ? '#000' : '#e8b84b',
        fontWeight: isActive ? 900 : 700,
        lineHeight: 1,
        textAlign: 'center',
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}>
        {hand.payout}:1
      </div>

      {/* Cards */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '0 3px', position: 'relative' }}>
        <div style={{ flexShrink: 0 }}>
          {img0
            ? <img src={img0} alt={card0?.rank} className="rounded shadow-md" style={{ width: W, height: H, objectFit: 'cover', display: 'block' }} />
            : <div className="bg-white rounded text-black flex items-center justify-center font-bold" style={{ width: W, height: H, fontSize: '0.5rem' }}>{card0?.rank}</div>
          }
        </div>
        <div style={{ flexShrink: 0 }}>
          {img1
            ? <img src={img1} alt={card1?.rank} className="rounded shadow-md" style={{ width: W, height: H, objectFit: 'cover', display: 'block' }} />
            : <div className="bg-white rounded text-black flex items-center justify-center font-bold" style={{ width: W, height: H, fontSize: '0.5rem' }}>{card1?.rank}</div>
          }
        </div>
        {betAmount > 0 && (
          <div style={{ position: 'absolute', bottom: -6, right: -2, zIndex: 10, pointerEvents: 'none' }}>
            <Chip amount={betAmount} scale={0.42} />
          </div>
        )}
      </div>

      {/* Rank eval */}
      {communityCards && communityCards.length > 0 && (() => {
        const ev = evaluateBestHand(hand.cards, communityCards);
        return ev && ev.name !== 'No Hand' && ev.name !== 'High Card'
          ? <div style={{ fontSize: '0.38rem', color: isActive ? '#000' : '#a8956a', fontWeight: 700, lineHeight: 1, textAlign: 'center', flexShrink: 0 }}>{ev.name}</div>
          : <div style={{ fontSize: '0.38rem', lineHeight: 1, flexShrink: 0 }}>&nbsp;</div>;
      })()}

      {/* WIN! badge — top-right, black bg / gold text (v12 spec) */}
      {isWinner && (
        <div
          className="absolute -top-2 -right-2 font-black rounded-full"
          style={{ fontSize: '0.5rem', padding: '2px 5px', zIndex: 20, background: '#000', color: '#ffd700', letterSpacing: '0.04em', boxShadow: '0 0 6px 2px rgba(251,191,36,0.7)' }}
        >
          WIN!
        </div>
      )}

      {/* Lock overlay */}
      {disabledByConstraint && (
        <div className="absolute inset-0 rounded-lg pointer-events-none flex flex-col items-center justify-center" style={{ zIndex: 20 }}>
          <span style={{ fontSize: '1.1rem', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}>🔒</span>
          <span style={{ color: '#ff4444', fontSize: '0.42rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3, textShadow: '0 1px 4px #000' }}>LOCKED</span>
        </div>
      )}
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────
export default function MobileGameLayout({
  gamePhase,
  communityCards,
  dealerMessage,
  leadingHandIds,
  winnerHandIds,
  winningRedBlack,
  winningLowHigh,
  winningRank,
  leadingRank,
  lastWinInfo,
  playerCount,
  activePlayer,
  balances,
  selectedChip,
  handBets,
  redBlackBets,
  rankBets,
  lowHighBets,
  countdownTime,
  countdownActive,
  killSwitchActive,
  sideBetGateOpen,
  handBetCount,
  rankBetCount,
  maxRankSlots,
  luminosityClass,
  hoveredRankRow,
  hoveredRiverType,
  riverWinFlash,
  isRankBetPlaced,
  totalBet,
  history,
  // Alerts
  showHandLimitAlert,
  showRankLimitAlert,
  rankAlertType,
  showCapAlert,
  capAlertType,
  showInsufficientFunds,
  showAutoTrimToast,
  showColorSideAlert,
  // Handlers
  onHandBet,
  onRemoveHandBet,
  onDropChip,
  onRankBet,
  onRemoveRankBet,
  onMoveRankBet,
  onRedBlackBet,
  onRemoveRedBlackBet,
  onLowHighBet,
  onRemoveLowHighBet,
  onSelectChip,
  onClearBets,
  onCloseHandAlert,
  onCloseRankAlert,
  onCloseCapAlert,
  onCloseInsufficientFunds,
  onHideAutoTrimToast,
  onCloseColorSideAlert,
  // Tools
  onOpenStats,
  onOpenMollySimulator,
  onOpenArchetypeBattle,
  onOpenExploitHunter,
  onOpenComplianceReport,
  onOpenKsStrategyTest,
  onOpenObserver,
  onOpenGameTiming,
  onOpenAnalytics,
  toolsVisible,
  onSetHoveredRankRow,
  onSetHoveredRiverType,
  // v12-specific
  handDisplayOrder,
  boardTheme,
  soundManager,
  resetBankVisible,
  onResetBank,
  activeColorSide,
}) {
  const pid = activePlayer;
  const balance = balances[pid] ?? 10000;
  const pHandBets = handBets[pid] || {};
  const pRedBlackBets = redBlackBets[pid] || {};
  const pRankBets = rankBets[pid] || {};
  const pLowHighBet = lowHighBets[pid] || null;
  const activeHandIds = Object.keys(pHandBets).map(Number);
  const displayOrder = handDisplayOrder && handDisplayOrder.length === 10
    ? handDisplayOrder
    : FIXED_HANDS.map(h => h.id);

  return (
    <div
      className={`velvet-board w-full flex flex-col text-white overflow-hidden theme-${boardTheme || 'red'}`}
      style={{ height: '100dvh' }}
    >
      {/* ── Alerts ── */}
      <HandBetLimitAlert isOpen={showHandLimitAlert} onClose={onCloseHandAlert} />
      <RankBetLimitAlert isOpen={showRankLimitAlert} onClose={onCloseRankAlert} currentHandBets={handBetCount} alertType={rankAlertType} maxRankSlots={maxRankSlots} />
      <RankBetLimitAlert isOpen={showCapAlert} onClose={onCloseCapAlert} alertType={capAlertType} currentHandBets={handBetCount} />
      <InsufficientFundsAlert isVisible={showInsufficientFunds} onClose={onCloseInsufficientFunds} />
      <AutoTrimToast isVisible={showAutoTrimToast} onHide={onHideAutoTrimToast} />
      <ColorSideAlert isOpen={!!showColorSideAlert} onClose={onCloseColorSideAlert} />

      {/* ── Dealer message bar ── */}
      <div className="flex-shrink-0 px-2 pt-1.5">
        <div style={{
          height: '26px', display: 'flex', alignItems: 'center',
          borderRadius: '0.4rem', border: '1px solid rgba(202,138,4,0.4)',
          background: 'linear-gradient(90deg, rgba(78,47,0,0.5) 0%, rgba(83,37,0,0.5) 100%)',
          overflow: 'hidden', whiteSpace: 'nowrap',
        }}>
          <DealerAnnouncement message={dealerMessage} phase={gamePhase} />
        </div>
      </div>

      {/* ── Community Cards ── */}
      <div className="flex-shrink-0 px-2 pt-1">
        <div className="slot-border-dormant rounded-xl border-2 bg-black/35 flex items-center justify-center" style={{ height: 96, padding: '4px 6px' }}>
          <div className="flex items-center justify-center gap-2 w-full h-full">
            <img src={LOGO_URLS[boardTheme] || LOGO_URLS.red} alt="logo" style={{ width: 34, height: 'auto', borderRadius: 5, flexShrink: 0 }} />
            <CommunityCards cards={communityCards} phase={gamePhase} />
            <img src={LOGO_URLS[boardTheme] || LOGO_URLS.red} alt="logo" style={{ width: 34, height: 'auto', borderRadius: 5, flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* ── Win/No-Win Modal ── */}
      <div className="flex-shrink-0 px-2">
        <DetailedPayoutDisplay winInfo={lastWinInfo} playerCount={playerCount} />
      </div>

      {/* ── Main game area ── */}
      <div className="flex-1 min-h-0 px-2 pt-1 pb-0 flex flex-col gap-1.5">

        {/* 10-hand grid — crypto-shuffled each round */}
        <div
          className="flex-shrink-0 relative grid gap-1"
          style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', height: '36%' }}
        >
          <div className="absolute z-10" style={{ bottom: -18, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
            <CountdownClock timeRemaining={countdownTime} isActive={countdownActive} phase={gamePhase} />
          </div>

          {displayOrder.map(hid => {
            const hand = FIXED_HANDS.find(h => h.id === hid);
            if (!hand) return null;
            return (
              <MobileHandCard
                key={hand.id}
                hand={hand}
                isLeading={leadingHandIds.includes(hand.id)}
                isWinner={winnerHandIds.includes(hand.id)}
                communityCards={communityCards}
                betAmount={pHandBets[hand.id] || 0}
                onBet={onHandBet}
                onRemoveBet={onRemoveHandBet}
                gamePhase={gamePhase}
                disabled={balance < selectedChip && !pHandBets[hand.id]}
                disabledByConstraint={handBetCount >= 1 && !pHandBets[hand.id]}
                onAttemptLockedBet={() => {}}
              />
            );
          })}
        </div>

        {/* Rank + Color/River */}
        <div className="flex-1 min-h-0 flex gap-1.5">

          {/* Rank board */}
          <div className="flex-1 min-h-0 flex flex-col border rounded-xl slot-border-dormant overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)', padding: '6px' }}>
            <div className="text-center text-yellow-300 font-black flex-shrink-0" style={{ fontSize: '0.6rem', letterSpacing: '0.08em', textShadow: '0 0 4px rgba(0,0,0,0.9)', marginBottom: 3 }}>
              HAND RANK BOARD
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <RankBets
                rankBets={pRankBets}
                allRankBets={rankBets}
                playerCount={playerCount}
                onRankBet={onRankBet}
                onRemoveRankBet={onRemoveRankBet}
                onMoveRankBet={onMoveRankBet}
                gamePhase={gamePhase}
                winningRank={winningRank}
                leadingRank={leadingRank}
                disabled={balance < selectedChip}
                killSwitchActive={killSwitchActive}
                handBetCount={handBetCount}
                maxRankSlots={maxRankSlots}
                rankBetCount={rankBetCount}
                unlockedRanks={new Set()}
                activePlayerId={pid}
                activeHandIds={activeHandIds}
                onAttemptLockedRank={() => {}}
                onHoverRankRow={onSetHoveredRankRow}
              />
            </div>
          </div>

          {/* Color + River board */}
          <div className={`flex-1 min-h-0 flex flex-col border rounded-xl slot-border-dormant overflow-hidden ${luminosityClass}`} style={{ background: 'rgba(0,0,0,0.45)', padding: '6px' }}>
            <div className="flex-1 min-h-0 overflow-hidden">
              <SideBets
                communityCards={communityCards}
                allRedBlackBets={redBlackBets}
                allLowHighBets={lowHighBets}
                redBlackBets={pRedBlackBets}
                lowHighBet={pLowHighBet}
                onRedBlackBet={onRedBlackBet}
                onRemoveRedBlackBet={onRemoveRedBlackBet}
                onLowHighBet={onLowHighBet}
                onRemoveLowHighBet={onRemoveLowHighBet}
                gamePhase={gamePhase}
                winningRedBlack={winningRedBlack}
                winningLowHigh={winningLowHigh}
                disabled={gamePhase === 'betting' ? balance < selectedChip : gamePhase === 'lowHighBetting' ? balance < selectedChip : true}
                killSwitchActive={killSwitchActive}
                rankBetActive={sideBetGateOpen}
                playerCount={playerCount}
                totalInvestment={totalBet}
                hoveredRiverType={hoveredRiverType}
                onHoverRiver={onSetHoveredRiverType}
                riverWinFlash={riverWinFlash}
                selectedChip={selectedChip}
                hoveredRankRow={hoveredRankRow}
                isRankBetPlaced={isRankBetPlaced}
                activeColorSide={activeColorSide}
                onColorSideConflict={onCloseColorSideAlert}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="flex-shrink-0 px-2 py-1.5 border-t border-yellow-900/40 flex items-center gap-1.5 bg-black/40">

        {/* Chips */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {CHIP_VALUES.map(v => (
            <button
              key={v}
              onClick={() => onSelectChip(v)}
              className={`relative transition-all duration-150 rounded-full border-0 bg-transparent p-0
                ${selectedChip === v ? 'scale-125 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]' : 'opacity-70 hover:opacity-100 hover:scale-110'}`}
              style={{ lineHeight: 0 }}
            >
              <Chip amount={v} scale={0.58} />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Balance */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 border-yellow-500 bg-black flex-shrink-0">
          <span className="text-yellow-400 font-black" style={{ fontSize: '0.65rem' }}>P{pid + 1}</span>
          <span className="text-yellow-400 font-black" style={{ fontSize: '0.9rem', textShadow: '0 0 8px rgba(251,191,36,0.7)' }}>
            ${balance.toLocaleString()}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {gamePhase === 'betting' && totalBet > 0 && (
            <button onClick={onClearBets} className="px-2 py-1 rounded-lg border border-red-700/50 bg-red-900/30 text-red-300 font-semibold" style={{ fontSize: '0.65rem' }}>
              Clear
            </button>
          )}
          {resetBankVisible && (
            <button onClick={onResetBank} className="px-2 py-1 rounded-lg border border-yellow-700/50 bg-yellow-900/20 text-yellow-300 font-semibold" style={{ fontSize: '0.65rem' }}>
              Reset
            </button>
          )}
          {soundManager && <VolumeControl soundManager={soundManager} />}
          <GameRulesModal />
          <ToolsMenu
            onOpenStats={onOpenStats}
            onOpenMollySimulator={onOpenMollySimulator}
            onOpenArchetypeBattle={onOpenArchetypeBattle}
            onOpenExploitHunter={onOpenExploitHunter}
            onOpenComplianceReport={onOpenComplianceReport}
            onOpenKsStrategyTest={onOpenKsStrategyTest}
            onOpenObserver={onOpenObserver}
            onOpenGameTiming={onOpenGameTiming}
            onOpenAnalytics={onOpenAnalytics}
            toolsVisible={toolsVisible}
          />
        </div>
      </div>
    </div>
  );
}
