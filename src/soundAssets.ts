export const SOUND_ASSETS={
  'app-start':require('../assets/sounds/app-start.wav'),
  'button-tap':require('../assets/sounds/button-tap.wav'),
  'arrow-tap':require('../assets/sounds/arrow-tap.wav'),
  star:require('../assets/sounds/star.wav'),
  'star-bright':require('../assets/sounds/star-bright.wav'),
  'arrow-move':require('../assets/sounds/arrow-move.wav'),
  'arrow-escape':require('../assets/sounds/arrow-escape.wav'),
  blocked:require('../assets/sounds/blocked.wav'),
  hint:require('../assets/sounds/hint.wav'),
  lifeline:require('../assets/sounds/lifeline.wav'),
  'level-complete':require('../assets/sounds/level-complete.wav'),
  coin:require('../assets/sounds/coin.wav'),
  restart:require('../assets/sounds/restart.wav'),
};
export type SoundName=keyof typeof SOUND_ASSETS;
