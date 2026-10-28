import {bustSize} from './body-shape.js?v=11';
export const APPEARANCE_OPTIONS={
 gender:[['male','Male'],['female','Female']],
 build:[['slender','Slender'],['balanced','Balanced'],['broad','Broad']],
 height:[['short','Short'],['average','Average'],['tall','Tall']],
 hairStyle:[['cropped','Cropped'],['swept','Swept back'],['long','Long'],['braid','Braided'],['buns','Buns'],['bald','Bald']],
 face:[['soft','Soft'],['angular','Angular'],['round','Round'],['regal','Regal']],
 wardrobe:[['adventurer','Adventurer'],['court','Court'],['robes','Robes'],['ranger','Ranger'],['corsair','Corsair leathers'],['moonveil','Moonveil silk']],
 beard:[['none','None'],['stubble','Stubble'],['full','Full beard']],
 marking:[['none','None'],['scar','Cheek scar'],['warpaint','War paint']]
};
const revealing=new Set(['corsair','moonveil']);
export const wardrobeOptions=gender=>APPEARANCE_OPTIONS.wardrobe.filter(([id])=>gender==='female'||!revealing.has(id));
export function townWardrobe(gender,role,index=0){if(gender!=='female')return['adventurer','court','robes','ranger'][index%4];if(['guard','warden','ranger'].includes(role))return'ranger';if(role==='farmer')return'adventurer';return['corsair','moonveil','court','corsair','moonveil','adventurer'][index%6]}
export const PALETTES={skin:['#e5c3a2','#d6af8d','#c39c7a','#9c7151','#78563f','#49352e','#a7bdba'],hair:['#382b24','#ddd7bf','#9e5d39','#212629','#9a7c4b','#75677e','#adb1b6'],outfit:['#49675c','#476b86','#7e4d50','#9b8456','#4a4358','#8d6e57','#242b33'],eyes:['#669bad','#778b55','#8e6349','#b29b52','#8a75ad']};
export function appearanceOf(h={}){
 const a={};if(h.hairStyle==='short')h={...h,hairStyle:'cropped'};for(const[key,values]of Object.entries(APPEARANCE_OPTIONS))a[key]=values.some(([id])=>id===h[key])?h[key]:key==='gender'?(h.pronouns==='he/him'||Number(h.portrait)>=4?'male':'female'):values[key==='build'||key==='height'?1:0][0];
 if(a.gender!=='female'&&revealing.has(a.wardrobe))a.wardrobe='adventurer';
 a.bust=a.gender==='female'?bustSize(h.bust):1;
 for(const[key,values]of Object.entries(PALETTES))a[key]=/^#[a-f\d]{6}$/i.test(h[key])?h[key]:values[key==='hair'?0:1]||values[0];return a;
}
export function weaponStyle(item={},kind='ranger'){
 if(item.visual&&['sword','dagger','axe','bow','staff','spear','hammer','wand'].includes(item.visual))return item.visual;
 const n=item.name||'';return /bow|recurve/i.test(n)?'bow':/knife|dagger/i.test(n)?'dagger':/axe|halberd/i.test(n)?'axe':/spear|pike|lance/i.test(n)?'spear':/hammer|maul/i.test(n)?'hammer':/wand/i.test(n)?'wand':/staff|scepter|sceptre/i.test(n)?'staff':/blade|sword|oath/i.test(n)?'sword':['spellbinder','cleric','druid','necromancer'].includes(kind)?'staff':kind==='ranger'?'bow':kind==='rogue'?'dagger':'sword';
}
export function armorStyle(item={}){return item.visual&&['cloth','leather','mail','plate'].includes(item.visual)?item.visual:/cuirass|plate|brigandine|guard|custodian/i.test(item.name||'')?'plate':/mail|warden|coat/i.test(item.name||'')?'mail':/leather|hide/i.test(item.name||'')?'leather':'cloth'}
export function appearanceKey(h){return JSON.stringify([appearanceOf(h),h.equipment?.weapon,h.equipment?.armor,h.equipment?.trinket,h.classId,h.raceId])}
