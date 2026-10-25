import type {Arrow,Point} from './game';
import {pathCells,DELTA} from './game';

export type BoardTransform={scale:number;offsetX:number;offsetY:number;padding:number};
export function boardTransform(arrows:Arrow[],size:number):BoardTransform{
  const points=arrows.flatMap(a=>a.path),padding=Math.max(16,size*.09);
  if(!points.length)return {scale:1,offsetX:size/2,offsetY:size/2,padding};
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
  const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const scale=Math.max(.01,(size-2*padding)/Math.max(1,maxX-minX,maxY-minY));
  return {scale,offsetX:size/2-(minX+maxX)*scale/2,offsetY:size/2-(minY+maxY)*scale/2,padding};
}
export function boardPoint(p:Point,t:BoardTransform):Point{return {x:p.x*t.scale+t.offsetX,y:p.y*t.scale+t.offsetY};}
export function canonicalPoint(p:Point,t:BoardTransform):Point{return {x:(p.x-t.offsetX)/t.scale,y:(p.y-t.offsetY)/t.scale};}
export function gameplayBoardSize(width:number,height:number,horizontalPadding=16):number{return Math.max(0,Math.min(width-2*horizontalPadding,height-16,520));}
export function arrowHeadPoints(end:Point,previous:Point,length=9):string{
  const angle=Math.atan2(end.y-previous.y,end.x-previous.x),dx=Math.cos(angle),dy=Math.sin(angle),half=length*.42;
  return `${end.x},${end.y} ${end.x-dx*length-dy*half},${end.y-dy*length+dx*half} ${end.x-dx*length+dy*half},${end.y-dy*length-dx*half}`;
}
export function pathData(points:Point[]):string{return points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');}
// Follow the entire canonical body, then exit the *visible* viewport far enough
// for its tail to clear. Early levels no longer fly through invisible margins.
export function boardEscapeRoute(arrow:Arrow,t:BoardTransform,size:number):Point[]{
  const route=pathCells(arrow),head=route[route.length-1],pixel=boardPoint(head,t),d=DELTA[arrow.dir];
  const distance=d.x>0?size-pixel.x:d.x<0?pixel.x:d.y>0?size-pixel.y:pixel.y;
  const steps=Math.ceil(Math.max(0,distance)/t.scale)+route.length+1;
  for(let i=1;i<=steps;i++)route.push({x:head.x+d.x*i,y:head.y+d.y*i});
  return route;
}
export function boardEscapeDuration(arrow:Arrow,t:BoardTransform,size:number):number{return Math.max(600,(boardEscapeRoute(arrow,t,size).length-pathCells(arrow).length)*t.scale/420*1000);}
export function routePoint(route:Point[],distance:number):Point&{dx:number;dy:number}{
  const index=Math.max(0,Math.min(route.length-2,Math.floor(distance))),fraction=Math.min(1,Math.max(0,distance-index));
  const a=route[index],b=route[index+1];return {x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction,dx:b.x-a.x,dy:b.y-a.y};
}
