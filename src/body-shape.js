// Shape the authored body and its fitted clothing together in bind space.
export const bustSize=value=>Number.isFinite(value)?Math.max(.7,Math.min(1.6,value)):1;
export function fitBust(mesh,size=1){
 size=bustSize(size);if(mesh.userData.lastBustFit===size||size===1&&!mesh.userData.bustBase)return;
 if(!mesh.isSkinnedMesh||!mesh.geometry?.attributes.position)return;
 const geometry=mesh.geometry,position=geometry.attributes.position;
 const base=mesh.userData.bustBase??=position.array.slice(),amount=bustSize(size)-1;
 for(let i=0;i<position.count;i++){
  const x=base[i*3],y=base[i*3+1],z=base[i*3+2],side=x<0?-1:1;
  const ellipse=1-((Math.abs(x)-.075)/.12)**2-((y-1.385)/.15)**2;
  const front=Math.max(0,Math.min(1,(z+.015)/.08));
  const weight=Math.max(0,ellipse)**2*front*front*(3-2*front);
  position.setXYZ(i,x+side*amount*.015*weight,y,z+amount*.07*weight);
 }
 mesh.userData.lastBustFit=size;position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
}
