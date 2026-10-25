// Persisted campaign progress is the authority, never the selected tile/status.
export function levelAccess(selected:number,highestUnlocked:number,total:number):'play'|'preview'|'invalid'{
  if(!Number.isInteger(selected)||selected<1||selected>total)return 'invalid';
  const highest=Number.isInteger(highestUnlocked)?Math.max(1,Math.min(total,highestUnlocked)):1;
  return selected<=highest?'play':'preview';
}
