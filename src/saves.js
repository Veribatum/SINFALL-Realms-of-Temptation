import {SCHEMA,validateHero,migrateLegacy,uid,upgradeHero} from './model.js?v=12';
const KEY='sinfall-realms-v4',BACKUP=KEY+'-recovery';
let failure=null;
const fresh=()=>({schema:SCHEMA,lastId:null,heroes:[],checkpoints:{}});
export function storageError(){return failure}
export function readBook(){
 try{
  const raw=localStorage.getItem(KEY);if(!raw)return fresh();const b=JSON.parse(raw);
  if(b.schema!==SCHEMA||!Array.isArray(b.heroes)||!b.checkpoints)throw Error('Save index is damaged.');
  return b;
 }catch(e){failure='The save collection could not be read. Export your current hero before closing.';return fresh()}
}
function writeBook(b){
 try{const previous=localStorage.getItem(KEY);if(previous)localStorage.setItem(BACKUP,previous);localStorage.setItem(KEY,JSON.stringify(b));failure=null;return true}
 catch(e){failure='This browser could not save. Use Export hero to keep your progress.';return false}
}
export function saveHero(h,{checkpoint=false}={}){
 if(!validateHero(h)){failure='The hero failed validation; the previous save was kept.';return false}
 upgradeHero(h);const b=readBook();h.updatedAt=Date.now();const index=b.heroes.findIndex(v=>v.id===h.id);const copy=structuredClone(h);
 if(index<0)b.heroes.push(copy);else b.heroes[index]=copy;b.lastId=h.id;
 if(checkpoint){const saves=b.checkpoints[h.id]||[];saves.unshift({id:uid(),at:Date.now(),hero:copy});b.checkpoints[h.id]=saves.slice(0,3)}
 return writeBook(b);
}
export function listHeroes(){return readBook().heroes.slice().sort((a,b)=>b.updatedAt-a.updatedAt)}
export function lastHero(){const b=readBook();return b.heroes.find(h=>h.id===b.lastId)||b.heroes[0]||null}
export function loadHero(id){const h=readBook().heroes.find(h=>h.id===id);return validateHero(h)?upgradeHero(structuredClone(h)):null}
export function checkpoints(id){return readBook().checkpoints[id]||[]}
export function deleteHero(id){const b=readBook();b.heroes=b.heroes.filter(h=>h.id!==id);delete b.checkpoints[id];if(b.lastId===id)b.lastId=b.heroes[0]?.id||null;return writeBook(b)}
export function migrateOldSave(){
 if(localStorage.getItem('sinfall-v4-migrated'))return null;
 try{const old=JSON.parse(localStorage.getItem('sinfall-campaign-v1')||'null');const h=migrateLegacy(old);if(h&&saveHero(h)){localStorage.setItem('sinfall-v4-migrated',h.id);return h}}catch{}return null;
}
export function exportSave(h){return JSON.stringify({format:'sinfall-hero',schema:SCHEMA,exportedAt:new Date().toISOString(),hero:h},null,2)}
export function exportBook(){return JSON.stringify({format:'sinfall-collection',schema:SCHEMA,...readBook()},null,2)}
export function importSave(text){
 if(text.length>5_000_000)throw Error('That file is too large for a hero save.');let data;try{data=JSON.parse(text)}catch{throw Error('That file is not valid JSON.')}
 const candidates=data.format==='sinfall-collection'?data.heroes:[data.hero||data];
 if(!Array.isArray(candidates)||!candidates.length||candidates.length>100)throw Error('No supported heroes found.');
 const heroes=candidates.map(raw=>raw?.schema===SCHEMA?raw:migrateLegacy(raw));if(!heroes.every(validateHero))throw Error('The file is not a complete SINFALL hero save. Your saves were kept.');
 const b=readBook();for(const h of heroes){upgradeHero(h);const index=b.heroes.findIndex(v=>v.id===h.id);if(index>=0){h.id=uid();h.name=h.name.slice(0,25)+' · copy'}h.updatedAt=Date.now();b.heroes.push(h);b.lastId=h.id}if(!writeBook(b))throw Error(failure);return heroes;
}
export function restoreRecovery(){try{const raw=localStorage.getItem(BACKUP),b=JSON.parse(raw||'null');if(!b?.heroes?.every(validateHero))return false;localStorage.setItem(KEY,raw);failure=null;return true}catch{return false}}

