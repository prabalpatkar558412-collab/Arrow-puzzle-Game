import {Asset} from 'expo-asset';
import type {SoundDriver,SoundVoice} from './audioTypes';

// SDK 54's HTML media wrapper doesn't return/catch play()'s rejected promise.
// Cached Web Audio buffers give explicit unlock handling and low-latency SFX.
export function createSoundDriver():SoundDriver{
  let context:AudioContext|undefined;
  const getContext=()=>context??(context=new AudioContext());
  return {
    needsGesture:true,
    configure:async()=>{getContext();},
    async unlock(){const ctx=getContext();if(ctx.state!=='running')await ctx.resume();return ctx.state==='running';},
    async load(source){
      const asset=Asset.fromModule(source),response=await fetch(asset.uri);
      if(!response.ok)throw new Error(`Sound asset HTTP ${response.status}: ${asset.uri}`);
      const ctx=getContext(),buffer=await ctx.decodeAudioData(await response.arrayBuffer());
      const gain=ctx.createGain();gain.gain.value=.65;gain.connect(ctx.destination);
      let active:AudioBufferSourceNode|undefined;
      const stop=()=>{if(active){active.onended=null;try{active.stop();}catch{}active.disconnect();active=undefined;}};
      const voice:SoundVoice={
        play(allowed){
          if(!allowed()||ctx.state!=='running')return;
          stop();const node=ctx.createBufferSource();active=node;node.buffer=buffer;node.connect(gain);
          node.onended=()=>{node.disconnect();if(active===node)active=undefined;};node.start();
        },
        stop,
        dispose(){stop();gain.disconnect();},
      };
      return voice;
    },
    dispose(){if(context){void context.close().catch(()=>{});context=undefined;}},
  };
}
