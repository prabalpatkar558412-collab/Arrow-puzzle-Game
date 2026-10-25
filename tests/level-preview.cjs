const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const exportsForTest={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/levelAccess.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsForTest});
const {levelAccess}=exportsForTest,layouts=require('../src/level-layouts.json');
const progress={unlocked:9,current:9,completed:[1,2,3,4,5,6,7,8],coins:layouts.slice(0,8).reduce((sum,l)=>sum+l.coinReward,0),lifelines:2,stars:{},inProgress:null};
const snapshot=JSON.stringify(progress);
for(const [selected,expected] of [[5,'play'],[9,'play'],[10,'preview'],[25,'preview'],[100,'preview']]){
 assert.equal(levelAccess(selected,progress.unlocked,layouts.length),expected);
 console.log(`Highest unlocked 9: tap ${selected} -> ${expected}`);
}
for(const invalid of [0,-1,101,NaN,1.5])assert.equal(levelAccess(invalid,9,100),'invalid');
assert.equal(levelAccess(100,NaN,100),'preview');
const source=fs.readFileSync('App.tsx','utf8');
const {PuzzleBoard,flatten}=require('./load-game.cjs');
const boardExports={PuzzleBoard};
for(const levelNo of [10,15,25,50,100]){
 const level=layouts[levelNo-1],before=JSON.stringify(level);
 const tree=boardExports.PuzzleBoard({level,arrows:level.arrows,previewMode:true,onTap:()=>{throw new Error('Preview must not tap arrows');},blocked:level.arrows[0].id,blockerId:null,hintId:null,flightId:level.arrows[0].id,flightProgress:null,boardSize:320});
 const nodes=flatten(tree);
 assert.equal(tree.props.pointerEvents,'none');
 assert.ok(!nodes.some(n=>n.type==='Pressable'||n.type==='FlightPath'||n.props.onPress));
 assert.equal(nodes.filter(n=>n.type==='Polygon').length,level.arrows.length,'every actual arrowhead is visible');
 assert.equal(JSON.stringify(level),before);
}
assert.equal(JSON.stringify(progress),snapshot,'previewing Level 100 leaves all progress unchanged');
const open=source.slice(source.indexOf(' function openLevelPreview('),source.indexOf(' function replay(){'));
assert.ok(!/setSave|persistSave|sounds\.|setLevelNo|setRemaining/.test(open));
const start=source.slice(source.indexOf(' function start('),source.indexOf(' function openLevelPreview('));
assert.ok(start.indexOf('levelAccess(n,save.unlocked')<start.indexOf('soundRun.current='));
assert.ok(start.indexOf('openLevelPreview(n);return;')<start.indexOf('setSave('));
console.log('Passed: access matrix, invalid navigation, actual read-only renderer, no touch/animation handlers, stable level data and untouched saved progress.');
