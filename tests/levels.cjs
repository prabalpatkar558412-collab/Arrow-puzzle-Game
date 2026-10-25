const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
function load(file,deps={}){
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>deps[name]});
  return exports;
}
const designs=load('src/levels.ts',{'./level-layouts.json':{default:require('../src/level-layouts.json')}});
const game=load('src/game.ts',{'./levels':designs});
assert.equal(game.LEVELS.length,100);
assert.equal(new Set(game.LEVELS.map(l=>l.mask.join('\n'))).size,100,'each level has a distinct shape mask');
assert.equal(game.validateLevels().length,0);
let previousCount=0,previousArea=0,previousBends=0,previousDepth=0;
for(const [index,level] of game.LEVELS.entries()){
  assert.equal(JSON.stringify(level),JSON.stringify(designs.buildDesignedLevel(designs.LEVEL_DESIGNS[index],index)));
  const occupied=new Set();let bends=0;
  for(const arrow of level.arrows){
    for(const point of game.pathCells(arrow)){
      const key=`${point.x},${point.y}`;
      assert.ok(!occupied.has(key),`Level ${index+1}: overlapping bodies at ${key}`);
      occupied.add(key);
      assert.ok(point.x>=1&&point.x<level.size-1&&point.y>=1&&point.y<level.size-1,'board padding');
    }
    bends+=arrow.path.length-2;
    const last=arrow.path.at(-1),before=arrow.path.at(-2),delta=game.DELTA[arrow.dir];
    assert.equal(Math.sign(last.x-before.x),delta.x);
    assert.equal(Math.sign(last.y-before.y),delta.y);
    const animated=game.escapeAnimationRoute(arrow,level.size);
    assert.equal(JSON.stringify(animated.slice(0,game.pathCells(arrow).length)),JSON.stringify(game.pathCells(arrow)),'animation retains ordered bends');
  }
  const points=level.arrows.flatMap(a=>a.path),xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  assert.ok(Math.abs(minX+maxX-(level.size-1))<=1&&Math.abs(minY+maxY-(level.size-1))<=1,'centered footprint');
  const expected=new Set();
  level.mask.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='1')expected.add(`${x+level.maskOffset},${y+level.maskOffset}`);}));
  assert.equal(occupied.size,expected.size,'entire mask filled');
  for(const cell of expected)assert.ok(occupied.has(cell),'no holes in silhouette');
  const area=(maxX-minX+1)*(maxY-minY+1);
  // Count parallel removal waves: this is the minimum dependency depth.
  let remaining=[...level.arrows],depth=0;
  while(remaining.length){
    const clear=remaining.filter(a=>game.canEscape(a,remaining,level.size));
    assert.ok(clear.length);
    assert.ok(game.hint(level,remaining));
    remaining=remaining.filter(a=>!clear.includes(a));depth++;
  }
  assert.ok(level.arrows.length>=previousCount);
  assert.ok(level.solution&&level.solution.length===level.arrows.length);
  let pending=[...level.arrows];
  for(const id of level.solution){const a=pending.find(a=>a.id===id);assert.ok(a&&game.canEscape(a,pending,level.size));pending=pending.filter(a=>a.id!==id);}
  assert.equal(pending.length,0);
  if(index>0)assert.notEqual(designs.LEVEL_DESIGNS[index].shape,designs.LEVEL_DESIGNS[index-1].shape);
  if([0,4,9,14].includes(index)){assert.ok(area>previousArea);assert.ok(bends>=previousBends);assert.ok(depth>=previousDepth);previousDepth=depth;previousArea=area;previousBends=bends;}
  for(const width of [320,360,390,412]){const cell=(width-36)/level.size;assert.ok(minX*cell>=cell&&minY*cell>=cell);}
  previousCount=level.arrows.length;
  console.log(`Level ${index+1}: ${level.arrows.length} arrows, ${bends} bends, dependency depth ${depth}, solved`);
}
console.log('Passed: all 100 layouts deterministic, centered, padded, disjoint, mask-filling, and solvable; target milestone difficulty increases.');


console.log('Level 1 known solution:',game.LEVELS[0].solution.join(' -> '));
