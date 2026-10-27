import * as T from '../vendor/three.module.js';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';

// Only immutable scenery is combined. Skeletons, people, lights, markers and
// particles keep their own transforms and are never included in the batches.
export function batchScenery(root,excluded=[]){
 root.updateMatrixWorld(true);const groups=new Map(),inverse=root.matrixWorld.clone().invert();
 const skip=o=>{for(let p=o;p&&p!==root;p=p.parent)if(excluded.includes(p))return true;return false};
 root.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh||Array.isArray(o.material)||o.material.transparent||skip(o))return;
  const key=o.material.uuid+':'+o.castShadow+':'+o.receiveShadow;let batch=groups.get(key);if(!batch){batch={material:o.material,cast:o.castShadow,receive:o.receiveShadow,meshes:[]};groups.set(key,batch)}batch.meshes.push(o);
 });
 let removed=0,batches=0;
 for(const group of groups.values()){
  if(group.meshes.length<2)continue;
  const geometries=group.meshes.map(o=>{let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();for(const name of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(name))geo.deleteAttribute(name);if(!geo.attributes.normal)geo.computeVertexNormals();if(!geo.attributes.uv)geo.setAttribute('uv',new T.BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));return geo});
  const merged=mergeGeometries(geometries,false);for(const geo of geometries)geo.dispose();if(!merged)continue;
  const mesh=new T.Mesh(merged,group.material);mesh.name='Scenery batch';mesh.castShadow=group.cast;mesh.receiveShadow=group.receive;root.add(mesh);batches++;
  for(const old of group.meshes){old.removeFromParent();old.geometry.dispose();removed++}
 }
 return{removed,batches,savedDraws:removed-batches};
}

export function cameraPosition(target,desired,canOccupy){
 const delta=desired.clone().sub(target),distance=delta.length();if(distance===0)return desired.clone();
 // March from the player toward the camera. The first wall limits the camera,
 // including in crypt corridors and small interiors.
 let clear=0;for(let d=.2;d<=distance;d+=.2){const p=target.clone().addScaledVector(delta,d/distance);if(!canOccupy(p.x,p.z,p.y))return target.clone().addScaledVector(delta,Math.max(.25,clear-.12)/distance);clear=d}
 return desired.clone();
}
