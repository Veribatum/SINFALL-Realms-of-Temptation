import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import * as M from '../src/model.js';
import {Realm} from '../src/world.js';
import {createActor,animateActor,disposeActor,modelFor} from '../src/actors.js';
import {cameraPosition} from '../src/scene-utils.js';
const make=seed=>M.makeHero({name:'Traveler',raceId:'elf',classId:'spellbinder',originId:'scholar'},seed??2312);

test('every building supports entering, saving, exploring once, and returning to its door',()=>{
 const h=make();for(const b of M.BUILDINGS){M.changeLocation(h,'town');const before=h.equipment.weapon.power;M.changeLocation(h,'interior',0,b.id);assert(M.validateHero(h));assert.equal(M.locationName(h),b.name);assert(M.entitiesFor(h).some(e=>e.role===b.role));assert(M.entitiesFor(h).some(e=>e.type==='exit'));assert(M.exploreRoom(h).ok);const saved=JSON.stringify(h);assert(!M.exploreRoom(h).ok);assert.equal(JSON.stringify(h),saved);if(b.id==='smith')assert.equal(h.equipment.weapon.power,before+1);assert(M.validateHero(JSON.parse(saved)));M.changeLocation(h,'town');assert.equal(h.position.x,b.x);assert.equal(h.position.z,b.z)}
 assert.throws(()=>M.changeLocation(h,'interior',0,'missing'));assert(M.validateHero(h));
});
test('the investigation and side quests work inside the archive and apothecary',()=>{
 const h=make();M.acceptMain(h);M.changeLocation(h,'wilds');assert(M.collectClue(h));M.changeLocation(h,'town');assert.equal(M.entitiesFor(h).find(e=>e.room==='archive').marker,'main');M.changeLocation(h,'interior',0,'archive');assert.equal(M.entitiesFor(h).find(e=>e.role==='scholar').marker,'main');assert(M.chooseAlliance(h,'scholars'));M.changeLocation(h,'wilds');M.interactionReward(h,{id:'herbs',type:'herbs'});M.changeLocation(h,'interior',0,'apothecary');const q=M.discoverRumor(h,'healer');M.acceptSide(h,q.id);assert(M.turnIn(h,q.id));assert(M.validateHero(h));
});
test('meetings vary by seed, remember alliances, and cannot pay twice',()=>{
 const titles=new Set();for(let seed=0;seed<12;seed++){const h=make(seed);for(const type of['town','wilds']){M.changeLocation(h,type);const e=M.encounterFor(h);titles.add(e.name);const choice=e.options.find(o=>!o.cost)||e.options[0];const result=M.resolveEncounter(h,e.id,choice.id,()=>.99);assert(result.ok);const gold=h.gold,xp=h.xp;assert.equal(M.encounterFor(h),null);assert(!M.resolveEncounter(h,e.id,choice.id).ok);assert.equal(h.gold,gold);assert.equal(h.xp,xp);assert(M.validateHero(h));assert(h.world.outcomes[e.id])}}
 assert.equal(titles.size,7);const h=make();h.campaign.flags.alliance='veil';assert.match(M.encounterFor(h).text,/shadow turns/);h.campaign.flags.alliance='wardens';M.changeLocation(h,'wilds');assert.match(M.encounterFor(h).text,/watch-blue/);
});
test('unaffordable choices do not mutate the encounter or spend resources',()=>{
 const h=make(0),e=M.encounterFor(h),o=e.options.find(o=>o.cost);assert(o);h.gold=0;const before=JSON.stringify(h);assert(!M.resolveEncounter(h,e.id,o.id).ok);assert.equal(JSON.stringify(h),before);assert(!M.resolveEncounter(h,e.id,'made-up').ok);
});
test('earned reputation unlocks favors and merchants offer bounded discounts',()=>{
 const h=make(5);assert(!M.encounterFor(h).options.some(o=>o.id==='watch-favor'));assert.equal(M.tradePrice(h,100),100);h.factions.town=3;assert(M.encounterFor(h).options.some(o=>o.id==='watch-favor'));assert(M.tradePrice(h,100)<100);h.relationships.Friend=100;assert(M.tradePrice(h,100,'smith','Friend')<M.tradePrice(h,100));h.factions.town=999;assert.equal(M.tradePrice(h,100,'smith','Friend'),75);h.hp=5;const e=M.encounterFor(h);assert(M.resolveEncounter(h,e.id,'watch-favor').ok);assert.equal(h.hp,19);assert(!M.encounterFor(h));assert(M.validateHero(h));
});
test('all furnished rooms have finite geometry and reachable people, exits, discoveries',()=>{
 const prior=globalThis.document,ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};
 try{const hero=make(),r=Object.create(Realm.prototype);Object.assign(r,{hero,scene:new T.Scene(),materials:[],textures:[],quality:'low'});for(const b of M.BUILDINGS){M.changeLocation(hero,'interior',0,b.id);r.build();assert(r.canMove(hero.position.x,hero.position.z));for(const e of r.entities)assert(r.canMove(e.x,e.z),b.id+': '+e.name);r.root.traverse(o=>{if(o.isMesh)assert(o.geometry.attributes.position.array.every(Number.isFinite))});assert(r.batchStats.savedDraws>40);assert(!r.canMove(7,0));assert(!r.canMove(0,8));}r.clearScene()}finally{globalThis.document=prior}
});
test('camera stays in front of the first wall along its path',()=>{
 const target=new T.Vector3(0,1.35,0),desired=new T.Vector3(0,3,-6),actual=cameraPosition(target,desired,(x,z)=>z>-2);assert(actual.z>-2);assert(actual.distanceTo(target)>1);assert(cameraPosition(target,desired,()=>true).equals(desired));
});
test('four local GLBs parse, clone independent skeletons, and play retained animations',async()=>{
 for(const name of['rogue','knight','mage','barbarian']){
  const raw=await readFile(new URL('../assets/models/'+name+'.glb',import.meta.url));assert.equal(raw.readUInt32LE(0),0x46546c67);assert.equal(raw.readUInt32LE(8),raw.length);assert(raw.length<900000);
  // Node has no image decoder. Only GPU texture decoding is stubbed; the actual
  // committed binary, geometry, hierarchy, skins and animation clips are parsed.
  const loader=new GLTFLoader().register(()=>({name:'test-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
  const source=await loader.parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');assert.equal(source.animations.length,11);
  const a=createActor(source,{kind:name}),b=createActor(source,{kind:name,race:'dwarf'});let skinA,skinB,vertices=0;a.traverse(o=>{if(o.isSkinnedMesh){skinA??=o;vertices+=o.geometry.attributes.position.count}});b.traverse(o=>{if(o.isSkinnedMesh)skinB??=o});assert(vertices>100);assert.notEqual(skinA.skeleton.bones[0],skinB.skeleton.bones[0]);
  const before=skinA.skeleton.bones.map(b=>b.quaternion.toArray());animateActor(a,.1,.4);animateActor(a,.1,.4);assert.equal(a.userData.animation.current,'Walking_A');assert(skinA.skeleton.bones.some((b,i)=>b.quaternion.toArray().some((n,j)=>Math.abs(n-before[i][j])>.001)));animateActor(a,.1,1);assert.equal(a.userData.animation.current,'Running_A');animateActor(a,.1,0);assert.equal(a.userData.animation.current,'Idle');assert.equal(b.userData.animation.current,'Idle');a.updateMatrixWorld(true);a.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)));const shader={uniforms:{},fragmentShader:'#include <map_fragment>'};skinA.material.onBeforeCompile(shader);assert(shader.fragmentShader.includes('vMapUv'));assert(shader.uniforms.sinfallSkin.value.isColor);disposeActor(a);disposeActor(b);
 }
 assert.equal(modelFor('spellbinder'),'mage');assert.equal(modelFor('templar'),'knight');assert.equal(modelFor('berserker'),'barbarian');assert.equal(modelFor('ranger'),'rogue');
});
