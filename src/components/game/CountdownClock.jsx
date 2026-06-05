import { motion } from 'framer-motion';

export default function CountdownClock({ timeRemaining, isActive, phase }) {
  if (!isActive || !timeRemaining) return null;

  const displayTime = Math.ceil(timeRemaining);
  const SIZE = 86;
  const cx = SIZE / 2;
  const r = cx - 6;
  const circ = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(1, timeRemaining / (timeRemaining + 1)));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      style={{ display: 'inline-block' }}
    >
      <div style={{ position: 'relative', width: SIZE, height: SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {/* Dark fill with gold border */}
          <circle cx={cx} cy={cx} r={r} fill="rgba(10,5,0,0.93)" stroke="rgba(180,120,0,0.45)" strokeWidth="1.5" />
          {/* Progress arc */}
          <motion.circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
            style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.9))' }}
          />
        </svg>
        {/* Number + label */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', lineHeight: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#fde047', textShadow: '0 0 10px rgba(251,191,36,1), 0 0 20px rgba(251,191,36,0.5)', fontVariantNumeric: 'tabular-nums' }}>
            {displayTime}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(253,224,71,0.8)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
            {phase === 'betting' ? 'Betting' : phase === 'lowHighBetting' ? 'River' : 'Dealing'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
