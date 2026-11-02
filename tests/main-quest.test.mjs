import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import * as A from '../src/action-combat.js';
import {MOTIFS} from '../src/content.js';
import {mainState,mainScene,mainDestination,mainHere,mainDungeonSpots,mainProfile,mainReaction,MAIN_FOES} from '../src/main-quest.js';
import {questTarget,dungeonRoute,isTargetHere} from '../src/navigation.js';
import {storyBrief} from '../src/story-guide.js';
import {directorContext,applyAdventure} from '../src/director.js';
import {Realm} from '../src/world.js';
import * as T from '../vendor/three.module.js';

function make(motif='bell'){
 const h=M.makeHero({name:'Raven',raceId:'elf',gender:'female',classId:'necromancer',originId:'scholar'},13254);
 const {id,...data}=MOTIFS.find(m=>m.id===motif);Object.assign(h.campaign,data,{motifId:id});h.level=6;h.hp=M.maxHp(h);h.mp=M.maxMp(h);M.enableMainQuest(h);M.enterRealm(h);return h;
}
function approach(h){
 const d=mainDestination(h);assert(d,'a live quest has a destination');
 if(d.room)M.changeLocation(h,'interior',0,d.room);else if(d.scene==='dungeon')M.changeLocation(h,'dungeon',0);else M.changeLocation(h,'town',0);
 const entity=M.entitiesFor(h).find(e=>e.id===d.id||d.npc&&e.role===d.npc&&!e.mainQuest);assert(entity,mainState(h).node+' has an actual interaction entity');h.position={x:entity.x,z:entity.z+1,yaw:Math.PI};if(h.location.type==='realm')M.syncRealm(h);
 const target=questTarget(h);assert(target,mainState(h).node+' is tracked');assert.equal(target.id,entity.id);assert(mainHere(h,entity));assert(isTargetHere(h,entity));return entity;
}
function choose(h,id,rng=()=>.8){const entity=approach(h),r=M.resolveMainChoice(h,id,entity.id,rng);assert(r.ok,id+': '+r.text);assert(M.validateHero(h),id+' keeps a valid save');return r}
function opening(h){choose(h,'accept');choose(h,'take-clue');choose(h,'read-table')}
function fightHunters(h){
 const foes=M.entitiesFor(h).filter(e=>MAIN_FOES.includes(e.id));assert.equal(foes.length,3);assert(foes.every(e=>e.type==='enemy'));A.prepareActionCombat(h,foes[0],foes.slice(1));for(const c of A.combatants(h))c.hp=0;
 const r=A.advanceAction(h,.05,{rng:()=>.8,canMove:()=>true,lineOfSight:()=>true});assert.equal(r.outcome,'victory');assert.equal(mainState(h).encounter,'cleared');assert.equal(mainState(h).rescue,'waiting');assert(M.validateHero(h));
}
function investigation(h,route='rescue',method='bribe-hunters'){
 opening(h);choose(h,route==='rescue'?'rescue-first':'records-first');
 if(route==='rescue'){const r=choose(h,method,()=>.01);if(r.fight)fightHunters(h);choose(h,'free-captive')}else choose(h,'trace-record');
 choose(h,'expose');choose(h,'scholars');
}
function guardian(h,seal){
 choose(h,'read-memorial');choose(h,seal);assert.equal(mainState(h).node,'guardian');const boss=approach(h);assert.equal(boss.type,'boss');assert(A.prepareActionCombat(h,boss));h.combat.hp=0;
 assert.equal(A.advanceAction(h,.05,{rng:()=>.8}).outcome,'victory');assert.equal(h.campaign.stage,'heart');assert.equal(mainState(h).node,'artifact');assert(M.validateHero(h));
}

