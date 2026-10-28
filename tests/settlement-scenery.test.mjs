import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import * as M from '../src/model.js';
import {Realm} from '../src/world.js';
import {centerOf,realmPoint,cryptAnchor,homePlan,settlementStreets,SETTLEMENT_CORE} from '../src/atlas.js';
import {buildUndercrypt} from '../src/settlement-assets.js';
import {updateOpenWorld} from '../src/overworld.js';
import {drawAtlas,mapBounds} from '../src/map-view.js';

const make=()=>M.makeHero({name:'Settlement surveyor',raceId:'elf',classId:'ranger',originId:'wanderer'},13254);
const headless=hero=>Object.assign(Object.create(Realm.prototype),{hero,scene:new T.Scene(),materials:[],textures:[],quality:'low'});
function documentStub(){const prior=globalThis.document,ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};return()=>{globalThis.document=prior}}
const close=(a,b)=>Math.abs(a-b)<1e-7;

test('compact neighborhoods keep every household and lead each front door to a clear street',()=>{
 const restore=documentStub(),hero=make();M.enterRealm(hero);const r=headless(hero);
 try{for(const town of hero.world.towns){
  const homes=homePlan(town),c=centerOf(town.id),streets=settlementStreets(town);assert.deepEqual(homes.map(h=>h.id),Array.from({length:20},(_,i)=>i));assert.equal(new Set(homes.map(h=>h.owner)).size,20);
  hero.position={x:c.x,z:c.z+20,yaw:0};M.syncRealm(hero);r.build();
  const doors=M.entitiesFor(hero).filter(e=>e.type==='door');assert.equal(doors.length,25);
  for(const home of homes){
   assert(Math.max(Math.abs(home.x),Math.abs(home.z))<=62,'homes remain inside the compact neighborhood');
   assert(home.x*Math.sin(home.rotation)+home.z*Math.cos(home.rotation)<0,'door faces toward town');
   const street=streets.find(s=>close(s.from.x,home.doorX)&&close(s.from.z,home.doorZ));assert(street,'front doorstep has a rendered street connection');
   for(let i=0;i<=20;i++){const t=i/20,x=c.x+street.from.x+(street.to.x-street.from.x)*t,z=c.z+street.from.z+(street.to.z-street.from.z)*t;assert(r.canMove(x,z),town.id+': home '+home.id+' approach is clear')}
  }
  // A flood fill catches islands of accessible doors surrounded by scenery.
  // The grid includes all 25 buildings, the green, market and street loop.
  const seen=new Set(),queue=[[0,20]],key=(x,z)=>x+','+z;seen.add(key(0,20));for(let i=0;i<queue.length;i++){const[x,z]=queue[i];for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,k=key(xx,zz);if(Math.abs(xx)>70||Math.abs(zz)>70||seen.has(k)||!r.canMove(c.x+xx,c.z+zz))continue;seen.add(k);queue.push([xx,zz])}}
  for(const door of doors){const x=Math.round(door.x-c.x),z=Math.round(door.z-c.z);assert(seen.has(key(x,z)),town.id+': '+door.name+' is reachable from the square')}
  for(const npc of r.entities.filter(e=>e.type==='npc'))assert(r.canMove(npc.x,npc.z),npc.name+' retains a clear anchor');
 }}finally{r.clearScene();restore()}
});

test('undercrypts have visible stonework, open portals, steps and passable exact gate thresholds',()=>{
 const restore=documentStub(),hero=make(),r=headless(hero);r.open=true;r.root=new T.Group();r.colliders=[];r.m={iron:r.material('#465052'),glow:r.material('#ecc07a')};
 try{for(const town of hero.world.towns){
  const gate=cryptAnchor(town.id);assert.deepEqual(gate,realmPoint(town.id,'wilds',0,-35));const g=buildUndercrypt(r,town),bounds=new T.Box3().setFromObject(g),size=bounds.getSize(new T.Vector3());assert(size.x>18&&size.y>8&&size.z>12,'substantial burial structure');
  assert(g.getObjectByName('Open undercrypt portal'));assert(g.getObjectByName('Undercrypt sign'));let stairs=0;g.traverse(o=>{if(o.name==='Undercrypt approach stair')stairs++;if(o.isMesh)assert(o.geometry.attributes.position.array.every(Number.isFinite))});assert.equal(stairs,4);
  for(const dx of[-.9,0,.9])for(let dz=-11;dz<=12;dz+=.25)assert(r.canMove(gate.x+dx,gate.z+dz),town.id+': open threshold and north road '+dx+','+dz);
  assert(!r.canMove(gate.x+4.35,gate.z-3.8),'stone sidewalls remain solid');assert(!r.canMove(gate.x+8.45,gate.z-4.2),'burial stones remain solid');
 }}finally{r.clearScene();restore()}
});

