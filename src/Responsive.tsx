import React from 'react';
import {ScrollView,StyleSheet,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {SoundPressable} from './SoundPressable';
import {useAppLayout} from './useAppLayout';

export function ScreenFrame({children,backgroundColor='#FFFFFF'}:{children:React.ReactNode;backgroundColor?:string}){
  const {insets}=useAppLayout();
  return <View style={{flex:1,backgroundColor,paddingTop:insets.top,paddingBottom:insets.bottom,paddingLeft:insets.left,paddingRight:insets.right}}>{children}</View>;
}
export function ResponsiveModal({children,onClose,label}:{children:React.ReactNode;onClose?:()=>void;label:string}){
  const l=useAppLayout();
  return <View accessibilityViewIsModal style={[{position:'absolute',top:l.insets.top,bottom:l.insets.bottom,left:l.insets.left,right:l.insets.right},{backgroundColor:'rgba(16,25,67,.52)',alignItems:'center',justifyContent:'center',padding:16,zIndex:60}]}>
    <View style={{width:l.modalWidth,maxHeight:l.modalMaxHeight,borderRadius:25,backgroundColor:'#FFFFFF',overflow:'hidden',elevation:8}}>
      {onClose&&<SoundPressable accessibilityRole="button" accessibilityLabel={label} onPress={onClose} style={{position:'absolute',right:6,top:6,width:44,height:44,zIndex:1,alignItems:'center',justifyContent:'center'}}><Ionicons name="close" size={22} color="#101943"/></SoundPressable>}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{maxHeight:l.modalMaxHeight,flexGrow:0}} contentContainerStyle={{paddingHorizontal:20,paddingTop:onClose?48:24,paddingBottom:24,alignItems:'center'}}>{children}</ScrollView>
    </View>
  </View>;
}
