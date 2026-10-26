import {CLASSES,RACES,ORIGINS,MOTIFS,ENEMIES,SETTLEMENT_PREFIX,SETTLEMENT_SUFFIX,NPC_FIRST,NPC_LAST,QUALITY} from './content.js';

export const SCHEMA=4;
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
export function randomSeed(){return globalThis.crypto?.getRandomValues?.(new Uint32Array(1))[0]??Math.floor(Math.random()*4294967295)}
export function seeded(seed){let a=Number(seed)>>>0;return()=>{a+=0x6d2b79f5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const pick=(a,r)=>a[Math.floor(r()*a.length)];
export const classOf=h=>CLASSES.find(c=>c.id===h.classId)||CLASSES[0];
export const raceOf=h=>RACES.find(r=>r.id===h.raceId)||RACES[0];
export const townOf=h=>h.world.towns.find(t=>t.id===h.location.townId)||h.world.towns[0];
export const locationId=h=>h.location.type+'-'+h.location.townId;
export function addLog(h,text,kind='story'){h.history.unshift({id:uid(),text:String(text).slice(0,2000),kind,day:h.world?.day||1});h.history=h.history.slice(0,160);h.updatedAt=Date.now();return text}
export function effects(h){const out={};for(const id of h.talents){const t=classOf(h).talents.find(t=>t.id===id);if(t)for(const[k,v]of Object.entries(t.effect))out[k]=(out[k]||0)+v}return out}
export function stats(h){const s={...classOf(h).stats};for(const[k,v]of Object.entries(raceOf(h).stats))s[k]=(s[k]||0)+v;const o=ORIGINS.find(o=>o.id===h.originId);if(o)s[o.stat]++;const e=effects(h);for(const k of Object.keys(s))s[k]+=(e[k]||0)+Math.floor((h.level-1)/3);return s}
export function maxHp(h){return classOf(h).hp+(h.raceId==='dwarf'?8:0)+(h.level-1)*6+(h.boons?.vitality||0)}
export function maxMp(h){return classOf(h).mp+(h.raceId==='elf'?6:0)+(h.level-1)*3}
export function armor(h){return(h.equipment.armor?.power||0)+(effects(h).defense||0)}
export function abilityCost(h){return Math.max(2,classOf(h).ability.cost-(effects(h).cost||0)-(h.raceId==='exile'?1:0))}
export function xpNeeded(h){return 80+(h.level-1)*45}
export function gainXp(h,n){h.xp+=Math.max(0,n);let levels=0;while(h.xp>=xpNeeded(h)){h.xp-=xpNeeded(h);h.level++;h.talentPoints++;h.hp=Math.min(maxHp(h),h.hp+16);h.mp=Math.min(maxMp(h),h.mp+9);levels++;addLog(h,`Level ${h.level}. Your legend grows. +1 talent point.`,'level')}return levels}
export function gainGold(h,n){h.gold+=Math.floor(n*(1+(effects(h).gold||0)/100))}
export function check(h,stat,dc,rng=Math.random){const roll=1+Math.floor(rng()*20),bonus=(stats(h)[stat]||0)+(effects(h).checks||0)+(h.raceId==='fae'?1:0);return{roll,bonus,total:roll+bonus,dc,success:roll===20||(roll!==1&&roll+bonus>=dc)}}
export function makeHero(draft,seed=randomSeed()){
 const h={schema:SCHEMA,id:uid(),name:String(draft.name||'Wanderer').trim().slice(0,32)||'Wanderer',classId:CLASSES.some(c=>c.id===draft.classId)?draft.classId:'ranger',raceId:RACES.some(r=>r.id===draft.raceId)?draft.raceId:'human',originId:ORIGINS.some(o=>o.id===draft.originId)?draft.originId:'wanderer',omen:String(draft.omen||'Your shadow sometimes moves without you.').slice(0,200),backstory:String(draft.backstory||'').slice(0,600),pronouns:draft.pronouns||'she/her',portrait:clamp(Number(draft.portrait)||0,0,7),hair:draft.hair||'#382b24',outfit:draft.outfit||'#49675c',skin:draft.skin||'#be9478',level:1,xp:0,talentPoints:(draft.raceId==='human'?3:2),talents:[],gold:75,hp:1,mp:1,boons:{},items:[],equipment:{},history:[],legacy:[],completed:0,kills:0,playSeconds:0,createdAt:Date.now(),updatedAt:Date.now(),relationships:{},factions:{town:0,scholars:0,veil:0},settings:{},combat:null};
 h.equipment={weapon:{id:uid(),name:classOf(h).weapon,type:'weapon',power:3,quality:0},armor:{id:uid(),name:'Traveler’s Attire',type:'armor',power:1,quality:0}};
 h.items=[{id:uid(),name:'Healing Draught',type:'potion',qty:4},{id:uid(),name:'Moonwater',type:'mana',qty:2}];h.hp=maxHp(h);h.mp=maxMp(h);newCampaign(h,seed);return h;
}
export function generateDungeon(seed){
 const r=seeded(seed),size=17,grid=Array.from({length:size},()=>Array(size).fill(1)),stack=[[1,1]];grid[1][1]=0;
 while(stack.length){const[x,y]=stack[stack.length-1];const choices=[[2,0],[-2,0],[0,2],[0,-2]].filter(([dx,dy])=>x+dx>0&&y+dy>0&&x+dx<size-1&&y+dy<size-1&&grid[y+dy][x+dx]);if(!choices.length){stack.pop();continue}const[dx,dy]=pick(choices,r);grid[y+dy/2][x+dx/2]=0;grid[y+dy][x+dx]=0;stack.push([x+dx,y+dy])}
 // Open a few loops, then use breadth-first distance so the final chamber is reachable.
 for(let i=0;i<16;i++){const x=1+Math.floor(r()*(size-2)),y=1+Math.floor(r()*(size-2));if((!grid[y][x-1]&&!grid[y][x+1])||(!grid[y-1][x]&&!grid[y+1][x]))grid[y][x]=0}
 const dist=Array.from({length:size},()=>Array(size).fill(-1)),q=[[1,1]];dist[1][1]=0;
 for(let i=0;i<q.length;i++){const[x,y]=q[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(grid[y+dy]?.[x+dx]===0&&dist[y+dy][x+dx]<0){dist[y+dy][x+dx]=dist[y][x]+1;q.push([x+dx,y+dy])}}
 const ordered=q.slice().sort((a,b)=>dist[b[1]][b[0]]-dist[a[1]][a[0]]),end=ordered[0];
 const candidates=q.filter(([x,y])=>dist[y][x]>5&&Math.abs(x-end[0])+Math.abs(y-end[1])>2);
 const spots=[];for(let i=0;i<9&&candidates.length;i++){const k=Math.floor(r()*candidates.length);spots.push(candidates.splice(k,1)[0])}
 const entities=[{id:'exit',type:'exit',name:'Return to the surface',x:6,z:6},{id:'boss',type:'boss',name:'The guardian',x:end[0]*4+2,z:end[1]*4+2}];
 spots.forEach(([x,y],i)=>entities.push({id:'crypt-'+i,type:i<4?'enemy':i<7?'chest':i===7?'shrine':'lore',name:i<4?pick(ENEMIES,r).name:i<7?'Sealed coffer':i===7?'Moonlit shrine':'Ancient inscription',kind:pick(ENEMIES,r).kind,x:x*4+2,z:y*4+2}));
 return{grid,entities,end,start:{x:6,z:6,yaw:grid[1][2]===0?Math.PI/2:0},seen:[]};
}
export function newCampaign(h,seed=randomSeed()){
 const r=seeded(seed),used=h.legacy.map(v=>v.motifId),available=MOTIFS.filter(m=>!used.includes(m.id));let motif=structuredClone(pick(available.length?available:MOTIFS.filter(m=>m.id!==h.campaign?.motifId),r));
 const names=new Set(),npcNames=new Set();const climates=['green','autumn','mist'],climateOffset=Math.floor(r()*3);const towns=[];for(let i=0;i<3;i++){let name;do{name=pick(SETTLEMENT_PREFIX,r)+pick(SETTLEMENT_SUFFIX,r)}while(names.has(name));names.add(name);const npcs={};for(const role of['innkeeper','smith','scholar','warden','healer','witness','stranger']){let npcName;do{npcName=pick(NPC_FIRST,r)+' '+pick(NPC_LAST,r)}while(npcNames.has(npcName));npcNames.add(npcName);npcs[role]={id:`${i}-${role}`,name:npcName,role,portrait:Math.floor(r()*8)}};towns.push({id:i,name,seed:Math.floor(r()*1e9),climate:climates[(i+climateOffset)%3],npcs,description:['A river village caught between the old woods and an older secret.','Amber leaves gather around a hilltop settlement of miners and itinerant scholars.','A trading town at the edge of a marsh where the lanterns never go out.'][(i+climateOffset)%3],dungeon:generateDungeon(Math.floor(r()*1e9))})}
 h.campaign={...motif,id:uid(),number:h.completed+1,motifId:motif.id,stage:'arrival',flags:{},decisions:[],ai:false,startedAt:Date.now(),ending:null};
 h.world={seed,towns,day:1,hour:17,visits:{},rumors:[],quests:[],events:[],claimed:[],ledger:{},discovered:['town-0'],weather:pick(['clear','mist','rain'],r)};h.location={type:'town',townId:0};h.position={x:0,z:20,yaw:Math.PI};h.combat=null;
 addLog(h,`A new adventure: ${motif.title}. You arrive in ${towns[0].name}. ${h.omen}`);return h.campaign;
}
export function locationName(h){const t=townOf(h);return h.location.type==='town'?t.name:h.location.type==='wilds'?`The ${t.name} Road`:`${t.name} Undercrypt`}
export function objective(h){const t=h.world.towns[0],c=h.campaign;if(h.combat)return'Defeat your foe or find a way out.';if(c.stage==='arrival')return`Speak with ${t.npcs.witness.name} in ${t.name}’s square.`;if(c.stage==='trail')return`Investigate the strange remains on the road outside ${t.name}.`;if(c.stage==='counsel')return`Bring the evidence to ${t.npcs.scholar.name} at ${t.name}’s archive.`;if(c.stage==='descent')return`Enter the undercrypt outside ${t.name}. Find ${c.enemy}.`;if(c.stage==='heart')return`Return to the final chamber and decide the fate of ${c.artifact}.`;return'Your adventure is complete. Explore, or set out on a new story.'}
export function visitState(h){const id=locationId(h);return h.world.visits[id]??={resolved:[],discovered:[],searched:false}}
export function resolveEntity(h,id){const v=visitState(h);if(!v.resolved.includes(id))v.resolved.push(id)}
export function isResolved(h,id){return visitState(h).resolved.includes(id)}
export function entitiesFor(h){
 const town=townOf(h),type=h.location.type,v=visitState(h);let a=[];
 if(type==='town'){
  const places=[['innkeeper',-8.5,11,'The Wayfarer’s Rest'],['smith',8.5,7,'The Ember & Anvil'],['scholar',-8.5,-9,'The Lantern Archive'],['healer',8.5,-12,'The Stillwater Apothecary'],['warden',2,-25,'The Watch Chapel'],['witness',-3,1,'The village square'],['stranger',5,13,'A passing traveler']];
  a=places.map(([role,x,z,building])=>({id:role,type:'npc',...town.npcs[role],x,z,building,marker:(h.location.townId===0&&((h.campaign.stage==='arrival'&&role==='witness')||(h.campaign.stage==='counsel'&&role==='scholar')))?'main':role==='innkeeper'?'rumor':null}));
  a.push({id:'road',type:'travel',name:'The old road',x:0,z:34},{id:'board',type:'board',name:'Notice board',x:7,z:1});
 }else if(type==='wilds'){
  a=[{id:'town',type:'exit',name:'Return to '+town.name,x:0,z:24},{id:'clue',type:'clue',name:'Strange remains',x:-7,z:-8,marker:h.location.townId===0&&h.campaign.stage==='trail'?'main':null},{id:'gate',type:'gate',name:'The undercrypt entrance',x:0,z:-35,marker:['descent','heart'].includes(h.campaign.stage)?'main':null},{id:'cache',type:'chest',name:'Abandoned strongbox',x:12,z:-17},{id:'shrine',type:'shrine',name:'A forgotten wayshrine',x:-13,z:8},{id:'herbs',type:'herbs',name:'Silverleaf patch',x:9,z:9},{id:'road-enemy',type:'enemy',kind:'wolf',name:'Gloom Hound',x:4,z:-20},{id:'road-bandit',type:'enemy',kind:'bandit',name:'Road Reaver',x:-14,z:-24},{id:'caravan',type:'traveler',name:'A stranded courier',x:-6,z:16}];
 }else{
  a=town.dungeon.entities.map(e=>({...e,name:e.type==='boss'?(h.location.townId===0?h.campaign.enemy:'The Ashbound Keeper'):e.name}));
  if(h.location.townId===0&&['heart','complete'].includes(h.campaign.stage)){
   a=a.filter(e=>e.type!=='boss');a.push({id:'artifact',type:'artifact',name:h.campaign.artifact,x:town.dungeon.end[0]*4+2,z:town.dungeon.end[1]*4+2,marker:h.campaign.stage==='heart'?'main':null});
  }
 }
 return a.filter(e=>!v.resolved.includes(e.id)||e.type==='exit'||e.type==='npc'||e.type==='gate'||e.type==='travel'||e.type==='board');
}
export function changeLocation(h,type,townId=h.location.townId){if(!['town','wilds','dungeon'].includes(type)||!h.world.towns[townId])throw Error('Unknown location');h.location={type,townId};h.position=type==='dungeon'?{...townOf(h).dungeon.start,yaw:townOf(h).dungeon.start.yaw||0}:{x:0,z:type==='town'?23:20,yaw:Math.PI};h.world.hour+=.4;if(h.world.hour>=24){h.world.hour-=24;h.world.day++}const id=locationId(h);if(!h.world.discovered.includes(id))h.world.discovered.push(id);visitState(h);return addLog(h,'You arrive at '+locationName(h)+'.','travel')}
export function acceptMain(h){if(h.campaign.stage!=='arrival')return false;h.campaign.stage='trail';addLog(h,`${townOf(h).npcs.witness.name} asks you to investigate. ${h.campaign.witness}`);gainXp(h,15);return true}
export function collectClue(h){if(h.location.townId!==0||h.campaign.stage!=='trail')return false;h.campaign.stage='counsel';resolveEntity(h,'clue');gainXp(h,35);h.items.push({id:uid(),type:'quest',name:'Evidence: '+h.campaign.artifact});addLog(h,h.campaign.clue);return true}
export function chooseAlliance(h,choice){if(h.campaign.stage!=='counsel')return false;if(!['wardens','scholars','veil'].includes(choice))return false;if(choice==='veil'&&h.gold<25)return false;h.campaign.flags.alliance=choice;h.campaign.decisions.push({choice,stage:'counsel'});h.campaign.stage='descent';h.factions[choice==='wardens'?'town':choice]+=2;
 if(choice==='wardens'){h.items.push({id:uid(),type:'armor',name:'Warden’s Brigandine',power:5+h.level,quality:1});addLog(h,'You tell the watch everything. A warden lends you armor. The stranger at the inn will remember this.')}
 if(choice==='scholars'){h.campaign.flags.weakenBoss=4;h.items.push({id:uid(),type:'mana',name:'Moonwater',qty:2});addLog(h,'You trust the archive. A counter-ritual weakens the guardian, but the watch has been kept in the dark.')}
 if(choice==='veil'){h.gold-=25;h.campaign.flags.veilPact=true;h.boons.vitality=(h.boons.vitality||0)+5;h.hp=Math.min(maxHp(h),h.hp+5);addLog(h,'You pay the stranger’s price. The Veil grants you 5 permanent vitality. Something has learned your name.')}
 gainXp(h,45);return true;
}
export function finishCampaign(h,ending){if(h.campaign.stage!=='heart'||!['preserve','destroy','bind'].includes(ending))return false;const c=h.campaign;c.stage='complete';c.ending=ending;c.decisions.push({choice:ending,stage:'ending'});h.completed++;h.legacy.push({id:c.id,motifId:c.motifId,title:c.title,ending,decisions:structuredClone(c.decisions),day:h.world.day,text:c[ending]});h.factions[ending==='preserve'?'scholars':ending==='destroy'?'town':'veil']+=3;h.talentPoints++;gainGold(h,100+h.level*15);gainXp(h,150);const item=loot(h,true);item.name=ending==='bind'?'Bound '+c.artifact.replace(/^the /i,''):ending==='preserve'?'Custodian’s Starweave':'Dawnbreaker’s Oath';if(ending==='destroy')item.type='weapon';if(ending==='preserve'){item.type='armor';item.power+=2}if(ending==='bind'){item.type='trinket';item.power+=3}addLog(h,c[ending]);return item}
export function discoverRumor(h,source='innkeeper'){
 const t=townOf(h),id=`side-${t.id}-${source}`;let q=h.world.quests.find(q=>q.id===id);if(q)return q;
 const types={innkeeper:'relic',healer:'herbs',smith:'hunt',warden:'hunt',stranger:'courier'};const kind=types[source]||'relic';
 const titles={relic:'What the Cellar Kept',herbs:'Silver for the Fever',hunt:'Teeth on the Old Road',courier:'A Letter Without a Name'};
 q={id,townId:t.id,kind,title:titles[kind],giver:t.npcs[source]?.name||'A traveler',state:'offered',progress:0,goal:kind==='hunt'?2:1,description:kind==='relic'?'Recover a lost keepsake from a coffer in the undercrypt.':kind==='herbs'?'Gather silverleaf on the old road for the apothecary.':kind==='hunt'?'Defeat two creatures on the road or beneath the town.':'Find the stranded courier on the old road, and decide what to do with the letter.',reward:kind==='hunt'?55:40};h.world.quests.push(q);addLog(h,`Overheard: ${q.description}`,'rumor');return q;
}
export function acceptSide(h,id){const q=h.world.quests.find(q=>q.id===id);if(q&&q.state==='offered'){q.state='active';q.progress=Math.min(q.goal,h.world.ledger?.[q.townId+'-'+q.kind]||0);if(q.progress>=q.goal)q.state='ready';addLog(h,'Quest accepted: '+q.title);return true}return false}
export function progressSide(h,kind){h.world.ledger??={};const key=h.location.townId+'-'+kind;h.world.ledger[key]=(h.world.ledger[key]||0)+1;for(const q of h.world.quests)if(q.state==='active'&&q.kind===kind&&q.townId===h.location.townId){q.progress=Math.min(q.goal,q.progress+1);if(q.progress>=q.goal){q.state='ready';addLog(h,`Quest ready to turn in: ${q.title}. Return to ${q.giver}.`,'quest')}}}
export function turnIn(h,id){const q=h.world.quests.find(q=>q.id===id);if(!q||q.state!=='ready'||h.location.type!=='town'||q.townId!==h.location.townId)return false;q.state='complete';gainGold(h,q.reward);gainXp(h,50);h.relationships[q.giver]=(h.relationships[q.giver]||0)+15;h.items.push({id:uid(),type:'potion',name:'Healing Draught',qty:1});addLog(h,`${q.title} completed. ${q.giver} will remember your help.`,'quest');return true}
export function loot(h,boss=false,rng=Math.random){const type=pick(['weapon','armor','trinket'],rng),tier=clamp(Math.floor((h.level+(boss?3:0)+rng()*3)/3),0,4),names={weapon:['Veilsteel Blade','Thornwood Recurve','Ashen Halberd','Starfall Scepter'],armor:['Lanternwarden Coat','Hollowguard Mail','Briarwoven Mantle','Moon-silver Cuirass'],trinket:['Ossuary Ring','Starseed Amulet','Mothwing Charm','Glass Hour Pendant']};const item={id:uid(),type,name:QUALITY[tier]+' '+pick(names[type],rng),power:3+h.level*2+tier*2+(boss?3:0),quality:tier};h.items.push(item);return item}
export function equip(h,id){const i=h.items.findIndex(i=>i.id===id);if(i<0)return false;const item=h.items[i];if(!['weapon','armor','trinket'].includes(item.type))return false;h.items.splice(i,1);const prev=h.equipment[item.type];if(prev)h.items.push(prev);h.equipment[item.type]=item;addLog(h,'Equipped '+item.name+'.','gear');return true}
export function useItem(h,type){const i=h.items.findIndex(i=>i.type===type&&i.qty>0);if(i<0)return false;if(type==='potion'&&h.hp>=maxHp(h)||type==='mana'&&h.mp>=maxMp(h))return false;if(type==='potion')h.hp=Math.min(maxHp(h),h.hp+22+Math.floor(h.level/2));else if(type==='mana')h.mp=Math.min(maxMp(h),h.mp+16);else return false;h.items[i].qty--;if(h.items[i].qty<=0)h.items.splice(i,1);return true}
export function unlock(h,id){const t=classOf(h).talents.find(t=>t.id===id);if(!t||h.talents.includes(id)||h.talentPoints<1||t.requires&&!h.talents.includes(t.requires))return false;h.talents.push(id);h.talentPoints--;addLog(h,'Learned '+t.name+'.','talent');return true}
export function rest(h){const cost=8+Math.floor(h.level/3);if(h.gold<cost)return false;h.gold-=cost;h.hp=maxHp(h);h.mp=maxMp(h);h.world.hour=8;h.world.day++;addLog(h,'You sleep at the inn. Morning comes, and the world feels ordinary for a moment.','rest');return true}
export function startCombat(h,entity,rng=Math.random){if(h.combat)return false;const boss=entity.type==='boss',base=ENEMIES.find(e=>e.kind===entity.kind)||pick(ENEMIES,rng),lv=Math.max(1,h.level+Math.min(3,h.completed)),weak=boss&&h.location.townId===0?(h.campaign.flags.weakenBoss||0):0;
 h.combat={id:entity.id,kind:base.kind,name:boss?entity.name:base.name,boss,hp:base.hp+lv*7+(boss?30:0)-weak*2,maxHp:base.hp+lv*7+(boss?30:0)-weak*2,attack:base.attack+lv*1.5+(boss?3:0)-weak,armor:base.armor+(boss?2:0),intents:base.intents,round:0,poison:0,weaken:0,log:['Your foe circles. Read its intention before committing.'],color:base.color,location:locationId(h)};return true}
export function combatIntent(h){const c=h.combat;if(!c)return null;return c.intents[c.round%c.intents.length]}
export function combatTurn(h,action,rng=Math.random){
 const c=h.combat;if(!c||!['attack','ability','guard','potion','flee'].includes(action))return{ok:false};const s=stats(h),ef=effects(h),ab=classOf(h).ability,intent=combatIntent(h);let text=[],ward=0,stun=false,damage=0,rolled=null;
 if(action==='ability'&&h.mp<abilityCost(h))return{ok:false,reason:'Not enough mana.'};
 if(action==='potion'){if(!useItem(h,'potion'))return{ok:false,reason:'No healing draught, or vitality is already full.'};text.push('You drink a healing draught.')}
 if(action==='flee'){const escape=check(h,'finesse',11+(c.boss?3:0)-(ef.escape||0),rng);if(escape.success){h.combat=null;addLog(h,`You escape ${c.name}. D20 ${escape.roll} + ${escape.bonus}.`,'combat');return{ok:true,outcome:'fled'}}text.push('You fail to escape.')}
 if(action==='guard'){ward=7+Math.floor(s.might/2);h.mp=Math.min(maxMp(h),h.mp+4);text.push('You brace and recover 4 mana.')}
 if(action==='attack'||action==='ability'){
  const special=action==='ability',stat=special?ab.scale:((s.finesse>s.might)?'finesse':'might');if(special){h.mp-=abilityCost(h);h.hp=Math.max(1,h.hp-(ab.selfDamage||0));ward=ab.ward||0}
  rolled=1+Math.floor(rng()*20);const critical=rolled===20||rng()*100<((ef.crit||0)+(h.raceId==='beastkin'?5:0)+(special?ab.crit||0:0));const hit=rolled===20||(rolled!==1&&rolled+s[stat]+Math.floor(h.level/2)>=9+(intent==='guard'?4:0));
  if(hit){const magic=special&&ab.magic;damage=Math.max(1,(special?ab.power:4)+s[stat]+Math.floor(h.equipment.weapon.power*.6)+Math.floor(rng()*6)+(magic?ef.spell||0:ef.physical||0)+(critical?7+(ef.critDamage||0):0)-(magic?0:c.armor)-(intent==='guard'?3:0)+(h.equipment.trinket?Math.floor(h.equipment.trinket.power/3):0));c.hp-=damage;stun=special&&ab.stun;if(special&&ab.heal)h.hp=Math.min(maxHp(h),h.hp+ab.heal);if(special&&ab.weaken)c.weaken=ab.weaken;if(!magic&&ef.poison)c.poison=ef.poison;text.push(`${special?ab.name:'Strike'}: ${damage} damage${critical?' · critical!':''}. D20 ${rolled}.`)}else text.push(`Your ${special?'ability':'strike'} misses. D20 ${rolled}.`);
 }
 if(c.poison&&c.hp>0){c.hp-=c.poison;text.push(`Venom deals ${c.poison}.`)}
 if(c.hp<=0){
  resolveEntity(h,c.id);h.kills++;progressSide(h,'hunt');if(c.boss&&h.location.townId===0&&h.campaign.stage==='descent'){h.campaign.stage='heart';addLog(h,h.campaign.revelation)}
  const gold=10+Math.floor(rng()*16)+(c.boss?35:0),xp=c.boss?90:30;gainGold(h,gold);gainXp(h,xp);h.hp=Math.min(maxHp(h),h.hp+(ef.healOnKill||0)+(h.raceId==='hollow'?3:0));const item=c.boss||rng()<.4?loot(h,c.boss,rng):null;h.combat=null;addLog(h,`Defeated ${c.name}. +${xp} XP · +${gold} gold${item?' · '+item.name:''}.`,'combat');return{ok:true,outcome:'victory',text:text.join(' '),gold,xp,item,boss:c.boss};
 }
 if(!stun&&intent!=='guard'){
  const hitPower=c.attack+(intent==='heavy'?6:intent==='hex'?2:0)-c.weaken;const defense=armor(h)+ward+(intent==='hex'&&h.raceId==='duskborn'?2:0);const hurt=Math.max(1,Math.round(hitPower-defense-(rng()*3)));h.hp=Math.max(0,h.hp-hurt);text.push(`${intent==='heavy'?'The heavy blow':intent==='hex'?'The hex':'The strike'} deals ${hurt} vitality.`);
 }else text.push(stun?'Your foe is interrupted.':'Your foe takes a defensive stance.');
 c.round++;h.mp=Math.min(maxMp(h),h.mp+(ef.manaRegen||0));c.log=[text.join(' '),...c.log].slice(0,8);
 if(h.hp<=0){const lost=Math.min(h.gold,Math.max(8,Math.floor(h.gold*.1)));h.gold-=lost;h.hp=Math.ceil(maxHp(h)*.65);h.mp=Math.max(h.mp,Math.ceil(maxMp(h)*.4));h.combat=null;changeLocation(h,'town');addLog(h,`You wake at the infirmary. A traveler carried you home. Recovery cost ${lost} gold.`,'combat');return{ok:true,outcome:'defeat',text:text.join(' ')}}
 return{ok:true,outcome:'round',text:text.join(' '),damage,roll:rolled};
}
export function interactionReward(h,entity,method='finesse',rng=Math.random){
 if(isResolved(h,entity.id))return{ok:false,text:'There is nothing else to take here.'};
 if(entity.type==='chest'){
  const c=check(h,method,11+Math.floor(h.level/3),rng);resolveEntity(h,entity.id);if(c.success){const item=loot(h,false,rng),gold=14+Math.floor(rng()*20);gainGold(h,gold);gainXp(h,20);if(h.location.type==='dungeon')progressSide(h,'relic');addLog(h,'Opened a coffer: '+item.name+'.','discovery');return{ok:true,text:`The lock yields. ${item.name} and ${gold} gold. D20 ${c.roll} + ${c.bonus}.`,item}}h.hp=Math.max(1,h.hp-4);gainXp(h,5);addLog(h,'The coffer’s ward burns you for 4 vitality.');return{ok:true,text:`The ward flares. You lose 4 vitality. D20 ${c.roll} + ${c.bonus}; needed ${c.dc}.`};
 }
 if(entity.type==='shrine'){resolveEntity(h,entity.id);h.hp=Math.min(maxHp(h),h.hp+24);h.mp=Math.min(maxMp(h),h.mp+16);gainXp(h,10);return{ok:true,text:'Cool moonlight settles over you. Recover 24 vitality and 16 mana.'}}
 if(entity.type==='herbs'){resolveEntity(h,entity.id);h.items.push({id:uid(),name:'Healing Draught',type:'potion',qty:1});progressSide(h,'herbs');gainXp(h,10);return{ok:true,text:'You gather silverleaf and prepare a healing draught. Any apothecary task progresses.'}}
 return{ok:false};
}
export function migrateLegacy(old){if(!old||old.version!==1||!old.name)return null;const h=makeHero({name:old.name,classId:String(old.cls||'ranger').toLowerCase(),raceId:RACES.find(r=>r.name===old.race)?.id,originId:'wanderer',omen:old.omen,portrait:0});h.level=clamp(Number(old.level)||1,1,100);h.xp=Math.max(0,Number(old.xp)||0);h.gold=Math.max(0,Number(old.gold)||0);h.hp=clamp(Number(old.hp)||maxHp(h),1,maxHp(h));h.mp=clamp(Number(old.mp)||0,0,maxMp(h));h.completed=Math.max(0,Number(old.completed)||0);h.talentPoints=Math.max(2,Number(old.skillPoints)||0);if(old.equipment?.weapon)h.equipment.weapon={id:uid(),name:String(old.equipment.weapon).slice(0,120),type:'weapon',power:Math.max(3,Number(old.equipment.weaponPower)||3),quality:1};for(const entry of(old.items||[]).slice(0,100)){if(!entry||!entry.name)continue;if(['weapon','armor','trinket','potion','mana','quest'].includes(entry.type))h.items.push({...entry,id:uid(),name:String(entry.name).slice(0,120),qty:clamp(Number(entry.qty)||1,1,999),power:clamp(Number(entry.power)||0,0,999)})}addLog(h,'Your earlier hero has arrived in the rebuilt realm. Your previous save is preserved.');return h}
export function validateHero(h){
 if(!h||h.schema!==SCHEMA||typeof h.id!=='string'||!h.id||typeof h.name!=='string'||h.name.length>32||!CLASSES.some(c=>c.id===h.classId)||!RACES.some(r=>r.id===h.raceId)||!ORIGINS.some(o=>o.id===h.originId))return false;
 if(!['level','xp','gold','hp','mp','talentPoints','completed'].every(k=>Number.isFinite(h[k])&&h[k]>=0)||h.level<1||h.level>1000||h.items?.length>500||!Array.isArray(h.items)||!Array.isArray(h.talents)||!Array.isArray(h.history)||!Array.isArray(h.legacy)||!h.equipment?.weapon||!h.equipment?.armor||!h.factions||!h.relationships||!h.world||!h.campaign||!h.location||!h.position)return false;
 if(!Array.isArray(h.world.towns)||h.world.towns.length!==3||!Array.isArray(h.world.quests)||!h.world.visits||!Array.isArray(h.world.discovered)||!['town','wilds','dungeon'].includes(h.location.type)||!Number.isInteger(h.location.townId)||h.location.townId<0||h.location.townId>2||!Number.isFinite(h.position.x)||!Number.isFinite(h.position.z))return false;
 if(!['arrival','trail','counsel','descent','heart','complete'].includes(h.campaign.stage)||!h.campaign.flags||!Array.isArray(h.campaign.decisions))return false;
 if(!['title','artifact','enemy','witness','clue','revelation','demand','preserve','destroy','bind'].every(k=>typeof h.campaign[k]==='string'&&h.campaign[k].length<5000))return false;
 if(!h.world.towns.every(t=>typeof t.name==='string'&&t.npcs&&t.dungeon?.grid?.length===17&&t.dungeon.grid.every(row=>Array.isArray(row)&&row.length===17&&row.every(v=>v===0||v===1))&&Array.isArray(t.dungeon.entities)&&t.dungeon.end?.length===2))return false;
 if(!h.items.every(i=>i&&typeof i.id==='string'&&typeof i.name==='string'&&['weapon','armor','trinket','potion','mana','quest'].includes(i.type)))return false;
 const str=(s,n=200)=>typeof s==='string'&&s.length<=n;
 const validItem=i=>!!i&&str(i.id,100)&&str(i.name,200)&&(['weapon','armor','trinket'].includes(i.type)?Number.isFinite(i.power)&&i.power>=0&&i.power<=100000:['potion','mana'].includes(i.type)?Number.isFinite(i.qty)&&i.qty>0&&i.qty<=9999:i.type==='quest');
 if(!h.items.every(validItem)||!Object.entries(h.equipment).every(([slot,i])=>['weapon','armor','trinket'].includes(slot)&&validItem(i)&&i.type===slot))return false;
 if(!h.history.every(e=>e&&str(e.id,100)&&str(e.text,2000)&&Number.isFinite(e.day))||!h.legacy.every(e=>e&&str(e.title,150)&&str(e.text,5000)&&Array.isArray(e.decisions)))return false;
 if(!h.world.towns.every((t,i)=>t.id===i&&Number.isFinite(t.seed)&&['innkeeper','smith','scholar','warden','healer','witness','stranger'].every(role=>t.npcs[role]&&str(t.npcs[role].name,100))&&t.dungeon.entities.every(e=>e&&str(e.id,100)&&str(e.type,50)&&Number.isFinite(e.x)&&Number.isFinite(e.z))))return false;
 if(!Array.isArray(h.world.events)||!Array.isArray(h.world.rumors)||!Number.isFinite(h.world.day)||!Number.isFinite(h.world.hour)||!Object.values(h.world.visits).every(v=>v&&Array.isArray(v.resolved)&&v.resolved.every(id=>str(id,100))))return false;
 if(!h.world.quests.every(q=>q&&str(q.id,100)&&str(q.title,150)&&str(q.giver,100)&&str(q.description,1500)&&['hunt','herbs','relic','courier'].includes(q.kind)&&['offered','active','ready','complete'].includes(q.state)&&Number.isFinite(q.progress)&&Number.isFinite(q.goal)&&Number.isFinite(q.reward)))return false;
 if(!Object.values(h.factions).every(Number.isFinite)||!Object.values(h.relationships).every(Number.isFinite)||!Array.isArray(h.talents)||!h.talents.every(id=>classOf(h).talents.some(t=>t.id===id)))return false;
 if(h.combat&&(!Array.isArray(h.combat.intents)||!Number.isFinite(h.combat.hp)||!Number.isFinite(h.combat.attack)||typeof h.combat.id!=='string'))return false;
 return true;
}
