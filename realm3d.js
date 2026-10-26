import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/+esm";
const canvas=document.getElementById("view");
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9b899e);scene.fog=new THREE.Fog(0x9b899e,32,100);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"low-power"});renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.setSize(640,400,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
const camera=new THREE.PerspectiveCamera(75,640/400,.07,140);camera.position.set(0,1.7,5);
scene.add(new THREE.HemisphereLight(0xffe1c3,0x414a50,2.1));const sun=new THREE.DirectionalLight(0xffc291,2.2);sun.position.set(-10,20,9);scene.add(sun);
const mat=c=>new THREE.MeshLambertMaterial({color:c});
const wood=mat(0x4d3033),stone=mat(0x807383),roof=mat(0x583343),dirt=mat(0x8f8071),grass=mat(0x67826a),white=mat(0xf3e3c7),yellow=mat(0xdb9838),skin=mat(0xd8a17e),dark=mat(0x342b42);
function cube(parent,w,h,d,m,x,y,z){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);a.position.set(x,y,z);parent.add(a);return a}
function cone(parent,r,h,m,x,y,z,n=4){const a=new THREE.Mesh(new THREE.ConeGeometry(r,h,n),m);a.position.set(x,y,z);parent.add(a);return a}
function sphere(parent,r,m,x,y,z){const a=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),m);a.position.set(x,y,z);parent.add(a);return a}
cube(scene,150,.1,150,grass,0,-.12,-20);cube(scene,7,.04,115,dirt,0,-.04,-25);
const objects=[],people=[],birds=[];
function building(x,z,width,label,tone){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);cube(g,width,4,5,mat(tone),0,2,0);const r=cone(g,width*.84,2,roof,0,5.0,0);r.rotation.y=Math.PI/4;cube(g,1.4,2,.12,wood,0,1,2.57);for(let i of [-1,1]){const window=cube(g,.75,.85,.13,yellow,i*(width*.32),2.7,2.59);window.material=mat(0xdcb274)}cube(g,2,.4,.3,wood,0,4,2.8);objects.push({x,z,radius:width/2+1,label});}
building(-8,-13,7,"The Drunken Moon Inn",0x8d6875);building(8,-14,7,"Blacksmith",0x78717d);building(-8,-27,7,"Occult Apothecary",0x7e6481);building(8,-28,7,"The Chapel",0x89818b);building(-9,-42,7,"Guild Hall",0x79717d);building(9,-42,7,"Relic Market",0x736570);
for(let i=0;i<20;i++){const x=(i%2?-1:1)*(5+i%4*.8),z=-i*4;cube(scene,.16,1.3,.16,wood,x,.65,z);cube(scene,1.35,.12,.15,wood,x,.9,z)}
function villager(x,z,color){const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);cube(g,.48,.9,.34,mat(color),0,1.05,0);sphere(g,.26,skin,0,1.78,0);cube(g,.2,.6,.25,dark,-.16,.34,0);cube(g,.2,.6,.25,dark,.16,.34,0);people.push({g,x,z,seed:Math.random()*6.28})}
villager(-2,-12,0x9b5e83);villager(2,-21,0x6a8b91);villager(-1,-33,0xa79068);villager(3,-39,0x785987);
function chicken(x,z){const g=new THREE.Group();scene.add(g);sphere(g,.23,white,0,.30,0);sphere(g,.14,white,.18,.47,0);cone(g,.1,.17,yellow,.32,.44,0);cube(g,.035,.2,.03,yellow,-.11,.1,0);cube(g,.035,.2,.03,yellow,.11,.1,0);birds.push({g,x,z,seed:Math.random()*6.28})}
chicken(-1,-9);chicken(2,-19);chicken(-3,-30);chicken(1,-38);
for(let i=0;i<16;i++){let x=(i%2?1:-1)*(13+i%3*2),z=-4-i*3;const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);cube(g,.42,2,.42,wood,0,1,0);sphere(g,1.2,mat(0x526b58),0,2.6,0)}

// The dungeon uses the same WebGL renderer with a separate maze scene.
const crypt=new THREE.Scene();crypt.background=new THREE.Color(0x110c19);crypt.fog=new THREE.FogExp2(0x160f20,.055);
crypt.add(new THREE.HemisphereLight(0xb2a0bd,0x16101c,1.3));
const torch=new THREE.PointLight(0xf58c5c,32,19);torch.position.set(2,2,2);crypt.add(torch);
const walls=new THREE.Group();crypt.add(walls);let dungeonSignature="";
const wallMaterial=new THREE.MeshLambertMaterial({color:0x5d5162}),floorMaterial=new THREE.MeshLambertMaterial({color:0x39303e}),ceilingMaterial=new THREE.MeshLambertMaterial({color:0x2a2230});
function syncDungeon(){
if(!hero||hero.mode!=="dungeon"||!hero.dungeonState)return false;
const d=hero.dungeonState,signature=JSON.stringify(d.grid);
if(signature!==dungeonSignature){
while(walls.children.length){const a=walls.children.pop();a.geometry?.dispose();walls.remove(a)}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(13,13),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.set(6.5,0,6.5);walls.add(floor);
const roof=new THREE.Mesh(new THREE.PlaneGeometry(13,13),ceilingMaterial);roof.rotation.x=Math.PI/2;roof.position.set(6.5,3.4,6.5);walls.add(roof);
d.grid.forEach((row,z)=>row.forEach((v,x)=>{if(!v)return;const block=new THREE.Mesh(new THREE.BoxGeometry(1,3.4,1),wallMaterial);block.position.set(x+.5,1.7,z+.5);walls.add(block)}));
dungeonSignature=signature;
}
camera.position.set(d.x+.5,1.55,d.y+.5);camera.rotation.set(0,-d.dir*Math.PI/2,0,"YXZ");torch.position.set(d.x+.5,2,d.y+.5);return true
}

