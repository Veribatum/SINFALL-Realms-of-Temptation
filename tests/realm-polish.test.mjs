import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import * as M from '../src/model.js';
import * as A from '../src/action-combat.js';
import {populationFor} from '../src/population.js';
import {pedestrianRoute} from '../src/town-life.js';
import {gearLook,itemArt,weaponModel} from '../src/gear.js';
import {centerOf,settlementStreets} from '../src/atlas.js';
import {Realm,lookPitch} from '../src/world.js';
const make=()=>{const h=M.makeHero({name:'Sylvanas',raceId:'elf',classId:'necromancer'},13254);M.enterRealm(h);return h};
const env={rng:()=>.5,canMove:()=>true,lineOfSight:()=>true};
const tick=(h,t)=>{for(let i=0;i<t/.05;i++)A.advanceAction(h,.05,env)};
test('civilian identities persist through work, leisure, retirement and overnight watches',()=>{
 const h=make(),town=h.world.towns[0],day=populationFor(town,12),evening=populationFor(town,20),night=populationFor(town,23.5);assert(day.length>=25);assert.deepEqual(day.map(p=>p.id),night.map(p=>p.id));assert.deepEqual(day.map(p=>p.name),evening.map(p=>p.name));assert(day.filter(p=>p.schedulePhase==='work').length>20);assert(evening.some(p=>p.schedulePhase==='evening'));assert(night.filter(p=>p.retire).length>20);assert(night.some(p=>p.schedulePhase==='night-watch'&&!p.retire));assert.notDeepEqual(day[0].routine,evening[0].routine);assert.deepEqual(populationFor(town,36),day);
});
test('pedestrian detours avoid walls and leave unreachable destinations alone',()=>{
 const canMove=(x,z)=>!(x>3&&x<8&&z>-3&&z<3),path=pedestrianRoute({x:0,z:0},{x:12,z:0},canMove);assert(path.length);assert(path.every(p=>canMove(p.x,p.z)));assert(path.some(p=>Math.abs(p.z)>=3));assert(Math.hypot(path.at(-1).x-12,path.at(-1).z)<.01);assert.deepEqual(pedestrianRoute({x:0,z:0},{x:12,z:0},()=>false),[]);
});
test('market counters and scheduled destinations leave the main pedestrian network passable',()=>{
 const prior=globalThis.document,ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};const h=make(),r=Object.assign(Object.create(Realm.prototype),{hero:h,scene:new T.Scene(),materials:[],textures:[],quality:'low'});
 try{for(const town of h.world.towns){const c=centerOf(town.id);h.position={...c,yaw:0};M.syncRealm(h);r.build();for(const hour of[7,12,18,20,23.5])for(const p of populationFor(town,hour))for(const[x,z]of p.routine)assert(r.canMove(c.x+x,c.z+z),town.id+' '+hour+' '+p.name+' '+x+','+z);
   const stalls=r.colliders.filter(c=>c.w===2.2&&c.d===1.3);for(const stall of stalls)for(const street of settlementStreets(town)){const a=street.from,b=street.to,dx=b.x-a.x,dz=b.z-a.z;for(let t=0;t<=1;t+=.05){const x=c.x+a.x+dx*t,z=c.z+a.z+dz*t;assert(!(Math.abs(x-stall.x)<stall.w+.3&&Math.abs(z-stall.z)<stall.d+.3),'market stall obstructs a street')}}
  }}finally{r.clearScene();globalThis.document=prior}
});
test('weapons have distinct silhouettes and materials, linked to stable inventory art',()=>{
 const items=['Iron Sword','Blackthorn Greatsword','Roseglass Rapier','Fine Veilsteel Blade','Gravebinder Scepter','Runed Emberglass Staff'].map((name,i)=>({name,type:'weapon',quality:i%5})),looks=items.map(i=>gearLook(i,'necromancer'));assert.equal(new Set(looks.map(l=>l.variant)).size,6);
 for(const item of items){const g=weaponModel(item,'necromancer',{adult:true});assert.deepEqual(g.userData.look,gearLook(item,'necromancer'));g.traverse(o=>{if(o.geometry)assert(o.geometry.attributes.position.array.every(Number.isFinite))});assert.match(itemArt(item),/^<svg/);assert.equal(itemArt(item),itemArt(structuredClone(item)));}
 assert.equal(gearLook({type:'weapon',name:'Fine Veilsteel Blade'}).quality,1);const h=make();h.equipment.weapon={name:'Iron sword',visual:'sword'};assert.equal(A.actionInfo(h).attackRange,2.8);h.equipment.weapon={name:'Gravebinder Scepter'};assert.equal(A.actionInfo(h).attackRange,11);
});
test('necromancer paths enforce prerequisites and levels, with a bounded full point refund',()=>{
 const h=make();h.talentPoints=20;assert(!M.unlock(h,'watch'));assert(M.unlock(h,'lore'));assert(M.unlock(h,'choir'));assert(!M.unlock(h,'watch'));h.level=4;assert(M.unlock(h,'watch'));assert.equal(M.effects(h).summonDuration,30);assert(M.unlock(h,'bone'));assert(M.unlock(h,'hunger'));assert(M.unlock(h,'shelter'));const spent=h.talents.length,points=h.talentPoints,gold=h.gold,id=h.id;assert(M.respecTalents(h));assert.equal(h.talentPoints,points+spent);assert.equal(h.gold,gold-M.respecCost(h));assert.equal(h.id,id);assert(!M.respecTalents(h));h.talents=['lore','lore'];assert(!M.validateHero(h));
});
test('a servant follows without expiring while exploring and rally heals and empowers the same ally',()=>{
 const h=make();h.level=4;h.mp=M.maxMp(h);h.talents=['lore','choir','watch'];assert(A.summonCompanion(h,env).ok);const ally=h.companion;assert.equal(ally.remaining,90);tick(h,17);assert.equal(ally.remaining,90);ally.hp=1;const mp=h.mp;assert(A.rallyCompanion(h).ok);assert.equal(h.companion,ally);assert.equal(ally.hp,19);assert.equal(h.mp,mp-5);assert.equal(ally.rallyFor,6);assert(!A.rallyCompanion(h).ok);assert(M.validateHero(h));const copy=JSON.parse(JSON.stringify(h));assert(M.validateHero(copy));copy.companion.rallyFor=900;assert(!M.validateHero(copy));
 A.prepareActionCombat(h,{type:'enemy',kind:'knight',id:'test',x:2,z:20});h.combat.nextAttack=100;tick(h,1);assert(ally.remaining<90);h.combat=null;const remaining=ally.remaining;tick(h,1);assert.equal(ally.remaining,remaining);
});
test('ward and soul talents alter actual guard duration, companion healing and resource recovery',()=>{
 const h=make();h.level=6;h.mp=M.maxMp(h);h.talents=['lore','bone','hunger','shelter','siphon','bloom','feast'];A.summonCompanion(h,env);A.prepareActionCombat(h,{type:'enemy',kind:'knight',id:'test',x:h.position.x+2,z:h.position.z});h.combat.hp=h.combat.maxHp=1000;h.combat.nextAttack=100;h.companion.hp=1;A.performAction(h,'guard',env);assert.equal(h.companion.hp,7);assert.equal(h.combat.guardFor,1.6);const mp=h.mp;A.performAction(h,'ability',env);tick(h,.5);assert(h.companion.hp>=15);assert(h.mp>mp-M.abilityCost(h)+2);assert(M.validateHero(h));
});
test('a side quest turn-in returns tracking to the main plot without completing or replacing it',()=>{
 const h=make(),q=M.discoverRumor(h,'innkeeper');M.acceptSide(h,q.id);q.state='ready';h.settings.trackedQuest=q.id;const campaign=structuredClone(h.campaign),seed=h.world.seed;assert(M.turnIn(h,q.id));assert.deepEqual(h.campaign,campaign);assert.equal(h.world.seed,seed);assert.equal(h.settings.trackedQuest,'main');assert(!M.turnIn(h,q.id));assert(M.validateHero(h));
});

test('normal vertical drag looks up in both camera modes, with an explicit inversion option',()=>{assert(lookPitch(.48,-50,true)>.48);assert(lookPitch(.48,-50,false)<.48);assert(lookPitch(.48,-50,true,true)<.48);assert.equal(lookPitch(.48,-999,true),.85);assert.equal(lookPitch(.48,999,true),.15)});

test('changing an exploration servant form dismisses the old form without bypassing summon recovery',()=>{const h=make();h.level=6;h.mp=M.maxMp(h);A.summonCompanion(h,env);assert.equal(h.companion.form,'guardian');assert(M.selectServant(h,'arcanist'));assert(!h.companion);assert(!A.summonCompanion(h,env).ok);tick(h,17);assert(A.summonCompanion(h,env).ok);assert.equal(h.companion.form,'arcanist');assert(M.validateHero(h))});
