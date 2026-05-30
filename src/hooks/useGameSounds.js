// All Audio elements at module level — zero hooks, stable across hot-reloads
const SOUNDS = {
  cardDeal:   new Audio('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/e1fc72793_CardTurning.mp3'),
  chipPlace:  new Audio('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/a202fbad7_oxidvideos-placing-poker-chips-522521.mp3'),
  chipRemove: new Audio('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/df028b260_Removal-of-poker-chips-95810.mp3'),
};

const AMBIENT = new Audio('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/033e65cf3_freesound_community-poker-room-33521.mp3');
AMBIENT.loop = true;
AMBIENT.volume = 0.4;

let preloaded = false;

function play(key, volume) {
  const el = SOUNDS[key];
  if (!el) return;
  const clone = el.cloneNode();
  clone.volume = volume;
  clone.play().catch(() => {});
}

function startAmbient() {
  if (!AMBIENT.paused) return;
  AMBIENT.play().catch(() => {});
}

function preloadOnce() {
  if (preloaded) {
    // Only restart ambient if it stopped — never reload the source elements
    startAmbient();
    return;
  }
  preloaded = true;
  // Load source elements only once so they are buffered for cloning
  Object.values(SOUNDS).forEach(el => el.load());
  startAmbient();
}

export function useGameSounds() {
  return {
    playChipPlace:  () => play('chipPlace',  0.8),
    playChipRemove: () => play('chipRemove', 0.7),
    playCardDeal:   () => play('cardDeal',   0.9),
    preloadSounds:  preloadOnce,
    setAmbientVolume: (v) => { AMBIENT.volume = v; },
    soundManager: {
      setAmbientVolume: (v) => { AMBIENT.volume = v; },
    },
  };
}