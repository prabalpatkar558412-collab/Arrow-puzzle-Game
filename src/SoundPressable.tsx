import React from 'react';
import {Pressable as NativePressable} from 'react-native';
import {sounds} from './sounds';

type Props=React.ComponentProps<typeof NativePressable>&{sound?:boolean};
export function SoundPressable({sound=true,onPress,...props}:Props){
  return <NativePressable {...props} onPress={event=>{sounds.interact();if(sound)sounds.play('button-tap');onPress?.(event);}}/>;
}
