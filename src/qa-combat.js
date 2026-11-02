// Loaded only by the preview server's /__qa/combat page. It adds separate QA
// heroes through the normal save API, never replaces an existing collection.
import * as M from './model.js?v=20';
import * as A from './action-combat.js?v=20';
import * as S from './saves.js?v=20';

if(location.pathname==='/__qa/combat'){
 const frame=document.getElementById('combat-preview'),status=document.getElementById('qa-status');
 for(const button of document.querySelectorAll('[data-case]'))button.onclick=()=>{
  const scenario=button.dataset.case;
  const h=M.makeHero({name:'QA '+scenario,gender:'female',raceId:'elf',classId:'duelist',originId:'wanderer'},13254);
  h.id='sinfall-preview-combat-'+scenario;M.enterRealm(h);M.changeLocation(h,'dungeon');h.level=6;h.hp=M.maxHp(h);h.mp=M.maxMp(h);
  const enemies=M.entitiesFor(h).filter(e=>e.type==='enemy'),first=enemies[0];h.position={x:first.x-1,z:first.z,yaw:Math.PI/2};
  const entity={...first,...(scenario==='guardian'?{id:'boss',type:'boss'}:{}),...(scenario==='hex'?{x:h.position.x+6,kind:'wraith'}:{})};
  const pack=scenario==='pack'?enemies.slice(1,3).map((e,i)=>({...e,x:h.position.x+2,z:h.position.z+(i?1.5:-1.5)})):[];
  A.prepareActionCombat(h,entity,pack);
  for(const foe of A.combatants(h)){foe.hp=foe.maxHp=500;foe.attack=6;foe.nextAttack=scenario==='combo'||scenario==='rewards'||scenario==='guardian'?30:2;foe.intents=[scenario==='hex'?'hex':'heavy']}
  if(scenario==='rewards'){
   const item=M.loot(h,false,()=>.2);h.combat.hp=1;h.combat.rewards={xp:30,gold:17,names:['First reaver'],items:[item],boss:false};
  }
  if(scenario==='guardian'){h.campaign.stage='descent';h.combat.hp=1}
  // Let the previous frame finish its normal pagehide autosave before making
  // this fixture the current hero. Otherwise its lastId can win that race.
  frame.onload=()=>{
   frame.onload=null;if(!S.saveHero(h)){status.textContent=S.storageError();return}
   localStorage.setItem('sinfall-preferences',JSON.stringify({quality:'low',combat:'action'}));
   status.textContent=scenario+' ready. Select Continue inside the game.';frame.src='/?combat-fixture='+scenario+'&run='+Date.now();
  };frame.src='about:blank';
 };
 for(const button of document.querySelectorAll('[data-size]'))button.onclick=()=>{
  const landscape=button.dataset.size==='landscape';frame.style.width=landscape?'844px':'390px';frame.style.height=landscape?'390px':'844px';
 };
}
