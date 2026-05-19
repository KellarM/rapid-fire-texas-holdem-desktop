import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, Shield, SkipForward, FileDown, FileText, Trash2, Save, Timer, Award } from 'lucide-react';
import { runBetAuditWithAbort } from '@/lib/workerBridge';
import { CARDED_HAND_PAYOUTS, HAND_RANK_PAYOUTS, COLOR_BOARD_PAYOUTS, LOW_HIGH_PAYOUT, RIVER_STATE_PAYOUTS } from '@/lib/payoutConstants';
import { PER_HAND_RANK_PAYOUTS } from '@/lib/perHandRankPayouts';
import { jsPDF } from 'jspdf';
import { base44 } from '@/api/base44Client';

const HAND_LABELS = {
  1:'Hand 1 — A♦10♥', 2:'Hand 2 — K♣K♠', 3:'Hand 3 — Q♣J♠', 4:'Hand 4 — Q♠10♠',
  5:'Hand 5 — J♣9♣', 6:'Hand 6 — 8♦6♦', 7:'Hand 7 — 7♦7♠', 8:'Hand 8 — 4♥2♥',
  9:'Hand 9 — 3♣3♥', 10:'Hand 10 — A♥5♦',
};

// Build per-hand rank bets from PER_HAND_RANK_PAYOUTS
const PER_HAND_RANK_BETS = [];
for (let handId = 1; handId <= 10; handId++) {
  const ranks = PER_HAND_RANK_PAYOUTS[handId] || {};
  for (const rankName of Object.keys(ranks)) {
    PER_HAND_RANK_BETS.push({
      betType: 'perHandRank',
      betKey: `${handId}:${rankName}`,
      label: `${HAND_LABELS[handId]} / ${rankName}`,
      group: 'Hand Ranks',
      handId,
      rankName,
    });
  }
}

const ALL_BETS = [
  { betType:'hand', betKey:'1',  label:'Hand 1 — A♦10♥',  group:'Carded Hands' },
  { betType:'hand', betKey:'2',  label:'Hand 2 — K♣K♠',   group:'Carded Hands' },
  { betType:'hand', betKey:'3',  label:'Hand 3 — Q♣J♠',   group:'Carded Hands' },
  { betType:'hand', betKey:'4',  label:'Hand 4 — Q♠10♠',  group:'Carded Hands' },
  { betType:'hand', betKey:'5',  label:'Hand 5 — J♣9♣',   group:'Carded Hands' },
  { betType:'hand', betKey:'6',  label:'Hand 6 — 8♦6♦',   group:'Carded Hands' },
  { betType:'hand', betKey:'7',  label:'Hand 7 — 7♦7♠',   group:'Carded Hands' },
  { betType:'hand', betKey:'8',  label:'Hand 8 — 4♥2♥',   group:'Carded Hands' },
  { betType:'hand', betKey:'9',  label:'Hand 9 — 3♣3♥',   group:'Carded Hands' },
  { betType:'hand', betKey:'10', label:'Hand 10 — A♥5♦',  group:'Carded Hands' },
  ...PER_HAND_RANK_BETS,
  { betType:'color', betKey:'3R', label:'3 Red (exact)',   group:'Color Board' },
  { betType:'color', betKey:'3B', label:'3 Black (exact)',  group:'Color Board' },
  { betType:'color', betKey:'4R', label:'4 Red (exact)',   group:'Color Board' },
  { betType:'color', betKey:'4B', label:'4 Black (exact)',  group:'Color Board' },
  { betType:'color', betKey:'5R', label:'5 Red (exact)',   group:'Color Board' },
  { betType:'color', betKey:'5B', label:'5 Black (exact)',  group:'Color Board' },
  // River Board — state-dependent payouts (5 board states × 2 directions)
  { betType:'lhState', betKey:'2L2H:LOW',  label:'River 2L/2H — LOW',  group:'River Board States' },
  { betType:'lhState', betKey:'2L2H:HIGH', label:'River 2L/2H — HIGH', group:'River Board States' },
  { betType:'lhState', betKey:'3L1H:LOW',  label:'River 3L/1H — LOW',  group:'River Board States' },
  { betType:'lhState', betKey:'3L1H:HIGH', label:'River 3L/1H — HIGH', group:'River Board States' },
  { betType:'lhState', betKey:'1L3H:LOW',  label:'River 1L/3H — LOW',  group:'River Board States' },
  { betType:'lhState', betKey:'1L3H:HIGH', label:'River 1L/3H — HIGH', group:'River Board States' },
  { betType:'lhState', betKey:'4L0H:LOW',  label:'River 4L/0H — LOW',  group:'River Board States' },
  { betType:'lhState', betKey:'4L0H:HIGH', label:'River 4L/0H — HIGH', group:'River Board States' },
  { betType:'lhState', betKey:'0L4H:LOW',  label:'River 0L/4H — LOW',  group:'River Board States' },
  { betType:'lhState', betKey:'0L4H:HIGH', label:'River 0L/4H — HIGH', group:'River Board States' },
];

const GROUPS = ['Carded Hands', 'Hand Ranks', 'Color Board', 'River Board States'];

const PLAIN_LABELS = {
  'hand:1':  'Hand 1 - A(Dia)/10(Hrt)',
  'hand:2':  'Hand 2 - K(Clu)/K(Spa)',
  'hand:3':  'Hand 3 - Q(Clu)/J(Spa)',
  'hand:4':  'Hand 4 - Q(Spa)/10(Spa)',
  'hand:5':  'Hand 5 - J(Clu)/9(Clu)',
  'hand:6':  'Hand 6 - 8(Dia)/6(Dia)',
  'hand:7':  'Hand 7 - 7(Dia)/7(Spa)',
  'hand:8':  'Hand 8 - 4(Hrt)/2(Hrt)',
  'hand:9':  'Hand 9 - 3(Clu)/3(Hrt)',
  'hand:10': 'Hand 10 - A(Hrt)/5(Dia)',
};
function plainLabel(bet) {
  return PLAIN_LABELS[`${bet.betType}:${bet.betKey}`] || bet.label;
}

function getLivePayout(betType, betKey) {
  if (betType==='hand')  return CARDED_HAND_PAYOUTS[parseInt(betKey)-1];
  if (betType==='rank')  return HAND_RANK_PAYOUTS[betKey];
  if (betType==='perHandRank') {
    const colonIdx = betKey.indexOf(':');
    const handId = parseInt(betKey.slice(0, colonIdx));
    const rankName = betKey.slice(colonIdx + 1);
    return PER_HAND_RANK_PAYOUTS[handId]?.[rankName] ?? null;
  }
  if (betType==='color') return COLOR_BOARD_PAYOUTS[betKey];
  return LOW_HIGH_PAYOUT;
}

