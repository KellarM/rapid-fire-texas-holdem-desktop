import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function VolumeControl({ soundManager }) {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [showSlider, setShowSlider] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    soundManager.setAmbientVolume(muted ? 0 : volume);
  }, [muted, volume]);

  // Hide slider when clicking outside
  useEffect(() => {
    if (!showSlider) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSlider(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSlider]);

  return (
    <div ref={containerRef} className="relative flex items-center flex-shrink-0">
      {/* Volume slider — pops up above */}
      {showSlider && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 border border-yellow-700/40 rounded-lg px-2 py-3 flex flex-col items-center gap-1 z-50">
          <span className="text-yellow-400/70 text-xs font-bold">{Math.round(volume * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
            style={{ writingMode: 'vertical-lr', direction: 'rtl', height: '72px', width: '16px', cursor: 'pointer', accentColor: '#eab308' }}
          />
        </div>
      )}

      {/* Mute / icon button */}
      <button
        onClick={() => setMuted(m => !m)}
        onContextMenu={e => { e.preventDefault(); setShowSlider(s => !s); }}
        title="Left-click: mute/unmute | Right-click: volume"
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-yellow-700/40 bg-black/40 text-yellow-400 hover:border-yellow-500 hover:bg-yellow-900/20 transition-all"
      >
        {muted || volume === 0
          ? <VolumeX className="w-4 h-4" />
          : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}