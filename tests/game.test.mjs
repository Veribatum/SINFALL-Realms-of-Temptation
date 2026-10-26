import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import {CLASSES,MOTIFS} from '../src/content.js';
import * as AI from '../src/director.js';
const make=(seed=123)=>M.makeHero({name:'Raven',raceId:'elf',classId:'ranger',originId:'scholar'},seed);

test('200 generated undercrypts have reachable objectives and encounters',()=>{
 for(let seed=0;seed<200;seed++){
  const d=M.generateDungeon(seed),seen=new Set(['1,1']),q=[[1,1]];
  for(let i=0;i<q.length;i++){const[x,y]=q[i];for(const[dx,dy]of[[0,1],[1,0],[-1,0],[0,-1]]){const a=x+dx,b=y+dy,key=a+','+b;if(d.grid[b]?.[a]===0&&!seen.has(key)){seen.add(key);q.push([a,b])}}}
  assert(seen.has(d.end.join(',')));for(const e of d.entities)assert(seen.has(Math.floor(e.x/4)+','+Math.floor(e.z/4)));
  assert.equal(d.grid[0].filter(v=>v===0).length,0);assert.equal(d.grid[16].filter(v=>v===0).length,0);
 }
});
test('seeds reproduce worlds while fresh adventures vary',()=>{assert.deepEqual(M.generateDungeon(42),M.generateDungeon(42));assert.notDeepEqual(M.generateDungeon(42).grid,M.generateDungeon(43).grid);const names=new Set(Array.from({length:40},(_,i)=>make(i).world.towns[0].name));assert(names.size>20)});
test('the main quest requires evidence, an alliance, and a guardian',()=>{
 const h=make();assert.equal(M.finishCampaign(h,'bind'),false);assert.equal(M.collectClue(h),false);assert.equal(M.chooseAlliance(h,'scholars'),false);
 assert(M.acceptMain(h));M.changeLocation(h,'wilds',0);assert(M.collectClue(h));M.changeLocation(h,'town',0);assert(M.chooseAlliance(h,'scholars'));assert.equal(h.campaign.stage,'descent');
 M.changeLocation(h,'dungeon',0);h.level=18;h.hp=M.maxHp(h);h.mp=M.maxMp(h);const boss=M.entitiesFor(h).find(e=>e.type==='boss');assert(boss);M.startCombat(h,boss);h.combat.hp=1;M.combatTurn(h,'attack',()=>.95);assert.equal(h.campaign.stage,'heart');assert(M.entitiesFor(h).some(e=>e.type==='artifact'));
 const item=M.finishCampaign(h,'preserve');assert(item);assert.equal(h.completed,1);assert.equal(h.legacy.length,1);assert.equal(h.campaign.stage,'complete');assert.equal(M.finishCampaign(h,'destroy'),false);
 const id=h.id,level=h.level,gold=h.gold,equipment=structuredClone(h.equipment),prior=h.campaign.motifId;M.newCampaign(h,98765);assert.equal(h.id,id);assert.equal(h.level,level);assert.equal(h.gold,gold);assert.deepEqual(h.equipment,equipment);assert.notEqual(h.campaign.motifId,prior);assert.equal(h.legacy.length,1);assert(M.validateHero(h));
});
test('all six campaigns are used before repeating motifs',()=>{const h=make(),seen=new Set();for(let i=0;i<MOTIFS.length;i++){seen.add(h.campaign.motifId);h.campaign.stage='heart';M.finishCampaign(h,'destroy');M.newCampaign(h,i+100)}assert.equal(seen.size,MOTIFS.length)});
test('different alliances and endings have real consequences',()=>{
 const h=make();h.campaign.stage='counsel';const base=M.maxHp(h),gold=h.gold;assert(M.chooseAlliance(h,'veil'));assert.equal(M.maxHp(h),base+5);assert.equal(h.gold,gold-25);assert.equal(h.factions.veil,2);
 const w=make();w.campaign.stage='counsel';M.chooseAlliance(w,'wardens');assert(w.items.some(i=>i.name==='Warden’s Brigandine'));const s=make();s.campaign.stage='counsel';M.chooseAlliance(s,'scholars');assert.equal(s.campaign.flags.weakenBoss,4);
 for(const ending of['preserve','destroy','bind']){const a=make();a.campaign.stage='heart';const item=M.finishCampaign(a,ending);assert.equal(item.type,ending==='preserve'?'armor':ending==='bind'?'trinket':'weapon')}
});
test('armor reduces incoming damage, ability costs and talents apply',()=>{
 const a=make(),b=structuredClone(a);M.startCombat(a,{id:'x',type:'enemy',kind:'bandit'});M.startCombat(b,{id:'x',type:'enemy',kind:'bandit'});b.equipment.armor.power=8;
 const beforeA=a.hp,beforeB=b.hp;M.combatTurn(a,'guard',()=>.5);M.combatTurn(b,'guard',()=>.5);assert(beforeB-b.hp<=beforeA-a.hp);
 const h=make();M.startCombat(h,{id:'x',type:'enemy',kind:'wolf'});const before=h.hp,mp=h.mp;M.combatTurn(h,'ability',()=>.95);assert.equal(h.hp,before);assert.equal(h.mp,mp-M.abilityCost(h));
 const fresh=make();const stat=M.stats(fresh).finesse;assert(M.unlock(fresh,'keen'));assert.equal(M.stats(fresh).finesse,stat+2);assert.equal(M.unlock(fresh,'keen'),false);assert.equal(M.unlock(fresh,'phantom'),false);
});
test('each class can fight without corrupting vitality, mana, or saves',()=>{
 for(const c of CLASSES){const h=M.makeHero({name:c.name,classId:c.id,raceId:'human',originId:'wanderer'},3);M.startCombat(h,{id:'enemy',type:'enemy',kind:'wolf'});for(let i=0;i<40&&h.combat;i++){M.combatTurn(h,i%3===0&&h.mp>=M.abilityCost(h)?'ability':i%4===1?'guard':'attack',()=>.7);assert(h.hp>=0&&h.hp<=M.maxHp(h));assert(h.mp>=0&&h.mp<=M.maxMp(h));assert(M.validateHero(h))}}
});
test('side quests cannot be farmed or turned in from another town',()=>{
 const h=make(),q=M.discoverRumor(h,'healer');M.acceptSide(h,q.id);M.changeLocation(h,'wilds');M.interactionReward(h,{id:'herbs',type:'herbs'});assert.equal(q.state,'ready');assert.equal(M.turnIn(h,q.id),false);M.changeLocation(h,'town',1);assert.equal(M.turnIn(h,q.id),false);M.changeLocation(h,'town',0);assert(M.turnIn(h,q.id));assert.equal(M.turnIn(h,q.id),false);assert.equal(M.interactionReward(h,{id:'herbs',type:'herbs'}).ok,true);
 // Resolution is location-specific; returning to the harvested road does not grant it again.
 M.changeLocation(h,'wilds',0);assert.equal(M.interactionReward(h,{id:'herbs',type:'herbs'}).ok,false);
});
test('equipment swaps preserve both items, consumables are bounded',()=>{const h=make(),old=h.equipment.weapon;const item=M.loot(h,false,()=>.1);assert.equal(item.type,'weapon');assert(M.equip(h,item.id));assert.equal(h.equipment.weapon.id,item.id);assert(h.items.some(i=>i.id===old.id));h.hp=2;assert(M.useItem(h,'potion'));assert(h.hp>2);h.hp=M.maxHp(h);assert.equal(M.useItem(h,'potion'),false);assert(M.validateHero(h))});
test('AI packs are validated and cannot replace an active campaign',()=>{const h=make(),pack=Object.fromEntries(['title','artifact','enemy','witness','clue','revelation','demand','preserve','destroy','bind'].map(k=>[k,k+' original']));pack.color='#448888';assert(AI.validateAdventure(pack));assert(AI.applyAdventure(h,pack));M.acceptMain(h);assert.throws(()=>AI.applyAdventure(h,pack));assert.equal(AI.validateAdventure({...pack,destroy:undefined}),false);assert.equal(AI.validateScene({narration:'x',choices:[{label:'Do it',stat:'finesse',result:'A secret',reward:'gold'},{label:'Wait',stat:'none',result:'Time passes',reward:'information'}]}),true);assert.equal(AI.validateScene({narration:'x',choices:[{label:'Exploit',stat:'finesse',result:'Anything',reward:'execute'}]}),false)});
test('corrupt saves are rejected instead of crashing the game',()=>{const h=make();assert(M.validateHero(h));assert(!M.validateHero({...h,level:NaN}));assert(!M.validateHero({...h,world:{...h.world,towns:[]}}));assert(!M.validateHero({...h,campaign:{...h.campaign,stage:'whatever'}}));assert(!M.validateHero({...h,items:[{id:'x',name:'bad',type:'script'}]}))});
test('legacy hero migration preserves identity, level, gold and equipment',()=>{const h=M.migrateLegacy({version:1,name:'Old Raven',cls:'Spellbinder',level:5,hp:12,mp:8,gold:144,skillPoints:3,equipment:{weapon:'Old Moonstaff',weaponPower:16},items:[{name:'Potion',type:'potion',qty:3}]});assert(h);assert.equal(h.name,'Old Raven');assert.equal(h.level,5);assert.equal(h.gold,144);assert.equal(h.equipment.weapon.name,'Old Moonstaff');assert(M.validateHero(h))});

globalThis.localStorage={data:new Map(),getItem(k){return this.data.get(k)??null},setItem(k,v){this.data.set(k,String(v))},removeItem(k){this.data.delete(k)}};
const S=await import('../src/saves.js');
test('multiple heroes, checkpoints, exports and imports stay separate',()=>{localStorage.data.clear();const a=make(4),b=make(5);a.name='First';b.name='Second';assert(S.saveHero(a,{checkpoint:true}));assert(S.saveHero(b,{checkpoint:true}));assert.equal(S.listHeroes().length,2);assert.equal(S.lastHero().id,b.id);a.gold=200;S.saveHero(a);assert.equal(S.loadHero(a.id).gold,200);assert.notEqual(S.loadHero(b.id).gold,200);assert.equal(S.checkpoints(a.id)[0].hero.gold,75);const copy=S.importSave(S.exportSave(a))[0];assert.notEqual(copy.id,a.id);assert.equal(S.listHeroes().length,3);assert.throws(()=>S.importSave('{"hero":{"schema":4}}'));assert.equal(S.listHeroes().length,3);assert(S.deleteHero(b.id));assert.equal(S.listHeroes().length,2)});
