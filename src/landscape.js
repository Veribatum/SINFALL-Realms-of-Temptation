import * as T from '../vendor/three.module.js';
import {frontierSites,roadLinks,regionOf} from './frontier.js?v=17';

function path(r,x1,z1,x2,z2,width=3.6){const length=Math.hypot(x2-x1,z2-z1),p=r.box(width,.045,length,r.frontierRoad,r.root,(x1+x2)/2,.012,(z1+z2)/2);p.rotation.y=Math.atan2(x2-x1,z2-z1)}
function tower(r,x,z){const g=new T.Group();g.position.set(x,0,z-5);r.root.add(g);for(const side of[-1,1])r.box(.65,8,6,r.m.stone,g,side*3,4,0);r.box(6.5,8,.65,r.m.stone,g,0,4,-3);for(let i=0;i<4;i++)r.box(.85,.9,.85,r.m.stone,g,-3+i*2,8.4,-3);r.box(4,.16,4,r.m.wood,g,0,4,0);r.lamp(x-4,z+1)}
function camp(r,x,z){for(const side of[-1,1]){const g=new T.Group();g.position.set(x+side*6,0,z-3);r.root.add(g);const tent=r.mesh(new T.ConeGeometry(3,3.4,4),r.material(side<0?'#997553':'#697773'),g,0,1.5,0);tent.rotation.y=Math.PI/4;r.box(.8,1,.8,r.m.wood,g,3,.5,0)}r.cylinder(.8,1,.2,r.m.stone,r.root,x,.1,z-2);r.sphere(.3,r.m.glow,r.root,x,.45,z-2);r.barrel(x+4,z+3)}
function ruin(r,x,z){for(const side of[-1,1])for(const zz of[-6,0,6]){r.cylinder(.42,.6,zz===0?6:3.7,r.m.stone,r.root,x+side*6,zz===0?3:1.85,z+zz);r.box(1.3,.35,1.3,r.m.stone,r.root,x+side*6,zz===0?6:3.7,z+zz)}r.box(12,.3,1.3,r.m.stone,r.root,x,6.1,z);r.mesh(new T.TorusGeometry(2,.16,6,30),r.m.gold,r.root,x,4,z-5).rotation.x=.35}
function stones(r,x,z){for(let i=0;i<7;i++){const a=i/7*Math.PI*2,stone=r.mesh(new T.DodecahedronGeometry(1,0),r.m.stone,r.root,x+Math.sin(a)*5,1.3,z+Math.cos(a)*5);stone.scale.set(.7,2,.8)}r.cylinder(.9,1.4,.4,r.m.stone,r.root,x,.2,z-1)}
export function buildFrontier(r){
 const region=regionOf({id:r.hero.location.townId});r.frontierRoad=r.material(region.climate==='frost'?'#9da8a2':'#8c8269');
 path(r,-132,5,132,5,5);path(r,0,111,0,-154,6);
 for(const site of frontierSites({id:r.hero.location.townId})){path(r,0,5,site.x,site.z,3.4);const{x,z}=site;
  if(site.kind==='tower')tower(r,x,z);if(site.kind==='camp')camp(r,x,z);if(site.kind==='ruin')ruin(r,x,z);if(site.kind==='stones')stones(r,x,z);
  if(site.kind==='farm'){r.house(x-10,z-5,Math.PI/2,1);for(let i=0;i<5;i++)r.box(.5,.05,8,r.material('#5e4f3c'),r.root,x+6+i*1.4,.03,z-6)}
  if(site.kind==='mine'){for(let i=0;i<7;i++)r.rock(x+(i-3)*2.4,z-7,2+r.r());r.box(1,4,.9,r.m.wood,r.root,x-2,2,z-4);r.box(1,4,.9,r.m.wood,r.root,x+2,2,z-4);r.box(5,1,.9,r.m.wood,r.root,x,4.2,z-4);r.barrel(x+5,z)}
  if(site.kind==='shrine'){r.cylinder(1,1.4,.6,r.m.stone,r.root,x,.3,z-2);r.mesh(new T.TorusGeometry(1.1,.15,8,24),r.m.gold,r.root,x,2.3,z-2);r.sphere(.3,r.m.glow,r.root,x,2.3,z-2);r.lamp(x+3,z+1)}
  if(site.kind==='bridge'){r.box(6,.14,23,r.m.water,r.root,x+3,-.025,z-6);r.box(8,.15,3,r.m.wood,r.root,x+3,.13,z);for(const side of[-1,1])for(let i=0;i<5;i++)r.box(.13,1,.13,r.m.wood,r.root,x-1+i*2,.65,z+side*1.5)}
 }
 for(const link of roadLinks(r.hero.location.townId,r.hero.world.towns.length)){r.box(.18,3,.18,r.m.wood,r.root,link.x-2,1.5,link.z);r.box(3,.6,.14,r.m.wood,r.root,link.x-2,2.5,link.z);r.lamp(link.x+2,link.z)}
 if(['coast','mist'].includes(region.climate)){r.box(14,.08,280,r.m.water,r.root,142,-.025,-10);for(let i=0;i<22;i++)r.rock(132+r.r()*8,-140+i*12,1.5+r.r()*2)}
}
export function buildOutskirts(r){
 r.frontierRoad=r.material('#938973');for(const x of[-42,42])path(r,x,-65,x,57,5);for(const z of[-48,42,55])path(r,-65,z,65,z,5);path(r,0,33,0,66,7);
 for(const[x,z,rot]of[[-59,-48,Math.PI/2],[59,-48,-Math.PI/2],[-59,7,Math.PI/2],[59,7,-Math.PI/2],[-59,46,Math.PI/2],[59,46,-Math.PI/2]])r.house(x,z,rot,1);
 r.market(-20,45);r.market(22,46);r.lamp(-40,28);r.lamp(40,-23);r.lamp(-39,-34);r.lamp(39,51);r.box(9,.22,6,r.m.wood,r.root,29,.12,42);
 const crop=r.material('#869153');for(let i=0;i<7;i++)for(let j=0;j<6;j++){r.mesh(new T.ConeGeometry(.2,.65,4),crop,r.root,-64+i*1.5,.34,22+j*1.8)}
 for(let i=0;i<6;i++)r.tree(-55+i*3.5,-69,1.1);for(let i=0;i<3;i++)r.chicken(-43+i*2,44,i+20);
}
