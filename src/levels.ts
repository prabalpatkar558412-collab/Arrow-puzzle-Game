import type {Level} from './game';
import layouts from './level-layouts.json';

// Exact, reviewed mask-filling paths. The offline authoring tool is never run
// when a player opens or restarts a level.
export const LEVEL_DESIGNS=layouts.map((layout,i)=>({level:i+1,shape:layout.shape,arrowCount:layout.arrows.length,size:layout.size,footprint:layout.mask.length}));
export function getLevelDifficulty(level:number){
 const design=LEVEL_DESIGNS[level-1];
 if(!design)throw new Error(`No authored layout for level ${level}`);
 return design;
}
export function buildDesignedLevel(config:ReturnType<typeof getLevelDifficulty>):Level{
 const layout=layouts[config.level-1];
 if(!layout)throw new Error(`No authored layout for level ${config.level}`);
 // Isolate immutable authored data from any gameplay mutations.
 return JSON.parse(JSON.stringify(layout)) as Level;
}
