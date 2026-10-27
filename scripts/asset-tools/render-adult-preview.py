"""Render actual projected game geometry exported by preview-adult.mjs."""
import json,sys,base64,io
from PIL import Image,ImageDraw,ImageFont
import numpy as np
source=sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/sinfall-adult-mesh-qa.json';out=sys.argv[2] if len(sys.argv)>2 else '/workspace/scratch/sinfall-adult-mesh-qa.png'
data=json.load(open(source));W,H=2000,1000;canvas=Image.new('RGB',(W,H),'#14242a');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',25)
for panel,model in enumerate(data):
 images=[np.array(Image.open(io.BytesIO(base64.b64decode(s))).convert('RGB')) for s in model['images']];offset=panel*1000
 draw.text((offset+50,30),model.get('label') or ('FEMALE MOON ELF' if model['gender']=='female' else 'MALE ADVENTURER'),font=font,fill='#dfcba5');draw.text((offset+50,70),'Actual posed meshes · software verification render',font=font,fill='#9eafb1');draw.ellipse((offset+300,880,offset+700,933),fill='#091418')
 for tri in sorted(model['tris'],key=lambda t:-sum(p[2] for p in t['p'])/3):
  pts=[(offset+500+p[0]*475,535-p[1]*475) for p in tri['p']]
  if any(abs(p[0]-offset)>2000 or abs(p[1])>2000 for p in pts):continue
  color=np.array(tri['c'])*255
  if tri['im']>=0:
   im=images[tri['im']];uv=np.array(tri['uv']).mean(0);x=int((uv[0]%1)*(im.shape[1]-1));y=int((uv[1]%1)*(im.shape[0]-1));color=color*im[y,x]/255
  color=np.clip(color*tri['l'],0,255).astype('u1');draw.polygon(pts,fill=tuple(color))
canvas.save(out);print(out)
