import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createActor,animateActor,disposeActor} from '../src/actors.js';
import {styleActor} from '../src/actor-style.js';
import {appearanceOf,APPEARANCE_OPTIONS,wardrobeOptions} from '../src/appearance.js';
import {Realm} from '../src/world.js';
async function source(gender){const b=await readFile(new URL(`../assets/models/adult-${gender}.glb`,import.meta.url));assert.equal(b.readUInt32LE(8),b.length);return new GLTFLoader().register(()=>({name:'EXT_texture_webp',loadTexture:()=>Promise.resolve(new T.Texture())})).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.length),'')}
const hero=gender=>({gender,raceId:'elf',classId:'ranger',skin:'#e5c3a2',hair:'#ddd7bf',hairStyle:'long',face:'regal',wardrobe:'adventurer',outfit:'#49675c',equipment:{armor:{name:'Cloth'},weapon:{name:'Wayfarer bow'}}});
test('unengaged enemies start in a relaxed idle pose and keep animating outside combat',async()=>{
 const s=await source('male'),a=createActor(s,{race:'hollow',kind:'oathbreaker',appearance:{gender:'male'}}),b=createActor(s,{race:'hollow',kind:'oathbreaker',appearance:{gender:'male'}});a.updateMatrixWorld(true);const rig=a.children[0],hand=rig.getObjectByName('hand_r'),shoulder=rig.getObjectByName('upperarm_r');assert(hand.getWorldPosition(new T.Vector3()).y<shoulder.getWorldPosition(new T.Vector3()).y-.35,'initial pose must lower the arm before the first rendered frame');assert(rig.userData.weapon,'armed sentinels carry actual equipment');
 const r=Object.assign(Object.create(Realm.prototype),{hero:{combat:null},elapsed:1,entities:[{id:'a',type:'enemy',g:{userData:{rig:a}}},{id:'b',type:'boss',g:{userData:{rig:b}}}]});r.updateUnengaged(.05);assert(a.userData.animation.actions.get('Idle').time>0);const paused=b.userData.animation.actions.get('Idle').time;r.hero.combat={id:'b'};r.updateUnengaged(.05);assert.equal(b.userData.animation.actions.get('Idle').time,paused,'combat owns its active rig exactly once');disposeActor(a);disposeActor(b);
});
test('adult female and male meshes retain authored skinned faces and fitted covered bodies',async()=>{for(const gender of['female','male']){const s=await source(gender);assert(s.asset.extras.sinfallAdult);assert.equal(s.asset.extras.gender,gender);assert.equal(s.animations.length,11);const a=createActor(s,{hero:hero(gender),race:'elf'});let face,body,skin;const bones=[];a.traverse(o=>{if(o.isBone)bones.push(o);if(o.name==='Authored_face_and_neck')face=o;if(o.name.endsWith('Ranger_Body'))body=o;if(o.isSkinnedMesh){skin=o;const weights=o.geometry.attributes.skinWeight;for(let i=0;i<weights.count;i++){const sum=weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i);assert(Math.abs(sum-1)<.0001)}}});assert.equal(bones.length,65);assert(face?.isSkinnedMesh);assert(face.geometry.attributes.position.count>300);assert(body?.isSkinnedMesh);assert(body.visible);assert(skin);assert.equal(a.userData.modelGender,gender);disposeActor(a)}});
test('adult skeletons animate independently and customization changes authored geometry',async()=>{const s=await source('female'),h=hero('female'),a=createActor(s,{hero:h,race:'elf'}),b=createActor(s,{hero:h,race:'elf'});let skinA,skinB,face;a.traverse(o=>{if(o.isSkinnedMesh)skinA??=o;if(o.name==='Authored_face_and_neck')face=o});b.traverse(o=>{if(o.isSkinnedMesh)skinB??=o});assert.notEqual(skinA.skeleton.bones[0],skinB.skeleton.bones[0]);const before=skinA.skeleton.bones.map(b=>b.quaternion.toArray());animateActor(a,.1,.5);animateActor(a,.1,.5);assert.equal(a.userData.animation.current,'Walking_A');assert(skinA.skeleton.bones.some((b,i)=>b.quaternion.toArray().some((n,j)=>Math.abs(n-before[i][j])>.001)));assert.equal(b.userData.animation.current,'Idle');const shape=face.geometry.attributes.position.array.slice();styleActor(a,{...h,face:'round',hairStyle:'buns',wardrobe:'court',equipment:{armor:{name:'Warden mail'},weapon:{name:'Iron sword'}}});assert(face.geometry.attributes.position.array.some((n,i)=>Math.abs(n-shape[i])>.0001));assert(a.children[0].userData.gear.visible);assert.match(a.children[0].userData.weapon.name,/sword/);styleActor(a,{...h,gender:'male'});assert(a.userData.needsModelReload);a.updateMatrixWorld(true);a.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)));disposeActor(a);disposeActor(b)});
test('wardrobe and ancestry choices preserve separate parts and compatible appearance data',async()=>{assert.equal(appearanceOf({hairStyle:'short'}).hairStyle,'cropped');assert.equal(APPEARANCE_OPTIONS.hairStyle.length,6);assert.equal(APPEARANCE_OPTIONS.face.length,4);assert.equal(APPEARANCE_OPTIONS.wardrobe.length,6);const s=await source('male'),a=createActor(s,{hero:hero('male'),race:'elf'});styleActor(a,{...hero('male'),wardrobe:'robes',hairStyle:'bald',beard:'none'});let ranger=0,peasant=0,visibleHair=0;a.traverse(o=>{if(o.isMesh&&o.visible){if(/Ranger/.test(o.name))ranger++;if(/Peasant/.test(o.name))peasant++;if(/^Hair_/.test(o.name))visibleHair++}});assert.equal(ranger,0);assert(peasant>0);assert.equal(visibleHair,0);disposeActor(a)});

