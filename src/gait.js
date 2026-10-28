// Contact frames sampled from both adult GLBs with their authored ankle/sole
// motion. Walk: frames 0/20 of 40. Run: frames 1/15 of 28 (30 fps).
// Read time and duration from the active AnimationAction so playback speed,
// clip changes, and loop boundaries cannot drift away from the visible feet.
export const GAIT_CONTACTS=Object.freeze({
 Walking_A:Object.freeze([{phase:0,foot:'left'},{phase:.5,foot:'right'}].map(Object.freeze)),
 Running_A:Object.freeze([{phase:1/28,foot:'left'},{phase:15/28,foot:'right'}].map(Object.freeze))
});

// Returns contacts in (previousTime,nextTime], in animation-time order. Both
// wrapped AnimationAction.time and monotonically increasing times are valid.
// On a freshly reset action, use previousTime=-Number.EPSILON to include its
// initial contact. Track the current action even while blocked/paused, passing
// moving:false, so resuming never replays contacts from stationary movement.
export function contactEvents(previousTime,nextTime,duration,clip,{moving=true}={}){
 const contacts=Object.hasOwn(GAIT_CONTACTS,clip)?GAIT_CONTACTS[clip]:null;
 if(!moving||!contacts||![previousTime,nextTime,duration].every(Number.isFinite)||duration<=0||nextTime<0)return[];
 let end=nextTime;
 if(end<previousTime){
  if(previousTime<0||previousTime>=duration||end>=duration)return[];
  end+=duration;
 }
 if(end<=previousTime)return[];
 // Animation updates are sampled every frame. A seek or a long unsampled
 // interval should not produce a burst of old footsteps on returning.
 if(end-previousTime>duration*2)return[];
 const events=[];
 for(const {phase,foot} of contacts){
  const at=phase*duration,first=Math.floor((previousTime-at)/duration)+1,last=Math.floor((end-at)/duration);
  for(let cycle=first;cycle<=last;cycle++)events.push({foot,phase,time:cycle*duration+at});
 }
 return events.sort((a,b)=>a.time-b.time);
}