test('all six authored mysteries support both investigation routes, all three endings and an earned homecoming',()=>{
 for(const motif of MOTIFS)for(const route of['rescue','records'])for(const ending of['preserve','destroy','bind']){
  let h=make(motif.id);investigation(h,route);h=JSON.parse(JSON.stringify(h));assert(M.validateHero(h));guardian(h,route==='rescue'?'name-seal':'ritual-seal');
  const before={completed:h.completed,legacy:h.legacy.length,gold:h.gold};choose(h,ending);assert.equal(mainState(h).node,'homecoming');assert.equal(h.campaign.stage,'heart');assert.equal(h.completed,before.completed);assert.equal(h.legacy.length,before.legacy);assert.equal(h.gold,before.gold);assert(!M.finishCampaign(h,ending),'the crypt is not the homecoming');
  const epilogue=mainScene(h);assert(epilogue.text.includes(mainProfile(h).victim));assert(epilogue.text.includes(h.world.towns[0].npcs.witness.name));h=JSON.parse(JSON.stringify(h));const reward=choose(h,'close-case');assert(reward.complete&&reward.item);assert.equal(h.completed,before.completed+1);assert.equal(h.legacy.length,before.legacy+1);assert.equal(h.legacy.at(-1).main.route,route);assert.equal(h.campaign.stage,'complete');assert.equal(questTarget(h),null);assert(mainReaction(h,'witness'));
  const paid=h.gold;assert(!M.resolveMainChoice(h,'close-case',h.world.towns[0].npcs.witness.id).ok);assert.equal(h.gold,paid);assert(!M.finishCampaign(h,ending));assert(M.validateHero(h));
 }
});

test('rescue is a real pack encounter with remembered partial kills, a separate freeing action and a returned NPC',()=>{
 const h=make();opening(h);choose(h,'rescue-first');approach(h);assert.equal(M.entitiesFor(h).filter(e=>MAIN_FOES.includes(e.id)&&e.type==='npc').length,3);
 assert(choose(h,'fight-hunters').fight);const foes=M.entitiesFor(h).filter(e=>MAIN_FOES.includes(e.id));A.prepareActionCombat(h,foes[0],foes.slice(1));h.combat.hp=0;A.advanceAction(h,.05,{rng:()=>.8});assert.equal(h.kills,1);assert.equal(mainState(h).encounter,'active');A.fleeAction(h);
 const copy=JSON.parse(JSON.stringify(h));assert(M.validateHero(copy));assert.equal(M.entitiesFor(copy).filter(e=>MAIN_FOES.includes(e.id)).length,2);assert.notEqual(mainDestination(copy).id,foes[0].id);
 for(const e of M.entitiesFor(copy).filter(e=>MAIN_FOES.includes(e.id))){M.startCombat(copy,e);copy.combat.hp=0;M.winCombat(copy,'',()=>.8)}assert.equal(mainState(copy).encounter,'cleared');assert.equal(mainState(copy).rescue,'waiting');choose(copy,'free-captive');assert.equal(mainState(copy).rescue,'saved');M.changeLocation(copy,'town');assert(M.entitiesFor(copy).some(e=>e.id==='main-returned'&&e.name===mainProfile(copy).victim));
});

test('failed stealth and incomplete lore readings have a playable forward route with no repeatable roll',()=>{
 const sneak=make();opening(sneak);choose(sneak,'rescue-first');assert(choose(sneak,'slip-the-ward',()=>0).fight);assert(!M.resolveMainChoice(sneak,'slip-the-ward','main-captive',()=>.99).ok);fightHunters(sneak);choose(sneak,'free-captive');
 const reader=make();opening(reader);choose(reader,'records-first');choose(reader,'decode-record',()=>0);assert.equal(mainState(reader).lead,'fragment');choose(reader,'mercy');choose(reader,'wardens');choose(reader,'read-memorial');choose(reader,'ritual-seal',()=>0);assert.equal(mainState(reader).seal,'force');assert.equal(mainState(reader).node,'guardian');assert(M.validateHero(reader));
});

