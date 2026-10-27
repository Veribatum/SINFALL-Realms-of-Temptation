export const REGION_COUNT=9;
export const BOUNDS={town:{minX:-76,maxX:76,minZ:-82,maxZ:72},wilds:{minX:-145,maxX:145,minZ:-170,maxZ:125}};
export const REGIONS=[
 {name:'The Lantern Vale',biome:'Woodland',climate:'green',ground:'#667b50',leaves:'#3b6548',sky:'#9baca4',detail:'Woodland paths connect old watchtowers, abandoned farms, and a circle older than the village.'},
 {name:'The Copper Highlands',biome:'Highlands',climate:'autumn',ground:'#857451',leaves:'#9b7139',sky:'#b5a28a',detail:'Amber ridges shelter quarry camps and the broken defenses of an ancient hill kingdom.'},
 {name:'The Drowned March',biome:'Wetlands',climate:'mist',ground:'#596c5d',leaves:'#45635b',sky:'#899da0',detail:'Raised paths wind through reed beds, drowned foundations, and lantern-lit trading camps.'},
 {name:'Frostveil Reach',biome:'Snowfield',climate:'frost',ground:'#c4d0cb',leaves:'#b0c5c0',sky:'#acbfc9',detail:'Snow lies across the pine trails. A watchfire burns below a tower split by winter.'},
 {name:'The Sunken Coast',biome:'Coast',climate:'coast',ground:'#a59d79',leaves:'#628579',sky:'#a2c5ca',detail:'Salt roads lead between fishing sheds, old sea walls, and a shrine facing the open water.'},
 {name:'Ashen Expanse',biome:'Ashlands',climate:'ash',ground:'#675e58',leaves:'#6b5550',sky:'#9f8f87',detail:'Charred groves and rust-colored outcrops surround a forge camp that refuses to abandon its work.'},
 {name:'The Silverwood',biome:'Enchanted forest',climate:'green',ground:'#5e7868',leaves:'#6f9c8c',sky:'#9ebbb4',detail:'Silver-leafed trees conceal a pilgrim camp, forgotten standing stones, and a lost observatory.'},
 {name:'Kingsfall Border',biome:'Borderlands',climate:'autumn',ground:'#7c8055',leaves:'#a88b42',sky:'#b9b496',detail:'Merchants and deserters share the old king’s road beneath the silhouette of a fallen fortress.'},
 {name:'The Hollow Fen',biome:'Haunted marsh',climate:'mist',ground:'#4a6159',leaves:'#536d69',sky:'#829c9d',detail:'Ghost lights hover above dark pools. The last ferryman still waits beside the ruined crossing.'}
];
export const regionOf=town=>REGIONS[town.id%REGION_COUNT];
export function roadLinks(id,count=REGION_COUNT){const out=[];if(id%3>0)out.push({to:id-1,direction:'West',x:-132,z:5});if(id%3<2&&id+1<count)out.push({to:id+1,direction:'East',x:132,z:5});if(id>=3)out.push({to:id-3,direction:'North',x:0,z:-154});if(id+3<count)out.push({to:id+3,direction:'South',x:0,z:111});return out}
const SITE_TEMPLATES=[
 {kind:'tower',name:'The Broken Watchtower',x:-77,z:-105,description:'A watch ledger survived beneath the fallen stair. Its last entry describes a blue flame that never went out.',stat:'might'},
 {kind:'camp',name:'Wayfarers’ Camp',x:75,z:69,description:'The travelers here know the safe crossings. A wounded scout offers a map in return for help with the camp’s defenses.',stat:'presence'},
 {kind:'ruin',name:'The Lost Observatory',x:93,z:-103,description:'The stone instruments face stars absent from the sky. One lens is still warm, and a sealed compartment waits beneath it.',stat:'lore'},
 {kind:'stones',name:'The Whispering Circle',x:-91,z:67,description:'Names cover the standing stones. Speaking the oldest one stills the wind and reveals a buried offering.',stat:'lore'},
 {kind:'farm',name:'The Abandoned Homestead',x:-63,z:-23,description:'A supper table stands undisturbed. Footprints cross the ceiling. The cellar contains something the family never returned to collect.',stat:'finesse'},
 {kind:'mine',name:'The Old Quarry',x:64,z:-47,description:'A miner’s warning marks the tunnel. Veilsteel glints in the exposed seam, close enough to recover without entering the dark.',stat:'might'},
 {kind:'shrine',name:'The Pilgrim’s Sanctuary',x:-19,z:-121,description:'Fresh flowers lie on an ancient altar. You can repair the weathered ward or take the small offering left for a traveler in need.',stat:'presence'},
 {kind:'bridge',name:'The Fallen Crossing',x:100,z:16,description:'The old bridge has collapsed, but a dry path remains below. A locked tollbox lies beside a ferryman’s abandoned lantern.',stat:'finesse'}
];
export function frontierSites(town){const r=regionOf(town);return SITE_TEMPLATES.map((s,i)=>({...s,id:'site-'+i,type:'landmark',name:town.id===0?s.name:r.biome+' · '+s.name.replace(/^The /,''),marker:'discovery'}))}
export const siteKey=(h,id)=>h.location.townId+':'+id;
export function surveyState(h,townId=h.location.townId){const visited=h.world.exploration?.sites||[];return{done:visited.filter(k=>k.startsWith(townId+':')).length,total:SITE_TEMPLATES.length,claimed:(h.world.exploration?.rewards||[]).includes(townId)}}
