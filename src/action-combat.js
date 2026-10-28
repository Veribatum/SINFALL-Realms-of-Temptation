import * as M from './model.js?v=11';

export const SUMMON_LEVEL=2;
const magicClasses=new Set(['necromancer','spellbinder','druid','bard']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const cds={attack:.8,ability:3,guard:1.5,dodge:1.8,potion:8,summon:16};
export const canSummon=h=>h.classId==='necromancer'&&h.level>=SUMMON_LEVEL;
export function actionInfo(h){return{attackRange:magicClasses.has(h.classId)||h.classId==='ranger'?11:2.8,summonLevel:SUMMON_LEVEL,summonCost:10,cooldowns:cds}}
export function prepareActionCombat(h,entity){
 if(h.combat||M.isResolved(h,entity.id)||!M.startCombat(h,entity))return false;
 const c=h.combat;c.hp=Math.round(c.hp*(c.boss?1.85:1.5));c.maxHp=c.hp;entity={...entity,x:Number.isFinite(entity.x)?entity.x:h.position.x+2,z:Number.isFinite(entity.z)?entity.z:h.position.z};Object.assign(c,{mode:'action',x:entity.x,z:entity.z,homeX:entity.x,homeZ:entity.z,clock:0,cooldowns:{},pending:[],nextAttack:1,windup:null,guardFor:0,dodgeFor:0,stunFor:0,wardFor:0,wardPower:0});return true;
}
export function resumeActionCombat(h){
 const c=h.combat;if(!c)return;const previousMode=c.mode;if(previousMode!=='action')c.location=M.locationId(h);
 const entity=M.entitiesFor(h).find(e=>e.id===c.id),x=Number.isFinite(c.x)?c.x:entity?.x??h.position.x+2,z=Number.isFinite(c.z)?c.z:entity?.z??h.position.z;
 Object.assign(c,{mode:'action',x,z,homeX:c.homeX??x,homeZ:c.homeZ??z,clock:c.clock||0,cooldowns:c.cooldowns||{},pending:c.pending||[],nextAttack:Number.isFinite(c.nextAttack)?c.nextAttack:1,windup:c.windup||null,guardFor:c.guardFor||0,dodgeFor:c.dodgeFor||0,stunFor:c.stunFor||0,wardFor:c.wardFor||0,wardPower:c.wardPower||0});
}
const emit=(events,kind,data={})=>events.push({kind,...data});
function record(c,text){c.log=[text,...c.log].slice(0,8)}
function safeCompanionPoint(h,env){for(const[x,z]of[[1.3,0],[-1.3,0],[0,1.3],[0,-1.3],[0,0]]){const p={x:h.position.x+x,z:h.position.z+z};if(!env.canMove||env.canMove(p.x,p.z))return p}return{...h.position}}
function summon(h,events,env){
 const effects=M.effects(h),hp=16+h.level*5+(effects.summonHp||0);
 h.companion={kind:'skeleton',hp,maxHp:hp,remaining:60,cooldown:1,...safeCompanionPoint(h,env),scene:M.locationId(h)};
 emit(events,'summon',{x:h.companion.x,z:h.companion.z});
}
export function performAction(h,action,env={}){
 const c=h.combat,events=[];if(!c||c.mode!=='action'||!Object.hasOwn(cds,action))return{ok:false,reason:'Choose a target first.',events};
 if(c.cooldowns[action]>.02)return{ok:false,reason:'That action is recovering.',events};
 const info=actionInfo(h),stats=M.stats(h),effects=M.effects(h),ability=M.classOf(h).ability,rng=env.rng||Math.random;
 if(action==='attack'||action==='ability'){
  const range=action==='ability'&&(ability.magic||h.classId==='ranger')?12:info.attackRange;
  if(distance(h.position,c)>range)return{ok:false,reason:'Get closer to '+c.name+'.',events};
  if(env.lineOfSight&&!env.lineOfSight(h.position,c))return{ok:false,reason:'A wall blocks the attack.',events};
  if(action==='ability'&&h.mp<M.abilityCost(h))return{ok:false,reason:'Not enough mana.',events};
  const special=action==='ability',magic=special?ability.magic:magicClasses.has(h.classId),stat=special?ability.scale:magic?'lore':stats.finesse>stats.might?'finesse':'might';
  if(special){h.mp-=M.abilityCost(h);h.hp=Math.max(1,h.hp-(ability.selfDamage||0))}
  const critical=rng()*100<(effects.crit||0)+(h.raceId==='beastkin'?5:0)+(special?ability.crit||0:0);
  const damage=Math.max(1,Math.round((special?ability.power:4)+stats[stat]+h.equipment.weapon.power*.65+rng()*3+(magic?effects.spell||0:effects.physical||0)+(critical?6+(effects.critDamage||0):0)-(magic?0:c.armor)));
  const ranged=range>3;c.pending.push({eta:ranged?.18+distance(h.position,c)/35:.15,damage,heal:special?ability.heal||0:0,weaken:special?ability.weaken||0:0,stun:special&&ability.stun?.9:0,poison:!magic?effects.poison||0:0,ward:special?ability.ward||0:0,action,critical});
  emit(events,ranged?'projectile':'swing',{from:{...h.position},to:{x:c.x,z:c.z},action,magic:!!magic});record(c,special?ability.name:'Strike');
 }else if(action==='guard'){
  c.guardFor=1.2;h.mp=Math.min(M.maxMp(h),h.mp+3);emit(events,'guard');record(c,'Guard raised · brace for the next blow.');
 }else if(action==='dodge'){
  c.dodgeFor=.4;env.dodge?.();emit(events,'dodge');record(c,'You dodge. Time it against the enemy’s wind-up.');
 }else if(action==='potion'){
  const before=h.hp;if(!M.useItem(h,'potion'))return{ok:false,reason:'No draught available, or health is full.',events};emit(events,'heal',{amount:h.hp-before,x:h.position.x,z:h.position.z});record(c,'Healing draught used.');
 }else if(action==='summon'){
  if(!canSummon(h))return{ok:false,reason:'Raise Skeleton unlocks for necromancers at level 2.',events};
  if(h.mp<10)return{ok:false,reason:'Raise Skeleton needs 10 mana.',events};
  h.mp-=10;summon(h,events,env);record(c,'A skeleton rises to fight at your side.');
 }
 c.cooldowns[action]=cds[action];return{ok:true,events};
}
function companionTick(h,dt,events,env){
 const s=h.companion;if(!s)return;
 s.remaining-=dt;s.cooldown=Math.max(0,s.cooldown-dt);
 if(s.remaining<=0||s.hp<=0){emit(events,'summonEnd');delete h.companion;return}
 const c=h.combat,scene=M.locationId(h);if(s.scene!==scene||distance(s,h.position)>28){Object.assign(s,safeCompanionPoint(h,env));s.scene=scene}
 const goal=c?{x:c.x,z:c.z}:h.position,d=distance(s,goal),stop=c?1.6:2;
 if(d>stop){const step=Math.min(d-stop,dt*(c?5:4.5)),nx=s.x+(goal.x-s.x)/d*step,nz=s.z+(goal.z-s.z)/d*step;if(!env.canMove||env.canMove(nx,nz)){s.x=nx;s.z=nz}}
 if(c&&d<2.4&&s.cooldown<=0&&(!env.lineOfSight||env.lineOfSight(s,c))){const amount=3+Math.floor(M.stats(h).lore*.45)+Math.floor(h.level/2)+(M.effects(h).summonDamage||0);c.hp-=amount;s.cooldown=1.45;emit(events,'minionStrike',{amount,x:c.x,z:c.z});record(c,'Your skeleton strikes for '+amount+'.')}
}
export function advanceAction(h,seconds,env={}){
 const dt=clamp(seconds,0,.1),events=[];if(!Number.isFinite(dt))return{ok:false,events};
 companionTick(h,dt,events,env);const c=h.combat;if(!c||c.mode!=='action')return{ok:true,events};
 if(c.location!==M.locationId(h)||distance(h.position,{x:c.homeX,z:c.homeZ})>28){h.combat=null;emit(events,'fled');return{ok:true,outcome:'fled',events}}
 c.clock+=dt;for(const key of Object.keys(c.cooldowns))c.cooldowns[key]=Math.max(0,c.cooldowns[key]-dt);for(const key of['guardFor','dodgeFor','stunFor','wardFor'])c[key]=Math.max(0,c[key]-dt);
 const rng=env.rng||Math.random;
 for(const hit of c.pending){hit.eta-=dt;if(hit.eta>0)continue;c.hp-=hit.damage;if(hit.heal)h.hp=Math.min(M.maxHp(h),h.hp+hit.heal);if(hit.weaken)c.weaken=hit.weaken;if(hit.stun){c.stunFor=hit.stun;c.windup=null;c.nextAttack=1}if(hit.poison)c.poison=hit.poison;if(hit.ward){c.wardFor=1.2;c.wardPower=hit.ward}emit(events,'hit',{amount:hit.damage,critical:hit.critical,x:c.x,z:c.z,action:hit.action});if(hit.heal)emit(events,'heal',{amount:hit.heal,x:h.position.x,z:h.position.z});record(c,(hit.action==='ability'?M.classOf(h).ability.name:'Strike')+' · '+hit.damage+' damage'+(hit.heal?' · +'+hit.heal+' health':''));}
 c.pending=c.pending.filter(hit=>hit.eta>0);
 if(c.hp<=0){const result=M.winCombat(h,c.log[0],rng);return{...result,events:[...events,{kind:'victory',x:c.x,z:c.z}]}}
 h.mp=Math.min(M.maxMp(h),h.mp+dt*(.65+(M.effects(h).manaRegen||0)/2));
 if(c.stunFor>0)return{ok:true,events};
 const s=h.companion,focus=s&&s.hp>0&&distance(s,c)<4?s:h.position,enemyRange=M.combatIntent(h)==='hex'?8:2.65,d=distance(c,focus);
 if(!c.windup&&d>enemyRange*.8){const step=Math.min(d-enemyRange*.8,dt*(c.kind==='wolf'?3.7:2.7)),nx=c.x+(focus.x-c.x)/d*step,nz=c.z+(focus.z-c.z)/d*step;if(!env.canMove||env.canMove(nx,nz)){c.x=nx;c.z=nz}}
 if(c.windup){
  c.windup.left-=dt;if(c.windup.left<=0){const wind=c.windup,target=wind.target==='companion'?h.companion:h.position,reach=wind.intent==='hex'?9:wind.intent==='heavy'?3.2:2.7;
   if(target&&distance(c,target)<reach&&(!env.lineOfSight||env.lineOfSight(c,target))){
    if(wind.target==='hero'&&c.dodgeFor>0){emit(events,'evade');record(c,'You dodge the blow.')}else{
     const base=c.attack+(wind.intent==='heavy'?5:wind.intent==='hex'?2:0)-c.weaken,block=wind.target==='hero'&&c.guardFor>0,hurt=Math.max(1,Math.round((base-(wind.target==='hero'?M.armor(h)+(c.wardFor>0?c.wardPower:0):1)-rng()*2)*(block?.25:1)));
     if(wind.target==='companion'&&h.companion)h.companion.hp=Math.max(0,h.companion.hp-hurt);else h.hp=Math.max(0,h.hp-hurt);
     emit(events,wind.target==='companion'?'minionHurt':'hurt',{amount:hurt,x:target.x,z:target.z,blocked:block});record(c,(wind.target==='companion'?'Skeleton':block?'Guarded':'You')+' · −'+hurt+' health');
    }
   }else{emit(events,'evade');record(c,'The attack misses. You moved clear.')}
   emit(events,'enemyStrike',{x:c.x,z:c.z});c.windup=null;c.round++;c.nextAttack=c.boss?1.25:1.6;
   if(c.poison){c.hp-=c.poison;emit(events,'hit',{amount:c.poison,x:c.x,z:c.z})}
  }
 }else{
  c.nextAttack-=dt;if(c.nextAttack<=0&&d<enemyRange+1){const intent=M.combatIntent(h);if(intent==='guard'){record(c,'Your foe braces. Press the attack.');c.round++;c.nextAttack=1.2}else{const duration=intent==='heavy'?1.05:intent==='hex'?1.2:.75;c.windup={intent,left:duration,total:duration,target:focus===s?'companion':'hero'};emit(events,'windup',{intent,x:c.x,z:c.z})}}
 }
 if(h.hp<=0)return{...M.loseCombat(h,c.log[0]),events:[...events,{kind:'defeat'}]};
 if(c.hp<=0)return{...M.winCombat(h,c.log[0],rng),events:[...events,{kind:'victory',x:c.x,z:c.z}]};
 return{ok:true,events};
}
export function fleeAction(h){const c=h.combat;if(!c)return{ok:false};h.combat=null;M.addLog(h,'You withdraw from '+c.name+'.','combat');return{ok:true,outcome:'fled',events:[{kind:'fled'}]}}
