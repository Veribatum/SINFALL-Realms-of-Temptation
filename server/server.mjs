import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {ChatGPTConnection} from './auth.mjs';
import {completedText} from './stream.mjs';
import {DIRECTOR_INSTRUCTIONS,validateAdventure,validateScene,parseJson} from '../src/director.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),preview=process.argv.includes('--preview');
const port=Number(process.env.PORT)||Number(process.argv[process.argv.indexOf('--port')+1])||8787,host=preview?'0.0.0.0':'127.0.0.1',origin=`http://127.0.0.1:${port}`;
const conn=preview?null:await new ChatGPTConnection({port}).init();let busy=false;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors "+(preview?"'self'":"'none'")};
function json(res,status,data){res.writeHead(status,{...headers,'Content-Type':'application/json'});res.end(JSON.stringify(data))}
async function body(req){let data='',bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>64000)throw Error('The request is too large.');data+=chunk}try{return JSON.parse(data||'{}')}catch{throw Error('Expected a JSON request.')}}
const sceneSchema={type:'object',additionalProperties:false,required:['narration','choices'],properties:{narration:{type:'string'},choices:{type:'array',minItems:2,maxItems:4,items:{type:'object',additionalProperties:false,required:['label','stat','result','reward'],properties:{label:{type:'string'},stat:{type:'string',enum:['might','finesse','lore','presence','none']},result:{type:'string'},reward:{type:'string',enum:['information','heal','gold','mana','reputation']}}}}}};
const campaignFields=['title','artifact','enemy','witness','clue','revelation','demand','preserve','destroy','bind','color'];const campaignSchema={type:'object',additionalProperties:false,required:campaignFields,properties:Object.fromEntries(campaignFields.map(k=>[k,{type:'string'}]))};
const server=http.createServer(async(req,res)=>{
 try{
  if(!preview&&req.headers.host!==`127.0.0.1:${port}`){json(res,403,{error:'Open the local edition at '+origin});return}
  const url=new URL(req.url,origin),name=url.pathname;
  if(preview&&name==='/__qa/mobile'){res.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><title>SINFALL mobile layout QA</title><body style="margin:0;background:#263138;display:grid;place-items:center;min-height:100vh"><iframe title="SINFALL phone viewport" src="/" style="width:390px;height:844px;max-height:95vh;border:1px solid #8c9a86;border-radius:22px"></iframe>');return}
  if(name.startsWith('/api/')&&req.method==='POST'&&(preview||req.headers.origin!==origin)){json(res,403,{error:'This action must start inside the local SINFALL app.'});return}
  if(name==='/api/status'&&req.method==='GET'){
   if(preview){json(res,200,{available:false});return}
   let models=[],error=null;if(conn.sharing())try{models=await conn.models()}catch(e){error=e.message}
   json(res,200,{available:true,connected:!!conn.session,sharing:conn.sharing()&&!error,account:conn.session?.identity?{name:conn.session.identity.name,email:conn.session.identity.email}:null,models,error});return;
  }
  if(name==='/api/auth/start'&&req.method==='POST'){await body(req);json(res,200,{url:conn.start()});return}
  if(name==='/api/auth/logout'&&req.method==='POST'){await body(req);await conn.logout();json(res,200,{ok:true});return}
  if(name==='/auth/callback'&&req.method==='GET'){
   if(preview){json(res,403,{error:'Sign-in requires the local edition.'});return}try{await conn.callback(url);res.writeHead(303,{...headers,Location:'/?connected=1'});res.end()}catch(e){res.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8'});const safe=e.message.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>SINFALL sign-in</title><body style="background:#102126;color:#e4dfc7;font:18px Georgia;padding:40px;max-width:700px"><h1>Your adventure is safe.</h1><p>'+safe+'</p><p><a style="color:#d7b779" href="/">Return to SINFALL</a></p>')};return;
  }
  if(name==='/api/director'&&req.method==='POST'){
   if(busy){json(res,429,{error:'The dungeon master is finishing another scene. Try again in a moment.'});return}
   const data=await body(req);if(typeof data.prompt!=='string'||data.prompt.length>30000||!['scene','campaign'].includes(data.kind)){json(res,400,{error:'The scene request was invalid.'});return}if(!conn.sharing()){json(res,401,{error:'Connect ChatGPT and authorize plan usage first.'});return}
   busy=true;try{const models=await conn.models(),model=data.model||models[0]?.slug;if(!models.some(m=>m.slug===model))throw Error('Select one of the models available to your ChatGPT account.');const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+await conn.token(),'Content-Type':'application/json'},body:JSON.stringify({model,store:false,stream:true,instructions:DIRECTOR_INSTRUCTIONS,input:[{role:'user',content:data.prompt}],text:{format:{type:'json_schema',name:data.kind==='campaign'?'sinfall_campaign':'sinfall_scene',strict:true,schema:data.kind==='campaign'?campaignSchema:sceneSchema}}}),signal:AbortSignal.timeout(110000)});if(!response.ok){let code='';try{const e=await response.json();code=e.error?.code||''}catch{}throw Error(code.includes('usage')?'Your ChatGPT usage is unavailable or at its limit. Check Settings → Usage in ChatGPT.':'ChatGPT declined this request. Check your connection and model, then try again.')};const text=await completedText(response),pack=parseJson(text);if(!(data.kind==='campaign'?validateAdventure(pack):validateScene(pack)))throw Error('The returned story was incomplete. No scene was applied.');json(res,200,{text})}finally{busy=false}return;
  }
  if(!['GET','HEAD'].includes(req.method)){json(res,405,{error:'Method not supported.'});return}
  const clean=decodeURIComponent(name);if(clean.includes('..')||clean.includes('\\')||clean.includes('\0')||!(clean==='/'||clean==='/index.html'||clean==='/icon.svg'||clean==='/manifest.webmanifest'||/^\/(src|assets|vendor)\/[\w./-]+$/.test(clean))){json(res,404,{error:'Not found.'});return}
  const file=path.resolve(root,clean==='/'?'index.html':'.'+clean);if(!file.startsWith(root+path.sep)){json(res,404,{error:'Not found.'});return}const info=await stat(file);if(!info.isFile())throw Error('Not found.');const data=await readFile(file);res.writeHead(200,{...headers,'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);
 }catch(e){if(!res.headersSent)json(res,e.code==='ENOENT'?404:400,{error:e.code==='ENOENT'?'Not found.':e.message||'The request could not be completed.'});else res.end()}
});
server.listen(port,host,()=>{console.log(`SINFALL is ready at ${origin}${preview?' (preview; AI sign-in disabled)':''}`);if(!preview&&process.argv.includes('--open')){const command=process.platform==='win32'?'cmd':process.platform==='darwin'?'open':'xdg-open',args=process.platform==='win32'?['/c','start','',origin]:[origin];const child=spawn(command,args,{stdio:'ignore',detached:true});child.on('error',()=>console.log('Open '+origin+' in your browser.'));child.unref()}});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'The SINFALL port is already in use. Close the other instance, or set PORT to a free port.':e.message);process.exitCode=1});
