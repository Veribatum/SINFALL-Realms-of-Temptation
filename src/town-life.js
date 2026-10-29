// Civilian routines are derived from the world's clock and stable household
// identity. They resume on reload without a second save system or random jumps.
export function dailyRoutine(resident,hour=12){
 const h=((hour%24)+24)%24,offset=(resident.index||0)%3*.25,i=resident.index||0,home=resident.home||[0,20],work=resident.work||[28,17],green=resident.green||[(i%2?1:-1)*(5.4+i%3*1.1),-14+Math.floor(i/2)*2.4];
 if(resident.role==='guard'||resident.role==='ranger')return{phase:h>=19||h<6?'night-watch':'watch',activity:h>=19||h<6?'Night patrol':'Keeping watch',points:resident.patrol||(resident.role==='ranger'?[[6,31],[6,0],[6,-25]]:[[-6,31],[-6,0],[-6,-25]]),retire:false};
 if(h<6+offset||h>=22+offset)return{phase:'home',activity:'Resting at home',points:[home],retire:true};
 if(h<8+offset)return{phase:'breakfast',activity:'Breakfast on the green',points:[green,[green[0]+1.2,green[1]]],retire:false};
 if(h<17+offset)return{phase:'work',activity:resident.job||'Working in the market',points:[work,[work[0]+.9,work[1]+.5]],retire:false};
 if(h<19+offset)return{phase:'market',activity:'Shopping and sharing news',points:[[(i%2?1:-1)*(5.4+i%3*1.1),4+i%8*2],[(i%2?1:-1)*(5.4+i%3*1.1),4+(i+3)%8*2]],retire:false};
 return{phase:'evening',activity:'An evening near the inn',points:[[-5.5-i%3*1.2,4+Math.floor(i/3)*1.8],[-5.5-i%3*1.2,5+Math.floor(i/3)*1.8]],retire:false};
}

// Small bounded A* for pedestrian detours. Routes are cached per destination
// by the scene; civilians follow walkable streets instead of crossing houses.
export function pedestrianRoute(from,to,canMove){
 const step=1.5,minX=Math.floor((Math.min(from.x,to.x)-14)/step),maxX=Math.ceil((Math.max(from.x,to.x)+14)/step),minZ=Math.floor((Math.min(from.z,to.z)-14)/step),maxZ=Math.ceil((Math.max(from.z,to.z)+14)/step),key=(x,z)=>x+':'+z;
 const start={x:Math.round(from.x/step),z:Math.round(from.z/step),g:0,parent:null},goal={x:Math.round(to.x/step),z:Math.round(to.z/step)},open=[start],best=new Map([[key(start.x,start.z),0]]),closed=new Set();let found;
 for(let n=0;open.length&&n<3500;n++){
  let pick=0;for(let i=1;i<open.length;i++)if(open[i].f<open[pick].f)pick=i;const current=open.splice(pick,1)[0],k=key(current.x,current.z);if(closed.has(k))continue;closed.add(k);
  if(Math.hypot(current.x-goal.x,current.z-goal.z)<=1.05){found=current;break}
  for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const x=current.x+dx,z=current.z+dz,id=key(x,z);if(x<minX||x>maxX||z<minZ||z>maxZ||closed.has(id)||!canMove(x*step,z*step)||!canMove((current.x+dx*.5)*step,(current.z+dz*.5)*step))continue;const g=current.g+Math.hypot(dx,dz);if(g>=(best.get(id)??Infinity))continue;best.set(id,g);open.push({x,z,g,f:g+Math.hypot(x-goal.x,z-goal.z),parent:current})}
 }
 if(!found)return[];const route=[];for(let p=found;p?.parent;p=p.parent)route.unshift({x:p.x*step,z:p.z*step});if(canMove(to.x,to.z))route.push({x:to.x,z:to.z});return route;
}