test('streaming loads each actual crypt once and keeps dungeon returns outside colliders',()=>{
 const restore=documentStub(),hero=make();M.enterRealm(hero);const r=headless(hero);
 try{for(const town of hero.world.towns){
  const gate=cryptAnchor(town.id);hero.position={...gate,yaw:Math.PI};M.syncRealm(hero);r.build();
  const cryptChunks=[...r.openChunks.values()].filter(g=>g.userData.cryptEntrances?.includes(town.id)),textureCount=r.textures.length;assert.equal(cryptChunks.length,1);assert(r.root.getObjectByName('Undercrypt entrance · '+town.id));assert(r.canMove(gate.x,gate.z));
  const e=M.entitiesFor(hero).find(e=>e.type==='gate');assert.equal(e.x,gate.x);assert.equal(e.z,gate.z);M.changeLocation(hero,'dungeon');M.changeLocation(hero,'wilds');assert.equal(hero.position.x,gate.x);assert.equal(hero.position.z,gate.z);assert(r.canMove(hero.position.x,hero.position.z));assert(M.validateHero(hero));
  hero.position.x+=650;updateOpenWorld(r);assert(![...r.openChunks.values()].some(g=>g.userData.cryptEntrances?.includes(town.id)),'distant crypt unloads with its chunk');hero.position={...gate,yaw:0};updateOpenWorld(r);assert.equal([...r.openChunks.values()].filter(g=>g.userData.cryptEntrances?.includes(town.id)).length,1);assert.equal(r.textures.length,textureCount,'revisiting a crypt reuses its sign texture');
 }}finally{r.clearScene();restore()}
});

test('atlas paths and building fronts follow the same settlement plan as the world',()=>{
 const hero=make();M.enterRealm(hero);const paths=[],fronts=[],w=780;let current=[],translation=[0,0],rotation=0;const ctx=new Proxy({canvas:{width:w,getBoundingClientRect:()=>({width:390})},beginPath(){current=[]},moveTo(x,z){current.push([x,z])},lineTo(x,z){current.push([x,z])},stroke(){paths.push(current)},translate(x,z){translation=[x,z]},rotate(a){rotation=a},fillRect(x,z,width,height){if(close(width,21)&&close(height,18))fronts.push({translation:[...translation],rotation})}},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 drawAtlas(ctx,hero,'town');const bounds=mapBounds(hero,'town'),k=w/bounds.size,project=p=>[(p.x-bounds.x)*k,(p.z-bounds.z)*k];
 for(const street of settlementStreets(hero.world.towns[0])){const a=project(street.from),b=project(street.to);assert(paths.some(p=>p.length===2&&close(p[0][0],a[0])&&close(p[0][1],a[1])&&close(p[1][0],b[0])&&close(p[1][1],b[1])),'street is drawn at its world coordinates')}
 for(const b of [...homePlan(hero.world.towns[0]),...SETTLEMENT_CORE]){const[x,z]=project(b),front=fronts.find(f=>close(f.translation[0],x)&&close(f.translation[1],z));assert(front,'building footprint matches world center');assert(close(front.rotation,-b.rotation),'map front faces the world door')}
});


test('main settlement is denser than outlying villages and a relocated building cannot trap a returning hero',()=>{
 const hero=make(),homes=homePlan(hero.world.towns[0]),village=homePlan(hero.world.towns[1]);
 const area=list=>(Math.max(...list.map(h=>h.x))-Math.min(...list.map(h=>h.x)))*(Math.max(...list.map(h=>h.z))-Math.min(...list.map(h=>h.z)));
 assert(area(homes)<area(village)*.75,'same households occupy a materially smaller main-town footprint');assert(homes.filter(h=>Math.abs(h.x)<35&&Math.abs(h.z)<35).length>=4,'occupied inner streets replace the empty ring');
 const restore=documentStub();M.enterRealm(hero);hero.position={x:homes[0].x,z:homes[0].z,yaw:0};const r=headless(hero);
 try{r.build();assert(r.canMove(hero.position.x,hero.position.z));assert(Math.hypot(hero.position.x-homes[0].x,hero.position.z-homes[0].z)<12);assert.equal(hero.position.yaw,0);const town=[...r.openChunks.values()].find(g=>g.userData.towns?.includes(0));assert(town);assert(r.root.getObjectByName('Main town market and courtyards'));}finally{r.clearScene();restore()}
});

test('faction resolutions add physical landmarks and accessible guards without breaking roads or doors',()=>{
 const restore=documentStub(),h=make();M.enterRealm(h);h.world.factionQuests={wardens:{townId:0,node:'complete',ending:'accountable',facts:[],decisions:[]},scholars:{townId:0,node:'complete',ending:'published',facts:[],decisions:[]},veil:{townId:0,node:'complete',ending:'unbound',facts:[],decisions:[]}};const r=headless(h);
 try{for(const site of ['site-0','site-2','site-6']){const target=M.entitiesFor(h).find(e=>e.id===site);h.position={x:target.x,z:target.z+2,yaw:0};M.syncRealm(h);r.build();assert(r.root.getObjectByName('Faction landmark · '+(site==='site-0'?'wardens · accountable':site==='site-2'?'scholars · published':'veil · unbound')));assert(r.canMove(h.position.x,h.position.z));for(const guard of r.entities.filter(e=>e.id.startsWith('watch-station-')))assert(r.canMove(guard.x,guard.z));}assert(M.validateHero(h));}finally{r.clearScene();restore()}
});
