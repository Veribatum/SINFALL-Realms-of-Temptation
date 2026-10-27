import * as T from '../vendor/three.module.js';
import {appearanceOf,armorStyle} from './appearance.js?v=7';
const findBone=(rig,name)=>{let b;rig.traverse(o=>{if(o.isBone&&o.name.toLowerCase().replace(/[._]/g,'')===name)b=o});return b};
function clear(rig){const old=rig.userData.adultDetails;if(!old)return;old.removeFromParent();old.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});delete rig.userData.adultDetails}
function detail(parent,geo,material,x,y,z){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function elvenEar(side){const g=new T.BufferGeometry(),p=[.085,.065,.01,.105,.145,-.015,.205,.215,-.015,.158,.105,-.012,.09,.065,-.025,.105,.145,-.035,.205,.215,-.015,.158,.105,-.035];g.setAttribute('position',new T.Float32BufferAttribute(p.map((v,i)=>i%3===0?v*side:v),3));g.setIndex([0,1,2,0,2,3,4,6,5,4,7,6,1,5,6,1,6,2,0,3,7,0,7,4]);g.computeVertexNormals();return g}
export function styleAdult(group,h,applyEquipment){
 const rig=group.children[0],a=appearanceOf(h),gender=rig.userData.modelGender||group.userData.sourceGender;
 group.userData.needsModelReload=gender!==a.gender;group.userData.modelGender=gender;
 const width={slender:.9,balanced:1,broad:1.14}[a.build],height={short:.92,average:1,tall:1.09}[a.height];group.scale.set(width,height,1);
 const armor=armorStyle(h.equipment?.armor);
 const peasant=a.wardrobe==='robes'||a.wardrobe==='court',hair=a.hairStyle==='short'?'cropped':a.hairStyle==='braid'?'long':a.hairStyle;
 rig.traverse(o=>{if(!o.isMesh)return;const n=o.name.toLowerCase(),role=o.material.name;
  if(!o.userData.authoredPositions&&o.isSkinnedMesh)o.userData.authoredPositions=o.geometry.attributes.position.array.slice();
  if(n.startsWith('female_ranger')||n.startsWith('male_ranger'))o.visible=!peasant;
  if(n.startsWith('female_peasant')||n.startsWith('male_peasant'))o.visible=peasant&&!(a.wardrobe==='robes'&&/legs|feet/.test(n));
  if(n.endsWith('body_belt_2'))o.visible=false;
  if(n==='fitted_neckline_insert')o.visible=!peasant;
  if(n.includes('acc_pauldron'))o.visible=!peasant&&(a.wardrobe==='ranger'||['mail','plate'].includes(armor));
  if(n==='ceremonial_robe'){o.visible=a.wardrobe==='robes';o.material.color.set(a.outfit);}
  if(n.startsWith('hair_'))o.visible=n==='hair_'+hair||(n==='hair_beard'&&a.beard!=='none');
  if(role==='hair')o.material.color.set(a.hair);
  if(role==='eyes')o.material.color.set(a.eyes);
  if(role==='skin'){o.material.color.set(a.skin);if(n==='fitted_neckline_insert')o.material.color.multiplyScalar(.78);}
  if(role==='ranger'||role==='peasant'){o.material.map=null;const leather=/belt|bracer|feet|boots/.test(n),metal=/pauldron/.test(n);o.material.color.set(metal?'#98a5a6':leather?'#805b3d':a.outfit);o.material.roughness=metal?.5:.88;o.material.metalness=metal?.45:0;o.material.needsUpdate=true;}
  if(n==='authored_face_and_neck'){
   const p=o.geometry.attributes.position,base=o.userData.authoredPositions;
   for(let i=0;i<p.count;i++){const x=base[i*3],y=base[i*3+1],z=base[i*3+2],f=Math.max(0,Math.min(1,(y-1.51)/.08));p.setXYZ(i,x*(1+f*({soft:0,angular:-.05,round:.075,regal:-.025}[a.face]||0)),y,z+f*(a.face==='regal'?.003:0))}p.needsUpdate=true;o.geometry.computeVertexNormals();
  }
  if(n==='hair_long'){
   const p=o.geometry.attributes.position,b=o.userData.authoredPositions;
   for(let i=0;i<p.count;i++){const y=b[i*3+1],fall=Math.max(0,1.63-y);p.setXYZ(i,b[i*3]*(a.hairStyle==='braid'&&y<1.62?.65:1),y-fall*.85,b[i*3+2]-.012)}p.needsUpdate=true;
  }
 });
 clear(rig);const head=findBone(rig,'head');if(head){const g=new T.Group();g.name='Ancestry features';head.add(g);rig.userData.adultDetails=g;const skin=new T.MeshStandardMaterial({color:a.skin,roughness:.85,side:T.DoubleSide}),hairMat=new T.MeshStandardMaterial({color:a.hair,roughness:.86});
  if(a.wardrobe==='court'){const gold=new T.MeshStandardMaterial({color:'#ceb47c',roughness:.4,metalness:.6});const crown=detail(g,new T.TorusGeometry(.103,.008,6,24),gold,0,.145,.005);crown.rotation.x=Math.PI/2;detail(g,new T.OctahedronGeometry(.015),gold,0,.148,.105);}
  if(['elf','fae'].includes(h.raceId))for(const s of[-1,1])detail(g,elvenEar(s),skin,0,0,0);
  if(h.raceId==='duskborn')for(const s of[-1,1]){const horn=detail(g,new T.ConeGeometry(.025,.17,8),hairMat,s*.07,.225,-.025);horn.rotation.z=-s*.3}
  if(h.raceId==='beastkin')for(const s of[-1,1]){const ear=detail(g,new T.ConeGeometry(.045,.12,4),hairMat,s*.09,.24,-.015);ear.rotation.z=-s*.28}
  if(a.marking!=='none'){const m=new T.MeshStandardMaterial({color:a.marking==='scar'?'#b77a70':'#537c88',roughness:.9});for(const s of a.marking==='scar'?[1]:[-1,1]){const mark=detail(g,new T.BoxGeometry(.006,.045,.003),m,s*.055,.064,.086);mark.rotation.z=s*.4}}
 }
 applyEquipment(rig,h,{bodyArmor:false});
 // The adult outfit already supplies the cloth torso. Other armor reuses its
 // authored skin and silhouette instead of attaching the legacy chest box.
 if(h.equipment?.armor&&armor!=='cloth'){
  const garments=[];rig.traverse(o=>{if(o.isSkinnedMesh&&o.visible&&/_(Ranger|Peasant)_Body$/.test(o.name))garments.push(o)});
  const fitted=new T.Group();fitted.name='Equipped '+armor+' armor';rig.add(fitted);rig.userData.gear=fitted;rig.updateMatrixWorld(true);const inverse=rig.matrixWorld.clone().invert();
  for(const garment of garments){const material=garment.material.clone();material.color.set({leather:'#916b42',mail:'#6e8791',plate:'#a6b6c0'}[armor]);material.metalness=armor==='plate'?.65:armor==='mail'?.4:0;material.roughness=armor==='plate'?.4:.8;const mesh=new T.SkinnedMesh(garment.geometry.clone(),material);mesh.name='Fitted '+armor+' torso';mesh.bind(garment.skeleton,garment.bindMatrix);mesh.applyMatrix4(inverse.clone().multiply(garment.matrixWorld));mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.garment=garment.name;fitted.add(mesh);garment.visible=false;}
 }
 if(rig.userData.weapon){
  const weapon=rig.userData.weapon;weapon.scale.setScalar(.8);
  // Quaternius hand axes differ from the former KayKit weapon slot. This
  // rest grip puts the shaft upright in the relaxed carry pose.
  weapon.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(.156,-.862,.482).normalize());
  weapon.userData.adultGrip={hand:weapon.parent,index:findBone(rig,'index02r'),thumb:findBone(rig,'thumb02r'),point:new T.Vector3(),thumbPoint:new T.Vector3()};
  updateAdultGrip(group);
 }
 if(rig.userData.trinket)rig.userData.trinket.scale.setScalar(.6);
 group.userData.appearance=a;
}

// Keep the handle between the curled index finger and thumb as the hand moves.
export function updateAdultGrip(group){
 const weapon=group.children[0]?.userData.weapon,grip=weapon?.userData.adultGrip;if(!grip?.index||!grip.thumb)return;
 grip.index.updateWorldMatrix(true,false);grip.thumb.updateWorldMatrix(true,false);
 grip.point.setFromMatrixPosition(grip.index.matrixWorld);grip.thumbPoint.setFromMatrixPosition(grip.thumb.matrixWorld);
 grip.point.add(grip.thumbPoint).multiplyScalar(.5);grip.hand.worldToLocal(grip.point);weapon.position.copy(grip.point);
}
