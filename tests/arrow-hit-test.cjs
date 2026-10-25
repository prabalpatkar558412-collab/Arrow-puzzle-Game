const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const exportsForTest={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/arrowHitTest.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsForTest});
const {hitTestArrow,distanceToSegment,ARROW_HIT_RADIUS}=exportsForTest;
assert.equal(ARROW_HIT_RADIUS,10);
const arrow={id:'bent',path:[{x:2,y:6},{x:2,y:2},{x:8,y:2}],dir:'R',exit:{x:10,y:2}};
const pixel=(x,y)=>({x:(x+.5)*20,y:(y+.5)*20});
for(const [name,x,y] of [['arrowhead',8,2],['horizontal middle',5,2],['vertical middle',2,4],['bend',2,2],['tail',2,6]]){
 assert.equal(hitTestArrow([arrow],11,220,pixel(x,y)).id,arrow.id);console.log(`Hit ${name}: correct arrow`);
}
assert.equal(hitTestArrow([arrow],11,220,pixel(8,8)),undefined,'empty space does nothing');
assert.equal(hitTestArrow([arrow],11,220,{x:NaN,y:0}),undefined);
const upper={id:'upper',path:[{x:1,y:2},{x:8,y:2}],dir:'R'},lower={id:'lower',path:[{x:1,y:3},{x:8,y:3}],dir:'R'};
// On small devices the two 20px hit corridors overlap. Draw order must not win.
for(const order of [[upper,lower],[lower,upper]]){
 assert.equal(hitTestArrow(order,11,110,{x:50,y:27}).id,'upper');
 assert.equal(hitTestArrow(order,11,110,{x:50,y:33}).id,'lower');
}
assert.equal(distanceToSegment({x:0,y:0},{x:3,y:4},{x:3,y:4}),5);
const layouts=require('../src/level-layouts.json');
for(const boardSize of [284,324,354,376])for(const level of layouts)for(const a of level.arrows){
 const cell=boardSize/level.size;
 for(let i=1;i<a.path.length;i++){
  const p=a.path[i-1],q=a.path[i];
  const tap={x:((p.x+q.x)/2+.5)*cell,y:((p.y+q.y)/2+.5)*cell};
  assert.equal(hitTestArrow(level.arrows,level.size,boardSize,tap)?.id,a.id,`Level segment ${a.id} at ${boardSize}px`);
 }
}
console.log('Passed: full paths, bends, tails, heads, empty space, nearest-path priority and every segment of all 100 levels at four mobile board sizes.');
