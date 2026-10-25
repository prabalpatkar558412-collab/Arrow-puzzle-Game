import {Arrow,blockingArrow} from './game';

export const STARTING_LIFELINES=3;
export function savedLifelines(value:unknown):number{
  return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:STARTING_LIFELINES;
}

// A rescue dissolves a blocked arrow without sending it through another body.
// No blocked arrow means no benefit, so nothing is consumed.
export function planLifeline(arrows:Arrow[],size:number,count:number,now:number,lastUsedAt:number){
  if(count<=0||now-lastUsedAt<700)return null;
  const target=arrows.find(a=>blockingArrow(a,arrows,size));
  if(!target)return null;
  return {target,remaining:arrows.filter(a=>a.id!==target.id),lifelines:count-1};
}
