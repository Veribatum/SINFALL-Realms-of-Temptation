import * as T from '../vendor/three.module.js';
import {weaponStyle,armorStyle} from './appearance.js?v=17';

const hash=s=>[...String(s)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7);
export function gearLook(item={},kind){
 const style=item.type==='armor'?armorStyle(item):item.type==='weapon'||!item.type?weaponStyle(item,kind):item.type;
 const n=hash(item.name),quality=Math.max(0,Math.min(4,item.quality||(/Mythic/.test(item.name)?4:/Masterwork/.test(item.name)?3:/Runed/.test(item.name)?2:/Fine/.test(item.name)?1:0)));
 const variant=style==='sword'?/rapier|songblade/i.test(item.name)?'rapier':/greatsword|blackthorn/i.test(item.name)?'greatsword':/veil|rose|moon/i.test(item.name)?'crescent':['arming','leaf','arming'][n%3]:style==='staff'?/grave|hollow|bone/i.test(item.name)?'bone':/thorn|wood/i.test(item.name)?'thorn':'astral':String(n%3);
 return{style,variant,quality,seed:n,metal:['#929eaa','#b8bfc9','#9abfd0','#e1cb8f','#bb9adc'][quality],accent:['#a18351','#c8b278','#7bc4db','#e8c56f','#cb96ee'][quality],wood:['#513a2c','#322d36','#704d3b'][n%3],glow:quality>=2};
}
// Inventory art and the held model share a descriptor, so a new blade has a
// recognisable silhouette and material in both places. These are original meshes.
export function weaponModel(item={},kind,{adult=false}={}){
 const look=gearLook({...item,type:'weapon'},kind),{style,variant}=look,g=new T.Group();g.name='Equipped '+style;g.userData.look=look;
 const steel=new T.MeshStandardMaterial({color:look.metal,metalness:.7,roughness:.34}),trim=new T.MeshStandardMaterial({color:look.accent,metalness:.6,roughness:.4}),wood=new T.MeshStandardMaterial({color:look.wood,roughness:.85}),gem=new T.MeshStandardMaterial({color:look.accent,emissive:look.accent,emissiveIntensity:look.glow?.65:.15});
 const add=(geo,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m},box=(w,h,d,mat,x=0,y=0,z=0)=>add(new T.BoxGeometry(w,h,d),mat,x,y,z),orb=(r,mat,x,y,z)=>add(new T.IcosahedronGeometry(r,1),mat,x,y,z);
 const rod=(len,y=0,r=.024)=>add(new T.CylinderGeometry(r,r*1.15,len,8),wood,0,y,0);
 if(style==='bow'){
  const arc=add(new T.TorusGeometry(.52,.028,6,24,Math.PI),wood);arc.rotation.z=-Math.PI/2;arc.scale.x=.65;box(.012,1.04,.012,trim,0,0,0);for(const s of[-1,1])orb(.045,trim,0,s*.52,0);
 }else if(style==='staff'||style==='wand'){
  const len=style==='wand'?.65:1.65;rod(len,len*.15);for(const y of[-.13,.1])box(.075,.04,.075,trim,0,y,0);const top=len*.65;
  if(variant==='bone'){orb(.13,trim,0,top,0).scale.set(.85,1.1,.85);for(const s of[-1,1])orb(.025,gem,s*.055,top+.015,.105);box(.16,.035,.08,wood,0,top-.1,0)}else{orb(style==='wand'?.065:.115,gem,0,top,0);const ring=add(new T.TorusGeometry(style==='wand'?.1:.19,.018,6,18),trim,0,top,0);ring.rotation.y=variant==='thorn'?Math.PI/2:0}
  if(look.glow)for(const side of[-1,1])box(.02,.18,.025,gem,side*.04,.35,0);
 }else if(style==='axe'||style==='hammer'){
  rod(.8,.1);if(style==='hammer'){box(.4,.23,.25,steel,0,.48);box(.13,.28,.29,trim,0,.48)}else{const shape=new T.Shape();shape.moveTo(0,.28);shape.lineTo(.35,.22);shape.quadraticCurveTo(.49,.49,.32,.66);shape.lineTo(0,.58);shape.closePath();add(new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false}),steel,0,0,-.027);orb(.06,trim,0,.47,0)}
 }else if(style==='spear'){
  rod(1.2,.2);add(new T.ConeGeometry(.085,.38,4),steel,0,1,0);box(.15,.035,.08,trim,0,.8);
 }else{
  const dagger=style==='dagger',len=dagger?.4:variant==='greatsword'?.92:variant==='rapier'?.81:.72,width=dagger?.07:variant==='rapier'?.035:variant==='greatsword'?.13:.09;
  rod(.22);orb(.05,trim,0,-.13,0);const blade=new T.Shape();blade.moveTo(-width/2,.13);blade.lineTo(width/2,.13);if(variant==='crescent'){blade.quadraticCurveTo(.15,len*.75,.13,len+.18);blade.quadraticCurveTo(.025,len*.8,-width/2,.13)}else{blade.lineTo(width*(variant==='leaf'?.85:.5),len*.65);blade.lineTo(0,len+.18);blade.lineTo(-width*(variant==='leaf'?.85:.5),len*.65);blade.closePath()}add(new T.ExtrudeGeometry(blade,{depth:.028,bevelEnabled:false}),steel,0,0,-.014);
  if(variant==='rapier'){const guard=add(new T.TorusGeometry(.12,.015,5,18,Math.PI*1.5),trim,0,.08);guard.rotation.y=Math.PI/2}else for(const side of[-1,1]){const guard=box(dagger?.11:.15,.04,.055,trim,side*(dagger?.055:.07),.1);guard.rotation.z=side*(look.seed%2?.3:-.15)}
  if(look.glow)for(let i=0;i<3;i++)box(.018,.025,.034,gem,0,.27+i*.11,0);
 }
 g.rotation.x=Math.PI/2;return g;
}

