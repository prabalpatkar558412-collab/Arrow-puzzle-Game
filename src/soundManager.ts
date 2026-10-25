import type {SoundDriver,SoundVoice} from './audioTypes';
import type {SoundName} from './soundAssets';

export class SoundManager{
  private voices=new Map<SoundName,SoundVoice>();
  private enabled=false;
  private active=true;
  private unlocked=false;
  private startPending=false;
  private startPlayed=false;
  private completionKey:string|null=null;
  private celebrationKey:string|null=null;
  private revealedStars=new Set<number>();
  private scheduled=new Set<ReturnType<typeof setTimeout>>();
  private lastPlayed=new Map<SoundName,number>();
  private disposed=false;
  private epoch=0;
  private pending=new Map<SoundName,number>();
  constructor(private driver:SoundDriver){this.unlocked=!driver.needsGesture;}
  async init(assets:Record<SoundName,number>){
    this.disposed=false;
    const epoch=++this.epoch;
    await this.driver.configure();
    await Promise.all(Object.entries(assets).map(async([name,source])=>{
      try{
        const voice=await this.driver.load(source);
        if(this.disposed||epoch!==this.epoch){voice.dispose();return;}
        this.voices.set(name as SoundName,voice);this.flush();
      }catch(error){console.warn(`Unable to preload SFX ${name}`,error);}
    }));
  }
  setEnabled(enabled:boolean){this.enabled=enabled;if(!enabled)this.stop();else this.flush();}
  setActive(active:boolean){this.active=active;if(!active)this.stop();}
  private stop(){this.cancelScheduled();this.pending.clear();for(const voice of this.voices.values())voice.stop();}
  appReady(){if(!this.startPlayed){this.startPending=true;this.flush();}}
  interact(){
    if(this.disposed)return;
    // A browser can suspend its context again after a background/tab change.
    // Queue this gesture's SFX until resume finishes instead of dropping them.
    if(this.driver.needsGesture)this.unlocked=false;
    // Called synchronously in pointer/keyboard/touch handlers, before awaiting.
    void this.driver.unlock().then(ok=>{if(this.disposed)return;this.unlocked=ok;this.flush();}).catch(()=>{this.unlocked=false;});
  }
  play(name:SoundName){
    if(!this.enabled||!this.active||this.disposed)return;
    if(!this.unlocked||!this.voices.has(name)){this.pending.set(name,Date.now());return;}
    const now=Date.now(),cooldown=name==='button-tap'?55:name==='arrow-tap'||name==='blocked'||name==='arrow-move'?70:0;
    if(cooldown&&now-(this.lastPlayed.get(name)??-Infinity)<cooldown)return;
    this.lastPlayed.set(name,now);
    this.voices.get(name)!.play(()=>this.enabled&&this.active&&!this.disposed);
  }
  private flush(){
    if(!this.enabled||!this.active||!this.unlocked||this.disposed)return;
    if(this.startPending&&!this.startPlayed&&this.voices.has('app-start')){this.startPending=false;this.startPlayed=true;this.play('app-start');}
    for(const [name,time] of this.pending){const lifetime=name==='level-complete'||name==='coin'?3000:800;if(Date.now()-time>lifetime){this.pending.delete(name);continue;}if(this.voices.has(name)){this.pending.delete(name);this.play(name);}}
  }
  private cancelScheduled(){for(const timer of this.scheduled)clearTimeout(timer);this.scheduled.clear();}
  private later(name:SoundName,delay:number){
    if(!this.enabled||!this.active||this.disposed)return;
    const epoch=this.epoch;
    const timer=setTimeout(()=>{this.scheduled.delete(timer);if(epoch===this.epoch)this.play(name);},delay);
    this.scheduled.add(timer);
  }
  beginRun(key:string){this.cancelScheduled();this.completionKey=key;this.celebrationKey=null;this.revealedStars.clear();}
  completeRun(key:string,coins:number){
    if(this.completionKey!==key)return;
    this.completionKey=null;this.celebrationKey=key;
    // Let the last escape pop land before the longer musical flourish.
    this.later('level-complete',110);if(coins>0)this.later('coin',380);
  }
  revealStar(key:string,index:number){
    if(key!==this.celebrationKey||index<0||index>2||this.revealedStars.has(index))return;
    this.revealedStars.add(index);this.play(index===2?'star-bright':'star');
  }
  dispose(){this.epoch++;this.disposed=true;this.cancelScheduled();this.stop();for(const voice of this.voices.values())voice.dispose();this.voices.clear();this.driver.dispose();}
}
