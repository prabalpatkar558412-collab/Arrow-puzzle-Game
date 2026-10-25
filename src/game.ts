import {LEVEL_DESIGNS,buildDesignedLevel} from './levels';
export type Dir = 'U' | 'D' | 'L' | 'R';
export type Point = { x: number; y: number };
export type Arrow = { id: string; path: Point[]; dir: Dir; exit: Point };
export type Level = { shape?:string;mask?:string[];maskOffset?:number;solution?:string[];size: number; arrows: Arrow[]; starThresholds:{three:number;two:number}; coinReward:number };
export const DELTA: Record<Dir, Point> = { U: {x:0,y:-1}, D:{x:0,y:1}, L:{x:-1,y:0}, R:{x:1,y:0} };

// Exact authored masks are filled with independently playable ribbons. Runtime
// collision, hints and animation continue to consume the same ordered paths.
export const LEVELS: Level[] = LEVEL_DESIGNS.map(buildDesignedLevel);
export function starsForMoves(level:Level,moves:number):number {
  if(moves<=level.starThresholds.three)return 3;
  if(moves<=level.starThresholds.two)return 2;
  return 1;
}
export function coinsForCompletion(level:Level,alreadyRewarded:boolean,daily=false):number {
  return !daily&&!alreadyRewarded?level.coinReward:0;
}

/** Expands each straight segment into occupied lattice cells, including bends. */
export function pathCells(a:Arrow):Point[] {
  const cells:Point[]=[];
  for(let i=0;i<a.path.length-1;i++){
    const from=a.path[i],to=a.path[i+1],dx=Math.sign(to.x-from.x),dy=Math.sign(to.y-from.y);
    if(dx!==0&&dy!==0) throw new Error(`Arrow ${a.id} has a diagonal segment`);
    let x=from.x,y=from.y;if(i===0)cells.push({x,y});
    while(x!==to.x||y!==to.y){x+=dx;y+=dy;cells.push({x,y});}
  }
  const last=a.path[a.path.length-1]; if(!cells.some(p=>p.x===last.x&&p.y===last.y))cells.push(last);
  return cells;
}
export function travelRoute(a:Arrow,size:number):Point[] {
  const route=pathCells(a),d=DELTA[a.dir];let p={...route[route.length-1]};
  while(p.x+d.x>=0&&p.x+d.x<size&&p.y+d.y>=0&&p.y+d.y<size){p={x:p.x+d.x,y:p.y+d.y};route.push(p);}
  route.push({x:p.x+d.x,y:p.y+d.y});return route;
}
/** Ordered head track for the escape animation: follow every authored segment,
 * continue through the exit, then far enough off-board for the tail to clear. */
export function escapeAnimationRoute(a:Arrow,size:number):Point[] {
  const route=travelRoute(a,size),d=DELTA[a.dir],bodyLength=pathCells(a).length-1;
  let p={...route[route.length-1]};
  for(let i=0;i<bodyLength;i++){p={x:p.x+d.x,y:p.y+d.y};route.push(p);}
  return route;
}
export function blockingArrow(a:Arrow,arrows:Arrow[],size:number):Arrow|undefined {
  const ownLength=pathCells(a).length,route=travelRoute(a,size);
  const occupied=new Map<string,Arrow>();
  for(const other of arrows)if(other.id!==a.id)for(const p of pathCells(other))occupied.set(`${p.x},${p.y}`,other);
  for(const p of route.slice(ownLength)){const blocker=occupied.get(`${p.x},${p.y}`);if(blocker)return blocker;}
  return undefined;
}
export function canEscape(a:Arrow,arrows:Arrow[],size:number):boolean {
  return !blockingArrow(a,arrows,size);
}
export function solution(level:Level):string[] {
  const remaining=[...level.arrows],result:string[]=[];
  while(remaining.length){const next=remaining.find(a=>canEscape(a,remaining,level.size));if(!next)return [];result.push(next.id);remaining.splice(remaining.indexOf(next),1);}
  return result;
}
export function validateLevels():string[] {
  const errors:string[]=[];
  LEVELS.forEach((level,i)=>{
    const ids=new Set<string>(),occupied=new Set<string>();
    for(const a of level.arrows){if(ids.has(a.id))errors.push(`Level ${i+1}: duplicate id ${a.id}`);ids.add(a.id);try{pathCells(a).forEach(p=>{const key=`${p.x},${p.y}`;if(occupied.has(key))errors.push(`Level ${i+1}: overlapping paths at ${key}`);occupied.add(key);if(p.x<0||p.y<0||p.x>=level.size||p.y>=level.size)errors.push(`Level ${i+1}: ${a.id} is out of bounds`);});}catch(e){errors.push(String(e));}}
    if(level.mask&&level.maskOffset!==undefined){const expected=new Set<string>();level.mask.forEach((row,y)=>Array.from(row).forEach((cell,x)=>{if(cell==='1')expected.add(`${x+level.maskOffset!},${y+level.maskOffset!}`);}));if(expected.size!==occupied.size||[...expected].some(key=>!occupied.has(key)))errors.push(`Level ${i+1}: incomplete shape coverage`);}
    if(solution(level).length!==level.arrows.length)errors.push(`Level ${i+1}: no full solution`);
  });
  return errors;
}
export function hint(level:Level,remaining:Arrow[]){return remaining.find(a=>canEscape(a,remaining,level.size));}

// Removing an arrow only removes blockers, so a complete greedy solution proves
// solvability. Fail closed if an edited design breaks that guarantee.
const designErrors=validateLevels();
if(designErrors.length)throw new Error(designErrors.join('\n'));
