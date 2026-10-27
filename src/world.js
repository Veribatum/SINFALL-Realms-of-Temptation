import * as T from '../vendor/three.module.js';
import {seeded,entitiesFor,locationId,townOf,visitState,objective,syncRealm} from './model.js?v=6';
import {loadActor,createActor,animateActor,disposeActor} from './actors.js?v=6';
import {batchScenery,cameraPosition} from './scene-utils.js?v=6';
import {buildInterior} from './interiors.js?v=6';
import {appearanceKey} from './appearance.js?v=6';
import {styleActor} from './actor-style.js?v=6';
import {BOUNDS,regionOf,frontierSites,roadLinks} from './frontier.js?v=6';
import {buildFrontier,buildOutskirts} from './landscape.js?v=6';
import {surfaceHeight,navigable,centerOf} from './atlas.js?v=6';
import {buildOpenWorld,updateOpenWorld} from './overworld.js?v=6';
const sceneKey=h=>h.world.seed+':'+(h.location.type==='realm'?'realm':locationId(h));

const TAU=Math.PI*2;
export class Realm {
 constructor(canvas,{hero,onNear,onInteract,onRumor,onTick,onEncounter,onStep,onRegion,paused,quality='high'}){
  this.canvas=canvas;this.hero=hero;this.callbacks={onNear,onInteract,onRumor,onTick,onEncounter,onStep,onRegion,paused};this.quality=quality;this.destroyed=false;this.last=performance.now();this.elapsed=0;this.yaw=hero.position.yaw??Math.PI;this.pitch=.48;this.keys=new Set();this.joy={x:0,y:0};this.events=[];this.colliders=[];this.entities=[];this.near=null;this.walkTime=0;this.firstPerson=false;this.materials=[];this.textures=[];this.lastRumor=0;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});this.renderer.setPixelRatio(Math.min(quality==='high'?1.65:1,devicePixelRatio||1));this.renderer.shadowMap.enabled=quality==='high';this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(62,1,.12,240);this.ray=new T.Raycaster();this.v3=new T.Vector3();this.build();this.inputs();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
 }
 material(color,extra={}){this.materialCache??=new Map();const key=color+JSON.stringify(Object.entries(extra).map(([k,v])=>[k,v?.uuid||v]));if(this.materialCache.has(key))return this.materialCache.get(key);const m=new T.MeshStandardMaterial({color,roughness:.9,...extra});this.materials.push(m);this.materialCache.set(key,m);return m}
 mesh(geometry,material,parent=this.root,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 box(w,h,d,m,parent,x=0,y=0,z=0){return this.mesh(new T.BoxGeometry(w,h,d),m,parent,x,y,z)}
 sphere(r,m,parent,x=0,y=0,z=0){return this.mesh(new T.SphereGeometry(r,12,9),m,parent,x,y,z)}
 cylinder(top,bottom,h,m,parent,x=0,y=0,z=0,n=12){return this.mesh(new T.CylinderGeometry(top,bottom,h,n),m,parent,x,y,z)}
 texture(kind){
  this.textureCache??=new Map();if(this.textureCache.has(kind))return this.textureCache.get(kind);const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),r=seeded(kind==='stone'?719:132);
  ctx.fillStyle=kind==='stone'?'#625e52':kind==='roof'?'#33434a':kind==='wood'?'#5d4835':'#706b5a';ctx.fillRect(0,0,512,512);
  if(kind==='wood'){for(let i=0;i<140;i++){ctx.strokeStyle=`rgba(${r()>.5?'0,0,0':'230,209,169'},${r()*.16})`;ctx.beginPath();const x=r()*512;ctx.moveTo(x,0);ctx.bezierCurveTo(x+r()*16,160,x-r()*18,330,x,512);ctx.stroke()}}
  else{const rows=kind==='roof'?16:kind==='stone'?8:16,hh=512/rows,ww=kind==='roof'?48:kind==='stone'?86:42;for(let y=0;y<rows;y++)for(let x=-1;x<512/ww+1;x++){const px=x*ww+(y%2)*ww/2,shade=kind==='roof'?40+r()*20:75+r()*55;ctx.fillStyle=kind==='roof'?`rgb(${shade*.7},${shade*.9},${shade})`:`rgb(${shade},${shade*.96},${shade*.84})`;ctx.fillRect(px+2,y*hh+2,ww-4,hh-4);ctx.strokeStyle='#ffffff12';ctx.strokeRect(px+3,y*hh+3,ww-6,hh-6)}}
  for(let i=0;i<9000;i++){ctx.fillStyle=r()>.5?'#0000000c':'#ffffff0a';ctx.fillRect(r()*512,r()*512,2,2)}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;this.textures.push(tex);this.textureCache.set(kind,tex);return tex;
 }
 clearScene(){if(this.root){for(const actor of this.actors||[])disposeActor(actor);this.root.traverse(o=>o.geometry?.dispose());this.scene.remove(this.root)}for(const m of this.materials)m.dispose();for(const t of this.textures)t.dispose();this.materials=[];this.textures=[];this.textureCache=new Map();this.materialCache=new Map();this.actors=[];for(const light of this.scene.children.filter(o=>o.isLight))this.scene.remove(light)}
 build(){
  this.clearScene();this.root=new T.Group();this.scene.add(this.root);this.staticKey=sceneKey(this.hero);this.colliders=[];this.entities=[];this.animals=[];this.people=[];this.particles=[];this.fires=[];this.dynamic=new T.Group();this.root.add(this.dynamic);this.r=seeded(townOf(this.hero).seed);this.crypt=this.hero.location.type==='dungeon';this.indoor=this.hero.location.type==='interior';this.firstPerson=false;this.open=this.hero.location.type==='realm';this.wild=this.hero.location.type==='wilds'||this.open&&this.hero.location.area==='wilds';this.entityRegion=this.hero.location.townId;this.openChunks=null;this.encounterNoticed=new Set();this.waypoint=null;
  const p=this.hero.position;this.yaw=p.yaw??Math.PI;
  this.m={wood:this.material('#5b4430',{map:this.texture('wood')}),timber:this.material('#30291f'),stone:this.material('#a49b82',{map:this.texture('stone')}),roof:this.material(townOf(this.hero).climate==='autumn'?'#786451':'#627077',{map:this.texture('roof')}),plaster:this.material('#cebea0'),gold:this.material('#c99b4c',{metalness:.65,roughness:.35}),iron:this.material('#465052',{metalness:.7,roughness:.5}),water:this.material('#527f81',{metalness:.6,roughness:.2,transparent:true,opacity:.82}),leaves:this.material(townOf(this.hero).climate==='autumn'?'#8d713c':'#3b6548'),dark:this.material('#222c2c'),glow:this.material('#ecc07a',{emissive:'#e6a442',emissiveIntensity:1.5}),white:this.material('#dfd6bb')};
  if(this.crypt)this.buildDungeon();else if(this.indoor)buildInterior(this);else if(this.open)buildOpenWorld(this);else this.buildLandscape();this.spawnEntities();
  this.player=this.humanoid(this.hero.skin,this.hero.outfit,this.hero.hair,this.hero.raceId,this.hero.classId,{hero:this.hero});this.root.add(this.player);this.player.position.set(p.x,this.groundAt(p.x,p.z),p.z);this.player.rotation.y=this.yaw;this.playerStyleKey=appearanceKey(this.hero);
  this.addParticles();this.batchStats=this.open?{savedDraws:0}:batchScenery(this.root,[this.dynamic,this.player,...this.people.map(p=>p.g),...this.animals.map(a=>a.g)]);this.lastNearId=null;this.near=null;this.resize();
 }
 lightSetup(){
  const climate=townOf(this.hero).climate,haze=regionOf(townOf(this.hero)).sky;this.daySky=new T.Color(haze);this.nightSky=new T.Color('#182837');this.scene.background=new T.Color(this.crypt?'#101d20':haze);this.scene.fog=new T.FogExp2(this.crypt?'#132328':haze,this.crypt?.035:climate==='mist'?.018:this.wild?.012:.009);
  if(this.indoor){this.scene.background=new T.Color('#302d2a');this.scene.fog=new T.FogExp2('#302d2a',.015)}
  this.ambient=new T.HemisphereLight(this.crypt?0x9ebfbd:0xbfd9df,this.crypt?0x29302f:0x5c604d,this.crypt?1.2:this.indoor?1.3:1.8);this.scene.add(this.ambient);
  this.sun=new T.DirectionalLight(0xffd8a1,this.crypt?.25:3.2);this.sun.position.set(-20,32,15);this.sun.castShadow=!this.crypt&&this.quality==='high';this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-38,right:38,top:38,bottom:-38,far:110});this.sun.shadow.bias=-.001;this.scene.add(this.sun);this.root.add(this.sun.target);
  if(this.crypt){this.torch=new T.PointLight(0xffc581,20,19,1.6);this.scene.add(this.torch)}
  else this.torch=null;
  if(this.indoor){this.sun.intensity=.7;this.sun.castShadow=false}
 }
 roomLights(color){for(const[x,y,z]of[[-4,3,-4],[4,3,-3],[0,3,3]]){const light=new T.PointLight(color,14,13,1.7);light.position.set(x,y,z);this.root.add(light)}}
 buildLandscape(){
  this.lightSetup();const region=regionOf(townOf(this.hero)),ground=this.material(region.ground);this.m.leaves=this.material(region.leaves);this.mesh(new T.PlaneGeometry(this.wild?370:230,this.wild?370:230),ground,this.root,0,-.08,-24).rotation.x=-Math.PI/2;
  const roadTex=this.texture('road');roadTex.repeat.set(2,16);const road=this.material('#b3a58b',{map:roadTex});this.box(this.wild?6.5:8,.06,this.wild?290:145,road,this.root,0,-.01,-12);
  if(!this.wild){
   this.box(32,.05,8,road,this.root,0,0,1);this.box(29,.05,5,road,this.root,0,0,15);
   const homes=[[-15,11,Math.PI/2], [15,7,-Math.PI/2],[-15,-9,Math.PI/2],[15,-12,-Math.PI/2],[-15,-27,Math.PI/2],[15,-29,-Math.PI/2]];
   homes.forEach(([x,z,rot],i)=>this.house(x,z,rot,i));buildOutskirts(this);this.chapel(0,-35);this.well(0,0);this.market(16,21);this.market(-14,26);this.gate(0,33);
   for(let side of[-1,1])for(let i=0;i<14;i++){const z=27-i*5.2,x=side*24;this.box(.18,1.35,.18,this.m.wood,this.root,x,.67,z);if(i<13){this.box(.12,.14,5.3,this.m.wood,this.root,x,1,z-2.6);this.box(.12,.13,5.3,this.m.wood,this.root,x,.48,z-2.6)}}
   for(const[x,z]of[[-6,18],[6,8],[-6,-12],[6,-23],[-8,-32]])this.lamp(x,z);
   for(let i=0;i<9;i++)this.chicken((this.r()-.5)*13,22-this.r()*48,i);
   for(let i=0;i<(this.quality==='high'?6:3);i++){const g=this.humanoid(['#c49b78','#8c6248','#d2b292'][i%3],['#74664d','#5b7772','#7d5862','#786a80'][i%4],'#49382c',i===5?'elf':'human','citizen');g.position.set(i%2?-4:4,0,17-i*6);this.root.add(g);this.people.push({g,home:g.position.clone(),seed:i*1.73,speed:.55+this.r()*.3,waypoint:0,route:[[i%2?-4:4,20],[i%2?-5:5,5],[i%2?-5:5,-18],[i%2?-4:4,-28]]})}
   this.box(6,.08,140,this.m.water,this.root,29,-.025,-23);for(let i=0;i<18;i++){this.rock(25+this.r()*1.5,-66+i*7,1+this.r()*.8);this.rock(33+this.r()*2,-66+i*7,.7+this.r())}
  }else{
   const shrine=new T.Group();shrine.position.set(-13,0,8);this.root.add(shrine);this.cylinder(.9,1.2,.4,this.m.stone,shrine,0,.2,0);this.box(.6,2.5,.5,this.m.stone,shrine,0,1.4,0);this.box(1.7,.4,.5,this.m.stone,shrine,0,2.1,0);
   this.ruins(-7,-8);this.gate(0,-35,true);buildFrontier(this);for(let i=0;i<18;i++)this.rock((this.r()-.5)*45,-35+this.r()*55,.5+this.r()*1.2);
  }
  const entities=entitiesFor(this.hero),sites=frontierSites(townOf(this.hero)),links=roadLinks(this.hero.location.townId,this.hero.world.towns.length);
  const nearPath=(x,z)=>{if(Math.abs(x)<8||Math.abs(z-5)<7)return true;for(const q of sites){const dx=q.x,dz=q.z-5,t=Math.max(0,Math.min(1,(x*dx+(z-5)*dz)/(dx*dx+dz*dz)));if(Math.hypot(x-t*dx,z-5-t*dz)<4)return true}return false};
  for(let i=0;i<(this.quality==='high'?210:105);i++){const x=(this.r()-.5)*(this.wild?280:150),z=(this.wild?118:65)-this.r()*(this.wild?280:140);if(this.wild?nearPath(x,z):Math.abs(x)<68&&z>-73)continue;if(entities.some(e=>Math.hypot(e.x-x,e.z-z)<5))continue;this.tree(x,z,.9+this.r()*1.2)}
  for(let i=0;i<10;i++){const mountain=this.mesh(new T.ConeGeometry(18+this.r()*16,35+this.r()*25,7),this.material('#5c7574'),this.root,(i-5)*31,8,-110-this.r()*35);mountain.rotation.y=this.r()*TAU}
  this.castle(-7,-98);
  // Instanced meadow blades keep the landscape lush without thousands of draw calls.
  const blades=new T.InstancedMesh(new T.ConeGeometry(.12,.45,3),this.material('#657849'),this.quality==='high'?1400:500),dummy=new T.Object3D();
  for(let i=0;i<blades.count;i++){let x=(this.r()-.5)*(this.wild?290:155),z=(this.wild?125:70)-this.r()*(this.wild?295:150);if(Math.abs(x)<6)x+=x<0?-8:8;dummy.position.set(x,.15,z);dummy.rotation.set((this.r()-.5)*.3,this.r()*TAU,0);dummy.scale.setScalar(.5+this.r());dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix)}this.root.add(blades);
 }
 house(x,z,rot,index){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;this.root.add(g);const w=7,d=6,h=index%2?4.8:4.2;
  this.box(w,.7,d,this.m.stone,g,0,.35,0);this.box(w-.15,h-.5,d-.15,this.m.plaster,g,0,(h+.5)/2,0);
  for(const xx of[-w/2+.08,0,w/2-.08])this.box(.18,h,.22,this.m.timber,g,xx,h/2,d/2);for(const yy of[.9,2.7,h-.05])this.box(w,.18,.2,this.m.timber,g,0,yy,d/2);
  for(const xx of[-w/2,w/2]){this.box(.17,h,d,this.m.timber,g,xx,h/2,0);for(const zz of[-2,0,2])this.box(.18,h,.18,this.m.timber,g,xx,h/2,zz)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-4,h,-3.6,4,h,-3.6,0,h+2.6,-3.6,-4,h,3.6,0,h+2.6,3.6,4,h,3.6,-4,h,-3.6,0,h+2.6,-3.6,-4,h,3.6,-4,h,3.6,0,h+2.6,-3.6,0,h+2.6,3.6,4,h,-3.6,4,h,3.6,0,h+2.6,-3.6,4,h,3.6,0,h+2.6,3.6,0,h+2.6,-3.6],3));const roofPositions=geo.attributes.position;for(let i=0;i<roofPositions.count;i+=3){const x=roofPositions.getX(i+1),y=roofPositions.getY(i+1),z=roofPositions.getZ(i+1);roofPositions.setXYZ(i+1,roofPositions.getX(i+2),roofPositions.getY(i+2),roofPositions.getZ(i+2));roofPositions.setXYZ(i+2,x,y,z)}geo.computeVertexNormals();this.mesh(geo,this.m.roof,g);
  this.box(.26,.25,7.5,this.m.timber,g,0,h+2.6,0);this.box(.8,2.1,.8,this.m.stone,g,2,h+1.2,-1.2);
  this.box(1.25,2.35,.15,this.m.wood,g,0,1.22,3.04);this.cylinder(.68,.68,.12,this.m.wood,g,0,2.35,3.04,16).rotation.x=Math.PI/2;this.sphere(.065,this.m.gold,g,.42,1.12,3.15);
  for(const xx of[-2.2,2.2]){this.box(1.1,1.2,.12,this.m.timber,g,xx,2.05,3.05);this.box(.85,.95,.14,this.m.glow,g,xx,2.05,3.1);this.box(.07,1.1,.08,this.m.wood,g,xx,2.05,3.21);this.box(.92,.07,.08,this.m.wood,g,xx,2.05,3.21);this.box(1.28,.16,.6,this.m.wood,g,xx,1.38,3.22)}
  this.box(1.6,.18,1.1,this.m.stone,g,0,.09,3.4);this.box(2,.25,.12,this.m.wood,g,0,3.3,3.6);this.box(.12,.8,.12,this.m.iron,g,-.8,3.7,3.55);this.box(.12,.8,.12,this.m.iron,g,.8,3.7,3.55);
  this.colliders.push({x,z,w:w/2+.3,d:d/2+.3,rotation:rot,height:h+2.6});
  this.barrel(x+(x<0?4.3:-4.3),z+3);this.box(.8,.8,.8,this.m.wood,this.root,x+(x<0?4.6:-4.6),.4,z-3);
 }
 chapel(x,z){this.house(x,z,0,0);const g=new T.Group();g.position.set(x,0,z);this.root.add(g);this.box(3.2,11,3.2,this.m.stone,g,0,5.5,0);this.mesh(new T.ConeGeometry(2.7,5,4),this.m.roof,g,0,13,0).rotation.y=Math.PI/4;this.mesh(new T.TorusGeometry(1,.1,6,32),this.m.gold,g,0,11.5,1.7);this.box(.18,2,.15,this.m.gold,g,0,16.4,0);this.box(.9,.16,.15,this.m.gold,g,0,16.6,0)}
 castle(x,z){const g=new T.Group();g.position.set(x,0,z);this.root.add(g);const mat=this.material('#647575');this.box(16,18,9,mat,g,0,9,0);for(const xx of[-8,8]){this.cylinder(2.4,3,26,mat,g,xx,13,0);this.mesh(new T.ConeGeometry(3.1,8,8),this.m.roof,g,xx,30,0)}this.cylinder(2,2.5,36,mat,g,0,18,0);this.mesh(new T.ConeGeometry(3,11,6),this.m.roof,g,0,40,0);this.mesh(new T.TorusGeometry(6,.2,6,48),this.m.gold,g,0,38,0)}
 well(x,z){const g=new T.Group();g.position.set(x,0,z);this.root.add(g);this.mesh(new T.TorusGeometry(1.3,.28,6,16),this.m.stone,g,0,.9,0).rotation.x=Math.PI/2;this.cylinder(1.35,1.5,.75,this.m.stone,g,0,.4,0);this.cylinder(1.1,1.1,.05,this.m.water,g,0,.88,0);for(const xx of[-1.5,1.5])this.box(.15,2.6,.15,this.m.wood,g,xx,1.5,0);this.mesh(new T.ConeGeometry(2.4,1.1,4),this.m.roof,g,0,3,0).rotation.y=Math.PI/4;this.colliders.push({x,z,r:1.6})}
 market(x,z){const g=new T.Group();g.position.set(x,0,z);this.root.add(g);for(const xx of[-2,2])for(const zz of[-1,1])this.box(.12,3,.12,this.m.wood,g,xx,1.5,zz);const cloth=this.material('#977044',{side:T.DoubleSide});this.mesh(new T.PlaneGeometry(4.6,3),cloth,g,0,3,0).rotation.x=-1.3;this.box(4,.8,1.6,this.m.wood,g,0,.8,0);for(let i=0;i<15;i++)this.sphere(.15,this.material(i%2?'#9e493a':'#aaa05c'),g,(this.r()-.5)*3.5,1.36,(this.r()-.5)*1.2);this.colliders.push({x,z,w:2.2,d:1.3})}
 barrel(x,z){const g=new T.Group();g.position.set(x,0,z);this.root.add(g);this.cylinder(.42,.38,1.1,this.m.wood,g,0,.55,0);for(const y of[.22,.88])this.cylinder(.44,.44,.09,this.m.iron,g,0,y,0)}
 lamp(x,z){this.box(.14,3.5,.14,this.m.iron,this.root,x,1.75,z);this.box(.7,.08,.08,this.m.iron,this.root,x+.28,3.42,z);this.box(.4,.55,.4,this.m.glow,this.root,x+.52,3.1,z);this.mesh(new T.ConeGeometry(.38,.3,4),this.m.iron,this.root,x+.52,3.5,z).rotation.y=Math.PI/4;if(this.quality==='high'){const l=new T.PointLight(0xffc174,3.5,7,2);l.position.set(x+.52,2.8,z);this.root.add(l);this.fires.push(l)}}
 gate(x,z,ruin=false){const g=new T.Group();g.position.set(x,0,z);this.root.add(g);for(const xx of[-3.5,3.5]){this.box(1.4,ruin?6:4.7,1.6,ruin?this.m.stone:this.m.wood,g,xx,ruin?3:2.35,0)}this.box(8.4,1,1.6,ruin?this.m.stone:this.m.wood,g,0,ruin?6:4.4,0);if(ruin){this.box(5.5,5,.5,this.m.dark,g,0,2.5,-.4);this.mesh(new T.TorusGeometry(1.6,.15,6,32),this.material('#799e9a',{emissive:'#335f60'}),g,0,3,.1)} }
 ruins(x,z){for(let i=0;i<6;i++){const a=i*TAU/6;this.cylinder(.3,.5,2+this.r(),this.m.stone,this.root,x+Math.sin(a)*2,1.2,z+Math.cos(a)*2)}this.mesh(new T.TorusGeometry(1.7,.14,6,24),this.m.gold,this.root,x,.3,z).rotation.x=Math.PI/2}
 rock(x,z,size){const m=this.mesh(new T.DodecahedronGeometry(size,0),this.m.stone,this.root,x,size*.3,z);m.scale.y=.6;m.rotation.set(this.r(),this.r(),this.r())}
 tree(x,z,size){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);this.root.add(g);this.cylinder(.12,.35,4,this.m.wood,g,0,2,0,7);for(let i=0;i<3;i++){const top=this.mesh(new T.IcosahedronGeometry(1.7-i*.25,1),this.m.leaves,g,(this.r()-.5)*1.2,3.3+i*.85,(this.r()-.5));top.scale.y=.8}this.colliders.push({x,z,r:.35*size})}
 humanoid(skin,color,hair,race='human',kind='citizen',options={}){
  const g=new T.Group(),sk=this.material(skin),cloth=this.material(color),boot=this.m.dark,hr=this.material(hair),joints={};const dwarf=race==='dwarf';g.scale.setScalar(dwarf?.85:1);
  this.mesh(new T.CapsuleGeometry(.28,.49,4,10),cloth,g,0,1.22,0);this.sphere(.245,sk,g,0,1.96,0);const cap=this.sphere(.252,hr,g,0,2.05,-.025);cap.scale.y=.62;this.box(.51,.1,.36,this.m.wood,g,0,.95,0);this.box(.12,.12,.39,this.m.gold,g,0,.96,.01);
  for(const side of[-1,1]){
   const arm=new T.Group();arm.position.set(side*.35,1.51,0);g.add(arm);this.mesh(new T.CapsuleGeometry(.09,.44,4,8),cloth,arm,0,-.25,0);this.sphere(.09,sk,arm,0,-.59,0);joints[side<0?'armL':'armR']=arm;
   const leg=new T.Group();leg.position.set(side*.145,.93,0);g.add(leg);this.mesh(new T.CapsuleGeometry(.105,.5,4,8),boot,leg,0,-.38,0);this.box(.23,.18,.35,boot,leg,0,-.84,.05);joints[side<0?'legL':'legR']=leg;
   this.sphere(.026,this.m.dark,g,side*.085,1.99,.223);if(race==='elf'||race==='fae'){const ear=this.mesh(new T.ConeGeometry(.065,.3,5),sk,g,side*.27,2.02,0);ear.rotation.z=-side*1.2}if(race==='duskborn'){const horn=this.mesh(new T.ConeGeometry(.06,.27,6),this.m.iron,g,side*.14,2.28,-.03);horn.rotation.z=-side*.3}
  }
  const cloak=this.mesh(new T.ConeGeometry(.43,1.1,9,1,true,Math.PI*.6,Math.PI*.8),cloth,g,0,1.2,-.06);cloak.rotation.x=-.08;
  if(kind!=='citizen'){this.box(.08,1.25,.1,this.m.iron,g,.42,.78,-.08).rotation.z=-.15;this.box(.38,.07,.12,this.m.gold,g,.47,1.2,-.08)}
  g.userData.joints=joints;if(this.renderer){const n=(kind+color+hair).split('').reduce((a,c)=>a+c.charCodeAt(0),0),appearance=options.appearance||{raceId:race,skin,outfit:color,hair,gender:n%2?'female':'male',hairStyle:['cropped','long','swept','braid'][n%4],face:['soft','regal','angular','round'][n%4]};this.attachActor(g,{race,color,skin,hair,kind,appearance,...options})}return g;
 }
 attachActor(group,options){
  const root=this.root,token=(group.userData.loadToken||0)+1;group.userData.loadToken=token;const previous=group.userData.rig,placeholder=[...group.children].filter(c=>c!==previous);
  loadActor(options.kind,options.hero||options.appearance).then(source=>{if(this.destroyed||root!==this.root||!group.parent||group.userData.loadToken!==token)return;const model=createActor(source,options);if(options.hero)styleActor(model,options.hero);for(const child of placeholder)child.visible=false;if(previous){previous.removeFromParent();disposeActor(previous);this.actors=this.actors.filter(a=>a!==previous)}group.add(model);if(options.race==='dwarf')group.scale.setScalar(1);group.userData.rig=model;this.actors.push(model)}).catch(error=>{if(!this.actorError){this.actorError=true;console.warn('Character models could not load; keeping the local fallback.',error.message)}});
 }

 chicken(x,z,i){const g=new T.Group();g.position.set(x,0,z);this.root.add(g);const body=this.sphere(.25,this.m.white,g,0,.36,0);body.scale.z=1.4;this.sphere(.14,this.m.white,g,0,.61,.23);this.mesh(new T.ConeGeometry(.07,.14,6),this.m.gold,g,0,.6,.38).rotation.x=Math.PI/2;this.box(.06,.13,.13,this.material('#af4637'),g,0,.77,.22);for(const side of[-1,1])this.cylinder(.02,.02,.18,this.m.gold,g,side*.12,.1,0,5);this.animals.push({g,x,z,seed:i*2.1})}
 buildDungeon(){
  this.lightSetup();const d=townOf(this.hero).dungeon,size=17*4,wallmat=this.material('#8b8a79',{map:this.texture('stone')}),floortex=this.texture('road');floortex.repeat.set(15,15);const fm=this.material('#888877',{map:floortex});this.mesh(new T.PlaneGeometry(size,size),fm,this.root,size/2,-.02,size/2).rotation.x=-Math.PI/2;this.mesh(new T.PlaneGeometry(size,size),this.material('#252e2d',{side:T.DoubleSide}),this.root,size/2,4.8,size/2).rotation.x=Math.PI/2;
  const blocks=d.grid.flat().filter(v=>v).length,im=new T.InstancedMesh(new T.BoxGeometry(4,4.8,4),wallmat,blocks),dummy=new T.Object3D();let n=0;
  for(let y=0;y<17;y++)for(let x=0;x<17;x++){if(d.grid[y][x]){dummy.position.set(x*4+2,2.4,y*4+2);dummy.updateMatrix();im.setMatrixAt(n++,dummy.matrix)}else if((x+y)%7===0){this.cylinder(.16,.21,.45,this.m.iron,this.root,x*4+1,2.8,y*4+.25);this.sphere(.15,this.m.glow,this.root,x*4+1,3.16,y*4+.25)}}this.root.add(im);
  this.dungeonWalls=im;this.firstPerson=true;
 }
 entityModel(e){
  let g=new T.Group();const m=this.m;
  if(e.type==='npc'){const a=e.appearance||{gender:e.portrait>=4?'male':'female',skin:['#bf9575','#976e51','#d1ad8c'][e.portrait%3],outfit:['#54766d','#806353','#65788d','#8b6b78'][e.portrait%4],hair:e.portrait%2?'#b7b1a0':'#3d3024',hairStyle:['short','long','braid','swept'][e.portrait%4]};g=this.humanoid(a.skin,a.outfit,a.hair,a.raceId||'human',e.role,{appearance:a});this.people.push({g,home:new T.Vector3(e.x,0,e.z),seed:e.portrait,speed:e.routine?.length ? .5 : 0,route:e.routine,waypoint:0,entity:e})}
  else if(e.type==='encounter'){g=this.humanoid('#b99578','#7d6b82','#39312b','human',e.kind);this.people.push({g,home:new T.Vector3(e.x,0,e.z),seed:3,speed:.75,entity:e,approach:true})}
  else if(e.type==='landmark'||e.type==='route'){this.cylinder(.11,.15,2.6,m.wood,g,1,1.3,0,6);this.box(1.4,.5,.1,m.gold,g,1,2.3,0);this.mesh(new T.RingGeometry(.65,.78,20),this.material('#bbd4b4',{side:T.DoubleSide,transparent:true,opacity:.4}),g,0,.06,0).rotation.x=-Math.PI/2}
  else if(e.type==='door'){const plaque=this.box(1.5,.5,.12,m.wood,g,0,2.8,0);g.rotation.y=e.rotation??(e.x<0?Math.PI/2:e.x>0?-Math.PI/2:0);this.box(1.3,.32,.14,m.gold,g,0,2.8,.02);this.mesh(new T.RingGeometry(.65,.8,24),this.material('#bdd6b0',{side:T.DoubleSide,transparent:true,opacity:.5}),g,0,.07,0).rotation.x=-Math.PI/2}
  else if(e.type==='detail'){this.box(.9,.7,.7,m.wood,g,0,.35,-1);this.box(.66,.1,.5,m.gold,g,0,.77,-1);this.box(.57,.05,.44,m.white,g,0,.84,-1)}
  else if(e.type==='enemy'||e.type==='boss'){
   if(e.kind==='wolf'){const fur=this.material('#4c5350');const body=this.sphere(.5,fur,g,0,.62,0);body.scale.set(.7,.75,1.3);this.sphere(.27,fur,g,0,.91,.65);for(const s of[-1,1]){this.mesh(new T.ConeGeometry(.12,.3,5),fur,g,s*.17,1.2,.65);for(const zz of[-.38,.38])this.mesh(new T.CapsuleGeometry(.08,.34,4,7),fur,g,s*.28,.3,zz)}this.sphere(.035,m.glow,g,-.12,.98,.87);this.sphere(.035,m.glow,g,.12,.98,.87)}
   else{g=this.humanoid(e.type==='boss'?'#9ab5b2':'#adad9b',e.kind==='wraith'?'#749b9a':'#4e5357','#242b2b','hollow','oathbreaker');if(e.type==='boss'){g.scale.setScalar(1.5);this.mesh(new T.TorusGeometry(.46,.035,6,24),m.gold,g,0,2.6,0)}if(e.kind==='wraith')g.userData.float=true}
  }else if(e.type==='chest'){this.box(1.15,.65,.72,m.wood,g,0,.4,0);this.box(1.18,.18,.75,m.iron,g,0,.79,0);for(const x of[-.42,.42])this.box(.1,.76,.8,m.gold,g,x,.45,0);this.box(.15,.2,.05,m.gold,g,0,.65,.43)}
  else if(e.type==='artifact'){this.cylinder(1.1,1.4,.65,m.stone,g,0,.325,0);this.mesh(new T.TorusGeometry(.65,.14,10,40),m.gold,g,0,1.7,0);this.sphere(.32,this.material('#97ded0',{emissive:'#397e76',emissiveIntensity:2}),g,0,1.7,0);this.particles.push({g,spin:true})}
  else if(e.type==='herbs'){for(let i=0;i<7;i++)this.mesh(new T.ConeGeometry(.18,.65,5),this.material('#91baa1'),g,(this.r()-.5)*1.2,.3,(this.r()-.5)*1.2)}
  else if(e.type==='traveler'){g=this.humanoid('#c19a7b','#977b57','#3e3325');this.people.push({g,home:new T.Vector3(e.x,0,e.z),seed:2,speed:0})}
  else if(e.type==='board'){this.box(.13,2.5,.15,m.wood,g,0,1.25,0);this.box(1.7,1.2,.15,m.wood,g,0,2,0);for(let i=0;i<4;i++)this.box(.45,.65,.02,this.material('#d1c09a'),g,(i%2-.5)*.7,1.9+Math.floor(i/2)*.2,.1)}
  else if(e.type==='clue'){this.mesh(new T.OctahedronGeometry(.65),this.material('#84b8ae',{emissive:'#345c59',emissiveIntensity:.6}),g,0,.75,0);this.particles.push({g,spin:true})}
  else if(e.type==='shrine'&&this.crypt){this.cylinder(.8,1.1,.7,m.stone,g,0,.35,0);this.sphere(.3,this.material('#9dc9c1',{emissive:'#5b8c81',emissiveIntensity:1}),g,0,1.3,0)}
  else if(e.type==='exit'&&this.crypt){this.mesh(new T.TorusGeometry(1.3,.13,6,24),m.gold,g,0,1.7,0);this.box(2.6,.1,2.6,m.stone,g,0,0,0)}
  g.position.set(e.x,this.groundAt(e.x,e.z),e.z);g.userData.entity=e;this.dynamic.add(g);return g;
 }
 spawnEntities(){
  this.entitySignature=entitiesFor(this.hero).map(e=>e.id).join(',');
  for(const e of entitiesFor(this.hero)){const g=this.entityModel(e);this.entities.push({...e,g});if(e.marker){const gem=this.mesh(new T.OctahedronGeometry(.15),this.material(e.marker==='main'?'#f5cf79':'#9ec7b7',{emissive:e.marker==='main'?'#977137':'#517b72',emissiveIntensity:.8}),g,0,3,0);g.userData.marker=gem}}
 }
 refresh(){
  const key=sceneKey(this.hero);if(key!==this.staticKey){this.build();return}if(this.open)updateOpenWorld(this);if(this.entityRegion!==this.hero.location.townId){for(const e of this.entities){e.g.removeFromParent();if(e.g.userData.rig)disposeActor(e.g.userData.rig);e.g.traverse(o=>o.geometry?.dispose())}this.entities=[];this.people=[];this.particles=[];this.entityRegion=this.hero.location.townId;this.daySky.set(regionOf(townOf(this.hero)).sky)}const style=appearanceKey(this.hero);if(style!==this.playerStyleKey){if(this.player.userData.rig){styleActor(this.player.userData.rig,this.hero);if(this.player.userData.rig.userData.needsModelReload)this.attachActor(this.player,{hero:this.hero,race:this.hero.raceId,kind:this.hero.classId})}this.playerStyleKey=style}const states=entitiesFor(this.hero),ids=new Set(states.map(e=>e.id));
  for(const entity of this.entities.filter(e=>!ids.has(e.id))){entity.g.removeFromParent();this.people=this.people.filter(p=>p.g!==entity.g);this.particles=this.particles.filter(p=>p.g!==entity.g);if(entity.g.userData.rig){disposeActor(entity.g.userData.rig);this.actors=this.actors.filter(a=>a!==entity.g.userData.rig)}entity.g.traverse(o=>o.geometry?.dispose())}
  this.entities=this.entities.filter(e=>ids.has(e.id));
  for(const state of states){let e=this.entities.find(v=>v.id===state.id);if(!e){e={...state,g:this.entityModel(state)};this.entities.push(e)}e.marker=state.marker;if(state.marker&&!e.g.userData.marker)e.g.userData.marker=this.mesh(new T.OctahedronGeometry(.15),this.material('#f5cf79',{emissive:'#977137',emissiveIntensity:.8}),e.g,0,3,0);if(e.g.userData.marker)e.g.userData.marker.visible=!!state.marker}
  this.entitySignature=states.map(e=>e.id).join(',');
 }
 resize(){if(!this.renderer)return;const rect=this.canvas.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
 listen(target,event,fn,options){target.addEventListener(event,fn,options);this.events.push(()=>target.removeEventListener(event,fn,options))}
 inputs(){
  this.listen(window,'keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)||this.callbacks.paused())return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','shift','e','v'].includes(k))e.preventDefault();this.keys.add(k);if(k==='e'&&!e.repeat)this.callbacks.onInteract(this.near);if(k==='v'&&!e.repeat)this.firstPerson=!this.firstPerson});this.listen(window,'keyup',e=>this.keys.delete(e.key.toLowerCase()));this.listen(window,'blur',()=>{this.keys.clear();this.joy={x:0,y:0};this.drag=null});
  this.listen(this.canvas,'pointerdown',e=>{if(this.callbacks.paused())return;this.drag={x:e.clientX,y:e.clientY};this.canvas.setPointerCapture(e.pointerId)});
  this.listen(this.canvas,'pointermove',e=>{if(!this.drag)return;this.yaw-=(e.clientX-this.drag.x)*.006;this.pitch=Math.max(.15,Math.min(.85,this.pitch+(e.clientY-this.drag.y)*.003));this.drag={x:e.clientX,y:e.clientY}});for(const ev of['pointerup','pointercancel','lostpointercapture'])this.listen(this.canvas,ev,()=>this.drag=null);
  const stick=document.getElementById('joystick');if(stick){const move=e=>{const b=stick.getBoundingClientRect(),radius=b.width*.32,dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,len=Math.hypot(dx,dy)||1,scale=Math.min(1,radius/len);this.joy={x:dx*scale/radius,y:dy*scale/radius};stick.style.setProperty('--stick-x',dx*scale+'px');stick.style.setProperty('--stick-y',dy*scale+'px')};this.listen(stick,'pointerdown',e=>{e.preventDefault();stick.setPointerCapture(e.pointerId);this.stickDown=true;move(e)});this.listen(stick,'pointermove',e=>{if(this.stickDown)move(e)});for(const ev of['pointerup','pointercancel','lostpointercapture'])this.listen(stick,ev,()=>{this.stickDown=false;this.joy={x:0,y:0};stick.style.setProperty('--stick-x','0px');stick.style.setProperty('--stick-y','0px')})}
 }
 groundAt(x,z){return this.open?surfaceHeight(x,z,this.hero.world.seed):0}
 canMove(x,z,y){if(this.crypt){const d=townOf(this.hero).dungeon.grid,r=.28;for(const dx of[-r,r])for(const dz of[-r,r])if(d[Math.floor((z+dz)/4)]?.[Math.floor((x+dx)/4)]!==0)return false;return true}if(this.indoor&&(Math.abs(x)>6.5||z>7.4||z<-7.4))return false;if(this.open){if(!navigable(x,z,this.hero.world.seed))return false}else if(!this.indoor){const b=BOUNDS[this.wild?'wilds':'town'];if(x<b.minX||x>b.maxX||z<b.minZ||z>b.maxZ)return false}if(y!==undefined&&y<this.groundAt(x,z)+.15)return false;return !this.colliders.some(c=>{if(y!==undefined&&y>this.groundAt(c.x,c.z)+(c.height||7))return false;if(c.r)return Math.hypot(x-c.x,z-c.z)<c.r+.3;const dx=x-c.x,dz=z-c.z,a=c.rotation||0,xx=dx*Math.cos(a)-dz*Math.sin(a),zz=dx*Math.sin(a)+dz*Math.cos(a);return Math.abs(xx)<c.w+.3&&Math.abs(zz)<c.d+.3})}

 drawMinimap(){
  const c=document.getElementById('minimap');if(!c)return;const ctx=c.getContext('2d'),w=c.width,h=c.height,p=this.hero.position;ctx.clearRect(0,0,w,h);ctx.fillStyle='#0a171bea';ctx.fillRect(0,0,w,h);let project;
  if(this.crypt){const d=townOf(this.hero).dungeon,v=visitState(this.hero);v.discovered??=[];const xx=Math.floor(p.x/4),yy=Math.floor(p.z/4);for(let y=yy-2;y<=yy+2;y++)for(let x=xx-2;x<=xx+2;x++)if(x>=0&&y>=0&&x<17&&y<17&&!v.discovered.includes(y*17+x))v.discovered.push(y*17+x);const k=w/17;for(const n of v.discovered){const x=n%17,y=Math.floor(n/17);ctx.fillStyle=d.grid[y][x]?'#314142':'#a5a18c';ctx.fillRect(x*k,y*k,k-1,k-1)}project=(x,z)=>[x/68*w,z/68*h]}
  else{project=this.open?(x,z)=>[(x-p.x)/190*w+w/2,(z-p.z)/190*h+h/2]:this.indoor?(x,z)=>[(x/16+.5)*w,(z/18+.5)*h]:(x,z)=>{const b=BOUNDS[this.wild?'wilds':'town'];return[(x-b.minX)/(b.maxX-b.minX)*w,(z-b.minZ)/(b.maxZ-b.minZ)*h]};ctx.fillStyle='#6b6d58';const[a,b]=project(this.indoor?-6.5:-3,this.indoor?-7.4:-44),[aa,bb]=project(this.indoor?6.5:3,this.indoor?7.4:36);ctx.fillRect(a,b,aa-a,bb-b);for(const c of this.colliders.filter(c=>c.w)){const[x,y]=project(c.x-c.w,c.z-c.d),[xx,yy]=project(c.x+c.w,c.z+c.d);ctx.fillStyle='#657776';ctx.fillRect(x,y,xx-x,yy-y)}}
  if(this.wild&&!this.open){ctx.strokeStyle='#7b7963';ctx.lineWidth=2;const draw=(a,b)=>{const[x,y]=project(...a),[xx,yy]=project(...b);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke()};draw([-132,5],[132,5]);draw([0,111],[0,-154]);for(const site of frontierSites(townOf(this.hero)))draw([0,5],[site.x,site.z])}
  for(const e of this.entities){if(this.crypt&&!visitState(this.hero).discovered.includes(Math.floor(e.z/4)*17+Math.floor(e.x/4)))continue;if(e.type==='enemy'||e.type==='boss')ctx.fillStyle='#c07766';else if(e.marker)ctx.fillStyle='#e7c17c';else if(['exit','gate','travel','route','landmark'].includes(e.type))ctx.fillStyle='#9ac2b3';else continue;const[x,y]=project(e.g.position.x,e.g.position.z);ctx.beginPath();ctx.arc(x,y,2.3,0,TAU);ctx.fill()}
  if(this.waypoint){const[x,y]=project(this.waypoint.x,this.waypoint.z);ctx.strokeStyle='#e5b866';ctx.beginPath();ctx.arc(x,y,4,0,TAU);ctx.stroke()}
  const[x,y]=project(p.x,p.z);ctx.save();ctx.translate(x,y);ctx.rotate(-this.yaw);ctx.fillStyle='#faf0cb';ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(-3,-3);ctx.lineTo(3,-3);ctx.closePath();ctx.fill();ctx.restore();
 }
 addParticles(){const count=this.quality==='high'?130:45,positions=new Float32Array(count*3);for(let i=0;i<count;i++){positions[i*3]=this.r()*(this.crypt?68:70)-(this.crypt?0:35);positions[i*3+1]=this.r()*(this.crypt?4:9);positions[i*3+2]=this.r()*(this.crypt?68:100)-(this.crypt?0:55)}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));const mat=new T.PointsMaterial({color:this.crypt?'#84c2b9':'#eee0a5',size:.055,transparent:true,opacity:.65,depthWrite:false});this.materials.push(mat);this.motes=new T.Points(geo,mat);this.root.add(this.motes)}
 frame(now){
  if(this.destroyed)return;const dt=Math.min(.05,(now-this.last)/1000);this.last=now;this.elapsed+=dt;const paused=this.callbacks.paused(),h=this.hero,p=h.position;let moving=0;
  if(!paused){const forward=(this.keys.has('w')||this.keys.has('arrowup')?1:0)-(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-this.joy.y,strafe=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0)+this.joy.x;let dx=Math.sin(this.yaw)*forward-Math.cos(this.yaw)*strafe,dz=Math.cos(this.yaw)*forward+Math.sin(this.yaw)*strafe;const len=Math.hypot(dx,dz);if(len>.08){moving=1;dx/=Math.max(1,len);dz/=Math.max(1,len);const speed=(this.keys.has('shift')?6:3.7)*dt;if(this.canMove(p.x+dx*speed,p.z))p.x+=dx*speed;if(this.canMove(p.x,p.z+dz*speed))p.z+=dz*speed;this.player.rotation.y=Math.atan2(dx,dz);this.walkTime+=dt*9;this.callbacks.onStep?.(dt,this.keys.has('shift'),this.crypt||this.indoor?'stone':'grass')}if(this.open){updateOpenWorld(this);if(syncRealm(h)){this.refresh();this.callbacks.onRegion?.(townOf(h))}this.wild=h.location.area==='wilds'}p.yaw=this.yaw;h.playSeconds+=dt;h.world.hour+=dt/180;if(h.world.hour>=24){h.world.hour-=24;h.world.day++}this.callbacks.onTick?.(dt)}
  this.player.position.set(p.x,this.groundAt(p.x,p.z),p.z);const j=this.player.userData.joints;if(j){j.legL.rotation.x=Math.sin(this.walkTime)*.6*moving;j.legR.rotation.x=-j.legL.rotation.x;j.armL.rotation.x=-j.legL.rotation.x*.7;j.armR.rotation.x=j.legL.rotation.x*.7}if(this.player.userData.rig)animateActor(this.player.userData.rig,paused?0:dt,moving*(this.keys.has('shift')?1:.5));
  const first=this.firstPerson;this.player.visible=!first;const ground=this.groundAt(p.x,p.z),target=new T.Vector3(p.x,ground+(first?1.7:1.35),p.z),distance=first?.06:this.indoor?4.2:5.8,height=first?0:this.indoor?1.6:2.8+this.pitch*2,desired=new T.Vector3(p.x-Math.sin(this.yaw)*distance,target.y+height,p.z-Math.cos(this.yaw)*distance);this.camera.position.copy(first?desired:cameraPosition(target,desired,(x,z,y)=>this.canMove(x,z,y)));this.camera.lookAt(first?new T.Vector3(p.x+Math.sin(this.yaw)*5,ground+1.7+(this.pitch-.48)*5,p.z+Math.cos(this.yaw)*5):target);
  if(this.torch)this.torch.position.set(p.x,2.5,p.z);
  for(const q of this.people){let walked=false;
   if(!paused&&q.speed){let goal;if(q.approach&&Math.hypot(q.g.position.x-p.x,q.g.position.z-p.z)<10)goal=[p.x,p.z];else if(q.route)goal=q.route[q.waypoint];
    if(goal){const dx=goal[0]-q.g.position.x,dz=goal[1]-q.g.position.z,d=Math.hypot(dx,dz);if(d>(q.approach?2.6:.4)){const step=q.speed*dt,nx=q.g.position.x+dx/d*step,nz=q.g.position.z+dz/d*step;if(this.canMove(nx,nz)){q.g.position.set(nx,this.groundAt(nx,nz),nz);q.g.rotation.y=Math.atan2(dx,dz);walked=true}}else if(q.route)q.waypoint=(q.waypoint+1)%q.route.length}
   }
   if(!walked&&q.entity)q.g.rotation.y=Math.atan2(p.x-q.g.position.x,p.z-q.g.position.z);
   if(q.g.userData.rig)animateActor(q.g.userData.rig,paused?0:dt,walked?.4:0);else{const jj=q.g.userData.joints;if(jj){jj.legL.rotation.x=walked?Math.sin(this.elapsed*5+q.seed)*.35:0;jj.legR.rotation.x=-jj.legL.rotation.x}}
   if(q.approach&&!paused&&Math.hypot(q.g.position.x-p.x,q.g.position.z-p.z)<3&&!this.encounterNoticed.has(q.entity.id)){this.encounterNoticed.add(q.entity.id);this.callbacks.onEncounter?.(q.entity)}
  }
  for(const a of this.animals){a.g.position.x=a.x+Math.sin(this.elapsed*.45+a.seed)*1.6;a.g.position.z=a.z+Math.cos(this.elapsed*.36+a.seed)*1.1;a.g.rotation.y=Math.atan2(Math.cos(this.elapsed*.45+a.seed),-Math.sin(this.elapsed*.36+a.seed));a.g.position.y=this.groundAt(a.g.position.x,a.g.position.z)+Math.max(0,Math.sin(this.elapsed*5+a.seed))*.035}
  for(const q of this.particles)if(q.spin)q.g.rotation.y+=dt*.2;
  for(const e of this.entities){if(e.g.userData.marker){e.g.userData.marker.rotation.y+=dt;e.g.userData.marker.position.y=3+Math.sin(this.elapsed*2)*.15}if(e.g.userData.float)e.g.position.y=this.groundAt(e.g.position.x,e.g.position.z)+.15+Math.sin(this.elapsed*2)*.12}
  if(this.elapsed-(this.lastNear||0)>.12){this.lastNear=this.elapsed;const nearest=this.entities.map(e=>({e,d:Math.hypot(e.g.position.x-p.x,e.g.position.z-p.z)})).filter(v=>v.d<(v.e.type==='gate'?4.8:3.2)).sort((a,b)=>a.d-b.d)[0]?.e||null;this.near=nearest;if(nearest?.id!==this.lastNearId){this.lastNearId=nearest?.id;this.callbacks.onNear(nearest)}this.drawMinimap();const distance=document.getElementById('waypoint-distance');if(distance)distance.textContent=this.waypoint?Math.ceil(Math.hypot(this.waypoint.x-p.x,this.waypoint.z-p.z))+' m · '+this.waypoint.name:'';const compass=document.getElementById('compass-heading');if(compass)compass.textContent=['S','SW','W','NW','N','NE','E','SE'][((Math.round(this.yaw/(Math.PI/4))%8)+8)%8]}
  if(!paused&&!this.crypt&&!this.wild&&!this.indoor&&this.elapsed>12&&this.elapsed-this.lastRumor>100){this.lastRumor=this.elapsed;this.callbacks.onRumor?.()}
  if(!this.crypt&&!this.indoor){const daylight=Math.max(.04,Math.sin((h.world.hour-6)/12*Math.PI));this.sun.intensity=.12+daylight*3.1;this.ambient.intensity=.5+daylight*1.3;this.sun.color.set(daylight<.4?'#f7b77e':'#ffe0ae');const angle=(h.world.hour-6)/12*Math.PI;this.sun.position.set(p.x+Math.cos(angle)*35,ground+Math.max(8,Math.sin(angle)*40),p.z+15);this.sun.target.position.set(p.x,ground,p.z);this.scene.background.copy(this.nightSky).lerp(this.daySky,Math.min(1,daylight*1.9));this.scene.fog.color.copy(this.scene.background)}
  for(const light of this.fires)light.intensity=3.2+Math.sin(now*.004+light.id)*.25;
  this.renderer.render(this.scene,this.camera);this.raf=requestAnimationFrame(this.frame);
 }
 dispose(){this.destroyed=true;cancelAnimationFrame(this.raf);this.resizeObserver?.disconnect();for(const remove of this.events)remove();this.clearScene();this.renderer.dispose();this.renderer.forceContextLoss()}
}

