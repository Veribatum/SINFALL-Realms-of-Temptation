import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {GAIT_CONTACTS,contactEvents} from '../src/gait.js';
import {AUDIO_DEFAULTS,Soundscape} from '../src/audio.js';

test('contact phases follow the descending, planted feet in both shipped adult rigs',async()=>{
 for(const gender of['female','male']){
  const raw=await readFile(new URL(`../assets/models/adult-${gender}.glb`,import.meta.url));
  const source=await new GLTFLoader().register(()=>({name:'EXT_texture_webp',loadTexture:()=>Promise.resolve(new T.Texture())})).parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
  const mixer=new T.AnimationMixer(source.scene);
  for(const name of['Walking_A','Running_A']){
   const clip=source.animations.find(c=>c.name===name),action=mixer.clipAction(clip).play();
   assert(Math.abs(clip.duration-(name==='Walking_A'?40/30:28/30))<.000001);
   for(const {foot,phase} of GAIT_CONTACTS[name]){
    const ankle=source.scene.getObjectByName('foot_'+foot[0]),heights=[];
    for(const offset of[-.075,0,.075]){
     action.time=((phase+offset+1)%1)*clip.duration;mixer.update(0);source.scene.updateMatrixWorld(true);
     heights.push(ankle.getWorldPosition(new T.Vector3()).y);
    }
    assert(heights[0]-heights[1]>.04,`${gender} ${name} ${foot} must descend from the preceding swing`);
    assert(heights[1]<.065,`${gender} ${name} ${foot} must be at ground contact`);
    if(name==='Running_A')assert(heights[2]-heights[1]>.035,'the running foot must lift after its plant');
    else assert(heights[2]<.075,'the walking foot must stay low through its stance');
   }
   action.stop();
  }
  mixer.uncacheRoot(source.scene);
 }
});

test('footfalls alternate exactly twice per animation loop at different frame rates',()=>{
 for(const [clip,duration] of[['Walking_A',40/30],['Running_A',28/30]])for(const fps of[24,60,144]){
  const events=[];let previous=-Number.EPSILON;
  for(let frame=1;frame<=fps*8;frame++){
   const next=frame/fps;
   events.push(...contactEvents(previous,next,duration,clip));previous=next;
  }
  assert.equal(events.length,clip==='Walking_A'?13:18);
  events.forEach((event,i)=>assert.equal(event.foot,i%2?'right':'left'));
  for(let i=1;i<events.length;i++)assert(Math.abs(events[i].time-events[i-1].time-duration/2)<.0000001);
 }
});

test('contact windows include each boundary once, including a wrapped action clock',()=>{
 const duration=40/30;
 assert.deepEqual(contactEvents(-Number.EPSILON,0,duration,'Walking_A').map(e=>e.foot),['left']);
 assert.deepEqual(contactEvents(0,duration/2,duration,'Walking_A').map(e=>e.foot),['right']);
 assert.deepEqual(contactEvents(duration/2,duration/2+.01,duration,'Walking_A'),[]);
 assert.deepEqual(contactEvents(duration-.02,.01,duration,'Walking_A').map(e=>e.foot),['left']);
 assert.deepEqual(contactEvents(.01,.02,duration,'Walking_A'),[]);
 const runDuration=28/30,landing=runDuration/28;
 assert.deepEqual(contactEvents(0,landing-.001,runDuration,'Running_A'),[]);
 assert.deepEqual(contactEvents(landing-.001,landing,runDuration,'Running_A').map(e=>e.foot),['left']);
 assert.deepEqual(contactEvents(landing,landing+.01,runDuration,'Running_A'),[]);
});

test('idle, blocked movement, invalid inputs, and stale animation seeks are silent',()=>{
 for(const clip of['Idle','Block','1H_Melee_Attack_Chop','toString','unknown'])assert.deepEqual(contactEvents(0,.8,40/30,clip),[]);
 assert.deepEqual(contactEvents(0,.8,40/30,'Walking_A',{moving:false}),[]);
 assert.deepEqual(contactEvents(.8,.8,40/30,'Walking_A'),[]);
 assert.deepEqual(contactEvents(0,10,40/30,'Walking_A'),[]);
 for(const args of[[NaN,.8,1],[0,Infinity,1],[0,.8,0],[0,.8,-1],[0,-.1,1],[2,.1,1]])assert.deepEqual(contactEvents(...args,'Walking_A'),[]);
 // The caller still records the clock while blocked; only future contacts play.
 assert.deepEqual(contactEvents(.8,.9,40/30,'Walking_A'),[]);
 assert.deepEqual(contactEvents(.9,1.1,40/30,'Walking_A'),[]);
});

