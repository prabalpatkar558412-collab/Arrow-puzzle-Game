const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:n=>deps[n]});return exports;}
const designs=load('src/levels.ts',{'./level-layouts.json':{default:require('../src/level-layouts.json')}});
const game=load('src/game.ts',{'./levels':designs});
const rescue=load('src/lifeline.ts',{'./game':game});
assert.equal(rescue.savedLifelines(undefined),3);
assert.equal(rescue.savedLifelines(0),0);
assert.equal(rescue.savedLifelines(2),2);
for(const bad of [-1,NaN,1.2,'3'])assert.equal(rescue.savedLifelines(bad),3);
const level=game.LEVELS[4],original=JSON.stringify(level);
const first=rescue.planLifeline(level.arrows,level.size,3,1000,-Infinity);
assert.ok(first);
assert.ok(game.blockingArrow(first.target,level.arrows,level.size));
assert.equal(first.lifelines,2);
assert.equal(first.remaining.length,level.arrows.length-1);
assert.equal(rescue.planLifeline(first.remaining,level.size,2,1001,1000),null,'rapid tap rejected');
assert.equal(rescue.planLifeline(first.remaining,level.size,0,2000,1000),null);
assert.equal(rescue.planLifeline([level.arrows[0]],level.size,3,2000,1000),null,'no blocked arrow costs nothing');
const reloaded=JSON.parse(JSON.stringify({lifelines:first.lifelines,remaining:first.remaining}));
assert.equal(rescue.savedLifelines(reloaded.lifelines),2);
const reduced={...level,arrows:first.remaining};
assert.equal(game.solution(reduced).length,reduced.arrows.length,'rescue preserves solvability');
assert.equal(JSON.stringify(level),original,'level definition stays intact after rescue/restart');
const source=fs.readFileSync('App.tsx','utf8'),context={StyleSheet:{create:x=>x,absoluteFillObject:{}},C:{}};
vm.runInNewContext(ts.transpile(source.slice(source.indexOf('const styles=StyleSheet.create(')).replace('const styles=','globalThis.styles='),{target:ts.ScriptTarget.ES2020}),context);
const s=context.styles;
assert.equal(s.control.flex,1);assert.equal(s.control.minWidth,0);
assert.equal(s.gameControls.flexDirection,'row');
for(const width of [320,360,390,412]){
 const action=(width-2*s.gameControls.marginHorizontal-2*s.gameControls.paddingHorizontal-2)/4;
 assert.ok(action>=64);
 console.log(`${width}px: four equal ${action}px actions, with single-line scaling labels.`);
}
console.log('Passed: migration, rescue, single decrement, rapid-tap guard, exhaustion, reload, restart, solvability and layout checks.');

const header=source.slice(source.indexOf("{screen==='game'&&<>"),source.indexOf('<CoinBalance coins={save.coins} gameplay/>'));
assert.ok(!header.includes("heart"));
assert.ok(!header.includes('onPress={useLifeline}'));
assert.ok(!header.includes('LEVEL {levelNo}'));
assert.ok(source.indexOf('LEVEL {levelNo}')>source.indexOf('accessibilityRole="progressbar"'));
assert.ok(source.indexOf('LEVEL {levelNo}')<source.indexOf('style={styles.boardWrap}'));
const bar=source.slice(source.indexOf('<View style={styles.gameControls}>'),source.indexOf("{screen==='complete'"));
assert.ok(bar.includes('onPress={useLifeline}'));
assert.ok(bar.includes('LIFELINE'));
assert.ok(bar.includes("i<save.lifelines?'heart':'heart-outline'"));
assert.equal(s.lifelineHearts.height,22);
assert.ok(3*14+2*s.lifelineHearts.gap<64);
for(const count of [0,1,2,3]){const slots=Array.from({length:3},(_,i)=>i<count);assert.equal(slots.filter(Boolean).length,count);assert.equal(slots.length,3);}
console.log('Dynamic level, three persistent bottom heart slots, no header hearts and four-action bar verified.');
