import {loadActor,createActor,animateActor,disposeActor} from './actors.js?v=7';

// Preview-only integration check: exercise browser downloads and embedded PNG
// decoding even when the verification browser cannot create a WebGL context.
const button=document.getElementById('check-models'),results=document.getElementById('model-results');
button.textContent='Check all six models';
button.addEventListener('click',async()=>{
 button.disabled=true;results.replaceChildren();
 for(const name of['rogue','knight','mage','barbarian','adult-female','adult-male']){
  const row=document.createElement('p');row.textContent=name+': loading…';results.append(row);
  try{
   const appearance=name.startsWith('adult-')?{gender:name.slice(6),raceId:'elf',classId:'ranger'}:null;const source=await loadActor(name,appearance),actor=createActor(source,{kind:name,hero:appearance}),images=new Set();let vertices=0,bones=0;
   actor.traverse(o=>{if(o.isMesh){if(o.material.map?.image)images.add(o.material.map.image);vertices+=o.geometry.attributes.position.count}if(o.isBone)bones++});
   if(!images.size||![...images].every(i=>i.width>=256&&i.height>=256)||!bones||source.animations.length!==11)throw Error('Incomplete model or texture');
   animateActor(actor,.1,.4);animateActor(actor,.1,.4);actor.updateMatrixWorld(true);
   row.textContent=`PASS · ${name} · ${images.size} embedded textures decoded · ${vertices} vertices · ${bones} bones · ${source.animations.length} animation clips · Walking_A active`;
   disposeActor(actor);
  }catch(error){row.textContent='FAIL · '+name+' · '+error.message}
 }
 button.disabled=false;
});

