// Uses the actual presentation components and React Native's Yoga layout engine.
// Text measurement uses Arial approximations; output is NOT an APK screenshot.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {renderScreen,style}=require('./app-layout-tree.cjs');
const names=['splash','home','select','preview','game-1','game-2','game-5','game-10','pause','settings','failure','complete','progress','tutorial'];
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const ionMap=require('../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
const iconFont=path.resolve('node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');
const imageURL='data:image/png;base64,'+fs.readFileSync('public/images/Minimalist Orange and Black Arrow Maze.png').toString('base64');
(async()=>{
 const yoga=(await import(pathToFileURL(path.resolve('.tools/layout-audit/node_modules/yoga-layout/dist/src/index.js')).href)).default;
 const {Resvg}=require('../.tools/layout-audit/node_modules/@resvg/resvg-js');
 const snapshots=[];let cases=0;
 function text(node){return node.children.map(n=>n.type==='raw'?n.text:n.type==='Text'?text(n):'').join('');}
 function build(item,fontScale){
  const node=yoga.Node.create(),s=item.props.style||{};item.yoga=node;
  const scalar={width:'Width',height:'Height',minWidth:'MinWidth',minHeight:'MinHeight',maxWidth:'MaxWidth',maxHeight:'MaxHeight',flexGrow:'FlexGrow',flexShrink:'FlexShrink',flexBasis:'FlexBasis',aspectRatio:'AspectRatio'};
  for(const [key,suffix] of Object.entries(scalar))if(s[key]!==undefined){const method='set'+suffix;let value=s[key];if(typeof value==='string'&&value.endsWith('%')&&node[method+'Percent'])node[method+'Percent'](parseFloat(value));else if(typeof value==='number')node[method](value);}
  if(s.flex!==undefined)node.setFlex(s.flex);
  if(s.flexDirection)node.setFlexDirection({row:yoga.FLEX_DIRECTION_ROW,column:yoga.FLEX_DIRECTION_COLUMN}[s.flexDirection]);
  if(s.flexWrap==='wrap')node.setFlexWrap(yoga.WRAP_WRAP);
  const align={center:yoga.ALIGN_CENTER,stretch:yoga.ALIGN_STRETCH,'flex-start':yoga.ALIGN_FLEX_START,'flex-end':yoga.ALIGN_FLEX_END};
  if(s.alignItems)node.setAlignItems(align[s.alignItems]);if(s.alignSelf)node.setAlignSelf(align[s.alignSelf]);
  if(s.justifyContent)node.setJustifyContent({center:yoga.JUSTIFY_CENTER,'flex-start':yoga.JUSTIFY_FLEX_START,'space-between':yoga.JUSTIFY_SPACE_BETWEEN,'space-around':yoga.JUSTIFY_SPACE_AROUND,'space-evenly':yoga.JUSTIFY_SPACE_EVENLY}[s.justifyContent]);
  for(const [key,edge] of Object.entries({padding:yoga.EDGE_ALL,paddingHorizontal:yoga.EDGE_HORIZONTAL,paddingVertical:yoga.EDGE_VERTICAL,paddingTop:yoga.EDGE_TOP,paddingBottom:yoga.EDGE_BOTTOM,paddingLeft:yoga.EDGE_LEFT,paddingRight:yoga.EDGE_RIGHT}))if(s[key]!==undefined)node.setPadding(edge,s[key]);
  for(const [key,edge] of Object.entries({margin:yoga.EDGE_ALL,marginHorizontal:yoga.EDGE_HORIZONTAL,marginVertical:yoga.EDGE_VERTICAL,marginTop:yoga.EDGE_TOP,marginBottom:yoga.EDGE_BOTTOM,marginLeft:yoga.EDGE_LEFT,marginRight:yoga.EDGE_RIGHT}))if(s[key]!==undefined){if(s[key]==='auto')node.setMarginAuto(edge);else node.setMargin(edge,s[key]);}
  if(s.borderWidth)node.setBorder(yoga.EDGE_ALL,s.borderWidth);if(s.borderBottomWidth)node.setBorder(yoga.EDGE_BOTTOM,s.borderBottomWidth);if(s.borderTopWidth)node.setBorder(yoga.EDGE_TOP,s.borderTopWidth);
  if(s.gap!==undefined)node.setGap(yoga.GUTTER_ALL,s.gap);if(s.columnGap!==undefined)node.setGap(yoga.GUTTER_COLUMN,s.columnGap);if(s.rowGap!==undefined)node.setGap(yoga.GUTTER_ROW,s.rowGap);
  if(s.position==='absolute'){node.setPositionType(yoga.POSITION_TYPE_ABSOLUTE);for(const [k,e] of Object.entries({top:yoga.EDGE_TOP,bottom:yoga.EDGE_BOTTOM,left:yoga.EDGE_LEFT,right:yoga.EDGE_RIGHT}))if(s[k]!==undefined){if(typeof s[k]==='string')node.setPositionPercent(e,parseFloat(s[k]));else node.setPosition(e,s[k]);}}
  if(item.type==='Text'){
   const value=text(item),font=(s.fontSize||14)*Math.min(fontScale,item.props.maxFontSizeMultiplier||fontScale),line=(s.lineHeight||((s.fontSize||14)*1.24))*Math.min(fontScale,item.props.maxFontSizeMultiplier||fontScale);
   node.setMeasureFunc((available,mode)=>{const lines=value.split('\n'),natural=Math.max(0,...lines.map(t=>t.length*font*.54+(s.letterSpacing||0)*t.length));let count=lines.reduce((n,t)=>n+(mode===yoga.MEASURE_MODE_UNDEFINED?1:Math.max(1,Math.ceil(t.length*font*.54/Math.max(1,available)))),0);if(item.props.numberOfLines)count=Math.min(item.props.numberOfLines,count);return {width:mode===yoga.MEASURE_MODE_UNDEFINED?natural:Math.min(natural,available),height:line*count};});
  }else if(item.type==='Icon'){node.setWidth(item.props.size||20);node.setHeight(item.props.size||20);}
  else if(item.type==='Svg'){node.setWidth(item.props.width);node.setHeight(item.props.height);}
  else if(item.type==='ScrollView'){
   node.setOverflow(yoga.OVERFLOW_SCROLL);if(s.maxHeight===undefined){node.setFlexGrow(s.flexGrow??1);node.setFlexShrink(1);node.setFlexBasis(0);}else node.setFlexShrink(1);
   const content={type:'View',props:{style:style(item.props.contentContainerStyle)},children:item.children};item.scrollContent=content;
   node.insertChild(build(content,fontScale),0);
  }else for(const child of item.children.filter(n=>n.type!=='raw'))node.insertChild(build(child,fontScale),node.getChildCount());
  return node;
 }
 function svgContents(item){
  const props=item.props,tag=item.type==='G'?'g':item.type==='Circle'?'circle':item.type==='Path'?'path':item.type==='Polygon'?'polygon':null;
  if(!tag)return '';
  const attrs=Object.entries(props).filter(([k])=>!['children','key','style'].includes(k)).map(([k,v])=>`${k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${escape(v)}"`).join(' ');
  return `<${tag} ${attrs}>${item.children.map(svgContents).join('')}</${tag}>`;
 }
 function paint(item,parentX=0,parentY=0,clips=[]){
  const box=item.yoga.getComputedLayout(),x=parentX+box.left,y=parentY+box.top,s=item.props.style||{},w=box.width,h=box.height;item.box={x,y,w,h};
  if(s.opacity===0)return '';
  let output='';
  if(s.backgroundColor||s.borderColor)output+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${s.borderRadius||0}" fill="${s.backgroundColor||'none'}" stroke="${s.borderColor||'none'}" stroke-width="${s.borderWidth||0}"/>`;
  if(item.type==='Text'){
   const font=(s.fontSize||14)*Math.min(currentFont,item.props.maxFontSizeMultiplier||currentFont),value=text(item),rawLines=value.split('\n');
   let actualFont=font;if(item.props.adjustsFontSizeToFit&&rawLines.length===1)actualFont=Math.min(font,w/Math.max(1,value.length*.54));
   const align=s.textAlign||'left',anchor=align==='center'?'middle':align==='right'?'end':'start',tx=align==='center'?x+w/2:align==='right'?x+w:x;
   let lines=rawLines;if(!item.props.numberOfLines&&w>0){const limit=Math.max(1,Math.floor(w/(actualFont*.54)));lines=rawLines.flatMap(t=>t.match(new RegExp(`.{1,${limit}}`,'g'))||['']);}
   lines.forEach((line,i)=>{output+=`<text x="${tx}" y="${y+actualFont+i*actualFont*1.24}" font-family="Arial" font-size="${actualFont}" font-weight="${s.fontWeight||400}" text-anchor="${anchor}" fill="${s.color||'#101943'}">${escape(line)}</text>`;});
  }else if(item.type==='Icon')output+=`<text x="${x+w/2}" y="${y+h*.88}" font-family="Ionicons" font-size="${item.props.size}" text-anchor="middle" fill="${item.props.color||'#101943'}">&#${ionMap[item.props.name]||ionMap.ellipse};</text>`;
  else if(item.type==='Image')output+=`<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" href="${imageURL}"/>`;
  else if(item.type==='Svg')output+=`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${item.props.viewBox}">${item.children.map(svgContents).join('')}</svg>`;
  else{
   const children=item.scrollContent?[item.scrollContent]:item.children.filter(n=>n.type!=='raw');
   const content=children.map(child=>paint(child,x,y,clips)).join('');
   if(item.type==='ScrollView'||s.overflow==='hidden'){const id='c'+clips.length;clips.push(`<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`);output+=`<g clip-path="url(#${id})">${content}</g>`;}else output+=content;
  }
  return output;
 }
 let currentFont=1;
 fs.mkdirSync('.tools/responsive-audit',{recursive:true});
 for(const [width,height] of [[320,568],[360,800],[375,812],[390,844],[412,915],[480,640]])for(const bottom of [24,48])for(const font of [1,1.3,1.6])for(const name of names){
  currentFont=font;const {root,layout:l}=renderScreen(name,width,height,bottom,font),node=build(root,font);node.setWidth(width);node.setHeight(height);node.calculateLayout(width,height,yoga.DIRECTION_LTR);
  const clips=[],drawing=paint(root,0,0,clips);
  function walk(n,insideScroll=false){
   if(!n.box)return;
   assert.ok(n.box.w>=0&&n.box.h>=0&&Number.isFinite(n.box.x),`${name}: invalid layout`);
   if(n.type==='Pressable'&&n.props.style.position!=='absolute'){
    assert.ok(n.box.x>=-.5&&n.box.x+n.box.w<=width+.5,`${name} ${width}: control outside horizontal screen: ${n.props.accessibilityLabel||''}`);
    if(!insideScroll)assert.ok(n.box.y>=23.5&&n.box.y+n.box.h<=height-bottom+.5,`${name} ${width}: control outside safe height: ${n.props.accessibilityLabel||''}`);
   }
   for(const child of n.scrollContent?[n.scrollContent]:n.children)if(child.type!=='raw')walk(child,insideScroll||n.type==='ScrollView');
  }
  walk(root);
  assert.ok(l.gridCellSize>=44&&5*l.gridCellSize+4*l.gridGap<=l.contentWidth);
  assert.ok(l.modalMaxHeight<=l.safeHeight-32);
  if(width===360&&bottom===48&&font===1){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs>${clips.join('')}</defs><rect width="100%" height="100%" fill="#FFFFFF"/>${drawing}</svg>`;const png=new Resvg(svg,{font:{fontFiles:[iconFont,'C:/Windows/Fonts/arial.ttf'],loadSystemFonts:false,defaultFontFamily:'Arial'}}).render().asPng();fs.writeFileSync(`.tools/responsive-audit/${name}.png`,png);snapshots.push({name,png});}
  node.freeRecursive();cases++;
 }
 const tiles=snapshots.map(({name,png},i)=>`<g transform="translate(${i%5*360} ${Math.floor(i/5)*830})"><rect width="360" height="830" fill="#E7EAF0"/><text x="12" y="20" font-family="Arial" font-size="14" fill="#101943">${name}</text><image y="30" width="360" height="800" href="data:image/png;base64,${png.toString('base64')}"/></g>`).join('');
 const contact=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="2490">${tiles}</svg>`;
 fs.writeFileSync('tests/responsive-audit.png',new Resvg(contact,{font:{fontFiles:['C:/Windows/Fonts/arial.ttf']}}).render().asPng());
 console.log(`Passed ${cases} actual component-tree Yoga cases: 14 screens, 6 sizes, 2 navigation insets, 3 font scales. Contact sheet: tests/responsive-audit.png (not an APK capture).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
