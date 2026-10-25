const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
function load(file,deps={}){
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React}}).outputText,{exports,require:n=>deps[n],console,setTimeout,clearTimeout});return exports;
}
const designs=load('src/levels.ts',{'./level-layouts.json':{default:require('../src/level-layouts.json')}});
const game=load('src/game.ts',{'./levels':designs}),geometry=load('src/boardGeometry.ts',{'./game':game}),hit=load('src/arrowHitTest.ts');
const React={createElement:(type,props,...children)=>({type,props:props??{},children:children.flat(Infinity)})};
const board=load('src/PuzzleBoard.tsx',{
 react:{default:React,useMemo:f=>f(),useEffect(){},useState:v=>[v,()=>{}]},
 'react-native':{View:'View',StyleSheet:{absoluteFillObject:{}}},
 'react-native-svg':{default:'Svg',Circle:'Circle',G:'G',Path:'Path',Polygon:'Polygon'},
 './SoundPressable':{SoundPressable:'Pressable'},'./game':game,'./arrowHitTest':hit,'./boardGeometry':geometry,
});
function flatten(n){if(!n||typeof n!=='object')return[];if(typeof n.type==='function')return flatten(n.type(n.props));return[n,...n.children.flatMap(flatten)];}
module.exports={load,game,geometry,hit,PuzzleBoard:board.PuzzleBoard,flatten};
