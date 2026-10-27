import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import {questTarget,trackedQuest,trackedTarget,dungeonRoute,directionTo,targetDistance} from '../src/navigation.js';
import {mapBounds,drawAtlas} from '../src/map-view.js';
const make=()=>{const h=M.makeHero({name:'Sylvanas',gender:'female',raceId:'elf',classId:'necromancer',originId:'wanderer'},13254);M.enterRealm(h);return h};
test('main quest markers follow the witness, clue, archive door, scholar, stairs, guardian and artifact',()=>{
 const h=make();let t=trackedTarget(h);assert.equal(t.role,'witness');assert.equal(t.name,h.world.towns[0].npcs.witness.name);assert.equal(t.scene,'realm');assert(targetDistance(h,t)>0);
 M.acceptMain(h);t=trackedTarget(h);assert.equal(t.id,'clue');assert(M.entitiesFor(h).some(e=>e.id===t.id&&e.x===t.x&&e.z===t.z));
 M.collectClue(h);assert.equal(trackedTarget(h).room,'archive');M.changeLocation(h,'interior',0,'archive');assert.equal(trackedTarget(h).role,'scholar');
 M.chooseAlliance(h,'scholars');assert.equal(trackedTarget(h).type,'exit');M.changeLocation(h,'town');assert.equal(trackedTarget(h).id,'gate');M.changeLocation(h,'dungeon');t=trackedTarget(h);assert.equal(t.type,'boss');
 const route=dungeonRoute(h,t);assert(route.length>2);for(const p of route)assert.equal(h.world.towns[0].dungeon.grid[Math.floor(p.z/4)][Math.floor(p.x/4)],0);
 h.campaign.stage='heart';assert.equal(trackedTarget(h).type,'artifact');h.campaign.stage='complete';assert.equal(trackedTarget(h),null);
});
test('side quests target actual resources, living enemies, the courier, coffers, and the correct turn-in NPC in every region',()=>{
 for(let townId=0;townId<9;townId++)for(const source of['healer','smith','stranger','innkeeper']){
  const h=make();M.changeLocation(h,'town',townId);const q=M.discoverRumor(h,source);M.acceptSide(h,q.id);h.settings.trackedQuest=q.id;let t=trackedTarget(h);
  assert.equal(t.townId,townId);assert.equal(trackedQuest(h),q.id);assert(Number.isFinite(t.x)&&Number.isFinite(t.z));assert(M.entitiesFor(h).some(e=>e.id===t.id));
  if(q.kind==='relic'){assert.equal(t.type,'gate');M.changeLocation(h,'dungeon',townId);t=trackedTarget(h);assert.equal(t.type,'chest');const old=t.id;M.resolveEntity(h,old);assert.notEqual(trackedTarget(h).id,old);M.changeLocation(h,'town',townId)}
  if(q.kind==='herbs')assert.equal(t.type,'herbs');if(q.kind==='hunt')assert.equal(t.type,'enemy');if(q.kind==='courier')assert.equal(t.id,'caravan');
  for(let i=0;i<q.goal;i++)M.progressSide(h,q.kind);assert.equal(q.state,'ready');t=trackedTarget(h);const b=M.BUILDINGS.find(b=>b.role===source);
  if(b){assert.equal(t.room,b.id);M.changeLocation(h,'interior',townId,b.id);assert.equal(trackedTarget(h).name,q.giver)}else assert.equal(t.name,q.giver);
  assert(M.turnIn(h,q.id));assert.equal(trackedQuest(h),'main');assert(M.validateHero(JSON.parse(JSON.stringify(h))));
 }
});
test('tracking survives reload and guides out of the wrong room before another-region objectives',()=>{
 const h=make(),q=M.discoverRumor(h,'healer');M.acceptSide(h,q.id);h.settings.trackedQuest=q.id;M.changeLocation(h,'town',8);let copy=JSON.parse(JSON.stringify(h));assert.equal(trackedQuest(copy),q.id);assert.equal(trackedTarget(copy).townId,0);
 M.changeLocation(copy,'interior',8,'smith');assert.equal(trackedTarget(copy).type,'exit');copy.settings.trackedQuest='missing';assert.equal(trackedQuest(copy),'main');
 assert.equal(directionTo({x:0,z:0},{x:0,z:-1}),'N');assert.equal(directionTo({x:0,z:0},{x:1,z:0}),'E');
});
test('geographic maps and dungeon routes render finite coordinates at each supported scale',()=>{
 const h=make();let calls=0;const ctx=new Proxy({canvas:{width:960,height:960}},{get:(obj,key)=>key in obj?obj[key]:(...args)=>{for(const n of args)if(typeof n==='number')assert(Number.isFinite(n),key+' coordinates');calls++},set:(obj,key,value)=>(obj[key]=value,true)});
 for(const scope of['local','town','world']){drawAtlas(ctx,h,scope);const b=mapBounds(h,scope);assert(b.size>0);assert(Number.isFinite(b.x)&&Number.isFinite(b.z))}
 M.changeLocation(h,'dungeon');drawAtlas(ctx,h,'dungeon');assert(calls>10000);
});

test('new and existing hero saves retain valid bust proportions without changing identity or quest state',()=>{
 const h=make(),id=h.id,campaign=h.campaign.id;h.bust=1.45;let copy=JSON.parse(JSON.stringify(h));assert(M.validateHero(copy));M.upgradeHero(copy);assert.equal(copy.bust,1.45);assert.equal(copy.id,id);assert.equal(copy.campaign.id,campaign);
 delete copy.bust;assert(M.validateHero(copy));M.upgradeHero(copy);assert.equal(copy.bust,1);for(const invalid of[NaN,Infinity,-1,5])assert(!M.validateHero({...h,bust:invalid}));
});
