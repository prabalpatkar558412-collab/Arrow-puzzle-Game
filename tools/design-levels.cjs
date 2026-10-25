// Offline authoring tool. No coordinate sampling or runtime random generation.
// Exact masks are covered by ribbons, divided into independent playable arrows.
const fs=require('node:fs');
const plans=[
 ['square',5,3],['U',7,4],['zigzag',7,5],['T',9,7],['square',9,9],
 ['cross',9,10],['staircase',11,11],['U',11,12],['H',13,14],['spiral',13,15],
 ['diamond',13,16],['asymmetric',13,17],['cross',15,18],['S',15,19],['spiral',15,20],
 ['T',15,21],['H',17,22],['diamond',17,23],['staircase',17,24],['spiral',17,25],
];
const families=['arch','hourglass','flag','C','E','F','crown','keyhole','Z','terraces','heart','fork','bowtie','offset-cross','notched-square','bracket'];
for(let i=0;i<80;i++)plans.push([`${families[i%families.length]}:${Math.floor(i/families.length)}`,17,26+Math.floor(i/4)]);
const dirs={U:[0,-1],R:[1,0],D:[0,1],L:[-1,0]};
const key=p=>p.join(',');
function active(shape,x,y,w){
 const t=Math.max(2,Math.floor(w/3)),m=Math.floor(w/2);
 if(shape.includes(':')){
  const [family,variation]=shape.split(':'),v=Number(variation),band=2+v,stem=2+Math.floor(v/2),shift=v-2;
  switch(family){
   case 'arch':return y<band||x<stem||x>=w-stem;
   case 'hourglass':return Math.abs(x-m)<=Math.min(m,2+Math.floor(Math.abs(y-m)*(m-2-v*.4)/m));
   case 'flag':return x<stem||y<6+v&&x<w-2;
   case 'C':return x<stem||y<band||y>=w-band;
   case 'E':{const b=2+Math.floor(v/2);return x<stem||y<b||y>=w-b||Math.abs(y-m-(v%2))<=Math.floor(v/2)+1;}
   case 'F':return x<stem||y<band||y>=m-1&&y<=m+1+v;
   case 'crown':return y>=w-band||x<stem||x>=w-stem||Math.abs(x-m)<=1+Math.floor(v/2);
   case 'keyhole':return y<8+v&&Math.abs(x-m)<=5+Math.floor(v/2)||y>=8+v&&Math.abs(x-m)<=stem;
   case 'Z':return y<stem||y>=w-stem||Math.abs(x-(w-1-y+(v%2)))<=stem;
   case 'terraces':return x>=Math.floor(y/(3+v))&&x<=Math.min(w-1,Math.floor(y/(3+v))+9+v);
   case 'heart':return y<3?x>=2&&x<m-1||x>m+1&&x<w-2:y<7+v?x>=1&&x<w-1:Math.abs(x-m)<=Math.max(1,m-Math.floor((y-6-v)*.7));
   case 'fork':return y>=m?Math.abs(x-m)<=stem:y<m-2?x<band||x>=w-band:true;
   case 'bowtie':return Math.abs(y-m)<=2+Math.floor(Math.max(0,Math.abs(x-m)-1)/2)+Math.floor(v/2)||(v%2===1&&Math.abs(x-m)<=2&&Math.abs(y-m)<=3+Math.floor(v/2));
   case 'offset-cross':return Math.abs(x-(m+shift))<=stem||Math.abs(y-(m-shift))<=stem;
   case 'notched-square':return !(x>=w-band&&y<5+v)&&!(x<stem&&y>=w-4-v);
   case 'bracket':return y<stem||y>=w-stem||Math.abs(x-(m+shift))<=stem;
  }
 }

 switch(shape){
  case 'U':return x<t||x>=w-t||y>=w-t;
  case 'H':return x<t||x>=w-t||Math.abs(y-m)<Math.ceil(t/2);
  case 'T':return y<t||Math.abs(x-m)<Math.ceil(t/2);
  case 'cross':return Math.abs(x-m)<Math.ceil(t/2)||Math.abs(y-m)<Math.ceil(t/2);
  case 'diamond':return Math.abs(x-m)+Math.abs(y-m)<=m+1;
  case 'staircase':return x>=Math.floor(y/3)&&x<=Math.min(w-1,Math.floor(y/3)+Math.ceil(w*.65));
  case 'zigzag':return y<Math.ceil(w/3)?x>=2:y>=w-Math.ceil(w/3)?x<w-2:true;
  case 'S':{const s=Math.max(2,Math.floor(w/5));return y<s||y>=w-s||Math.abs(y-m)<=Math.floor(s/2)||y<m&&x<s||y>m&&x>=w-s;}
  case 'asymmetric':return !(x>=w-t&&y<t)&&!(x<t&&y>=w-t);
  default:return true;
 }
}
function spiral(w){
 const out=[];let left=0,right=w-1,top=0,bottom=w-1;
 while(left<=right&&top<=bottom){
  for(let x=left;x<=right;x++)out.push([x,top]);top++;
  for(let y=top;y<=bottom;y++)out.push([right,y]);right--;
  if(top<=bottom){for(let x=right;x>=left;x--)out.push([x,bottom]);bottom--;}
  if(left<=right){for(let y=bottom;y>=top;y--)out.push([left,y]);left++;}
 }
 return out;
}
function compress(path){return path.filter((p,i)=>i===0||i===path.length-1||p[0]-path[i-1][0]!==path[i+1][0]-p[0]||p[1]-path[i-1][1]!==path[i+1][1]-p[1]);}
function direction(path){const a=path.at(-2),b=path.at(-1);return Object.keys(dirs).find(d=>dirs[d][0]===b[0]-a[0]&&dirs[d][1]===b[1]-a[1]);}
function clear(path,others){
 const [dx,dy]=dirs[direction(path)],occupied=new Set(others.flatMap(p=>p.map(key)));let [x,y]=path.at(-1);
 while(x>=0&&y>=0&&x<21&&y<21){x+=dx;y+=dy;if(occupied.has(key([x,y])))return false;}
 return true;
}
function orient(paths){
 const remaining=paths.map((p,i)=>({p,i})),oriented=[],solution=[];
 while(remaining.length){
  let chosen;
  for(const item of remaining){
   const others=remaining.filter(o=>o!==item).map(o=>o.p);
   for(const p of [item.p,[...item.p].reverse()])if(clear(p,others)){chosen={item,p};break;}
   if(chosen)break;
  }
  if(!chosen)return null;
  oriented[chosen.item.i]=chosen.p;solution.push(chosen.item.i);remaining.splice(remaining.indexOf(chosen.item),1);
 }
 return {oriented,solution};
}
function author(shape,w,count,level){
 let mask=Array.from({length:w},(_,y)=>Array.from({length:w},(_,x)=>active(shape,x,y,w)?'1':'0').join(''));
 const cells=[];mask.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='1')cells.push([x,y]);}));
 const dx=Math.floor((w-1-Math.min(...cells.map(p=>p[0]))-Math.max(...cells.map(p=>p[0])))/2),dy=Math.floor((w-1-Math.min(...cells.map(p=>p[1]))-Math.max(...cells.map(p=>p[1])))/2);
 const centered=new Set(cells.map(([x,y])=>key([x+dx,y+dy])));
 mask=Array.from({length:w},(_,y)=>Array.from({length:w},(_,x)=>centered.has(key([x,y]))?'1':'0').join(''));
 for(let variant=0;variant<80;variant++){
  let paths=[];
  if(shape==='spiral'||shape==='square'&&level>1){paths=[spiral(w)];}
  else{
   for(let y=0;y<w;y++){
    for(let x=0;x<w;){if(mask[y][x]!=='1'){x++;continue;}const run=[];while(x<w&&mask[y][x]==='1')run.push([x++,y]);paths.push(run);}
   }
   // Merge adjacent row-runs into long U/zigzag ribbons. Every active mask
   // cell stays owned by exactly one ribbon; empty mask cells remain empty.
   const target=level===1?count:level>20?Math.min(Math.floor(count*.55),4+Math.floor(variant/10)*3):Math.max(2,Math.floor(count*.55));
   while(paths.length>target){
    let choice;
    outer:for(let j=0;j<paths.length;j++)for(let k=j+1;k<paths.length;k++){
     for(const a of [paths[j],[...paths[j]].reverse()])for(const b of [paths[k],[...paths[k]].reverse()]){
      const p=a.at(-1),q=b[0];
      if(Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])===1){choice={j,k,p:[...a,...b]};if((j+k+variant)%3===0)break outer;}
     }
    }
    if(!choice)break;
    paths[choice.j]=choice.p;paths.splice(choice.k,1);
   }
  }
  if(paths.length>count||paths.some(p=>p.length<2))continue;
  while(paths.length<count){
   const candidates=paths.map((p,i)=>({p,i})).filter(o=>o.p.length>=4).sort((a,b)=>b.p.length-a.p.length);
   if(!candidates.length)break;
   const {p,i}=candidates[0],fraction=.4+((variant+paths.length)%5)*.05;
   const at=Math.max(2,Math.min(p.length-2,Math.floor(p.length*fraction)));
   paths.splice(i,1,p.slice(0,at),p.slice(at));
  }
  if(paths.length!==count)continue;
  const offset=Math.floor((21-w)/2);paths=paths.map(p=>p.map(([x,y])=>[x+offset,y+offset]));
  const result=orient(paths);if(!result)continue;
  const arrows=result.oriented.map((p,i)=>{
   const dir=direction(p),[dx,dy]=dirs[dir];let [x,y]=p.at(-1);
   while(x+dx>=0&&y+dy>=0&&x+dx<21&&y+dy<21){x+=dx;y+=dy;}
   return {id:`shape-v4-${level}-${i+1}`,path:compress(p).map(([x,y])=>({x,y})),dir,exit:{x,y}};
  });
  return {shape,mask,maskOffset:offset,size:21,arrows,solution:result.solution.map(i=>arrows[i].id),starThresholds:{three:count+1,two:count+4},coinReward:25+level*5};
 }
 throw new Error(`Cannot author ${level} ${shape}`);
}
function mobileTutorialTwo(){
 // Deliberately authored: upright left exit, two-bend right arm, L base,
 // one central elbow and a short horizontal blocker. No dense tiny zigzags.
 const paths=[[[7,11],[7,7]],[[12,7],[13,7],[13,11],[12,11]],[[7,12],[7,13],[13,13]],[[9,8],[9,9],[11,9]],[[8,10],[10,10]]];
 const arrows=paths.map((path,i)=>{
  const end=path.at(-1),prev=path.at(-2),dx=Math.sign(end[0]-prev[0]),dy=Math.sign(end[1]-prev[1]);
  const dir=Object.keys(dirs).find(d=>dirs[d][0]===dx&&dirs[d][1]===dy);let [x,y]=end;
  while(x+dx>=0&&y+dy>=0&&x+dx<21&&y+dy<21){x+=dx;y+=dy;}
  return {id:`shape-mobile-v5-2-${i+1}`,path:path.map(([x,y])=>({x,y})),dir,exit:{x,y}};
 });
 const occupied=new Set();for(const path of paths)for(let i=1;i<path.length;i++){let [x,y]=path[i-1];const [ex,ey]=path[i],dx=Math.sign(ex-x),dy=Math.sign(ey-y);occupied.add(key([x,y]));while(x!==ex||y!==ey){x+=dx;y+=dy;occupied.add(key([x,y]));}}
 return {shape:'U',mask:Array.from({length:7},(_,y)=>Array.from({length:7},(_,x)=>occupied.has(key([x+7,y+7]))?'1':'0').join('')),maskOffset:7,size:21,arrows,solution:[0,1,2,3,4].map(i=>arrows[i].id),starThresholds:{three:6,two:9},coinReward:35};
}
const levels=plans.map(([shape,w,count],i)=>i===1?mobileTutorialTwo():author(shape,w,count,i+1));
fs.writeFileSync('src/level-layouts.json',JSON.stringify(levels,null,2)+'\n');
console.log(`Authored ${levels.length} levels with ${new Set(levels.map(l=>l.mask.join('\n'))).size} distinct masks.`);
