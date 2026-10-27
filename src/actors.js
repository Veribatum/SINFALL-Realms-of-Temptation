import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {clone} from '../vendor/SkeletonUtils.js';
import {styleActor} from './actor-style.js?v=5';

const models=new Map();
const equipment=/^(?:Knife|Throwable|\dH_|Badge_Shield|Rectangle_Shield|Round_Shield|Spike_Shield|Barbarian_Round_Shield|Mug|Spellbook)/;
export function modelFor(kind){
 if(['mage','spellbinder','necromancer','sorcerer','witch','cleric','druid','scholar','healer'].includes(kind))return'mage';
 if(['knight','templar','paladin','warden','sentinel'].includes(kind))return'knight';
 if(['barbarian','berserker','warrior','smith','oathbreaker'].includes(kind))return'barbarian';
 return'rogue';
}
export function loadActor(kind){
 const name=modelFor(kind);
 if(!models.has(name))models.set(name,new GLTFLoader().loadAsync(new URL(`../assets/models/${name}.glb`,import.meta.url).href).catch(error=>{models.delete(name);throw error}));
 return models.get(name);
}
export function createActor(source,{race='human',color='#ffffff',skin='#c39c7a',hair='#382b24',kind='citizen',hero=null,appearance=null}={}){
 const rig=clone(source.scene),group=new T.Group();group.add(rig);const armed=!['citizen','innkeeper','smith','scholar','healer','witness','stranger','merchant','tailor','farmer','bard','fisher','carpenter','miner','pilgrim','courier','cook'].includes(kind),model=modelFor(kind),weapon=model==='mage'?'2H_Staff':model==='knight'?'1H_Sword':model==='barbarian'?'2H_Axe':'Knife';
 rig.traverse(o=>{if(o.isMesh){o.visible=!equipment.test(o.name)||armed&&(o.name===weapon||model==='knight'&&o.name==='Round_Shield');o.castShadow=true;o.receiveShadow=true;o.geometry=o.geometry.clone();o.material=o.material.clone();o.material.roughness=.85;if(/Body|Cape|Arm/.test(o.name))o.material.color.set(color).lerp(new T.Color('#ffffff'),.72)}});
 // The four atlases reserve these same UV swatches for face and hair. Recolor
 // only those swatches in the material, preserving eyes, metal and fabric.
 rig.traverse(o=>{if(!o.isMesh)return;o.material.userData.palette={skin:new T.Color(skin),hair:new T.Color(hair)};o.material.customProgramCacheKey=()=> 'sinfall-palette-1';o.material.onBeforeCompile=shader=>{
  shader.uniforms.sinfallSkin={value:o.material.userData.palette.skin};shader.uniforms.sinfallHair={value:o.material.userData.palette.hair};shader.uniforms.sinfallHairBase={value:{rogue:.17,knight:.5,mage:.018,barbarian:.31}[model]};
  shader.fragmentShader='uniform vec3 sinfallSkin;\nuniform vec3 sinfallHair;\nuniform float sinfallHairBase;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
  #ifdef USE_MAP
   float sinfallLuma=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));
   if(vMapUv.x<0.125 && vMapUv.y<0.25) diffuseColor.rgb=sinfallSkin*clamp(sinfallLuma/0.58,0.5,1.2);
   else if(vMapUv.x<0.25 && vMapUv.y<0.25) diffuseColor.rgb=sinfallHair*clamp(sinfallLuma/sinfallHairBase,0.45,1.25);
  #endif`);
 }});
 rig.updateMatrixWorld(true);const bounds=new T.Box3();
 rig.traverse(o=>{if(o.isMesh&&o.visible&&/^(Rogue|Knight|Mage|Barbarian)_/.test(o.name))bounds.union(new T.Box3().setFromObject(o))});
 const height=bounds.max.y-bounds.min.y,scale=(race==='dwarf'?1.68:race==='elf'||race==='fae'?2.12:1.95)/Math.max(.1,height);
 rig.scale.setScalar(scale);rig.position.y=-bounds.min.y*scale;
 if(race==='dwarf')rig.scale.x*=1.15;
 if(race==='hollow')rig.traverse(o=>{if(o.isMesh)o.material.color.lerp(new T.Color('#9db9b8'),.3)});
 const clips=source.animations,mixer=new T.AnimationMixer(rig),actions=new Map(clips.map(c=>[c.name,mixer.clipAction(c)]));
 group.userData.animation={mixer,actions,current:null,kind};if(hero||appearance)styleActor(group,hero||{...appearance,raceId:race,classId:kind,equipment:{armor:{name:['guard','warden'].includes(kind)?'Warden mail':'Cloth'},weapon:armed?{name:weapon,visual:kind==='ranger'?'bow':kind==='guard'?'sword':undefined}:null}});animateActor(group,0,0);return group;
}
export function animateActor(group,dt,speed=0,pose){
 const a=group.userData.animation;if(!a)return;
 const clip=pose|| (speed>.8?'Running_A':speed>.02?'Walking_A':'Idle');
 if(a.current!==clip&&a.actions.has(clip)){const next=a.actions.get(clip);a.actions.get(a.current)?.fadeOut(.18);next.reset().fadeIn(.18).play();a.current=clip}
 a.mixer.update(Math.min(.1,dt));
}
export function disposeActor(group){
 const a=group.userData.animation;a?.mixer.stopAllAction();if(a)a.mixer.uncacheRoot(a.mixer.getRoot());
 group.traverse(o=>{o.geometry?.dispose();if(o.isMesh)o.material?.dispose()});
}