export function itemArt(item={},kind){
 const a=gearLook(item,kind),paths={sword:a.variant==='rapier'?'M12 26 32 5m-19 18-6-5m1 12 4-4M28 7l7-3-3 7':a.variant==='crescent'?'M12 27Q29 24 33 4Q22 20 10 23M7 21l8 7m-10 5 6-8':'m12 27 3-8L31 4l3 4-16 16-6 3M8 22l10 10m-13 3 7-8',dagger:'m13 24 6-11 13-8-8 13-8 8M9 21l11 11m-15 2 7-8',axe:'M10 33 24 6m-2 4Q33 2 35 15l-9 6-9-5',hammer:'m10 34 12-24m-7-3 13 7 5-9-13-7z',spear:'m8 34 19-24m-5 2 3-10 9-1-1 9-10 3',bow:'M9 4Q36 18 9 34M9 4l8 15-8 15m-2-15h26m-6-4 6 4-6 4',staff:'m10 34 13-23m-5-2a7 7 0 1 0 12-7 7 7 0 0 0-12 7',wand:'m8 32 18-20m1-8v7m-4-4h8M9 9v5m-3-2h6',potion:'M16 5h8m-7 0v9L9 29q-2 6 5 6h12q7 0 5-6l-8-15V5M13 24h14',mana:'M16 5h8m-7 0v9L9 29q-2 6 5 6h12q7 0 5-6l-8-15V5m-2 12-5 8h7l-4 6',trinket:'M9 6q11 17 22 0M20 17l-7 8 7 10 7-10z',quest:'M10 4h17l4 5v27H10V4m17 0v6h5M15 16h11M15 21h11M15 26h7',cloth:'m14 6 6 5 6-5 10 8-6 7-4-3v17H14V18l-4 3-6-7z',leather:'m14 6 6 5 6-5 7 6-4 7-3-1v17H14V18l-3 1-4-7zM20 12v21m-6-8h12',mail:'m14 6 6 5 6-5 10 8-6 7-4-3v17H14V18l-4 3-6-7zM16 17h8m-8 5h8m-8 5h8',plate:'m14 6 6 5 6-5 8 7-5 7-3-1v16H14V19l-3 1-5-7zM20 12v21m-5-11 5 4 5-4'};
 const path=paths[a.style]||paths.quest,color=a.style==='potion'?'#c47772':a.style==='mana'?'#78b6d4':a.accent;
 return '<svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="'+color+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/></svg>';
}