const position=new THREE.Vector3(0,1.7,5);let yaw=0,active=false;const keys={};let last=performance.now();
const controls=document.createElement("div");controls.className="village-controls";controls.innerHTML='<button data-move="left">↶ Turn</button><button data-move="forward">▲ Walk</button><button data-move="right">Turn ↷</button><button data-move="back">▼ Back</button><button data-move="talk">✦ Talk / Enter</button>';document.getElementById("dungeonControls").before(controls);
function current(){return typeof hero!=="undefined"&&hero&&hero.mode==="town"&&!document.getElementById("world").hidden&&!document.getElementById("adventure").hidden}
function stepMove(action,dt=1){if(!current())return;if(action==="left")yaw+=.12*dt;if(action==="right")yaw-=.12*dt;if(action==="forward"||action==="back"){const dir=action==="forward"?1:-1;const nx=position.x+-Math.sin(yaw)*dir*.4*dt,nz=position.z+-Math.cos(yaw)*dir*.4*dt;if(Math.abs(nx)<16&&nz<8&&nz>-57&&!objects.some(o=>Math.hypot(nx-o.x,nz-o.z)<o.radius)){position.x=nx;position.z=nz}}}
function talk(){const near=objects.map(o=>({...o,d:Math.hypot(o.x-position.x,o.z-position.z)})).sort((a,b)=>a.d-b.d)[0];if(near&&near.d<8){if(near.label.includes("Inn")){modal("VILLAGE INN","The Drunken Moon","Travelers whisper about the road while a fire burns in the hearth.",[["Rest · 8 gold",()=>{if(hero.gold>=8){hero.gold-=8;hero.hp=hero.maxHp;hero.mp=hero.maxMp;close()}else document.getElementById("modalText").textContent="Not enough gold."}],["Leave",close]])}else if(near.label.includes("Blacksmith")||near.label.includes("Market")){modal("VILLAGE SHOP",near.label,"A trader offers something that hums with strange magic.",[["Purchase weapon · 40 gold",()=>{if(hero.gold>=40){hero.gold-=40;addLoot();close()}else document.getElementById("modalText").textContent="Not enough gold."}],["Leave",close]])}else{modal("STRANGE PLACES",near.label,"The building holds whispers of forgotten kings and unnatural bargains.",[["Investigate",()=>{close();discovery()}],["Return to street",close]])}}else modal("VILLAGE LIFE","A passing stranger","A pilgrim points toward the ruins beyond the walls. A chicken pecks at your boots.",[["Ask about rumors",()=>{close();questStep()}],["Walk on",close]])}
controls.addEventListener("click",e=>{const v=e.target.closest("[data-move]")?.dataset.move;if(!v)return;if(v==="talk")talk();else stepMove(v)});
const buttons=new Set();controls.addEventListener("pointerdown",e=>{const v=e.target.closest("[data-move]")?.dataset.move;if(v&&v!=="talk")buttons.add(v)});for(const ev of ["pointerup","pointercancel","pointerleave"])controls.addEventListener(ev,()=>buttons.clear());
document.addEventListener("keydown",e=>{if(["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName))return;keys[e.key.toLowerCase()]=true});document.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
let dragX=null;canvas.addEventListener("pointerdown",e=>{if(!current())return;dragX=e.clientX});canvas.addEventListener("pointermove",e=>{if(dragX===null||!current())return;yaw-=(e.clientX-dragX)*.005;dragX=e.clientX});canvas.addEventListener("pointerup",()=>dragX=null);
const nativeDraw=typeof drawView==="function"?drawView:null;
function frame(t){const dt=Math.min(2,(t-last)/33);last=t;active=current();const inCrypt=typeof hero!=="undefined"&&hero&&hero.mode==="dungeon"&&!document.getElementById("world").hidden&&!document.getElementById("adventure").hidden;controls.hidden=!active;canvas.hidden=!(active||inCrypt);oldCanvas.hidden=(active||inCrypt);if(active){if(keys.arrowup||keys.w||buttons.has("forward"))stepMove("forward",dt);if(keys.arrowdown||keys.s||buttons.has("back"))stepMove("back",dt);if(keys.arrowleft||keys.a||buttons.has("left"))stepMove("left",dt);if(keys.arrowright||keys.d||buttons.has("right"))stepMove("right",dt);camera.position.copy(position);camera.rotation.set(0,yaw,0,"YXZ");people.forEach((p,i)=>{p.g.position.set(p.x+Math.sin(t*.00055+p.seed)*1.5,0,p.z+Math.cos(t*.0003+p.seed));p.g.rotation.y=Math.sin(t*.001+p.seed)*.4});birds.forEach(p=>{p.g.position.set(p.x+Math.sin(t*.001+p.seed)*1.2,Math.max(0,Math.sin(t*.002+p.seed))*.025,p.z+Math.cos(t*.0008+p.seed))});renderer.render(scene,camera)}else if(inCrypt&&syncDungeon()){renderer.render(crypt,camera)}requestAnimationFrame(frame)}
requestAnimationFrame(frame);
window.SINFALL_REALM3D={renderVillage:()=>{}, reset:()=>{position.set(0,1.7,5);yaw=0}};
