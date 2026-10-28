export const GUARDIANS=[
 {id:'bell',kind:'knight',intents:['heavy','guard','hex'],tactic:'Resonant blows: guard the hammering toll, then interrupt its gathering hex.'},
 {id:'star',kind:'wraith',intents:['hex','hex','quick'],tactic:'Astral surgery: close the distance between hexes and interrupt the second cast.'},
 {id:'moth',kind:'bandit',intents:['quick','quick','guard','heavy'],tactic:'Royal feints: avoid its fast opening, then punish the defensive pause.'},
 {id:'dawn',kind:'knight',intents:['guard','heavy','heavy'],tactic:'Stolen seconds: recover while it braces, then move clear of the two heavy blows.'},
 {id:'lake',kind:'wraith',intents:['hex','guard','heavy','hex'],tactic:'Drowned hymn: the quiet verse is your opening before the final hex.'},
 {id:'road',kind:'bandit',intents:['quick','hex','heavy','guard'],tactic:'Changing routes: its attack sequence shifts between close and ranged pressure.'}
];
export function guardianFor(h,townId=h.location.townId){return townId===0?GUARDIANS.find(g=>g.id===h.campaign.motifId)||GUARDIANS[0]:GUARDIANS[(townId+(h.world.seed>>>0))%GUARDIANS.length]}
