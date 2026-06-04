import React, { useState, useEffect } from 'react';
import { VERSIONS_STORAGE_KEY, DEFAULT_VERSIONS } from '@/hooks/useGameVersions';

const STORAGE_KEY = 'rfth_howtoplay_seen';

function loadVersions() {
  try {
    const saved = localStorage.getItem(VERSIONS_STORAGE_KEY);
    return saved ? { ...DEFAULT_VERSIONS, ...JSON.parse(saved) } : { ...DEFAULT_VERSIONS };
  } catch {
    return { ...DEFAULT_VERSIONS };
  }
}

function buildSteps(v) {
  const maxHands       = v.maxCardHands ?? 1;
  const maxRanks       = v.maxRankSlots ?? 1;
  const rankLockAt     = v.rankLockThreshold ?? 1;
  const handLockAt     = v.handLockThreshold ?? 1;
  const colorBothSides = v.colorBothSides ?? false;

  const handsLabel = maxHands === 1 ? '1 hand' : `up to ${maxHands} hands`;
  const ranksLabel = maxRanks === 1 ? '1 Rank bet' : `up to ${maxRanks} Rank bets`;

  return [
    {
      step: 1,
      title: 'Select Your Hand',
      icon: '\uD83C\uDCCF',
      description: `Pick ${handsLabel} from the 10 fixed hands on the board. Place your Hand Bet — this is required to play.`,
      highlight: maxHands === 1
        ? 'One hand per round. Your Hand Bet is the foundation of every round.'
        : `You can select up to ${maxHands} hands. The hand grid locks once you reach ${handLockAt} selection${handLockAt !== 1 ? 's' : ''}.`,
    },
    {
      step: 2,
      title: 'Unlock Your Bonus Bets',
      icon: '\uD83D\uDD13',
      description: `Place ${ranksLabel} equal to your Hand Bet total to unlock two bonus markets: the Color Board Bet and the River Bet. The Rank board locks if you select ${rankLockAt} or more hands.`,
      highlight: rankLockAt === 1
        ? `Rank Bet unlocks Color Board AND River Bet. Rank is only available with 1 hand selected.`
        : `Rank Bet unlocks Color Board AND River Bet. Rank locks when you select ${rankLockAt} or more hands.`,
    },
    {
      step: 3,
      title: 'Place Your Color Board Bet',
      icon: '\uD83D\uDD34',
      description: `Before the Flop is dealt, bet on whether the 5 community cards will show more Red or more Black. Choose 3, 4, or 5 cards of one color. This bet resolves purely on color distribution — independent of hand ranking.`,
      highlight: colorBothSides
        ? '3 Red wins only if exactly 3 Red cards appear. You may bet both Red AND Black in the same round.'
        : '3 Red wins only if exactly 3 Red cards appear. You may only bet Red OR Black — not both.',
    },
    {
      step: 4,
      title: 'The River Bet Opens',
      icon: '\uD83C\uDF0A',
      description: 'After the Turn card is revealed, the River Bet window opens. Based on the 4 community cards showing, decide whether the 5th and final card will be High (8 or above) or Low (7 or below).',
      highlight: 'This is your only bet placed after cards are dealt. One decision. One card.',
    },
    {
      step: 5,
      title: 'All Bets Resolve',
      icon: '\uD83D\uDCB0',
      description: 'The River card is dealt. All markets settle simultaneously — your Hand and Rank result, your Color Board result, and your River result. A new round begins automatically.',
      highlight: 'If the Board beats all player hands, hand bets are collected. Color Board and River bets resolve independently.',
    },
  ];
}

export default function HowToPlayOverlay({ forceOpen = false, onClose }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(0);
  const [steps, setSteps]     = useState(() => buildSteps(loadVersions()));

  useEffect(() => {
    if (forceOpen) {
      setSteps(buildSteps(loadVersions()));
      setStep(0);
      setVisible(true);
      return;
    }
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setSteps(buildSteps(loadVersions()));
        setVisible(true);
      }
    } catch {
      setSteps(buildSteps(loadVersions()));
      setVisible(true);
    }
  }, [forceOpen]);

  const handleClose = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setVisible(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else handleClose();
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!visible) return null;

  const current = steps[step];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={{
        background: 'linear-gradient(160deg, rgba(20,10,0,0.98) 0%, rgba(40,20,0,0.98) 100%)',
        border: '1.5px solid rgba(234,179,8,0.5)',
        borderRadius: 18,
        padding: '32px 36px',
        maxWidth: 480,
        width: '90%',
        boxShadow: '0 8px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(234,179,8,0.1)',
        position: 'relative',
      }}>
        {/* Skip button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'transparent', border: 'none',
            color: 'rgba(253,224,71,0.4)', fontSize: 12,
            cursor: 'pointer', fontWeight: 700, letterSpacing: '0.06em',
          }}
        >
          SKIP ✕
        </button>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, justifyContent: 'center' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i === step ? '#eab308' : i < step ? 'rgba(234,179,8,0.4)' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 12, lineHeight: 1 }}>
          {current.icon}
        </div>

        {/* Step label */}
        <div style={{
          textAlign: 'center', fontSize: 10, fontWeight: 800,
          color: 'rgba(234,179,8,0.6)', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginBottom: 6,
        }}>
          Step {current.step} of {steps.length}
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center', fontSize: 22, fontWeight: 800,
          color: '#ffffff', marginBottom: 14, lineHeight: 1.2,
        }}>
          {current.title}
        </div>

        {/* Description */}
        <div style={{
          fontSize: 14, color: '#cbd5e1', lineHeight: 1.65,
          textAlign: 'center', marginBottom: 16,
        }}>
          {current.description}
        </div>

        {/* Highlight bar */}
        <div style={{
          background: 'rgba(234,179,8,0.08)',
          border: '1px solid rgba(234,179,8,0.25)',
          borderRadius: 8, padding: '10px 14px',
          fontSize: 12, color: '#fde047', fontWeight: 700,
          textAlign: 'center', marginBottom: 28,
          lineHeight: 1.5,
        }}>
          {current.highlight}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {step > 0 && (
            <button
              onClick={handleBack}
              style={{
                padding: '10px 22px', borderRadius: 9,
                border: '1px solid rgba(234,179,8,0.35)',
                background: 'transparent',
                color: '#fde047', fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              padding: '10px 28px', borderRadius: 9,
              border: 'none',
              background: 'linear-gradient(135deg, #b45309, #eab308)',
              color: '#000', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', flex: step === 0 ? 1 : 'none',
              letterSpacing: '0.04em',
            }}
          >
            {step < steps.length - 1 ? 'Next →' : "Let's Play!"}
          </button>
        </div>
      </div>
    </div>
  );
}
