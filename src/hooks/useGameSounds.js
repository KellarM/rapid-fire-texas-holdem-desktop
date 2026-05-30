// Audio pool: pre-create N instances per sound so rapid calls never conflict
const POOL_SIZE = 4;

function makePool(url) {
  return Array.from({ length: POOL_SIZE }, () => {
    const a = new Audio(url);
    a.preload = 'auto';
    return a;
  });
}

const POOLS = {
  cardDeal:   makePool('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/e1fc72793_CardTurning.mp3'),
  chipPlace:  makePool('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/a202fbad7_oxidvideos-placing-poker-chips-522521.mp3'),
  chipRemove: makePool('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/df028b260_Removal-of-poker-chips-95810.mp3'),
};

const POOL_IDX = { cardDeal: 0, chipPlace: 0, chipRemove: 0 };

const AMBIENT = new Audio('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/033e65cf3_freesound_community-poker-room-33521.mp3');
AMBIENT.loop = true;
AMBIENT.volume = 0.4;
AMBIENT.preload = 'auto';

function play(key, volume) {
  const pool = POOLS[key];
  if (!pool) return;
  // Round-robin through the pool
  const idx = POOL_IDX[key];
  POOL_IDX[key] = (idx + 1) % POOL_SIZE;
  const el = pool[idx];
  el.volume = volume;
  el.currentTime = 0;
  el.play().catch(() => {});
}

function startAmbient() {
  if (!AMBIENT.paused) return;
  AMBIENT.play().catch(() => {});
}

let preloaded = false;
function preloadOnce() {
  startAmbient(); // always try to (re)start ambient on user interaction
  if (preloaded) return;
  preloaded = true;
  // Trigger buffering for all pool instances
  Object.values(POOLS).flat().forEach(a => a.load());
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