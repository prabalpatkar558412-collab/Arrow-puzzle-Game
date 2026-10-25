const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {game,geometry,hit,PuzzleBoard}=require('./load-game.cjs');
const {load}=require('./load-game.cjs');
const {responsiveLayout}=load('src/responsiveLayout.ts');
let currentLayout,currentName='',stateIndex=0,stateValues=[],effects=0;
const Fragment=Symbol('Fragment');
const React={Fragment,createElement:(type,props,...children)=>({type,props:props??{},children:children.flat(Infinity)}),
 useMemo:f=>f(),useRef:v=>({current:v}),useEffect(){},useState:initial=>{
  const value=currentName==='GameApp'?stateValues[stateIndex++]:typeof initial==='function'?initial():initial;
  return[value,()=>{effects++;}];
 }};
class Value{constructor(value){this.value=value;}interpolate({outputRange}){return outputRange[0];}}
const native={View:'View',Text:'Text',Image:'Image',ScrollView:'ScrollView',FlatList:'FlatList',StatusBar:'StatusBar',
 StyleSheet:{create:s=>s,absoluteFillObject:{position:'absolute',left:0,top:0,right:0,bottom:0},hairlineWidth:.5},Animated:{Value,View:'View'}};
function loadUI(file,deps){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React}}).outputText,{exports,require:n=>{
 if(n.startsWith('./public/'))return n;
 if(!(n in deps))throw new Error(`Missing render dependency ${n}`);return deps[n];
 },setTimeout,clearTimeout,console});return exports;}
const shared={react:{default:React,...React},'react-native':native,'@expo/vector-icons':{Ionicons:'Icon'},'./SoundPressable':{SoundPressable:'Pressable'},'./useAppLayout':{useAppLayout:()=>currentLayout}};
const responsive=loadUI('src/Responsive.tsx',shared);
const code=fs.readFileSync('App.tsx','utf8');
const temp='tests/.app-render-source.tsx';fs.writeFileSync(temp,code+'\nexport const audit={GameApp,SplashScreen,VictoryScreen,useScreenStyles};');
let ui;try{ui=loadUI(temp,{...shared,
 './src/Responsive':responsive,'./src/useAppLayout':{useAppLayout:()=>currentLayout},
 './src/PuzzleBoard':{PuzzleBoard},'./src/boardGeometry':geometry,'./src/arrowHitTest':hit,
 './src/SoundPressable':{SoundPressable:'Pressable'},'./src/game':game,
 './src/sounds':{sounds:new Proxy({},{get:()=>()=>{effects++;}})},'./src/soundAssets':{SOUND_ASSETS:{}},
 './src/lifeline':{STARTING_LIFELINES:3},'./src/levelAccess':require('./load-game.cjs').load('src/levelAccess.ts'),
 './src/economy':{},'./src/storage':{persistSave(){effects++;}},
 '@react-native-async-storage/async-storage':{default:{}},'expo-haptics':{},
 'react-native-safe-area-context':{SafeAreaProvider:({children})=>children,initialWindowMetrics:null},
 }).audit;}finally{fs.unlinkSync(temp);}
function style(value){if(Array.isArray(value))return Object.assign({},...value.map(style));if(typeof value==='function')return style(value({pressed:false}));return value||{};}
function resolve(node){
 if(node===null||node===undefined||typeof node==='boolean')return null;
 if(typeof node==='string'||typeof node==='number')return {type:'raw',text:String(node),props:{},children:[]};
 if(Array.isArray(node))return node.map(resolve).filter(Boolean);
 if(node.type===Fragment)return node.children.flatMap(n=>{const r=resolve(n);return Array.isArray(r)?r:r?[r]:[];});
 if(typeof node.type==='function'){
  const previous=currentName;currentName=node.type.name;if(currentName==='GameApp')stateIndex=0;
  const output=node.type({...node.props,children:node.children.length===1?node.children[0]:node.children});currentName=previous;
  return resolve(output);
 }
 const children=node.children.flatMap(n=>{const r=resolve(n);return Array.isArray(r)?r:r?[r]:[];});
 const props={...node.props,style:style(node.props.style)};
 if(node.type==='StatusBar')return null;
 if(node.type==='FlatList'){
  const rows=[];for(let i=0;i<node.props.data.length;i+=node.props.numColumns){const items=node.props.data.slice(i,i+node.props.numColumns).map(item=>resolve(node.props.renderItem({item})));rows.push({type:'View',props:{style:{flexDirection:'row',...node.props.columnWrapperStyle}},children:items});}
  return {type:'ScrollView',props:{...props,contentContainerStyle:style(node.props.contentContainerStyle)},children:rows};
 }
 return {type:node.type,props,children};
}
function renderScreen(name,width,height,bottom=48,fontScale=1){
 effects=0;currentLayout=responsiveLayout(width,height,{top:24,bottom,left:0,right:0},fontScale);
 const levelNo=Number(name.match(/game-(\d+)/)?.[1]||2),level=game.LEVELS[levelNo-1];
 const save={unlocked:9,current:9,completed:[1,2,3,4,5,6,7,8],sound:true,vibe:false,coins:game.LEVELS.slice(0,8).reduce((s,l)=>s+l.coinReward,0),lifelines:2,hints:3,stars:{1:3},xp:800,totalCoinsEarned:340,bestTimes:{1:18},recentLevels:[8,7,6],dailyGoalProgress:1,dailyGoalDate:'2026-10-25',activityDates:[],inProgress:null};
 const screen=name.startsWith('game')||['pause','failure','tutorial'].includes(name)?'game':name==='select'?'levels':name==='complete'?'complete':name==='splash'?'home':name;
 const result={level:2,moves:level.arrows.length,stars:2,coins:game.LEVELS[1].coinReward};
 const area={width:currentLayout.safeWidth,height:currentLayout.safeHeight-56-14-25-92};
 stateValues=[area,screen,name==='preview'?25:null,'home',save,true,levelNo,level.arrows,[],2,null,null,name==='failure','',null,name==='pause',false,name==='tutorial',false,name==='splash',false,null,result];
 const root=resolve(React.createElement(ui.GameApp,{}));
 if(effects)throw new Error('Rendering changed game state or triggered audio');
 return {root,layout:currentLayout};
}
module.exports={renderScreen,style};
