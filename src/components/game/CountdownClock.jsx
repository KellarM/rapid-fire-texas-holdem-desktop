import { motion } from 'framer-motion';

export default function CountdownClock({ timeRemaining, isActive, phase }) {
  if (!isActive || !timeRemaining) return null;

  const displayTime = Math.ceil(timeRemaining);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(1, timeRemaining / (timeRemaining + 1)));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      style={{ display: 'inline-block' }}
    >
      <div style={{ position: 'relative', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {/* Solid dark fill so it sits cleanly between rows */}
          <circle cx="25" cy="25" r={r} fill="rgba(20,8,0,0.92)" stroke="rgba(180,120,0,0.5)" strokeWidth="1.5" />
          {/* Progress arc */}
          <motion.circle
            cx="25"
            cy="25"
            r={r}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
            style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.8))' }}
          />
        </svg>
        {/* Number + label */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', lineHeight: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fde047', textShadow: '0 0 6px rgba(251,191,36,1)' }}>
            {displayTime}
          </div>
          <div style={{ fontSize: 7, color: 'rgba(253,224,71,0.75)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 1 }}>
            {phase === 'betting' ? 'Bet' : phase === 'lowHighBetting' ? 'River' : 'Deal'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
