const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript'),vm=require('node:vm');
const {hit,geometry,PuzzleBoard,flatten}=require('./load-game.cjs');
const board={PuzzleBoard};
const arrow={id:'bent',path:[{x:2,y:6},{x:2,y:2},{x:8,y:2}],dir:'R',exit:{x:10,y:2}};
const selected=[];
const props={level:{size:11,arrows:[arrow]},arrows:[arrow],onTap:a=>selected.push(a.id),blocked:null,blockerId:null,hintId:null,flightId:null,flightProgress:null,boardSize:220};
const overlay=flatten(board.PuzzleBoard(props)).find(n=>n.type==='Pressable');
assert.ok(overlay);
// The Web click shape that previously failed: no locationX/locationY fields.
const transform=geometry.boardTransform([arrow],220);
const pixel=(x,y)=>geometry.boardPoint({x,y},transform);
const currentTarget={getBoundingClientRect:()=>({left:40,top:100,width:220,height:220})};
for(const [gx,gy] of [[8,2],[5,2],[2,4],[2,2]]){const {x,y}=pixel(gx,gy);overlay.props.onPress({nativeEvent:{clientX:40+x,clientY:100+y},currentTarget});}
assert.equal(selected.length,4,'head, horizontal segment, vertical segment and bend click');
const point=pixel(5,2);
overlay.props.onPress({nativeEvent:{locationX:point.x,locationY:point.y},currentTarget:123});
assert.equal(selected.length,5,'Android local touch');
overlay.props.onPress({nativeEvent:{changedTouches:[{clientX:40+point.x,clientY:100+point.y}]},currentTarget});
assert.equal(selected.length,6,'Web touch');
overlay.props.onPress({nativeEvent:{clientX:40+point.x*2,clientY:100+point.y*2},currentTarget:{getBoundingClientRect:()=>({left:40,top:100,width:440,height:440})}});
assert.equal(selected.length,7,'scaled Web board');
overlay.props.onPress({nativeEvent:{clientX:240,clientY:300},currentTarget});
overlay.props.onPress({nativeEvent:{},currentTarget});
assert.equal(selected.length,7,'empty space / invalid event ignored');
assert.ok(selected.every(id=>id==='bent'));
assert.ok(!flatten(board.PuzzleBoard({...props,previewMode:true})).some(n=>n.type==='Pressable'));
console.log('Passed actual board onPress: Web clicks without locationX, Web touch, Android local touch, CSS scaling, full bent path, empty space and locked-preview isolation.');
