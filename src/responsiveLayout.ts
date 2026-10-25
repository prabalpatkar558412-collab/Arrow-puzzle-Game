export type Insets={top:number;bottom:number;left:number;right:number};
const clamp=(min:number,value:number,max:number)=>Math.max(min,Math.min(max,value));
export function responsiveLayout(screenWidth:number,screenHeight:number,insets:Insets,fontScale=1){
  const safeWidth=Math.max(0,screenWidth-insets.left-insets.right),safeHeight=Math.max(0,screenHeight-insets.top-insets.bottom);
  const horizontalPadding=safeWidth<360?16:20,pageWidth=Math.min(safeWidth,520),contentWidth=Math.max(0,pageWidth-2*horizontalPadding);
  const gridGap=safeWidth<360?8:10,gridCellSize=Math.min(64,Math.floor((contentWidth-4*gridGap)/5));
  return {screenWidth,screenHeight,fontScale,insets,safeWidth,safeHeight,safeTop:insets.top,safeBottom:insets.bottom,
    horizontalPadding,pageWidth,contentWidth,short:safeHeight<640,sectionGap:safeHeight<640?16:22,
    logoSize:clamp(140,Math.min(contentWidth*.6,safeHeight*.25),220),splashLogoSize:Math.min(156,contentWidth*.44,safeHeight*.26),
    titleFont:safeWidth<360?21:24,gridGap,gridCellSize,gridRowStride:gridCellSize+14,
    modalWidth:Math.min(contentWidth,360),modalMaxHeight:Math.max(0,safeHeight-32),
    statCardWidth:(contentWidth-12)/2,weekDotSize:clamp(24,(contentWidth-40)/9,30),
    victoryWidth:Math.min(contentWidth,360),previewBoardSize:Math.min(contentWidth,430),touchSize:44,
  };
}
