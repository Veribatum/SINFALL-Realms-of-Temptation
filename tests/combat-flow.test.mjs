import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import * as A from '../src/action-combat.js';
import {attackPattern,insidePattern,dodgeDirection,EXPOSE_TIME} from '../src/combat-rules.js';
import {telegraphGeometry,CombatScene} from '../src/combat-scene.js';
import {Realm} from '../src/world.js';
import * as T from '../vendor/three.module.js';
import {cameraView} from '../src/scene-utils.js';

const env={rng:()=>.5,lineOfSight:()=>true,canMove:()=>true};
function make(classId='duelist'){
 const h=M.makeHero({name:'Combat tester',classId,raceId:'human',gender:'male'},13254);
 M.enterRealm(h);h.level=6;h.hp=M.maxHp(h);h.mp=M.maxMp(h);
 A.prepareActionCombat(h,{id:'test-foe',type:'enemy',kind:'bandit',name:'Road reaver',x:h.position.x+2,z:h.position.z});
 h.combat.hp=h.combat.maxHp=10000;h.combat.nextAttack=30;return h;
}
function tick(h,seconds,options=env){
 const events=[];let result;
 for(let i=0;i<Math.ceil(seconds/.05);i++){result=A.advanceAction(h,.05,options);events.push(...result.events);if(result.outcome)break}
 return {...result,events};
}
function ready(h,intent='heavy',left=.15){
 h.combat.windup={intent,left,total:1.2,target:'hero',pattern:attackPattern(h.combat,h.position,intent)};
}

test('melee attacks commit to a frontal footprint; walking behind or sideways avoids the blow',()=>{
 for(const side of['front','side','behind']){
  const h=make(),c=h.combat;ready(h);const snapshot=structuredClone(c.windup.pattern),hp=h.hp;
  if(side==='side')h.position={...h.position,x:c.x,z:c.z+2.5};
  if(side==='behind')h.position={...h.position,x:c.x+1.5,z:c.z};
  assert.deepEqual(c.windup.pattern,snapshot);
  const result=tick(h,.25);assert.equal(result.events.some(e=>e.kind==='hurt'),side==='front');
  if(side!=='front')assert.equal(h.hp,hp);
 }
});

test('a hex warns at its target position and does not follow a target moving out of the circle',()=>{
 for(const move of[false,true]){
  const h=make();h.combat.x=h.position.x+6;h.combat.intents=['hex'];h.combat.nextAttack=0;
  A.advanceAction(h,.05,env);const pattern=structuredClone(h.combat.windup.pattern),hp=h.hp;
  assert.equal(pattern.shape,'circle');assert.equal(pattern.x,h.position.x);assert.equal(pattern.z,h.position.z);
  if(move)h.position.z+=2.3;
  assert.deepEqual(h.combat.windup.pattern,pattern);const r=tick(h,1.25);
  assert.equal(r.events.some(e=>e.kind==='hurt'),!move);if(move)assert.equal(h.hp,hp);
 }
});

test('rendered telegraph triangles cover the same footprint used by damage checks',()=>{
 for(const intent of['quick','heavy','hex'])for(const inner of[0,.96]){
  const p=attackPattern({x:8,z:-3},{x:5,z:2},intent),g=telegraphGeometry(p,inner),positions=g.attributes.position;
  assert(positions.array.every(Number.isFinite));
  for(let i=0;i<positions.count;i+=3){
   let x=0,z=0;for(let j=0;j<3;j++){x+=positions.getX(i+j)/3;z+=positions.getZ(i+j)/3}
   const point={x:p.x+x*Math.cos(p.yaw)+z*Math.sin(p.yaw),z:p.z-x*Math.sin(p.yaw)+z*Math.cos(p.yaw)};
   assert(insidePattern(p,point),intent+' telegraph and hit area agree');
  }
  g.dispose();
 }
});

test('multiple telegraphs follow terrain, retain their committed direction and release retired geometry',()=>{
 const h=make(),world={hero:h,scene:new T.Scene(),groundAt:(x,z)=>Math.sin(x*.1)*.2+z*.01};ready(h);
 const scene=new CombatScene(world),second={...h.combat,id:'hex-foe',windup:{intent:'hex',left:1,total:1,target:'hero',pattern:attackPattern(h.combat,h.position,'hex')}};
 scene.updateTelegraphs([h.combat,second]);assert.equal(scene.telegraphs.size,2);
 for(const g of scene.telegraphs.values())for(const mesh of g.children){
  const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){
   const local=new T.Vector3().fromBufferAttribute(p,i).applyEuler(g.rotation).add(g.position);
   assert(Math.abs(local.y-world.groundAt(local.x,local.z)-.06)<1e-5);
  }
 }
 const old=scene.telegraphs.get(h.combat.id),yaw=old.rotation.y;h.position.z+=3;scene.updateTelegraphs([h.combat,second]);assert.equal(old.rotation.y,yaw);
 let disposed=false;old.children[0].geometry.addEventListener('dispose',()=>disposed=true);h.combat.windup=null;scene.updateTelegraphs([h.combat,second]);assert(disposed);assert.equal(scene.telegraphs.size,1);scene.updateTelegraphs([]);assert.equal(scene.telegraphs.size,0);scene.dispose();assert.equal(world.scene.children.length,0);
});

