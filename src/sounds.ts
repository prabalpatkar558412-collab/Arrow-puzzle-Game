import {createSoundDriver} from './audioDriver';
import {SoundManager} from './soundManager';

// One shared service for every screen and gameplay event.
export const sounds=new SoundManager(createSoundDriver());
