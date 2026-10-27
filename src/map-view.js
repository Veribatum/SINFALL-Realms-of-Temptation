import {WORLD_MIN,WORLD_MAX,centerOf,realmSites,trailRoute,riverX,terrainHeight,homePlan} from './atlas.js?v=9';
import {BUILDINGS,entitiesFor} from './model.js?v=9';
import {regionOf} from './frontier.js?v=9';
import {questMarkers,trackedTarget,dungeonRoute} from './navigation.js?v=9';
const visible=(x,y,w)=>x>=0&&y>=0&&x<=w&&y<=w;
export function mapBounds(h,scope='local'){
 if(scope==='world')return {x:WORLD_MIN,z:WORLD_MIN,size:WORLD_MAX-WORLD_MIN};
 if(scope==='dungeon')return{x:0,z:0,size:68};
 const c=centerOf(h.location.townId),size=scope==='town'?260:1200;return{x:c.x-size/2,z:c.z-size/2,size};
}
export function drawAtlas(ctx,h,scope='local'){
 const w=ctx.canvas.width,bounds=mapBounds(h,scope),project=(x,z)=>[(x-bounds.x)/bounds.size*w,(z-bounds.z)/bounds.size*w],k=w/bounds.size,target=trackedTarget(h);
 ctx.clearRect(0,0,w,w);ctx.fillStyle='#d4c59f';ctx.fillRect(0,0,w,w);ctx.save();
 const line=(points,color,width,dash=[])=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach((p,i)=>{const[x,y]=project(p.x,p.z);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)});ctx.stroke();ctx.setLineDash([])};
 const pin=(p,label,color='#f4d783',size=8)=>{
  const [x,y]=project(p.x,p.z);if(!visible(x,y,w))return;
  ctx.fillStyle=color;ctx.strokeStyle='#172829';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size,y);ctx.lineTo(x,y+size);ctx.lineTo(x-size,y);ctx.closePath();ctx.fill();ctx.stroke();
  if(label){ctx.font='19px Georgia';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeText(label,x,y+size+24);ctx.fillStyle=color;ctx.fillText(label,x,y+size+24)}
 };
 if(scope==='dungeon'){
  ctx.fillStyle='#15282b';ctx.fillRect(0,0,w,w);const dungeon=h.world.towns[h.location.townId].dungeon,cell=w/17;
  for(let y=0;y<17;y++)for(let x=0;x<17;x++){ctx.fillStyle=dungeon.grid[y][x]?'#243b3d':'#a69e82';ctx.fillRect(x*cell+1,y*cell+1,cell-2,cell-2)}
  line(dungeonRoute(h,target),'#f8d779',7);
  for(const e of entitiesFor(h)){pin(e,e.type==='exit'?'Stairs':e.id===target?.id?e.name:null,e.type==='enemy'?'#c57768':e.type==='exit'?'#a1d1bc':'#ecd195',e.type==='exit'?11:7)}
 }else{
  // Sample the same seeded terrain and biome palette used by the walkable world.
  const cells=64,step=bounds.size/cells,px=w/cells;
  for(let row=0;row<cells;row++)for(let col=0;col<cells;col++){
   const x=bounds.x+(col+.5)*step,z=bounds.z+(row+.5)*step,id=Math.max(0,Math.min(2,Math.floor((x+600)/1200)))+3*Math.max(0,Math.min(2,Math.floor((z+600)/1200))),base=regionOf({id}).ground;
   ctx.fillStyle=base;ctx.fillRect(col*px,row*px,px+1,px+1);const elevation=terrainHeight(x,z,h.world.seed);ctx.fillStyle=elevation>0?'rgba(244,230,188,'+Math.min(.29,elevation/80)+')':'rgba(12,30,29,'+Math.min(.22,-elevation/55)+')';ctx.fillRect(col*px,row*px,px+1,px+1);
  }
  const river=[];for(let z=WORLD_MIN;z<=WORLD_MAX;z+=20)river.push({x:riverX(z),z});line(river,'#4d777c',Math.max(5,24*k));line(river,'#779ca0',Math.max(2,12*k));
  for(const v of[0,1200,2400]){line([{x:WORLD_MIN,z:v},{x:WORLD_MAX,z:v}],'#4d493b',Math.max(4,10*k));line([{x:v,z:WORLD_MIN},{x:v,z:WORLD_MAX}],'#4d493b',Math.max(4,10*k));line([{x:WORLD_MIN,z:v},{x:WORLD_MAX,z:v}],'#c8b98e',Math.max(2,5*k));line([{x:v,z:WORLD_MIN},{x:v,z:WORLD_MAX}],'#c8b98e',Math.max(2,5*k))}
  for(const town of h.world.towns){
   const c=centerOf(town.id);
   for(const site of realmSites(town)){line(trailRoute(c,site),'#c5b98f',Math.max(1,2.8*k),[5,4]);if(scope!=='world')pin(site,site.name.replace(/^The /,''),'#c3d8c1',5)}
   if(scope==='town'||scope==='local'){
    for(const b of[...homePlan(town),...BUILDINGS.map(b=>({...b,x:b.x+(b.id==='chapel'?28:0),z:b.z}))]){
     const[x,y]=project(c.x+b.x,c.z+b.z);ctx.save();ctx.translate(x,y);ctx.rotate(b.rotation||0);ctx.fillStyle='#243b38';ctx.strokeStyle='#d8cca8';ctx.lineWidth=1;ctx.fillRect(-5*k,-5*k,10*k,10*k);ctx.strokeRect(-5*k,-5*k,10*k,10*k);ctx.restore();
    }
   }
   const discovered=h.world.discovered.includes('town-'+town.id);pin(c,town.name,discovered?'#f4ddac':'#b4c2af',scope==='world'?12:7);
  }
  for(const marker of questMarkers(h))pin({x:marker.worldX,z:marker.worldZ},null,marker.questId===target?.questId?'#ffdc76':'#c99765',marker.questId===target?.questId?13:8);
 }
 if(target){
  const p=scope==='dungeon'?target:{x:target.worldX,z:target.worldZ};let[x,y]=project(p.x,p.z);
  x=Math.max(18,Math.min(w-18,x));y=Math.max(18,Math.min(w-18,y));ctx.strokeStyle='#ffe2a0';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,21,0,Math.PI*2);ctx.stroke();
 }
 const position=scope==='dungeon'||h.location.type==='realm'?h.position:h.world.realmReturn?.position||centerOf(h.location.townId);
 const[x,y]=project(position.x,position.z);if(visible(x,y,w)){ctx.save();ctx.translate(x,y);ctx.rotate(-(h.position.yaw||0));ctx.fillStyle='#fff9dc';ctx.strokeStyle='#1b363b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,14);ctx.lineTo(-10,-10);ctx.lineTo(10,-10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();ctx.font='18px system-ui';ctx.fillStyle='#fff9dc';ctx.textAlign='left';ctx.fillText('You',x+17,y+6)}
 ctx.restore();ctx.fillStyle='#f2e1b2';ctx.strokeStyle='#203535';ctx.font='bold 22px Georgia';ctx.textAlign='right';ctx.lineWidth=4;ctx.strokeText('N ↑',w-24,34);ctx.fillText('N ↑',w-24,34);
 ctx.font='18px system-ui';ctx.textAlign='left';const length=scope==='world'?500:scope==='dungeon'?8:scope==='town'?25:100;ctx.strokeStyle='#eadab5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(25,w-35);ctx.lineTo(25+length*k,w-35);ctx.stroke();ctx.fillText(length+' m',25,w-48);
}
