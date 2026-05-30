import { useRef, useCallback } from 'react';

const SOUND_URLS = {
  cardDeal:   'https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/e1fc72793_CardTurning.mp3',
  chipPlace:  'https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/a202fbad7_oxidvideos-placing-poker-chips-522521.mp3',
  chipRemove: 'https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/df028b260_Removal-of-poker-chips-95810.mp3',
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