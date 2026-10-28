import {NPC_FIRST,NPC_LAST} from './content.js?v=11';
import {PALETTES,townWardrobe} from './appearance.js?v=11';
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
export function populationFor(town){return ROLES.map(([role,building,x,z,greeting],i)=>{
 if(town.id===0&&role==='cook'){x=-20;z=29}
 const n=(town.seed+i*347)>>>0,gender=i%2?'female':'male',raceId=['human','dwarf','elf','human','beastkin','human','duskborn','fae','human','elf','dwarf','exile'][i];
 return{id:'resident-'+i,type:'npc',name:NPC_FIRST[n%NPC_FIRST.length]+' '+NPC_LAST[(n>>>6)%NPC_LAST.length],role,building,x,z,greeting,portrait:(gender==='male'?4:0)+i%4,appearance:{gender,wardrobe:townWardrobe(gender,role,i+town.id),build:['slender','balanced','broad'][i%3],height:i%4===0?'short':i%4===1?'tall':'average',hairStyle:['short','long','swept','braid','bald'][i%5],face:['soft','angular','round'][i%3],beard:gender==='male'&&i%3===0?'full':'none',marking:i%5===0?'scar':'none',skin:PALETTES.skin[n%6],hair:PALETTES.hair[(n>>>3)%7],outfit:PALETTES.outfit[i%7],eyes:PALETTES.eyes[i%5],raceId},routine:i%3===0?[[x,z],[x+3,z]]:null};
})}
