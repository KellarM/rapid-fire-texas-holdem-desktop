import React from 'react';
import { getCardImageUrl } from '@/lib/cardImages';
import HistoryRail from './HistoryRail';
import { evaluateBestHand, FIXED_HANDS } from '@/lib/gameEngine';
import CommunityCards from './CommunityCards';
import RankBets from './RankBets';
import SideBets from './SideBets';
import DealerAnnouncement from './DealerAnnouncement';
import Chip from './Chip';
import CountdownClock from './CountdownClock';
import DetailedPayoutDisplay from './DetailedPayoutDisplay';
import GameRulesModal from './GameRulesModal';
import HowToPlayOverlay from './HowToPlayOverlay';
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
        if (!isBettingPhase) return;
        if (disabledByConstraint) { onAttemptLockedBet?.(); return; }
        // Tap on chip overlay = remove; tap elsewhere = add
        if (betAmount > 0 && e.target.closest('[data-chip-overlay]')) {
          onRemoveBet(hand.id);
        } else {
          onBet(hand.id);
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
          <div data-chip-overlay="true" style={{ position: 'absolute', bottom: -6, right: -2, zIndex: 10, pointerEvents: 'auto', cursor: 'pointer' }}>
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
  showUnlockFlash = false,
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
  preloadSounds,
  onSetTheme,
  onOpenHelp,
}) {
  const pid = activePlayer;
  const balance = balances[pid] ?? 10000;
  const [gearMenuOpen, setGearMenuOpen] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(0.4);
  React.useEffect(() => {
    if (soundManager) soundManager.setAmbientVolume(muted ? 0 : volume);
  }, [muted, volume, soundManager]);
  const pHandBets = handBets[pid] || {};
  const pRedBlackBets = redBlackBets[pid] || {};
  const pRankBets = rankBets[pid] || {};
  const pLowHighBet = lowHighBets[pid] || null;
  const activeHandIds = Object.keys(pHandBets).map(Number);
  const displayOrder = handDisplayOrder && handDisplayOrder.length === 10
    ? handDisplayOrder
    : FIXED_HANDS.map(h => h.id);


  // ── Landscape mode — 2-col layout matching user spec ─────────────────────
  const [isLandscape, setIsLandscape] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight && window.innerWidth < 1024;
  });
  React.useEffect(() => {
    const handler = () => setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => { window.removeEventListener('resize', handler); window.removeEventListener('orientationchange', handler); };
  }, []);

  if (isLandscape) {
    // ── shared border style ──
    const panelBorder = '1px solid rgba(202,138,4,0.4)';
    const panelBg     = 'rgba(0,0,0,0.55)';
    const headerStyle = {
      fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
      textAlign: 'center', padding: '3px 0', flexShrink: 0,
      background: 'linear-gradient(90deg,#fbbf24,#f59e0b)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    };

    return (
      <div
        className={`velvet-board text-white theme-${boardTheme || 'red'}`}
        style={{ width:'100dvw', height:'100dvh', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={preloadSounds}
        onTouchStart={preloadSounds}
      >
        {/* ── Alerts ── */}
        <HandBetLimitAlert isOpen={showHandLimitAlert} onClose={onCloseHandAlert} />
        <RankBetLimitAlert isOpen={showRankLimitAlert} onClose={onCloseRankAlert} currentHandBets={handBetCount} alertType={rankAlertType} maxRankSlots={maxRankSlots} />
        <RankBetLimitAlert isOpen={showCapAlert} onClose={onCloseCapAlert} alertType={capAlertType} currentHandBets={handBetCount} />
        <InsufficientFundsAlert isVisible={showInsufficientFunds} onClose={onCloseInsufficientFunds} />
        <AutoTrimToast isVisible={showAutoTrimToast} onHide={onHideAutoTrimToast} />
        <ColorSideAlert isOpen={!!showColorSideAlert} onClose={onCloseColorSideAlert} />

        {/* Unlock flash */}
        {showUnlockFlash && (
          <div style={{ position:'fixed', top:'10%', left:'35%', transform:'translateX(-50%)', zIndex:9999,
            display:'flex', flexDirection:'column', alignItems:'center', borderRadius:8,
            background:'linear-gradient(160deg,rgba(0,0,0,0.97),rgba(25,12,0,0.98))',
            border:'2px solid #eab308', animation:'rfUnlockFadeOut 4s ease forwards',
            pointerEvents:'none', padding:'7px 14px', gap:2 }}>
            <span style={{fontSize:9,fontWeight:900,color:'#eab308',letterSpacing:'0.1em',textTransform:'uppercase'}}>🔓 Bonus Bets Unlocked</span>
            <span style={{fontSize:8,color:'#f87171',fontWeight:700}}>🔴 Color Board Open</span>
            <span style={{fontSize:8,color:'#60a5fa',fontWeight:700}}>🌊 River Bet — After Turn</span>
          </div>
        )}

        {/* ── DEALER BAR — full width, very compact ── */}
        <div style={{ flexShrink:0, height:22, display:'flex', alignItems:'center',
          padding:'0 10px', overflow:'hidden', whiteSpace:'nowrap',
          background:'linear-gradient(90deg,rgba(55,22,0,0.95),rgba(70,28,0,0.95))',
          borderBottom:'1.5px solid rgba(202,138,4,0.5)' }}>
          <DealerAnnouncement message={dealerMessage} phase={gamePhase} />
        </div>

        {/* ── TWO-COLUMN BODY ── */}
        <div style={{ flex:1, minHeight:0, display:'flex' }}>

          {/* ════════════════════════════════════════════
              LEFT COLUMN  — 62% width
              community cards / hand grid / action bar
              ════════════════════════════════════════════ */}
          <div style={{ width:'62%', display:'flex', flexDirection:'column',
            borderRight:'1.5px solid rgba(202,138,4,0.35)' }}>

            {/* Community cards strip — hard 46px, cards scaled to fit */}
            <div style={{ flexShrink:0, height:46, display:'flex', alignItems:'center',
              justifyContent:'center', gap:3,
              background:'rgba(0,0,0,0.5)', borderBottom:panelBorder, padding:'0 6px', overflow:'hidden' }}>
              <img src={LOGO_URLS[boardTheme]||LOGO_URLS.red} alt=""
                style={{width:11,height:'auto',borderRadius:2,flexShrink:0,opacity:0.75}} />
              {/* scale wrapper — forces internal card heights down */}
              <div style={{ transform:'scale(0.52)', transformOrigin:'center center',
                display:'flex', alignItems:'center', pointerEvents:'none' }}>
                <CommunityCards cards={communityCards} phase={gamePhase} />
              </div>
              <img src={LOGO_URLS[boardTheme]||LOGO_URLS.red} alt=""
                style={{width:11,height:'auto',borderRadius:2,flexShrink:0,opacity:0.75}} />
            </div>

            {/* Win display — zero height when no win */}
            <div style={{flexShrink:0}}>
              <DetailedPayoutDisplay winInfo={lastWinInfo} playerCount={playerCount} />
            </div>

            {/* 5×2 Hand grid — fills remaining height */}
            <div style={{ flex:1, minHeight:0, display:'grid',
              gridTemplateColumns:'repeat(5,1fr)', gridTemplateRows:'repeat(2,1fr)',
              gap:2, padding:'3px 3px 2px 3px' }}>
              {displayOrder.map(hid => {
                const hand = FIXED_HANDS.find(h => h.id === hid);
                if (!hand) return null;
                return (
                  <MobileHandCard
                    key={hand.id} hand={hand}
                    isLeading={leadingHandIds.includes(hand.id)}
                    isWinner={winnerHandIds.includes(hand.id)}
                    communityCards={communityCards}
                    betAmount={pHandBets[hand.id]||0}
                    onBet={onHandBet} onRemoveBet={onRemoveHandBet}
                    gamePhase={gamePhase}
                    disabled={balance < selectedChip && !pHandBets[hand.id]}
                    disabledByConstraint={handBetCount >= 1 && !pHandBets[hand.id]}
                    onAttemptLockedBet={()=>{}}
                  />
                );
              })}
            </div>

            {/* ── Bottom action bar ── */}
            <div style={{ flexShrink:0, height:34, display:'flex', alignItems:'center',
              gap:4, padding:'0 5px',
              borderTop:'1px solid rgba(202,138,4,0.3)', background:'rgba(0,0,0,0.6)' }}>

              {/* Chips — small */}
              <div style={{display:'flex',gap:1,alignItems:'center',flexShrink:0}}>
                {CHIP_VALUES.map(v => (
                  <button key={v} onClick={()=>onSelectChip(v)}
                    style={{ lineHeight:0, border:'none', background:'transparent', padding:0, cursor:'pointer',
                      transform: selectedChip===v ? 'scale(1.18)':'scale(1)',
                      filter: selectedChip===v ? 'drop-shadow(0 0 4px rgba(251,191,36,0.9))':'none',
                      opacity: selectedChip===v ? 1:0.6, transition:'all 0.15s' }}>
                    <Chip amount={v} scale={0.36} />
                  </button>
                ))}
              </div>

              {/* Countdown */}
              <div style={{flexShrink:0}}>
                <CountdownClock timeRemaining={countdownTime} isActive={countdownActive} phase={gamePhase} />
              </div>

              <div style={{flex:1}} />

              {/* Balance */}
              <div style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0,
                padding:'2px 7px', borderRadius:6, border:'1.5px solid #eab308', background:'#000' }}>
                <span style={{fontSize:7,fontWeight:900,color:'#facc15'}}>P{pid+1}</span>
                <span style={{fontSize:11,fontWeight:900,color:'#facc15',textShadow:'0 0 5px rgba(251,191,36,0.7)'}}>
                  ${balance.toLocaleString()}
                </span>
              </div>

              {/* Clear */}
              {gamePhase==='betting' && totalBet>0 && (
                <button onClick={onClearBets} style={{flexShrink:0,padding:'2px 5px',borderRadius:4,
                  border:'1px solid rgba(239,68,68,0.5)',background:'rgba(127,29,29,0.4)',
                  color:'#fca5a5',fontSize:8,fontWeight:700,cursor:'pointer'}}>Clear</button>
              )}

              {/* Gear */}
              <button onClick={()=>setGearMenuOpen(o=>!o)}
                style={{flexShrink:0,width:24,height:24,borderRadius:5,
                  border:'1px solid rgba(234,179,8,0.5)',
                  background:gearMenuOpen?'rgba(234,179,8,0.2)':'rgba(0,0,0,0.5)',
                  color:'#fde047',display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:12,cursor:'pointer'}}>⚙️</button>
            </div>
          </div>

          {/* ════════════════════════════════════════════
              RIGHT COLUMN — 38% width
              Top: HAND RANK BOARD (~55%)
              Bottom: COLOR BOARD + RIVER (~45%)
              ════════════════════════════════════════════ */}
          <div style={{ width:'38%', flexShrink:0, display:'flex', flexDirection:'column' }}>

            {/* ── HAND RANK BOARD ── */}
            <div style={{ flex:'55 1 0', minHeight:0, display:'flex', flexDirection:'column',
              background:panelBg, borderBottom:'1.5px solid rgba(202,138,4,0.4)',
              overflow:'hidden' }}>
              {/* Header suppressed in landscape — RankBets has no header */}
              <div style={{flex:1,minHeight:0,overflow:'hidden',padding:'0 3px 3px 3px'}}>
                <RankBets
                  rankBets={pRankBets} allRankBets={rankBets} playerCount={playerCount}
                  onRankBet={onRankBet} onRemoveRankBet={onRemoveRankBet} onMoveRankBet={onMoveRankBet}
                  gamePhase={gamePhase} winningRank={winningRank} leadingRank={leadingRank}
                  disabled={balance < selectedChip} killSwitchActive={killSwitchActive}
                  handBetCount={handBetCount} maxRankSlots={maxRankSlots} rankBetCount={rankBetCount}
                  unlockedRanks={new Set()} activePlayerId={pid} activeHandIds={activeHandIds}
                  onAttemptLockedRank={()=>{}} onHoverRankRow={onSetHoveredRankRow}
                />
              </div>
            </div>

            {/* ── COLOR BOARD + RIVER LOW/HIGH ── */}
            {/* overflow visible so river touch buttons aren't clipped */}
            <div className={`${luminosityClass}`} style={{ flex:'45 1 0', minHeight:0, display:'flex',
              flexDirection:'column', background:panelBg, overflow:'visible', position:'relative' }}>
              {/* Headers suppressed — SideBets handles internally with compactLandscape */}
              <div style={{flex:1,minHeight:0,overflow:'visible',padding:'0 3px 3px 3px'}}>
                <SideBets
                  communityCards={communityCards}
                  allRedBlackBets={redBlackBets} allLowHighBets={lowHighBets}
                  redBlackBets={pRedBlackBets} lowHighBet={pLowHighBet}
                  onRedBlackBet={onRedBlackBet} onRemoveRedBlackBet={onRemoveRedBlackBet}
                  onLowHighBet={onLowHighBet} onRemoveLowHighBet={onRemoveLowHighBet}
                  gamePhase={gamePhase} winningRedBlack={winningRedBlack} winningLowHigh={winningLowHigh}
                  disabled={balance < selectedChip}
                  killSwitchActive={killSwitchActive} rankBetActive={sideBetGateOpen}
                  playerCount={playerCount} totalInvestment={totalBet}
                  hoveredRiverType={hoveredRiverType} onHoverRiver={onSetHoveredRiverType}
                  riverWinFlash={riverWinFlash} selectedChip={selectedChip}
                  hoveredRankRow={hoveredRankRow} isRankBetPlaced={isRankBetPlaced}
                  activeColorSide={activeColorSide} onColorSideConflict={onCloseColorSideAlert}
                  compactLandscape={true}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── Gear dropdown — fixed above bottom bar ── */}
        {gearMenuOpen && (
          <div style={{ position:'fixed', bottom:38, right:4, width:172, zIndex:500,
            background:'linear-gradient(160deg,rgba(20,8,0,0.98),rgba(40,15,0,0.98))',
            border:'1px solid rgba(234,179,8,0.45)', borderRadius:12, padding:'8px 0',
            boxShadow:'0 -4px 24px rgba(0,0,0,0.8)' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:'2px 12px 7px',borderBottom:'1px solid rgba(234,179,8,0.2)',marginBottom:3}}>
              <span style={{fontSize:11,fontWeight:800,color:'#fde047',letterSpacing:'0.08em',textTransform:'uppercase'}}>Settings</span>
            </div>
            {/* Board color */}
            <div style={{padding:'4px 12px'}}>
              <div style={{fontSize:9,fontWeight:700,color:'rgba(253,224,71,0.6)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4}}>Board Color</div>
              <div style={{display:'flex',gap:5}}>
                {[{id:'red',label:'Red',dot:'#dc2626'},{id:'blue',label:'Blue',dot:'#2563eb'},{id:'green',label:'Green',dot:'#16a34a'}].map(t=>(
                  <button key={t.id} onClick={()=>{if(onSetTheme)onSetTheme(t.id);setGearMenuOpen(false);}}
                    style={{flex:1,padding:'3px 2px',borderRadius:6,cursor:'pointer',fontSize:9,fontWeight:700,
                      border:boardTheme===t.id?'1.5px solid #fde047':'1px solid rgba(234,179,8,0.25)',
                      background:boardTheme===t.id?'rgba(234,179,8,0.15)':'rgba(255,255,255,0.04)',
                      color:boardTheme===t.id?'#fde047':'#94a3b8',
                      display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                    <span style={{width:10,height:10,borderRadius:'50%',background:t.dot,display:'block'}} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{borderTop:'1px solid rgba(234,179,8,0.12)',margin:'3px 0'}} />
            {/* Sound */}
            <div style={{padding:'4px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:10,fontWeight:700,color:'#cbd5e1'}}>Sound</span>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <button onClick={()=>setMuted(m=>!m)}
                  style={{width:24,height:24,borderRadius:5,border:'1px solid rgba(234,179,8,0.35)',
                    background:muted?'rgba(220,38,38,0.2)':'rgba(234,179,8,0.1)',
                    color:muted?'#f87171':'#fde047',fontSize:11,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center'}}>{muted?'🔇':'🔊'}</button>
                <input type="range" min="0" max="1" step="0.05" value={volume}
                  onChange={e=>{setVolume(parseFloat(e.target.value));setMuted(false);}}
                  style={{width:48,accentColor:'#eab308'}} />
              </div>
            </div>
            <div style={{borderTop:'1px solid rgba(234,179,8,0.12)',margin:'3px 0'}} />
            <div style={{padding:'4px 12px'}}><GameRulesModal asMenuItem /></div>
            <div style={{borderTop:'1px solid rgba(234,179,8,0.12)',margin:'3px 0'}} />
            {resetBankVisible && (<>
              <div style={{padding:'4px 12px'}}>
                <button onClick={()=>{onResetBank();setGearMenuOpen(false);}}
                  style={{width:'100%',padding:'5px 0',borderRadius:7,cursor:'pointer',
                    border:'1px solid rgba(234,179,8,0.4)',background:'rgba(234,179,8,0.08)',
                    color:'#fde047',fontSize:10,fontWeight:700}}>💰 Reset Bank</button>
              </div>
              <div style={{borderTop:'1px solid rgba(234,179,8,0.12)',margin:'3px 0'}} />
            </>)}
            <div style={{padding:'4px 12px'}}>
              <button onClick={()=>{setShowHistory(true);setGearMenuOpen(false);}}
                style={{width:'100%',padding:'5px 0',borderRadius:7,cursor:'pointer',
                  border:'1px solid rgba(234,179,8,0.4)',background:'rgba(234,179,8,0.08)',
                  color:'#fde047',fontSize:10,fontWeight:700,
                  display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>📜 Hand History</button>
            </div>
            <div style={{borderTop:'1px solid rgba(234,179,8,0.12)',margin:'3px 0'}} />
            <div style={{padding:'4px 12px'}}>
              <button onClick={()=>{if(onOpenHelp)onOpenHelp();else setShowHowToPlay(true);setGearMenuOpen(false);}}
                style={{width:'100%',padding:'5px 0',borderRadius:7,cursor:'pointer',
                  border:'1px solid rgba(234,179,8,0.4)',background:'rgba(234,179,8,0.08)',
                  color:'#fde047',fontSize:10,fontWeight:700,
                  display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>❓ How to Play</button>
            </div>
          </div>
        )}

        {/* History overlay */}
        {showHistory && (
          <div style={{position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.96)',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'9px 14px',borderBottom:'1px solid rgba(234,179,8,0.3)',
              background:'rgba(20,8,0,0.98)',flexShrink:0}}>
              <span style={{color:'#fde047',fontWeight:800,fontSize:13,letterSpacing:'0.08em',textTransform:'uppercase'}}>📜 Hand History</span>
              <button onClick={()=>setShowHistory(false)}
                style={{width:30,height:30,borderRadius:7,border:'1px solid rgba(234,179,8,0.5)',
                  background:'rgba(234,179,8,0.15)',color:'#fde047',fontSize:16,fontWeight:900,
                  cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{flex:1,minHeight:0,padding:'10px',overflowY:'auto'}}>
              <HistoryRail history={history} />
            </div>
          </div>
        )}
        <HowToPlayOverlay forceOpen={showHowToPlay} onClose={()=>setShowHowToPlay(false)} />
      </div>
    );
  }
  // ── End landscape ─────────────────────────────────────────────────────────

  return (
    <div
      className={`velvet-board w-full flex flex-col text-white overflow-hidden theme-${boardTheme || 'red'}`}
      style={{ height: '100dvh' }}
      onClick={preloadSounds}
      onTouchStart={preloadSounds}
    >
      {/* ── Alerts ── */}
      <HandBetLimitAlert isOpen={showHandLimitAlert} onClose={onCloseHandAlert} />
      <RankBetLimitAlert isOpen={showRankLimitAlert} onClose={onCloseRankAlert} currentHandBets={handBetCount} alertType={rankAlertType} maxRankSlots={maxRankSlots} />
      <RankBetLimitAlert isOpen={showCapAlert} onClose={onCloseCapAlert} alertType={capAlertType} currentHandBets={handBetCount} />
      <InsufficientFundsAlert isVisible={showInsufficientFunds} onClose={onCloseInsufficientFunds} />
      <AutoTrimToast isVisible={showAutoTrimToast} onHide={onHideAutoTrimToast} />
      <ColorSideAlert isOpen={!!showColorSideAlert} onClose={onCloseColorSideAlert} />

      {/* ── Dealer message bar — fixed height, never moves ── */}
      <div className="flex-shrink-0 px-2 pt-1.5">
        <div style={{
          height: '26px',
          minHeight: '26px',
          maxHeight: '26px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '0.4rem',
          border: '1px solid rgba(202,138,4,0.4)',
          background: 'linear-gradient(90deg, rgba(78,47,0,0.5) 0%, rgba(83,37,0,0.5) 100%)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}>
          <DealerAnnouncement message={dealerMessage} phase={gamePhase} />
        </div>
      </div>

      {/* ── Bonus Bets Unlocked — fixed overlay, floats over board, nothing moves ── */}
      {showUnlockFlash && (
        <div style={{
          position: 'fixed',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '0.6rem',
          background: 'linear-gradient(160deg, rgba(0,0,0,0.97) 0%, rgba(25,12,0,0.98) 100%)',
          border: '2px solid #eab308',
          boxShadow: '0 0 30px rgba(234,179,8,0.5)',
          animation: 'rfUnlockFadeOut 4s ease forwards',
          pointerEvents: 'none',
          padding: '14px 24px',
          minWidth: '220px',
          gap: 4,
        }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#eab308', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>🔓 Bonus Bets Unlocked</span>
          <div style={{ height: 6 }} />
          <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700, textAlign: 'center' }}>🔴 Color Board Open</span>
          <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700, textAlign: 'center' }}>🌊 River Bet Available</span>
          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>After The Turn Card</span>
        </div>
      )}

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
      <div className="flex-1 min-h-0 px-2 pt-1 pb-0 flex flex-col gap-1.5" style={{ touchAction: 'none' }}>

        {/* 10-hand grid — crypto-shuffled each round */}
        <div
          className="flex-shrink-0 relative grid gap-1"
          style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', height: '36%' }}
        >
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

        {/* Rank + Color/River — clock floats at the top boundary overlapping both */}
        <div className="flex-1 min-h-0 flex gap-1.5" style={{ position: 'relative' }}>
          {/* Clock overlaps bottom of hand grid and top of rank/color boards */}
          <div style={{
            position: 'absolute',
            top: -26,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            pointerEvents: 'none',
          }}>
            <CountdownClock timeRemaining={countdownTime} isActive={countdownActive} phase={gamePhase} />
          </div>

          {/* Rank board */}
          <div className="flex-1 min-h-0 flex flex-col border rounded-xl slot-border-dormant overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)', padding: '6px' }}>
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

        {/* Gear menu button + dropdown */}
        <div className="flex items-center gap-1 flex-shrink-0" style={{ position: 'relative' }}>
          {gamePhase === 'betting' && totalBet > 0 && (
            <button onClick={onClearBets} className="px-2 py-1 rounded-lg border border-red-700/50 bg-red-900/30 text-red-300 font-semibold" style={{ fontSize: '0.65rem' }}>
              Clear
            </button>
          )}

          {/* ⚙️ Gear button */}
          <button
            onClick={() => setGearMenuOpen(o => !o)}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(234,179,8,0.5)',
              background: gearMenuOpen ? 'rgba(234,179,8,0.2)' : 'rgba(0,0,0,0.5)',
              color: '#fde047', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 16,
            }}
          >
            ⚙️
          </button>

          {/* Gear dropdown — scrollable, pops up above */}
          {gearMenuOpen && (
            <div style={{
              position: 'absolute', bottom: '110%', right: 0,
              width: 180,
              background: 'linear-gradient(160deg, rgba(30,10,0,0.97) 0%, rgba(50,20,0,0.97) 100%)',
              border: '1px solid rgba(234,179,8,0.4)',
              borderRadius: 12, padding: '8px 0',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.7)',
              zIndex: 100,
            }}>
              {/* Header */}
              <div style={{ padding: '2px 12px 8px', borderBottom: '1px solid rgba(234,179,8,0.2)', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fde047', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Settings</span>
              </div>

              {/* COLOR THEME */}
              <div style={{ padding: '6px 12px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(253,224,71,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Board Color</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'red',   label: 'Red',   dot: '#dc2626' },
                    { id: 'blue',  label: 'Blue',  dot: '#2563eb' },
                    { id: 'green', label: 'Green', dot: '#16a34a' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => { if (onSetTheme) onSetTheme(t.id); }}
                      style={{
                        flex: 1, padding: '4px 2px', borderRadius: 6,
                        border: boardTheme === t.id ? '1.5px solid #fde047' : '1px solid rgba(234,179,8,0.25)',
                        background: boardTheme === t.id ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.04)',
                        color: boardTheme === t.id ? '#fde047' : '#94a3b8',
                        fontSize: 9, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      }}
                    >
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.dot, display: 'block', border: boardTheme === t.id ? '1.5px solid #fde047' : '1px solid rgba(255,255,255,0.2)' }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(234,179,8,0.12)', margin: '2px 0' }} />

              {/* SOUND */}
              <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>Sound</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setMuted(m => !m)}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: '1px solid rgba(234,179,8,0.35)',
                      background: muted ? 'rgba(220,38,38,0.2)' : 'rgba(234,179,8,0.1)',
                      color: muted ? '#f87171' : '#fde047',
                      fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {muted ? '🔇' : '🔊'}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={volume}
                    onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                    style={{ width: 60, accentColor: '#eab308' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(234,179,8,0.12)', margin: '2px 0' }} />

              {/* RESET BANK */}
              {resetBankVisible && (
                <div style={{ padding: '6px 12px' }}>
                  <button
                    onClick={() => { onResetBank(); setGearMenuOpen(false); }}
                    style={{
                      width: '100%', padding: '7px 0', borderRadius: 8,
                      border: '1px solid rgba(234,179,8,0.4)',
                      background: 'rgba(234,179,8,0.08)',
                      color: '#fde047', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', letterSpacing: '0.04em',
                    }}
                  >
                    💰 Reset Bank
                  </button>
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(234,179,8,0.12)', margin: '2px 0' }} />

              {/* GAME RULES */}
              <div style={{ padding: '6px 12px' }}>
                <GameRulesModal asMenuItem />
              </div>

              <div style={{ borderTop: '1px solid rgba(234,179,8,0.12)', margin: '2px 0' }} />

              {/* HISTORY RAIL */}
              <div style={{ padding: '6px 12px' }}>
                <button
                  onClick={() => { setShowHistory(true); setGearMenuOpen(false); }}
                  style={{
                    width: '100%', padding: '7px 0', borderRadius: 8,
                    border: '1px solid rgba(234,179,8,0.4)',
                    background: 'rgba(234,179,8,0.08)',
                    color: '#fde047', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  📜 Hand History
                </button>
              </div>

              <div style={{ borderTop: '1px solid rgba(234,179,8,0.12)', margin: '2px 0' }} />

              {/* HOW TO PLAY */}
              <div style={{ padding: '6px 12px' }}>
                <button
                  onClick={() => {
                    if (onOpenHelp) onOpenHelp();
                    else setShowHowToPlay(true);
                    setGearMenuOpen(false);
                  }}
                  style={{
                    width: '100%', padding: '7px 0', borderRadius: 8,
                    border: '1px solid rgba(234,179,8,0.4)',
                    background: 'rgba(234,179,8,0.08)',
                    color: '#fde047', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  ❓ How to Play
                </button>
              </div>

            </div>
          )}

          {/* ── How To Play Overlay ── */}
          <HowToPlayOverlay
            forceOpen={showHowToPlay}
            onClose={() => setShowHowToPlay(false)}
          />

          {/* ── History Rail Overlay ── */}
          {showHistory && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Header bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(234,179,8,0.3)',
                background: 'rgba(20,8,0,0.95)',
                flexShrink: 0,
              }}>
                <span style={{ color: '#fde047', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  📜 Hand History
                </span>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid rgba(234,179,8,0.5)',
                    background: 'rgba(234,179,8,0.15)',
                    color: '#fde047', fontSize: 18, fontWeight: 900,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Rail content */}
              <div style={{ flex: 1, minHeight: 0, padding: '12px 12px', overflowY: 'auto' }}>
                <HistoryRail history={history} />
              </div>
            </div>
          )}
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