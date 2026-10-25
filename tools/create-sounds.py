"""Original, reproducible casual-puzzle SFX. PCM16 mono WAV, no external assets."""
import math, random, struct, wave
from pathlib import Path
RATE=44100
rng=random.Random(7319)
def empty(seconds): return [0.0]*int(RATE*seconds)
def bell(out,start,freq,duration,volume=.5):
    base=int(start*RATE)
    # Inharmonic, independently damped partials: a struck bell rather than a beep.
    partials=[(1,.72,4),(2.01,.18,7),(3.97,.07,12),(6.1,.03,18)]
    for i in range(min(int(duration*RATE),len(out)-base)):
        t=i/RATE;attack=min(1,t/.004)
        out[base+i]+=volume*attack*sum(a*math.exp(-decay*t/duration)*math.sin(2*math.pi*freq*p*t) for p,a,decay in partials)
def swish(out,start,duration,volume=.3,up=True):
    base=int(start*RATE);low=0.;phase=0.
    for i in range(min(int(duration*RATE),len(out)-base)):
        t=i/RATE;u=t/duration;n=rng.uniform(-1,1);low=.72*low+.28*n
        phase+=2*math.pi*((120+320*u) if up else (440-300*u))/RATE
        env=math.sin(math.pi*u)**1.8
        out[base+i]+=volume*env*(low*.85+math.sin(phase)*.15)
def pop(out,freq=650,volume=.4):
    duration=min(.09,len(out)/RATE)
    for i in range(int(duration*RATE)):
        t=i/RATE;u=t/duration
        phase=2*math.pi*(freq*t-freq*.35*t*t/duration)
        out[i]+=volume*min(1,t/.0015)*math.exp(-8*u)*(math.sin(phase)+.12*rng.uniform(-1,1))
def render(name):
    duration={'app-start':.55,'button-tap':.055,'arrow-tap':.055,'arrow-move':.24,'arrow-escape':.18,'blocked':.13,'hint':.48,'lifeline':.62,'level-complete':1.55,'coin':.32,'restart':.27,'star':.2,'star-bright':.28}[name]
    out=empty(duration)
    if name=='button-tap':pop(out,850,.25)
    elif name=='arrow-tap':pop(out,1200,.2)
    elif name=='arrow-move':swish(out,0,.23,.6)
    elif name=='arrow-escape':pop(out,1150,.35);swish(out,.025,.12,.16)
    elif name=='blocked':pop(out,145,.5);swish(out,0,.1,.12,False)
    elif name=='hint':
        for start,f in [(0,784),(.11,1175)]:bell(out,start,f,.32,.4)
    elif name=='lifeline':
        swish(out,0,.4,.13)
        for i,f in enumerate([392,587,784,1175]):bell(out,i*.09,f,.34,.4)
    elif name=='level-complete':
        # C major arpeggio into a warm sustained success chord, ~1.5 seconds.
        for i,f in enumerate([523.25,659.25,783.99,1046.5]):bell(out,i*.13,f,.85,.5)
        for f in [523.25,659.25,783.99]:bell(out,.57,f,.95,.22)
        for i,f in enumerate([1568,2093,2637]):bell(out,.68+i*.1,f,.45,.08)
    elif name=='coin':bell(out,0,1568,.28,.35);bell(out,.065,2350,.24,.2)
    elif name=='restart':swish(out,0,.25,.5,False)
    elif name.startswith('star'):
        bell(out,0,1568 if name=='star' else 2093,duration,.3)
        bell(out,.025,2350 if name=='star' else 3136,duration-.025,.1)
    else:
        for i,f in enumerate([523,659,784]):bell(out,i*.1,f,.33,.3)
    # Consistent perceived loudness, capped peaks, and click-free ends.
    target={'button-tap':.065,'arrow-tap':.075,'arrow-move':.065,'level-complete':.12,'star':.055,'star-bright':.06}.get(name,.09)
    rms=math.sqrt(sum(v*v for v in out)/len(out)) or 1
    gain=min(target/rms,.7/(max(abs(v) for v in out) or 1))
    for i in range(len(out)):
        out[i]*=gain*min(1,i/(RATE*.002),(len(out)-1-i)/(RATE*.012))
    path=Path('assets/sounds')/(name+'.wav')
    with wave.open(str(path),'wb') as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(RATE)
        wav.writeframes(struct.pack('<'+'h'*len(out),*(round(max(-1,min(1,v))*32767) for v in out)))
    return len(out)/RATE
names=['app-start','button-tap','arrow-tap','arrow-move','arrow-escape','blocked','hint','lifeline','level-complete','coin','restart','star','star-bright']
if __name__=='__main__':
    for name in names:print(f'{name}.wav: {render(name):.3f}s')
