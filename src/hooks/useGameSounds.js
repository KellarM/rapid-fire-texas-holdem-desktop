import { useRef, useCallback } from 'react';

// Royalty-free sounds from Pixabay (no attribution required)
const SOUND_URLS = {
  chipPlace: 'https://cdn.pixabay.com/audio/2022/03/15/audio_80329.mp3',
  chipRemove: 'https://cdn.pixabay.com/audio/2022/03/15/audio_80329.mp3',
  cardDeal: 'https://cdn.pixabay.com/audio/2022/03/24/audio_91468.mp3',
};

export function useGameSounds() {
  const audioCache = useRef({});

  const getAudio = useCallback((key) => {
    if (!audioCache.current[key]) {
      const audio = new Audio(SOUND_URLS[key]);
      audio.volume = key === 'cardDeal' ? 0.6 : 0.5;
      audioCache.current[key] = audio;
    }
    return audioCache.current[key];
  }, []);

  const play = useCallback((key) => {
    const audio = getAudio(key);
    // Reset to start so rapid presses overlap cleanly
    audio.currentTime = 0;
    audio.play().catch(() => {}); // ignore autoplay policy errors silently
  }, [getAudio]);

  return {
    playChipPlace: () => play('chipPlace'),
    playChipRemove: () => play('chipRemove'),
    playCardDeal: () => play('cardDeal'),
  };
}