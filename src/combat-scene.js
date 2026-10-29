import * as T from '../vendor/three.module.js';
import {animateActor,playActorAction} from './actors.js?v=17';

export function skeletonModel(form='guardian'){
 const group=new T.Group();group.name='Raised skeleton';const joints={};
 const bone=new T.MeshStandardMaterial({color:'#bfb49c',roughness:.88}),dark=new T.MeshStandardMaterial({color:'#171d20',roughness:1}),eye=new T.MeshStandardMaterial({color:'#87c9b7',emissive:'#4fae8e',emissiveIntensity:1.1}),metal=new T.MeshStandardMaterial({color:form==='arcanist'?'#526b79':'#485856',metalness:.55,roughness:.6}),cloth=new T.MeshStandardMaterial({color:form==='arcanist'?'#343d54':'#384b46',roughness:1,side:T.DoubleSide});
 const add=(parent,geo,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m},rod=(parent,len,x,y,z,r=.025)=>add(parent,new T.CylinderGeometry(r,r*.8,len,7),bone,x,y,z),ball=(parent,r,x,y,z,mat=bone)=>add(parent,new T.IcosahedronGeometry(r,1),mat,x,y,z);
 const torso=new T.Group();torso.position.y=.82;group.add(torso);joints.torso=torso;
 for(let i=0;i<8;i++)ball(torso,.035,0,.07+i*.065,-.055);rod(torso,.5,0,.31,-.055,.023);
 // Ribs curve from the spine around the chest to the sternum, rather than
 // forming full horizontal rings. The open lower ribs taper into the waist.
 for(const side of[-1,1])for(let i=0;i<5;i++){const y=.49-i*.065,w=.18-i*.013,curve=new T.CatmullRomCurve3([new T.Vector3(0,y,-.055),new T.Vector3(side*w,y+.012,.01),new T.Vector3(side*w*.9,y-.035,.12),new T.Vector3(side*.025,y-.045,.13)]);add(torso,new T.TubeGeometry(curve,12,.014,5,false),bone)}
 rod(torso,.32,0,.32,.125,.02);for(const side of[-1,1]){const collar=rod(torso,.19,side*.1,.54,.005,.02);collar.rotation.z=side*1.4;ball(torso,.09,side*.11,0,0).scale.set(1.15,.65,.75);rod(torso,.16,side*.05,-.03,.05,.023).rotation.z=side*.5}
 const head=new T.Group();head.position.set(0,.64,-.015);torso.add(head);joints.head=head;const skull=ball(head,.16,0,.1,0);skull.scale.set(.88,1.05,.95);ball(head,.085,0,-.005,.045).scale.set(1.15,.52,.7);add(head,new T.BoxGeometry(.19,.045,.1),bone,0,-.045,.07);
 for(const side of[-1,1]){const socket=ball(head,.052,side*.062,.095,.126,dark);socket.scale.set(.9,1.15,.6);ball(head,.017,side*.062,.095,.156,eye);const brow=rod(head,.1,side*.061,.145,.125,.013);brow.rotation.z=side*1.3}add(head,new T.ConeGeometry(.024,.055,3),dark,0,.035,.142).rotation.z=Math.PI;for(let i=0;i<6;i++)add(head,new T.BoxGeometry(.019,.027,.024),bone,(i-2.5)*.029,-.025,.12);
 for(const side of[-1,1]){
  const suffix=side<0?'L':'R',shoulder=new T.Group();shoulder.position.set(side*.23,.52,0);torso.add(shoulder);rod(shoulder,.27,0,-.135,0);ball(shoulder,.042,0,-.27,0);const elbow=new T.Group();elbow.position.y=-.27;shoulder.add(elbow);for(const dx of[-.018,.018])rod(elbow,.25,dx,-.125,0,.014);const hand=add(elbow,new T.BoxGeometry(.06,.085,.035),bone,0,-.29,0);for(let i=0;i<3;i++)rod(elbow,.065,(i-1)*.023,-.35,.006,.009);shoulder.rotation.z=side*.12;elbow.rotation.x=-.18;joints['arm'+suffix]=shoulder;joints['elbow'+suffix]=elbow;
  const hip=new T.Group();hip.position.set(side*.1,.77,0);group.add(hip);rod(hip,.34,0,-.17,0,.028);ball(hip,.042,0,-.34,0);const knee=new T.Group();knee.position.y=-.34;hip.add(knee);for(const dx of[-.016,.016])rod(knee,.32,dx,-.16,0,.016);add(knee,new T.BoxGeometry(.075,.06,.17),bone,0,-.36,.045);joints['leg'+suffix]=hip;joints['knee'+suffix]=knee;
  if(form==='guardian')add(shoulder,new T.SphereGeometry(.115,8,6,0,Math.PI*2,0,Math.PI*.6),metal,0,0,0);
 }
 if(form==='guardian'){
  const shield=new T.Group();shield.position.set(0,-.24,.08);joints.elbowL.add(shield);const face=add(shield,new T.CylinderGeometry(.25,.25,.055,10),metal);face.rotation.x=Math.PI/2;add(shield,new T.TorusGeometry(.245,.018,5,20),bone,0,0,.032);ball(shield,.065,0,0,.055,metal);for(const side of[-1,1])add(shield,new T.BoxGeometry(.025,.38,.025),bone,side*.11,0,.035);
  const sword=new T.Group();sword.position.set(0,-.31,0);joints.elbowR.add(sword);rod(sword,.13,0,0,0,.023);add(sword,new T.BoxGeometry(.19,.027,.045),metal,0,.07,0);add(sword,new T.BoxGeometry(.055,.43,.025),metal,0,.29,0);add(sword,new T.ConeGeometry(.04,.12,4),metal,0,.56,0);sword.rotation.x=.3;
 }else if(form==='ravager'){
  const scythe=new T.Group();scythe.position.set(0,-.27,0);joints.elbowR.add(scythe);rod(scythe,1.15,0,.12,0,.024);const blade=add(scythe,new T.TorusGeometry(.28,.035,4,18,Math.PI*.8),metal,.19,.7,0);blade.rotation.z=.4;ball(torso,.075,0,.4,.16,metal);
 }else{
  const staff=new T.Group();staff.position.set(0,-.28,0);joints.elbowR.add(staff);rod(staff,1.25,0,.22,0,.022);ball(staff,.095,0,.88,0,eye);add(staff,new T.TorusGeometry(.14,.018,5,16),metal,0,.88,0);const hood=add(head,new T.SphereGeometry(.2,10,8,0,Math.PI*2,0,Math.PI*.72),cloth,0,.12,-.035);hood.scale.z=1.1;
 }
 for(const side of[-1,1]){const rag=add(torso,new T.ConeGeometry(.2,.38,5,1,true,0,Math.PI),cloth,side*.08,-.16,-.015);rag.rotation.y=side*1.3}
 group.userData.form=form;group.userData.joints=joints;return group;
}

