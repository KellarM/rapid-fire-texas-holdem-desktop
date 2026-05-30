import { useRef, useCallback } from 'react';

// Mixkit royalty-free casino sounds (Mixkit License — free for any use)
// These are real recorded casino sounds — ceramic chips, card placements
const SOUND_URLS = {
  chipPlace:  'https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3', // Clinking coins
  chipRemove: 'https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3', // Poker card flick
  cardDeal:   'https://assets.mixkit.co/active_storage/sfx/2076/2076-preview.mp3', // Poker card placement
};

export function useGameSounds() {
  const audioCache = useRef({});
  const ctxRef = useRef(null);

  // Lazily create AudioContext (must be after user gesture)
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Load and decode a sound file into an AudioBuffer (cached)
  const getBuffer = useCallback(async (key) => {
    if (audioCache.current[key]) return audioCache.current[key];
    const ctx = getCtx();
    const response = await fetch(SOUND_URLS[key]);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    audioCache.current[key] = audioBuffer;
    return audioBuffer;
  }, [getCtx]);

  const play = useCallback((key, volume = 1.0, playbackRate = 1.0) => {
    getBuffer(key).then((buffer) => {
      const ctx = getCtx();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;

      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(ctx.currentTime);
    }).catch(() => {});
  }, [getBuffer, getCtx]);

  // Pre-warm the cache on first user interaction
  const preload = useCallback(() => {
    Object.keys(SOUND_URLS).forEach(key => {
      if (!audioCache.current[key]) {
        getBuffer(key).catch(() => {});
      }
    });
  }, [getBuffer]);

  return {
    playChipPlace:  () => play('chipPlace',  0.7),
    playChipRemove: () => play('chipRemove', 0.5, 0.9),
    playCardDeal:   () => play('cardDeal',   0.8),
    preloadSounds:  preload,
  };
}