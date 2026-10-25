import AsyncStorage from '@react-native-async-storage/async-storage';

export const SAVE_KEY='arrow-escape-save';
let pending:Promise<void>=Promise.resolve();

// Serialize complete save snapshots so an older write cannot overwrite a
// newer reward ledger. Coins and their claim marker are stored together.
export function persistSave(save:unknown):Promise<void>{
  const snapshot=JSON.stringify(save);
  pending=pending.catch(()=>{}).then(()=>AsyncStorage.setItem(SAVE_KEY,snapshot));
  return pending;
}
