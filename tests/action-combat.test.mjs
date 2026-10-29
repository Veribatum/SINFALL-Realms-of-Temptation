import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import * as A from '../src/action-combat.js';
import {skeletonModel} from '../src/combat-scene.js';
import {storyBrief} from '../src/story-guide.js';
const make=(classId='necromancer',level=2)=>{const h=M.makeHero({name:'Sylvanas',classId,raceId:'elf',gender:'female',originId:'wanderer'},13254);h.level=level;h.hp=M.maxHp(h);h.mp=M.maxMp(h);M.enterRealm(h);return h};
const enemy=h=>({id:'road-enemy',type:'enemy',kind:'wolf',name:'Gloom Hound',x:h.position.x+2,z:h.position.z});
const env={rng:()=>.5,lineOfSight:()=>true,canMove:()=>true};
function advance(h,seconds,options=env){let result,events=[];for(let i=0;i<Math.ceil(seconds/.05);i++){result=A.advanceAction(h,.05,options);events.push(...result.events);if(result.outcome)return{...result,events}}return{...result,events}}
test('action attacks respect distance, walls, mana and cooldown without spending resources on invalid inputs',()=>{
 const h=make();assert(A.prepareActionCombat(h,enemy(h)));h.combat.x+=20;const before=h.mp;assert(!A.performAction(h,'ability',env).ok);assert.equal(h.mp,before);h.combat.x-=20;
 assert(!A.performAction(h,'ability',{...env,lineOfSight:()=>false}).ok);assert.equal(h.mp,before);assert(A.performAction(h,'ability',env).ok);assert.equal(h.mp,before-M.abilityCost(h));const spent=h.mp;assert(!A.performAction(h,'ability',env).ok);assert.equal(h.mp,spent);assert(M.validateHero(h));
});
test('damage arrives with the action impact and Soul Siphon visibly restores health',()=>{
 const h=make();h.hp=5;A.prepareActionCombat(h,enemy(h));const before=h.combat.hp;assert(A.performAction(h,'ability',env).ok);assert.equal(h.combat.hp,before);let r=advance(h,.1);assert.equal(h.combat.hp,before);r=advance(h,.2);assert(h.combat.hp<before);assert.equal(h.hp,15);assert(r.events.some(e=>e.kind==='hit'));assert(M.validateHero(h));
});
test('enemies wind up and cause real health loss without waiting for another player action',()=>{
 const h=make();A.prepareActionCombat(h,enemy(h));const hp=h.hp;advance(h,1.1);assert(h.combat.windup);assert.equal(h.hp,hp);const result=advance(h,.8);assert(h.hp<hp);assert(h.combat.log[0].includes('health'));assert(result.events.some(e=>e.kind==='hurt')||h.combat.round>0);
});
test('a timed guard reduces damage, a timed dodge avoids it, and moving out of reach avoids the hit',()=>{
 function prepared(){const h=make();A.prepareActionCombat(h,enemy(h));h.combat.windup={intent:'heavy',left:.2,total:1.05,target:'hero'};return h}
 const plain=prepared(),guard=prepared(),dodge=prepared(),moved=prepared(),hp=plain.hp;A.performAction(guard,'guard',env);A.performAction(dodge,'dodge',env);moved.position.x-=6;
 advance(plain,.3);advance(guard,.3);advance(dodge,.3);advance(moved,.3);assert(guard.hp>plain.hp);assert.equal(dodge.hp,hp);assert.equal(moved.hp,hp);
});
test('Raise Skeleton unlocks at level 2, costs mana, fights, takes damage, follows and expires',()=>{
 const low=make('necromancer',1);A.prepareActionCombat(low,enemy(low));const mp=low.mp;assert(!A.performAction(low,'summon',env).ok);assert.equal(low.mp,mp);
 const h=make();A.prepareActionCombat(h,enemy(h));const before=h.mp,foe=h.combat.hp;assert(A.performAction(h,'summon',env).ok);assert.equal(h.mp,before-10);assert(h.companion);const hp=h.hp;assert(!A.performAction(h,'summon',env).ok);advance(h,2);assert(h.combat.hp<foe);assert(h.companion.hp<h.companion.maxHp);assert.equal(h.hp,hp,'the skeleton draws the blow');assert(M.validateHero(h));
 h.combat=null;h.position.x+=6;const x=h.companion.x;advance(h,1);assert(h.companion.x>x);h.companion.remaining=.1;advance(h,.2);assert(h.companion,'exploration does not consume combat lifetime');A.prepareActionCombat(h,enemy(h));advance(h,.2);assert.equal(h.companion,undefined);
});
test('summoning and scene changes choose a safe companion position',()=>{
 const h=make();A.prepareActionCombat(h,enemy(h));const blocked={...env,canMove:(x,z)=>x<=h.position.x};A.performAction(h,'summon',blocked);assert(h.companion.x<=h.position.x);h.combat=null;M.changeLocation(h,'interior',0,'archive');A.advanceAction(h,.05,blocked);assert(h.companion.x<=h.position.x);assert.equal(h.companion.scene,M.locationId(h));assert(M.validateHero(h));
});
test('action victories preserve quest progression and rewards cannot be paid twice',()=>{
 const h=make();h.campaign.stage='descent';M.changeLocation(h,'dungeon');const boss=M.entitiesFor(h).find(e=>e.type==='boss');boss.x=h.position.x+2;boss.z=h.position.z;A.prepareActionCombat(h,boss);h.combat.hp=1;A.performAction(h,'attack',env);const result=advance(h,.5),gold=h.gold,kills=h.kills;assert.equal(result.outcome,'victory');assert.equal(h.campaign.stage,'heart');assert.equal(h.combat,null);advance(h,2);assert.equal(h.gold,gold);assert.equal(h.kills,kills);assert(!A.prepareActionCombat(h,boss));assert(M.validateHero(h));
});
test('action defeat, withdrawal and crossing a region do not corrupt saves or grant a win',()=>{
 const h=make();A.prepareActionCombat(h,enemy(h));h.hp=1;h.combat.windup={intent:'heavy',left:.01,total:1,target:'hero'};const r=advance(h,.05);assert.equal(r.outcome,'defeat');assert(h.hp>0);assert.equal(h.combat,null);assert(M.validateHero(h));
 const b=make();A.prepareActionCombat(b,enemy(b));const gold=b.gold;assert.equal(A.fleeAction(b).outcome,'fled');assert.equal(b.gold,gold);assert.equal(b.kills,0);
 A.prepareActionCombat(b,enemy(b));M.changeLocation(b,'town',8);assert.equal(A.advanceAction(b,.05,env).outcome,'fled');assert.equal(b.kills,0);
});
test('ongoing action fights, projectiles and a summoned ally survive save/reload; corrupt state is rejected',()=>{
 const h=make();A.prepareActionCombat(h,enemy(h));A.performAction(h,'summon',env);A.performAction(h,'ability',env);advance(h,.05);const copy=JSON.parse(JSON.stringify(h));assert(M.validateHero(copy));const hp=copy.hp,clock=copy.combat.clock;A.resumeActionCombat(copy);assert.equal(copy.hp,hp);assert.equal(copy.combat.clock,clock);advance(copy,.1);assert(M.validateHero(copy));copy.combat.x=NaN;assert(!M.validateHero(copy));
 const old=make();M.startCombat(old,enemy(old));A.resumeActionCombat(old);assert.equal(old.combat.mode,'action');assert(M.validateHero(old));
});
test('all classes can use action combat without invalid health, mana, cooldowns or progression',()=>{
 for(const classId of['ranger','spellbinder','shadowblade','templar','necromancer','berserker','duelist','druid','bard','oathbreaker']){const h=make(classId);A.prepareActionCombat(h,enemy(h));for(let frame=0;frame<600&&h.combat;frame++){if(frame%18===0)A.performAction(h,'attack',env);if(frame%70===0&&h.mp>=M.abilityCost(h))A.performAction(h,'ability',env);A.advanceAction(h,.05,env);assert(h.hp>=0&&h.hp<=M.maxHp(h));assert(h.mp>=0&&h.mp<=M.maxMp(h));assert(M.validateHero(h),classId)}assert.equal(h.combat,null,classId+' finishes the encounter')}
});
test('the raised skeleton is an actual articulated scene model',()=>{const g=skeletonModel();assert.equal(g.name,'Raised skeleton');let meshes=0;g.traverse(o=>{if(o.isMesh){meshes++;assert(o.geometry.attributes.position.array.every(Number.isFinite))}});assert(meshes>30);for(const joint of['armL','armR','legL','legR'])assert(g.userData.joints[joint]);});
test('story guidance distinguishes evidence, archive, guardian and ending while preserving the actual campaign',()=>{const h=make();assert(storyBrief(h).recap.includes(h.campaign.witness));M.acceptMain(h);assert.equal(storyBrief(h).index,1);M.collectClue(h);assert(storyBrief(h).purpose.includes('archive'));assert(storyBrief(h).recap.includes(h.campaign.clue));h.campaign.stage='heart';assert(storyBrief(h).next.includes(h.campaign.artifact));assert.equal(storyBrief(h).index,4)});
