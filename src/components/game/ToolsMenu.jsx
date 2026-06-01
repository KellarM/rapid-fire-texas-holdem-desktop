import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, BarChart2, Award, PieChart, Layers, Timer, Eye, LineChart } from 'lucide-react';

const TOOLS = [
  { icon: BarChart2,  label: 'Player Stats',               type: 'stats'           },
  { icon: Eye,        label: 'Observer',                    type: 'observer',         badge: 'NEW', badgeColor: 'bg-cyan-700/60 text-cyan-300 border-cyan-600/40' },
  { icon: LineChart,  label: 'Analytics',                   type: 'analytics',        badge: 'NEW', badgeColor: 'bg-green-700/60 text-green-300 border-green-600/40' },
  { icon: Award,      label: 'Gaming License Calibration', href: '/gaming-license' },
  { icon: PieChart,   label: 'Game Stats',                 href: '/game-stats'     },
  { icon: Layers,     label: 'Deck Inspector',             href: '/deck-inspector' },
  { icon: Timer,      label: 'Game Timing',                type: 'gameTiming'      },
];

export default function ToolsMenu({
  onOpenStats,
  onOpenObserver,
  onOpenAnalytics,
  onOpenGameTiming,
  toolsVisible = true,
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ bottom: 60, right: 8 });
  const btnRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        bottom: window.innerHeight - rect.top + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(o => !o);
  }

  function handle(fn) {
    fn?.();
    setOpen(false);
  }

  const typeHandlers = {
    stats:      onOpenStats,
    observer:   onOpenObserver,
    analytics:  onOpenAnalytics,
    gameTiming: onOpenGameTiming,
  };

  return (
    <div style={{ position: 'relative', visibility: toolsVisible ? 'visible' : 'hidden' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          width: 32, height: 32, borderRadius: 8,
          border: open ? '1px solid #facc15' : '1px solid rgba(234,179,8,0.5)',
          background: open ? 'rgba(234,179,8,0.2)' : 'rgba(0,0,0,0.5)',
          color: '#fde047',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer', padding: 0,
        }}
      >
        <Wrench style={{ width: 15, height: 15 }} />
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          bottom: menuPos.bottom,
          right: menuPos.right,
          width: 240,
          background: 'linear-gradient(160deg, #0f172a 0%, #1e1b10 100%)',
          border: '1px solid rgba(234,179,8,0.4)',
          borderRadius: 12,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.8)',
          zIndex: 9999,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(234,179,8,0.2)' }}>
            <p style={{ color: 'rgba(250,204,21,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Game Tools</p>
          </div>

          {TOOLS.map(({ icon: Icon, label, href, type, badge, badgeColor }) => {
            if (type) {
              return (
                <button key={label} onClick={() => handle(typeHandlers[type])}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', background: 'transparent', border: 'none',
                    color: '#cbd5e1', fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(234,179,8,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon style={{ width: 15, height: 15, color: 'rgba(234,179,8,0.7)', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && (
                    <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, border: '1px solid', fontWeight: 700 }} className={badgeColor}>{badge}</span>
                  )}
                </button>
              );
            }
            return (
              <Link key={label} to={href} onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', color: '#cbd5e1', fontSize: 13,
                  textDecoration: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(234,179,8,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Icon style={{ width: 15, height: 15, color: 'rgba(234,179,8,0.7)', flexShrink: 0 }} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
