import * as T from '../vendor/three.module.js';
import {homePlan} from './atlas.js?v=12';
// Furnished, walkable rooms. The interaction anchors sit in free aisle space;
// furniture collision belongs to the prop, rather than its interaction marker.
export function buildInterior(r){
 const m=r.m,room=r.hero.location.room;r.lightSetup();
 const wall=r.material(room==='chapel'?'#a3a199':'#c9b995'),rug=r.material(room==='archive'?'#476675':room==='chapel'?'#7b474e':'#806346');
 r.box(14,.25,16,m.wood,r.root,0,-.13,0);
 for(let i=-6;i<7;i++)r.box(.025,.015,16,m.timber,r.root,i,.007,0);
 r.box(.35,4.8,16,wall,r.root,-7,2.4,0);r.box(.35,4.8,16,wall,r.root,7,2.4,0);r.box(14,4.8,.35,wall,r.root,0,2.4,-8);
 for(const side of[-1,1])r.box(5.7,4.8,.35,wall,r.root,side*4.15,2.4,8);
 r.box(2.6,1.6,.35,wall,r.root,0,4,8);
 r.box(2.5,.1,.25,m.wood,r.root,0,.05,8);r.box(.18,3.3,.3,m.timber,r.root,-1.3,1.65,8);r.box(.18,3.3,.3,m.timber,r.root,1.3,1.65,8);
 r.box(2.6,.12,.4,m.timber,r.root,0,3.3,8);
 for(const z of[-6,-2,2,6]){r.box(14,.22,.22,m.timber,r.root,0,4.65,z);for(const x of[-6.8,6.8])r.box(.25,4.7,.25,m.timber,r.root,x,2.35,z)}
 r.box(3.2,.025,9,rug,r.root,0,.025,0);
 const collide=(x,z,w,d)=>r.colliders.push({x,z,w:w/2,d:d/2});
 const table=(x,z,w=2,d=1.4)=>{r.box(w,.18,d,m.wood,r.root,x,1.05,z);for(const sx of[-1,1])for(const sz of[-1,1])r.box(.12,1,.12,m.timber,r.root,x+sx*(w/2-.15),.5,z+sz*(d/2-.15));collide(x,z,w,d)};
 const chair=(x,z,rot=0)=>{const g=new r.root.constructor();r.root.add(g);g.position.set(x,0,z);g.rotation.y=rot;r.box(.68,.12,.65,m.wood,g,0,.56,0);r.box(.68,.75,.1,m.wood,g,0,1.0,-.27);for(const xx of[-.25,.25])for(const zz of[-.24,.24])r.box(.09,.55,.09,m.timber,g,xx,.28,zz);collide(x,z,.7,.7)};
 const bookColors=['#7c4d48','#526c65','#777052','#526477','#8c7466'].map(c=>r.material(c));
 const shelf=(x,z,w=3)=>{r.box(w,3.2,.65,m.wood,r.root,x,1.6,z);for(let y=.25;y<3.1;y+=.75){r.box(w+.12,.1,.85,m.timber,r.root,x,y,z+.12);for(let k=0;k<Math.floor(w/.25)-1;k++){const h=.36+r.r()*.25;r.box(.16,h,.35,bookColors[k%5],r.root,x-w/2+.3+k*.25,y+h/2+.06,z+.43)}}collide(x,z,w,.9)};
 const candle=(x,z,y=1.2)=>{r.cylinder(.06,.08,.28,m.white,r.root,x,y+.14,z);r.sphere(.055,m.glow,r.root,x,y+.33,z)};
 const window=(x,z)=>{r.box(.12,2.25,1.9,m.timber,r.root,x,2.7,z);r.box(.14,1.95,1.65,r.material('#88a6ad',{emissive:'#6e8b91',emissiveIntensity:.4}),r.root,x+(x<0?.02:-.02),2.7,z);r.box(.18,2.1,.08,m.wood,r.root,x,2.7,z);r.box(.18,.08,1.8,m.wood,r.root,x,2.7,z)};
 window(-6.79,2.5);window(6.79,2.5);
 // Real lights are restricted to the room, where their small count matters.
 r.roomLights?.(room==='archive'?'#b6c9df':'#ffd29b');
 if(room==='home'){
  const home=homePlan(r.hero.world.towns[r.hero.location.townId])[r.hero.location.homeId];
  shelf(-4.6,-6.8,3.3);shelf(4.6,-6.8,2.8);table(-4,-3.3,2.4,1.4);candle(-4,-3.3);chair(-5.3,-3.3,Math.PI/2);
  r.box(1.7,.65,3,m.timber,r.root,4.7,.33,1.2);r.box(1.6,.28,2.9,rug,r.root,4.7,.8,1.2);r.box(1.4,.16,.6,m.white,r.root,4.7,1.03,.2);collide(4.7,1.2,1.8,3.1);
  r.box(2,2.6,1,m.stone,r.root,-5.5,1.3,5.8);r.box(1.3,1.2,1.1,m.dark,r.root,-5.5,.7,5.8);r.sphere(.32,m.glow,r.root,-5.5,.55,6.4);collide(-5.5,5.8,2.1,1.2);
  if(home.kind==='merchant'){table(4.4,-2.2,2,1.4);for(let i=0;i<4;i++)r.box(.4,.4,.5,bookColors[i],r.root,3.7+i*.45,1.34,-2.2)}
  if(['guild','lodge'].includes(home.kind)){table(3.8,-2.6,2.4,1.6);r.box(1.8,.03,1.15,m.white,r.root,3.8,1.16,-2.6);r.sphere(.12,m.gold,r.root,4,1.25,-2.6)}
  if(home.kind==='barracks')for(let i=0;i<4;i++){r.box(.08,1.5,.08,m.iron,r.root,6.5,1.5,-3+i*.6);r.box(.4,.08,.12,m.gold,r.root,6.5,1.8,-3+i*.6)}
 }else if(room==='inn'){
  r.box(9.4,1.35,1.15,m.wood,r.root,0,.675,-5.7);collide(0,-5.7,9.4,1.15);shelf(3,-7,3);
  for(const[x,z]of[[-3.7,2.5],[3.7,2.5],[-4,-3.1]]){table(x,z);chair(x-.95,z,Math.PI/2);chair(x+.95,z,-Math.PI/2);candle(x,z)}
  r.box(1.6,.6,2.7,m.timber,r.root,5.3,.3,-1);r.box(1.5,.25,2.5,rug,r.root,5.3,.74,-1);r.box(1.3,.14,.5,m.white,r.root,5.3,.94,-1.9);collide(5.3,-1,1.7,2.9);
  r.box(2.1,2.8,1,m.stone,r.root,-5.4,1.4,-6.9);r.box(1.4,1.15,1.1,m.dark,r.root,-5.4,.7,-6.8);r.sphere(.4,m.glow,r.root,-5.4,.6,-6.17);collide(-5.4,-6.7,2.1,1.4);
  for(const x of[-2,0,2])r.cylinder(.13,.15,.25,m.gold,r.root,x,1.5,-5.7);
 }else if(room==='archive'){
  for(const[x,z]of[[-4.7,-6.8],[0,-6.8],[4.7,-6.8],[-5.3,-3.5],[5.3,-3.5]])shelf(x,z,3.1);
  table(-4,-3.1,2.5,1.7);table(3.5,1.6,2.4,1.6);chair(3.5,3,Math.PI);candle(-3.1,-3.1);candle(3.5,1.6);
  for(let i=0;i<4;i++)r.box(.55,.08,.8,bookColors[i],r.root,-4.3+i*.17,1.2+i*.07,-3.1);
  r.sphere(.36,r.material('#a1b7ac',{metalness:.4,roughness:.5}),r.root,3.4,1.55,1.6);
 }else if(room==='smith'){
  r.box(3.1,2.2,1.8,m.stone,r.root,4.5,1.1,-6.7);r.box(1.9,1.2,1.92,m.dark,r.root,4.5,.85,-6.6);r.box(1.6,.2,1.3,m.glow,r.root,4.5,.5,-6.2);r.box(1.2,2.6,1.1,m.stone,r.root,4.5,3.4,-6.8);collide(4.5,-6.5,3.2,2);
  r.cylinder(.45,.65,.8,m.wood,r.root,2.5,.4,-.5);r.box(1.25,.35,.5,m.iron,r.root,2.5,1,-.5);r.box(.6,.4,.4,m.iron,r.root,2.5,.7,-.5);collide(2.5,-.5,1.4,.9);
  table(-4,-3.1,3.8,1.5);for(let i=0;i<4;i++)r.box(.07,.06,1.05,m.iron,r.root,-5+i*.6,1.2,-3.1);
  for(let i=0;i<5;i++){r.box(.12,1.5,.1,m.iron,r.root,-6.6,1.5,1+i*.55);r.box(.15,.08,.4,m.gold,r.root,-6.6,2,1+i*.55)}r.barrel(5.5,3.9);
 }else if(room==='apothecary'){
  for(const[x,z]of[[-4.7,-6.8],[0,-6.8],[4.7,-6.8]]){shelf(x,z);for(let i=0;i<6;i++){const bottle=r.material(['#729d8e','#b69f6b','#957c9b'][i%3],{metalness:.15,roughness:.3});r.cylinder(.12,.15,.45,bottle,r.root,x-1.1+i*.42,1.25,z+.6);r.cylinder(.06,.06,.15,m.wood,r.root,x-1.1+i*.42,1.55,z+.6)}}
  table(-4,-3.1,2.5,1.6);r.sphere(.25,m.stone,r.root,-4,1.3,-3.1);r.box(1.8,.65,3,m.wood,r.root,4.5,.33,0);r.box(1.75,.25,2.95,m.white,r.root,4.5,.78,0);r.box(1.5,.18,.6,rug,r.root,4.5,1,-1);collide(4.5,0,1.9,3.1);
  for(let i=0;i<6;i++){r.cylinder(.025,.025,1.2,m.wood,r.root,-2.5+i,3.6,-6);r.mesh(new T.ConeGeometry(.18,.5,5),m.leaves,r.root,-2.5+i,2.95,-6)}
 }else if(room==='chapel'){
  r.box(3.8,1.25,1.4,m.stone,r.root,0,.625,-6);collide(0,-6,3.8,1.4);r.mesh(new T.TorusGeometry(1,.1,8,32),m.gold,r.root,0,2.7,-7.4);
  for(const side of[-1,1])for(const z of[2.3,-1.8]){const x=side*3.7;r.box(3,.2,.85,m.wood,r.root,x,.65,z);r.box(3,.7,.15,m.wood,r.root,x,1,z+.4);for(const xx of[-1.2,1.2])r.box(.18,.65,.65,m.timber,r.root,x+xx,.32,z);collide(x,z,3,.9)}
  for(const side of[-1,1])for(let i=0;i<5;i++)r.box(.15,2.3,.24,bookColors[i],r.root,side*6.78,2.65,-3+i*.25);
  table(-4,-3.5,2,1.1);candle(-4,-3.5);candle(-1.2,-6,1.3);candle(1.2,-6,1.3);
 }
}
