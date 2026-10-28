import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import * as A from '../src/action-combat.js';
import {FACTION_STORIES,factionQuest,factionNode,factionChoices,factionHere,factionSite,factionCombatIds,validFactionQuests} from '../src/faction-quests.js';
import {trackedQuest,trackedTarget,questMarkers} from '../src/navigation.js';
import {realmSites} from '../src/atlas.js';
import {reactionTo} from '../src/progression.js';
const make=(seed=13254)=>{const h=M.makeHero({name:'Sylvanas',classId:'necromancer',raceId:'elf',originId:'scholar'},seed);M.enterRealm(h);h.level=10;h.hp=M.maxHp(h);h.mp=M.maxMp(h);h.gold=1000;return h};
function giver(h,id){const d=FACTION_STORIES[id];M.changeLocation(h,d.room?'interior':'town',h.location.townId,d.room);return M.entitiesFor(h).find(e=>e.role===d.giver)}
function atNode(h,id){const q=factionQuest(h,id),n=factionNode(h,id);if(n.npc){M.changeLocation(h,FACTION_STORIES[id].room?'interior':'town',q.townId,FACTION_STORIES[id].room)}else{M.changeLocation(h,'town',q.townId);const site=realmSites(h.world.towns[q.townId]).find(s=>s.id===factionSite(h,id));Object.assign(h.position,{x:site.x,z:site.z});M.syncRealm(h)}return M.entitiesFor(h).find(e=>factionHere(h,id,e))}
function winBlockade(h,id){for(const key of factionCombatIds(id)){const e=M.entitiesFor(h).find(e=>e.id===key);assert(e);assert(M.startCombat(h,e));h.combat.hp=1;const r=M.combatTurn(h,'attack',()=>.99);assert.equal(r.outcome,'victory')}}
test('all three faction graphs have complete playable success/failure branches and idempotent endings',()=>{
 for(const id of Object.keys(FACTION_STORIES)){const h=make();giver(h,id);assert(M.startFaction(h,id));assert(!M.startFaction(h,id));const endings=new Set(),paths=[];
 function walk(state,depth=0){assert(depth<10);assert(M.validateHero(state));const q=factionQuest(state,id),n=factionNode(state,id);if(!n){endings.add(q.ending);const before=JSON.stringify(state);assert(!M.resolveFaction(state,id,'anything','anything').ok);assert.equal(JSON.stringify(state),before);paths.push(q.decisions);return}if(n.combat){atNode(state,id);winBlockade(state,id);assert.equal(factionQuest(state,id).node,'report');walk(state,depth+1);return}
  for(const c of factionChoices(state,id))for(const roll of c.stat?[0,.99]:[.99]){const next=structuredClone(state),e=atNode(next,id);assert(e,id+': '+q.node);const r=M.resolveFaction(next,id,c.id,e.id,()=>roll);assert(r.ok,id+': '+c.id);walk(next,depth+1)}
 }
 walk(h);assert.deepEqual([...endings].sort(),Object.keys(FACTION_STORIES[id].endings).sort());assert(paths.length>=3);
 }
});
test('quest location, resource costs, failed checks and corrupted imported graphs are enforced',()=>{
 const h=make();assert(!M.startFaction(h,'wardens'));giver(h,'veil');assert(M.startFaction(h,'veil'));const before=JSON.stringify(h);assert(!M.resolveFaction(h,'veil','blood','stranger').ok);assert.equal(JSON.stringify(h),before);const e=atNode(h,'veil');h.hp=6;assert(!M.resolveFaction(h,'veil','blood',e.id).ok);h.hp=M.maxHp(h);const hp=h.hp;assert(M.resolveFaction(h,'veil','blood',e.id).ok);assert.equal(h.hp,hp-6);assert(M.validateHero(h));
 for(const mutate of[x=>x.world.factionQuests.veil.node='missing',x=>x.world.factionQuests.veil.node='__proto__',x=>x.world.factionQuests.veil.townId=100,x=>x.world.factionQuests.veil.decisions.push({node:'mine',choice:'execute',success:true})]){const c=structuredClone(h);mutate(c);assert(!validFactionQuests(c));assert(!M.validateHero(c))}
});
test('faction tracking routes between real NPCs, buildings and wilderness destinations and survives reload',()=>{
 const h=make();giver(h,'wardens');M.startFaction(h,'wardens');assert.equal(trackedQuest(h),'faction-wardens');const first=trackedTarget(h);assert(first.instruction.startsWith('Leave'));M.changeLocation(h,'town');const camp=trackedTarget(h);assert.equal(camp.id,'faction-wardens-contact');assert(questMarkers(h).some(q=>q.questId==='faction-wardens'));const e=atNode(h,'wardens');M.resolveFaction(h,'wardens','aid',e.id);assert.equal(trackedTarget(h).id,'faction-wardens-contact');assert(trackedTarget(h).instruction.includes('Watchtower'));assert.deepEqual(trackedTarget(JSON.parse(JSON.stringify(h))),trackedTarget(h));
});
test('completed faction paths change the region, actual combat effects and NPC memory',()=>{
 const h=make();giver(h,'wardens');M.startFaction(h,'wardens');let e=atNode(h,'wardens');M.resolveFaction(h,'wardens','aid',e.id);e=atNode(h,'wardens');M.resolveFaction(h,'wardens','truce',e.id);e=atNode(h,'wardens');const armor=M.armor(h);M.resolveFaction(h,'wardens','expose',e.id);assert.equal(M.armor(h),armor+1);M.changeLocation(h,'town');assert(!M.entitiesFor(h).some(e=>e.id==='road-bandit'));assert.equal(M.entitiesFor(h).filter(e=>e.id.startsWith('watch-station-')).length,2);assert(reactionTo(h,'guard').includes('lantern station'));assert.equal(trackedQuest(h),'main');assert(M.validateHero(h));
 const s=make();giver(s,'scholars');M.startFaction(s,'scholars');for(const choice of['rubbings','chart','publish']){const entity=atNode(s,'scholars');assert(M.resolveFaction(s,'scholars',choice,entity.id).ok)}assert.equal(s.world.visits['dungeon-0'].discovered.length,289);assert.equal(M.effects(s).manaRegen,1);const saved=JSON.parse(JSON.stringify(s));assert(M.validateHero(saved));assert.equal(saved.world.factionQuests.scholars.ending,'published');M.newCampaign(saved,84);assert(!saved.world.factionQuests);assert(M.validateHero(saved));
});

test('guild, lodge and barracks discoveries have distinct one-time gameplay rewards',()=>{
 const h=make();for(const[homeId,type]of[[7,'guild'],[13,'lodge'],[19,'barracks']]){M.changeLocation(h,'interior',0,'home',homeId);const result=M.exploreRoom(h);assert(result.ok);const after=JSON.stringify(h);assert(!M.exploreRoom(h).ok);assert.equal(JSON.stringify(h),after);if(type==='guild')assert(h.world.exploration.charted.includes(0));if(type==='lodge')assert(h.items.some(i=>i.type==='mana'));if(type==='barracks')assert(h.items.some(i=>i.type==='potion'));assert(M.validateHero(h))}
 M.changeLocation(h,'town');const site=realmSites(h.world.towns[0]).find(s=>s.id==='site-0');h.position={x:site.x,z:site.z};M.syncRealm(h);const result=M.surveyLandmark(h,'site-0','study',()=>.5);assert(result.text.includes('against 9.'));
});