export class CombatScene{
 constructor(world){this.world=world;this.group=new T.Group();this.group.name='Combat effects and companion';world.scene.add(this.group);this.effects=[];this.clock=0;this.extraRings=[];this.enemyPrevious=new Map();
  this.ring=new T.Mesh(new T.RingGeometry(.88,1,48),new T.MeshBasicMaterial({color:'#de8666',transparent:true,opacity:.55,side:T.DoubleSide,depthWrite:false}));this.ring.rotation.x=-Math.PI/2;this.ring.visible=false;this.group.add(this.ring);
  this.targetRing=new T.Mesh(new T.RingGeometry(.55,.63,32),new T.MeshBasicMaterial({color:'#ffe2a0',transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}));this.targetRing.rotation.x=-Math.PI/2;this.targetRing.visible=false;this.group.add(this.targetRing);
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
   this.summonAge+=dt;this.minion.visible=true;this.minion.position.set(s.x,w.groundAt(s.x,s.z)-(1-Math.min(1,this.summonAge/.5))*.9,s.z);const goal=c||h.position,angle=Math.atan2(goal.x-s.x,goal.z-s.z);this.minion.rotation.y=c||this.minionPrevious&&Math.hypot(this.minionPrevious.x-s.x,this.minionPrevious.z-s.z)>.001?angle:(h.position.yaw||0);
   const moved=this.minionPrevious&&Math.hypot(this.minionPrevious.x-s.x,this.minionPrevious.z-s.z)>.001,j=this.minion.userData.joints,stride=moved?Math.sin(this.clock*10)*.5:0;j.legL.rotation.x=stride;j.legR.rotation.x=-stride;j.armL.rotation.x=-stride*.7;j.armR.rotation.x=stride*.7;j.kneeL.rotation.x=Math.max(0,-stride)*.8;j.kneeR.rotation.x=Math.max(0,stride)*.8;j.torso.rotation.y=Math.sin(this.clock*2)*.025;j.head.rotation.y=Math.sin(this.clock*.7)*.07;j.elbowL.rotation.x=s.form==='guardian'?-.6:-.22;j.elbowR.rotation.x=-.2;
   if(this.minionAttack>0){this.minionAttack-=dt;j.armR.rotation.x=-1.25+Math.sin(this.minionAttack*10)*.5;j.elbowR.rotation.x=-.6+this.minionAttack;j.torso.rotation.y=Math.sin(this.minionAttack*9)*.2}this.minionPrevious={x:s.x,z:s.z};
  }else if(this.minion){this.disposeObject(this.minion);this.minion=null;this.minionPrevious=null}
  this.targetRing.visible=!!c;if(c)this.targetRing.position.set(c.x,w.groundAt(c.x,c.z)+.08,c.z);
  const foes=c?[c,...c.pack||[]]:[];
  while(this.extraRings.length<Math.max(0,foes.length-1)){const ring=new T.Mesh(this.ring.geometry.clone(),this.ring.material.clone());ring.rotation.x=-Math.PI/2;this.group.add(ring);this.extraRings.push(ring)}
  for(const[i,ring]of[this.ring,...this.extraRings].entries()){const foe=foes[i];ring.visible=!!foe?.windup;if(foe?.windup){const radius=foe.windup.intent==='heavy'?3.2:foe.windup.intent==='hex'?1.8:2.7;ring.position.set(foe.x,w.groundAt(foe.x,foe.z)+.07,foe.z);ring.scale.setScalar(radius);ring.material.color.set(foe.windup.intent==='hex'?'#b898dc':'#df735e');ring.material.opacity=.2+.55*(1-foe.windup.left/foe.windup.total)}}
  for(const foe of foes){const e=w.entities.find(e=>e.id===foe.id);if(e){const previous=this.enemyPrevious.get(foe.id),moving=previous&&Math.hypot(previous.x-foe.x,previous.z-foe.z)>.001;e.g.position.set(foe.x,w.groundAt(foe.x,foe.z),foe.z);e.g.rotation.y=Math.atan2(h.position.x-foe.x,h.position.z-foe.z);if(e.g.userData.rig)animateActor(e.g.userData.rig,dt,moving?.5:0);if(e.g.userData.strike>0){e.g.userData.strike-=dt;e.g.rotation.x=-Math.sin(e.g.userData.strike*10)*.18}else e.g.rotation.x=0;this.enemyPrevious.set(foe.id,{x:foe.x,z:foe.z})}}
  const rect=w.canvas.getBoundingClientRect();for(const fx of this.effects){fx.age+=dt;const t=fx.age/fx.life;if(fx.g){fx.g.material.opacity=Math.max(0,1-t);if(fx.kind==='orb'){const x=fx.from.x+(fx.to.x-fx.from.x)*t,z=fx.from.z+(fx.to.z-fx.from.z)*t;fx.g.position.set(x,w.groundAt(x,z)+fx.from.y+(fx.to.y-fx.from.y)*t+Math.sin(t*Math.PI)*.25,z)}else fx.g.scale.setScalar(1+t*2)}if(fx.element){const point=new T.Vector3(fx.x,w.groundAt(fx.x,fx.z)+1.7+t*.8,fx.z).project(w.camera);fx.element.style.left=(point.x*.5+.5)*rect.width+'px';fx.element.style.top=(-point.y*.5+.5)*rect.height+'px';fx.element.style.opacity=String(Math.max(0,1-t));fx.element.hidden=point.z>1}if(t>=1){if(fx.g)this.disposeObject(fx.g);fx.element?.remove()}}this.effects=this.effects.filter(fx=>fx.age<fx.life);
 }
 dispose(){for(const fx of this.effects)fx.element?.remove();this.disposeObject(this.group)}
}