const param=()=>({value:0,events:[],setValueAtTime(value,time){this.events.push(['set',value,time])},linearRampToValueAtTime(value,time){this.events.push(['ramp',value,time])}});
const node=()=>({connections:[],connect(target){this.connections.push(target)},disconnect(){this.disconnected=true}});
function audioContext(){
 const context={sampleRate:16000,currentTime:4,state:'running',sources:[],filters:[],gains:[],pans:[],buffers:[]};
 context.createBuffer=(channels,length,sampleRate)=>{const data=new Float32Array(length),buffer={duration:length/sampleRate,length,sampleRate,getChannelData:()=>data};context.buffers.push(buffer);return buffer};
 context.createBufferSource=()=>{const source={...node(),playbackRate:param(),start(time){this.started=time},stop(time){this.stopped=time}};context.sources.push(source);return source};
 context.createBiquadFilter=()=>{const filter={...node(),frequency:param(),Q:param()};context.filters.push(filter);return filter};
 context.createGain=()=>{const gain={...node(),gain:param()};context.gains.push(gain);return gain};
 context.createStereoPanner=()=>{const pan={...node(),pan:param()};context.pans.push(pan);return pan};
 return context;
}
function readySound(){const sound=new Soundscape();sound.settings={...AUDIO_DEFAULTS};sound.context=audioContext();sound.channels={effects:node()};return sound}

test('contact audio uses quiet heel/sole buffers with softer grass and a short stone response',()=>{
 const sound=readySound(),context=sound.context;sound.burst=()=>assert.fail('footfalls must not use the generic white-noise burst');
 assert.equal(sound.footstep('grass',false,'left'),true);
 assert.equal(sound.footstep('stone',true,'right'),true);
 assert.equal(context.sources.length,2);assert.equal(context.buffers.length,6);
 assert(context.sources[1].buffer.duration<context.sources[0].buffer.duration);
 assert.equal(context.filters[0].type,'lowpass');assert.equal(context.filters[1].type,'lowpass');
 assert(context.filters[0].frequency.value<context.filters[1].frequency.value);
 assert(context.pans[0].pan.value<0);assert(context.pans[1].pan.value>0);
 for(const buffer of context.buffers){
  const samples=buffer.getChannelData(0),peak=Math.max(...samples.map(Math.abs)),rms=Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length);
  assert.equal(samples[0],0);assert(Math.abs(samples.at(-1))<.001);assert(peak<.65);assert(rms>.015&&rms<.16);
 }
 assert.notDeepEqual(sound.footstepBuffers.grass[0].getChannelData(0),sound.footstepBuffers.grass[1].getChannelData(0));
 for(let i=0;i<context.sources.length;i++){
  const source=context.sources[i],gain=context.gains[i];assert.equal(source.started,context.currentTime+.003);assert(source.stopped-source.started<.16);
  assert.equal(gain.gain.events[0][1],0);assert(gain.gain.events.every(([,value])=>value>=0&&value<.14));assert.equal(gain.gain.events.at(-1)[1],0);
  assert.equal(context.pans[i].connections[0],sound.channels.effects);
  source.onended();for(const n of[source,context.filters[i],gain,context.pans[i]])assert(n.disconnected);
 }
 const cached=context.buffers.length;sound.footstep('grass');assert.equal(context.buffers.length,cached,'repeated contacts reuse their short buffers');
});

test('footsteps respect mute, zero effects volume, suspension, and unavailable audio',()=>{
 const sound=readySound(),context=sound.context;
 sound.settings.muted=true;assert.equal(sound.footstep(),false);
 sound.settings.muted=false;sound.settings.effects=0;assert.equal(sound.footstep(),false);
 sound.settings.effects=.65;context.state='suspended';assert.equal(sound.footstep(),false);
 context.state='closed';assert.equal(sound.footstep(),false);
 sound.context=null;assert.equal(sound.footstep(),false);
 assert.equal(context.sources.length,0);assert.equal(context.buffers.length,0);
});
