import type {Arrow,Point} from './game';
import type {BoardTransform} from './boardGeometry';

// 20px invisible corridor; the visible stroke and authored geometry are intact.
export const ARROW_HIT_RADIUS=10;
type BoardEvent={
  nativeEvent:{locationX?:number;locationY?:number;clientX?:number;clientY?:number;changedTouches?:ArrayLike<{clientX?:number;clientY?:number;locationX?:number;locationY?:number}>};
  currentTarget?:unknown;
};
// RN Android supplies local coordinates. RN Web onPress forwards a DOM click,
// which supplies viewport coordinates instead; convert using the actual board.
export function boardPointFromEvent(event:BoardEvent,boardSize:number):Point|undefined{
  const native=event.nativeEvent,target=event.currentTarget as {getBoundingClientRect?:()=>{left:number;top:number;width:number;height:number}}|null;
  const touch=native.changedTouches?.[0],x=touch?.clientX??native.clientX,y=touch?.clientY??native.clientY;
  if(target?.getBoundingClientRect&&typeof x==='number'&&typeof y==='number'){
    const rect=target.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return undefined;
    return {x:(x-rect.left)*boardSize/rect.width,y:(y-rect.top)*boardSize/rect.height};
  }
  if(Number.isFinite(native.locationX)&&Number.isFinite(native.locationY))return {x:native.locationX!,y:native.locationY!};
  return undefined;
}
export function distanceToSegment(p:Point,a:Point,b:Point):number{
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
export function hitTestArrow(arrows:Arrow[],size:number,boardSize:number,tap:Point,radius=ARROW_HIT_RADIUS,transform?:BoardTransform):Arrow|undefined{
  if(!Number.isFinite(tap.x)||!Number.isFinite(tap.y)||boardSize<=0||size<=0)return undefined;
  const cell=boardSize/size,toPixels=(p:Point)=>transform?{x:p.x*transform.scale+transform.offsetX,y:p.y*transform.scale+transform.offsetY}:({x:(p.x+.5)*cell,y:(p.y+.5)*cell});
  let closest:Arrow|undefined,distance=radius;
  for(const arrow of arrows){
    for(let i=1;i<arrow.path.length;i++){
      const next=distanceToSegment(tap,toPixels(arrow.path[i-1]),toPixels(arrow.path[i]));
      // Stable authored order breaks exact ties; one tap returns just one ID.
      if(next<=radius&&(!closest||next<distance-1e-6)){distance=next;closest=arrow;}
    }
  }
  return closest;
}
