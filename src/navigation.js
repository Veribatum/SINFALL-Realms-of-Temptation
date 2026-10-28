import {entitiesFor,BUILDINGS,townOf} from './model.js?v=10';
import {centerOf,realmPoint} from './atlas.js?v=10';
const live=q=>q.state==='active'||q.state==='ready';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function view(h,townId,type,room){
 return {...h,world:{...h.world,visits:{...h.world.visits}},location:{type,townId,...(type==='realm'?{area:'wilds'}:{}),...(room?{room}:{})}};
}
function entities(h,townId,type='realm',room){return entitiesFor(view(h,townId,type,room))}
function nearest(h,list){const p=h.location.type==='realm'?h.position:centerOf(h.location.townId);return list.slice().sort((a,b)=>distance(a,p)-distance(b,p))[0]}
function outside(h,townId,id){return entities(h,townId).find(e=>e.id===id||e.role===id)}
function destination(h,townId,id,inside,room){
 const door=outside(h,townId,id);if(!door)return null;
 if(inside&&h.location.townId===townId&&h.location.type===inside&&(inside!=='interior'||h.location.room===room)){
  const local=entities(h,townId,inside,room);
  return {door,target:local,scene:inside,room};
 }
 return {door,target:[door],scene:'realm'};
}
export function questTarget(h,questId='main'){
 const q=questId==='main'?null:h.world.quests.find(q=>q.id===questId&&live(q));
 if(questId!=='main'&&!q)return null;
 const townId=q?q.townId:0,town=h.world.towns[townId];if(!town)return null;
 let setup,choose=()=>true,instruction;
 const stage=h.campaign.stage;
 if(!q){
  if(stage==='complete')return null;
  if(stage==='arrival'){setup=destination(h,0,'witness');instruction='Speak with '+town.npcs.witness.name}
  if(stage==='trail'){setup=destination(h,0,'clue');instruction='Investigate the strange remains'}
  if(stage==='counsel'){setup=destination(h,0,'door-archive','interior','archive');choose=e=>e.role==='scholar';instruction='Speak with '+town.npcs.scholar.name+' inside the Lantern Archive'}
  if(stage==='descent'||stage==='heart'){setup=destination(h,0,'gate','dungeon');choose=e=>e.type===(stage==='heart'?'artifact':'boss');instruction=stage==='heart'?'Decide the fate of '+h.campaign.artifact:'Find '+h.campaign.enemy+' in the undercrypt'}
 }else if(q.state==='ready'){
  const role=Object.keys(town.npcs).find(role=>town.npcs[role].name===q.giver)||q.id.split('-').at(-1);
  const building=BUILDINGS.find(b=>b.role===role);
  setup=building?destination(h,townId,'door-'+building.id,'interior',building.id):destination(h,townId,role);
  choose=e=>e.role===role;instruction='Return to '+q.giver+(building?' inside '+building.name:'');
 }else if(q.kind==='relic'){
  setup=destination(h,townId,'gate','dungeon');choose=e=>e.type==='chest';instruction='Recover a keepsake from an unopened undercrypt coffer';
 }else{
  const choices=entities(h,townId).filter(e=>q.kind==='herbs'?e.type==='herbs':q.kind==='hunt'?e.type==='enemy':e.id==='caravan');
  let target=nearest(h,choices);
  if(q.kind==='hunt'&&h.location.type==='dungeon'&&h.location.townId===townId){const enemy=nearest({...h,location:{...h.location,type:'realm'}},entities(h,townId,'dungeon').filter(e=>e.type==='enemy'));if(enemy)setup={door:outside(h,townId,'gate'),target:[enemy],scene:'dungeon'}}
  setup??=target?{door:target,target:[target],scene:'realm'}:null;
  instruction=q.kind==='herbs'?'Gather silverleaf on the old road':q.kind==='hunt'?'Defeat creatures on the old road or in the undercrypt':'Find the stranded courier';
 }
 if(!setup?.door)return null;
 let target=setup.scene==='realm'?setup.target[0]:nearest({...h,location:{...h.location,type:'realm'}},setup.target.filter(choose));
 if(!target)return null;
 const global={x:setup.door.x,z:setup.door.z};
 // When another room or crypt blocks the route, guide to its real exit first.
 let scene=setup.scene;
 if(h.location.type!=='realm'&&h.location.type!==scene||h.location.type==='interior'&&(scene!=='interior'||setup.room!==h.location.room)||h.location.type==='dungeon'&&h.location.townId!==townId){
  target=entities(h,h.location.townId,h.location.type,h.location.room).find(e=>e.type==='exit');
  scene=h.location.type;instruction='Leave '+(h.location.type==='dungeon'?'the undercrypt':'this building')+'; then '+instruction.charAt(0).toLowerCase()+instruction.slice(1);
 }
 if(!target)return null;
 return {...target,townId,interactionTownId:target.type==='exit'?h.location.townId:townId,scene,questId,title:q?.title||h.campaign.title,instruction,worldX:global.x,worldZ:global.z};
}
export function trackedQuest(h){const id=h.settings?.trackedQuest;return id&&h.world.quests.some(q=>q.id===id&&live(q))?id:'main'}
export function trackedTarget(h){return questTarget(h,trackedQuest(h))}
export function questMarkers(h){return [questTarget(h),...h.world.quests.filter(live).map(q=>questTarget(h,q.id))].filter(Boolean)}
export function targetDistance(h,target){
 if(!target)return null;
 const p=h.location.type==='realm'?h.position:h.location.type===target.scene?h.position:h.world.realmReturn?.position||centerOf(h.location.townId);
 return Math.ceil(distance(p,target));
}
export function directionTo(p,target){const a=(Math.atan2(target.x-p.x,-(target.z-p.z))*180/Math.PI+360)%360;return ['N','NE','E','SE','S','SW','W','NW'][Math.round(a/45)%8]}
export function dungeonRoute(h,target){
 if(!target||h.location.type!=='dungeon'||target.scene!=='dungeon')return [];
 const grid=townOf(h).dungeon.grid,start=[Math.floor(h.position.x/4),Math.floor(h.position.z/4)],end=[Math.floor(target.x/4),Math.floor(target.z/4)],key=(x,y)=>y*17+x;
 const queue=[start],seen=new Map([[key(...start),null]]);
 for(let i=0;i<queue.length;i++){const[x,y]=queue[i];if(x===end[0]&&y===end[1]){const path=[];let k=key(x,y);while(k!==null){path.unshift({x:(k%17)*4+2,z:Math.floor(k/17)*4+2});k=seen.get(k)}return path}for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=key(xx,yy);if(grid[yy]?.[xx]===0&&!seen.has(k)){seen.set(k,key(x,y));queue.push([xx,yy])}}}
 return [];
}

export function isTargetHere(h,entity,target=trackedTarget(h)){
 return !!target&&entity.id===target.id&&target.scene===h.location.type&&(target.interactionTownId??target.townId)===h.location.townId;
}
