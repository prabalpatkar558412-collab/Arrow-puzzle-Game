import {createAudioPlayer,setAudioModeAsync} from 'expo-audio';
import {Asset} from 'expo-asset';
import type {SoundDriver,SoundVoice} from './audioTypes';

export function createSoundDriver():SoundDriver{
  return {
    needsGesture:false,
    configure:()=>setAudioModeAsync({playsInSilentMode:true,interruptionMode:'mixWithOthers',shouldPlayInBackground:false,shouldRouteThroughEarpiece:false}),
    unlock:async()=>true,
    async load(source){
      const asset=Asset.fromModule(source);await asset.downloadAsync();
      const player=createAudioPlayer({uri:asset.localUri??asset.uri},{updateInterval:1000});
      player.volume=.65;
      try{
        if(!player.isLoaded)await new Promise<void>((resolve,reject)=>{
          const timer=setTimeout(()=>{subscription.remove();reject(new Error('Audio load timed out'));},15000);
          const subscription=player.addListener('playbackStatusUpdate',status=>{if(status.isLoaded){clearTimeout(timer);subscription.remove();resolve();}});
          if(player.isLoaded){clearTimeout(timer);subscription.remove();resolve();}
        });
      }catch(error){player.remove();throw error;}
      let generation=0;
      const voice:SoundVoice={
        play(allowed){const token=++generation;if(player.currentTime<=.001){if(allowed())player.play();return;}player.pause();void player.seekTo(0).then(()=>{if(token===generation&&allowed())player.play();}).catch(error=>console.warn('SFX playback failed',error));},
        stop(){generation++;player.pause();},
        dispose(){generation++;player.remove();},
      };
      return voice;
    },
    dispose(){},
  };
}
