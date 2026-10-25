export interface SoundVoice{
  play(allowed:()=>boolean):void;
  stop():void;
  dispose():void;
}
export interface SoundDriver{
  readonly needsGesture:boolean;
  configure():Promise<void>;
  load(source:number):Promise<SoundVoice>;
  unlock():Promise<boolean>;
  dispose():void;
}
