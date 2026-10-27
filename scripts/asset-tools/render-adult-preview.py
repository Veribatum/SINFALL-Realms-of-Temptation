"""Depth-buffer render of actual posed game meshes from preview-adult.mjs.

Triangle sorting cannot reliably resolve an exposed limb beside a flowing
garment. Rasterize interpolated projected depth so outfit checks show actual
surface coverage, including intersecting triangles and close-fitting trim.
"""
import json,sys,base64,io
from PIL import Image,ImageDraw,ImageFont
import numpy as np
source=sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/sinfall-adult-mesh-qa.json';out=sys.argv[2] if len(sys.argv)>2 else '/workspace/scratch/sinfall-adult-mesh-qa.png'
data=json.load(open(source));W,H=2000,1000;canvas=Image.new('RGB',(W,H),'#14242a');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',25)
for panel in range(len(data)):
 offset=panel*1000;draw.ellipse((offset+300,880,offset+700,933),fill='#091418')
pixels=np.array(canvas);depth=np.full((H,W),np.inf)
for panel,model in enumerate(data):
 images=[np.array(Image.open(io.BytesIO(base64.b64decode(s))).convert('RGB')) for s in model['images']];offset=panel*1000
 for tri in model['tris']:
  points=np.array(tri['p'],dtype='f8')
  if not np.isfinite(points).all():continue
  points[:,0]=offset+500+points[:,0]*475;points[:,1]=535-points[:,1]*475
  low=np.maximum(np.floor(points[:,:2].min(0)).astype(int),[offset,0]);high=np.minimum(np.ceil(points[:,:2].max(0)).astype(int),[offset+999,H-1])
  if np.any(high<low):continue
  x,y=np.meshgrid(np.arange(low[0],high[0]+1)+.5,np.arange(low[1],high[1]+1)+.5)
  a,b,c=points;det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
  if abs(det)<1e-9:continue
  u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/det
  v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/det;w=1-u-v
  z=u*a[2]+v*b[2]+w*c[2];view=depth[low[1]:high[1]+1,low[0]:high[0]+1]
  mask=(u>=0)&(v>=0)&(w>=0)&(z<view)&(z>=-1)&(z<=1)
  if not mask.any():continue
  color=np.array(tri['c'])*255
  if tri['im']>=0:
   im=images[tri['im']];uv=np.array(tri['uv']).mean(0);x=int((uv[0]%1)*(im.shape[1]-1));y=int((uv[1]%1)*(im.shape[0]-1));color=color*im[y,x]/255
  color=np.clip(color*tri['l'],0,255).astype('u1');view[mask]=z[mask];pixels[low[1]:high[1]+1,low[0]:high[0]+1][mask]=color
canvas=Image.fromarray(pixels);draw=ImageDraw.Draw(canvas)
for panel,model in enumerate(data):
 offset=panel*1000;draw.text((offset+50,30),model.get('label') or ('FEMALE MOON ELF' if model['gender']=='female' else 'MALE ADVENTURER'),font=font,fill='#dfcba5');draw.text((offset+50,70),'Actual posed meshes · depth-buffer verification',font=font,fill='#9eafb1')
canvas.save(out);print(out)
