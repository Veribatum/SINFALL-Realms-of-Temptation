// Real phone UI, with controlled travel between actual story destinations.
// The Node suite separately checks routes, collision and all 36 story endings.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {setTimeout} from 'node:timers/promises';
import {chromium} from 'playwright';
import * as M from '../src/model.js';
import {MOTIFS} from '../src/content.js';
import {mainDestination,mainScene,mainState,mainProfile} from '../src/main-quest.js';

const server=spawn(process.execPath,['server/server.mjs','--preview','--port','8787'],{stdio:['ignore','pipe','pipe']});
let browser,page;
const errors=[],watchdog=globalThis.setTimeout(()=>{console.error('Main story verification exceeded four minutes');server.kill('SIGTERM');process.exit(1)},240000);
const book=h=>({schema:4,lastId:h.id,heroes:[h],checkpoints:{}});
const readHero=async()=>{const b=await page.evaluate(()=>JSON.parse(localStorage.getItem('sinfall-realms-v4')));return b.heroes.find(h=>h.id===b.lastId)};
function atDestination(h){
 const d=mainDestination(h);assert(d);
 if(d.room)M.changeLocation(h,'interior',0,d.room);else if(d.scene==='dungeon')M.changeLocation(h,'dungeon');else M.changeLocation(h,'town',0);
 // Ordinary enemies were cleared on this test journey. Main-story enemies and
 // the guardian remain real encounters; the test does not bypass their state.
 if(h.location.type==='dungeon')for(const e of M.entitiesFor(h).filter(e=>e.type==='enemy'&&!e.mainQuest))M.resolveEntity(h,e.id);
 const entity=M.entitiesFor(h).find(e=>e.id===d.id||d.npc&&e.role===d.npc&&!e.mainQuest);assert(entity);
 h.position={x:entity.x,z:entity.z+1,yaw:Math.PI};if(h.location.type==='realm')M.syncRealm(h);assert(M.validateHero(h));return entity;
}
async function open(h){
 if(page)await page.close();atDestination(h);page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(b=>{localStorage.setItem('sinfall-preferences',JSON.stringify({quality:'low'}));if(!localStorage.getItem('sinfall-realms-v4'))localStorage.setItem('sinfall-realms-v4',JSON.stringify(b))},book(h));
 await page.goto('http://127.0.0.1:8787');await page.getByRole('button',{name:'Continue',exact:true}).click();
}
async function act(h,id){
 const option=mainScene(h).choices.find(o=>o.id===id);assert(option,id);await open(h);await page.locator('#interact').click();await page.getByRole('button',{name:option.label,exact:false}).click();const saved=await readHero();assert(M.validateHero(saved));return saved;
}
try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:8787')).ok)break}catch{}await setTimeout(100)}
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});await mkdir('browser-proof',{recursive:true});
 let h=M.makeHero({name:'Main Story Tester',gender:'female',raceId:'elf',classId:'necromancer',originId:'scholar'},13254);
 const {id,...motif}=MOTIFS.find(m=>m.id==='bell');Object.assign(h.campaign,motif,{motifId:id});h.level=6;h.hp=M.maxHp(h);h.mp=M.maxMp(h);M.enableMainQuest(h);M.enterRealm(h);
 for(const [id,node]of[['accept','road'],['take-clue','home'],['read-table','archive']]){h=await act(h,id);assert.equal(mainState(h).node,node)}
 const fork=structuredClone(h);await open(h);await page.locator('#interact').click();assert(await page.getByText('Two leads, one decision',{exact:true}).isVisible());assert((await page.locator('.dialog-text').textContent()).includes('Mara'));
 for(const viewport of[{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);const box=await page.locator('.dialog').boundingBox();assert(box&&box.x>=0&&box.x+box.width<=viewport.width+1&&box.y>=0&&box.y+box.height<=viewport.height+1);await page.screenshot({path:'browser-proof/main-choice-'+viewport.width+'.png',timeout:10000})}
 await page.getByRole('button',{name:'Recover the original procedure',exact:false}).click();h=await readHero();assert.equal(mainState(h).route,'records');
 for(const [id,node]of[['trace-record','confession'],['expose','alliance'],['scholars','memorial'],['read-memorial','seal'],['ritual-seal','guardian']]){h=await act(h,id);assert.equal(mainState(h).node,node)}
 assert.equal(h.campaign.stage,'descent');assert.equal(mainState(h).lead,'complete');assert.equal(mainState(h).seal,'quiet');
 // The guardian is defeated through the real action button. Test equipment
 // shortens the fight so this check stays about main-story integration.
 h.equipment.weapon.power=400;await open(h);await page.getByRole('button',{name:'The bargain ends here',exact:true}).click();await page.getByRole('button',{name:'Strike',exact:true}).click();await page.getByRole('heading',{name:'The guardian falls',exact:true}).waitFor({state:'visible'});h=await readHero();assert.equal(mainState(h).node,'artifact');assert.equal(h.campaign.stage,'heart');
 h=await act(h,'preserve');assert.equal(mainState(h).node,'homecoming');assert.equal(mainState(h).rescue,'saved');assert.equal(h.completed,0);assert.equal(h.legacy.length,0);await page.screenshot({path:'browser-proof/main-artifact-consequence.png',timeout:10000});
 h=await act(h,'close-case');assert.equal(h.completed,1);assert.equal(h.legacy.length,1);assert.equal(h.campaign.stage,'complete');assert.equal(h.legacy[0].main.route,'records');assert(await page.getByText('MAIN QUEST COMPLETE',{exact:true}).isVisible());assert.equal(await page.getByRole('button',{name:/Begin.*adventure|new journey/i}).count(),0);assert((await page.locator('.dialog-text').textContent()).includes('Mara returns'));await page.screenshot({path:'browser-proof/main-homecoming.png',timeout:10000});
 await page.getByRole('button',{name:'Keep exploring',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();assert.equal((await readHero()).completed,1);await page.getByRole('button',{name:'▤ Journal',exact:true}).click();assert((await page.locator('#panel-body').textContent()).includes('Main plot complete'));await page.getByText(/Evidence & decisions/).click();assert((await page.locator('.main-evidence').textContent()).includes('The warden’s confession'));await page.screenshot({path:'browser-proof/main-evidence-journal.png',timeout:10000});
 console.log('PASS phone main-story opening, homestead evidence, archive fork, records, confession, alliance, crypt memorial/seal, guardian, final choice, homecoming, rewards and reload');
 const rescueChoice=mainScene(fork).choices.find(c=>c.id==='rescue-first');await open(fork);await page.locator('#interact').click();await page.getByRole('button',{name:rescueChoice.label,exact:false}).click();let rescue=await readHero();assert.equal(mainState(rescue).node,'rescue');
 rescue=await act(rescue,'bribe-hunters');assert.equal(mainState(rescue).encounter,'cleared');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Take '+mainProfile(rescue).victim+'’s hand',exact:true}).click();rescue=await readHero();assert.equal(mainState(rescue).rescue,'saved');assert.equal(mainState(rescue).node,'confession');await page.screenshot({path:'browser-proof/main-rescue.png',timeout:10000});
 await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();assert((await page.locator('#hud-objective').textContent()).includes('warden'));assert.equal(mainState(await readHero()).rescue,'saved');
 console.log('PASS phone rescue choice, patrol negotiation, separate captive recovery and persistent next objective');assert.deepEqual(errors,[]);
}catch(error){if(page){await mkdir('browser-proof',{recursive:true});await page.screenshot({path:'browser-proof/main-story-failure.png',timeout:5000}).catch(()=>{})}throw error}
finally{await browser?.close();server.kill('SIGTERM');clearTimeout(watchdog)}
