import {homePlan} from './atlas.js?v=17';
import {dailyRoutine} from './town-life.js?v=17';
import {NPC_FIRST,NPC_LAST} from './content.js?v=17';
import {PALETTES,townWardrobe} from './appearance.js?v=17';
const ROLES=[
 ['merchant','Market stalls',-13,29,'“A little of everything, if you have coin. I trade with every settlement on these roads.”'],
 ['farmer','South fields',-48,45,'“Frost, wolves, taxes. At least the turnips don’t argue. The old farm out on the road has been empty too long.”'],
 ['guard','East watch',47,2,'“I watch the crossing. Take a friend and a full satchel if you head beyond the gate.”'],
 ['bard','The village green',-31,10,'“Nine regions, nine verses. I still haven’t written a decent rhyme for the Hollow Fen.”'],
 ['fisher','Riverside',39,40,'“Fish have been avoiding the north bank. People should learn something from fish.”'],
 ['carpenter','Carpenters’ yard',-44,-47,'“Good timber remembers how it grew. Bad timber remembers other things.”'],
 ['miner','Quarry road',43,-47,'“We closed the old quarry, but the exposed vein is still worth a look. Mind the stones.”'],
 ['pilgrim','The garden path',-39,-16,'“I carry a candle from each shrine. There’s one in the wilderness I haven’t found yet.”'],
 ['courier','South gate',6,46,'“Letters cross the realm faster than rumors. Usually. The next settlement has another bag waiting for me.”'],
 ['ranger','Orchard trail',47,25,'“Something is thinning the deer beyond the old tower. Leave your camp before sunset.”'],
 ['cook','Market kitchen',-22,48,'“A good stew starts with clean water and no questions about the mushrooms.”'],
 ['tailor','Cloth market',23,49,'“Your coat tells a story. Mine says you could use a better one.”']
];
export function populationFor(town,hour=12){const homes=homePlan(town),names=new Set([...homes.map(h=>h.owner),...Object.values(town.npcs||{}).map(p=>p.name)]),people=ROLES.map(([role,building,x,z,greeting],i)=>{
 if(town.id===0&&role==='cook'){x=-20;z=29}
 const n=(town.seed+i*347)>>>0,gender=i%2?'female':'male',raceId=['human','dwarf','elf','human','beastkin','human','duskborn','fae','human','elf','dwarf','exile'][i];
 let name,naming=n;do{name=NPC_FIRST[naming%NPC_FIRST.length]+' '+NPC_LAST[Math.floor(naming/NPC_FIRST.length)%NPC_LAST.length];naming++}while(names.has(name));names.add(name);
 return{id:'resident-'+i,type:'npc',name,role,building,x,z,greeting,portrait:(gender==='male'?4:0)+i%4,appearance:{gender,wardrobe:townWardrobe(gender,role,i+town.id),build:['slender','balanced','broad'][i%3],height:i%4===0?'short':i%4===1?'tall':'average',hairStyle:['short','long','swept','braid','bald'][i%5],face:['soft','angular','round'][i%3],beard:gender==='male'&&i%3===0?'full':'none',marking:i%5===0?'scar':'none',skin:PALETTES.skin[n%6],hair:PALETTES.hair[(n>>>3)%7],outfit:PALETTES.outfit[i%7],eyes:PALETTES.eyes[i%5],raceId},index:i,home:[homes[i].doorX+Math.sin(homes[i].rotation)*1.1,homes[i].doorZ+Math.cos(homes[i].rotation)*1.1],work:town.id===0?[[28,9],[28,16],[6,-24],[-28,16],[7,22],[-31,-29],[31,-28],[-7,-18],[0,31],[7,-24],[-14,35],[-28,23]][i]:[x,z],job:['Trading at the market','Selling produce','Guarding the crossing','Performing on the green','Mending fishing nets','Carving timber','Sorting quarry stone','Tending the shrine','Delivering letters','Patrolling the lanes','Preparing supper','Mending clothes'][i]};
});
 for(const home of homes.filter(h=>h.kind==='home')){const i=home.id,side=home.x<0?1:-1;people.push({id:'citizen-'+i,type:'npc',name:home.owner,role:'resident',building:home.name,portrait:i%8,appearance:home.appearance,greeting:'“'+home.story+'”',story:home.story,trailId:home.trailId,index:i+12,home:[home.doorX+Math.sin(home.rotation)*1.1,home.doorZ+Math.cos(home.rotation)*1.1],work:town.id===0?[[7,5],[-7,19],[28,23],[-28,8],[-7,-20],[7,-18]][i%6]:[side*7,5+i%5*4],job:['Visiting the market','Helping at the workshop','Buying provisions','Tending the green'][i%4]})}
 return people.map(p=>{if(p.id.startsWith('citizen-'))p.work=[p.work[0]+Math.floor(p.index/6)*.35,p.work[1]+Math.floor(p.index/6)*.3];const routine=dailyRoutine(p,hour);return{...p,x:routine.points[0][0],z:routine.points[0][1],routine:routine.points,activity:routine.activity,schedulePhase:routine.phase,retire:routine.retire}});
}
