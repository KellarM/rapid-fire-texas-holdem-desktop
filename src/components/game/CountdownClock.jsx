import { motion } from 'framer-motion';

export default function CountdownClock({ timeRemaining, isActive, phase }) {
  if (!isActive || !timeRemaining) return null;

  const displayTime = Math.ceil(timeRemaining);
  const progress = Math.max(0, Math.min(100, (timeRemaining * 100) / (timeRemaining + 1)));
  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'relative', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Ring */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="26" cy="26" r={r} fill="rgba(0,0,0,0.55)" stroke="rgba(120,80,0,0.4)" strokeWidth="2" />
          <motion.circle
            cx="26"
            cy="26"
            r={r}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress / 100)}
            style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))' }}
          />
        </svg>
        {/* Number */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', lineHeight: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fde047', textShadow: '0 0 8px rgba(251,191,36,0.9)' }}>
            {displayTime}
          </div>
          <div style={{ fontSize: 7, color: 'rgba(253,224,71,0.7)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {phase === 'betting' ? 'Bet' : phase === 'lowHighBetting' ? 'River' : 'Deal'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
