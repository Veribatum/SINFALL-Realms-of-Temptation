import {frontierSites} from './frontier.js?v=8';
import {townWardrobe} from './appearance.js?v=8';
export const REGION_SIZE=1200,CHUNK_SIZE=300,WORLD_MIN=-600,WORLD_MAX=3000,GRID_STEP=12.5;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const centerOf=id=>({x:id%3*REGION_SIZE,z:Math.floor(id/3)*REGION_SIZE});
export function regionAt(x,z){return clamp(Math.floor((x+600)/1200),0,2)+3*clamp(Math.floor((z+600)/1200),0,2)}
export function realmArea(x,z){const c=centerOf(regionAt(x,z));return Math.hypot(x-c.x,z-c.z)<140?'town':'wilds'}
export function realmPoint(townId,type,x,z){const c=centerOf(townId);return{x:c.x+(type==='wilds'?x*3.5:x),z:c.z+(type==='wilds'?z*3.5-160:z)}}
export function trailRoute(c,s){const dx=s.x-c.x,dz=s.z-c.z;return[c,Math.abs(dx)>Math.abs(dz)?{x:c.x+Math.sign(dx)*155,z:c.z}:{x:c.x,z:c.z+Math.sign(dz)*155},s]}
export const realmSites=town=>frontierSites(town).map(s=>({...s,...realmPoint(town.id,'wilds',s.x,s.z)}));
export const riverX=z=>430+Math.sin(z/245)*55;
export function onBridge(x,z){return Math.abs(x-riverX(z))<35&&Math.min(...[0,1200,2400].map(v=>Math.abs(z-v)))<6}
function segmentDistance(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-a.x-t*dx,z-a.z-t*dz)}
const siteCache=Array.from({length:9},(_,id)=>realmSites({id}));
export function trailDistance(x,z){const id=regionAt(x,z),c=centerOf(id);let d=Math.min(Math.abs(x-c.x),Math.abs(z-c.z));for(let j=0;j<9;j++){const cc=centerOf(j);if(Math.abs(x-cc.x)>750||Math.abs(z-cc.z)>750)continue;for(const s of siteCache[j]){const route=trailRoute(cc,s);d=Math.min(d,segmentDistance(x,z,route[0],route[1]),segmentDistance(x,z,route[1],route[2]))}}return d}
const smooth=t=>t*t*(3-2*t),hash=(x,z,seed)=>{let n=Math.imul(x+seed,374761393)^Math.imul(z,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295};
function noise(x,z,seed,scale){x/=scale;z/=scale;const a=Math.floor(x),b=Math.floor(z),u=smooth(x-a),v=smooth(z-b);return(hash(a,b,seed)*(1-u)+hash(a+1,b,seed)*u)*(1-v)+(hash(a,b+1,seed)*(1-u)+hash(a+1,b+1,seed)*u)*v}
export function terrainHeight(x,z,seed=0){const c=centerOf(regionAt(x,z)),r=Math.hypot(x-c.x,z-c.z);let h=(noise(x,z,seed,260)-.48)*44+(noise(x,z,seed+17,85)-.5)*8;let flat=clamp((r-145)/65,0,1);const camp=Math.max(Math.abs(x-c.x)/75,Math.abs(z-c.z+190)/105);flat*=clamp((camp-1)*2,0,1);flat*=clamp((trailDistance(x,z)-8)/18,0,1);for(let id=0;id<9;id++){const cc=centerOf(id);if(Math.abs(x-cc.x)>750||Math.abs(z-cc.z)>750)continue;for(const s of siteCache[id])flat*=clamp((Math.hypot(x-s.x,z-s.z)-20)/25,0,1)}h*=smooth(flat);const bank=Math.abs(x-riverX(z));if(bank<18&&!onBridge(x,z))h=Math.min(h,-2.5*(1-bank/18));return h}
const surfaceCache=new Map();
export function surfaceHeight(x,z,seed=0){if(onBridge(x,z))return .27;const gx=Math.floor(x/GRID_STEP),gz=Math.floor(z/GRID_STEP),u=x/GRID_STEP-gx,v=z/GRID_STEP-gz;const at=(a,b)=>{const key=seed+':'+a+':'+b;if(!surfaceCache.has(key)){if(surfaceCache.size>40000)surfaceCache.clear();surfaceCache.set(key,terrainHeight(a*GRID_STEP,b*GRID_STEP,seed))}return surfaceCache.get(key)};const a=at(gx,gz),b=at(gx+1,gz),c=at(gx,gz+1),d=at(gx+1,gz+1);return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v)}
export function navigable(x,z,seed=0){if(x<WORLD_MIN+2||x>WORLD_MAX-2||z<WORLD_MIN+2||z>WORLD_MAX-2)return false;if(Math.abs(x-riverX(z))<10&&!onBridge(x,z))return false;const h=surfaceHeight(x,z,seed);return Math.abs(surfaceHeight(x+1,z,seed)-h)<.9&&Math.abs(surfaceHeight(x,z+1,seed)-h)<.9}
export function chunkKeys(x,z,quality='high'){const radius=quality==='high'?2:1,cx=Math.floor((x-WORLD_MIN)/CHUNK_SIZE),cz=Math.floor((z-WORLD_MIN)/CHUNK_SIZE),out=[];for(let a=cx-radius;a<=cx+radius;a++)for(let b=cz-radius;b<=cz+radius;b++)if(a>=0&&a<12&&b>=0&&b<12)out.push({key:a+':'+b,x:a,z:b,d:(a-cx)**2+(b-cz)**2});return out.sort((a,b)=>a.d-b.d)}
const FIRST=['Garrick','Elara','Iris','Dorian','Mira','Corvin','Lysa','Theron','Nessa','Rowan','Selene','Alaric','Freya','Cassian','Vera','Lorien','Rhea','Lucan','Isolde','Damar'];
const LAST=['Vale','Ashford','Reed','Holloway','Thorne','Frost','Wren','Grey','Moonfall','Voss'];
const STORIES=[
 ['The watch still pays my grandfather. He died forty years ago. Last night someone came to collect his wages. The signature in the tower ledger is fresh.','tower'],
 ['A caravan brought my sister’s voice in a sealed bottle. She is missing. The travelers at the camp heard where the bottle was filled.','camp'],
 ['The stars on my ceiling changed before the sky did. My husband took his charts to the old observatory and has not returned.','ruin'],
 ['Every night someone carves another letter into our threshold. The same letters circle the standing stones. I think they spell a name.','stones'],
 ['A letter arrived from our old farm. It describes tomorrow’s supper. Nobody has lived there since the fire.','farm'],
 ['My brother came back from the quarry with a second shadow. The first shadow has been hiding from him ever since.','mine'],
 ['The flowers I leave at the sanctuary appear beside my bed. Last night the ribbon was tied around a warm silver key.','shrine'],
 ['A ferryman asked for a coin minted next year. I refused. Now I hear oars beneath the floor every time it rains.','bridge'],
 ['Our tower bell rings at noon, but its reflection rings at midnight. The watchman who noticed it stopped casting a reflection.','tower'],
 ['The camp cook writes a new place at the table every evening. Whoever sits there remembers a life they never lived.','camp'],
 ['I inherited a lens that shows this house without its walls. In the observatory’s direction, it shows a door.','ruin'],
 ['My daughter dreamed a circle of stones. In the morning she spoke a language older than this town.','stones'],
 ['We keep receiving rent from the abandoned homestead. The coins smell of smoke. This month a tooth came with them.','farm'],
 ['A miner sold me a singing stone. It sings only when I lie, and yesterday it sang while I was asleep.','mine'],
 ['The sanctuary keeper told me to bring no offerings. The altar has been returning more than it receives.','shrine'],
 ['A toll receipt names me as a passenger on a crossing that collapsed before I was born.','bridge'],
 ['A blue fire burns in our cold hearth. It leans toward the watchtower even when the wind blows the other way.','tower'],
 ['The scout at the camp wears my family’s ring. We buried it with my mother. I need someone to ask where it came from.','camp'],
 ['My maps grew another coastline overnight. The old observatory appears on the wrong side of it.','ruin'],
 ['Someone has been leaving fresh bread on the standing stones. Every loaf contains one of our lost house keys.','stones']
];
export function homePlan(town){return Array.from({length:20},(_,i)=>{let x,z,rotation;if(town.id%3===1){const a=(i+.5)/20*Math.PI*2;x=Math.sin(a)*88;z=Math.cos(a)*88;rotation=a+Math.PI}else{const side=Math.floor(i/5),v=[-72,-43,-14,29,58][i%5];[x,z,rotation]=side===0?[v,-86,0]:side===1?[86,v,-Math.PI/2]:side===2?[-v,86,Math.PI]:[-86,-v,Math.PI/2];if(town.id%3===2){x*=.85;z*=1.12}}const owner=FIRST[(i+town.id*3)%20]+' '+LAST[(i+town.id)%10],kind=i%5===0?'merchant':i===7?'guild':i===13?'lodge':i===19?'barracks':'home',name=kind==='home'?owner+'’s Home':kind==='merchant'?['Silver Thread Trading','The Copper Cup','Wren’s Provisions','Moonfall Goods'][Math.floor(i/5)]:kind==='guild'?'The Cartographers’ Guild':kind==='lodge'?'The Trailkeeper’s Lodge':'The Watch Barracks';const[story,trail]=STORIES[i];return{id:i,x,z,rotation,doorX:x+Math.sin(rotation)*4.3,doorZ:z+Math.cos(rotation)*4.3,owner,name,kind,role:kind==='merchant'?'merchant':kind==='barracks'?'guard':kind==='guild'?'guildmaster':kind==='lodge'?'ranger':'resident',story,trailId:'site-'+['tower','camp','ruin','stones','farm','mine','shrine','bridge'].indexOf(trail),description:kind==='home'?'A lived-in home with a hearth, a table and a story.':'A busy '+kind+' with supplies, maps and local news.',appearance:{gender:i%2?'female':'male',raceId:['human','elf','dwarf','fae','duskborn','exile','beastkin','human'][(i+town.id)%8],build:['slender','balanced','broad'][i%3],height:['short','average','tall'][i%3],face:['soft','angular','round','regal'][i%4],hairStyle:['cropped','swept','long','braid','buns','bald'][i%6],beard:i%2===0&&i%4===0?'full':'none',skin:['#c39c7a','#8c6248','#d5bba2','#795644'][i%4],hair:['#45342e','#ddd7bf','#7b422e','#262c34'][i%4],outfit:['#49675c','#65527d','#88534a','#647d8a'][i%4],eyes:'#718d92',wardrobe:townWardrobe(i%2?'female':'male',kind==='barracks'?'guard':kind==='merchant'?'merchant':kind==='lodge'?'ranger':'resident',Math.floor(i/2)+town.id)}}})}
export function worldStats(){return{width:WORLD_MAX-WORLD_MIN,areaKm2:12.96,settlements:9,buildings:225,landmarks:72,dungeons:9}}
