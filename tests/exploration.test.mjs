import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
const make=()=>M.makeHero({name:'Explorer',raceId:'human',classId:'ranger',originId:'wanderer'},12121);
test('a task can recognize exploration done before the player accepted it',()=>{const h=make();M.changeLocation(h,'wilds',0);M.interactionReward(h,{id:'herbs',type:'herbs'});M.changeLocation(h,'town',0);const q=M.discoverRumor(h,'healer');M.acceptSide(h,q.id);assert.equal(q.state,'ready');assert(M.turnIn(h,q.id))});
test('quest markers follow the main investigation rather than vanishing',()=>{const h=make();assert(M.entitiesFor(h).find(e=>e.role==='witness').marker==='main');M.acceptMain(h);M.changeLocation(h,'wilds',0);assert(M.entitiesFor(h).find(e=>e.id==='clue').marker==='main');M.collectClue(h);M.changeLocation(h,'town',0);assert(M.entitiesFor(h).find(e=>e.role==='scholar').marker==='main')});
