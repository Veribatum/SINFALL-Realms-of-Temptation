import * as T from '../vendor/three.module.js';
import {animateActor,playActorAction} from './actors.js?v=14';

export function skeletonModel(form='guardian'){
 const group=new T.Group();group.name='Raised skeleton';
 const bone=new T.MeshStandardMaterial({color:'#d5ccb0',roughness:.9}),dark=new T.MeshStandardMaterial({color:'#172b29',roughness:.9}),eye=new T.MeshStandardMaterial({color:'#98e1bf',emissive:'#4fae8e',emissiveIntensity:1.4});
 const add=(parent,geo,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m};
 const rod=(parent,length,x,y,z,r=.03)=>add(parent,new T.CylinderGeometry(r,r*.85,length,7),bone,x,y,z);
 const skull=add(group,new T.SphereGeometry(.185,12,10),bone,0,1.57,0);skull.scale.set(.88,1.1,.88);add(group,new T.BoxGeometry(.24,.1,.15),bone,0,1.4,.05);
 for(const s of[-1,1]){add(group,new T.SphereGeometry(.061,8,7),dark,s*.075,1.58,.135);add(group,new T.SphereGeometry(.024,8,6),eye,s*.075,1.58,.182)}
 add(group,new T.ConeGeometry(.025,.07,3),dark,0,1.5,.164);for(let i=0;i<6;i++)add(group,new T.BoxGeometry(.025,.045,.025),bone,(i-2.5)*.034,1.425,.137);
 rod(group,.58,0,1.08,0,.035);rod(group,.18,0,1.38,0,.035);
 for(let i=0;i<5;i++){const rib=add(group,new T.TorusGeometry(.19-i*.009,.016,5,16),bone,0,1.3-i*.065,0);rib.rotation.x=Math.PI/2;rib.scale.set(1, .7,1)}
 const pelvis=add(group,new T.TorusGeometry(.135,.035,6,14),bone,0,.8,0);pelvis.rotation.x=Math.PI/2;pelvis.scale.y=.75;
 const joints={};for(const s of[-1,1]){
  const shoulder=new T.Group();shoulder.position.set(s*.23,1.32,0);group.add(shoulder);rod(shoulder,.3,0,-.15,0);add(shoulder,new T.SphereGeometry(.05,7,6),bone,0,-.3,0);const elbow=new T.Group();elbow.position.y=-.3;shoulder.add(elbow);rod(elbow,.29,0,-.145,0);add(elbow,new T.BoxGeometry(.07,.12,.045),bone,0,-.32,0);shoulder.rotation.z=s*.1;joints[s<0?'armL':'armR']=shoulder;
  const hip=new T.Group();hip.position.set(s*.105,.78,0);group.add(hip);rod(hip,.35,0,-.175,0,.034);add(hip,new T.SphereGeometry(.045,7,6),bone,0,-.35,0);rod(hip,.34,0,-.52,0,.03);add(hip,new T.BoxGeometry(.08,.07,.18),bone,0,-.735,.04);joints[s<0?'legL':'legR']=hip;
 }
 const metal=new T.MeshStandardMaterial({color:form==='arcanist'?'#608da3':'#647371',metalness:.4,roughness:.65});
 if(form==='guardian'){const shield=add(joints.armL,new T.CylinderGeometry(.29,.29,.07,8),metal,0,-.35,.08);shield.rotation.x=Math.PI/2;add(joints.armR,new T.BoxGeometry(.05,.65,.1),metal,0,-.55,0)}
 if(form==='ravager'){rod(joints.armR,.95,0,-.42,0,.035);const blade=add(joints.armR,new T.TorusGeometry(.3,.05,4,12,Math.PI),metal,.2,-.02,0);blade.rotation.z=Math.PI/2}
 if(form==='arcanist'){rod(joints.armR,1.2,0,-.35,0,.035);add(joints.armR,new T.SphereGeometry(.13,8,6),eye,0,.3,0);add(group,new T.ConeGeometry(.25,.3,7),metal,0,1.88,0)}
 group.userData.form=form;group.userData.joints=joints;return group;
}

