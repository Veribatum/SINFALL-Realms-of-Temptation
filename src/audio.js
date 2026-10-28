// Original procedural score and effects. No remote audio, accounts, or downloads.
export const AUDIO_DEFAULTS={muted:false,music:.38,ambience:.35,effects:.65};
export const MUSIC={
 menu:{bpm:60,root:50,melody:[7,10,14,12,7,5,3,2,0,7,10,9,5,3,2,0],chords:[0,8,3,10]},
 town:{bpm:68,root:50,melody:[7,10,14,12,10,7,5,3,5,7,12,10,7,5,3,2],chords:[0,8,3,10]},
 wilds:{bpm:72,root:45,melody:[12,7,10,14,12,7,5,3,7,10,15,14,12,10,7,5],chords:[0,5,8,3]},
 interior:{bpm:62,root:50,melody:[0,3,7,10,7,3,5,7,8,7,3,2,0,3,5,2],chords:[0,8,5,10]},
 dungeon:{bpm:48,root:38,melody:[12,13,7,0,10,7,3,0,12,15,13,7,10,7,1,0],chords:[0,1,8,5]},
 combat:{bpm:112,root:38,melody:[0,7,12,7,3,10,15,10,5,12,17,12,1,8,13,8],chords:[0,3,5,1]}
};
const hz=n=>440*2**((n-69)/12),limit=n=>Math.min(1,Math.max(0,Number(n)||0));
// A muted heel impact followed by a little sole texture. These short, softly
// filtered buffers avoid the sharp white-noise hiss used by combat effects.
function footstepBuffer(context,surface,variant){
 const stone=surface==='stone',duration=stone?.105:.135,buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),samples=buffer.getChannelData(0);
 let seed=9167+variant*7919+(stone?163:0),soft=0;
 for(let i=0;i<samples.length;i++){
  const t=i/context.sampleRate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;soft+=(noise-soft)*(stone?.24:.12);
  const attack=1-Math.exp(-t/.0018),heel=Math.sin(2*Math.PI*(stone?142:108)*(1-variant*.025)*t)*Math.exp(-t/(stone?.014:.017))*.45;
  const soleAt=Math.max(0,t-.012),sole=(1-Math.exp(-soleAt/.004))*Math.exp(-soleAt/(stone?.024:.037))*soft*(stone?.65:.9);
  const grit=noise*Math.exp(-t/.017)*(stone?.055:.018),fade=Math.min(1,(duration-t)/.014);
  samples[i]=(heel+sole+grit)*attack*fade;
 }
 return buffer;
}
export function audioMode(hero,screen='world'){return screen!=='world'?'menu':hero?.combat?'combat':hero?.location?.type==='dungeon'?'dungeon':hero?.location?.type==='interior'?'interior':(hero?.location?.type==='wilds'||hero?.location?.type==='realm'&&hero?.location?.area==='wilds')?'wilds':'town'}
export class Soundscape{
 constructor(){try{this.settings={...AUDIO_DEFAULTS,...JSON.parse(localStorage.getItem('sinfall-audio')||'{}')}}catch{this.settings={...AUDIO_DEFAULTS}}for(const k of['music','ambience','effects'])this.settings[k]=limit(this.settings[k]);this.settings.muted=!!this.settings.muted;this.mode='menu';this.context=null;this.musicNotes=new Set();this.beat=0;this.footClock=0}
 async unlock(){try{if(!this.context){const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)return false;this.context=new Context();this.setup();this.nextBeat=this.context.currentTime+.1;this.timer=setInterval(()=>this.schedule(),120)}if(this.context.state==='suspended')await this.context.resume();this.applyVolumes();return this.context.state==='running'}catch{return false}}
 setup(){const c=this.context;this.master=c.createGain();this.master.connect(c.destination);this.channels={};for(const kind of['music','ambience','effects']){const g=c.createGain();g.connect(this.master);this.channels[kind]=g}
  const reverb=c.createConvolver(),length=c.sampleRate*1.8,impulse=c.createBuffer(2,length,c.sampleRate);for(let ch=0;ch<2;ch++){const d=impulse.getChannelData(ch);for(let i=0;i<length;i++)d[i]=(Math.random()*2-1)*(1-i/length)**3*.35}reverb.buffer=impulse;const wet=c.createGain();wet.gain.value=.22;reverb.connect(wet);wet.connect(this.master);this.channels.music.connect(reverb);
  const buffer=c.createBuffer(1,c.sampleRate*3,c.sampleRate),d=buffer.getChannelData(0);let brown=0;for(let i=0;i<d.length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;d[i]=brown*2}this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const white=this.noise.getChannelData(0);for(let i=0;i<white.length;i++)white[i]=Math.random()*2-1;this.wind=c.createBufferSource();this.wind.buffer=buffer;this.wind.loop=true;this.windFilter=c.createBiquadFilter();this.windFilter.type='lowpass';this.windFilter.frequency.value=500;this.windGain=c.createGain();this.windGain.gain.value=.14;this.wind.connect(this.windFilter);this.windFilter.connect(this.windGain);this.windGain.connect(this.channels.ambience);this.wind.start();this.applyVolumes();
 }
 applyVolumes(){if(!this.context)return;const at=this.context.currentTime;this.master.gain.setTargetAtTime(this.settings.muted?0:.72,at,.04);for(const[k,g]of Object.entries(this.channels))g.gain.setTargetAtTime(this.settings[k],at,.04)}
 configure(key,value){if(!(key in AUDIO_DEFAULTS))return;this.settings[key]=key==='muted'?!!value:limit(value);try{localStorage.setItem('sinfall-audio',JSON.stringify(this.settings))}catch{}this.applyVolumes()}
 toggle(){this.configure('muted',!this.settings.muted);return this.settings.muted}
 setMode(mode){if(!MUSIC[mode]||mode===this.mode)return;this.mode=mode;this.beat=0;if(this.context){for(const o of this.musicNotes){try{o.stop()}catch{}}this.musicNotes.clear();this.nextBeat=this.context.currentTime+.12;this.windGain.gain.setTargetAtTime(mode==='dungeon'?.2:mode==='interior'?.045:mode==='combat'?.06:.15,this.context.currentTime,.7);this.windFilter.frequency.setTargetAtTime(mode==='dungeon'?180:mode==='wilds'?800:400,this.context.currentTime,.7)}}
 note(channel,midi,at,duration,volume=.05,wave='triangle'){
  const c=this.context;if(!c||!Number.isFinite(midi))return;const osc=c.createOscillator(),gain=c.createGain();osc.type=wave;osc.frequency.value=hz(midi);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),at+.025);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);gain.connect(this.channels[channel]);osc.start(at);osc.stop(at+duration+.05);if(channel==='music')this.musicNotes.add(osc);osc.onended=()=>{this.musicNotes.delete(osc);osc.disconnect();gain.disconnect()};
 }
 burst(at,duration=.12,volume=.2,cutoff=900){const c=this.context;if(!c)return;const noise=c.createBufferSource(),gain=c.createGain(),filter=c.createBiquadFilter();noise.buffer=this.noise;filter.type='highpass';filter.frequency.value=cutoff;gain.gain.setValueAtTime(volume,at);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);noise.connect(filter);filter.connect(gain);gain.connect(this.channels.effects);noise.start(at);noise.stop(at+duration);noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect()}}
 schedule(){const c=this.context;if(!c||c.state!=='running')return;const track=MUSIC[this.mode],step=60/track.bpm;this.nextBeat=Math.max(this.nextBeat,c.currentTime);while(this.nextBeat<c.currentTime+.4){const n=this.beat++,at=this.nextBeat,bar=Math.floor(n/8),chord=track.root+track.chords[bar%4],dark=this.mode==='dungeon',battle=this.mode==='combat';
   if(!this.settings.muted&&this.settings.music>0){if(n%8===0)for(const offset of[0,7,15])this.note('music',chord+offset,at,step*7.5,.027,'sine');this.note('music',chord+(n%2?19:12),at,step*1.6,battle?.04:.025,'triangle');if(n%2===0)this.note('music',track.root+12+track.melody[(n/2)%16],at,step*2.8,dark?.026:.048,'sine');if(battle&&n%2===0){this.note('music',26,at,.18,.12,'sine');this.note('music',38,at,.1,.05,'triangle')}}
   if(['town','wilds'].includes(this.mode)&&n%24===12&&this.settings.ambience>0){this.note('ambience',89,at,.12,.035,'sine');this.note('ambience',94,at+.16,.2,.024,'sine')}this.nextBeat+=step;
  }}
 effect(name){const c=this.context;if(!c||c.state!=='running'||this.settings.muted||!this.settings.effects)return;const at=c.currentTime+.005,play=(notes,d=.12,v=.07)=>notes.forEach((m,i)=>this.note('effects',m,at+i*d,d*3,v,'sine'));
  if(name==='ui')this.note('effects',78,at,.06,.023,'sine');
  else if(name==='equip'){this.burst(at,.1,.2,1800);play([67,74],.055,.055)}
  else if(name==='door'){this.burst(at,.24,.3,180);this.note('effects',35,at,.22,.08,'triangle')}
  else if(name==='attack'){this.burst(at,.18,.45,600);this.note('effects',45,at+.06,.16,.12,'triangle')}
  else if(name==='ability')play([62,69,74,81],.055,.085);
  else if(name==='guard'){this.burst(at,.1,.4,2000);play([50,57],.04,.06)}
  else if(name==='potion')play([62,65,69],.09,.065);
  else if(name==='victory'||name==='level')play([62,65,69,74,77,81],.11,.065);
  else if(name==='loot')play([81,86,88],.06,.04);
  else if(name==='discovery')play([62,69,76,74],.16,.05);
  else if(name==='defeat')play([57,53,50,45],.22,.065);
 }
 footstep(surface='grass',running=false,foot='left'){
  const c=this.context;if(!c||c.state!=='running'||this.settings.muted||!this.settings.effects)return false;
  const material=surface==='stone'?'stone':'grass';this.footstepBuffers??={};
  const buffers=this.footstepBuffers[material]??=Array.from({length:3},(_,i)=>footstepBuffer(c,material,i));
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),pan=c.createStereoPanner?.(),at=c.currentTime+.003;
  source.buffer=buffers[Math.floor(Math.random()*buffers.length)];source.playbackRate.value=(running?1.04:.98)*(.97+Math.random()*.06);
  filter.type='lowpass';filter.frequency.value=material==='stone'?1700:900;filter.Q.value=.45;
  const volume=(material==='stone'?.11:.085)*(running?1.12:1)*(.92+Math.random()*.16),end=at+source.buffer.duration/source.playbackRate.value;
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.002);gain.gain.setValueAtTime(volume,end-.014);gain.gain.linearRampToValueAtTime(0,end);
  source.connect(filter);filter.connect(gain);if(pan){pan.pan.value=foot==='right'?.08:-.08;gain.connect(pan);pan.connect(this.channels.effects)}else gain.connect(this.channels.effects);
  source.start(at);source.stop(end);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();pan?.disconnect()};return true;
 }
 // Compatibility for older callers; the world uses animation contact events.
 step(dt,running=false,surface='grass'){if(!Number.isFinite(dt)||dt<=0)return false;this.footClock-=dt;if(this.footClock>0)return false;this.footClock=(running?.933333333:1.333333333)/2;this.footIndex=(this.footIndex||0)+1;return this.footstep(surface,running,this.footIndex%2?'left':'right')}
 pause(){this.context?.suspend().catch(()=>{})}
 dispose(){clearInterval(this.timer);this.context?.close().catch(()=>{});this.context=null;this.footstepBuffers=null}
}
