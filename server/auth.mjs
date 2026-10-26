import {randomBytes,randomUUID,createHash,createPublicKey,verify,timingSafeEqual} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,chmod} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const AUTH='https://auth.openai.com',RESOURCE='https://api.openai.com/v1';
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function authorizationAttempt({hostId,clientId,port,idToken,email}){
 const verifier=randomBytes(48).toString('base64url'),state=randomBytes(32).toString('base64url'),nonce=randomBytes(32).toString('base64url');
 const redirectUri=`http://127.0.0.1:${port}/auth/callback`,params=new URLSearchParams({client_id:clientId||'dynamic_agent_client',ext_agent_host_id:hostId,response_type:'code',redirect_uri:redirectUri,scope:'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct',resource:RESOURCE,state,nonce,code_challenge_method:'S256',code_challenge:createHash('sha256').update(verifier).digest('base64url')});
 if(!clientId)params.set('agent_name_hint','SINFALL');if(idToken)params.set('id_token_hint',idToken);if(email)params.set('login_hint',email);
 return{url:AUTH+'/api/accounts/authorize?'+params,verifier,state,nonce,redirectUri,clientId:clientId||null,createdAt:Date.now()};
}
export function callbackRegistration(pending,url){
 if(!pending||Date.now()-pending.createdAt>600000||!eq(pending.state,url.searchParams.get('state')))throw Error('This sign-in attempt expired or its state did not match. Start again.');
 if(url.searchParams.get('error'))throw Error('Sign-in was not authorized. You can keep playing without AI.');
 const clientId=url.searchParams.get('client_id')||pending.clientId,code=url.searchParams.get('code');
 if(!clientId||clientId==='dynamic_agent_client'||!code)throw Error('ChatGPT did not return a complete client registration.');
 if(pending.clientId&&pending.clientId!==clientId)throw Error('The returned ChatGPT registration does not match this account.');return{clientId,code};
}
export async function verifyIdentity(jwt,{clientId,nonce,fetchImpl=fetch,now=Date.now()}={}){
 const parts=String(jwt||'').split('.');if(parts.length!==3)throw Error('ChatGPT returned an invalid identity token.');
 const head=JSON.parse(Buffer.from(parts[0],'base64url')),claims=JSON.parse(Buffer.from(parts[1],'base64url'));
 if(!['RS256','ES256'].includes(head.alg)||typeof head.kid!=='string')throw Error('Unsupported identity signature.');
 const response=await fetchImpl(AUTH+'/.well-known/openid-configuration',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Could not read OpenAI’s identity configuration.');const discovery=await response.json();
 if(discovery.issuer!==AUTH||new URL(discovery.jwks_uri).origin!==AUTH)throw Error('Unexpected OpenAI identity issuer.');
 const keyResponse=await fetchImpl(discovery.jwks_uri,{signal:AbortSignal.timeout(10000)});if(!keyResponse.ok)throw Error('Could not verify OpenAI’s signing keys.');const {keys}=await keyResponse.json(),key=keys?.find(k=>k.kid===head.kid&&(!k.alg||k.alg===head.alg));if(!key)throw Error('The identity signing key was not found.');
 const publicKey=createPublicKey({key,format:'jwk'}),options=head.alg==='ES256'?{key:publicKey,dsaEncoding:'ieee-p1363'}:publicKey;
 if(!verify('sha256',Buffer.from(parts[0]+'.'+parts[1]),options,Buffer.from(parts[2],'base64url')))throw Error('The ChatGPT identity signature was not valid.');
 const aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];if(claims.iss!==AUTH||!aud.includes(clientId)||aud.length>1&&claims.azp!==clientId||!Number.isFinite(claims.exp)||claims.exp*1000<now-30000||claims.iat*1000>now+60000||!eq(claims.nonce,nonce)||typeof claims.sub!=='string'||!claims.sub)throw Error('The ChatGPT identity claims did not match this sign-in.');
 return{issuer:claims.iss,subject:claims.sub,email:typeof claims.email==='string'?claims.email:'',name:typeof claims.name==='string'?claims.name:''};
}
export class ChatGPTConnection{
 constructor({port,directory=path.join(os.homedir(),'.sinfall'),fetchImpl=fetch}={}){this.port=port;this.directory=directory;this.fetch=fetchImpl;this.session=null;this.registration=null;this.hostId=null;this.pending=null;this.refreshPromise=null;this.modelsCache=null}
 async write(name,data){await mkdir(this.directory,{recursive:true,mode:0o700});const dest=path.join(this.directory,name),tmp=dest+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(data),{mode:0o600});await rename(tmp,dest);await chmod(dest,0o600)}
 async read(name){try{return JSON.parse(await readFile(path.join(this.directory,name),'utf8'))}catch{return null}}
 async init(){const host=await this.read('host.json');this.hostId=host?.id||'urn:uuid:'+randomUUID();if(!host)await this.write('host.json',{id:this.hostId});this.session=await this.read('credentials.json');this.registration=await this.read('registration.json');return this}
 start(){const selected=this.session||this.registration;this.pending=authorizationAttempt({hostId:this.hostId,port:this.port,clientId:selected?.client_id,idToken:this.session?.id_token,email:this.session?.identity?.email});return this.pending.url}
 async exchange(params){const r=await this.fetch(AUTH+'/api/accounts/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params),signal:AbortSignal.timeout(20000)});let d;try{d=await r.json()}catch{throw Error('OpenAI returned an unreadable authorization response.')}if(!r.ok)throw Error(d.error==='invalid_grant'?'The authorization expired. Start a fresh sign-in.':'ChatGPT authorization could not be completed.');return d}
 async callback(url){const p=this.pending,{clientId,code}=callbackRegistration(p,url);this.pending=null;
  await this.write('registration.json',{client_id:clientId});this.registration={client_id:clientId};
  const data=await this.exchange({grant_type:'authorization_code',client_id:clientId,code,code_verifier:p.verifier,redirect_uri:p.redirectUri,resource:RESOURCE});const identity=await verifyIdentity(data.id_token,{clientId,nonce:p.nonce,fetchImpl:this.fetch});
  if(p.clientId&&this.session?.identity&&(identity.subject!==this.session.identity.subject||identity.issuer!==this.session.identity.issuer))throw Error('This is a different ChatGPT account. Disconnect locally before adding it.');
  if(typeof data.access_token!=='string'||String(data.token_type).toLowerCase()!=='bearer')throw Error('ChatGPT did not return a bearer credential.');
  const session={client_id:clientId,identity,id_token:data.id_token,access_token:data.access_token,refresh_token:data.refresh_token,scopes:String(data.scope||'').split(' '),expires_at:Date.now()+(Number(data.expires_in)||3600)*1000};await this.write('credentials.json',session);this.session=session;this.modelsCache=null;return this.sharing();
 }
 sharing(){return !!this.session?.access_token&&this.session.scopes?.includes('chatgpt.tokens.use.direct')&&this.session.scopes?.includes('resource.invoke')}
 async token(){if(!this.sharing())throw Error('Connect ChatGPT and authorize plan usage first.');if(this.session.expires_at>Date.now()+60000)return this.session.access_token;if(!this.session.refresh_token)throw Error('Your ChatGPT session expired. Sign in again.');if(!this.refreshPromise)this.refreshPromise=this.refresh().finally(()=>this.refreshPromise=null);await this.refreshPromise;return this.session.access_token}
 async refresh(){const s=this.session,data=await this.exchange({grant_type:'refresh_token',client_id:s.client_id,refresh_token:s.refresh_token,resource:RESOURCE});if(typeof data.access_token!=='string')throw Error('ChatGPT did not renew the connection. Sign in again.');const next={...s,access_token:data.access_token,refresh_token:data.refresh_token||s.refresh_token,id_token:data.id_token||s.id_token,scopes:data.scope?String(data.scope).split(' '):s.scopes,expires_at:Date.now()+(Number(data.expires_in)||3600)*1000};await this.write('credentials.json',next);this.session=next;if(!this.sharing())throw Error('ChatGPT plan permission was not renewed. Sign in again.')}
 async models(){if(this.modelsCache&&this.modelsCache.at>Date.now()-300000)return this.modelsCache.models;const r=await this.fetch(RESOURCE+'/models',{headers:{Authorization:'Bearer '+await this.token()},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('ChatGPT could not list the models available to this account.');const data=await r.json(),models=(data.models||[]).filter(m=>m.visibility==='list'&&typeof m.slug==='string').map(m=>({slug:m.slug,display_name:m.display_name||m.slug}));if(!models.length)throw Error('No eligible ChatGPT models were returned for this account.');this.modelsCache={at:Date.now(),models};return models}
 async logout(){await this.write('credentials.json',null);this.session=null;this.modelsCache=null;this.pending=null}
}
