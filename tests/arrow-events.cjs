const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict');
function load(file,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>deps[n]});return exports;}
const designs=load('src/levels.ts',{'./level-layouts.json':{default:require('../src/level-layouts.json')}}),game=load('src/game.ts',{'./levels':designs});
const source=fs.readFileSync('App.tsx','utf8');
const handler=source.slice(source.indexOf(' function tapArrow('),source.indexOf(' function useLifeline('));
const events=[],animations=[],exportsForTest={},ctx={
 exports:exportsForTest,...game,...require('./load-game.cjs').geometry,gameBoardSize:320,paused:false,won:false,noClearPath:false,noClearLock:{current:false},flightLock:{current:false},completionLock:{current:false},soundRun:{current:'run-1'},
 soundEnabled:true,sounds:{play:name=>{if(ctx.soundEnabled)events.push(name);},completeRun:(run,coins)=>{if(ctx.soundEnabled)events.push('win:'+run+':'+coins);}},
 save:{vibe:false,rewarded:[],inProgress:{elapsedMs:0}},moves:0,levelNo:1,dailyMode:false,history:[],
 runStartedAt:{current:Date.now()},flightProgress:{setValue(){}},localDateKey:()=> 'test-date',
 Animated:{timing:()=>({start:cb=>animations.push(cb)})},Easing:{linear:()=>{}},
 setSave(){},setResult(){},setScreen(){throw new Error('Completion transition must be controlled by the cancellable effect');},
};
for(const [setter,field] of Object.entries({setMoves:'moves',setRemaining:'remaining',setHistory:'history',setWon:'won',setNoClearPath:'noClearPath',setFlightId:'flightId',setBlockingId:'blockingId',setBlocked:'blocked',setHintId:'hintId',setHintMessage:'hintMessage'}))ctx[setter]=value=>{ctx[field]=typeof value==='function'?value(ctx[field]):value;};
vm.runInNewContext(ts.transpileModule(handler+'\nexports.tapArrow=tapArrow;',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,ctx);
const a={id:'blocked',path:[{x:0,y:1},{x:1,y:1}],dir:'R',exit:{x:6,y:1}},b={id:'free',path:[{x:3,y:1},{x:4,y:1}],dir:'R',exit:{x:6,y:1}};
ctx.level={size:7,arrows:[a,b],coinReward:30,starThresholds:{three:3,two:6}};ctx.remaining=[a,b];
exportsForTest.tapArrow(a);assert.equal(events.join(','),'arrow-tap,blocked');assert.equal(animations.length,0);
exportsForTest.tapArrow(a);assert.equal(events.length,2,'rapid blocked taps ignored');
ctx.noClearPath=false;ctx.noClearLock.current=false;
exportsForTest.tapArrow(b);exportsForTest.tapArrow(b);
assert.equal(events.slice(-2).join(','),'arrow-tap,arrow-move');assert.equal(animations.length,1);
animations[0]({finished:true});animations[0]({finished:true});
assert.equal(events.filter(e=>e==='arrow-escape').length,1);
assert.equal(ctx.remaining.length,1);
exportsForTest.tapArrow(a);assert.equal(animations.length,2);
animations[1]({finished:true});animations[1]({finished:true});
assert.equal(events.filter(e=>e.startsWith('win:')).length,1);
assert.equal(events.filter(e=>e==='arrow-escape').length,2);
assert.equal(ctx.won,true);
// Exercise the actual Hint handlers with a shared rapid-use guard.
const hints=source.slice(source.indexOf(' function doHint('),source.indexOf(' function openPauseSettings('));
Object.assign(ctx,{won:false,paused:false,noClearPath:false,noClearLock:{current:false},flightLock:{current:false},lastHintAt:{current:-Infinity},save:{hints:3},remaining:[a],level:{size:7},hint:()=>a,Alert:{alert(){}},setSave:update=>{ctx.save=update(ctx.save);}});
vm.runInNewContext(ts.transpileModule(hints+'\nexports.doHint=doHint;exports.useHintFromNoClear=useHintFromNoClear;',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,ctx);
exportsForTest.doHint();exportsForTest.doHint();exportsForTest.useHintFromNoClear();
assert.equal(ctx.save.hints,2,'one consumption across both rapid hint entry points');
console.log('Passed actual handlers: blocked/no illegal movement, tap -> move -> escape, duplicate tap/callback guards, one final win and single rapid Hint consumption.');