test('the full records route and quiet seal change the actual guardian, while forced passage remains possible at one health',()=>{
 const quiet=make(),loud=make();investigation(quiet,'records');investigation(loud,'records');choose(quiet,'read-memorial');choose(loud,'read-memorial');
 assert(!M.entitiesFor(quiet).some(e=>e.type==='boss'));assert(!M.startCombat(quiet,{id:'boss',type:'boss',kind:'knight'}));assert(!M.finishCampaign(quiet,'destroy'));
 choose(quiet,'ritual-seal');loud.hp=1;choose(loud,'force-seal');assert.equal(loud.hp,1);for(const h of[quiet,loud])assert(M.startCombat(h,approach(h)));
 assert(quiet.combat.attack<loud.combat.attack);assert(quiet.combat.hp<loud.combat.hp);assert(M.validateHero(loud));
});

test('ending costs and benefits are real and the unbound threat exists only after destroying the mechanism',()=>{
 for(const ending of['preserve','destroy','bind']){
  const h=make();investigation(h,'records');guardian(h,'ritual-seal');choose(h,ending);assert.equal(mainState(h).rescue,'saved');choose(h,'close-case');const base=structuredClone(h);delete base.campaign.main;
  if(ending==='preserve')assert.equal(M.armor(h)-M.armor(base),2);
  if(ending==='bind'){assert.equal(M.maxMp(base)-M.maxMp(h),4);assert.equal((M.effects(h).spell||0)-(M.effects(base).spell||0),3);assert(h.mp<=M.maxMp(h))}
  M.changeLocation(h,'wilds');assert.equal(M.entitiesFor(h).some(e=>e.id==='main-unbound'),ending==='destroy');
 }
});

test('a fragmented record and forced seal leave a real final cost, while the complete ritual can restore the captive safely',()=>{
 const h=make();opening(h);choose(h,'records-first');choose(h,'decode-record',()=>0);choose(h,'mercy');choose(h,'wardens');guardian(h,'force-seal');assert(mainScene(h).choices.find(c=>c.id==='preserve').detail.includes('remains beyond'));choose(h,'preserve');assert.equal(mainState(h).rescue,'lost');choose(h,'close-case');assert(!M.entitiesFor(h).some(e=>e.id==='main-returned'));assert(mainReaction(h,'witness').includes('who is missing'));
});

test('quest destinations survive wrong regions, rooms, branch changes and the return from the crypt',()=>{
 const h=make();opening(h);choose(h,'records-first');assert.equal(mainDestination(h).id,'site-2');M.changeLocation(h,'interior',8,'smith');let target=questTarget(h);assert.equal(target.type,'exit');assert.equal(target.townId,0);
 M.changeLocation(h,'town',8);target=questTarget(h);assert.equal(target.townId,0);assert(!M.entitiesFor(h).some(e=>isTargetHere(h,e,target)));
 choose(h,'trace-record');assert.equal(mainDestination(h).room,'chapel');choose(h,'expose');assert.equal(mainDestination(h).room,'archive');choose(h,'scholars');M.changeLocation(h,'dungeon');target=questTarget(h);assert.equal(target.id,'main-memorial');const path=dungeonRoute(h,target);assert(path.length>1);for(const p of path)assert.equal(h.world.towns[0].dungeon.grid[Math.floor(p.z/4)][Math.floor(p.x/4)],0);
 guardian(h,'ritual-seal');choose(h,'destroy');target=questTarget(h);assert.equal(target.type,'exit');M.changeLocation(h,'town');target=questTarget(h);assert.equal(target.role,'witness');assert(target.instruction.includes('Return'));
});

