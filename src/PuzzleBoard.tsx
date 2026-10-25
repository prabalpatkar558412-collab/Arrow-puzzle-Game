import React,{useEffect,useMemo,useState} from 'react';
import {Animated,StyleSheet,View} from 'react-native';
import Svg,{Circle,G,Path,Polygon} from 'react-native-svg';
import {SoundPressable as Pressable} from './SoundPressable';
import {Arrow,Level,pathCells} from './game';
import {boardPointFromEvent,hitTestArrow} from './arrowHitTest';
import {BoardTransform,arrowHeadPoints,boardEscapeRoute,boardPoint,boardTransform,pathData,routePoint} from './boardGeometry';

const NAVY='#101943';
function ArrowDrawing({points,color,stroke,headSize}:{points:{x:number;y:number}[];color:string;stroke:number;headSize:number}){
  if(points.length<2)return null;
  return <G><Path d={pathData(points)} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"/><Polygon points={arrowHeadPoints(points[points.length-1],points[points.length-2],headSize)} fill={color}/></G>;
}
function FlightPath({arrow,transform,progress,boardSize,stroke,headSize}:{arrow:Arrow;transform:BoardTransform;progress:Animated.Value;boardSize:number;stroke:number;headSize:number}){
  const [value,setValue]=useState(0),route=useMemo(()=>boardEscapeRoute(arrow,transform,boardSize),[arrow,transform,boardSize]);
  useEffect(()=>{const id=progress.addListener(({value})=>setValue(value));return()=>progress.removeListener(id);},[progress]);
  const bodyLength=pathCells(arrow).length-1,head=bodyLength+value*(route.length-1-bodyLength),tail=Math.max(0,head-bodyLength);
  const points=[routePoint(route,tail),...route.slice(Math.floor(tail)+1,Math.ceil(head)),routePoint(route,head)].filter((p,i,all)=>i===0||Math.hypot(p.x-all[i-1].x,p.y-all[i-1].y)>.0001);
  // At the first frame render the authored body; thereafter preserve its full
  // ordered-route movement and the same fixed-size screen-space arrowhead.
  return <ArrowDrawing points={(value===0?arrow.path:points).map(p=>boardPoint(p,transform))} color={NAVY} stroke={stroke} headSize={headSize}/>;
}
type Props={level:Level;arrows:Arrow[];onTap:(a:Arrow)=>void;blocked:string|null;blockerId:string|null;hintId:string|null;flightId:string|null;flightProgress:Animated.Value;boardSize:number;previewMode?:boolean};
export function PuzzleBoard({level,arrows,onTap,blocked,blockerId,hintId,flightId,flightProgress,boardSize,previewMode=false}:Props){
  // Always use the full authored level, never the shrinking remaining list.
  const transform=useMemo(()=>boardTransform(level.arrows,boardSize),[level,boardSize]);
  const stroke=Math.max(2.6,Math.min(3.2,boardSize/115)),headSize=Math.max(7,Math.min(10,transform.scale*.45));
  const gap=Math.max(14,Math.min(24,transform.scale)),dots=Math.floor(boardSize/gap);
  return <View pointerEvents={previewMode?'none':'auto'} style={{width:boardSize,height:boardSize,backgroundColor:'#FFFFFF',overflow:'hidden'}}>
    <Svg width={boardSize} height={boardSize} viewBox={`0 0 ${boardSize} ${boardSize}`} preserveAspectRatio="xMidYMid meet" pointerEvents="none">
      {Array.from({length:dots*dots},(_,i)=><Circle key={`dot-${i}`} cx={(i%dots+.5)*gap} cy={(Math.floor(i/dots)+.5)*gap} r={.85} fill="#DAE0EA"/>)}
      {arrows.map(a=>!previewMode&&flightId===a.id?<FlightPath key={a.id} arrow={a} transform={transform} progress={flightProgress} boardSize={boardSize} stroke={stroke} headSize={headSize}/>:<ArrowDrawing key={a.id} points={a.path.map(p=>boardPoint(p,transform))} color={previewMode?NAVY:blockerId===a.id?'#D65E4A':blocked===a.id||hintId===a.id?'#F2912F':NAVY} stroke={stroke} headSize={headSize}/>)}
    </Svg>
    {!previewMode&&<Pressable accessibilityRole="button" accessibilityLabel="Puzzle board. Tap any arrow path to move it." sound={false} onPress={event=>{const point=boardPointFromEvent(event,boardSize);if(!point)return;const arrow=hitTestArrow(arrows,level.size,boardSize,point,11,transform);if(arrow)onTap(arrow);}} style={StyleSheet.absoluteFillObject}/>}
  </View>;
}