test('adult starter clothes have no chest box and fitted armor follows the animated garment',async()=>{
 for(const gender of['female','male']){
  const s=await source(gender),h={...hero(gender),classId:'necromancer',equipment:{armor:{name:'Traveler’s Attire'},weapon:{name:'Hollow Scepter'}}},a=createActor(s,{hero:h,race:'elf'}),rig=a.children[0];
  for(const wardrobe of['adventurer','court','robes','ranger']){styleActor(a,{...h,wardrobe});assert.equal(rig.userData.gear,undefined,wardrobe+' already has an authored cloth torso')}
  for(const visual of['leather','mail','plate']){
   styleActor(a,{...h,equipment:{...h.equipment,armor:{name:'Test armor',visual}}});const armor=rig.userData.gear;assert(armor?.visible);assert(armor.children.length>0);assert(armor.children.every(o=>o.isSkinnedMesh));
   const fitted=armor.children[0],garment=rig.getObjectByName(fitted.userData.garment);assert(!garment.visible);assert.equal(fitted.skeleton,garment.skeleton);
   for(const speed of[0,.5,1]){for(let i=0;i<12;i++)animateActor(a,.05,speed);a.updateMatrixWorld(true);for(const vertex of[0,30,300]){const p=new T.Vector3().fromBufferAttribute(fitted.geometry.attributes.position,vertex),q=new T.Vector3().fromBufferAttribute(garment.geometry.attributes.position,vertex);fitted.applyBoneTransform(vertex,p);garment.applyBoneTransform(vertex,q);p.applyMatrix4(fitted.matrixWorld);q.applyMatrix4(garment.matrixWorld);assert(p.distanceTo(q)<.00001,'armor must stay fitted while animating')}}
  }
  styleActor(a,h);assert.equal(rig.userData.gear,undefined);assert(rig.getObjectByName(gender==='female'?'Female_Ranger_Body':'Male_Ranger_Body').visible);disposeActor(a);
 }
});
test('adult weapons sit in the palm through idle, walk, run, rotation and equipment swaps',async()=>{
 for(const gender of['female','male']){
  const s=await source(gender),h={...hero(gender),classId:'necromancer'},a=createActor(s,{hero:h,race:'elf'}),rig=a.children[0];
  for(const visual of['staff','wand','sword','dagger','axe','hammer','spear','bow']){
   styleActor(a,{...h,equipment:{armor:{name:'Traveler’s Attire'},weapon:{name:'Test weapon',visual}}});const weapon=rig.userData.weapon,grip=weapon.userData.adultGrip;assert(grip?.index&&grip.thumb);assert.equal(weapon.parent.name,'hand_r');
   for(const speed of[0,.5,1])for(let frame=0;frame<24;frame++){a.rotation.y=frame*.1;animateActor(a,.05,speed);a.updateMatrixWorld(true);const midpoint=grip.index.getWorldPosition(new T.Vector3()).add(grip.thumb.getWorldPosition(new T.Vector3())).multiplyScalar(.5),origin=weapon.getWorldPosition(new T.Vector3());assert(origin.distanceTo(midpoint)<.00001,'handle must touch the palm throughout animation');if(speed===0&&frame>8){const up=new T.Vector3(0,1,0).transformDirection(weapon.matrixWorld);assert(['sword','dagger','axe','hammer'].includes(visual)?up.y<-.65:up.y>.85,visual+' must use its intended relaxed carry pose')}}
  }
  disposeActor(a);
 }
});

