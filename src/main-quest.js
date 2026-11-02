// Authored main-story scenes. Mechanics are applied by model.js; this module
// supplies the same destinations, choices and facts to the world and journal.
export const MAIN_FOES=['main-hunter-0','main-hunter-1','main-hunter-2'];
export const MAIN_NODES=['witness','road','home','archive','rescue','records','confession','alliance','memorial','seal','guardian','artifact','homecoming','complete'];
const PROFILES={
 bell:{victim:'Mara',relation:'sister',keepsake:'a copper ring',
  hook:'“I put out two cups every morning. Today everyone says I have always lived alone. But someone repaired my coat last night. Someone who knows where I keep the needle.”',
  house:'Seven places are laid at the abandoned supper table. One chair has been scrubbed so hard that the wood is pale. Under it, Mara scratched a message: “The watch brings us below. The bell does not choose.” A copper ring catches on your glove. For an instant you remember her laugh.',
  record:'The cathedral ledger lists people as repairs: a mason for the western crack, a singer for the door, Mara for the final seam. The oldest entry describes a replacement: a freely given remembrance can close a wound that a stolen life can only plug.',
  confession:'“I signed the names,” the warden says. “The first time, the thing below had already taken three streets. I told myself one person would save a hundred. Then I stopped asking permission.” Mara escaped one toll. The hunters were sent to return her.',
  memorial:'The first keeper was not a priest. She was a mother who stood between the town and the thing below it. The names on her memorial were offered freely. Later wardens crossed out the word WILLING. The guardian has been enforcing the altered vow ever since.',
  guardian:'“I kept the bargain you gave me,” says the figure beneath the bell. “Do not call obedience mercy. Show me what you would put in its place.”',
  cost:'The bell can hold the ancient thing, but it cannot create what it consumes.',
  preserve:'The Memory Bell falls silent. The ward remains, sustained by a public vigil and memories offered freely, never another secret list.',
  destroy:'You break the Memory Bell. The prisoners return, and the prison fails with them. Something old can reach the road again.',
  bind:'You take the bell’s last toll into yourself. The prisoners return and the breach closes. One memory becomes a room you can no longer enter.'},
 star:{victim:'Marek',relation:'brother',keepsake:'a miner’s brass token',
  hook:'“My brother came back from the crater and remembered a mother we never had. Last night he went out to find her. This morning his bed was cold, and the clocks all stopped at the same minute.”',
  house:'Marek drew the same hillside six times, each with a different childhood written beneath it. A watch order is pinned beside the drawings: RETURN ALL EXPOSED SUBJECTS. Under the bed you find his brass token and the words “I am not a specimen.”',
  record:'The observatory’s instruments are not measuring the star. They are sedating it. The watch has been feeding it the dreams of people exposed to the crater. A counter-frequency could put the egg to sleep without another stolen dream.',
  confession:'“When the hills moved, I sent for the astronomers,” the warden says. “They needed dreamers. I sent miners. Marek tried to leave, and I ordered him brought back. I called it quarantine so I would not have to call it what it was.”',
  memorial:'A dead astronomer recorded the first pulse: a heartbeat answered from under the town. The guardian was built to keep the dreamers asleep. It has never been told that the procedure is killing them.',
  guardian:'“The patient survives,” says the Astral Surgeon. “You call the treatment cruel because you have not seen what wakes without it.”',
  cost:'The egg and the sleeping mother answer each other. Stopping one heartbeat changes the other.',
  preserve:'You retune the cradle around the Starheart. The egg sleeps on, held by a voluntary circle of dreamers and a counter-frequency the town can maintain.',
  destroy:'The Starheart shatters. The captured dreamers wake. Deep beneath the town, the mother stirs, and new tremors open the old road.',
  bind:'You carry the Starheart’s dream in your shadow. The captured minds return, while a second heartbeat claims part of your own inner silence.'},
 moth:{victim:'Iona',relation:'sister',keepsake:'a blue silk ribbon',
  hook:'“My sister received a letter signed in her own hand. It promised the life she should have had. She laughed at it. Then I found an empty pillow, pressed flat in the shape of a crown.”',
  house:'Letters fill Iona’s abandoned room: an apprenticeship never taken, a marriage refused, a voyage missed. One letter bears the watch seal. It offers the court “unclaimed lives” in exchange for leaving the rest of the town alone. Iona’s blue ribbon is knotted around it.',
  record:'The moth court has no borders until someone names them. The observatory chart proposes a sanctuary inside mirrors, large enough for the discarded lives, too small to swallow their living originals.',
  confession:'“I sent the letters to people who seemed unhappy,” the warden admits. “The court promised they could start over. I did not ask what would happen to the people left behind.” The hunters collect anyone who refuses the coronation.',
  memorial:'The first ambassador offered the court a mirror. Later rulers offered their neighbors instead. The regent believes every accepted letter is consent, even when the signature belongs to a life that never happened.',
  guardian:'“Every person I took wanted another life,” the regent says. “Tell me which of their wishes you are here to bury.”',
  cost:'The forgotten possibilities are people to one another. They will not cease to exist because the town stops looking.',
  preserve:'You draw a border around the mirror court. It keeps its country; the town keeps the right to refuse its invitations.',
  destroy:'You burn the Silken Crown. The captives return. The unruled possibilities scatter through the countryside, searching for lives to inhabit.',
  bind:'You wear the crown long enough to give the court a sovereign. Its prisoners return, but another version of you now keeps a throne inside your dreams.'},
 dawn:{victim:'Ansel',relation:'brother',keepsake:'a stopped pocket watch',
  hook:'“Ansel left me a note saying he would be home yesterday. I remember him growing old beside me. I also remember burying him as a young man. Both memories hurt.”',
  house:'A stopped watch lies beside a calendar with the same date written forty times. Ansel recorded the watch collecting “borrowed hours” from travelers. He found the person receiving them, and the collectors found him.',
  record:'The observatory log reveals the transfer: stolen tomorrows feed one room preserved in yesterday. A release sequence can give its occupant a final conscious hour instead of tearing time open around them.',
  confession:'“The keeper’s child was dying,” the warden says. “I let the first hour disappear. Then another. Ansel asked whose children would pay for all the tomorrows we were spending.” The collectors now guard the lie as carefully as the clock.',
  memorial:'The keeper’s first entry asks for time to say goodbye. The last admits that the child has been asking to leave for years. The guardian has mistaken keeping a promise for keeping someone alive.',
  guardian:'“If I open that door, I lose them,” says the Keeper of Last Light. “You have had the luxury of walking toward tomorrow.”',
  cost:'The stolen days can return. The person held inside yesterday cannot keep them and let the town live.',
  preserve:'You open the release sequence and grant a final goodbye. The Glass Hour remains, an empty vessel that the town agrees never to fill with stolen days again.',
  destroy:'Yesterday breaks. The stolen days and their captives rush home, but fragments of unfinished time escape along the road.',
  bind:'You carry the last stolen hour yourself. The town regains tomorrow. A small part of every day now belongs to a goodbye that is not yours.'},
 lake:{victim:'Sella',relation:'sister',keepsake:'a shell on a red cord',
  hook:'“Sella went to listen at the lake. Now the records say she was never born. I cannot remember her voice, but I know exactly where it is missing.”',
  house:'Sella’s room has been stripped of written names. She hid a shell on a red cord beneath a floorboard and scratched one instruction beside it: “Do not answer when the choir sings as me.” A watch seal closes the rest of the house.',
  record:'The old score contains a rest the choir has stopped observing. That silence lets a prayer be heard without letting the listening god cross into the world. The names taken from the town fill that missing rest.',
  confession:'“The choir answered prayers the chapel could not,” the warden says. “I let them take names from the records. I told myself names were not people.” Sella discovered the truth. The hunters have been keeping her from reaching shore.',
  memorial:'The first choirmaster wrote the silence into the hymn to keep the god asleep. Later singers mistook it for a wound in the score. The guardian is trying to complete a song that was safe only while unfinished.',
  guardian:'“I can make it hear us,” says the Choirmaster. “Every prayer, even yours. How many unanswered voices will you silence to keep the sky quiet?”',
  cost:'Being heard and being answered are not the same thing. The last verse opens a passage as well as an ear.',
  preserve:'You restore the missing silence to the Drowned Hymnal. A watch of willing singers keeps it. The lake stops taking names.',
  destroy:'The hymn ends and its prisoners return. Unanswered fragments of the song drift into the marsh, where something still listens.',
  bind:'You sing the last verse into yourself. The lost return to shore. A second voice now occupies the quiet where your own thoughts once rested.'},
 road:{victim:'Tovin',relation:'brother',keepsake:'a letter dated next winter',
  hook:'“Tovin took the new road to deliver a letter. Yesterday he came back old enough to be our grandfather. Then the watch took him away before he could tell me what he saw.”',
  house:'Tovin covered a wall with versions of the same journey. Every road ends in a city where one promise was kept. His last letter, dated next winter, describes the watch trading the town’s unwanted futures for a safer present.',
  record:'The observatory chart gives the road a limit: turn its final mile back upon its first. A closed road can hold the refused futures without stealing the future of the people who live beside it.',
  confession:'“I saw a future in which this town burned,” the warden says. “I paid the cartographer to take it away. Then I kept buying better ones. Tovin found out what was being sold.” The hunters are returning escaped travelers to the route.',
  memorial:'The first cartographer drew a way home. Later patrons ordered destinations that could not disappoint them. The guardian is collecting the futures required to pay for that impossible city.',
  guardian:'“Every promise is kept at the road’s end,” says the Cartographer of Ends. “Tell me why your uncertain little town deserves those futures more.”',
  cost:'The city at the road’s end is paid for with possibilities the town has not yet lived.',
  preserve:'You redraw the road into a closed circle. The city keeps its possibilities, and the town keeps a future no one can guarantee.',
  destroy:'The compass turns to ash. Lost travelers return. Unfinished futures spill from the broken road and begin finding paths of their own.',
  bind:'You become the road’s last milestone. The travelers return and the town keeps its tomorrow. One future of your own is no longer yours to choose.'}
};
const generic={victim:'Ilyra',relation:'friend',keepsake:'a marked field notebook',hook:'“Ilyra went out to investigate the anomaly. The watch returned her notebook and told me to stop asking. I will not.”',house:'The missing investigator’s notes connect the road evidence to an old agreement. The watch knew more than it admitted. A marked field notebook records two leads: a captive near the travelers’ camp and a technical record in the observatory.',record:'The observatory record describes a counter-ritual that could contain the anomaly without continuing the watch’s bargain.',confession:'The warden admits to concealing the danger and supplying people to sustain an old protective agreement. The missing investigator uncovered the arrangement and was taken to keep it intact.',memorial:'The first keeper’s account describes a freely chosen duty. Later authorities made it compulsory and called the result protection. The guardian still enforces that altered agreement.',guardian:'“I have kept my side of the bargain,” the guardian says. “What are you prepared to put in its place?”',cost:'The anomaly can be contained, broken or carried. Each answer leaves someone with a duty they did not have before.'};
export const mainProfile=h=>h.campaign.ai?generic:PROFILES[h.campaign.motifId]||generic;
export const mainState=h=>h?.campaign?.main??null;
export const canRestoreCaptive=h=>mainState(h)?.rescue==='saved'||mainState(h)?.lead==='complete'&&mainState(h)?.seal==='quiet';
export function enableMainQuest(h){
 if(h.campaign.main)return h.campaign.main;
 const stage=h.campaign.stage,node=stage==='descent'&&h.combat?.boss&&h.location.townId===0?'guardian':{arrival:'witness',trail:'road',counsel:'archive',descent:'memorial',heart:'artifact',complete:'complete'}[stage];
 return h.campaign.main={version:1,node,route:stage==='arrival'||stage==='trail'||stage==='counsel'?null:'legacy',lead:stage==='descent'&&h.campaign.flags.alliance==='scholars'?'complete':null,encounter:'none',rescue:stage==='complete'?'saved':'waiting',seal:null,choice:stage==='complete'?h.campaign.ending:null,outcomeText:stage==='complete'?h.campaign[h.campaign.ending]:null,accusation:null,evidence:stage==='arrival'?[]:['road'],journal:[],migrated:stage!=='arrival',legacyCompleted:stage==='complete',warned:node==='guardian'};
}
export function mainNote(h,id,title,text){const s=mainState(h);if(!s||s.journal.some(n=>n.id===id))return;s.journal.push({id,title,text});if(s.journal.length>24)s.journal.shift()}
export function mainDungeonSpots(h){
 const d=h.world.towns[0].dungeon,start=[Math.floor(d.start.x/4),Math.floor(d.start.z/4)],end=d.end,q=[start],previous=new Map([[start.join(','),null]]);
 for(let i=0;i<q.length;i++){const[x,z]=q[i];if(x===end[0]&&z===end[1])break;for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const next=[x+dx,z+dz],key=next.join(',');if(d.grid[next[1]]?.[next[0]]===0&&!previous.has(key)){previous.set(key,[x,z]);q.push(next)}}}
 const path=[];let p=end;while(p){path.unshift({x:p[0]*4+2,z:p[1]*4+2});p=previous.get(p.join(','))}
 const placed=i=>({...path[i],rotation:Math.atan2(path[i+1].x-path[i].x,path[i+1].z-path[i].z)});
 const spot=fraction=>{const at=Math.max(1,Math.min(path.length-2,Math.floor(path.length*fraction)));for(let radius=0;radius<path.length;radius++)for(const i of[at-radius,at+radius])if(i>0&&i<path.length-1&&!d.entities.some(e=>Math.hypot(e.x-path[i].x,e.z-path[i].z)<2))return placed(i);return placed(at)};
 return{memorial:spot(.2),seal:spot(.65)};
}
export function mainDestination(h){
 const s=mainState(h);if(!s||s.node==='complete')return null;
 const resolved=[...(h.world.visits['realm-0']?.resolved||[]),...(h.world.visits['wilds-0']?.resolved||[])];
 const p=mainProfile(h),map={witness:{id:'witness',npc:'witness'},road:{id:'clue'},home:{id:'site-4'},archive:{id:'door-archive',npc:'scholar',room:'archive'},rescue:{id:s.encounter==='active'?MAIN_FOES.find(id=>!resolved.includes(id))||'main-captive':'main-captive'},records:{id:'site-2'},confession:{id:'door-chapel',npc:'warden',room:'chapel'},alliance:{id:'door-archive',npc:'scholar',room:'archive'},memorial:{id:'main-memorial',scene:'dungeon'},seal:{id:'main-seal',scene:'dungeon'},guardian:{id:'boss',scene:'dungeon'},artifact:{id:'artifact',scene:'dungeon'},homecoming:{id:'witness',npc:'witness'}};
 const goals={witness:'Hear '+h.world.towns[0].npcs.witness.name+'’s account of '+p.victim,road:'Recover the evidence on the old road',home:'Search the abandoned homestead for '+p.victim+'’s last message',archive:'Take the evidence to the Lantern Archive',rescue:s.encounter==='active'?'Break the hunters’ hold on '+p.victim:s.encounter==='cleared'?'Free '+p.victim+' at Wayfarers’ Camp':'Find '+p.victim+' at Wayfarers’ Camp',records:'Recover the counter-ritual at the Lost Observatory',confession:'Confront the warden in the Watch Chapel',alliance:'Return to the scholar and choose your support',memorial:'Read the first keeper’s memorial in the undercrypt',seal:'Open the inner seal using what you learned',guardian:'Confront '+h.campaign.enemy,artifact:'Decide the fate of '+h.campaign.artifact,homecoming:'Return to the witness and see what your choice changed'};
 return{...map[s.node],instruction:goals[s.node]};
}
export function mainHere(h,e){
 if(h.location.townId!==0)return false;const d=mainDestination(h);if(!d)return false;
 if(mainState(h)?.node==='rescue'&&e.id==='main-captive')return ['realm','wilds'].includes(h.location.type);
 if(d.scene)return h.location.type===d.scene&&e.id===d.id;
 if(d.room)return h.location.type==='interior'&&h.location.room===d.room&&e.role===d.npc;
 return ['realm','town','wilds'].includes(h.location.type)&&(e.id===d.id||!e.mainQuest&&d.npc&&e.role===d.npc);
}
export function mainExtraEntities(h){
 const s=mainState(h);if(!s||s.legacyCompleted||h.location.townId!==0)return[];const p=mainProfile(h),out=[],portrait=['Marek','Ansel','Tovin'].includes(p.victim)?4:1;
 if(h.location.type==='wilds'&&s.node==='rescue'){
  out.push({id:'main-captive',type:'npc',role:'witness',mainQuest:true,name:p.victim+' · caught between worlds',portrait,x:73,z:67,building:'Wayfarers’ Camp',marker:'main'});
  if(s.encounter!=='cleared')for(const[i,id]of MAIN_FOES.entries())out.push({id,type:s.encounter==='active'?'enemy':'npc',role:'warden',portrait:4,kind:i===2?'wraith':'bandit',name:i===2?'The Retrieval Keeper':'Oathbound Hunter',packId:'main-rescue',mainQuest:true,x:72+(i-1)*1.5,z:72});
 }
 if(h.location.type==='town'&&s.rescue==='saved')out.push({id:'main-returned',type:'npc',role:'witness',mainQuest:true,name:p.victim,portrait,x:-5.5,z:3,building:'The village square',greeting:'“I remember you. That is a beginning.”'});
 if(h.location.type==='wilds'&&s.node==='complete'&&s.choice==='destroy')out.push({id:'main-unbound',type:'enemy',kind:'wraith',name:'An Unbound Echo',x:0,z:-28});
 if(h.location.type==='dungeon'&&['memorial','seal'].includes(s.node)){
  const spots=mainDungeonSpots(h);out.push({id:'main-'+s.node,type:s.node==='memorial'?'shrine':'mainGate',mainQuest:true,name:s.node==='memorial'?'The First Keeper’s Memorial':'The Inner Seal',...spots[s.node],marker:'main'});
 }
 if(h.location.type==='dungeon'&&['guardian','artifact','homecoming','complete'].includes(s.node))out.push({id:'main-seal-open',type:'mainGate',mainOpened:true,name:'The Opened Inner Seal',...mainDungeonSpots(h).seal});
 return out;
}
export function mainScene(h){
 const s=mainState(h);if(!s)return null;const p=mainProfile(h),c=h.campaign,t=h.world.towns[0],w=t.npcs.witness.name;
 const choice=(id,label,detail='',extra={})=>({id,label,detail,...extra});
 const scenes={
  witness:{title:'Someone worth remembering',text:w+' has sketched '+p.keepsake+' beside a name: '+p.victim+'.\n\n'+p.hook+'\n\n'+p.victim+' is '+w+'’s '+p.relation+'. The last trace was found on the road outside town.',choices:[choice('accept','I’ll find out what happened')]},
  road:{title:'A trace that should not exist',text:c.clue+'\n\nThe evidence carries the same mark as '+p.victim+'’s '+p.keepsake.replace(/^(a|an) /,'')+'. A torn delivery label points to the abandoned homestead. Someone searched it before the watch arrived.',choices:[choice('take-clue','Keep the evidence and follow the address')]},
  home:{title:'The empty place at the table',text:p.house+'\n\nThis was not a random disappearance. Take the message to the scholar; the watch seal needs an explanation.',choices:[choice('read-table','Record the message and take the keepsake')]},
  archive:{title:'Two leads, one decision',text:t.npcs.scholar.name+' studies the evidence without touching it.\n\n“'+p.victim+' was taken to sustain an old bargain. I have two leads: an escaped captive near Wayfarers’ Camp, and the original procedure at the Lost Observatory. Chase the person, or learn how to change the bargain. We cannot count on both leads surviving.”',choices:[choice('rescue-first','Find '+p.victim+' first','Rescue a person now. Their memory can help open the crypt. Expect hunters.'),choice('records-first','Recover the original procedure','Learn a safer way through the seal and weaken the guardian. The captive stays at risk.')]},
  rescue:{title:s.encounter==='cleared'?'A hand through the veil':'The hunters at the camp',text:s.encounter==='cleared'?p.victim+' stands on the other side of a thin, wavering light. The hunters are gone.\n\n“Please do not ask me to explain who I am. Just take my hand.”':p.victim+' is sheltering behind the travelers’ wagons. Three figures carry a watch order stamped RETRIEVAL.\n\n“We were told no one was to remember this one,” their keeper says. “Hand over the keepsake and walk away.”',choices:s.encounter==='cleared'?[choice('free-captive','Take '+p.victim+'’s hand')]:s.encounter==='active'?[choice('face-hunters','Face the hunters','Three enemies. Their defeat is saved even if you withdraw.')]:[choice('fight-hunters','Break their hold','Fight three hunters.'),choice('slip-the-ward','Slip past the retrieval ward','Finesse 12. Failure alerts the hunters.',{stat:'finesse',dc:12}),choice('bribe-hunters','Buy the patrol’s silence · 25 gold','The captive still needs your hand to cross.',{cost:25})]},
  records:{title:'The procedure beneath the lie',text:p.record+'\n\nThe final notation is written in a shifting hand. You can trace its pattern with mana or try to decipher it. Even an incomplete reading gives you a way forward.',choices:[choice('decode-record','Decipher the original notation','Lore 12. A failed reading gives a fragment, not a dead end.',{stat:'lore',dc:12}),choice('trace-record','Trace the pattern · 6 mana','Recover the complete counter-ritual.',{mana:6})]},
  confession:{title:'Protection was the excuse',text:p.confession+'\n\n'+(s.rescue==='saved'?'You place the recovered keepsake on the altar. There is a living witness to what was done.':'You place the observatory record on the altar. The warden cannot deny the signature.')+'\n\n“Will you tell them?”',choices:[choice('expose','The town deserves the truth','Make the confession public. The townsfolk gain trust in you.'),choice('mercy','Help me end it. Then face what you did.','Keep the confession private for now. The warden’s personal debt is yours.')]},
  alliance:{title:'A plan for what comes next',text:t.npcs.scholar.name+' spreads your evidence across the archive table.\n\n'+(s.rescue==='saved'?p.victim+' has given you a true memory of the people inside. It can answer the seal.':s.lead==='complete'?'The original counter-ritual is complete. It can turn the mechanism against its keeper.':'The surviving fragment gives you a chance at the seal, though forcing it remains possible.')+'\n\n“The crypt is not a treasure room. It is the place where this bargain is enforced. Choose who helps you carry the consequences.”',choices:[choice('wardens','Bring the wardens','Borrow protective armor. The watch will have to live with what you uncover.'),choice('scholars','Trust the scholars’ counter-ritual','Weaken the guardian and receive moonwater.'),choice('veil','Accept the stranger’s pact · 25 gold','Gain 5 permanent vitality. The thing beyond the Veil learns your name.',{cost:25})]},
  memorial:{title:'Before there was a monster',text:p.memorial+'\n\nThis is the history the surface records left out. Beyond the memorial, the inner seal is still carrying out the altered instructions.',choices:[choice('read-memorial','Remember the first keeper','Learn what the guardian was meant to protect. Recover 8 health and mana.')]},
  seal:{title:'What opens a promise?',text:'The seal has no keyhole. It responds to an obligation, not a lockpick.\n\n'+(s.rescue==='saved'?p.victim+'’s remembered words rise around the keepsake. Someone living can answer the vow.':s.lead?'The counter-ritual describes how to change the obligation the seal is enforcing.':'The original instructions are incomplete, but the stone can still be broken.')+'\n\nForcing it will open the way, and warn the guardian.',choices:[...(s.rescue==='saved'?[choice('name-seal','Speak '+p.victim+'’s remembered name','Open the seal quietly. The guardian loses strength.')]:[]),...(s.lead?[choice('ritual-seal','Apply the counter-ritual',s.lead==='complete'?'Open the seal quietly and weaken the guardian.':'Lore 13. Failure opens it by force.',s.lead==='complete'?{}:{stat:'lore',dc:13})]:[]),choice('force-seal','Break the seal','Lose up to 8 health. The guardian will be stronger.')]},
  guardian:{title:c.enemy,text:p.guardian+'\n\n'+(s.accusation==='expose'?'You have already made the bargain public. There will be no quiet replacement of one prisoner with another.':'The truth is still yours to reveal. Whatever you do here, someone above will ask what it cost.'),choices:[]},
  artifact:{title:c.artifact,text:c.revelation+'\n\n'+p.cost+'\n\n'+(s.rescue==='saved'?p.victim+' is safe on the surface. Others are still caught inside.':p.victim+' is still among those caught inside. Their fate is part of this decision, not an abstract price.')+'\n\n'+c.demand,choices:mainEndingChoices(h)},
  homecoming:{title:'The place you return to',text:endingSummary(h)+'\n\n'+w+' waits in the square. '+(s.rescue==='saved'?p.victim+' is beside them. For once, no one needs to be convinced that the empty place belonged to a person.':'The keepsake is laid beside an empty chair. The town has stopped pretending the chair was never used.')+'\n\n'+(s.accusation==='expose'?'The confession is being read aloud at the chapel. The watch cannot put the old story back.':'The warden has promised to answer for the bargain. '+w+' asks you to make sure that promise is kept.'),choices:[choice('close-case','Tell them what happened','Complete the main quest and receive its legacy rewards.')]},
  complete:{title:'After the last page',text:endingSummary(h),choices:[]}
 };
 return{...scenes[s.node],node:s.node,instruction:mainDestination(h)?.instruction||'This main story is complete.'};
}
export function mainEndingChoices(h){
 const s=mainState(h),p=mainProfile(h),result=[
  {id:'preserve',label:'Rewrite the bargain; keep the ward',detail:(s.rescue==='saved'?'Your rescued witness stays free.':canRestoreCaptive(h)?'The complete counter-ritual brings the captive home.':'Without a complete counter-ritual, the captive remains beyond the seal.')+' The town is protected by a willing vigil. Gain +2 armor while this campaign lasts.'},
  {id:'destroy',label:'Break the mechanism; release its prisoners',detail:'The lost return, including '+p.victim+'. An unbound echo will haunt the old road. Receive a legacy weapon.'},
  {id:'bind',label:'Carry the burden yourself',detail:'The lost return and the breach closes. Gain +3 spell damage and lose 4 maximum mana for this campaign.'}
 ];return result;
}
export function endingSummary(h,ending=mainState(h)?.choice){
 const s=mainState(h),p=mainProfile(h);if(!s||!ending)return h.campaign[h.campaign.ending]||'The story is still unfolding.';
 if(s.outcomeText&&ending===s.choice)return s.outcomeText;
 const base=p[ending]||h.campaign[ending];
 return base+'\n\n'+(s.rescue==='saved'?p.victim+' returns to '+h.world.towns[0].npcs.witness.name+'. '+(s.route==='rescue'?'They remember that you came for a person before a solution.':s.route==='records'?'The record gave you a way forward. Your final choice decided who could follow it home.':'The witness remembers who you brought home.'):'You preserve the ward, but '+p.victim+' remains beyond it. The town now keeps their name in the open, where it cannot be quietly erased.')+'\n\n'+(s.accusation==='expose'?'The warden’s confession becomes a public record.':'The warden owes you the truth when the town is ready to hear it.');
}
export function mainReaction(h,role){
 const s=mainState(h);if(!s)return'';const p=mainProfile(h);
 if(s.legacyCompleted)return role==='witness'?h.campaign[h.campaign.ending]:'';
 if(['homecoming','complete'].includes(s.node))return role==='witness'?(s.rescue==='saved'?'“'+p.victim+' is home. You did not bring back the same town, but you brought back someone I can hold.”':'“I know what you saved. I also know who is missing. Promise me their name stays in the story.”'):role==='warden'?(s.accusation==='expose'?'“They know what I did. I will answer to them, not to the thing below.”':'“I said I would answer for it. I have not forgotten.”'):role==='scholar'?'“The record will include the cost. A victory that leaves that out is how this began.”':'';
 if(role==='witness'&&s.rescue==='saved')return'“'+p.victim+' came back with your keepsake. They told me you were still going below. Come back too.”';
 if(role==='witness'&&s.node!=='witness')return'“Bring '+p.victim+' home if you can. If you cannot, bring me the truth.”';
 if(role==='warden'&&s.accusation)return s.accusation==='expose'?'“My name is on that record. I will not ask you to erase it.”':'“Your silence was not forgiveness. I understand.”';
 if(role==='scholar'&&['memorial','seal','guardian','artifact'].includes(s.node))return'“You have the evidence. Do not let the keeper turn those people back into entries in a ledger.”';
 return'';
}
export function mainBrief(h){
 const s=mainState(h);if(!s)return null;
 if(s.legacyCompleted)return{chapter:'Main plot complete',index:5,steps:['Hear the witness','Find evidence','Consult the archive','Confront the guardian','Choose the ending'],recap:s.outcomeText,purpose:'Explore freely, finish side quests, or begin a new story with the same hero.',next:'Your adventure is complete.',notes:[]};
 const sequence=['witness','road','home','archive',s.route==='records'?'records':'rescue','confession','alliance','memorial','seal','guardian','artifact','homecoming'],index=s.node==='complete'?sequence.length:Math.max(0,sequence.indexOf(s.node));
 const steps=['Hear the witness','Follow the road evidence','Search the homestead','Choose which lead to pursue',s.route==='records'?'Recover the original procedure':'Rescue the missing person','Confront the warden','Choose your allies','Learn the first keeper’s story','Open the inner seal','Confront the guardian','Decide the bargain’s fate','Return to the people affected'];
 const act=index<3?'Act I · The Missing Name':index<7?'Act II · The Price of Protection':index<11?'Act III · The Promise Below':'Epilogue · What Comes Home';
 return{chapter:s.node==='complete'?'Main plot complete':act,index,steps,recap:s.journal.at(-1)?.text||mainScene(h).text,purpose:mainDestination(h)?.instruction||'Explore this changed world, or start a new adventure in the Journal.',next:mainDestination(h)?.instruction||'The main story is complete.',notes:s.journal};
}
export function validMainQuest(h){
 const s=mainState(h);if(s===null)return true;
 if(!s||s.version!==1||!MAIN_NODES.includes(s.node)||!['rescue','records','legacy',null].includes(s.route)||!['complete','fragment',null].includes(s.lead)||!['none','active','cleared'].includes(s.encounter)||!['waiting','saved','lost'].includes(s.rescue)||!['quiet','force',null].includes(s.seal)||!['preserve','destroy','bind',null].includes(s.choice)||!['expose','mercy',null].includes(s.accusation)||typeof s.migrated!=='boolean'||typeof s.warned!=='boolean')return false;
 if(!Array.isArray(s.evidence)||s.evidence.length>8||new Set(s.evidence).size!==s.evidence.length||!s.evidence.every(k=>['road','house','record','rescue','confession','memorial','seal'].includes(k)))return false;
 if(!Array.isArray(s.journal)||s.journal.length>24||!s.journal.every(n=>n&&typeof n.id==='string'&&n.id.length<80&&typeof n.title==='string'&&n.title.length<150&&typeof n.text==='string'&&n.text.length<5000))return false;
 if(['homecoming','complete'].includes(s.node)&&!s.choice)return false;
 if(s.outcomeText!==undefined&&s.outcomeText!==null&&(typeof s.outcomeText!=='string'||s.outcomeText.length>=5000))return false;
 if(s.legacyCompleted!==undefined&&(typeof s.legacyCompleted!=='boolean'||s.legacyCompleted&&s.node!=='complete'))return false;
 if(s.choice&&(!['homecoming','complete'].includes(s.node)||h.campaign.ending!==s.choice)||s.encounter==='active'&&s.node!=='rescue')return false;
 const stage={witness:'arrival',road:'trail',home:'trail',archive:'counsel',rescue:'counsel',records:'counsel',confession:'counsel',alliance:'counsel',memorial:'descent',seal:'descent',guardian:'descent',artifact:'heart',homecoming:'heart',complete:'complete'}[s.node];return h.campaign.stage===stage;
}