test('a late melee guard parries, restores mana, staggers and opens a real damage bonus',()=>{
 const h=make();h.mp=5;ready(h);const hp=h.hp;A.performAction(h,'guard',env);
 const r=tick(h,.2);assert(r.events.some(e=>e.kind==='parry'));assert.equal(h.hp,hp);assert(h.combat.stunFor>0);assert(h.combat.exposedFor>2);assert.equal(h.mp>11,true);
 A.performAction(h,'attack',env);const damage=h.combat.pending[0].damage;
 const hit=tick(h,.2).events.find(e=>e.kind==='hit');assert.equal(hit.amount,Math.round(damage*1.35));assert(hit.exposed);
 tick(h,EXPOSE_TIME+.1);assert.equal(h.combat.exposedFor,0);assert(M.validateHero(h));
});

test('an early guard still reduces damage and hexes cannot be parried',()=>{
 const early=make(),plain=make();ready(early,'heavy',.6);ready(plain,'heavy',.6);A.performAction(early,'guard',env);
 const earlyResult=tick(early,.65);tick(plain,.65);assert(early.hp>plain.hp);assert(!earlyResult.events.some(e=>e.kind==='parry'));
 const hex=make();ready(hex,'hex');const hp=hex.hp;A.performAction(hex,'guard',env);const r=tick(hex,.2);assert(hex.hp<hp);assert(!r.events.some(e=>e.kind==='parry'));
});

test('three connected melee attacks build to a stronger interrupting finisher, then reset',()=>{
 const h=make(),damage=[];
 for(let index=1;index<=3;index++){
  assert(A.performAction(h,'attack',env).ok);assert.equal(h.combat.chain.index,index);damage.push(h.combat.pending[0].damage);
  if(index===3)ready(h,'heavy',.7);
  const r=tick(h,.2);assert.equal(r.events.some(e=>e.kind==='hit'&&e.finisher),index===3);
  if(index===3){assert.equal(h.combat.windup,null);assert(h.combat.stunFor>0)}else tick(h,.65);
 }
 assert(damage[2]>damage[1]&&damage[1]>=damage[0]);tick(h,.65);A.performAction(h,'attack',env);assert.equal(h.combat.chain.index,1);
 tick(h,1.5);A.performAction(h,'attack',env);assert.equal(h.combat.chain.index,1);assert(M.validateHero(h));
});

test('invalid attacks cannot advance a chain and ranged weapons do not use melee chains',()=>{
 const h=make();A.performAction(h,'attack',env);const chain=structuredClone(h.combat.chain);
 assert(!A.performAction(h,'attack',env).ok);assert.deepEqual(h.combat.chain,chain);tick(h,.85);h.combat.x+=20;
 assert(!A.performAction(h,'attack',env).ok);assert.equal(h.combat.chain.index,1);
 for(const cls of['ranger','necromancer']){const ranged=make(cls);assert(A.performAction(ranged,'attack',env).ok);assert.equal(ranged.combat.chain,undefined);assert.equal(ranged.combat.pending[0].reach,undefined)}
});

test('melee impacts recheck range and walls without spending a heal or applying an interrupt on a miss',()=>{
 for(const blocked of[false,true]){
  const h=make();h.hp=10;const hp=h.combat.hp;assert(A.performAction(h,'attack',env).ok);h.combat.pending[0].heal=10;h.combat.pending[0].stun=.9;
  if(!blocked)h.position.x-=8;
  const r=tick(h,.2,blocked?{...env,lineOfSight:()=>false}:env);assert.equal(h.combat.hp,hp);assert.equal(h.hp,10);assert(r.events.some(e=>e.kind==='miss'));
 }
});

test('target switching shares combo progress and the parry window rather than refreshing either',()=>{
 const h=make();h.combat=null;const e=[0,1].map(i=>({id:'pack-'+i,type:'enemy',kind:'bandit',x:h.position.x+2,z:h.position.z+i*.2}));
 A.prepareActionCombat(h,e[0],[e[1]]);for(const c of A.combatants(h)){c.nextAttack=30;c.hp=c.maxHp=1000}
 A.performAction(h,'attack',env);A.performAction(h,'guard',env);tick(h,.1);const window=h.combat.parryFor;
 A.selectTarget(h,'pack-1');assert.equal(h.combat.chain.index,1);assert.equal(h.combat.parryFor,window);assert(!A.performAction(h,'attack',env).ok);
 tick(h,.75);A.performAction(h,'attack',env);assert.equal(h.combat.chain.index,2);assert(M.validateHero(h));
});

