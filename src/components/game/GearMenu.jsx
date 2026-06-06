import { useState, useEffect, useRef } from 'react';
import GameRulesModal from '@/components/game/GameRulesModal';
import VolumeControl from '@/components/game/VolumeControl';

const COLORS = [
  { id: 'red',   label: 'Red',   dot: '#b30000' },
  { id: 'blue',  label: 'Blue',  dot: '#0a2a6e' },
  { id: 'green', label: 'Green', dot: '#0a4a1e' },
];

export default function GearMenu({ soundManager, boardTheme, setBoardTheme, onHowToPlay, onResetBank, onOpenStats }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const actionBtnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '11px 14px', cursor: 'pointer', fontSize: '13px',
    color: '#e2d9a0', fontWeight: 700, borderRadius: '8px',
    border: '1px solid rgba(202,138,4,0.4)',
    background: 'rgba(60,35,0,0.5)', width: '100%',
    transition: 'background 0.15s',
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Settings"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer',
          border: open ? '1px solid rgba(234,179,8,0.8)' : '1px solid rgba(202,138,4,0.4)',
          background: open ? 'rgba(120,70,0,0.45)' : 'rgba(0,0,0,0.45)',
          color: '#facc15', fontSize: '18px', lineHeight: 1,
          transition: 'all 0.15s',
        }}
      >
        ⚙
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: '42px', right: 0,
          background: 'linear-gradient(160deg, #1a0f00 0%, #0f0800 100%)',
          border: '2px solid rgba(202,138,4,0.5)',
          borderRadius: '14px', width: '220px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.85)', zIndex: 200,
          padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '10px',
        }}>

          {/* Title */}
          <div style={{ paddingBottom: '6px', borderBottom: '1px solid rgba(202,138,4,0.25)' }}>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#facc15', letterSpacing: '0.1em', fontFamily: 'Oswald, sans-serif' }}>SETTINGS</span>
          </div>

          {/* Board Color */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(250,204,21,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Board Color</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {COLORS.map(t => (
                <button key={t.id}
                  onClick={() => setBoardTheme(t.id)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    padding: '8px 4px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700,
                    fontSize: '11px', color: boardTheme === t.id ? '#fde047' : '#94a3b8',
                    border: boardTheme === t.id ? '2px solid #facc15' : '1px solid rgba(202,138,4,0.3)',
                    background: boardTheme === t.id ? 'rgba(100,60,0,0.6)' : 'rgba(0,0,0,0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: t.dot, border: '2px solid rgba(255,255,255,0.3)', display: 'block' }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound */}
          {soundManager && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid rgba(202,138,4,0.15)', paddingTop: '8px' }}>
              <span style={{ fontSize: '13px', color: '#e2d9a0', fontWeight: 600 }}>Sound</span>
              <div style={{ marginLeft: 'auto' }}>
                <VolumeControl soundManager={soundManager} compact />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(202,138,4,0.15)', paddingTop: '8px' }}>
            <button
              style={actionBtnStyle}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,45,0,0.6)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(60,35,0,0.5)'}
              onClick={() => { onResetBank(); setOpen(false); }}
            >
              <span>💰</span> Reset Bank
            </button>

            <div style={{ borderRadius: '8px', border: '1px solid rgba(202,138,4,0.4)', background: 'rgba(60,35,0,0.5)', overflow: 'hidden' }}>
              <GameRulesModal asMenuItem />
            </div>

            <button
              style={actionBtnStyle}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,45,0,0.6)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(60,35,0,0.5)'}
              onClick={() => { onHowToPlay(); setOpen(false); }}
            >
              <span>📋</span> How To Play
            </button>

            <button
              style={actionBtnStyle}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,45,0,0.6)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(60,35,0,0.5)'}
              onClick={() => { onOpenStats(); setOpen(false); }}
            >
              <span>📊</span> Player Stats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}