import {weaponStyle} from './appearance.js?v=17';
import {servantOf,SERVANTS} from './progression.js?v=17';
import * as M from './model.js?v=17';

export const SUMMON_LEVEL=2;
const magicClasses=new Set(['necromancer','spellbinder','druid','bard']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const cds={attack:.8,ability:3,guard:1.5,dodge:1.8,potion:8,summon:16};
export const canSummon=h=>h.classId==='necromancer'&&h.level>=SUMMON_LEVEL;
export function actionInfo(h){return{attackRange:['bow','staff','wand'].includes(weaponStyle(h.equipment.weapon,h.classId))?11:weaponStyle(h.equipment.weapon,h.classId)==='spear'?3.8:2.8,summonLevel:SUMMON_LEVEL,summonCost:10,cooldowns:cds}}
export function prepareActionCombat(h,entity,others=[]){
 if(h.combat||M.isResolved(h,entity.id)||!M.startCombat(h,entity))return false;
 const c=h.combat;c.hp=Math.round(c.hp*(c.boss?1.85:1.5));c.maxHp=c.hp;entity={...entity,x:Number.isFinite(entity.x)?entity.x:h.position.x+2,z:Number.isFinite(entity.z)?entity.z:h.position.z};Object.assign(c,{mode:'action',x:entity.x,z:entity.z,homeX:entity.x,homeZ:entity.z,clock:0,cooldowns:{},pending:[],nextAttack:1,windup:null,guardFor:0,dodgeFor:0,stunFor:0,wardFor:0,wardPower:0});
 const members=others.filter(e=>e.id!==entity.id&&!M.isResolved(h,e.id)).slice(0,2);if(members.length){c.pack=members.map((e,i)=>{const shadow={...h,combat:null};prepareActionCombat(shadow,e);shadow.combat.nextAttack=1.6+i*.7;return shadow.combat});for(const foe of[c,...c.pack]){foe.attack*=.65;foe.hp=Math.round(foe.hp*.78);foe.maxHp=foe.hp}}return true;
}
export const combatants=h=>h.combat?[h.combat,...h.combat.pack||[]]:[];
const sharedKeys=['cooldowns','guardFor','dodgeFor','wardFor','wardPower','clock','rewards','homeX','homeZ'];
const sharedOf=c=>Object.fromEntries(sharedKeys.map(k=>[k,c[k]]));
function focusOn(h,all,id,shared){const selected=all.find(c=>c.id===id)||all[0];for(const foe of all)delete foe.pack;Object.assign(selected,shared);if(all.length>1)selected.pack=all.filter(c=>c!==selected);h.combat=selected}
export function selectTarget(h,id){const all=combatants(h);if(!all.some(c=>c.id===id&&c.hp>0))return false;focusOn(h,all,id,sharedOf(h.combat));return true}
export function cycleTarget(h){const all=combatants(h).sort((a,b)=>a.id.localeCompare(b.id)),index=all.findIndex(c=>c.id===h.combat?.id);return all.length>1&&selectTarget(h,all[(index+1)%all.length].id)}
export function resumeActionCombat(h){
 const c=h.combat;if(!c)return;const previousMode=c.mode;if(previousMode!=='action')c.location=M.locationId(h);
 const entity=M.entitiesFor(h).find(e=>e.id===c.id),x=Number.isFinite(c.x)?c.x:entity?.x??h.position.x+2,z=Number.isFinite(c.z)?c.z:entity?.z??h.position.z;
 Object.assign(c,{mode:'action',x,z,homeX:c.homeX??x,homeZ:c.homeZ??z,clock:c.clock||0,cooldowns:c.cooldowns||{},pending:c.pending||[],nextAttack:Number.isFinite(c.nextAttack)?c.nextAttack:1,windup:c.windup||null,guardFor:c.guardFor||0,dodgeFor:c.dodgeFor||0,stunFor:c.stunFor||0,wardFor:c.wardFor||0,wardPower:c.wardPower||0});
 for(const member of c.pack||[]){const shadow={...h,combat:member};resumeActionCombat(shadow)}
}
const emit=(events,kind,data={})=>events.push({kind,...data});
function record(c,text){c.log=[text,...c.log].slice(0,8)}
function safeCompanionPoint(h,env){for(const[x,z]of[[1.3,0],[-1.3,0],[0,1.3],[0,-1.3],[0,0]]){const p={x:h.position.x+x,z:h.position.z+z};if(!env.canMove||env.canMove(p.x,p.z))return p}return{...h.position}}
function summon(h,events,env){
 const effects=M.effects(h),form=servantOf({...h,companion:null}),hp=Math.round((16+h.level*5)*form.hp)+(effects.summonHp||0);
 h.companion={kind:'skeleton',form:form.id,hp,maxHp:hp,remaining:60+(effects.summonDuration||0),cooldown:1,...safeCompanionPoint(h,env),scene:M.locationId(h)};
 emit(events,'summon',{x:h.companion.x,z:h.companion.z});
}
export function summonCompanion(h,env={}){
 const events=[];if(!canSummon(h))return{ok:false,reason:'Raise Skeleton unlocks at level 2.',events};if(h.combat&&h.combat.mode!=='action')return{ok:false,reason:'Finish this encounter first.',events};if((h.summonCooldown||0)>.02)return{ok:false,reason:'Raise Skeleton is recovering.',events};if(h.mp<10)return{ok:false,reason:'Raise Skeleton needs 10 mana.',events};
 const selected=SERVANTS.find(s=>s.id===h.settings?.servant);if(selected&&h.level<selected.level)return{ok:false,reason:'This servant has not unlocked yet.',events};h.mp-=10;h.summonCooldown=16;summon(h,events,env);if(h.combat){h.combat.cooldowns.summon=16;record(h.combat,servantOf(h).name+' rises to fight at your side.')}return{ok:true,events};
}
export function rallyCompanion(h){
 const events=[],s=h.companion;if(!s||h.mp<5||(h.summonCooldown||0)>.02)return{ok:false,reason:!s?'Raise a servant first.':h.mp<5?'Rally needs 5 mana.':'Your servant is recovering.',events};h.mp-=5;h.summonCooldown=16;s.hp=Math.min(s.maxHp,s.hp+18);s.rallyFor=6;s.cooldown=0;if(h.combat)h.combat.cooldowns.summon=16;emit(events,'minionRally',{x:s.x,z:s.z});return{ok:true,events};
}
export function performAction(h,action,env={}){
 if(action==='summon')return h.companion?rallyCompanion(h):summonCompanion(h,env);
 const c=h.combat,events=[];if(!c||c.mode!=='action'||!Object.hasOwn(cds,action))return{ok:false,reason:'Choose a target first.',events};
 if(c.cooldowns[action]>.02)return{ok:false,reason:'That action is recovering.',events};
 const info=actionInfo(h),stats=M.stats(h),effects=M.effects(h),ability=M.classOf(h).ability,rng=env.rng||Math.random;
 if(action==='attack'||action==='ability'){
  const range=action==='ability'&&(ability.magic||h.classId==='ranger')?12:info.attackRange;
  if(distance(h.position,c)>range)return{ok:false,reason:'Get closer to '+c.name+'.',events};
  if(env.lineOfSight&&!env.lineOfSight(h.position,c))return{ok:false,reason:'A wall blocks the attack.',events};
  if(action==='ability'&&h.mp<M.abilityCost(h))return{ok:false,reason:'Not enough mana.',events};
  const special=action==='ability',magic=special?ability.magic:['staff','wand'].includes(weaponStyle(h.equipment.weapon,h.classId)),stat=special?ability.scale:magic?'lore':stats.finesse>stats.might?'finesse':'might';
  if(special){h.mp-=M.abilityCost(h);h.hp=Math.max(1,h.hp-(ability.selfDamage||0))}
  const critical=rng()*100<(effects.crit||0)+(h.raceId==='beastkin'?5:0)+(special?ability.crit||0:0);
  const damage=Math.max(1,Math.round((special?ability.power:4)+stats[stat]+h.equipment.weapon.power*.65+rng()*3+(magic?effects.spell||0:effects.physical||0)+(critical?6+(effects.critDamage||0):0)-(magic?0:c.armor)));
  const ranged=range>3;c.pending.push({eta:ranged?.18+distance(h.position,c)/35:.15,damage,heal:special?ability.heal||0:0,weaken:special?ability.weaken||0:0,stun:special&&ability.stun?.9:0,poison:!magic?effects.poison||0:0,ward:special?ability.ward||0:0,action,critical});
  emit(events,ranged?'projectile':'swing',{from:{...h.position},to:{x:c.x,z:c.z},action,magic:!!magic});record(c,special?ability.name:'Strike');
  if(special)for(const other of c.pack||[])if(distance(other,c)<3.5&&(!env.lineOfSight||env.lineOfSight(h.position,other))){other.pending.push({eta:ranged?.18+distance(h.position,other)/35:.15,damage:Math.max(1,Math.round(damage*.35)),heal:0,weaken:0,stun:0,poison:0,ward:0,action:'splash'});emit(events,ranged?'projectile':'swing',{from:{...h.position},to:{x:other.x,z:other.z},action,magic:!!magic})}
 }else if(action==='guard'){
  c.guardFor=1.2+(effects.guardTime||0);if(h.companion)h.companion.hp=Math.min(h.companion.maxHp,h.companion.hp+(effects.guardMend||0));h.mp=Math.min(M.maxMp(h),h.mp+3);emit(events,'guard');record(c,'Guard raised · brace for the next blow.');
 }else if(action==='dodge'){
  c.dodgeFor=.4;env.dodge?.();emit(events,'dodge');record(c,'You dodge. Time it against the enemy’s wind-up.');
 }else if(action==='potion'){
  const before=h.hp;if(!M.useItem(h,'potion'))return{ok:false,reason:'No draught available, or health is full.',events};emit(events,'heal',{amount:h.hp-before,x:h.position.x,z:h.position.z});record(c,'Healing draught used.');

 }
 c.cooldowns[action]=cds[action];return{ok:true,events};
}
function approach(actor,goal,step,env){
 const d=distance(actor,goal);if(d<.001)return;const direct={x:actor.x+(goal.x-actor.x)/d*step,z:actor.z+(goal.z-actor.z)/d*step},next=env.navigate?.(actor,goal,step)||direct;
 if(!env.canMove||env.canMove(next.x,next.z))Object.assign(actor,next);else if(env.canMove(next.x,actor.z))actor.x=next.x;else if(env.canMove(actor.x,next.z))actor.z=next.z;
}
function companionTick(h,dt,events,env){
 const s=h.companion;if(!s)return;
 if(h.combat)s.remaining-=dt;else s.hp=Math.min(s.maxHp,s.hp+dt*2);s.rallyFor=Math.max(0,(s.rallyFor||0)-dt);s.cooldown=Math.max(0,s.cooldown-dt);
 if(s.remaining<=0||s.hp<=0){emit(events,'summonEnd');delete h.companion;return}
 const c=h.combat,scene=M.locationId(h);if(s.scene!==scene||distance(s,h.position)>28){Object.assign(s,safeCompanionPoint(h,env));s.scene=scene}
 const form=servantOf(h),goal=c?{x:c.x,z:c.z}:h.position,d=distance(s,goal),stop=c?env.lineOfSight&&!env.lineOfSight(s,c)?.3:form.reach*.7:2;
 if(d>stop){const step=Math.min(d-stop,dt*(c?5:4.5));approach(s,goal,step,env)}
 if(c&&d<form.reach&&s.cooldown<=0&&(!env.lineOfSight||env.lineOfSight(s,c))){const amount=Math.max(1,Math.round((3+Math.floor(M.stats(h).lore*.45)+Math.floor(h.level/2))*form.damage*(s.rallyFor>0?1.3:1))+(M.effects(h).summonDamage||0));c.hp-=amount;s.cooldown=form.interval;if(form.reach>3)emit(events,'minionProjectile',{from:{x:s.x,z:s.z},to:{x:c.x,z:c.z}});emit(events,'minionStrike',{amount,x:c.x,z:c.z});record(c,'Your skeleton strikes for '+amount+'.')}
}
function defeatFoes(h,events,rng){
 const all=combatants(h),dead=all.filter(c=>c.hp<=0);if(!dead.length)return null;const shared=sharedOf(h.combat),rewards=shared.rewards||{xp:0,gold:0,names:[],items:[],boss:false};
 for(const foe of dead){h.combat=foe;const result=M.winCombat(h,foe.log[0],rng);rewards.xp+=result.xp;rewards.gold+=result.gold;rewards.names.push(foe.name);if(result.item)rewards.items.push(result.item);rewards.boss||=result.boss;emit(events,'foeDefeated',{id:foe.id,x:foe.x,z:foe.z})}
 const alive=all.filter(c=>c.hp>0);if(!alive.length){h.combat=null;return{ok:true,outcome:'victory',text:'Defeated '+rewards.names.join(', ')+'.',xp:rewards.xp,gold:rewards.gold,item:rewards.items[0]||null,boss:rewards.boss,events:[...events,{kind:'victory'}]}}
 shared.rewards=rewards;focusOn(h,alive,h.combat?.id,shared);return null;
}
function enemyTick(h,c,dt,env,events){
 const rng=env.rng||Math.random;
 c.stunFor=Math.max(0,c.stunFor-dt);if(c.stunFor>0)return;
 if(c.boss&&c.guardian&&c.phase!==2&&c.hp<c.maxHp*.5){c.phase=2;c.attack+=2;c.nextAttack=Math.min(c.nextAttack,.7);emit(events,'enrage',{id:c.id});record(c,'The guardian’s second phase begins. Its attacks accelerate.')}
 const intent=M.combatIntent({...h,combat:c}),s=h.companion,focus=s&&s.hp>0&&distance(s,c)<(servantOf(h).id==='guardian'?6:4)?s:h.position,enemyRange=intent==='hex'?8:2.65,d=distance(c,focus),player=h.combat;
 if(!c.windup&&(d>enemyRange*.8||env.lineOfSight&&!env.lineOfSight(c,focus))){const step=Math.min(d,dt*(c.kind==='wolf'?3.7:2.7));approach(c,focus,step,env)}
 if(c.windup){
  c.windup.left-=dt;if(c.windup.left<=0){const wind=c.windup,target=wind.target==='companion'?h.companion:h.position,reach=wind.intent==='hex'?9:wind.intent==='heavy'?3.2:2.7;
   if(target&&distance(c,target)<reach&&(!env.lineOfSight||env.lineOfSight(c,target))){
    if(wind.target==='hero'&&player.dodgeFor>0){emit(events,'evade',{id:c.id});record(c,'You dodge the blow.')}else{
     const base=c.attack+(wind.intent==='heavy'?5:wind.intent==='hex'?2:0)-c.weaken,block=wind.target==='hero'&&player.guardFor>0,hurt=Math.max(1,Math.round((base-(wind.target==='hero'?M.armor(h)+(player.wardFor>0?player.wardPower:0):1+servantOf(h).armor+(M.effects(h).summonArmor||0))-rng()*2)*(block?.25:1)));
     if(wind.target==='companion'&&h.companion)h.companion.hp=Math.max(0,h.companion.hp-hurt);else h.hp=Math.max(0,h.hp-hurt);
     emit(events,wind.target==='companion'?'minionHurt':'hurt',{id:c.id,amount:hurt,x:target.x,z:target.z,blocked:block});record(c,(wind.target==='companion'?'Skeleton':block?'Guarded':'You')+' · −'+hurt+' health');
    }
   }else{emit(events,'evade',{id:c.id});record(c,'The attack misses. You moved clear.')}
   emit(events,'enemyStrike',{id:c.id,x:c.x,z:c.z});c.windup=null;c.round++;c.nextAttack=c.boss?(c.phase===2?1:1.25):1.6;
   if(c.poison){c.hp-=c.poison;emit(events,'hit',{amount:c.poison,x:c.x,z:c.z})}
  }
 }else{
  c.nextAttack-=dt;if(c.nextAttack<=0&&d<enemyRange+1&&(!env.lineOfSight||env.lineOfSight(c,focus))){if(intent==='guard'){record(c,'Your foe braces. Press the attack.');c.round++;c.nextAttack=1.2}else{const duration=(intent==='heavy'?1.05:intent==='hex'?1.2:.75)*(c.phase===2?.85:1);c.windup={intent,left:duration,total:duration,target:focus===s?'companion':'hero'};emit(events,'windup',{id:c.id,intent,x:c.x,z:c.z})}}
 }
}
export function advanceAction(h,seconds,env={}){
 const dt=clamp(seconds,0,.1),events=[];if(!Number.isFinite(dt))return{ok:false,events};
 h.summonCooldown=Math.max(0,(h.summonCooldown||0)-dt);companionTick(h,dt,events,env);const c=h.combat;if(!c||c.mode!=='action')return{ok:true,events};
 if(c.location!==M.locationId(h)||distance(h.position,{x:c.homeX,z:c.homeZ})>28){h.combat=null;emit(events,'fled');return{ok:true,outcome:'fled',events}}
 c.clock+=dt;for(const key of Object.keys(c.cooldowns))c.cooldowns[key]=Math.max(0,c.cooldowns[key]-dt);for(const key of['guardFor','dodgeFor','wardFor'])c[key]=Math.max(0,c[key]-dt);
 const rng=env.rng||Math.random;
 for(const foe of combatants(h)){
  for(const hit of foe.pending){hit.eta-=dt;if(hit.eta>0)continue;foe.hp-=hit.damage;if(hit.action==='ability'){const fx=M.effects(h);h.mp=Math.min(M.maxMp(h),h.mp+(fx.soulMana||0));if(h.companion)h.companion.hp=Math.min(h.companion.maxHp,h.companion.hp+(fx.soulMend||0))}const healed=hit.heal?Math.min(M.maxHp(h)-h.hp,hit.heal):0;h.hp+=healed;if(hit.weaken)foe.weaken=hit.weaken;if(hit.stun){foe.stunFor=hit.stun;foe.windup=null;foe.nextAttack=1}if(hit.poison)foe.poison=hit.poison;if(hit.ward){c.wardFor=1.2;c.wardPower=hit.ward}emit(events,'hit',{amount:hit.damage,critical:hit.critical,x:foe.x,z:foe.z,action:hit.action});if(healed)emit(events,'heal',{amount:healed,x:h.position.x,z:h.position.z});record(foe,(hit.action==='ability'?M.classOf(h).ability.name:hit.action==='splash'?'Spell splash':'Strike')+' · '+hit.damage+' damage'+(healed?' · +'+healed+' health':''))}
  foe.pending=foe.pending.filter(hit=>hit.eta>0);
 }
 let result=defeatFoes(h,events,rng);if(result)return result;
 h.mp=Math.min(M.maxMp(h),h.mp+dt*(.65+(M.effects(h).manaRegen||0)/2));
 for(const foe of combatants(h)){enemyTick(h,foe,dt,env,events);if(h.hp<=0)return{...M.loseCombat(h,foe.log[0]),events:[...events,{kind:'defeat'}]}}
 result=defeatFoes(h,events,rng);return result||{ok:true,events};
}
export function fleeAction(h){const c=h.combat;if(!c)return{ok:false};h.combat=null;M.addLog(h,'You withdraw from '+c.name+'.','combat');return{ok:true,outcome:'fled',events:[{kind:'fled'}]}}
