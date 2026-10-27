import {loadActor,createActor,animateActor,disposeActor} from './actors.js?v=5';

// Preview-only integration check: exercise browser downloads and embedded PNG
// decoding even when the verification browser cannot create a WebGL context.
const button=document.getElementById('check-models'),results=document.getElementById('model-results');
button.addEventListener('click',async()=>{
 button.disabled=true;results.replaceChildren();
 for(const name of['rogue','knight','mage','barbarian']){
  const row=document.createElement('p');row.textContent=name+': loading…';results.append(row);
  try{
   const source=await loadActor(name),actor=createActor(source,{kind:name}),images=new Set();let vertices=0,bones=0;
   actor.traverse(o=>{if(o.isMesh){if(o.material.map?.image)images.add(o.material.map.image);vertices+=o.geometry.attributes.position.count}if(o.isBone)bones++});
   if(!images.size||![...images].every(i=>i.width===1024&&i.height===1024)||!bones||source.animations.length!==11)throw Error('Incomplete model or texture');
   animateActor(actor,.1,.4);animateActor(actor,.1,.4);actor.updateMatrixWorld(true);
   row.textContent=`PASS · ${name} · embedded texture decoded at 1024 × 1024 · ${vertices} vertices · ${bones} bones · ${source.animations.length} animation clips · Walking_A active`;
   disposeActor(actor);
  }catch(error){row.textContent='FAIL · '+name+' · '+error.message}
 }
 button.disabled=false;
});

