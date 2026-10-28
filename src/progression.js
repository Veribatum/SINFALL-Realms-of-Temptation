import {factionReaction} from './faction-quests.js?v=14';
// Shared game rules: class identity, earned patronage and per-campaign rewards.
export const SERVANTS=[
 {id:'guardian',name:'Grave Guardian',level:2,hp:1.6,damage:.9,armor:3,reach:2.4,interval:1.6,desc:'A shield-bearing skeleton with 60% more health and 3 armor. Draws nearby enemy attacks.'},
 {id:'ravager',name:'Bone Ravager',level:4,hp:.8,damage:1.45,armor:0,reach:2.4,interval:1.1,desc:'An aggressive skeleton with faster strikes and 45% more damage, but 20% less health.'},
 {id:'arcanist',name:'Crypt Arcanist',level:6,hp:1,damage:1.1,armor:0,reach:8,interval:1.65,desc:'A skeletal caster that attacks with soul bolts from up to 8 metres. Walls block its magic.'}
];
export const servantOf=h=>SERVANTS.find(s=>s.id===h.companion?.form)||SERVANTS.find(s=>s.id===h.settings?.servant)||SERVANTS[0];
export const BLESSINGS=[
 {id:'iron-vow',name:'Iron Vow',desc:'+2 armor. Survive close combat.',effect:{defense:2}},
 {id:'grave-ember',name:'Grave Ember',desc:'+3 spell damage. Empower magical attacks.',effect:{spell:3}},
 {id:'hunters-edge',name:'Hunter’s Edge',desc:'+3 physical damage. Strengthen weapon attacks.',effect:{physical:3}},
 {id:'moon-well',name:'Moon Well',desc:'Abilities cost 1 less mana; +1 mana regeneration.',effect:{cost:1,manaRegen:1}},
 {id:'last-light',name:'Last Light',desc:'Restore 4 health after each victory.',effect:{healOnKill:4}},
 {id:'bone-covenant',name:'Bone Covenant',desc:'+12 servant health and +2 servant damage; +1 spell damage.',effect:{summonHp:12,summonDamage:2,spell:1}}
];
export function patronage(h){return[
 {id:'town',name:'Townsfolk',value:h.factions.town||0,benefit:'+1 armor',effect:{defense:1}},
 {id:'scholars',name:'Scholars',value:h.factions.scholars||0,benefit:'Abilities cost 1 less mana',effect:{cost:1}},
 {id:'veil',name:'The Veil',value:h.factions.veil||0,benefit:'+2 spell damage',effect:{spell:2}}
].map(p=>({...p,earned:p.value>=5,rank:p.value>=5?'Trusted':p.value>=1?'Known':p.value<0?'Distrusted':'Unproven'}))}
export function reactionTo(h,role){
 if(role==='witness'&&h.campaign.stage==='arrival')return '';
 const faction=factionReaction(h,role);if(faction)return faction;
 const c=h.campaign;
 if(c.stage==='complete')return c.ending==='destroy'?'“The crypt has gone quiet since you broke the relic. We can sleep again.”':c.ending==='bind'?'“You carry the relic’s burden now. People lower their voices when you pass.”':'“The relic endures because of you. The scholars are already arguing over its future.”';
 if(c.stage==='heart')return '“Word reached us: the undercrypt guardian has fallen. Whatever you found below, finish what you started.”';
 if(h.companion&&['guard','warden','pilgrim'].includes(role))return '“Keep that walking skeleton close. We remember whose spell is holding it together.”';
 if(c.flags.alliance==='veil'&&['warden','guard'].includes(role))return '“We heard about your bargain with the Veil. Our trust will have to be earned.”';
 if(c.flags.alliance==='wardens'&&role==='stranger')return '“The watch has your loyalty. That closes some doors, and opens others.”';
 const p=patronage(h).find(p=>p.id===(['scholar','guildmaster'].includes(role)?'scholars':role==='stranger'?'veil':'town'));
 if(p.earned)return '“Your deeds have earned our trust. You have our support when you take the road.”';
 if(Object.values(h.world.outcomes||{}).some(o=>o.success&&o.faction==='town'))return '“Travelers told us how you helped on the road. News reaches town before the traveler does.”';
 return '';
}