test('dungeon story anchors are reachable and do not occupy existing encounter anchors across many seeds',()=>{
 for(let seed=0;seed<80;seed++){
  const h=make();h.world.towns[0].dungeon=M.generateDungeon(seed);const d=h.world.towns[0].dungeon,spots=mainDungeonSpots(h);
  for(const p of Object.values(spots)){assert.equal(d.grid[Math.floor(p.z/4)][Math.floor(p.x/4)],0);assert(!d.entities.some(e=>Math.hypot(e.x-p.x,e.z-p.z)<2))}
  assert.notDeepEqual(spots.memorial,spots.seal);
 }
});

test('the real world can render and approach the captive, patrol, returned person and crypt discoveries',()=>{
 const previous=globalThis.document,ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};
 const h=make(),world=Object.assign(Object.create(Realm.prototype),{hero:h,scene:new T.Scene(),materials:[],textures:[],quality:'low'});
 try{
  opening(h);choose(h,'rescue-first');approach(h);world.build();for(const e of world.entities.filter(e=>e.mainQuest))assert(world.canMove(e.x,e.z),e.name+' is reachable');
  choose(h,'fight-hunters');world.refresh();for(const e of world.entities.filter(e=>MAIN_FOES.includes(e.id))){assert.equal(e.type,'enemy');assert(world.canMove(e.x,e.z),e.name+' can stand on the road')}
  fightHunters(h);choose(h,'free-captive');M.changeLocation(h,'town');world.build();const returned=world.entities.find(e=>e.id==='main-returned');assert(returned);assert(world.canMove(returned.x,returned.z));
  choose(h,'expose');choose(h,'scholars');approach(h);world.build();const memorial=world.entities.find(e=>e.id==='main-memorial');assert(memorial);assert(world.canMove(memorial.x,memorial.z));choose(h,'read-memorial');world.refresh();const seal=world.entities.find(e=>e.id==='main-seal');assert(seal);assert(world.canMove(seal.x,seal.z));world.root.traverse(o=>{if(o.isMesh)assert(o.geometry.attributes.position.array.every(Number.isFinite))});
 }finally{world.clearScene();globalThis.document=previous}
});

test('existing saves join at their current story phase, retain inventory and resume an ongoing guardian battle',()=>{
 for(const stage of['arrival','trail','counsel','descent','heart','complete']){
  const h=M.makeHero({name:'Existing hero',classId:'ranger',raceId:'human'},99);h.campaign.stage=stage;if(stage==='complete')h.campaign.ending='destroy';const before={id:h.id,campaign:h.campaign.id,gold:h.gold,items:structuredClone(h.items),equipment:structuredClone(h.equipment),legacy:structuredClone(h.legacy)};
  M.enableMainQuest(h);assert(M.validateHero(h));assert.equal(h.campaign.stage,stage);for(const key of['id','gold','items','equipment','legacy'])assert.deepEqual(h[key],before[key]);assert.equal(h.campaign.id,before.campaign);assert.equal(mainState(h).node,{arrival:'witness',trail:'road',counsel:'archive',descent:'memorial',heart:'artifact',complete:'complete'}[stage]);M.enableMainQuest(h);assert(M.validateHero(h));
 }
 const h=M.makeHero({classId:'ranger',raceId:'human'},99);h.campaign.stage='descent';M.changeLocation(h,'dungeon');const boss=M.entitiesFor(h).find(e=>e.type==='boss');M.startCombat(h,boss);M.enableMainQuest(h);assert.equal(mainState(h).node,'guardian');assert(mainState(h).warned);assert(M.entitiesFor(h).some(e=>e.type==='boss'));assert(M.validateHero(h));
});

test('new campaigns clear temporary story effects and preserve the hero’s completed decision record',()=>{
 const h=make();investigation(h,'rescue');guardian(h,'name-seal');choose(h,'bind');choose(h,'close-case');const id=h.id,gear=structuredClone(h.equipment),count=h.completed,old=h.campaign.id,mana=M.maxMp(h);M.newCampaign(h,2222);M.enableMainQuest(h);assert.equal(h.id,id);assert.deepEqual(h.equipment,gear);assert.equal(h.completed,count);assert.notEqual(h.campaign.id,old);assert.equal(mainState(h).node,'witness');assert(M.maxMp(h)>mana);assert.equal(h.legacy.at(-1).main.route,'rescue');assert(M.validateHero(h));
});

