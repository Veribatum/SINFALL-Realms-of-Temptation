export async function completedText(response){
 if(!response.body)throw Error('The response stream was empty.');const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',text='',completed=false;
 const event=block=>{const lines=block.split('\n').filter(l=>l.startsWith('data:'));if(!lines.length)return;const raw=lines.map(l=>l.slice(5).trimStart()).join('\n');if(raw==='[DONE]')return;let data;try{data=JSON.parse(raw)}catch{throw Error('The AI response contained a malformed stream event.')}
  if(data.type==='response.output_text.delta'){text+=data.delta||'';if(text.length>80000)throw Error('The dungeon master response exceeded the scene limit.')}
  if(data.type==='response.completed')completed=true;
  if(data.type==='response.failed'||data.type==='error'){const code=data.response?.error?.code||data.error?.code||data.code||'';throw Error(code.includes('usage')?'Your ChatGPT plan’s usage is unavailable or at its limit. Review ChatGPT Settings → Usage, or keep playing procedurally.':'The dungeon master request failed. No scene was applied.')}
  if(data.type==='response.incomplete')throw Error('The dungeon master stopped before the scene was complete.');
 };
 try{while(true){const {done,value}=await reader.read();pending+=decoder.decode(value||new Uint8Array(),{stream:!done});pending=pending.replace(/\r\n/g,'\n');let i;while((i=pending.indexOf('\n\n'))>=0){event(pending.slice(0,i));pending=pending.slice(i+2)}if(pending.length>2000000)throw Error('The response stream was too large.');if(done)break}if(pending.trim())event(pending);if(!completed)throw Error('The connection ended before the dungeon master completed the scene.');if(!text.trim())throw Error('The dungeon master returned no scene.');return text}finally{await reader.cancel().catch(()=>{})}
}
