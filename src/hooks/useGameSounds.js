import { useRef, useCallback } from 'react';

const SOUND_URLS = {
  cardDeal:   'https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/e1fc72793_CardTurning.mp3',
  chipPlace:  'https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/a202fbad7_oxidvideos-placing-poker-chips-522521.mp3',
  chipRemove: 'https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/df028b260_Removal-of-poker-chips-95810.mp3',
};

// Pre-create Audio elements once (avoids CORS issues with fetch/Web Audio)
const audioPool = {};
Object.entries(SOUND_URLS).forEach(([key, url]) => {
  audioPool[key] = new Audio(url);
  audioPool[key].preload = 'auto';
});

export function useGameSounds() {
  const play = useCallback((key, volume = 1.0) => {
    const el = audioPool[key];
    if (!el) return;
    el.volume = volume;
    el.currentTime = 0;
    el.play().catch(() => {});
  }, []);

  const preloadSounds = useCallback(() => {
    Object.values(audioPool).forEach(el => el.load());
  }, []);

  return {
    playChipPlace:  () => play('chipPlace',  0.8),
    playChipRemove: () => play('chipRemove', 0.7),
    playCardDeal:   () => play('cardDeal',   0.9),
    preloadSounds,
  };
}