test('completed legacy campaigns retain their exact ending and do not acquire new build costs or rewards',()=>{
 for(const ending of['preserve','destroy','bind']){
  const h=M.makeHero({classId:'necromancer',raceId:'elf'},99);h.campaign.stage='heart';M.finishCampaign(h,ending);const text=h.campaign[ending],mana=M.maxMp(h),armor=M.armor(h),spell=M.effects(h).spell||0;
  M.enableMainQuest(h);assert.equal(mainScene(h).text,text);assert.equal(M.maxMp(h),mana);assert.equal(M.armor(h),armor);assert.equal(M.effects(h).spell||0,spell);assert(M.validateHero(h));
 }
});

test('invalid main-story choices, wrong locations, duplicate payment and corrupt story states are rejected',()=>{
 const h=make();const e=approach(h);assert(!M.resolveMainChoice(h,'bind',e.id).ok);M.changeLocation(h,'town',8);assert(!M.resolveMainChoice(h,'accept',h.world.towns[8].npcs.witness.id).ok);opening(h);choose(h,'rescue-first');h.gold=0;const captive=approach(h),xp=h.xp;assert(!M.resolveMainChoice(h,'bribe-hunters',captive.id).ok);assert.equal(h.xp,xp);assert.equal(mainState(h).encounter,'none');
 for(const change of[s=>s.node='missing',s=>s.choice='bind',s=>s.evidence.push('evil'),s=>s.journal.push({id:'bad',title:'bad',text:'x'.repeat(5001)}),s=>s.rescue='undead']){const bad=structuredClone(h);change(bad.campaign.main);assert(!M.validateHero(bad))}for(const value of[false,3,[],{}])assert(!M.validateHero({...h,campaign:{...h.campaign,main:value}}));
});

test('the journal and live director context use the actual route, rescue and gathered evidence',()=>{
 const h=make('lake');investigation(h,'records');const brief=storyBrief(h),context=directorContext(h);assert(brief.chapter.includes('Act III'));assert.equal(brief.steps.length,12);assert(brief.notes.some(n=>n.text.includes(mainProfile(h).record)));assert.equal(context.campaign.main.route,'records');assert.equal(context.campaign.main.lead,'complete');assert(context.campaign.main.evidence.includes('record'));assert.equal(context.campaign.main.journal.length,4);
});

test('imported campaign packs keep their own premise and receive the neutral investigator story instead of a wrong motif',()=>{
 const h=make();const pack=Object.fromEntries(['title','artifact','enemy','witness','clue','revelation','demand','preserve','destroy','bind'].map(k=>[k,'A custom '+k]));assert(applyAdventure(h,pack));assert.equal(mainProfile(h).victim,'Ilyra');assert(!mainScene(h).text.includes('Memory Bell'));opening(h);choose(h,'records-first');assert(mainScene(h).text.includes('counter-ritual'));assert(M.validateHero(h));
});

test('an imported story ending stays stable through the homecoming and does not append its consequences repeatedly',()=>{
 const h=make();const pack=Object.fromEntries(['title','artifact','enemy','witness','clue','revelation','demand','preserve','destroy','bind'].map(k=>[k,'A custom '+k]));assert(applyAdventure(h,pack));investigation(h,'records');guardian(h,'ritual-seal');choose(h,'bind');const first=h.campaign.bind;assert.equal(mainScene(h).text.split('A custom bind').length-1,1);assert.equal(mainScene(h).text.split('Ilyra returns').length-1,1);choose(h,'close-case');assert.equal(h.campaign.bind,first);assert.equal(mainScene(h).text,first);assert(M.validateHero(h));
});