test('mid-attack saves preserve committed footprints and chains while rejecting corrupt new fields',()=>{
 const h=make();A.performAction(h,'attack',env);A.performAction(h,'guard',env);ready(h);h.combat.exposedFor=1;
 const copy=JSON.parse(JSON.stringify(h));assert(M.validateHero(copy));A.resumeActionCombat(copy);
 assert.deepEqual(copy.combat.windup.pattern,h.combat.windup.pattern);assert.deepEqual(copy.combat.chain,h.combat.chain);assert(M.validateHero(copy));
 const invalid=[c=>c.chain.index=4,c=>c.chain.remaining=Infinity,c=>c.parryFor=1,c=>c.exposedFor=100,c=>c.windup.pattern.reach=-1,c=>c.windup.pattern.yaw=NaN,c=>c.pending[0].reach=900];
 for(const mutate of invalid){const bad=structuredClone(h);mutate(bad.combat);assert(!M.validateHero(bad))}
 const legacy=structuredClone(h);delete legacy.combat.chain;delete legacy.combat.parryFor;delete legacy.combat.exposedFor;delete legacy.combat.windup.pattern;for(const hit of legacy.combat.pending){delete hit.reach;delete hit.chain;delete hit.finisher}assert(M.validateHero(legacy));A.resumeActionCombat(legacy);tick(legacy,.25);assert(M.validateHero(legacy));
});

test('dodging follows camera-relative movement, keeps its direction at a wall and has a no-input sidestep',()=>{
 assert.deepEqual(dodgeDirection(0,1,0),{x:0,z:1});assert.deepEqual(dodgeDirection(0,-1,0),{x:-0,z:-1});assert.deepEqual(dodgeDirection(0,0,1),{x:-1,z:0});assert.equal(dodgeDirection(0,0,0),null);
 const h=make(),w={hero:h,yaw:0,keys:new Set(['arrowdown']),joy:{x:0,y:0},canMove:()=>false};Realm.prototype.dodge.call(w);assert.equal(w.dodgeMotion.z,-1);assert.equal(w.dodgeMotion.left,.22);
 w.keys.clear();Realm.prototype.dodge.call(w);assert(Math.hypot(w.dodgeMotion.x,w.dodgeMotion.z)>.99);
 w.joy={x:.5,y:-.5};Realm.prototype.dodge.call(w);assert(w.dodgeMotion.x<0&&w.dodgeMotion.z>0);
});

test('a cramped corridor uses an unobstructed eye view and returns to third person in clear space',()=>{
 const position={x:25,z:58},options={yaw:Math.PI/2,pitch:.48,enclosed:true,canOccupy:x=>x>24.28};
 const cramped=cameraView(position,options);assert(cramped.firstPerson);assert.equal(cramped.position.y,1.7);assert(cramped.target.x>position.x);assert(Math.hypot(cramped.position.x-position.x,cramped.position.z-position.z)<.1);
 const open=cameraView(position,{...options,canOccupy:()=>true});assert(!open.firstPerson);assert(open.position.y<3.3);assert(Math.hypot(open.position.x-position.x,open.position.z-position.z)>4);
 const chosen=cameraView(position,{...options,firstPerson:true,canOccupy:()=>true});assert(chosen.firstPerson);
});

test('a wolf overhead label remains in the camera frustum during close corridor combat',()=>{
 const position={x:25,z:58},view=cameraView(position,{yaw:Math.PI/2,pitch:.48,enclosed:true,canOccupy:x=>x>24.28});
 const camera=new T.PerspectiveCamera(62,390/844,.12,240);camera.position.copy(view.position);camera.lookAt(view.target);camera.updateMatrixWorld(true);
 const projected=new T.Vector3(26,1.4,58).project(camera);assert(Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&Math.abs(projected.z)<1);
});

test('regular pack victories report every awarded item once for the non-pausing reward ribbon',()=>{
 const h=make(),items=[M.loot(h,false,()=>.2),M.loot(h,false,()=>.7)];h.combat.rewards={xp:60,gold:34,names:['First','Second'],items,boss:false};h.combat.hp=0;
 const r=tick(h,.05,{...env,rng:()=>.9}),gold=h.gold,kills=h.kills;
 assert.equal(r.mode,'action');assert.equal(r.outcome,'victory');assert.equal(r.items.length,2);assert.deepEqual(r.items.map(i=>i.id),items.map(i=>i.id));assert.equal(h.combat,null);
 tick(h,1);assert.equal(h.gold,gold);assert.equal(h.kills,kills);assert(M.validateHero(h));
});
