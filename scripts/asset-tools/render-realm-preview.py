"""Project actual scene triangles for geometry QA; not a GPU screenshot."""
import json,sys
from PIL import Image,ImageDraw,ImageFont
path=sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/sinfall-realm-qa.json'
out=sys.argv[2] if len(sys.argv)>2 else '/workspace/scratch/sinfall-realm-qa.jpg'
W,H=1920,1200;image=Image.new('RGB',(W,H),'#9baca4');draw=ImageDraw.Draw(image)
for tri in sorted(json.load(open(path)),key=lambda t:-sum(p[2] for p in t['p'])/3):
 pts=[((p[0]+1)*W/2,(1-p[1])*H/2) for p in tri['p']]
 if any(abs(p[0])>15000 or abs(p[1])>15000 for p in pts):continue
 draw.polygon(pts,fill=tuple(max(0,min(255,int(c*255))) for c in tri['c']))
draw.rectangle((0,0,W,85),fill='#14242a');font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',25)
draw.text((35,16),'SINFALL · Actual streamed realm geometry',font=font,fill='#dfcba5');draw.text((35,49),'Software verification view · 25 enterable buildings in this settlement',font=font,fill='#9eafb1');image.save(out,quality=92);print(out)
