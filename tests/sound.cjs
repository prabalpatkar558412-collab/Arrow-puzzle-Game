const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const exportsForTest={},timers=new Map();let timerId=0;
const flushTimers=()=>{const callbacks=[...timers.values()];timers.clear();callbacks.forEach(cb=>cb());};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/soundManager.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsForTest,console,setTimeout:callback=>{const id=++timerId;timers.set(id,callback);return id;},clearTimeout:id=>timers.delete(id),Date});
const {SoundManager}=exportsForTest;
const names=['app-start','button-tap','arrow-tap','arrow-move','arrow-escape','blocked','hint','lifeline','level-complete','coin','restart','star','star-bright'];
const assets=Object.fromEntries(names.map((n,i)=>[n,i]));
function driver(needsGesture){
 const plays=[],stops=[],disposed=[];let loads=0,unlocks=0;
 return {plays,stops,disposed,get loads(){return loads;},get unlocks(){return unlocks;},needsGesture,
  configure:async()=>{},unlock:async()=>{unlocks++;return true;},
  load:async source=>{loads++;return {play:allowed=>{if(allowed())plays.push(names[source]);},stop:()=>stops.push(source),dispose:()=>disposed.push(source)};},dispose(){}};
}
(async()=>{
 for(const web of [false,true]){
  const d=driver(web),s=new SoundManager(d);await s.init(assets);
  assert.equal(d.loads,names.length);
  s.setEnabled(true);s.appReady();s.appReady();
  if(web){assert.equal(d.plays.length,0);s.interact();await Promise.resolve();}
  assert.equal(d.plays.filter(n=>n==='app-start').length,1);
  for(const name of names.slice(1))s.play(name);
  assert.equal(d.loads,names.length,'players/buffers are cached');
  const prior=d.plays.length;s.setEnabled(false);for(const name of names)s.play(name);
  s.beginRun('muted');s.completeRun('muted',50);s.setEnabled(true);
  assert.equal(d.plays.length,prior,'muted effects never replay on enabling');
  s.play('hint');assert.equal(d.plays.at(-1),'hint');
  const wins=d.plays.filter(n=>n==='level-complete').length,coins=d.plays.filter(n=>n==='coin').length;
  s.beginRun('level-1-run-1');for(let i=0;i<8;i++)s.completeRun('level-1-run-1',30);
  assert.equal(d.plays.filter(n=>n==='level-complete').length,wins,'victory waits for final escape pop');flushTimers();
  const priorStars=d.plays.filter(n=>n==='star'||n==='star-bright').length;
  for(let i=0;i<3;i++){s.revealStar('level-1-run-1',i);s.revealStar('level-1-run-1',i);}
  assert.equal(d.plays.filter(n=>n==='star'||n==='star-bright').length,priorStars+3,'one chime per star reveal');
  assert.equal(d.plays.filter(n=>n==='level-complete').length,wins+1);
  assert.equal(d.plays.filter(n=>n==='coin').length,coins+1);
  s.beginRun('level-1-replay');s.completeRun('level-1-replay',0);flushTimers();
  assert.equal(d.plays.filter(n=>n==='level-complete').length,wins+2);
  assert.equal(d.plays.filter(n=>n==='coin').length,coins+1,'no reward sound for zero reward');
  s.setActive(false);const count=d.plays.length;s.play('restart');assert.equal(d.plays.length,count);
  s.setActive(true);s.play('restart');assert.equal(d.plays.length,count+1);
  s.beginRun('muted-timer');s.completeRun('muted-timer',50);s.setEnabled(false);s.setEnabled(true);const beforeCancelled=d.plays.length;flushTimers();assert.equal(d.plays.length,beforeCancelled,'turning sound off cancels scheduled celebration');
  s.dispose();assert.equal(d.disposed.length,names.length);s.play('hint');assert.equal(d.plays.length,count+1);
  console.log(`${web?'Web gesture-gated':'Native'} manager: all events, mute/unmute, one victory per run, caching and cleanup passed.`);
 }
 const retryDriver=driver(true),retry=new SoundManager(retryDriver);
 await retry.init(assets);retry.setEnabled(true);retry.appReady();
 retryDriver.unlock=async()=>{throw new Error('Autoplay policy');};retry.interact();
 await Promise.resolve();await Promise.resolve();assert.equal(retryDriver.plays.length,0);
 retryDriver.unlock=async()=>true;retry.interact();await Promise.resolve();assert.equal(retryDriver.plays[0],'app-start');
 let resume;retryDriver.unlock=()=>new Promise(resolve=>resume=resolve);
 retry.interact();const beforeResume=retryDriver.plays.length;retry.play('hint');
 assert.equal(retryDriver.plays.length,beforeResume);resume(true);await Promise.resolve();
 assert.equal(retryDriver.plays.at(-1),'hint','tab resume keeps the first new effect instead of dropping it');retry.dispose();
 console.log('Autoplay rejection/retry and resumed-tab audio queue passed.');
 for(const name of names){
  const path=`assets/sounds/${name}.wav`,data=fs.readFileSync(path);
  assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WAVE');
  assert.ok(data.length>1000);assert.ok(data.subarray(44).some(b=>b!==0));
  assert.ok(fs.readFileSync('src/soundAssets.ts','utf8').includes(`sounds/${name}.wav`));
 }
 console.log('All thirteen case-exact audio imports exist and contain non-silent PCM data.');
})().catch(error=>{console.error(error);process.exitCode=1;});
