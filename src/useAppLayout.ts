import {useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {responsiveLayout} from './responsiveLayout';
export function useAppLayout(){
  const {width,height,fontScale}=useWindowDimensions(),insets=useSafeAreaInsets();
  return responsiveLayout(width,height,insets,fontScale);
}