export class CombatScene{
 constructor(world){this.world=world;this.group=new T.Group();this.group.name='Combat effects and companion';world.scene.add(this.group);this.effects=[];this.clock=0;this.extraRings=[];this.enemyPrevious=new Map();
  this.ring=new T.Mesh(new T.RingGeometry(.88,1,48),new T.MeshBasicMaterial({color:'#de8666',transparent:true,opacity:.55,side:T.DoubleSide,depthWrite:false}));this.ring.rotation.x=-Math.PI/2;this.ring.visible=false;this.group.add(this.ring);
 }
 disposeObject(o){o.removeFromParent();const mats=new Set();o.traverse(x=>{x.geometry?.dispose();if(x.material)mats.add(x.material)});mats.forEach(m=>m.dispose())}
 event(event){
  const w=this.world,c=w.hero.combat,p=w.hero.position;
  if(event.kind==='projectile'||event.kind==='minionProjectile'){
   const mat=new T.MeshBasicMaterial({color:event.kind==='minionProjectile'?'#94cee9':event.action==='ability'?'#9af2c9':'#d8c298',transparent:true,depthWrite:false}),g=new T.Mesh(new T.SphereGeometry(.12,8,7),mat);this.group.add(g);this.effects.push({g,kind:'orb',from:{x:event.from.x,y:1.35,z:event.from.z},to:{x:event.to.x,y:1.15,z:event.to.z},age:0,life:.18+Math.hypot(event.to.x-event.from.x,event.to.z-event.from.z)/35});
  }
  if(['hit','hurt','heal','minionStrike','minionHurt'].includes(event.kind)){
   const g=new T.Mesh(new T.RingGeometry(.2,.27,16),new T.MeshBasicMaterial({color:event.kind==='heal'?'#97e7b8':event.kind==='hurt'?'#ef927c':'#f4d597',transparent:true,side:T.DoubleSide,depthWrite:false}));g.position.set(event.x,w.groundAt(event.x,event.z)+1.1,event.z);g.lookAt(w.camera.position);this.group.add(g);this.effects.push({g,kind:'pulse',age:0,life:.35});
   const element=document.createElement('span');element.className='damage-number '+(event.kind==='heal'?'healing':event.kind==='hurt'?'player-damage':'');element.textContent=(event.kind==='heal'?'+':'−')+event.amount;document.getElementById('combat-floats')?.append(element);this.effects.push({element,x:event.x,z:event.z,age:0,life:.95});
  }
  if(event.kind==='swing'){
   const g=new T.Mesh(new T.TorusGeometry(.95,.04,4,22,Math.PI*.8),new T.MeshBasicMaterial({color:'#e8ddae',transparent:true,depthWrite:false}));g.position.set(p.x,w.groundAt(p.x,p.z)+1.2,p.z);g.rotation.set(Math.PI/2,0,-w.player.rotation.y);this.group.add(g);this.effects.push({g,kind:'pulse',age:0,life:.22});
  }
  if(event.kind==='fled')for(const e of w.entities.filter(e=>(w.lastCombatIds||[w.lastCombatId]).includes(e.id))){e.g.position.set(e.x,w.groundAt(e.x,e.z),e.z);e.g.rotation.x=0}
  if(event.kind==='summon'){if(this.minion){this.disposeObject(this.minion);this.minion=null}this.summonAge=0}
  if(event.kind==='minionStrike')this.minionAttack=.35;
  if(event.kind==='enemyStrike'){const e=w.entities.find(e=>e.id===(event.id||c?.id||w.lastCombatId));if(e){e.g.userData.strike=.3;if(e.g.userData.rig)playActorAction(e.g.userData.rig,'1H_Melee_Attack_Slice_Diagonal',1.2)}}
 }
 update(dt){
  const w=this.world,h=w.hero,c=h.combat,s=h.companion;this.clock+=dt;
  if(s){
   if(this.minion&&this.minion.userData.form!==(s.form||'guardian')){this.disposeObject(this.minion);this.minion=null}if(!this.minion){this.minion=skeletonModel(s.form||'guardian');this.group.add(this.minion);this.summonAge=0}
   this.summonAge+=dt;this.minion.visible=true;this.minion.position.set(s.x,w.groundAt(s.x,s.z)-(1-Math.min(1,this.summonAge/.5))*.9,s.z);const goal=c||h.position,angle=Math.atan2(goal.x-s.x,goal.z-s.z);this.minion.rotation.y=angle;
   const moved=this.minionPrevious&&Math.hypot(this.minionPrevious.x-s.x,this.minionPrevious.z-s.z)>.001,j=this.minion.userData.joints,stride=moved?Math.sin(this.clock*10)*.5:0;j.legL.rotation.x=stride;j.legR.rotation.x=-stride;j.armL.rotation.x=-stride*.7;j.armR.rotation.x=stride*.7;
   if(this.minionAttack>0){this.minionAttack-=dt;j.armR.rotation.x=-1.25+Math.sin(this.minionAttack*10)*.5}this.minionPrevious={x:s.x,z:s.z};
  }else if(this.minion){this.disposeObject(this.minion);this.minion=null;this.minionPrevious=null}
  const foes=c?[c,...c.pack||[]]:[];
  while(this.extraRings.length<Math.max(0,foes.length-1)){const ring=new T.Mesh(this.ring.geometry.clone(),this.ring.material.clone());ring.rotation.x=-Math.PI/2;this.group.add(ring);this.extraRings.push(ring)}
  for(const[i,ring]of[this.ring,...this.extraRings].entries()){const foe=foes[i];ring.visible=!!foe?.windup;if(foe?.windup){const radius=foe.windup.intent==='heavy'?3.2:foe.windup.intent==='hex'?1.8:2.7;ring.position.set(foe.x,w.groundAt(foe.x,foe.z)+.07,foe.z);ring.scale.setScalar(radius);ring.material.color.set(foe.windup.intent==='hex'?'#b898dc':'#df735e');ring.material.opacity=.2+.55*(1-foe.windup.left/foe.windup.total)}}
  for(const foe of foes){const e=w.entities.find(e=>e.id===foe.id);if(e){const previous=this.enemyPrevious.get(foe.id),moving=previous&&Math.hypot(previous.x-foe.x,previous.z-foe.z)>.001;e.g.position.set(foe.x,w.groundAt(foe.x,foe.z),foe.z);e.g.rotation.y=Math.atan2(h.position.x-foe.x,h.position.z-foe.z);if(e.g.userData.rig)animateActor(e.g.userData.rig,dt,moving?.5:0);if(e.g.userData.strike>0){e.g.userData.strike-=dt;e.g.rotation.x=-Math.sin(e.g.userData.strike*10)*.18}else e.g.rotation.x=0;this.enemyPrevious.set(foe.id,{x:foe.x,z:foe.z})}}
  const rect=w.canvas.getBoundingClientRect();for(const fx of this.effects){fx.age+=dt;const t=fx.age/fx.life;if(fx.g){fx.g.material.opacity=Math.max(0,1-t);if(fx.kind==='orb'){const x=fx.from.x+(fx.to.x-fx.from.x)*t,z=fx.from.z+(fx.to.z-fx.from.z)*t;fx.g.position.set(x,w.groundAt(x,z)+fx.from.y+(fx.to.y-fx.from.y)*t+Math.sin(t*Math.PI)*.25,z)}else fx.g.scale.setScalar(1+t*2)}if(fx.element){const point=new T.Vector3(fx.x,w.groundAt(fx.x,fx.z)+1.7+t*.8,fx.z).project(w.camera);fx.element.style.left=(point.x*.5+.5)*rect.width+'px';fx.element.style.top=(-point.y*.5+.5)*rect.height+'px';fx.element.style.opacity=String(Math.max(0,1-t));fx.element.hidden=point.z>1}if(t>=1){if(fx.g)this.disposeObject(fx.g);fx.element?.remove()}}this.effects=this.effects.filter(fx=>fx.age<fx.life);
 }
 dispose(){for(const fx of this.effects)fx.element?.remove();this.disposeObject(this.group)}
}
