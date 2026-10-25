const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,deps,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>deps[n],console,setTimeout,clearTimeout,...globals});return exports;}
const sources=['app-start','button-tap','arrow-tap','arrow-move','arrow-escape','blocked','hint','lifeline','level-complete','coin','restart','star','star-bright'];
const Asset={fromModule:i=>({uri:`assets/sounds/${sources[i]}.wav`,downloadAsync:async()=>{}})};
(async()=>{
 let decoded=0,started=0,stopped=0,removed=0,seeked=0;
 class Context{
  state='suspended';destination={};
  async resume(){this.state='running';}
  async close(){this.state='closed';}
  async decodeAudioData(bytes){const b=Buffer.from(bytes);assert.equal(b.toString('ascii',0,4),'RIFF');decoded++;return {duration:(b.length-44)/(b.readUInt32LE(24)*b.readUInt16LE(22)*b.readUInt16LE(34)/8)};}
  createGain(){return {gain:{value:1},connect(){},disconnect(){}};}
  createBufferSource(){return {buffer:null,connect(){},disconnect(){},start(){started++;},stop(){stopped++;}};}
 }
 const web=load('src/audioDriver.web.ts',{'expo-asset':{Asset}},{AudioContext:Context,fetch:async path=>({ok:true,arrayBuffer:async()=>{const b=fs.readFileSync(path);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);}})}).createSoundDriver();
 await web.configure();const voices=await Promise.all(sources.map((_,i)=>web.load(i)));
 for(const voice of voices)voice.play(()=>true);assert.equal(started,0,'web awaits gesture unlock');
 await web.unlock();for(const voice of voices)voice.play(()=>true);assert.equal(started,sources.length);assert.equal(decoded,sources.length);
 for(const voice of voices)voice.play(()=>false);assert.equal(started,sources.length);
 for(const voice of voices)voice.dispose();assert.equal(stopped,sources.length);web.dispose();
 const native=load('src/audioDriver.ts',{'expo-asset':{Asset},'expo-audio':{
  setAudioModeAsync:async options=>{assert.equal(options.shouldRouteThroughEarpiece,false);},
  createAudioPlayer:()=>({isLoaded:true,currentTime:0,volume:1,pause(){},seekTo:async function(time){assert.equal(time,0);this.currentTime=0;seeked++;},play(){this.currentTime=.01;started++;},remove(){removed++;}}),
 }}).createSoundDriver();
 await native.configure();const player=await native.load(0),initial=started;
 player.play(()=>true);await Promise.resolve();assert.equal(started,initial+1);assert.equal(seeked,0,'first cached native playback starts synchronously without seeking');
 player.play(()=>true);player.stop();await Promise.resolve();assert.equal(started,initial+1,'mute/stop cancels pending native seek');
 player.play(()=>false);await Promise.resolve();assert.equal(started,initial+1);
 player.dispose();assert.equal(removed,1);
 console.log('Adapters passed: real WAV loading paths, thirteen web decodes, gesture gate, play/mute/dispose, native rewind and cancellation. Device/speaker playback is not covered by these tests.');
})().catch(error=>{console.error(error);process.exitCode=1;});
