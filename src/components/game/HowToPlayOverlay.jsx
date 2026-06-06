import React, { useState, useEffect } from 'react';
import { rulesHaveChanged, markRulesSeen } from '@/lib/rulesHash';

function buildSteps(v) {
  const maxHands       = v.maxCardHands ?? 1;
  const maxRanks       = v.maxRankSlots ?? 1;
  const rankLockAt     = v.rankLockThreshold ?? 1;
  const colorBothSides = v.colorBothSides ?? false;

  const handsLabel = maxHands === 1 ? '1 hand' : `up to ${maxHands} hands`;
  const ranksLabel = maxRanks === 1 ? '1 Rank bet' : `up to ${maxRanks} Rank bets`;

  return [
    {
      step: 1,
      title: 'Select Your Hand',
      icon: '🃏',
      description: `Pick ${handsLabel} from the 10 fixed hands on the board. Place your Hand Bet — this is required to play.`,
      highlight: maxHands === 1
        ? 'One hand per round. Your Hand Bet is the foundation of every round.'
        : `You can select up to ${maxHands} hands. The hand grid locks once you reach ${maxHands} selection${maxHands !== 1 ? 's' : ''}.`,
    },
    {
      step: 2,
      title: 'Unlock Your Bonus Bets',
      icon: '🔓',
      description: `Place ${ranksLabel} equal to your Hand Bet total to unlock two bonus markets: the Color Board Bet and the River Bet. The Rank board locks if you select ${rankLockAt} or more hands.`,
      highlight: rankLockAt === 1
        ? `Rank Bet unlocks Color Board AND River Bet. Rank is only available with 1 hand selected.`
        : `Rank Bet unlocks Color Board AND River Bet. Rank locks when you select ${rankLockAt} or more hands.`,
    },
    {
      step: 3,
      title: 'Place Your Color Board Bet',
      icon: '🔴',
      description: `Before the Flop is dealt, bet on whether the 5 community cards will show more Red or more Black. Choose 3, 4, or 5 cards of one color. This bet resolves purely on color distribution — independent of hand ranking.`,
      highlight: colorBothSides
        ? '3 Red wins only if exactly 3 Red cards appear. You may bet both Red AND Black in the same round.'
        : '3 Red wins only if exactly 3 Red cards appear. You may only bet Red OR Black — not both.',
    },
    {
      step: 4,
      title: 'The River Bet Opens',
      icon: '🌊',
      description: 'After the Turn card is revealed, the River Bet window opens. Based on the 4 community cards showing, decide whether the 5th and final card will be High (8 or above) or Low (7 or below).',
      highlight: 'This is your only bet placed after cards are dealt. One decision. One card.',
    },
    {
      step: 5,
      title: 'All Bets Resolve',
      icon: '💰',
      description: 'The River card is dealt. All markets settle simultaneously — your Hand and Rank result, your Color Board result, and your River result. A new round begins automatically.',
      highlight: 'If the Board beats all player hands, hand bets are collected. Color Board and River bets resolve independently.',
    },
    {
      step: 6,
      title: 'Multi-Hand Payout Reduction',
      icon: '📉',
      description: 'Betting more hands in a single round adjusts your payout odds. Payouts are at full value for 1–2 hands. A reduction applies from 3 hands onward, peaking at 5–6 hands, then decreasing again at higher counts.',
      highlight: 'Betting 1 or 2 hands always pays full odds. The reduction peaks at 5–6 hands — the exploit zone — then eases off as you spread across more hands.',
    },
  ];
}

export default function HowToPlayOverlay({ versions = {}, versionsReady = false, forceOpen = false, onClose, suppress = false }) {
  const [visible,  setVisible]  = useState(false);
  const [step,     setStep]     = useState(0);
  const [steps,    setSteps]    = useState([]);
  const [updated,  setUpdated]  = useState(false);   // true = rules changed since last visit

  // ── Auto-show guard ──────────────────────────────────────────────────────
  // Uses sessionStorage (NOT a ref) so the flag survives React remounts,
  // iframe reloads from code syncs, and recovery modal cycles — all within
  // the same browser tab session.
  // Clears automatically when the tab is closed or a new session starts,
  // so players still see the overlay fresh each time they open the app.
  const SESSION_SHOWN_KEY = 'rfth_htp_shown'; // localStorage key with 24h expiry

  // ── Auto-show on first load (once per page session) ───────────────────────
  useEffect(() => {
    // IMPORTANT: Do not run until DB versions have loaded.
    // versions starts as {} (default prop). If we check before the DB responds
    // we compare defaults-vs-defaults and always get "no change" — overlay never fires.
    // versionsReady flips to true only after loadVersionsFromDB() resolves.
    if (!versionsReady && !forceOpen) return;

    // Use DB-loaded versions passed in as prop — never read localStorage here.
    // This guarantees every device compares against the same server values.
    const changed = rulesHaveChanged(versions);
    setSteps(buildSteps(versions));
    setUpdated(changed);
    setStep(0);

    // Forced open (user tapped Help button) — always show.
    if (forceOpen) {
      setVisible(true);
      return;
    }

    if (suppress) return;

    // If rules have changed since last acknowledgement, ALWAYS show —
    // bypass the 24h guard so no device ever misses a config update.
    if (changed) {
      try { localStorage.setItem(SESSION_SHOWN_KEY, JSON.stringify({ ts: Date.now() })); } catch {}
      setVisible(true);
      return;
    }

    // No rule changes — apply 24h guard so the overlay doesn't reappear
    // on every single refresh once the player has seen it today.
    const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
    try {
      const raw = localStorage.getItem(SESSION_SHOWN_KEY);
      if (raw) {
        const { ts } = JSON.parse(raw);
        if (Date.now() - ts < EXPIRY_MS) {
          return; // Already shown within last 24h and no changes — skip
        }
      }
    } catch {}

    try { localStorage.setItem(SESSION_SHOWN_KEY, JSON.stringify({ ts: Date.now() })); } catch {}
    setVisible(true);
  }, [forceOpen, suppress, versions, versionsReady]);

  const handleClose = () => {
    markRulesSeen(versions);  // stamp the DB-versions hash so warning clears next time
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

  // Never render while suppressed (e.g. recovery check pending or recovery modal open)
  if (suppress || !visible || steps.length === 0) return null;

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
        border: `1.5px solid ${updated ? 'rgba(251,146,60,0.7)' : 'rgba(234,179,8,0.5)'}`,
        borderRadius: 18,
        padding: '28px 32px 32px',
        maxWidth: 480,
        width: '90%',
        boxShadow: '0 8px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(234,179,8,0.1)',
        position: 'relative',
      }}>

        {/* ── Rules-updated warning banner ── */}
        {updated && (
          <div style={{
            background: 'rgba(251,146,60,0.12)',
            border: '1px solid rgba(251,146,60,0.45)',
            borderRadius: 10,
            padding: '9px 14px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ color: '#fb923c', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                Rules Updated
              </div>
              <div style={{ color: '#fed7aa', fontSize: 11, lineHeight: 1.5 }}>
                The game settings or odds have changed since your last visit. Please review the steps below before playing.
              </div>
            </div>
          </div>
        )}

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
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, justifyContent: 'center' }}>
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
