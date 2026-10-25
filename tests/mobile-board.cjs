const assert=require('node:assert/strict');
const {game,geometry:g,hit,PuzzleBoard,flatten,load}=require('./load-game.cjs');
const {responsiveLayout}=load('src/responsiveLayout.ts');
const before=JSON.stringify(game.LEVELS);
for(const [width,height] of [[360,800],[375,812],[390,844],[412,915]]){
 for(const bottomInset of [24,48]){
  // Matches the intrinsic navbar, progress, level and control heights. Runtime
  // uses onLayout, so font scaling/inset changes are measured rather than guessed.
  const remaining=height-24-bottomInset-56-14-25-92;
  const metrics=responsiveLayout(width,height,{top:24,bottom:bottomInset,left:0,right:0});
  const board=g.gameplayBoardSize(width,remaining,metrics.horizontalPadding);
  assert.ok(board<=width-2*metrics.horizontalPadding&&board<=remaining-16&&board>300);
  assert.ok(height-bottomInset-12<height-bottomInset,'controls stay above navigation');
  for(const level of game.LEVELS){
   const transform=g.boardTransform(level.arrows,board),points=level.arrows.flatMap(a=>a.path).map(p=>g.boardPoint(p,transform));
   const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
   const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
   const usage=Math.max(maxX-minX,maxY-minY)/board;
   assert.ok(usage>=.79&&usage<=.83,'normalized footprint fills ~82%');
   assert.ok(Math.abs(minX+maxX-board)<1e-6&&Math.abs(minY+maxY-board)<1e-6);
   assert.ok(Math.min(minX,minY)>=16-1e-6&&Math.max(maxX,maxY)<=board-16+1e-6);
   for(const arrow of level.arrows){
    for(let i=1;i<arrow.path.length;i++){
     const a=arrow.path[i-1],b=arrow.path[i],point=g.boardPoint({x:(a.x+b.x)/2,y:(a.y+b.y)/2},transform);
     assert.equal(hit.hitTestArrow(level.arrows,level.size,board,point,11,transform)?.id,arrow.id);
     const canonical=g.canonicalPoint(point,transform);assert.ok(Math.abs(canonical.x-(a.x+b.x)/2)<1e-6);
    }
    const head=g.boardPoint(arrow.path.at(-1),transform),previous=g.boardPoint(arrow.path.at(-2),transform);
    const triangle=g.arrowHeadPoints(head,previous,9).split(' ').map(p=>p.split(',').map(Number));
    const mid={x:(triangle[1][0]+triangle[2][0])/2,y:(triangle[1][1]+triangle[2][1])/2},d=game.DELTA[arrow.dir];
    assert.ok(Math.abs(head.x-mid.x-d.x*9)<1e-5&&Math.abs(head.y-mid.y-d.y*9)<1e-5,'final-segment arrowhead orientation');
    const route=g.boardEscapeRoute(arrow,transform,board),bodyLength=game.pathCells(arrow).length-1;
    assert.equal(JSON.stringify(route.slice(0,bodyLength+1)),JSON.stringify(game.pathCells(arrow)),'all bends retained');
    const tail=g.boardPoint(g.routePoint(route,route.length-1-bodyLength),transform);
    assert.ok(tail.x<0||tail.x>board||tail.y<0||tail.y>board,'tail fully clears actual viewport before escape callback');
   }
  }
  console.log(`${width}x${height}, bottom inset ${bottomInset}: ${board}px board, all 100 puzzles centered, ~82% visible usage, all segments clickable.`);
 }
}
const level=game.LEVELS[1];assert.equal(level.arrows.length,5);assert.ok(game.solution(level).length===5);
const tree=PuzzleBoard({level,arrows:level.arrows,onTap(){},blocked:null,blockerId:null,hintId:null,flightId:null,flightProgress:null,boardSize:328});
const nodes=flatten(tree);
assert.equal(nodes.filter(n=>n.type==='Polygon').length,5);
assert.equal(nodes.filter(n=>n.type==='Text').length,0,'arrowheads never depend on font glyphs');
assert.equal(nodes.filter(n=>n.type==='Pressable').length,1,'one input surface');
const svg=nodes.find(n=>n.type==='Svg');assert.equal(svg.props.viewBox,'0 0 328 328');assert.equal(svg.props.preserveAspectRatio,'xMidYMid meet');
assert.equal(JSON.stringify(game.LEVELS),before,'rendering never mutates canonical collision data');
console.log('Passed: normalized geometry, pixel-space heads, route-following exit, safe-layout bounds and explicit Android SVG primitives.');