const MODULES = [
  {
    id: 'quick',
    name: 'Quick Check',
    rounds: 100_000,
    standard: 'Internal Pre-Flight',
    description: '100K rounds/bet (Card Hands, Color, River) · 100K card wins/bet (Hand Ranks) — fast sanity check. Color Board uses exact-match rule.',
    rtpLow: 93, rtpHigh: 99,
    badge: 'bg-slate-700 text-slate-300',
    accentColor: 'border-slate-500',
  },
  {
    id: 'presubmission',
    name: 'Pre-Submission',
    rounds: 500_000,
    standard: 'House Internal Standard',
    description: '500K rounds/bet (Card Hands, Color, River) · 500K card wins/bet (Hand Ranks) — internal compliance gate. Color Board uses exact-match rule.',
    rtpLow: 94, rtpHigh: 98.5,
    badge: 'bg-blue-900/40 text-blue-300',
    accentColor: 'border-blue-600',
  },
  {
    id: 'gli',
    name: 'GLI / BMM',
    rounds: 1_000_000,
    standard: 'GLI-11 / BMM Technical',
    description: '1M rounds/bet (Card Hands, Color, River) · 1M card wins/bet (Hand Ranks) — GLI-11 / BMM depth. Color Board uses exact-match rule.',
    rtpLow: 95, rtpHigh: 98,
    badge: 'bg-amber-900/40 text-amber-300',
    accentColor: 'border-amber-600',
  },
  {
    id: 'full',
    name: 'Full Certification',
    rounds: 2_000_000,
    standard: 'eCOGRA / Full Certification',
    description: '2M rounds/bet (Card Hands, Color, River) · 2M card wins/bet (Hand Ranks) — eCOGRA / Full Certification depth. Color Board uses exact-match rule.',
    rtpLow: 95, rtpHigh: 98,
    badge: 'bg-green-900/40 text-green-300',
    accentColor: 'border-green-600',
  },

// ── Pre-loaded audit results from RapidFire_CertAudit_2026-05-14 ────────────
// Carded Hands & Hand Ranks: PASS (from doc). Color & River: FAIL (re-run needed).
const SEED_AUDIT_DATA = {
  "quick": {
    "hand:H1": {
      "wins": 4531,
      "perHandRankHandWins": null,
      "actualRounds": 100000,
      "winFrequency": 4.531,
      "rtp": 96.51,
      "liveOdds": "20.3:1",
      "for965": "20.3:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H2": {
      "wins": 17807,
      "perHandRankHandWins": null,
      "actualRounds": 100000,
      "winFrequency": 17.807,
      "rtp": 95.27,
      "liveOdds": "4.35:1",
      "for965": "4.42:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H3": {
      "wins": 5720,
      "perHandRankHandWins": null,
      "actualRounds": 100000,
      "winFrequency": 5.72,
      "rtp": 96.1,
      "liveOdds": "15.8:1",
      "for965": "15.87:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H4": {
      "wins": 9501,
      "perHandRankHandWins": null,
      "actualRounds": 100000,
      "winFrequency": 9.501,
      "rtp": 95.01,
      "liveOdds": "9:1",
      "for965": "9.16:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H5": {
      "wins": 11511,
      "perHandRankHandWins": null,
      "actualRounds": 100000,
      "winFrequency": 11.511,
      "rtp": 96.69,
      "liveOdds": "7.4:1",
      "for965": "7.38:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H6": {
      "wins": 14064,
      "perHandRankHandWins": null,
      "actualRounds": 100000,
      "winFrequency": 14.064,
      "rtp": 97.04,
      "liveOdds": "5.9:1",
      "for965": "5.86:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H7": {
      "wins": 12141,
      "perHandRankHandWins": null,
      "actualRounds": 100000,
      "winFrequency": 12.141,
      "rtp": 94.7,
      "liveOdds": "6.8:1",
      "for965": "6.95:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H8": {
      "wins": 11515,
      "perHandRankHandWins": null,
      "actualRounds": 100000,
      "winFrequency": 11.515,
      "rtp": 95.57,
      "liveOdds": "7.3:1",
      "for965": "7.38:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H9": {
      "wins": 9464,
      "perHandRankHandWins": null,
      "actualRounds": 100000,
      "winFrequency": 9.464,
      "rtp": 95.59,
      "liveOdds": "9.1:1",
      "for965": "9.2:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H10": {
      "wins": 5638,
      "perHandRankHandWins": null,
      "actualRounds": 100000,
      "winFrequency": 5.638,
      "rtp": 94.72,
      "liveOdds": "15.8:1",
      "for965": "16.12:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Full House": {
      "wins": 25013,
      "perHandRankHandWins": 100000,
      "actualRounds": 2225301,
      "winFrequency": 25.013,
      "rtp": 96.55,
      "liveOdds": "2.86:1",
      "for965": "2.86:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Two Pair": {
      "wins": 22838,
      "perHandRankHandWins": 100000,
      "actualRounds": 2224445,
      "winFrequency": 22.838,
      "rtp": 98.2,
      "liveOdds": "3.3:1",
      "for965": "3.23:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Straight": {
      "wins": 22232,
      "perHandRankHandWins": 100000,
      "actualRounds": 2233906,
      "winFrequency": 22.232,
      "rtp": 95.82,
      "liveOdds": "3.31:1",
      "for965": "3.34:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Flush": {
      "wins": 14907,
      "perHandRankHandWins": 100000,
      "actualRounds": 2225197,
      "winFrequency": 14.907,
      "rtp": 97.64,
      "liveOdds": "5.55:1",
      "for965": "5.47:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Three of a Kind": {
      "wins": 10530,
      "perHandRankHandWins": 100000,
      "actualRounds": 2229063,
      "winFrequency": 10.53,
      "rtp": 96.45,
      "liveOdds": "8.16:1",
      "for965": "8.16:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:One Pair": {
      "wins": 3198,
      "perHandRankHandWins": 100000,
      "actualRounds": 2228924,
      "winFrequency": 3.198,
      "rtp": 93.38,
      "liveOdds": "28.2:1",
      "for965": "29.18:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Full House": {
      "wins": 41344,
      "perHandRankHandWins": 100000,
      "actualRounds": 555143,
      "winFrequency": 41.344,
      "rtp": 96.75,
      "liveOdds": "1.34:1",
      "for965": "1.33:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Three of a Kind": {
      "wins": 36850,
      "perHandRankHandWins": 100000,
      "actualRounds": 556330,
      "winFrequency": 36.85,
      "rtp": 96.92,
      "liveOdds": "1.63:1",
      "for965": "1.62:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Four of a Kind": {
      "wins": 11326,
      "perHandRankHandWins": 100000,
      "actualRounds": 558326,
      "winFrequency": 11.326,
      "rtp": 97.74,
      "liveOdds": "7.63:1",
      "for965": "7.52:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Flush": {
      "wins": 6961,
      "perHandRankHandWins": 100000,
      "actualRounds": 555104,
      "winFrequency": 6.961,
      "rtp": 95.16,
      "liveOdds": "12.67:1",
      "for965": "12.86:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:One Pair": {
      "wins": 2589,
      "perHandRankHandWins": 100000,
      "actualRounds": 555232,
      "winFrequency": 2.589,
      "rtp": 98.49,
      "liveOdds": "37.04:1",
      "for965": "36.27:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Straight": {
      "wins": 1335,
      "perHandRankHandWins": 100000,
      "actualRounds": 555860,
      "winFrequency": 1.335,
      "rtp": 94.78,
      "liveOdds": "70:1",
      "for965": "71.28:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Straight": {
      "wins": 55825,
      "perHandRankHandWins": 100000,
      "actualRounds": 1761666,
      "winFrequency": 55.825,
      "rtp": 97.14,
      "liveOdds": "0.74:1",
      "for965": "0.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Full House": {
      "wins": 18266,
      "perHandRankHandWins": 100000,
      "actualRounds": 1756681,
      "winFrequency": 18.266,
      "rtp": 96.63,
      "liveOdds": "4.29:1",
      "for965": "4.28:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Two Pair": {
      "wins": 15591,
      "perHandRankHandWins": 100000,
      "actualRounds": 1752749,
      "winFrequency": 15.591,
      "rtp": 96.2,
      "liveOdds": "5.17:1",
      "for965": "5.19:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Three of a Kind": {
      "wins": 10380,
      "perHandRankHandWins": 100000,
      "actualRounds": 1767328,
      "winFrequency": 10.38,
      "rtp": 94.98,
      "liveOdds": "8.15:1",
      "for965": "8.3:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Flush": {
      "wins": 54788,
      "perHandRankHandWins": 100000,
      "actualRounds": 1041888,
      "winFrequency": 54.788,
      "rtp": 95.88,
      "liveOdds": "0.75:1",
      "for965": "0.76:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Straight": {
      "wins": 31697,
      "perHandRankHandWins": 100000,
      "actualRounds": 1043026,
      "winFrequency": 31.697,
      "rtp": 95.72,
      "liveOdds": "2.02:1",
      "for965": "2.04:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Full House": {
      "wins": 9858,
      "perHandRankHandWins": 100000,
      "actualRounds": 1040736,
      "winFrequency": 9.858,
      "rtp": 97.99,
      "liveOdds": "8.94:1",
      "for965": "8.79:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Two Pair": {
      "wins": 3614,
      "perHandRankHandWins": 100000,
      "actualRounds": 1047731,
      "winFrequency": 3.614,
      "rtp": 94.54,
      "liveOdds": "25.45:1",
      "for965": "25.7:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Flush": {
      "wins": 45708,
      "perHandRankHandWins": 100000,
      "actualRounds": 871995,
      "winFrequency": 45.708,
      "rtp": 96.44,
      "liveOdds": "1.11:1",
      "for965": "1.11:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Straight": {
      "wins": 21393,
      "perHandRankHandWins": 100000,
      "actualRounds": 870084,
      "winFrequency": 21.393,
      "rtp": 96.91,
      "liveOdds": "3.53:1",
      "for965": "3.51:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Full House": {
      "wins": 16679,
      "perHandRankHandWins": 100000,
      "actualRounds": 869003,
      "winFrequency": 16.679,
      "rtp": 95.74,
      "liveOdds": "4.74:1",
      "for965": "4.79:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Three of a Kind": {
      "wins": 8022,
      "perHandRankHandWins": 100000,
      "actualRounds": 872546,
      "winFrequency": 8.022,
      "rtp": 94.74,
      "liveOdds": "10.81:1",
      "for965": "11.03:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Two Pair": {
      "wins": 4525,
      "perHandRankHandWins": 100000,
      "actualRounds": 872765,
      "winFrequency": 4.525,
      "rtp": 96.16,
      "liveOdds": "20.25:1",
      "for965": "20.33:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Four of a Kind": {
      "wins": 1720,
      "perHandRankHandWins": 100000,
      "actualRounds": 867926,
      "winFrequency": 1.72,
      "rtp": 94.6,
      "liveOdds": "54:1",
      "for965": "55.1:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Flush": {
      "wins": 37795,
      "perHandRankHandWins": 100000,
      "actualRounds": 716416,
      "winFrequency": 37.795,
      "rtp": 96.76,
      "liveOdds": "1.56:1",
      "for965": "1.55:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Straight": {
      "wins": 21391,
      "perHandRankHandWins": 100000,
      "actualRounds": 717024,
      "winFrequency": 21.391,
      "rtp": 96.47,
      "liveOdds": "3.51:1",
      "for965": "3.51:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Full House": {
      "wins": 20397,
      "perHandRankHandWins": 100000,
      "actualRounds": 713650,
      "winFrequency": 20.397,
      "rtp": 97.5,
      "liveOdds": "3.78:1",
      "for965": "3.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Three of a Kind": {
      "wins": 11057,
      "perHandRankHandWins": 100000,
      "actualRounds": 715145,
      "winFrequency": 11.057,
      "rtp": 96.53,
      "liveOdds": "7.73:1",
      "for965": "7.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Two Pair": {
      "wins": 6249,
      "perHandRankHandWins": 100000,
      "actualRounds": 719846,
      "winFrequency": 6.249,
      "rtp": 94.55,
      "liveOdds": "14.13:1",
      "for965": "14.44:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Four of a Kind": {
      "wins": 2868,
      "perHandRankHandWins": 100000,
      "actualRounds": 715995,
      "winFrequency": 2.868,
      "rtp": 96.02,
      "liveOdds": "32.48:1",
      "for965": "32.65:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Full House": {
      "wins": 44304,
      "perHandRankHandWins": 100000,
      "actualRounds": 805180,
      "winFrequency": 44.304,
      "rtp": 96.14,
      "liveOdds": "1.17:1",
      "for965": "1.18:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Three of a Kind": {
      "wins": 31243,
      "perHandRankHandWins": 100000,
      "actualRounds": 801942,
      "winFrequency": 31.243,
      "rtp": 97.17,
      "liveOdds": "2.11:1",
      "for965": "2.09:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Four of a Kind": {
      "wins": 15865,
      "perHandRankHandWins": 100000,
      "actualRounds": 810026,
      "winFrequency": 15.865,
      "rtp": 95.82,
      "liveOdds": "5.04:1",
      "for965": "5.08:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Straight": {
      "wins": 8214,
      "perHandRankHandWins": 100000,
      "actualRounds": 803614,
      "winFrequency": 8.214,
      "rtp": 96.02,
      "liveOdds": "10.69:1",
      "for965": "10.75:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Flush": {
      "wins": 44389,
      "perHandRankHandWins": 100000,
      "actualRounds": 858777,
      "winFrequency": 44.389,
      "rtp": 96.32,
      "liveOdds": "1.17:1",
      "for965": "1.17:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Full House": {
      "wins": 15754,
      "perHandRankHandWins": 100000,
      "actualRounds": 860281,
      "winFrequency": 15.754,
      "rtp": 97.04,
      "liveOdds": "5.16:1",
      "for965": "5.13:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Straight": {
      "wins": 14344,
      "perHandRankHandWins": 100000,
      "actualRounds": 855314,
      "winFrequency": 14.344,
      "rtp": 94.24,
      "liveOdds": "5.57:1",
      "for965": "5.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Three of a Kind": {
      "wins": 14375,
      "perHandRankHandWins": 100000,
      "actualRounds": 861217,
      "winFrequency": 14.375,
      "rtp": 96.31,
      "liveOdds": "5.7:1",
      "for965": "5.71:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Two Pair": {
      "wins": 7283,
      "perHandRankHandWins": 100000,
      "actualRounds": 854844,
      "winFrequency": 7.283,
      "rtp": 97.81,
      "liveOdds": "12.43:1",
      "for965": "12.25:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Four of a Kind": {
      "wins": 3481,
      "perHandRankHandWins": 100000,
      "actualRounds": 860152,
      "winFrequency": 3.481,
      "rtp": 98.51,
      "liveOdds": "27.3:1",
      "for965": "26.72:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Full House": {
      "wins": 42112,
      "perHandRankHandWins": 100000,
      "actualRounds": 1050168,
      "winFrequency": 42.112,
      "rtp": 96.02,
      "liveOdds": "1.28:1",
      "for965": "1.29:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Three of a Kind": {
      "wins": 30151,
      "perHandRankHandWins": 100000,
      "actualRounds": 1046069,
      "winFrequency": 30.151,
      "rtp": 96.78,
      "liveOdds": "2.21:1",
      "for965": "2.2:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Four of a Kind": {
      "wins": 20823,
      "perHandRankHandWins": 100000,
      "actualRounds": 1048930,
      "winFrequency": 20.823,
      "rtp": 96.41,
      "liveOdds": "3.63:1",
      "for965": "3.63:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Straight": {
      "wins": 6120,
      "perHandRankHandWins": 100000,
      "actualRounds": 1045274,
      "winFrequency": 6.12,
      "rtp": 95.47,
      "liveOdds": "14.6:1",
      "for965": "14.77:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Full House": {
      "wins": 27444,
      "perHandRankHandWins": 100000,
      "actualRounds": 1751759,
      "winFrequency": 27.444,
      "rtp": 94.96,
      "liveOdds": "2.46:1",
      "for965": "2.52:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Straight": {
      "wins": 25140,
      "perHandRankHandWins": 100000,
      "actualRounds": 1755039,
      "winFrequency": 25.14,
      "rtp": 96.54,
      "liveOdds": "2.84:1",
      "for965": "2.84:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Three of a Kind": {
      "wins": 16471,
      "perHandRankHandWins": 100000,
      "actualRounds": 1752481,
      "winFrequency": 16.471,
      "rtp": 95.37,
      "liveOdds": "4.79:1",
      "for965": "4.86:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Two Pair": {
      "wins": 16318,
      "perHandRankHandWins": 100000,
      "actualRounds": 1741673,
      "winFrequency": 16.318,
      "rtp": 97.42,
      "liveOdds": "4.97:1",
      "for965": "4.91:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Flush": {
      "wins": 11083,
      "perHandRankHandWins": 100000,
      "actualRounds": 1752490,
      "winFrequency": 11.083,
      "rtp": 96.53,
      "liveOdds": "7.71:1",
      "for965": "7.71:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Four of a Kind": {
      "wins": 3509,
      "perHandRankHandWins": 100000,
      "actualRounds": 1755746,
      "winFrequency": 3.509,
      "rtp": 93.55,
      "liveOdds": "26.4:1",
      "for965": "26.5:1",
      "passed": true,
      "status": "complete"
    },
    "color:3R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.91:1",
      "for965": "0.93:1",
      "passed": false,
      "status": "complete"
    },
    "color:3B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.91:1",
      "for965": "0.93:1",
      "passed": false,
      "status": "complete"
    },
    "color:4R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "4.75:1",
      "for965": "4.79:1",
      "passed": false,
      "status": "complete"
    },
    "color:4B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "4.75:1",
      "for965": "4.79:1",
      "passed": false,
      "status": "complete"
    },
    "color:5R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "43:1",
      "for965": "42.67:1",
      "passed": false,
      "status": "complete"
    },
    "color:5B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "43:1",
      "for965": "43.84:1",
      "passed": false,
      "status": "complete"
    },
    "lhState:2L2H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.904:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:2L2H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.904:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:3L1H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.06:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:3L1H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.79:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:1L3H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.79:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:1L3H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.06:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:4L0H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.23:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:4L0H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.68:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:0L4H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.68:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:0L4H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.23:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    }
  },
  "presubmission": {
    "hand:H1": {
      "wins": 22415,
      "perHandRankHandWins": null,
      "actualRounds": 500000,
      "winFrequency": 4.483,
      "rtp": 95.49,
      "liveOdds": "20.3:1",
      "for965": "20.53:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H2": {
      "wins": 89712,
      "perHandRankHandWins": null,
      "actualRounds": 500000,
      "winFrequency": 17.9424,
      "rtp": 95.99,
      "liveOdds": "4.35:1",
      "for965": "4.38:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H3": {
      "wins": 28616,
      "perHandRankHandWins": null,
      "actualRounds": 500000,
      "winFrequency": 5.7232,
      "rtp": 96.15,
      "liveOdds": "15.8:1",
      "for965": "15.86:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H4": {
      "wins": 48044,
      "perHandRankHandWins": null,
      "actualRounds": 500000,
      "winFrequency": 9.6088,
      "rtp": 96.09,
      "liveOdds": "9:1",
      "for965": "9.04:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H5": {
      "wins": 57575,
      "perHandRankHandWins": null,
      "actualRounds": 500000,
      "winFrequency": 11.515,
      "rtp": 96.73,
      "liveOdds": "7.4:1",
      "for965": "7.38:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H6": {
      "wins": 69638,
      "perHandRankHandWins": null,
      "actualRounds": 500000,
      "winFrequency": 13.9276,
      "rtp": 96.1,
      "liveOdds": "5.9:1",
      "for965": "5.93:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H7": {
      "wins": 62050,
      "perHandRankHandWins": null,
      "actualRounds": 500000,
      "winFrequency": 12.41,
      "rtp": 96.8,
      "liveOdds": "6.8:1",
      "for965": "6.78:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H8": {
      "wins": 58297,
      "perHandRankHandWins": null,
      "actualRounds": 500000,
      "winFrequency": 11.6594,
      "rtp": 96.77,
      "liveOdds": "7.3:1",
      "for965": "7.28:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H9": {
      "wins": 47778,
      "perHandRankHandWins": null,
      "actualRounds": 500000,
      "winFrequency": 9.5556,
      "rtp": 96.51,
      "liveOdds": "9.1:1",
      "for965": "9.1:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H10": {
      "wins": 28263,
      "perHandRankHandWins": null,
      "actualRounds": 500000,
      "winFrequency": 5.6526,
      "rtp": 94.96,
      "liveOdds": "15.8:1",
      "for965": "16.07:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Full House": {
      "wins": 125093,
      "perHandRankHandWins": 500000,
      "actualRounds": 11102097,
      "winFrequency": 25.0186,
      "rtp": 96.57,
      "liveOdds": "2.86:1",
      "for965": "2.86:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Two Pair": {
      "wins": 112845,
      "perHandRankHandWins": 500000,
      "actualRounds": 11088718,
      "winFrequency": 22.569,
      "rtp": 97.05,
      "liveOdds": "3.3:1",
      "for965": "3.28:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Straight": {
      "wins": 111173,
      "perHandRankHandWins": 500000,
      "actualRounds": 11111164,
      "winFrequency": 22.2346,
      "rtp": 95.83,
      "liveOdds": "3.31:1",
      "for965": "3.34:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Flush": {
      "wins": 73126,
      "perHandRankHandWins": 500000,
      "actualRounds": 11106240,
      "winFrequency": 14.6252,
      "rtp": 95.8,
      "liveOdds": "5.55:1",
      "for965": "5.6:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Three of a Kind": {
      "wins": 52991,
      "perHandRankHandWins": 500000,
      "actualRounds": 11093063,
      "winFrequency": 10.5982,
      "rtp": 97.08,
      "liveOdds": "8.16:1",
      "for965": "8.11:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:One Pair": {
      "wins": 16283,
      "perHandRankHandWins": 500000,
      "actualRounds": 11076148,
      "winFrequency": 3.2566,
      "rtp": 95.09,
      "liveOdds": "28.2:1",
      "for965": "28.63:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Full House": {
      "wins": 205337,
      "perHandRankHandWins": 500000,
      "actualRounds": 2791976,
      "winFrequency": 41.0674,
      "rtp": 96.1,
      "liveOdds": "1.34:1",
      "for965": "1.35:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Three of a Kind": {
      "wins": 183827,
      "perHandRankHandWins": 500000,
      "actualRounds": 2786152,
      "winFrequency": 36.7654,
      "rtp": 96.69,
      "liveOdds": "1.63:1",
      "for965": "1.62:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Four of a Kind": {
      "wins": 56341,
      "perHandRankHandWins": 500000,
      "actualRounds": 2790633,
      "winFrequency": 11.2682,
      "rtp": 97.24,
      "liveOdds": "7.63:1",
      "for965": "7.56:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Flush": {
      "wins": 35187,
      "perHandRankHandWins": 500000,
      "actualRounds": 2782194,
      "winFrequency": 7.0374,
      "rtp": 96.2,
      "liveOdds": "12.67:1",
      "for965": "12.71:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:One Pair": {
      "wins": 12687,
      "perHandRankHandWins": 500000,
      "actualRounds": 2791082,
      "winFrequency": 2.5374,
      "rtp": 96.52,
      "liveOdds": "37.04:1",
      "for965": "37.03:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Straight": {
      "wins": 6812,
      "perHandRankHandWins": 500000,
      "actualRounds": 2790129,
      "winFrequency": 1.3624,
      "rtp": 96.73,
      "liveOdds": "70:1",
      "for965": "69.83:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Straight": {
      "wins": 278285,
      "perHandRankHandWins": 500000,
      "actualRounds": 8777629,
      "winFrequency": 55.657,
      "rtp": 96.84,
      "liveOdds": "0.74:1",
      "for965": "0.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Full House": {
      "wins": 92122,
      "perHandRankHandWins": 500000,
      "actualRounds": 8770783,
      "winFrequency": 18.4244,
      "rtp": 97.47,
      "liveOdds": "4.29:1",
      "for965": "4.24:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Two Pair": {
      "wins": 77633,
      "perHandRankHandWins": 500000,
      "actualRounds": 8775012,
      "winFrequency": 15.5266,
      "rtp": 95.8,
      "liveOdds": "5.17:1",
      "for965": "5.22:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Three of a Kind": {
      "wins": 52217,
      "perHandRankHandWins": 500000,
      "actualRounds": 8777076,
      "winFrequency": 10.4434,
      "rtp": 95.56,
      "liveOdds": "8.15:1",
      "for965": "8.24:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Flush": {
      "wins": 273981,
      "perHandRankHandWins": 500000,
      "actualRounds": 5196342,
      "winFrequency": 54.7962,
      "rtp": 95.89,
      "liveOdds": "0.75:1",
      "for965": "0.76:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Straight": {
      "wins": 158450,
      "perHandRankHandWins": 500000,
      "actualRounds": 5206622,
      "winFrequency": 31.69,
      "rtp": 95.7,
      "liveOdds": "2.02:1",
      "for965": "2.05:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Full House": {
      "wins": 48279,
      "perHandRankHandWins": 500000,
      "actualRounds": 5210402,
      "winFrequency": 9.6558,
      "rtp": 95.98,
      "liveOdds": "8.94:1",
      "for965": "8.99:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Two Pair": {
      "wins": 18132,
      "perHandRankHandWins": 500000,
      "actualRounds": 5223250,
      "winFrequency": 3.6264,
      "rtp": 94.87,
      "liveOdds": "25.45:1",
      "for965": "25.61:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Flush": {
      "wins": 228317,
      "perHandRankHandWins": 500000,
      "actualRounds": 4364627,
      "winFrequency": 45.6634,
      "rtp": 96.35,
      "liveOdds": "1.11:1",
      "for965": "1.11:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Straight": {
      "wins": 106455,
      "perHandRankHandWins": 500000,
      "actualRounds": 4353588,
      "winFrequency": 21.291,
      "rtp": 96.45,
      "liveOdds": "3.53:1",
      "for965": "3.53:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Full House": {
      "wins": 83901,
      "perHandRankHandWins": 500000,
      "actualRounds": 4360519,
      "winFrequency": 16.7802,
      "rtp": 96.32,
      "liveOdds": "4.74:1",
      "for965": "4.75:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Three of a Kind": {
      "wins": 40316,
      "perHandRankHandWins": 500000,
      "actualRounds": 4354396,
      "winFrequency": 8.0632,
      "rtp": 95.23,
      "liveOdds": "10.81:1",
      "for965": "10.97:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Two Pair": {
      "wins": 22886,
      "perHandRankHandWins": 500000,
      "actualRounds": 4355999,
      "winFrequency": 4.5772,
      "rtp": 97.27,
      "liveOdds": "20.25:1",
      "for965": "20.08:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Four of a Kind": {
      "wins": 8809,
      "perHandRankHandWins": 500000,
      "actualRounds": 4359951,
      "winFrequency": 1.7618,
      "rtp": 96.9,
      "liveOdds": "54:1",
      "for965": "53.77:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Flush": {
      "wins": 189306,
      "perHandRankHandWins": 500000,
      "actualRounds": 3582290,
      "winFrequency": 37.8612,
      "rtp": 96.92,
      "liveOdds": "1.56:1",
      "for965": "1.55:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Straight": {
      "wins": 107099,
      "perHandRankHandWins": 500000,
      "actualRounds": 3586003,
      "winFrequency": 21.4198,
      "rtp": 96.6,
      "liveOdds": "3.51:1",
      "for965": "3.51:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Full House": {
      "wins": 101226,
      "perHandRankHandWins": 500000,
      "actualRounds": 3590158,
      "winFrequency": 20.2452,
      "rtp": 96.77,
      "liveOdds": "3.78:1",
      "for965": "3.77:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Three of a Kind": {
      "wins": 55471,
      "perHandRankHandWins": 500000,
      "actualRounds": 3582838,
      "winFrequency": 11.0942,
      "rtp": 96.85,
      "liveOdds": "7.73:1",
      "for965": "7.7:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Two Pair": {
      "wins": 32267,
      "perHandRankHandWins": 500000,
      "actualRounds": 3588421,
      "winFrequency": 6.4534,
      "rtp": 97.64,
      "liveOdds": "14.13:1",
      "for965": "13.95:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Four of a Kind": {
      "wins": 14277,
      "perHandRankHandWins": 500000,
      "actualRounds": 3587483,
      "winFrequency": 2.8554,
      "rtp": 95.6,
      "liveOdds": "32.48:1",
      "for965": "32.8:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Full House": {
      "wins": 220659,
      "perHandRankHandWins": 500000,
      "actualRounds": 4024106,
      "winFrequency": 44.1318,
      "rtp": 95.77,
      "liveOdds": "1.17:1",
      "for965": "1.19:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Three of a Kind": {
      "wins": 156186,
      "perHandRankHandWins": 500000,
      "actualRounds": 4035176,
      "winFrequency": 31.2372,
      "rtp": 97.15,
      "liveOdds": "2.11:1",
      "for965": "2.09:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Four of a Kind": {
      "wins": 79634,
      "perHandRankHandWins": 500000,
      "actualRounds": 4012045,
      "winFrequency": 15.9268,
      "rtp": 96.2,
      "liveOdds": "5.04:1",
      "for965": "5.06:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Straight": {
      "wins": 40919,
      "perHandRankHandWins": 500000,
      "actualRounds": 4020659,
      "winFrequency": 8.1838,
      "rtp": 95.67,
      "liveOdds": "10.69:1",
      "for965": "10.79:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Flush": {
      "wins": 223154,
      "perHandRankHandWins": 500000,
      "actualRounds": 4290902,
      "winFrequency": 44.6308,
      "rtp": 96.85,
      "liveOdds": "1.17:1",
      "for965": "1.16:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Full House": {
      "wins": 78436,
      "perHandRankHandWins": 500000,
      "actualRounds": 4289958,
      "winFrequency": 15.6872,
      "rtp": 96.63,
      "liveOdds": "5.16:1",
      "for965": "5.15:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Straight": {
      "wins": 72642,
      "perHandRankHandWins": 500000,
      "actualRounds": 4284175,
      "winFrequency": 14.5284,
      "rtp": 95.45,
      "liveOdds": "5.57:1",
      "for965": "5.64:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Three of a Kind": {
      "wins": 71950,
      "perHandRankHandWins": 500000,
      "actualRounds": 4288081,
      "winFrequency": 14.39,
      "rtp": 96.41,
      "liveOdds": "5.7:1",
      "for965": "5.71:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Two Pair": {
      "wins": 35749,
      "perHandRankHandWins": 500000,
      "actualRounds": 4285703,
      "winFrequency": 7.1498,
      "rtp": 96.02,
      "liveOdds": "12.43:1",
      "for965": "12.5:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Four of a Kind": {
      "wins": 17176,
      "perHandRankHandWins": 500000,
      "actualRounds": 4288297,
      "winFrequency": 3.4352,
      "rtp": 97.22,
      "liveOdds": "27.3:1",
      "for965": "27.09:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Full House": {
      "wins": 211952,
      "perHandRankHandWins": 500000,
      "actualRounds": 5257189,
      "winFrequency": 42.3904,
      "rtp": 96.65,
      "liveOdds": "1.28:1",
      "for965": "1.28:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Three of a Kind": {
      "wins": 151028,
      "perHandRankHandWins": 500000,
      "actualRounds": 5246341,
      "winFrequency": 30.2056,
      "rtp": 96.96,
      "liveOdds": "2.21:1",
      "for965": "2.19:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Four of a Kind": {
      "wins": 104477,
      "perHandRankHandWins": 500000,
      "actualRounds": 5239245,
      "winFrequency": 20.8954,
      "rtp": 96.75,
      "liveOdds": "3.63:1",
      "for965": "3.62:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Straight": {
      "wins": 30278,
      "perHandRankHandWins": 500000,
      "actualRounds": 5242711,
      "winFrequency": 6.0556,
      "rtp": 94.47,
      "liveOdds": "14.6:1",
      "for965": "14.94:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Full House": {
      "wins": 137768,
      "perHandRankHandWins": 500000,
      "actualRounds": 8764405,
      "winFrequency": 27.5536,
      "rtp": 95.34,
      "liveOdds": "2.46:1",
      "for965": "2.5:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Straight": {
      "wins": 125394,
      "perHandRankHandWins": 500000,
      "actualRounds": 8800827,
      "winFrequency": 25.0788,
      "rtp": 96.3,
      "liveOdds": "2.84:1",
      "for965": "2.85:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Three of a Kind": {
      "wins": 83449,
      "perHandRankHandWins": 500000,
      "actualRounds": 8757046,
      "winFrequency": 16.6898,
      "rtp": 96.63,
      "liveOdds": "4.79:1",
      "for965": "4.78:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Two Pair": {
      "wins": 81715,
      "perHandRankHandWins": 500000,
      "actualRounds": 8767707,
      "winFrequency": 16.343,
      "rtp": 97.57,
      "liveOdds": "4.97:1",
      "for965": "4.9:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Flush": {
      "wins": 54490,
      "perHandRankHandWins": 500000,
      "actualRounds": 8772935,
      "winFrequency": 10.898,
      "rtp": 94.92,
      "liveOdds": "7.71:1",
      "for965": "7.85:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Four of a Kind": {
      "wins": 17477,
      "perHandRankHandWins": 500000,
      "actualRounds": 8769428,
      "winFrequency": 3.4954,
      "rtp": 95.77,
      "liveOdds": "26.4:1",
      "for965": "26.61:1",
      "passed": true,
      "status": "complete"
    },
    "color:3R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.91:1",
      "for965": "0.93:1",
      "passed": false,
      "status": "complete"
    },
    "color:3B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.91:1",
      "for965": "0.93:1",
      "passed": false,
      "status": "complete"
    },
    "color:4R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "4.75:1",
      "for965": "4.79:1",
      "passed": false,
      "status": "complete"
    },
    "color:4B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "4.75:1",
      "for965": "4.79:1",
      "passed": false,
      "status": "complete"
    },
    "color:5R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "43:1",
      "for965": "43.13:1",
      "passed": false,
      "status": "complete"
    },
    "color:5B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "43:1",
      "for965": "43.88:1",
      "passed": false,
      "status": "complete"
    },
    "lhState:2L2H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.904:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:2L2H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.904:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:3L1H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.06:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:3L1H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.79:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:1L3H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.79:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:1L3H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.06:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:4L0H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.23:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:4L0H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.68:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:0L4H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.68:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:0L4H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.23:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    }
  },
  "gli": {
    "hand:H1": {
      "wins": 45187,
      "perHandRankHandWins": null,
      "actualRounds": 1000000,
      "winFrequency": 4.5187,
      "rtp": 96.25,
      "liveOdds": "20.3:1",
      "for965": "20.36:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H2": {
      "wins": 179632,
      "perHandRankHandWins": null,
      "actualRounds": 1000000,
      "winFrequency": 17.9632,
      "rtp": 96.1,
      "liveOdds": "4.35:1",
      "for965": "4.37:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H3": {
      "wins": 56878,
      "perHandRankHandWins": null,
      "actualRounds": 1000000,
      "winFrequency": 5.6878,
      "rtp": 95.56,
      "liveOdds": "15.8:1",
      "for965": "15.97:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H4": {
      "wins": 95834,
      "perHandRankHandWins": null,
      "actualRounds": 1000000,
      "winFrequency": 9.5834,
      "rtp": 95.83,
      "liveOdds": "9:1",
      "for965": "9.07:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H5": {
      "wins": 114776,
      "perHandRankHandWins": null,
      "actualRounds": 1000000,
      "winFrequency": 11.4776,
      "rtp": 96.41,
      "liveOdds": "7.4:1",
      "for965": "7.41:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H6": {
      "wins": 139227,
      "perHandRankHandWins": null,
      "actualRounds": 1000000,
      "winFrequency": 13.9227,
      "rtp": 96.07,
      "liveOdds": "5.9:1",
      "for965": "5.93:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H7": {
      "wins": 123816,
      "perHandRankHandWins": null,
      "actualRounds": 1000000,
      "winFrequency": 12.3816,
      "rtp": 96.58,
      "liveOdds": "6.8:1",
      "for965": "6.79:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H8": {
      "wins": 116772,
      "perHandRankHandWins": null,
      "actualRounds": 1000000,
      "winFrequency": 11.6772,
      "rtp": 96.92,
      "liveOdds": "7.3:1",
      "for965": "7.26:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H9": {
      "wins": 95026,
      "perHandRankHandWins": null,
      "actualRounds": 1000000,
      "winFrequency": 9.5026,
      "rtp": 95.98,
      "liveOdds": "9.1:1",
      "for965": "9.16:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H10": {
      "wins": 57370,
      "perHandRankHandWins": null,
      "actualRounds": 1000000,
      "winFrequency": 5.737,
      "rtp": 96.38,
      "liveOdds": "15.8:1",
      "for965": "15.82:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Full House": {
      "wins": 251494,
      "perHandRankHandWins": 1000000,
      "actualRounds": 22195366,
      "winFrequency": 25.1494,
      "rtp": 97.08,
      "liveOdds": "2.86:1",
      "for965": "2.84:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Two Pair": {
      "wins": 226206,
      "perHandRankHandWins": 1000000,
      "actualRounds": 22223024,
      "winFrequency": 22.6206,
      "rtp": 97.27,
      "liveOdds": "3.3:1",
      "for965": "3.27:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Straight": {
      "wins": 221946,
      "perHandRankHandWins": 1000000,
      "actualRounds": 22195768,
      "winFrequency": 22.1946,
      "rtp": 95.66,
      "liveOdds": "3.31:1",
      "for965": "3.35:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Flush": {
      "wins": 146944,
      "perHandRankHandWins": 1000000,
      "actualRounds": 22234002,
      "winFrequency": 14.6944,
      "rtp": 96.25,
      "liveOdds": "5.55:1",
      "for965": "5.57:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Three of a Kind": {
      "wins": 105684,
      "perHandRankHandWins": 1000000,
      "actualRounds": 22195535,
      "winFrequency": 10.5684,
      "rtp": 96.81,
      "liveOdds": "8.16:1",
      "for965": "8.13:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:One Pair": {
      "wins": 33049,
      "perHandRankHandWins": 1000000,
      "actualRounds": 22203980,
      "winFrequency": 3.3049,
      "rtp": 96.5,
      "liveOdds": "28.2:1",
      "for965": "28.2:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Full House": {
      "wins": 411050,
      "perHandRankHandWins": 1000000,
      "actualRounds": 5577965,
      "winFrequency": 41.105,
      "rtp": 96.19,
      "liveOdds": "1.34:1",
      "for965": "1.35:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Three of a Kind": {
      "wins": 367760,
      "perHandRankHandWins": 1000000,
      "actualRounds": 5568960,
      "winFrequency": 36.776,
      "rtp": 96.72,
      "liveOdds": "1.63:1",
      "for965": "1.62:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Four of a Kind": {
      "wins": 112356,
      "perHandRankHandWins": 1000000,
      "actualRounds": 5572690,
      "winFrequency": 11.2356,
      "rtp": 96.96,
      "liveOdds": "7.63:1",
      "for965": "7.59:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Flush": {
      "wins": 69974,
      "perHandRankHandWins": 1000000,
      "actualRounds": 5584981,
      "winFrequency": 6.9974,
      "rtp": 95.65,
      "liveOdds": "12.67:1",
      "for965": "12.79:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:One Pair": {
      "wins": 25282,
      "perHandRankHandWins": 1000000,
      "actualRounds": 5573098,
      "winFrequency": 2.5282,
      "rtp": 96.17,
      "liveOdds": "37.04:1",
      "for965": "37.17:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Straight": {
      "wins": 13535,
      "perHandRankHandWins": 1000000,
      "actualRounds": 5579682,
      "winFrequency": 1.3535,
      "rtp": 96.1,
      "liveOdds": "70:1",
      "for965": "70.3:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Straight": {
      "wins": 556487,
      "perHandRankHandWins": 1000000,
      "actualRounds": 17562520,
      "winFrequency": 55.6487,
      "rtp": 96.83,
      "liveOdds": "0.74:1",
      "for965": "0.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Full House": {
      "wins": 182621,
      "perHandRankHandWins": 1000000,
      "actualRounds": 17524689,
      "winFrequency": 18.2621,
      "rtp": 96.61,
      "liveOdds": "4.29:1",
      "for965": "4.28:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Two Pair": {
      "wins": 155580,
      "perHandRankHandWins": 1000000,
      "actualRounds": 17574074,
      "winFrequency": 15.558,
      "rtp": 95.99,
      "liveOdds": "5.17:1",
      "for965": "5.2:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Three of a Kind": {
      "wins": 104963,
      "perHandRankHandWins": 1000000,
      "actualRounds": 17579097,
      "winFrequency": 10.4963,
      "rtp": 96.04,
      "liveOdds": "8.15:1",
      "for965": "8.19:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Flush": {
      "wins": 547749,
      "perHandRankHandWins": 1000000,
      "actualRounds": 10443737,
      "winFrequency": 54.7749,
      "rtp": 95.86,
      "liveOdds": "0.75:1",
      "for965": "0.76:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Straight": {
      "wins": 317592,
      "perHandRankHandWins": 1000000,
      "actualRounds": 10443956,
      "winFrequency": 31.7592,
      "rtp": 95.91,
      "liveOdds": "2.02:1",
      "for965": "2.04:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Full House": {
      "wins": 98135,
      "perHandRankHandWins": 1000000,
      "actualRounds": 10416868,
      "winFrequency": 9.8135,
      "rtp": 97.55,
      "liveOdds": "8.94:1",
      "for965": "8.83:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Two Pair": {
      "wins": 36395,
      "perHandRankHandWins": 1000000,
      "actualRounds": 10435020,
      "winFrequency": 3.6395,
      "rtp": 95.21,
      "liveOdds": "25.45:1",
      "for965": "25.51:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Flush": {
      "wins": 457111,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8715319,
      "winFrequency": 45.7111,
      "rtp": 96.45,
      "liveOdds": "1.11:1",
      "for965": "1.11:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Straight": {
      "wins": 212000,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8720771,
      "winFrequency": 21.2,
      "rtp": 96.04,
      "liveOdds": "3.53:1",
      "for965": "3.55:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Full House": {
      "wins": 168548,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8716284,
      "winFrequency": 16.8548,
      "rtp": 96.75,
      "liveOdds": "4.74:1",
      "for965": "4.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Three of a Kind": {
      "wins": 80838,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8716678,
      "winFrequency": 8.0838,
      "rtp": 95.47,
      "liveOdds": "10.81:1",
      "for965": "10.94:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Two Pair": {
      "wins": 45576,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8705898,
      "winFrequency": 4.5576,
      "rtp": 96.85,
      "liveOdds": "20.25:1",
      "for965": "20.17:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Four of a Kind": {
      "wins": 17581,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8710186,
      "winFrequency": 1.7581,
      "rtp": 96.7,
      "liveOdds": "54:1",
      "for965": "53.89:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Flush": {
      "wins": 379709,
      "perHandRankHandWins": 1000000,
      "actualRounds": 7174153,
      "winFrequency": 37.9709,
      "rtp": 97.21,
      "liveOdds": "1.56:1",
      "for965": "1.54:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Straight": {
      "wins": 214585,
      "perHandRankHandWins": 1000000,
      "actualRounds": 7174322,
      "winFrequency": 21.4585,
      "rtp": 96.78,
      "liveOdds": "3.51:1",
      "for965": "3.5:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Full House": {
      "wins": 202130,
      "perHandRankHandWins": 1000000,
      "actualRounds": 7179923,
      "winFrequency": 20.213,
      "rtp": 96.62,
      "liveOdds": "3.78:1",
      "for965": "3.77:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Three of a Kind": {
      "wins": 110275,
      "perHandRankHandWins": 1000000,
      "actualRounds": 7177964,
      "winFrequency": 11.0275,
      "rtp": 96.27,
      "liveOdds": "7.73:1",
      "for965": "7.75:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Two Pair": {
      "wins": 63907,
      "perHandRankHandWins": 1000000,
      "actualRounds": 7169667,
      "winFrequency": 6.3907,
      "rtp": 96.69,
      "liveOdds": "14.13:1",
      "for965": "14.1:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Four of a Kind": {
      "wins": 28661,
      "perHandRankHandWins": 1000000,
      "actualRounds": 7170689,
      "winFrequency": 2.8661,
      "rtp": 95.96,
      "liveOdds": "32.48:1",
      "for965": "32.67:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Full House": {
      "wins": 440854,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8057730,
      "winFrequency": 44.0854,
      "rtp": 95.67,
      "liveOdds": "1.17:1",
      "for965": "1.19:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Three of a Kind": {
      "wins": 313820,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8047198,
      "winFrequency": 31.382,
      "rtp": 97.6,
      "liveOdds": "2.11:1",
      "for965": "2.08:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Four of a Kind": {
      "wins": 159648,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8050210,
      "winFrequency": 15.9648,
      "rtp": 96.43,
      "liveOdds": "5.04:1",
      "for965": "5.04:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Straight": {
      "wins": 82964,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8064473,
      "winFrequency": 8.2964,
      "rtp": 96.98,
      "liveOdds": "10.69:1",
      "for965": "10.63:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Flush": {
      "wins": 445579,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8566161,
      "winFrequency": 44.5579,
      "rtp": 96.69,
      "liveOdds": "1.17:1",
      "for965": "1.17:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Full House": {
      "wins": 157169,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8553858,
      "winFrequency": 15.7169,
      "rtp": 96.82,
      "liveOdds": "5.16:1",
      "for965": "5.14:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Straight": {
      "wins": 145356,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8574596,
      "winFrequency": 14.5356,
      "rtp": 95.5,
      "liveOdds": "5.57:1",
      "for965": "5.64:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Three of a Kind": {
      "wins": 144610,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8579488,
      "winFrequency": 14.461,
      "rtp": 96.89,
      "liveOdds": "5.7:1",
      "for965": "5.67:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Two Pair": {
      "wins": 72249,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8580885,
      "winFrequency": 7.2249,
      "rtp": 97.03,
      "liveOdds": "12.43:1",
      "for965": "12.36:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Four of a Kind": {
      "wins": 34139,
      "perHandRankHandWins": 1000000,
      "actualRounds": 8559842,
      "winFrequency": 3.4139,
      "rtp": 96.61,
      "liveOdds": "27.3:1",
      "for965": "27.27:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Full House": {
      "wins": 423400,
      "perHandRankHandWins": 1000000,
      "actualRounds": 10486112,
      "winFrequency": 42.34,
      "rtp": 96.54,
      "liveOdds": "1.28:1",
      "for965": "1.28:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Three of a Kind": {
      "wins": 302566,
      "perHandRankHandWins": 1000000,
      "actualRounds": 10511437,
      "winFrequency": 30.2566,
      "rtp": 97.12,
      "liveOdds": "2.21:1",
      "for965": "2.19:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Four of a Kind": {
      "wins": 208655,
      "perHandRankHandWins": 1000000,
      "actualRounds": 10501728,
      "winFrequency": 20.8655,
      "rtp": 96.61,
      "liveOdds": "3.63:1",
      "for965": "3.62:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Straight": {
      "wins": 61358,
      "perHandRankHandWins": 1000000,
      "actualRounds": 10503970,
      "winFrequency": 6.1358,
      "rtp": 95.72,
      "liveOdds": "14.6:1",
      "for965": "14.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Full House": {
      "wins": 276245,
      "perHandRankHandWins": 1000000,
      "actualRounds": 17555954,
      "winFrequency": 27.6245,
      "rtp": 95.58,
      "liveOdds": "2.46:1",
      "for965": "2.49:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Straight": {
      "wins": 250191,
      "perHandRankHandWins": 1000000,
      "actualRounds": 17537910,
      "winFrequency": 25.0191,
      "rtp": 96.07,
      "liveOdds": "2.84:1",
      "for965": "2.86:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Three of a Kind": {
      "wins": 165998,
      "perHandRankHandWins": 1000000,
      "actualRounds": 17551506,
      "winFrequency": 16.5998,
      "rtp": 96.11,
      "liveOdds": "4.79:1",
      "for965": "4.81:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Two Pair": {
      "wins": 162349,
      "perHandRankHandWins": 1000000,
      "actualRounds": 17509805,
      "winFrequency": 16.2349,
      "rtp": 96.92,
      "liveOdds": "4.97:1",
      "for965": "4.94:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Flush": {
      "wins": 109355,
      "perHandRankHandWins": 1000000,
      "actualRounds": 17517147,
      "winFrequency": 10.9355,
      "rtp": 95.25,
      "liveOdds": "7.71:1",
      "for965": "7.82:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Four of a Kind": {
      "wins": 35170,
      "perHandRankHandWins": 1000000,
      "actualRounds": 17516101,
      "winFrequency": 3.517,
      "rtp": 96.37,
      "liveOdds": "26.4:1",
      "for965": "26.44:1",
      "passed": true,
      "status": "complete"
    },
    "color:3R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.91:1",
      "for965": "0.93:1",
      "passed": false,
      "status": "complete"
    },
    "color:3B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.91:1",
      "for965": "0.93:1",
      "passed": false,
      "status": "complete"
    },
    "color:4R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "4.75:1",
      "for965": "4.81:1",
      "passed": false,
      "status": "complete"
    },
    "color:4B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "4.75:1",
      "for965": "4.81:1",
      "passed": false,
      "status": "complete"
    },
    "color:5R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "43:1",
      "for965": "43.36:1",
      "passed": false,
      "status": "complete"
    },
    "color:5B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "43:1",
      "for965": "43.32:1",
      "passed": false,
      "status": "complete"
    },
    "lhState:2L2H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.904:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:2L2H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.904:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:3L1H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.06:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:3L1H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.79:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:1L3H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.79:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:1L3H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.06:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:4L0H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.23:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:4L0H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.68:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:0L4H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.68:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:0L4H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.23:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    }
  },
  "full": {
    "hand:H1": {
      "wins": 90142,
      "perHandRankHandWins": null,
      "actualRounds": 2000000,
      "winFrequency": 4.5071,
      "rtp": 96.0,
      "liveOdds": "20.3:1",
      "for965": "20.41:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H2": {
      "wins": 358490,
      "perHandRankHandWins": null,
      "actualRounds": 2000000,
      "winFrequency": 17.9245,
      "rtp": 95.9,
      "liveOdds": "4.35:1",
      "for965": "4.38:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H3": {
      "wins": 114116,
      "perHandRankHandWins": null,
      "actualRounds": 2000000,
      "winFrequency": 5.7058,
      "rtp": 95.86,
      "liveOdds": "15.8:1",
      "for965": "15.91:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H4": {
      "wins": 191625,
      "perHandRankHandWins": null,
      "actualRounds": 2000000,
      "winFrequency": 9.5812,
      "rtp": 95.81,
      "liveOdds": "9:1",
      "for965": "9.07:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H5": {
      "wins": 229847,
      "perHandRankHandWins": null,
      "actualRounds": 2000000,
      "winFrequency": 11.4924,
      "rtp": 96.54,
      "liveOdds": "7.4:1",
      "for965": "7.4:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H6": {
      "wins": 279753,
      "perHandRankHandWins": null,
      "actualRounds": 2000000,
      "winFrequency": 13.9876,
      "rtp": 96.51,
      "liveOdds": "5.9:1",
      "for965": "5.9:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H7": {
      "wins": 248502,
      "perHandRankHandWins": null,
      "actualRounds": 2000000,
      "winFrequency": 12.4251,
      "rtp": 96.92,
      "liveOdds": "6.8:1",
      "for965": "6.77:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H8": {
      "wins": 233457,
      "perHandRankHandWins": null,
      "actualRounds": 2000000,
      "winFrequency": 11.6729,
      "rtp": 96.88,
      "liveOdds": "7.3:1",
      "for965": "7.27:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H9": {
      "wins": 190878,
      "perHandRankHandWins": null,
      "actualRounds": 2000000,
      "winFrequency": 9.5439,
      "rtp": 96.39,
      "liveOdds": "9.1:1",
      "for965": "9.11:1",
      "passed": true,
      "status": "complete"
    },
    "hand:H10": {
      "wins": 114233,
      "perHandRankHandWins": null,
      "actualRounds": 2000000,
      "winFrequency": 5.7116,
      "rtp": 95.96,
      "liveOdds": "15.8:1",
      "for965": "15.9:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Full House": {
      "wins": 501709,
      "perHandRankHandWins": 2000000,
      "actualRounds": 44410951,
      "winFrequency": 25.0854,
      "rtp": 96.83,
      "liveOdds": "2.86:1",
      "for965": "2.85:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Two Pair": {
      "wins": 452548,
      "perHandRankHandWins": 2000000,
      "actualRounds": 44408259,
      "winFrequency": 22.6274,
      "rtp": 97.3,
      "liveOdds": "3.3:1",
      "for965": "3.26:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Straight": {
      "wins": 300099,
      "perHandRankHandWins": 1350851,
      "actualRounds": 30000000,
      "winFrequency": 22.2156,
      "rtp": 95.75,
      "liveOdds": "3.31:1",
      "for965": "3.34:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Flush": {
      "wins": 199442,
      "perHandRankHandWins": 1350284,
      "actualRounds": 30000000,
      "winFrequency": 14.7704,
      "rtp": 96.75,
      "liveOdds": "5.55:1",
      "for965": "5.53:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:Three of a Kind": {
      "wins": 143084,
      "perHandRankHandWins": 1351858,
      "actualRounds": 30000000,
      "winFrequency": 10.5842,
      "rtp": 96.95,
      "liveOdds": "8.16:1",
      "for965": "8.12:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H1:One Pair": {
      "wins": 44247,
      "perHandRankHandWins": 1349252,
      "actualRounds": 30000000,
      "winFrequency": 3.2794,
      "rtp": 95.76,
      "liveOdds": "28.2:1",
      "for965": "28.43:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Full House": {
      "wins": 821871,
      "perHandRankHandWins": 2000000,
      "actualRounds": 11137478,
      "winFrequency": 41.0936,
      "rtp": 96.16,
      "liveOdds": "1.34:1",
      "for965": "1.35:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Three of a Kind": {
      "wins": 734677,
      "perHandRankHandWins": 2000000,
      "actualRounds": 11153136,
      "winFrequency": 36.7339,
      "rtp": 96.61,
      "liveOdds": "1.63:1",
      "for965": "1.63:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Four of a Kind": {
      "wins": 225280,
      "perHandRankHandWins": 2000000,
      "actualRounds": 11142824,
      "winFrequency": 11.264,
      "rtp": 97.21,
      "liveOdds": "7.63:1",
      "for965": "7.57:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Flush": {
      "wins": 140191,
      "perHandRankHandWins": 2000000,
      "actualRounds": 11143077,
      "winFrequency": 7.0096,
      "rtp": 95.82,
      "liveOdds": "12.67:1",
      "for965": "12.77:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:One Pair": {
      "wins": 51145,
      "perHandRankHandWins": 2000000,
      "actualRounds": 11155161,
      "winFrequency": 2.5573,
      "rtp": 97.28,
      "liveOdds": "37.04:1",
      "for965": "36.74:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H2:Straight": {
      "wins": 27042,
      "perHandRankHandWins": 2000000,
      "actualRounds": 11156183,
      "winFrequency": 1.3521,
      "rtp": 96.0,
      "liveOdds": "70:1",
      "for965": "70.37:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Straight": {
      "wins": 1113509,
      "perHandRankHandWins": 2000000,
      "actualRounds": 35055917,
      "winFrequency": 55.6755,
      "rtp": 96.88,
      "liveOdds": "0.74:1",
      "for965": "0.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Full House": {
      "wins": 366936,
      "perHandRankHandWins": 2000000,
      "actualRounds": 35104033,
      "winFrequency": 18.3468,
      "rtp": 97.05,
      "liveOdds": "4.29:1",
      "for965": "4.26:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Two Pair": {
      "wins": 310548,
      "perHandRankHandWins": 2000000,
      "actualRounds": 35119140,
      "winFrequency": 15.5274,
      "rtp": 95.8,
      "liveOdds": "5.17:1",
      "for965": "5.21:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H3:Three of a Kind": {
      "wins": 208952,
      "perHandRankHandWins": 2000000,
      "actualRounds": 35147248,
      "winFrequency": 10.4476,
      "rtp": 95.6,
      "liveOdds": "8.15:1",
      "for965": "8.24:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Flush": {
      "wins": 1095661,
      "perHandRankHandWins": 2000000,
      "actualRounds": 20864551,
      "winFrequency": 54.7831,
      "rtp": 95.87,
      "liveOdds": "0.75:1",
      "for965": "0.76:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Straight": {
      "wins": 635119,
      "perHandRankHandWins": 2000000,
      "actualRounds": 20862056,
      "winFrequency": 31.7559,
      "rtp": 95.9,
      "liveOdds": "2.02:1",
      "for965": "2.04:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Full House": {
      "wins": 196093,
      "perHandRankHandWins": 2000000,
      "actualRounds": 20885929,
      "winFrequency": 9.8046,
      "rtp": 97.46,
      "liveOdds": "8.94:1",
      "for965": "8.84:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H4:Two Pair": {
      "wins": 72512,
      "perHandRankHandWins": 2000000,
      "actualRounds": 20843621,
      "winFrequency": 3.6256,
      "rtp": 95.9,
      "liveOdds": "25.45:1",
      "for965": "25.62:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Flush": {
      "wins": 913995,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17433476,
      "winFrequency": 45.6998,
      "rtp": 96.43,
      "liveOdds": "1.11:1",
      "for965": "1.11:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Straight": {
      "wins": 423664,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17418067,
      "winFrequency": 21.1832,
      "rtp": 95.96,
      "liveOdds": "3.53:1",
      "for965": "3.56:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Full House": {
      "wins": 336620,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17431612,
      "winFrequency": 16.831,
      "rtp": 96.61,
      "liveOdds": "4.74:1",
      "for965": "4.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Three of a Kind": {
      "wins": 161336,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17429245,
      "winFrequency": 8.0668,
      "rtp": 95.27,
      "liveOdds": "10.81:1",
      "for965": "10.96:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Two Pair": {
      "wins": 91860,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17430980,
      "winFrequency": 4.593,
      "rtp": 97.6,
      "liveOdds": "20.25:1",
      "for965": "20.01:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H5:Four of a Kind": {
      "wins": 34929,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17398077,
      "winFrequency": 1.7465,
      "rtp": 96.05,
      "liveOdds": "54:1",
      "for965": "54.25:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Flush": {
      "wins": 757682,
      "perHandRankHandWins": 2000000,
      "actualRounds": 14346730,
      "winFrequency": 37.8841,
      "rtp": 96.98,
      "liveOdds": "1.56:1",
      "for965": "1.55:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Straight": {
      "wins": 427184,
      "perHandRankHandWins": 2000000,
      "actualRounds": 14343601,
      "winFrequency": 21.3592,
      "rtp": 96.33,
      "liveOdds": "3.51:1",
      "for965": "3.52:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Full House": {
      "wins": 405307,
      "perHandRankHandWins": 2000000,
      "actualRounds": 14343661,
      "winFrequency": 20.2653,
      "rtp": 96.87,
      "liveOdds": "3.78:1",
      "for965": "3.76:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Three of a Kind": {
      "wins": 220996,
      "perHandRankHandWins": 2000000,
      "actualRounds": 14326389,
      "winFrequency": 11.0498,
      "rtp": 96.46,
      "liveOdds": "7.73:1",
      "for965": "7.73:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Two Pair": {
      "wins": 127836,
      "perHandRankHandWins": 2000000,
      "actualRounds": 14337014,
      "winFrequency": 6.3918,
      "rtp": 96.71,
      "liveOdds": "14.13:1",
      "for965": "14.1:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H6:Four of a Kind": {
      "wins": 57349,
      "perHandRankHandWins": 2000000,
      "actualRounds": 14344483,
      "winFrequency": 2.8674,
      "rtp": 96.0,
      "liveOdds": "32.48:1",
      "for965": "32.65:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Full House": {
      "wins": 883224,
      "perHandRankHandWins": 2000000,
      "actualRounds": 16095990,
      "winFrequency": 44.1612,
      "rtp": 95.83,
      "liveOdds": "1.17:1",
      "for965": "1.19:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Three of a Kind": {
      "wins": 627148,
      "perHandRankHandWins": 2000000,
      "actualRounds": 16101037,
      "winFrequency": 31.3574,
      "rtp": 97.52,
      "liveOdds": "2.11:1",
      "for965": "2.08:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Four of a Kind": {
      "wins": 319559,
      "perHandRankHandWins": 2000000,
      "actualRounds": 16102368,
      "winFrequency": 15.9779,
      "rtp": 96.51,
      "liveOdds": "5.04:1",
      "for965": "5.04:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H7:Straight": {
      "wins": 165503,
      "perHandRankHandWins": 2000000,
      "actualRounds": 16113068,
      "winFrequency": 8.2752,
      "rtp": 96.74,
      "liveOdds": "10.69:1",
      "for965": "10.66:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Flush": {
      "wins": 892008,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17145504,
      "winFrequency": 44.6004,
      "rtp": 96.78,
      "liveOdds": "1.17:1",
      "for965": "1.16:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Full House": {
      "wins": 314360,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17146838,
      "winFrequency": 15.718,
      "rtp": 96.82,
      "liveOdds": "5.16:1",
      "for965": "5.14:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Straight": {
      "wins": 291099,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17139634,
      "winFrequency": 14.5549,
      "rtp": 95.63,
      "liveOdds": "5.57:1",
      "for965": "5.63:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Three of a Kind": {
      "wins": 287815,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17150329,
      "winFrequency": 14.3907,
      "rtp": 96.42,
      "liveOdds": "5.7:1",
      "for965": "5.71:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Two Pair": {
      "wins": 144592,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17146325,
      "winFrequency": 7.2296,
      "rtp": 97.09,
      "liveOdds": "12.43:1",
      "for965": "12.35:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H8:Four of a Kind": {
      "wins": 68807,
      "perHandRankHandWins": 2000000,
      "actualRounds": 17128889,
      "winFrequency": 3.4403,
      "rtp": 97.36,
      "liveOdds": "27.3:1",
      "for965": "27.05:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Full House": {
      "wins": 848701,
      "perHandRankHandWins": 2000000,
      "actualRounds": 21012715,
      "winFrequency": 42.4351,
      "rtp": 96.75,
      "liveOdds": "1.28:1",
      "for965": "1.27:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Three of a Kind": {
      "wins": 606342,
      "perHandRankHandWins": 2000000,
      "actualRounds": 21000416,
      "winFrequency": 30.3171,
      "rtp": 97.32,
      "liveOdds": "2.21:1",
      "for965": "2.18:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Four of a Kind": {
      "wins": 416206,
      "perHandRankHandWins": 2000000,
      "actualRounds": 21016151,
      "winFrequency": 20.8103,
      "rtp": 96.35,
      "liveOdds": "3.63:1",
      "for965": "3.64:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H9:Straight": {
      "wins": 123055,
      "perHandRankHandWins": 2000000,
      "actualRounds": 21001176,
      "winFrequency": 6.1528,
      "rtp": 95.98,
      "liveOdds": "14.6:1",
      "for965": "14.68:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Full House": {
      "wins": 553148,
      "perHandRankHandWins": 2000000,
      "actualRounds": 35090437,
      "winFrequency": 27.6574,
      "rtp": 95.69,
      "liveOdds": "2.46:1",
      "for965": "2.49:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Straight": {
      "wins": 500802,
      "perHandRankHandWins": 2000000,
      "actualRounds": 35072158,
      "winFrequency": 25.0401,
      "rtp": 96.15,
      "liveOdds": "2.84:1",
      "for965": "2.85:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Three of a Kind": {
      "wins": 332437,
      "perHandRankHandWins": 2000000,
      "actualRounds": 35053028,
      "winFrequency": 16.6218,
      "rtp": 96.24,
      "liveOdds": "4.79:1",
      "for965": "4.81:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Two Pair": {
      "wins": 326796,
      "perHandRankHandWins": 2000000,
      "actualRounds": 35053052,
      "winFrequency": 16.3398,
      "rtp": 97.55,
      "liveOdds": "4.97:1",
      "for965": "4.91:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Flush": {
      "wins": 218485,
      "perHandRankHandWins": 2000000,
      "actualRounds": 35046102,
      "winFrequency": 10.9243,
      "rtp": 95.15,
      "liveOdds": "7.71:1",
      "for965": "7.83:1",
      "passed": true,
      "status": "complete"
    },
    "perHandRank:H10:Four of a Kind": {
      "wins": 70000,
      "perHandRankHandWins": 2000000,
      "actualRounds": 35078197,
      "winFrequency": 3.5,
      "rtp": 95.9,
      "liveOdds": "26.4:1",
      "for965": "26.57:1",
      "passed": true,
      "status": "complete"
    },
    "color:3R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.91:1",
      "for965": "0.93:1",
      "passed": false,
      "status": "complete"
    },
    "color:3B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.91:1",
      "for965": "0.93:1",
      "passed": false,
      "status": "complete"
    },
    "color:4R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "4.75:1",
      "for965": "4.8:1",
      "passed": false,
      "status": "complete"
    },
    "color:4B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "4.75:1",
      "for965": "4.79:1",
      "passed": false,
      "status": "complete"
    },
    "color:5R": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "43:1",
      "for965": "43.35:1",
      "passed": false,
      "status": "complete"
    },
    "color:5B": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "43:1",
      "for965": "43.28:1",
      "passed": false,
      "status": "complete"
    },
    "lhState:2L2H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.904:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:2L2H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.904:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:3L1H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.06:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:3L1H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.79:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:1L3H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.79:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:1L3H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.06:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:4L0H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.23:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:4L0H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.68:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:0L4H:LOW": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "0.68:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    },
    "lhState:0L4H:HIGH": {
      "wins": 0,
      "perHandRankHandWins": null,
      "actualRounds": 0,
      "winFrequency": 0,
      "rtp": 0,
      "liveOdds": "1.23:1",
      "for965": "\u2014",
      "passed": false,
      "status": "complete"
    }
  }
};

// Pre-populate localStorage + state with seed data from the May-14 audit run.
// Called from the "Load Prior Results" button in the UI.
function loadSeedDataToStorage() {
  Object.entries(SEED_AUDIT_DATA).forEach(([moduleId, bets]) => {
    const keys = getStorageKeys(moduleId);
    localStorage.setItem(keys.results, JSON.stringify(bets));
    localStorage.setItem(keys.progress, String(Object.keys(bets).length));
  });
}

function getStorageKeys(moduleId) {
  return {
    results: `certAudit_${moduleId}_results`,
    progress: `certAudit_${moduleId}_progress`,
    checkpoint: `certAudit_${moduleId}_checkpoint`, // partial progress for current in-flight bet
  };
}

function saveCheckpoint(moduleId, betKey, data) {
  try {
    localStorage.setItem(getStorageKeys(moduleId).checkpoint, JSON.stringify({ betKey, ...data }));
  } catch {}
}

function loadCheckpoint(moduleId) {
  try {
    const raw = localStorage.getItem(getStorageKeys(moduleId).checkpoint);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearCheckpoint(moduleId) {
  try { localStorage.removeItem(getStorageKeys(moduleId).checkpoint); } catch {}
}

function formatElapsed(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function loadFromStorage(moduleId) {
  const keys = getStorageKeys(moduleId);
  try {
    const results = JSON.parse(localStorage.getItem(keys.results) || '{}');
    const progress = parseInt(localStorage.getItem(keys.progress) || '0');
    return { results, progress };
  } catch {
    return { results: {}, progress: 0 };
  }
}

function clearFromStorage(moduleId) {
  const keys = getStorageKeys(moduleId);
  localStorage.removeItem(keys.results);
  localStorage.removeItem(keys.progress);
  localStorage.removeItem(keys.checkpoint);
}

// ── Database persistence helpers ──────────────────────────────────────────────
async function saveResultToDb(moduleId, betKey, result) {
  try {
    const existing = await base44.entities.CertAuditResult.filter({ module_id: moduleId, bet_key: betKey });
    if (existing && existing.length > 0) {
      await base44.entities.CertAuditResult.update(existing[0].id, { result_json: JSON.stringify(result) });
    } else {
      await base44.entities.CertAuditResult.create({ module_id: moduleId, bet_key: betKey, result_json: JSON.stringify(result) });
    }
  } catch (e) { /* silent — localStorage is still the primary cache */ }
}

async function saveProgressToDb(moduleId, progress) {
  try {
    const existing = await base44.entities.CertAuditResult.filter({ module_id: moduleId, bet_key: '__progress__' });
    if (existing && existing.length > 0) {
      await base44.entities.CertAuditResult.update(existing[0].id, { progress });
    } else {
      await base44.entities.CertAuditResult.create({ module_id: moduleId, bet_key: '__progress__', result_json: '{}', progress });
    }
  } catch (e) {}
}

async function loadFromDb(moduleId) {
  try {
    const rows = await base44.entities.CertAuditResult.filter({ module_id: moduleId });
    if (!rows || rows.length === 0) return null;
    const results = {};
    let progress = 0;
    rows.forEach(row => {
      if (row.bet_key === '__progress__') {
        progress = row.progress || 0;
      } else {
        try { results[row.bet_key] = JSON.parse(row.result_json); } catch {}
      }
    });
    return { results, progress };
  } catch (e) { return null; }
}

async function clearFromDb(moduleId) {
  try {
    const rows = await base44.entities.CertAuditResult.filter({ module_id: moduleId });
    if (rows && rows.length > 0) {
      await Promise.all(rows.map(r => base44.entities.CertAuditResult.delete(r.id)));
    }
  } catch (e) {}
}

async function migrateLocalStorageToDb(moduleId) {
  const { results, progress } = loadFromStorage(moduleId);
  if (Object.keys(results).length === 0) return;
  // Check if DB already has data for this module
  try {
    const existing = await base44.entities.CertAuditResult.filter({ module_id: moduleId });
    if (existing && existing.length > 0) return; // already migrated
  } catch { return; }
  // Save each result to DB
  for (const [betKey, result] of Object.entries(results)) {
    await saveResultToDb(moduleId, betKey, result);
  }
  await saveProgressToDb(moduleId, progress);
}
// ─────────────────────────────────────────────────────────────────────────────

function StatusIcon({ status }) {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (status === 'fail') return <XCircle className="w-4 h-4 text-red-400" />;
  if (status === 'warn') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return null;
}

function RTPPill({ rtp, low, high }) {
  const v = parseFloat(rtp);
  const ok = v >= low && v <= high;
  const warn = !ok && v >= low - 1 && v <= high + 1;
  if (ok) return <span className="text-green-400 font-bold">{rtp}%</span>;
  if (warn) return <span className="text-amber-400 font-bold">{rtp}%</span>;
  return <span className="text-red-400 font-bold">{rtp}%</span>;
}

function SaveToast({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-700/50 rounded px-2 py-1"
        >
          <Save className="w-3 h-3" /> Saving...
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModulePanel({ module, bets, onResultsChange, onExportCertificate }) {
  const [running, setRunning] = useState(false);
  const [redoingKey, setRedoingKey] = useState(null);
  const [progress, setProgress] = useState(() => loadFromStorage(module.id).progress);
  const [results, setResults] = useState(() => loadFromStorage(module.id).results);
  const onResultsChangeRef = useRef(onResultsChange);
  useEffect(() => { onResultsChangeRef.current = onResultsChange; }, [onResultsChange]);

  // On mount: always load from DB (source of truth), fall back to localStorage
  useEffect(() => {
    const init = async () => {
      const dbData = await loadFromDb(module.id);
      if (dbData && Object.keys(dbData.results).length > 0) {
        // DB is the source of truth — always restore from it
        setResults(dbData.results);
        setProgress(dbData.progress);
        try {
          localStorage.setItem(getStorageKeys(module.id).results, JSON.stringify(dbData.results));
          localStorage.setItem(getStorageKeys(module.id).progress, String(dbData.progress));
        } catch {}
        onResultsChangeRef.current?.(module.id, dbData.results);

        // Check if there's an orphaned redo checkpoint (interrupted redo after a refresh).
        // If a checkpoint exists for a bet that already has a result, the row-level
        // "Resume Redo" button will surface it automatically — just expand the panel.
        const cp = loadCheckpoint(module.id);
        if (cp && cp.betKey && cp.totalRounds > 0 && cp.totalRounds < module.rounds) {
          // A partial run was interrupted — auto-expand so the user sees the Resume button
          setExpanded(true);
        }
      } else {
        // No DB data — check localStorage and migrate it up
        const local = loadFromStorage(module.id);
        if (Object.keys(local.results).length > 0) {
          migrateLocalStorageToDb(module.id);
        }
        // Also check for an orphaned checkpoint on a fresh-run interruption
        const cp = loadCheckpoint(module.id);
        if (cp && cp.betKey && cp.totalRounds > 0) {
          setExpanded(true);
        }
      }
    };
    init();
  }, [module.id]);
  const [currentBet, setCurrentBet] = useState('');
  const [betProgress, setBetProgress] = useState(0);
  const [betDone, setBetDone] = useState(0);
  const [betTotal, setBetTotal] = useState(0);
  const [betWins, setBetWins] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortRef = useRef(false);
  const workerRef = useRef(null);
  const savingTimerRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const betStartTimeRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, []);

  const startBetTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const startTime = Date.now();
    betStartTimeRef.current = startTime;
    setElapsedSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      const start = betStartTimeRef.current;
      if (start) setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 500);
  }, []);

  const stopBetTimer = useCallback(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
  }, []);

  const livePayouts = {
    handPayouts: [...CARDED_HAND_PAYOUTS],
    rankPayouts: { ...HAND_RANK_PAYOUTS },
    colorPayouts: { ...COLOR_BOARD_PAYOUTS },
    lhPayout: LOW_HIGH_PAYOUT,
    perHandRankPayouts: PER_HAND_RANK_PAYOUTS,
  };

  const showSaving = useCallback(() => {
    setSaving(true);
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    savingTimerRef.current = setTimeout(() => setSaving(false), 1200);
  }, []);

  const runFrom = async (startIndex) => {
    setRunning(true);
    abortRef.current = false;

    for (let i = startIndex; i < bets.length; i++) {
      if (abortRef.current) break;
      const bet = bets[i];
      const betKey = `${bet.betType}:${bet.betKey}`;

      // Check if there's a saved checkpoint for this exact bet
      const savedCheckpoint = loadCheckpoint(module.id);
      const resumeFrom = (savedCheckpoint && savedCheckpoint.betKey === betKey) ? savedCheckpoint : null;
      if (resumeFrom) {
        // Restore wins display from checkpoint
        setBetWins(resumeFrom.totalWins ?? 0);
        setBetDone(resumeFrom.totalRounds ?? 0);
        setBetTotal(module.rounds);
      } else {
        setBetWins(0);
        setBetDone(0);
        setBetTotal(module.rounds);
      }

      setCurrentBet(bet.label);
      setBetProgress(resumeFrom ? (resumeFrom.totalRounds ?? 0) / module.rounds : 0);
      startBetTimer();

      try {
        const { promise, abort: abortWorker } = runBetAuditWithAbort(
          {
            rounds: module.rounds,
            betType: bet.betType,
            betKey: bet.betKey,
            handPayouts: livePayouts.handPayouts,
            rankPayouts: livePayouts.rankPayouts,
            colorPayouts: livePayouts.colorPayouts,
            lhPayout: livePayouts.lhPayout,
            perHandRankPayouts: livePayouts.perHandRankPayouts,
            captureLog: false,
            resumeFrom: resumeFrom ? {
              totalRounds: resumeFrom.totalRounds,
              totalWins: resumeFrom.totalWins,
              totalPaid: resumeFrom.totalPaid,
              totalCardedHandWins: resumeFrom.totalCardedHandWins,
              totalRankNonExceptionWins: resumeFrom.totalRankNonExceptionWins,
              totalLostToHouseWins: resumeFrom.totalLostToHouseWins,
              perHandRankHandWins: resumeFrom.perHandRankHandWins,
              rankBreakdownCounts: resumeFrom.rankBreakdownCounts,
            } : undefined,
          },
          (pct, done, total) => {
            setBetProgress(pct);
            if (done !== undefined) setBetDone(done);
            if (total !== undefined) setBetTotal(total);
          },
          (checkpointAt, data) => {
            // Save checkpoint to localStorage so a refresh can resume here
            saveCheckpoint(module.id, betKey, data);
            setBetWins(data.totalWins ?? 0);
          }
        );
        workerRef.current = { abort: abortWorker };
        const res = await promise;
        workerRef.current = null;
        stopBetTimer();
        if (abortRef.current) break;
        if (res.success) {
          clearCheckpoint(module.id);
          setResults(prev => {
            const updated = { ...prev, [betKey]: res };
            try {
              localStorage.setItem(getStorageKeys(module.id).results, JSON.stringify(updated));
            } catch {}
            onResultsChangeRef.current?.(module.id, updated);
            return updated;
          });
          // Also persist to database
          saveResultToDb(module.id, betKey, res);
          const newProgress = i + 1;
          setProgress(newProgress);
          setBetProgress(0);
          setBetWins(0);
          setBetDone(0);
          try { localStorage.setItem(getStorageKeys(module.id).progress, String(newProgress)); } catch {}
          saveProgressToDb(module.id, newProgress);
          showSaving();
        }
      } catch (err) {
        workerRef.current = null;
        stopBetTimer();
        if (abortRef.current) break;
      }
    }
    setRunning(false);
    setCurrentBet('');
    setBetProgress(0);
    setBetWins(0);
    setBetDone(0);
    stopBetTimer();
    workerRef.current = null;
  };

  const redoSingleBet = async (bet, fromCheckpoint) => {
    if (running || redoingKey) return;
    const betKey = `${bet.betType}:${bet.betKey}`;

    // Load checkpoint: use passed-in checkpoint or check stored one
    const savedCheckpoint = fromCheckpoint || loadCheckpoint(module.id);
    const resumeFrom = (savedCheckpoint && savedCheckpoint.betKey === betKey) ? savedCheckpoint : null;

    setRedoingKey(betKey);
    setCurrentBet(bet.label);
    setBetProgress(resumeFrom ? (resumeFrom.totalRounds ?? 0) / module.rounds : 0);
    setBetWins(resumeFrom ? (resumeFrom.totalWins ?? 0) : 0);
    setBetDone(resumeFrom ? (resumeFrom.totalRounds ?? 0) : 0);
    setBetTotal(module.rounds);
    startBetTimer();
    abortRef.current = false;

    try {
      const { promise, abort: abortWorker } = runBetAuditWithAbort(
        {
          rounds: module.rounds,
          betType: bet.betType,
          betKey: bet.betKey,
          handPayouts: livePayouts.handPayouts,
          rankPayouts: livePayouts.rankPayouts,
          colorPayouts: livePayouts.colorPayouts,
          lhPayout: livePayouts.lhPayout,
          perHandRankPayouts: livePayouts.perHandRankPayouts,
          captureLog: false,
          resumeFrom: resumeFrom ? {
            totalRounds: resumeFrom.totalRounds,
            totalWins: resumeFrom.totalWins,
            totalPaid: resumeFrom.totalPaid,
            totalCardedHandWins: resumeFrom.totalCardedHandWins,
            totalRankNonExceptionWins: resumeFrom.totalRankNonExceptionWins,
            totalLostToHouseWins: resumeFrom.totalLostToHouseWins,
            perHandRankHandWins: resumeFrom.perHandRankHandWins,
            rankBreakdownCounts: resumeFrom.rankBreakdownCounts,
          } : undefined,
        },
        (pct, done, total) => {
          setBetProgress(pct);
          if (done !== undefined) setBetDone(done);
          if (total !== undefined) setBetTotal(total);
        },
        (checkpointAt, data) => {
          // Save checkpoint so a glitch during redo can be resumed
          saveCheckpoint(module.id, betKey, data);
          setBetWins(data.totalWins ?? 0);
        }
      );
      workerRef.current = { abort: abortWorker };
      const res = await promise;
      workerRef.current = null;
      stopBetTimer();
      if (res.success) {
        clearCheckpoint(module.id);
        setResults(prev => {
          const updated = { ...prev, [betKey]: res };
          try { localStorage.setItem(getStorageKeys(module.id).results, JSON.stringify(updated)); } catch {}
          onResultsChangeRef.current?.(module.id, updated);
          return updated;
        });
        // Also persist to database
        saveResultToDb(module.id, betKey, res);
        showSaving();
      }
    } catch (err) {
      workerRef.current = null;
      stopBetTimer();
    }
    setRedoingKey(null);
    setCurrentBet('');
    setBetProgress(0);
    setBetWins(0);
    setBetDone(0);
  };

  const run = () => {
    setResults({});
    setProgress(0);
    clearFromStorage(module.id); // also clears checkpoint
    runFrom(0);
    setExpanded(true);
  };

  const continueRun = () => {
    runFrom(progress);
    setExpanded(true);
  };

  const abort = () => {
    abortRef.current = true;
    if (workerRef.current) { workerRef.current.abort(); workerRef.current = null; }
  };

  const clearPanel = () => {
    abort();
    setResults({});
    setProgress(0);
    clearFromStorage(module.id);
    clearFromDb(module.id);
    onResultsChange?.(module.id, {});
  };

  const done = Object.keys(results).length;
  const pct = Math.round((done / bets.length) * 100);
  const canContinue = !running && progress > 0 && progress < bets.length;

  const passed = Object.values(results).filter(r => {
    const v = parseFloat(r.rtp);
    return v >= module.rtpLow && v <= module.rtpHigh;
  }).length;
  const failed = done - passed;

  const blendedRtp = done > 0
    ? (Object.values(results).reduce((sum, r) => sum + parseFloat(r.rtp), 0) / done).toFixed(2)
    : null;

  const overallPass = done === bets.length && failed === 0;
  const overallFail = done > 0 && failed > 0;

  return (
    <div className={`bg-slate-800/60 border rounded-xl overflow-hidden ${module.accentColor}`}>
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{module.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${module.badge}`}>
                {module.standard}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{module.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <SaveToast show={saving} />
          {done > 0 && (
            <div className="text-right">
              <div className="text-xs text-gray-400">{done}/{bets.length} bets</div>
              {blendedRtp && (
                <div className="text-sm font-bold">
                  Blended RTP: <RTPPill rtp={blendedRtp} low={module.rtpLow} high={module.rtpHigh} />
                </div>
              )}
            </div>
          )}
          {overallPass && <CheckCircle2 className="w-6 h-6 text-green-400" />}
          {overallFail && <XCircle className="w-6 h-6 text-red-400" />}

          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {!running && canContinue && (
              <button
                onClick={continueRun}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black font-semibold text-sm transition-all whitespace-nowrap"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Continue ({progress}/{bets.length} done)
              </button>
            )}
            {!running && !canContinue && (
              <button
                onClick={run}
                disabled={running}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5" />
                {done > 0 ? 'Re-run' : 'Start Audit'}
              </button>
            )}
            {running && (
              <button
                onClick={abort}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-600 text-red-400 font-semibold text-sm hover:bg-red-900/20 transition-all whitespace-nowrap"
              >
                <XCircle className="w-3.5 h-3.5" />
                Abort
              </button>
            )}
            {done > 0 && !running && (
              <>
                <button
                  onClick={() => onExportCertificate?.(module.id)}
                  title="Export official certificate PDF for this module"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-700/60 bg-amber-900/20 text-amber-300 text-sm hover:bg-amber-900/40 transition-all font-semibold whitespace-nowrap"
                >
                  <Award className="w-3.5 h-3.5" /> Certificate
                </button>
                <button
                  onClick={clearPanel}
                  title="Clear this module's data"
                  className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-600 text-gray-500 text-sm hover:text-red-400 hover:border-red-700 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-700 px-5 pb-5 pt-3">
              {(running || redoingKey) && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      {redoingKey ? `Re-running: ${currentBet}` : currentBet}
                    </span>
                    {!redoingKey && <span>{done}/{bets.length} — {pct}%</span>}
                  </div>
                  {!redoingKey && (
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden mb-1">
                      <motion.div
                        className="h-1.5 rounded-full bg-green-500"
                        animate={{ width: `${pct}%` }}
                        transition={{ ease: 'linear', duration: 0.2 }}
                      />
                    </div>
                  )}
                  {betProgress > 0 && (
                    <>
                      <div className="w-full bg-slate-700/50 rounded-full h-1 overflow-hidden mb-1">
                        <motion.div
                          className="h-1 rounded-full bg-yellow-400/60"
                          animate={{ width: `${Math.round(betProgress * 100)}%` }}
                          transition={{ ease: 'linear', duration: 0.15 }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs mt-0.5">
                        <span className="text-purple-400 font-mono">
                          {betWins > 0 && <span>{betWins.toLocaleString()} wins · </span>}
                          {betDone > 0 && <span>{betDone.toLocaleString()} / {betTotal.toLocaleString()} rounds</span>}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-400/70 font-mono">
                          <Timer className="w-3 h-3" />
                          {formatElapsed(elapsedSeconds)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {done > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Blended RTP</p>
                      <p className="text-xl font-black">
                        {blendedRtp ? <RTPPill rtp={blendedRtp} low={module.rtpLow} high={module.rtpHigh} /> : '—'}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Passed</p>
                      <p className="text-xl font-black text-green-400">{passed} / {done}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Failed</p>
                      <p className={`text-xl font-black ${failed > 0 ? 'text-red-400' : 'text-gray-500'}`}>{failed}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700 text-gray-400 uppercase">
                          <th className="py-2 px-3 text-left">Bet</th>
                          <th className="py-2 px-3 text-right">Wins</th>
                          <th className="py-2 px-3 text-right text-purple-400">Card Wins</th>
                          <th className="py-2 px-3 text-right text-slate-400"># Rounds</th>
                          <th className="py-2 px-3 text-right">Win %</th>
                          <th className="py-2 px-3 text-right">RTP</th>
                          <th className="py-2 px-3 text-right">Live Odds</th>
                          <th className="py-2 px-3 text-right">For 96.5%</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bets.map(bet => {
                          const key = `${bet.betType}:${bet.betKey}`;
                          const r = results[key];
                          const isRunning = running && currentBet === bet.label;
                          // Check for orphaned checkpoint on this pending bet (e.g. page refreshed mid-run)
                          const pendingCheckpoint = (() => {
                            const cp = loadCheckpoint(module.id);
                            return cp && cp.betKey === key && cp.totalRounds > 0 && cp.totalRounds < module.rounds ? cp : null;
                          })();

                          if (!r && !isRunning) return (
                            <tr key={key} className="border-b border-slate-700/30">
                              <td className="py-1.5 px-3 text-gray-500">{bet.label}</td>
                              <td colSpan="7" className="py-1.5 px-3 text-gray-700 italic">pending</td>
                              <td className="py-1.5 px-3 text-center">
                                {pendingCheckpoint && !running && !redoingKey && (
                                  <button
                                    onClick={() => redoSingleBet(bet, pendingCheckpoint)}
                                    title={`Resume from ${pendingCheckpoint.totalRounds?.toLocaleString()} / ${module.rounds.toLocaleString()} rounds`}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-600/50 hover:bg-yellow-700/50 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                                  >
                                    <SkipForward className="w-3 h-3" />
                                    Resume ({Math.round((pendingCheckpoint.totalRounds / module.rounds) * 100)}%)
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                          if (!r && isRunning) return (
                            <tr key={key} className="border-b border-slate-700/30 bg-slate-700/20">
                              <td className="py-1.5 px-3 text-yellow-400 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin" /> {bet.label}
                              </td>
                              <td colSpan="8" className="py-1.5 px-3 text-yellow-600 italic text-xs">running...</td>
                            </tr>
                          );
                          const rtpV = parseFloat(r.rtp);
                          const status = rtpV >= module.rtpLow && rtpV <= module.rtpHigh ? 'pass' : 'fail';
                          const livePayout = getLivePayout(bet.betType, bet.betKey);
                          const isRedoing = redoingKey === key;
                          // Check if there's a saved checkpoint for this specific bet (covers both redo interruptions AND fresh-run interruptions)
                          const redoCheckpoint = (() => {
                            const cp = loadCheckpoint(module.id);
                            return cp && cp.betKey === key ? cp : null;
                          })();
                          // Show Resume button if: not currently running anything, a checkpoint exists for this bet with partial progress
                          const canContinueRedo = !running && !redoingKey && redoCheckpoint && redoCheckpoint.totalRounds > 0 && redoCheckpoint.totalRounds < module.rounds;
                          return (
                           <motion.tr
                             key={key}
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             className={`border-b border-slate-700/30 hover:bg-slate-700/10 ${isRedoing ? 'bg-yellow-900/10' : ''}`}
                           >
                             <td className="py-1.5 px-3 text-gray-200 font-medium">
                               {isRedoing ? (
                                 <span className="flex items-center gap-1 text-yellow-400">
                                   <RefreshCw className="w-3 h-3 animate-spin" /> {bet.label}
                                 </span>
                               ) : bet.label}
                             </td>
                             <td className="py-1.5 px-3 text-right text-gray-300 font-mono">{r.wins.toLocaleString()}</td>
                             <td className="py-1.5 px-3 text-right font-mono text-xs">
                               {bet.betType === 'perHandRank' && r.perHandRankHandWins
                                 ? <span className="text-purple-400">{r.perHandRankHandWins.toLocaleString()}</span>
                                 : <span className="text-gray-700">—</span>}
                             </td>
                             <td className="py-1.5 px-3 text-right font-mono text-xs">
                               {bet.betType === 'perHandRank' && r.actualRounds
                                 ? <span className="text-slate-400">{r.actualRounds.toLocaleString()}</span>
                                 : <span className="text-gray-700">—</span>}
                             </td>
                             <td className="py-1.5 px-3 text-right text-gray-400">
                               {r.winFrequency}%
                             </td>
                             <td className="py-1.5 px-3 text-right">
                               <RTPPill rtp={parseFloat(r.rtp).toFixed(2)} low={module.rtpLow} high={module.rtpHigh} />
                             </td>
                             <td className="py-1.5 px-3 text-right text-gray-400">{livePayout}:1</td>
                             <td className="py-1.5 px-3 text-right text-yellow-300 font-semibold">{r.for965}:1</td>
                             <td className="py-1.5 px-3 text-center">
                               <div className="flex flex-col items-center gap-1">
                                 {status === 'pass' ? (
                                   isRedoing ? (
                                     <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400">
                                       <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                       RUNNING
                                     </span>
                                   ) : (
                                     <button
                                       onClick={() => redoSingleBet(bet)}
                                       disabled={!!(running || redoingKey)}
                                       title="Click to re-run this passed test"
                                       className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 hover:bg-green-700/50 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                     >
                                       <CheckCircle2 className="w-4 h-4" />
                                       PASS
                                     </button>
                                   )
                                 ) : isRedoing ? (
                                   <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400">
                                     <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                     RUNNING
                                   </span>
                                 ) : (
                                   <button
                                     onClick={() => redoSingleBet(bet)}
                                     disabled={!!(running || redoingKey)}
                                     title="Click to re-run this failed test"
                                     className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 hover:bg-red-700/50 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                   >
                                     <XCircle className="w-4 h-4" />
                                     FAIL
                                   </button>
                                 )}
                                 {canContinueRedo && (
                                   <button
                                     onClick={() => redoSingleBet(bet, redoCheckpoint)}
                                     title={`Continue redo from ${redoCheckpoint.totalRounds?.toLocaleString()} rounds`}
                                     className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400 hover:bg-yellow-700/50 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                                   >
                                     <SkipForward className="w-3 h-3" />
                                     Continue Redo
                                   </button>
                                 )}
                               </div>
                             </td>
                           </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {done === bets.length && (
                    <div className={`mt-4 rounded-lg px-4 py-3 border text-sm font-semibold flex items-center gap-2 ${
                      failed === 0
                        ? 'bg-green-900/20 border-green-700 text-green-300'
                        : 'bg-red-900/20 border-red-700 text-red-300'
                    }`}>
                      {failed === 0
                        ? <><CheckCircle2 className="w-5 h-5" /> All {bets.length} bets PASSED {module.standard} — RTP range {module.rtpLow}%–{module.rtpHigh}%</>
                        : <><XCircle className="w-5 h-5" /> {failed} of {bets.length} bets FAILED {module.standard} — review For 96.5% column and adjust payouts</>
                      }
                    </div>
                  )}
                </>
              )}

              {done === 0 && !running && (
                <p className="text-gray-500 text-sm text-center py-6">
                  Click <span className="text-green-400 font-semibold">Start Audit</span> to begin the {module.name} audit ({module.rounds.toLocaleString()} rounds/bet × {bets.length} bets)
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CertificationAudit() {
  const [moduleResults, setModuleResults] = useState(() => {
    const out = {};
    MODULES.forEach(m => {
      const { results, progress } = loadFromStorage(m.id);
      out[m.id] = { results, progress };
    });
    return out;
  });

  const handleResultsChange = useCallback((moduleId, results) => {
    setModuleResults(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], results } }));
  }, []);

  const totalDone = MODULES.reduce((sum, m) => {
    return sum + Object.keys(moduleResults[m.id]?.results || {}).length;
  }, 0);
  const hasAnyResults = totalDone > 0;

  const clearAll = () => {
    MODULES.forEach(m => { clearFromStorage(m.id); clearFromDb(m.id); });
    setModuleResults(() => {
      const out = {};
      MODULES.forEach(m => { out[m.id] = { results: {}, progress: 0 }; });
      return out;
    });
  };

  const loadPriorResults = () => {
    loadSeedDataToStorage();
    // Re-read from storage into state
    setModuleResults(() => {
      const out = {};
      MODULES.forEach(m => {
        const { results, progress } = loadFromStorage(m.id);
        out[m.id] = { results, progress };
      });
      return out;
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleString();
    const ROW_H = 7;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(250, 204, 21);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapid Fire Texas 10 — Certification Audit Report', 10, 10);
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text('GLI-11 / BMM / eCOGRA Standards Compliance', 10, 17);
    doc.setFontSize(7);
    doc.text(`Generated: ${now}  |  32-card engine  |  Multi-tier certification`, pageW - 10, 17, { align: 'right' });

    let y = 30;

    MODULES.forEach(module => {
      const storedResults = moduleResults[module.id]?.results || {};
      const done = Object.keys(storedResults).length;
      if (done === 0) return;

      if (y > 170) { doc.addPage(); y = 15; }

      doc.setFillColor(20, 30, 60);
      doc.rect(10, y - 5, pageW - 20, 8, 'F');
      doc.setTextColor(250, 204, 21);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${module.name}  —  ${module.standard}  (RTP ${module.rtpLow}%–${module.rtpHigh}%)`, 12, y);
      y += 8;

      const colX = [10, 62, 86, 107, 126, 146, 164, 182, 258];
      const headers = ['Bet', 'Wins', 'Card Wins', '# Rounds', 'Win %', 'Actual RTP', 'Live Odds', 'For 96.5%', 'Status'];

      doc.setFillColor(240, 240, 240);
      doc.rect(10, y - ROW_H + 1, pageW - 20, ROW_H, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => doc.text(h, colX[i], y));
      y += ROW_H;

      GROUPS.forEach(group => {
        const groupBets = ALL_BETS.filter(b => b.group === group);
        const hasAny = groupBets.some(b => storedResults[`${b.betType}:${b.betKey}`]);
        if (!hasAny) return;

        if (y > 185) { doc.addPage(); y = 15; }
        doc.setFillColor(220, 230, 255);
        doc.rect(10, y - ROW_H + 1, pageW - 20, ROW_H, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(group, 12, y);
        y += ROW_H;

        groupBets.forEach(bet => {
          const key = `${bet.betType}:${bet.betKey}`;
          const r = storedResults[key];
          if (!r) return;
          if (y > 185) { doc.addPage(); y = 15; }

          const rtp = parseFloat(r.rtp);
          const ok = rtp >= module.rtpLow && rtp <= module.rtpHigh;
          const livePayout = getLivePayout(bet.betType, bet.betKey);

          doc.setFillColor(255, 255, 255);
          doc.rect(10, y - ROW_H + 1, pageW - 20, ROW_H, 'F');
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(plainLabel(bet), colX[0], y);
          doc.text(r.wins.toLocaleString(), colX[1], y);
          // Card Wins (perHandRank only)
          doc.setTextColor(120, 80, 200);
          doc.text(bet.betType === 'perHandRank' && r.perHandRankHandWins ? r.perHandRankHandWins.toLocaleString() : '—', colX[2], y);
          // Actual Rounds (perHandRank only)
          doc.setTextColor(100, 100, 120);
          doc.text(bet.betType === 'perHandRank' && r.actualRounds ? r.actualRounds.toLocaleString() : '—', colX[3], y);
          doc.setTextColor(0, 0, 0);
          doc.text(r.winFrequency + '%', colX[4], y);
          if (ok) doc.setTextColor(0, 140, 60);
          else doc.setTextColor(200, 0, 0);
          doc.text(parseFloat(r.rtp).toFixed(2) + '%', colX[5], y);
          doc.setTextColor(0, 0, 0);
          doc.text(livePayout + ':1', colX[6], y);
          doc.setTextColor(160, 100, 0);
          doc.text(r.for965 + ':1', colX[7], y);
          doc.setTextColor(ok ? 0 : 180, ok ? 140 : 0, ok ? 60 : 0);
          doc.text(ok ? 'PASS' : 'FAIL', colX[8], y);
          y += ROW_H;
        });
        y += 2;
      });

      y += 6;
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Rapid Fire Texas 10 — Certification Audit  |  GLI-11 / BMM / eCOGRA  |  Page ${i} of ${totalPages}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }
    doc.save(`RapidFire_CertAudit_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportWord = () => {
    const now = new Date().toLocaleString();
    let tableRows = '';

    MODULES.forEach(module => {
      const storedResults = moduleResults[module.id]?.results || {};
      const done = Object.keys(storedResults).length;
      if (done === 0) return;

      tableRows += `<tr><td colspan="9" style="background:#0f172a;color:#facc15;font-weight:bold;font-size:11pt;padding:6px 8px;border:1px solid #334155;">
        ${module.name} — ${module.standard} (RTP ${module.rtpLow}%–${module.rtpHigh}%)
      </td></tr>`;

      const headers = ['Bet', 'Wins', 'Card Wins', '# Rounds', 'Win %', 'Actual RTP', 'Live Odds', 'For 96.5%', 'Status'];
      tableRows += `<tr>${headers.map(h => `<td style="background:#f0f0f0;font-weight:bold;border:1px solid #aaa;padding:3px 6px;">${h}</td>`).join('')}</tr>`;

      GROUPS.forEach(group => {
        const groupBets = ALL_BETS.filter(b => b.group === group);
        const hasAny = groupBets.some(b => storedResults[`${b.betType}:${b.betKey}`]);
        if (!hasAny) return;

        tableRows += `<tr><td colspan="9" style="background:#dce6ff;font-weight:bold;font-size:9pt;padding:3px 6px;border:1px solid #6480c8;">${group}</td></tr>`;

        groupBets.forEach(bet => {
          const key = `${bet.betType}:${bet.betKey}`;
          const r = storedResults[key];
          if (!r) return;
          const rtp = parseFloat(r.rtp);
          const ok = rtp >= module.rtpLow && rtp <= module.rtpHigh;
          const rtpColor = ok ? '#008000' : '#cc0000';
          const statusColor = ok ? '#008000' : '#cc0000';
          const livePayout = getLivePayout(bet.betType, bet.betKey);
          const td = (val, color = '#000') => `<td style="border:1px solid #ccc;padding:3px 6px;color:${color};font-weight:bold;">${val}</td>`;
          const cardWins = bet.betType === 'perHandRank' && r.perHandRankHandWins ? r.perHandRankHandWins.toLocaleString() : '—';
          const actualRounds = bet.betType === 'perHandRank' && r.actualRounds ? r.actualRounds.toLocaleString() : '—';
          tableRows += `<tr>
            ${td(plainLabel(bet))}
            ${td(r.wins.toLocaleString())}
            ${td(cardWins, '#7850c8')}
            ${td(actualRounds, '#666688')}
            ${td(r.winFrequency + '%')}
            ${td(parseFloat(r.rtp).toFixed(2) + '%', rtpColor)}
            ${td(livePayout + ':1')}
            ${td(r.for965 + ':1', '#a06400')}
            ${td(ok ? 'PASS' : 'FAIL', statusColor)}
          </tr>`;
        });
      });

      tableRows += `<tr><td colspan="9" style="padding:8px;border:none;">&nbsp;</td></tr>`;
    });

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head><meta charset="utf-8"><title>Certification Audit Report</title></head>
      <body style="font-family:Arial,sans-serif;font-size:9pt;">
        <h2>Rapid Fire Texas 10 &mdash; Certification Audit Report</h2>
        <p style="color:#444;">Generated: ${now} | Standards: GLI-11 / BMM Technical / eCOGRA | 32-card engine</p>
        <table style="border-collapse:collapse;width:100%;font-size:8.5pt;">${tableRows}</table>
        <p style="color:#888;font-size:8pt;margin-top:20px;">This report was generated by the Rapid Fire Texas 10 Gaming License Calibration Tool. All simulations run entirely in-browser using a certified 32-card engine.</p>
      </body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RapidFire_CertAudit_${new Date().toISOString().slice(0, 10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportModuleCertificate = (moduleId) => {
    const module = MODULES.find(m => m.id === moduleId);
    if (!module) return;
    const storedResults = moduleResults[moduleId]?.results || {};
    const done = Object.keys(storedResults).length;
    if (done === 0) return;

    const passed = Object.values(storedResults).filter(r => {
      const v = parseFloat(r.rtp);
      return v >= module.rtpLow && v <= module.rtpHigh;
    }).length;
    const failed = done - passed;
    const allPass = failed === 0 && done === ALL_BETS.length;
    const blendedRtp = (Object.values(storedResults).reduce((s, r) => s + parseFloat(r.rtp), 0) / done).toFixed(2);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const certNo = `RF-${moduleId.toUpperCase()}-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;

    // Page 1 (cover) = landscape A4 (297 × 210); pages 2+ (detail) = portrait A4 (210 × 297)
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pW = 297; // landscape width
    const pH = 210; // landscape height

    // ─── Shared helper: dark navy chrome with double gold border + corner ornaments ───
    const drawPageChrome = (w, h) => {
      doc.setFillColor(8, 12, 30);
      doc.rect(0, 0, w, h, 'F');
      doc.setFillColor(14, 20, 45);
      doc.rect(12, 12, w - 24, h - 24, 'F');
      // Outer thick gold border
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(2.2);
      doc.rect(6, 6, w - 12, h - 12);
      // Inner thin gold border
      doc.setDrawColor(220, 185, 110);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, w - 20, h - 20);
      // Corner ornaments (filled gold square + dark hollow)
      [[6,6],[w-13,6],[6,h-13],[w-13,h-13]].forEach(([cx, cy]) => {
        doc.setFillColor(197, 160, 89);
        doc.rect(cx - 1, cy - 1, 8, 8, 'F');
        doc.setFillColor(14, 20, 45);
        doc.rect(cx + 1, cy + 1, 4, 4, 'F');
      });
    };

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 1 — POLISHED LANDSCAPE COVER CERTIFICATE
    // Layout zones (mm, top-to-bottom within 210mm height):
    //   Header band:    y 6–42     (36mm)
    //   Title block:    y 44–78    (34mm)
    //   PASS banner:    y 80–95    (15mm)
    //   Summary boxes:  y 97–121   (24mm)
    //   Statement:      y 124–140  (16mm)
    //   Divider:        y 141
    //   Category RTPs:  y 143–164  (21mm)
    //   Hand rank RTPs: y 165–197  (32mm — 2 rows × 5 cols)
    //   Footer strip:   y 169–204  (35mm — overlaps hand ranks section when fewer hands)
    // ══════════════════════════════════════════════════════════════════════
    drawPageChrome(pW, pH);

    // ─────────────────────────────────────────────────────────────────────
    // LAYOUT (landscape A4: 297 × 210mm, inner border at y=10, bottom border at y=204)
    //  y10–28   Header band       18mm
    //  y30–44   Title + subtitle  14mm
    //  y46–56   PASS/FAIL banner  10mm
    //  y58–72   4 summary boxes   14mm
    //  y74–84   Compliance text   10mm
    //  y85      Divider
    //  y87–91   Category label     4mm
    //  y92–105  3 category boxes  13mm
    //  y107–153 10 hand boxes     46mm (2 rows × 20mm + gap)
    //  y154     Footer divider
    //  y155–193 Footer meta+seal  38mm
    //  y195–203 Bottom tagline     8mm (inside border)
    // ─────────────────────────────────────────────────────────────────────

    // ── Header band ───────────────────────────────────────────────────────
    doc.setFillColor(12, 18, 48);
    doc.rect(10, 10, pW - 20, 18, 'F');
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.5);
    doc.line(10, 28, pW - 10, 28);
    doc.setTextColor(197, 160, 89);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text("RAPID FIRE TEXAS HOLD'EM", pW / 2, 17, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setTextColor(165, 174, 210);
    doc.setFont('helvetica', 'normal');
    doc.text('32-Card Certified Game Engine  ·  Monte Carlo Simulation Platform', pW / 2, 22.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setTextColor(108, 118, 158);
    doc.text('Gaming Compliance & Certification Division', pW / 2, 26.5, { align: 'center' });

    // ── Title block ───────────────────────────────────────────────────────
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(250, 210, 40);
    doc.text('CERTIFICATE OF COMPLIANCE', pW / 2, 37, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(197, 160, 89);
    doc.text(`${module.name.toUpperCase()} AUDIT`, pW / 2, 43, { align: 'center' });
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.7);
    doc.line(20, 45.5, pW - 20, 45.5);
    doc.setLineWidth(0.2);
    doc.line(20, 47, pW - 20, 47);

    // ── PASS / FAIL banner ────────────────────────────────────────────────
    const bannerW = 88, bannerH = 9;
    const bannerX = pW / 2 - bannerW / 2;
    if (allPass) { doc.setFillColor(15, 110, 50); doc.setDrawColor(50, 200, 90); }
    else         { doc.setFillColor(150, 20, 20);  doc.setDrawColor(220, 60, 60); }
    doc.setLineWidth(0.5);
    doc.roundedRect(bannerX, 49, bannerW, bannerH, 2, 2, 'FD');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(allPass ? 'ALL BETS PASSED' : `${failed} BET(S) FAILED`, pW / 2, 55, { align: 'center' });

    // ── 4 Summary info boxes ──────────────────────────────────────────────
    const sbW = 58, sbH = 14;
    const sbTotalW = 4 * sbW;
    const sbGap = (pW - 20 - sbTotalW) / 5;
    const sbY = 60;
    [
      { label: 'Standard',    value: module.standard,                          bg: [18, 32, 82],  border: [90, 120, 210] },
      { label: 'Blended RTP', value: blendedRtp + '%',                         bg: allPass ? [14, 90, 42] : [100, 18, 18], border: allPass ? [50, 190, 90] : [210, 70, 70] },
      { label: 'Bets Passed', value: `${passed} / ${done}`,                   bg: [18, 32, 82],  border: [90, 120, 210] },
      { label: 'RTP Range',   value: `${module.rtpLow}%–${module.rtpHigh}%`, bg: [55, 40, 8],   border: [197, 160, 89] },
    ].forEach((b, i) => {
      const bx = 10 + sbGap + i * (sbW + sbGap);
      doc.setFillColor(...b.bg);
      doc.roundedRect(bx, sbY, sbW, sbH, 2, 2, 'F');
      doc.setDrawColor(...b.border);
      doc.setLineWidth(0.5);
      doc.roundedRect(bx, sbY, sbW, sbH, 2, 2, 'S');
      doc.setTextColor(148, 158, 200);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(b.label, bx + sbW / 2, sbY + 4.5, { align: 'center' });
      doc.setTextColor(250, 220, 100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(b.value, bx + sbW / 2, sbY + 11, { align: 'center' });
    });

    // ── Compliance statement ──────────────────────────────────────────────
    const stY = 79;
    doc.setTextColor(160, 168, 205);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    [
      `This certificate confirms that the above-named game engine has undergone a rigorous Monte Carlo statistical audit under the ${module.standard} standard.`,
      `All ${done} betting positions were simulated at ${module.rounds.toLocaleString()} rounds per bet using a certified 32-card randomised engine.`,
      `The Return to Player values fall within the declared range of ${module.rtpLow}%–${module.rtpHigh}%.`,
    ].forEach((l, i) => doc.text(l, pW / 2, stY + i * 4.5, { align: 'center' }));

    // ── Section divider ───────────────────────────────────────────────────
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.3);
    doc.line(20, 93, pW - 20, 93);
    doc.setTextColor(197, 160, 89);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('BLENDED RTP BY CATEGORY', pW / 2, 97, { align: 'center' });

    // Calculate group RTPs
    const groupRTPs = {};
    GROUPS.forEach(grp => {
      const gb = ALL_BETS.filter(b => b.group === grp);
      const gr = gb.map(b => storedResults[`${b.betType}:${b.betKey}`]).filter(Boolean);
      if (!gr.length) return;
      groupRTPs[grp] = (gr.reduce((s, r) => s + parseFloat(r.rtp), 0) / gr.length).toFixed(2);
    });
    const handRTPs = {};
    for (let hid = 1; hid <= 10; hid++) {
      const hb = ALL_BETS.filter(b => b.betType === 'perHandRank' && b.handId === hid);
      const hr = hb.map(b => storedResults[`${b.betType}:${b.betKey}`]).filter(Boolean);
      if (!hr.length) continue;
      handRTPs[hid] = (hr.reduce((s, r) => s + parseFloat(r.rtp), 0) / hr.length).toFixed(2);
    }

    const CAT_COLORS = {
      cardHand:   { bg: [18, 42, 90],  border: [75, 125, 220] },
      colorBoard: { bg: [8,  58, 62],  border: [45, 175, 185] },
      river:      { bg: [68, 32, 8],   border: [195, 115, 38] },
      handRank:   { bg: [38, 18, 80],  border: [125, 75, 220] },
    };

    // ── 3 category RTP boxes ──────────────────────────────────────────────
    const cbW = 72, cbH = 13, cbGap = 10;
    const cbTotalW = 3 * cbW + 2 * cbGap;
    const cbStartX = (pW - cbTotalW) / 2;
    const cbY = 99;
    [
      { label: 'Card Hand Blended RTP',   value: groupRTPs['Carded Hands'] || '—', colors: CAT_COLORS.cardHand },
      { label: 'Color Board Blended RTP', value: groupRTPs['Color Board']   || '—', colors: CAT_COLORS.colorBoard },
      { label: 'River Board Blended RTP', value: groupRTPs['Low / High']    || '—', colors: CAT_COLORS.river },
    ].forEach((b, i) => {
      const bx = cbStartX + i * (cbW + cbGap);
      const rtpNum = parseFloat(b.value);
      doc.setFillColor(...b.colors.bg);
      doc.roundedRect(bx, cbY, cbW, cbH, 2, 2, 'F');
      doc.setDrawColor(...b.colors.border);
      doc.setLineWidth(0.5);
      doc.roundedRect(bx, cbY, cbW, cbH, 2, 2, 'S');
      doc.setTextColor(168, 194, 220);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(b.label, bx + cbW / 2, cbY + 4.5, { align: 'center' });
      doc.setTextColor(240, 218, 100);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(b.value + (isNaN(rtpNum) ? '' : '%'), bx + cbW / 2, cbY + 10.5, { align: 'center' });
    });

    // ── 10 hand/rank RTP boxes (5 per row × 2 rows) ──────────────────────
    const HAND_SHORT = {
      1:'A/10 Rank Hand', 2:'K/K Rank Hand', 3:'Q/J Rank Hand', 4:'Q/10 Rank Hand', 5:'J/9 Rank Hand',
      6:'8/6 Rank Hand',  7:'7/7 Rank Hand', 8:'4/2 Rank Hand', 9:'3/3 Rank Hand',  10:'A/5 Rank Hand',
    };
    const footerDivY = 172;
    const hbW = 46.8, hbH = 18, hbCols = 5, hbGap = 4;
    const hbTotalW = hbCols * hbW + (hbCols - 1) * hbGap;
    const hbStartX = (pW - hbTotalW) / 2;
    const hbY0 = cbY + cbH + 4; // = 116

    for (let hid = 1; hid <= 10; hid++) {
      const rtp = handRTPs[hid];
      if (!rtp) continue;
      const idx = hid - 1;
      const col = idx % hbCols;
      const row = Math.floor(idx / hbCols);
      const bx = hbStartX + col * (hbW + hbGap);
      const by = hbY0 + row * (hbH + 5);
      // Gold background
      doc.setFillColor(197, 160, 89);
      doc.roundedRect(bx, by, hbW, hbH, 1.5, 1.5, 'F');
      // Black border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.roundedRect(bx, by, hbW, hbH, 1.5, 1.5, 'S');
      // Black bold text
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.text(HAND_SHORT[hid], bx + hbW / 2, by + 5, { align: 'center' });
      doc.setFontSize(4.5);
      doc.text('Blended RTP', bx + hbW / 2, by + 9, { align: 'center' });
      doc.setFontSize(8.5);
      doc.text(rtp + '%', bx + hbW / 2, by + 15, { align: 'center' });
    }

    // ── Footer strip — ~50% shorter than before (~28mm vs ~52mm) ─────────
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.3);
    doc.line(20, footerDivY, pW - 20, footerDivY);

    // Left: cert metadata — tighter spacing to fit reduced height
    const metaLineH = 6;
    [
      { label: 'Certificate No.:', value: certNo },
      { label: 'Issue Date:',       value: dateStr },
      { label: 'Engine:',           value: 'Rapid Fire Texas 10 — In-Browser Monte Carlo v1.0' },
    ].forEach((f, i) => {
      const fy = footerDivY + 6 + i * metaLineH;
      doc.setTextColor(115, 125, 165);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(f.label, 14, fy);
      doc.setTextColor(218, 192, 98);
      doc.setFont('helvetica', 'bold');
      doc.text(f.value, 14 + 28, fy);
    });

    // Right: smaller seal to fit reduced footer height
    const sX = pW - 32;
    const sY = footerDivY + 14; // centred in ~28mm footer
    doc.setFillColor(12, 18, 50);
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(1.0);
    doc.circle(sX, sY, 10, 'FD');
    doc.setDrawColor(220, 185, 110);
    doc.setLineWidth(0.4);
    doc.circle(sX, sY, 7.5, 'S');
    doc.setTextColor(197, 160, 89);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFIED', sX, sY - 2.5, { align: 'center' });
    doc.text(allPass ? 'COMPLIANT' : 'REVIEWED', sX, sY + 2, { align: 'center' });
    doc.setFontSize(4.5);
    doc.text(String(now.getFullYear()), sX, sY + 6, { align: 'center' });

    // Bottom tagline — inside the inner border (y=198 max, border is at y=200)
    doc.setTextColor(68, 74, 100);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Rapid Fire Texas 10  ·  ${module.name} Certification  ·  ${module.standard}  ·  ${dateStr}  ·  Page 1 of 1`,
      pW / 2, 200, { align: 'center' }
    );

    // ═══════════════════════════════════════════════════════════
    // PAGES 2+ — DETAILED RESULTS (professional dark table)
    // ═══════════════════════════════════════════════════════════
    // Columns — portrait A4 (210mm wide) for detail pages
    const dpW = 210, dpH = 297;
    const COL = {
      bet:    12,
      wins:   88,
      rounds: 108,
      winPct: 128,
      rtp:    146,
      odds:   161,
      for965: 175,
      result: 186,
    };
    const PILL_W = 13;
    const ROW_H = 7;
    const TABLE_LEFT = 12;
    const TABLE_RIGHT = dpW - 12;
    const TABLE_W = TABLE_RIGHT - TABLE_LEFT;

    let curY = 0;

    const startDataPage = () => {
      doc.addPage([210, 297], 'portrait'); // portrait A4 for detail pages
      const dpW = 210, dpH = 297;
      drawPageChrome(dpW, dpH);

      // Page header band
      doc.setFillColor(14, 22, 50);
      doc.rect(10, 10, dpW - 20, 20, 'F');
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.4);
      doc.line(10, 30, dpW - 10, 30);

      doc.setTextColor(197, 160, 89);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('RAPID FIRE TEXAS HOLD\'EM — DETAILED AUDIT RESULTS', dpW / 2, 18, { align: 'center' });
      doc.setTextColor(140, 148, 175);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${module.name}  ·  ${module.standard}  ·  ${module.rounds.toLocaleString()} rounds/bet  ·  Cert No. ${certNo}`, dpW / 2, 25, { align: 'center' });

      curY = 36;
    };

    const drawTableHeader = () => {
      doc.setFillColor(28, 40, 80);
      doc.rect(TABLE_LEFT, curY, TABLE_W, ROW_H, 'F');
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.4);
      doc.line(TABLE_LEFT, curY, TABLE_RIGHT, curY);
      doc.line(TABLE_LEFT, curY + ROW_H, TABLE_RIGHT, curY + ROW_H);

      doc.setTextColor(197, 160, 89);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text('Bet / Position', COL.bet + 1, curY + 5);
      doc.text('Wins', COL.wins, curY + 5, { align: 'right' });
      doc.text('# Rounds', COL.rounds, curY + 5, { align: 'right' });
      doc.text('Win %', COL.winPct, curY + 5, { align: 'right' });
      doc.text('Actual RTP', COL.rtp, curY + 5, { align: 'right' });
      doc.text('Live Odds', COL.odds, curY + 5, { align: 'right' });
      doc.text('For 96.5%', COL.for965, curY + 5, { align: 'right' });
      doc.text('Result', COL.result + PILL_W / 2, curY + 5, { align: 'center' });
      curY += ROW_H;
    };

    const drawGroupHeader = (label) => {
      if (curY > dpH - 30) { startDataPage(); drawTableHeader(); }
      doc.setFillColor(20, 30, 65);
      doc.rect(TABLE_LEFT, curY, TABLE_W, ROW_H - 1, 'F');
      doc.setDrawColor(100, 120, 180);
      doc.setLineWidth(0.3);
      doc.line(TABLE_LEFT, curY + ROW_H - 1, TABLE_RIGHT, curY + ROW_H - 1);
      doc.setTextColor(160, 180, 240);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(label.toUpperCase(), COL.bet + 2, curY + 5);
      curY += ROW_H;
    };

    const drawDataRow = (bet, r, rowIdx) => {
      if (curY > dpH - 22) { startDataPage(); drawTableHeader(); }
      const rtp = parseFloat(r.rtp);
      const ok = rtp >= module.rtpLow && rtp <= module.rtpHigh;
      const livePayout = getLivePayout(bet.betType, bet.betKey);
      const isHandRank = bet.betType === 'perHandRank';

      // Alternating row fill — no accent bar
      doc.setFillColor(rowIdx % 2 === 0 ? 18 : 22, rowIdx % 2 === 0 ? 26 : 32, rowIdx % 2 === 0 ? 52 : 62);
      doc.rect(TABLE_LEFT, curY, TABLE_W, ROW_H, 'F');

      // Subtle bottom rule
      doc.setDrawColor(35, 45, 80);
      doc.setLineWidth(0.15);
      doc.line(TABLE_LEFT, curY + ROW_H, TABLE_RIGHT, curY + ROW_H);

      const textY = curY + 5;

      // Bet label
      doc.setTextColor(210, 215, 235);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(plainLabel(bet).slice(0, 40), COL.bet + 1, textY);

      // Wins
      doc.setTextColor(190, 195, 220);
      doc.setFontSize(6);
      doc.text(r.wins.toLocaleString(), COL.wins, textY, { align: 'right' });

      // # Rounds — show actualRounds for perHandRank, else module rounds
      const roundsDisplay = isHandRank && r.actualRounds
        ? r.actualRounds.toLocaleString()
        : module.rounds.toLocaleString();
      doc.setTextColor(isHandRank ? 180 : 150, isHandRank ? 160 : 150, isHandRank ? 220 : 175);
      doc.text(roundsDisplay, COL.rounds, textY, { align: 'right' });

      // Win %
      doc.setTextColor(190, 195, 220);
      doc.text(r.winFrequency + '%', COL.winPct, textY, { align: 'right' });

      // RTP — coloured
      if (ok) doc.setTextColor(80, 220, 120);
      else if (rtp > module.rtpHigh) doc.setTextColor(255, 160, 50);
      else doc.setTextColor(255, 90, 90);
      doc.setFont('helvetica', 'bold');
      doc.text(rtp.toFixed(2) + '%', COL.rtp, textY, { align: 'right' });

      // Live odds
      doc.setTextColor(190, 195, 220);
      doc.setFont('helvetica', 'normal');
      doc.text(livePayout + ':1', COL.odds, textY, { align: 'right' });

      // For 96.5%
      doc.setTextColor(220, 185, 80);
      doc.text(r.for965 + ':1', COL.for965, textY, { align: 'right' });

      // PASS / FAIL pill — kept within table boundary
      const pillX = COL.result;
      const pillH = 4.5;
      if (ok) {
        doc.setFillColor(20, 130, 60);
        doc.setDrawColor(60, 200, 100);
      } else {
        doc.setFillColor(140, 20, 20);
        doc.setDrawColor(220, 70, 70);
      }
      doc.roundedRect(pillX, textY - 3.5, PILL_W, pillH, 1, 1, 'FD');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.text(ok ? 'PASS' : 'FAIL', pillX + PILL_W / 2, textY - 0.2, { align: 'center' });

      curY += ROW_H;
    };

    // Start first data page
    startDataPage();
    drawTableHeader();

    let rowIdx = 0;
    GROUPS.forEach(group => {
      const groupBets = ALL_BETS.filter(b => b.group === group);
      const hasAny = groupBets.some(b => storedResults[`${b.betType}:${b.betKey}`]);
      if (!hasAny) return;

      drawGroupHeader(group);

      groupBets.forEach(bet => {
        const key = `${bet.betType}:${bet.betKey}`;
        const r = storedResults[key];
        if (!r) return;
        drawDataRow(bet, r, rowIdx++);
      });

      // Small gap between groups
      curY += 2;
    });

    // Summary footer on last data page
    if (curY < dpH - 30) {
      curY += 4;
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.3);
      doc.line(TABLE_LEFT, curY, TABLE_RIGHT, curY);
      curY += 5;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(197, 160, 89);
      doc.text(`Total Bets Tested: ${done}`, TABLE_LEFT + 2, curY);
      doc.text(`Passed: ${passed}`, TABLE_LEFT + 50, curY);
      if (failed > 0) {
        doc.setTextColor(255, 100, 100);
        doc.text(`Failed: ${failed}`, TABLE_LEFT + 85, curY);
      }
      doc.setTextColor(allPass ? 80 : 220, allPass ? 220 : 80, allPass ? 80 : 80);
      doc.text(`Blended RTP: ${blendedRtp}%`, TABLE_LEFT + 120, curY);
    }

    // Page numbers — cover (page 1) and all detail pages
    const totalPages = doc.internal.getNumberOfPages();
    // Update cover page tagline with correct total (no rect overdraw — stays inside border)
    doc.setPage(1);
    doc.setTextColor(68, 74, 100);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Rapid Fire Texas 10  ·  ${module.name} Certification  ·  ${module.standard}  ·  ${dateStr}  ·  Page 1 of ${totalPages}`,
      pW / 2, 200, { align: 'center' }
    );
    // Portrait detail pages
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 75, 100);
      doc.text(
        `Rapid Fire Texas 10  ·  ${module.name} Certification  ·  ${module.standard}  ·  ${dateStr}  ·  Page ${i} of ${totalPages}`,
        dpW / 2, dpH - 12, { align: 'center' }
      );
    }

    doc.save(`RapidFire_Certificate_${module.id}_${now.toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 mb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-white mb-1">Multi-Tier Certification Audit</h3>
              <p className="text-gray-400 text-sm">
                Four escalating audit modules covering all {ALL_BETS.length} betting positions (10 hands + {PER_HAND_RANK_BETS.length} per-hand ranks + 8 color/river) with live payouts from{' '}
                <code className="text-yellow-300 text-xs">payoutConstants.js</code>.
                Each module auto-saves progress — refresh-safe with Continue recovery.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadPriorResults}
              className="flex items-center gap-1.5 text-blue-200 border border-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-900/30 transition-all font-semibold whitespace-nowrap"
              title="Load verified results from RapidFire_CertAudit_2026-05-14. Carded Hands &amp; Ranks = PASS. Color &amp; River = FAIL (re-run needed)."
            >
              📂 Load Prior Results
            </button>
          </div>
          {hasAnyResults && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={exportPDF}
                className="flex items-center gap-1.5 text-blue-300 border border-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-900/30 transition-all font-semibold whitespace-nowrap"
              >
                <FileDown className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button
                onClick={exportWord}
                className="flex items-center gap-1.5 text-emerald-300 border border-emerald-700 px-4 py-2 rounded-lg text-sm hover:bg-emerald-900/30 transition-all font-semibold whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5" /> Export Word
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-gray-500 border border-slate-600 px-3 py-2 rounded-lg text-sm hover:text-red-400 hover:border-red-700 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {MODULES.map(module => (
        <ModulePanel
          key={module.id}
          module={module}
          bets={ALL_BETS}
          onResultsChange={handleResultsChange}
          onExportCertificate={exportModuleCertificate}
        />
      ))}

      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p className="text-gray-400 font-semibold mb-1">Pass criteria by module:</p>
        {MODULES.map(m => (
          <p key={m.id}>• <span className="text-gray-300">{m.name}</span>: RTP {m.rtpLow}%–{m.rtpHigh}% &nbsp;|&nbsp; {m.standard}</p>
        ))}
        <p className="text-gray-600 pt-1">Progress is saved automatically after each bet. Refresh the page and click <span className="text-yellow-400">Continue</span> to resume from where you left off.</p>
      </div>
    </div>
  );
}