// Browser regression checks for the actual phone UI, run by GitHub Actions.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import {setTimeout} from 'node:timers/promises';
import {chromium} from 'playwright';
import * as M from '../src/model.js';
const server=spawn(process.execPath,['server/server.mjs','--preview','--port','8787'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:8787')).ok)break}catch{}await setTimeout(100)}
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8787');await page.getByRole('button',{name:'New Game',exact:true}).click();
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Continue →',exact:true}).click();
 const slider=page.getByLabel('Bust size',{exact:true});await slider.evaluate(input=>{input.value='150';input.dispatchEvent(new Event('input',{bubbles:true}))});
 assert.equal(await slider.inputValue(),'150');await page.getByRole('button',{name:'Begin your story ✦',exact:true}).click();await page.getByRole('button',{name:/Enter the village/}).click();
 await page.getByRole('button',{name:'♙ Character',exact:true}).click();await page.getByRole('button',{name:'Change appearance',exact:true}).click();assert.equal(await page.getByLabel('Bust size',{exact:true}).inputValue(),'150');
 await page.getByRole('button',{name:'Save appearance',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'♙ Character',exact:true}).click();await page.getByRole('button',{name:'Change appearance',exact:true}).click();assert.equal(await page.getByLabel('Bust size',{exact:true}).inputValue(),'150');await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.getByRole('button',{name:'Show on map →',exact:true}).click();const map=page.getByRole('img',{name:/Geographic map/});assert(await map.isVisible());
 for(const name of['World','Town','Region']){await page.getByRole('button',{name,exact:true}).click();assert.equal(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');const colors=await map.evaluate(canvas=>{const d=canvas.getContext('2d').getImageData(0,0,960,960).data,s=new Set();for(let i=0;i<d.length;i+=128)s.add(d[i]+','+d[i+1]+','+d[i+2]);return s.size});assert(colors>20,'map must render geographic detail')}
 await mkdir('browser-proof',{recursive:true});await page.screenshot({path:'browser-proof/phone-map.png'});console.log('SINFALL_MAP_IMAGE_BEGIN'+(await readFile('browser-proof/phone-map.png')).toString('base64')+'SINFALL_MAP_IMAGE_END');console.log('PASS phone creator slider, saved proportions, reload, tracked main destination, geographic map, and all map scales');
 const h=M.makeHero({name:'Quest Tester',gender:'female',raceId:'elf',classId:'necromancer',originId:'wanderer'},13254);M.enterRealm(h);const q=M.discoverRumor(h,'healer');M.acceptSide(h,q.id);
 const questPage=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});questPage.on('pageerror',e=>errors.push(e.message));
 await questPage.addInitScript(book=>{if(!localStorage.getItem('sinfall-realms-v4'))localStorage.setItem('sinfall-realms-v4',JSON.stringify(book))},{schema:4,lastId:h.id,heroes:[h],checkpoints:{}});await questPage.goto('http://127.0.0.1:8787');await questPage.getByRole('button',{name:'Continue',exact:true}).click();await questPage.getByRole('button',{name:'▤ Journal',exact:true}).click();await questPage.getByRole('button',{name:'Track quest on map',exact:true}).click();assert((await questPage.locator('.atlas-target').textContent()).includes(q.title));
 await questPage.reload();await questPage.getByRole('button',{name:'Continue',exact:true}).click();assert((await questPage.locator('#hud-campaign').textContent()).includes(q.title));assert((await questPage.locator('#hud-objective').textContent()).includes('silverleaf'));
 console.log('PASS side-quest tracking from Journal to map and persistent phone HUD');assert.deepEqual(errors,[]);
}catch(error){if(browser){const pages=browser.contexts().flatMap(c=>c.pages());await mkdir('browser-proof',{recursive:true});for(let i=0;i<pages.length;i++)await pages[i].screenshot({path:'browser-proof/failure-'+i+'.png'}).catch(()=>{})}throw error}
finally{await browser?.close();server.kill('SIGTERM')}
