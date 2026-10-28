import * as T from '../vendor/three.module.js';
import {centerOf,cryptAnchor} from './atlas.js?v=11';

// The gate anchor is the open threshold, rather than the center of a solid
// prop. Side colliders leave the arrival point and the north road passable.
export function buildUndercrypt(r,town){
 const anchor=cryptAnchor(town.id),g=new T.Group();g.name='Undercrypt entrance · '+town.id;g.position.set(anchor.x,0,anchor.z);g.userData.cryptEntrance={townId:town.id,...anchor};r.root.add(g);
 const stone=r.material('#7d8984',{map:r.texture('stone')}),trim=r.material('#b2b3a0',{map:r.texture('stone')}),shadow=r.material('#080f13',{roughness:1}),roof=r.material('#596a68',{map:r.texture('stone')}),patina=r.material('#688d87',{metalness:.35,roughness:.65});
 for(const side of[-1,1]){
  r.box(3.2,5.9,9,stone,g,side*4.35,2.95,-3.8);
  r.box(3.8,.45,9.6,trim,g,side*4.35,.22,-3.8);
  r.box(1.05,5.2,1.45,trim,g,side*2.4,2.6,.45);
  r.box(1.5,.45,1.8,trim,g,side*2.4,5,.45);
  r.box(.85,4.9,1.1,trim,g,side*5.65,2.45,.7);
  r.colliders.push({x:anchor.x+side*4.35,z:anchor.z-3.8,w:1.6,d:4.5,height:6.3});
  r.colliders.push({x:anchor.x+side*2.4,z:anchor.z+.45,w:.525,d:.725,height:5.6});
  // Low tombs and weathered markers make this read as a burial place.
  r.box(1.8,1.1,4,stone,g,side*8.45,.55,-3.8);
  r.box(2.05,.2,4.25,trim,g,side*8.45,1.2,-3.8);
  r.box(1.5,2.7,.5,stone,g,side*8.45,1.35,-6.1);
  r.box(.18,1.2,.1,patina,g,side*8.45,1.75,-5.8);
  r.box(.7,.16,.1,patina,g,side*8.45,1.9,-5.8);
  r.colliders.push({x:anchor.x+side*8.45,z:anchor.z-4.2,w:1.05,d:2.3,height:2.8});
 }
 // Separate voussoirs give the opening a heavy, visibly arched stone frame.
 for(let i=0;i<=12;i++){const a=i/12*Math.PI,block=r.box(.6,.85,1.45,i%2?stone:trim,g,Math.cos(a)*2.4,3+Math.sin(a)*2.4,.45);block.rotation.z=a-Math.PI/2}
 const portal=new T.Shape();portal.moveTo(-1.95,.08);portal.lineTo(1.95,.08);portal.lineTo(1.95,3);portal.absarc(0,3,1.95,0,Math.PI,false);portal.lineTo(-1.95,.08);
 const opening=r.mesh(new T.ShapeGeometry(portal),shadow,g,0,0,-1.1);opening.name='Open undercrypt portal';
 r.box(3.9,.12,8.5,shadow,g,0,.025,-3.8);
 for(let i=0;i<4;i++){const step=r.box(5.3+i*.45,.07,1.1,trim,g,0,.045+i*.045,4.2-i*1.05);step.name='Undercrypt approach stair'}
 r.box(12.8,.55,10.1,trim,g,0,6.12,-3.8);
 const pediment=new T.Shape();pediment.moveTo(-6.4,0);pediment.lineTo(6.4,0);pediment.lineTo(0,2.15);pediment.closePath();
 r.mesh(new T.ExtrudeGeometry(pediment,{depth:10.1,bevelEnabled:false}),roof,g,0,6.4,-8.85);
 r.box(13.3,.25,10.5,trim,g,0,6.37,-3.8);
 r.mesh(new T.TorusGeometry(.63,.12,6,24),patina,g,0,7.16,1.32);
 let texture=r.textureCache.get('undercrypt-sign');if(!texture){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='#263735';ctx.fillRect(0,0,512,80);ctx.strokeStyle='#a6b09b';ctx.lineWidth=5;ctx.strokeRect(4,4,504,72);ctx.fillStyle='#e2dbc0';ctx.font='bold 43px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('UNDERCRYPT',256,42);texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;r.textures.push(texture);r.textureCache.set('undercrypt-sign',texture)}
 const plaque=r.mesh(new T.PlaneGeometry(4.8,.75),r.material('#ffffff',{map:texture,roughness:.9}),g,0,5.76,1.21);plaque.name='Undercrypt sign';
 for(const side of[-1,1]){
  const x=side*5.1;r.box(.15,2.9,.15,r.m.iron,g,x,1.45,3.5);r.box(.62,.8,.62,r.m.glow,g,x,2.8,3.5);r.mesh(new T.ConeGeometry(.55,.45,4),r.m.iron,g,x,3.43,3.5).rotation.y=Math.PI/4;
  if(r.quality==='high'){const light=new T.PointLight(0x9bd4c6,5,9,2);light.position.set(x,2.7,3.5);g.add(light)}
 }
 return g;
}

export function buildCivicScenery(r,town){
 const c=centerOf(town.id),at=(x,z)=>({x:c.x+x,z:c.z+z}),g=new T.Group();g.name='Village civic spaces · '+town.id;g.position.set(c.x,0,c.z);r.root.add(g);
 const plaza=r.mesh(new T.CircleGeometry(9,32),r.openRoad,g,0,.075,0);plaza.rotation.x=-Math.PI/2;
 for(const[x,z]of(town.id===0?[[24,10],[32,10],[24,19],[32,19],[-21,20],[-29,20]]:[[-19,34],[-10,39],[-26,42]])){const p=at(x,z);r.market(p.x,p.z)}
 // The west green and garden occupy the space between streets, away from NPC
 // and doorway anchors. Small props leave generous walking routes around them.
 for(const[x,z,rot]of(town.id===0?[[-25,14,0],[-34,14,0],[-25,24,Math.PI]]:[[-28,15,0],[-28,22,Math.PI]])){
  const bench=new T.Group();bench.position.set(x,0,z);bench.rotation.y=rot;g.add(bench);r.box(3,.18,.8,r.m.wood,bench,0,.68,0);r.box(3,.65,.12,r.m.wood,bench,0,1.08,-.35);for(const side of[-1,1])r.box(.16,.65,.6,r.m.iron,bench,side*1.2,.34,0);
 }
 for(const z of(town.id===0?[-56,-63]:[-35,-27])){
  r.box(6,.18,5,r.material('#514c35'),g,-43,.09,z);
  for(const x of[-45,-43,-41])for(const zz of[-1.5,0,1.5]){const sprout=r.mesh(new T.ConeGeometry(.35,.75,5),r.m.leaves,g,x,.5,z+zz);sprout.rotation.z=(x+zz)*.06}
  for(const side of[-1,1])r.box(6.2,.25,.18,r.m.wood,g,-43,.2,z+side*2.5);
 }
 if(town.id===0){
  g.name='Main town market and courtyards';
  // Workshop yard and stacks stay off the connected pedestrian streets.
  for(const[x,z]of[[-30,-29],[29,-25],[-29,35],[15,34]]){
   r.barrel(c.x+x,c.z+z);r.box(.9,.7,.9,r.m.wood,g,x+1.2,.35,z);r.box(.7,.6,.7,r.m.wood,g,x+1.2,1,z);
  }
  for(const[x,z]of[[-10,31],[10,31],[-8,-27],[8,-27]]){
   r.box(2,.4,.8,r.m.stone,g,x,.2,z);for(const dx of[-.6,0,.6])r.mesh(new T.ConeGeometry(.35,.8,5),r.m.leaves,g,x+dx,.8,z);
  }
  for(const[x,z]of[[-34,-12],[34,-12],[-12,36],[12,36]]){const p=at(x,z);r.lamp(p.x,p.z)}
  // A canvas-covered communal table and hanging bunting frame the market.
  r.box(4,.18,1.5,r.m.wood,g,28,1.05,24);for(const x of[26.4,29.6])for(const z of[23.5,24.5])r.box(.16,1,.16,r.m.wood,g,x,.5,z);
  for(let i=0;i<12;i++){const flag=r.mesh(new T.ConeGeometry(.24,.6,3),r.material(i%2?'#a96e49':'#647d83'),g,20+i*1.25,4.1-Math.sin(i/11*Math.PI)*.5,5);flag.rotation.z=Math.PI}
  g.userData.marketStalls=6;
 }
 r.box(3,.35,2,r.m.stone,g,23,.17,-26);r.box(2.7,.15,1.7,r.material('#5a684e'),g,23,.42,-26);for(const x of[22.2,23,23.8])r.sphere(.25,r.material('#b6ba86'),g,x,.65,-26);
 return g;
}