test('Corsair and Moonveil are complete skinned outfits and survive animation and armor swaps',async()=>{
 const s=await source('female'),h=hero('female'),a=createActor(s,{hero:h,race:'elf'}),rig=a.children[0];
 for(const wardrobe of['corsair','moonveil']){
  styleActor(a,{...h,wardrobe});const prefix=wardrobe==='corsair'?'Corsair':'Moonveil',parts=[];
  rig.traverse(o=>{if(!o.isMesh)return;if(o.name.startsWith(prefix+'_')){assert(o.visible);assert(o.isSkinnedMesh);parts.push(o)}else if(/^(Female_(Ranger|Peasant)|Corsair_|Moonveil_|Fitted_neckline|Ceremonial_robe)/.test(o.name))assert(!o.visible,o.name+' must not overlap the selected outfit')});
  for(const suffix of['Skin','Body','Bottoms','Boots','Bracers'])assert(parts.some(o=>o.name===prefix+'_'+suffix));
  const skin=rig.getObjectByName(prefix+'_Skin'),bodice=rig.getObjectByName(prefix+'_Body');assert(skin.skeleton.bones.every((bone,i)=>bone===bodice.skeleton.bones[i]));
  const original=[];for(let vertex=0;vertex<skin.geometry.attributes.position.count;vertex+=29){const point=new T.Vector3().fromBufferAttribute(skin.geometry.attributes.position,vertex);skin.applyBoneTransform(vertex,point);original.push(point)}
  let moved=false;for(const speed of[0,.5,1]){for(let frame=0;frame<20;frame++)animateActor(a,.05,speed);a.updateMatrixWorld(true);for(let i=0;i<original.length;i++){const vertex=i*29,posed=new T.Vector3().fromBufferAttribute(skin.geometry.attributes.position,vertex);skin.applyBoneTransform(vertex,posed);if(posed.distanceTo(original[i])>.001)moved=true}for(const p of parts){assert(p.geometry.attributes.normal.array.every(Number.isFinite));for(let vertex=0;vertex<p.geometry.attributes.position.count;vertex+=29){const v=new T.Vector3().fromBufferAttribute(p.geometry.attributes.position,vertex);p.applyBoneTransform(vertex,v);assert(v.toArray().every(Number.isFinite))}}}
  assert(moved,'exposed skin must follow the moving body');
  styleActor(a,{...h,wardrobe,equipment:{armor:{name:'Warden mail'}}});const fitted=rig.userData.gear.children[0];assert.equal(fitted.userData.garment,prefix+'_Body');assert.equal(fitted.skeleton,bodice.skeleton);assert(!bodice.visible);assert(skin.visible);
  styleActor(a,{...h,wardrobe});assert(bodice.visible);assert.equal(rig.userData.gear,undefined);
 }
 styleActor(a,h);assert(rig.getObjectByName('Female_Ranger_Body').visible);for(const prefix of['Corsair','Moonveil'])assert(!rig.getObjectByName(prefix+'_Skin').visible);disposeActor(a);
 assert.equal(wardrobeOptions('female').length,6);assert.equal(wardrobeOptions('male').length,4);assert.equal(appearanceOf({gender:'male',wardrobe:'corsair'}).wardrobe,'adventurer');
});

test('elf ears sweep behind the skull and remain attached to the animated head',async()=>{
 const s=await source('female'),a=createActor(s,{hero:hero('female'),race:'elf'}),ears=[];a.updateMatrixWorld(true);a.traverse(o=>{if(o.userData.elfEar)ears.push(o)});assert.equal(ears.length,2);
 for(const ear of ears){assert.equal(ear.parent.parent.name.toLowerCase(),'head');const positions=ear.geometry.attributes.position,tip=new T.Vector3().fromBufferAttribute(positions,positions.count-1),root=new T.Vector3().fromBufferAttribute(positions,0);assert(tip.z<root.z-.08);assert(tip.y-root.y<.08);assert(ear.geometry.attributes.normal.array.every(Number.isFinite));const before=tip.clone().applyMatrix4(ear.matrixWorld);ear.parent.parent.rotation.y+=.35;a.updateMatrixWorld(true);assert(tip.clone().applyMatrix4(ear.matrixWorld).distanceTo(before)>.01)}disposeActor(a);
});

test('bust proportions deform the actual female body and fitted garments, restore cleanly, and persist without affecting male rigs',async()=>{
 const s=await source('female'),h=hero('female'),a=createActor(s,{hero:h,race:'elf'}),rig=a.children[0];
 for(const wardrobe of['adventurer','court','robes','ranger','corsair','moonveil']){
  styleActor(a,{...h,wardrobe,bust:1});const name=wardrobe==='corsair'?'Corsair_Body':wardrobe==='moonveil'?'Moonveil_Body':['court','robes'].includes(wardrobe)?'Female_Peasant_Body':'Female_Ranger_Body',body=rig.getObjectByName(name),base=body.geometry.attributes.position.array.slice();
  styleActor(a,{...h,wardrobe,bust:1.6});const large=body.geometry.attributes.position.array.slice();assert(large.some((v,i)=>Math.abs(v-base[i])>.005),wardrobe+' must change the fitted torso');
  styleActor(a,{...h,wardrobe,bust:1.6});assert.deepEqual(body.geometry.attributes.position.array,large,'slider changes cannot accumulate');
  styleActor(a,{...h,wardrobe,bust:.7});assert(body.geometry.attributes.position.array.some((v,i)=>Math.abs(v-large[i])>.01));assert(body.geometry.attributes.normal.array.every(Number.isFinite));
  styleActor(a,{...h,wardrobe,bust:1});assert.deepEqual(body.geometry.attributes.position.array,base,'default restores the authored shape');
 }disposeActor(a);assert.equal(appearanceOf({gender:'female'}).bust,1);assert.equal(appearanceOf({gender:'female',bust:8}).bust,1.6);assert.equal(appearanceOf({gender:'male',bust:1.6}).bust,1);
});
