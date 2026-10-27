import * as T from '../vendor/three.module.js';
import {appearanceOf,weaponStyle,armorStyle} from './appearance.js?v=5';
import {batchScenery} from './scene-utils.js?v=5';
const bone=(rig,name)=>{let found;rig.traverse(o=>{if(o.isBone&&o.name.replace(/[._]/g,'')===name)found=o});return found};
const mat=(color,metal=false)=>new T.MeshStandardMaterial({color,roughness:metal?.4:.86,metalness:metal?.65:0});
function mesh(parent,geometry,material,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o}
const box=(g,m,w,h,d,x=0,y=0,z=0)=>mesh(g,new T.BoxGeometry(w,h,d),m,x,y,z);
const sphere=(g,m,r,x=0,y=0,z=0)=>mesh(g,new T.IcosahedronGeometry(r,2),m,x,y,z);
function removeStyle(rig,key){const old=rig.userData[key];if(!old)return;old.removeFromParent();const materials=new Set();old.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material)});materials.forEach(m=>m.dispose());delete rig.userData[key]}
export function styleFace(rig,h){
 const a=appearanceOf(h),head=bone(rig,'head');if(!head)return;removeStyle(rig,'face');rig.traverse(o=>{if(o.isMesh&&/_(Head|Hat|Helmet)$/.test(o.name))o.visible=false});
 const g=new T.Group();g.name='Customized face';head.add(g);rig.userData.face=g;
 const skin=mat(a.skin),hair=mat(a.hair),eye=mat(a.eyes),dark=mat('#1c2428'),lip=mat('#80564f'),paint=mat(a.marking==='scar'?'#b68173':'#658ca0');
 mesh(g,new T.CylinderGeometry(.11,.14,.25,8),skin,0,.16,0);const face=sphere(g,skin,.35,0,.48,0);face.scale.set((a.face==='angular'?.88:a.face==='round'?1.08:1)*(a.gender==='male'?1.03:.97),.99,a.face==='angular'?.92:1);
 for(const side of[-1,1]){sphere(g,skin,.085,side*.34,.48,0).scale.set(.7,1,.65);sphere(g,dark,.039,side*.12,.51,.306);sphere(g,eye,.029,side*.12,.513,.331);sphere(g,dark,.014,side*.12,.514,.351);box(g,hair,.11,.023,.025,side*.12,.585,.304);if(['elf','fae'].includes(h.raceId)){const ear=mesh(g,new T.ConeGeometry(.075,.32,5),skin,side*.39,.52,0);ear.rotation.z=-side*1.05}if(h.raceId==='duskborn'){const horn=mesh(g,new T.ConeGeometry(.07,.28,6),dark,side*.23,.83,-.06);horn.rotation.z=-side*.38}}
 sphere(g,skin,.058,0,.445,.33).scale.set(.75,1,1.3);box(g,lip,.12,.018,.02,0,.345,.31);
 if(h.raceId==='beastkin'){for(const side of[-1,1]){const ear=mesh(g,new T.ConeGeometry(.115,.25,4),hair,side*.23,.86,-.02);ear.rotation.z=-side*.25}sphere(g,dark,.045,0,.47,.38)}
 if(a.hairStyle!=='bald'){const cap=sphere(g,hair,.37,0,.72,-.035);cap.scale.set(1,.5,1);if(a.hairStyle==='short')for(let i=0;i<5;i++)sphere(g,hair,.11,(i-2)*.13,.77,.21).scale.y=.6;
  if(a.hairStyle==='swept')for(let i=0;i<4;i++){const lock=sphere(g,hair,.16,(i-1.5)*.16,.8,-.1);lock.scale.set(.6,.6,1.8)}
  if(a.hairStyle==='long')for(const side of[-1,1])sphere(g,hair,.2,side*.3,.38,-.12).scale.set(.6,1.9,1);
  if(a.hairStyle==='braid')for(let i=0;i<7;i++)sphere(g,hair,.1-(i*.006),Math.sin(i*2)*.04,.58-i*.11,-.31);
 }
 if(a.beard!=='none'){const beard=sphere(g,hair,a.beard==='full'?.23:.18,0,.28,.16);beard.scale.set(1,a.beard==='full'?1.5:.48,.65)}
 if(a.marking!=='none'){for(const side of a.marking==='scar'?[1]:[-1,1]){const mark=box(g,paint,.027,.15,.018,side*.22,.41,.284);mark.rotation.z=side*.5}}batchScenery(g);
}
export function styleEquipment(rig,h){
 removeStyle(rig,'gear');removeStyle(rig,'weapon');removeStyle(rig,'trinket');
 rig.traverse(o=>{if(o.isMesh&&/^(?:Knife|Throwable|\dH_|Badge_Shield|Rectangle_Shield|Round_Shield|Spike_Shield|Barbarian_Round_Shield|Mug|Spellbook)/.test(o.name))o.visible=false});
 const a=appearanceOf(h),style=armorStyle(h.equipment?.armor),quality=h.equipment?.armor?.quality||0,chest=bone(rig,'chest'),hand=bone(rig,'handslotr');
 if(chest){const g=new T.Group();g.name='Equipped '+style+' armor';chest.add(g);rig.userData.gear=g;const color=style==='plate'?'#a6b6c0':style==='mail'?'#6e8791':style==='leather'?'#916b42':a.outfit,m=mat(color,style==='plate'||style==='mail'),trim=mat(quality>1?'#d2ac62':'#5b4537',quality>1);
  box(g,m,.64,.46,.4,0,-.09,.005);box(g,trim,.68,.06,.42,0,-.31,.005);
  if(style!=='cloth')for(const side of[-1,1]){sphere(g,m,style==='plate'?.21:.16,side*.39,.05,0).scale.y=.6;box(g,trim,.17,.04,.34,side*.39,.13,0)}
  if(style==='mail')for(let i=0;i<5;i++)box(g,trim,.53,.014,.015,0,-.24+i*.07,.212);
  if(style==='plate'){box(g,trim,.045,.36,.018,0,-.07,.213);sphere(g,trim,.055,0,.01,.23)}batchScenery(g);
 }
 if(hand&&h.equipment?.weapon){const g=new T.Group();g.name='Equipped '+weaponStyle(h.equipment?.weapon,h.classId);hand.add(g);rig.userData.weapon=g;g.rotation.x=Math.PI/2;const style=weaponStyle(h.equipment?.weapon,h.classId),steel=mat((h.equipment?.weapon?.quality||0)>1?'#b8cfd8':'#8fabb2',true),wood=mat('#624435'),gold=mat('#d4ac63',true),glow=mat('#78bfb9');
  const handle=(length=.25)=>mesh(g,new T.CylinderGeometry(.035,.04,length,7),wood,0,.02,0);
  if(style==='bow'){const arc=mesh(g,new T.TorusGeometry(.55,.035,6,20,Math.PI),wood);arc.rotation.z=-Math.PI/2;arc.scale.y=.7;box(g,steel,.014,1.1,.014,.02,0,0);g.rotation.z=Math.PI/2}
  else if(style==='staff'||style==='wand'){const length=style==='staff'?1.7:.7;mesh(g,new T.CylinderGeometry(.035,.05,length,8),wood,0,length*.2,0);sphere(g,glow,style==='staff'?.13:.07,0,length*.7+.06,0);mesh(g,new T.TorusGeometry(.18,.025,6,14),gold,0,length*.7+.06,0)}
  else if(style==='axe'){handle(.85);box(g,steel,.48,.3,.065,.12,.43,0);box(g,gold,.12,.11,.09,0,.46,0)}
  else if(style==='hammer'){handle(.8);box(g,steel,.46,.27,.27,0,.44,0)}
  else{const spear=style==='spear',dagger=style==='dagger',length=spear?1.1:dagger?.42:.9;handle(spear?1:.24);box(g,steel,dagger?.07:.095,length,.035,0,length*.5+.17,0);mesh(g,new T.ConeGeometry(.065,.18,4),steel,0,length+.24,0).rotation.y=Math.PI/4;if(!spear)box(g,gold,.32,.045,.07,0,.13,0)}batchScenery(g);
 }
 if(chest&&h.equipment?.trinket){const g=new T.Group();g.name='Equipped amulet';chest.add(g);rig.userData.trinket=g;const m=mat('#99c9bc');sphere(g,m,.052,0,-.12,.235)}
}
export function styleActor(group,h){const rig=group.children[0];if(!rig)return;const a=appearanceOf(h),width={slender:.88,balanced:1,broad:1.15}[a.build],height={short:.91,average:1,tall:1.1}[a.height];group.scale.set(width*(a.gender==='female'?.95:1.03),height,1);rig.traverse(o=>{if(!o.isMesh)return;const palette=o.material.userData.palette;if(palette){palette.skin.set(a.skin);palette.hair.set(a.hair)}if(/_(Body|Cape|ArmLeft|ArmRight)$/.test(o.name))o.material.color.set(a.outfit).lerp(new T.Color('#ffffff'),.72)});styleFace(rig,h);styleEquipment(rig,h);group.userData.appearance=a;}
