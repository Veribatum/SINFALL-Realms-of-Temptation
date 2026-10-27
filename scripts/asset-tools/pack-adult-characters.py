"""Pack retained CC0 Quaternius adult bodies, fitted outfits and animation clips.

Usage: python scripts/asset-tools/pack-adult-characters.py SOURCE_DIRECTORY
The source directory is the retained OpenAgentsInc/openagents Quaternius mirror.
All runtime data is embedded; no network fetches occur while playing.
"""
from pathlib import Path
import json, struct, sys, copy, io, hashlib
import numpy as np
from PIL import Image, ImageOps, ImageEnhance
SRC=Path(sys.argv[1]); OUT=Path(__file__).resolve().parents[2]/'assets/models'
TYPES={5121:np.uint8,5123:np.dtype('<u2'),5125:np.dtype('<u4'),5126:np.dtype('<f4')}
SIZES={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def document(path):
 p=SRC/path
 if p.suffix=='.glb':
  raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);raw=raw[28+n:]
 else:
  d=json.loads(p.read_text());raw=(p.parent/d['buffers'][0]['uri']).read_bytes()
 return d,raw,p.parent

def array(doc,index):
 d,raw,_=doc;a=d['accessors'][index];v=d['bufferViews'][a['bufferView']];dtype=TYPES[a['componentType']];size=SIZES[a['type']];stride=v.get('byteStride',np.dtype(dtype).itemsize*size);offset=v.get('byteOffset',0)+a.get('byteOffset',0)
 ar=np.ndarray((a['count'],size),dtype=dtype,buffer=raw,offset=offset,strides=(stride,np.dtype(dtype).itemsize)).copy()
 if a.get('normalized') and a['componentType']!=5126: ar=ar.astype('f4')/np.iinfo(dtype).max
 return ar

class Pack:
 def __init__(self,gender):
  self.gender=gender;self.binary=bytearray();self.d={'asset':{'version':'2.0','generator':'Sinfall adult-character packer','extras':{'sinfallAdult':True,'gender':gender.lower(),'source':'Quaternius CC0 adult Superhero body with Fantasy modular outfits'}},'scene':0,'scenes':[{'nodes':[65]}],'nodes':[],'meshes':[],'skins':[],'accessors':[],'bufferViews':[],'materials':[],'textures':[],'images':[],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}],'animations':[],'extensionsUsed':['EXT_texture_webp'],'extensionsRequired':['EXT_texture_webp']};self.materials={};self.images={};self.accessor_cache={}
  self.base=document(f'base/Superhero_{gender}_FullBody.gltf');self.d['nodes']=copy.deepcopy(self.base[0]['nodes'][:65]);self.d['nodes'].append({'name':'Adult '+gender,'children':[64]});self.d['skins']=[copy.deepcopy(self.base[0]['skins'][0])];self.d['skins'][0]['inverseBindMatrices']=self.acc(array(self.base,self.base[0]['skins'][0]['inverseBindMatrices']),'MAT4');
 def view(self,b):
  while len(self.binary)%4:self.binary.append(0)
  view=len(self.d['bufferViews']);self.d['bufferViews'].append({'buffer':0,'byteOffset':len(self.binary),'byteLength':len(b)});self.binary.extend(b);return view
 def acc(self,a,kind=None):
  a=np.ascontiguousarray(a);kind=kind or {1:'SCALAR',2:'VEC2',3:'VEC3',4:'VEC4',16:'MAT4'}[a.shape[1]]
  c=5126 if a.dtype.kind=='f' else 5125 if a.dtype.itemsize==4 else 5123 if a.dtype.itemsize==2 else 5121
  key=(kind,c,hashlib.sha256(a.tobytes()).digest());cached=self.accessor_cache.get(key)
  if cached is not None:return cached
  v=self.view(a.tobytes());i=len(self.d['accessors']);self.accessor_cache[key]=i;entry={'bufferView':v,'componentType':c,'count':len(a),'type':kind};
  if kind=='VEC3':entry.update(min=a.min(0).tolist(),max=a.max(0).tolist())
  if kind=='SCALAR':entry.update(min=a.min(0).tolist(),max=a.max(0).tolist())
  self.d['accessors'].append(entry);return i
 def material(self,doc,index,role):
  d,raw,parent=doc;m=d['materials'][index];key=(m['name'],role)
  if key in self.materials:return self.materials[key]
  out={'name':role,'doubleSided':True,'pbrMetallicRoughness':{'metallicFactor':0,'roughnessFactor':.85}}
  tex=m.get('pbrMetallicRoughness',{}).get('baseColorTexture')
  if tex:
   uri=d['images'][d['textures'][tex['index']]['source']]['uri'];path=(parent/uri).resolve();imagekey=str(path)
   if imagekey not in self.images:
    im=Image.open(path).convert('RGB');limit=2048 if role=='skin' else 256 if role=='eyes' else 1024;im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
    # The original atlas is authored for a dark superhero. Normalize its skin
    # swatches once so a runtime tint can span all playable skin palettes.
    if role=='hair':
     im=ImageOps.autocontrast(ImageOps.grayscale(im),cutoff=1).convert('RGB')
    if role=='skin':
     ar=np.array(im).astype('f4')/255;lum=ar@np.array([.2126,.7152,.0722]);ar=np.clip(ar*np.array([2.65,2.85,3.0]),0,1);im=Image.fromarray((ar*255).astype('u1'))
    b=io.BytesIO();im.save(b,'WEBP',quality=86,method=6);self.d['images'].append({'bufferView':self.view(b.getvalue()),'mimeType':'image/webp','name':path.name});ti=len(self.d['textures']);self.d['textures'].append({'sampler':0,'extensions':{'EXT_texture_webp':{'source':len(self.d['images'])-1}}});self.images[imagekey]=ti
   out['pbrMetallicRoughness']['baseColorTexture']={'index':self.images[imagekey]}
  self.materials[key]=len(self.d['materials']);self.d['materials'].append(out);return self.materials[key]
 def mesh(self,doc,mi,name,role,keep=None,alter=None,clip=None):
  m=doc[0]['meshes'][mi];prims=[]
  for p in m['primitives']:
   attrs={k:array(doc,i) for k,i in p['attributes'].items() if k in ['POSITION','NORMAL','TEXCOORD_0','JOINTS_0','WEIGHTS_0']};indices=array(doc,p['indices']).flatten().reshape((-1,3)).astype('u4')
   if clip:
    pieces=[]
    for tri in indices:
     poly=[{k:v[i].copy() for k,v in attrs.items()} for i in tri];out=[]
     for va,vb in zip(poly,poly[1:]+poly[:1]):
      da,db=clip(va['POSITION']),clip(vb['POSITION'])
      if da>=0:out.append(va)
      if (da>=0)!=(db>=0):
       t=da/(da-db);point={k:va[k]*(1-t)+vb[k]*t for k in attrs if k not in ['JOINTS_0','WEIGHTS_0']};weights={}
       for vertex,weight in [(va,1-t),(vb,t)]:
        for joint,w in zip(vertex['JOINTS_0'],vertex['WEIGHTS_0']):weights[int(joint)]=weights.get(int(joint),0)+float(w)*weight
       top=sorted(weights.items(),key=lambda x:-x[1])[:4];top+= [(0,0)]*(4-len(top));point['JOINTS_0']=np.array([x[0] for x in top]);point['WEIGHTS_0']=np.array([x[1] for x in top]);out.append(point)
     for j in range(1,len(out)-1):pieces.extend([out[0],out[j],out[j+1]])
    if not pieces:continue
    attrs={k:np.array([vertex[k] for vertex in pieces]) for k in attrs};indices=np.arange(len(pieces),dtype='u4').reshape((-1,3))
   if keep: indices=indices[keep(attrs['POSITION'][indices])]
   if not len(indices):continue
   used,inv=np.unique(indices,return_inverse=True);attrs={k:v[used] for k,v in attrs.items()};indices=inv.astype('u4').reshape((-1,1))
   if alter:alter(attrs)
   # Preserve normalized skin weights; optional extras from source atlases are
   # authoring masks, not vertex colors, and must not darken rendered faces.
   weights=attrs.get('WEIGHTS_0')
   if weights is not None:attrs['WEIGHTS_0']=(weights/np.maximum(.000001,weights.sum(1,keepdims=True))).astype('f4')
   source_material=doc[0]['materials'][p.get('material',0)]['name'];actual_role='skin' if 'Regular_' in source_material else role
   mid=self.material(doc,p.get('material',0),actual_role)
   if role=='neckline':self.d['materials'][mid]={'name':'skin','doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'roughnessFactor':.85,'metallicFactor':0}}
   prims.append({'attributes':{k:self.acc(v.astype('u2') if k=='JOINTS_0' else v.astype('f4')) for k,v in attrs.items()},'indices':self.acc(indices),'material':mid})
  if not prims:return
  i=len(self.d['meshes']);self.d['meshes'].append({'name':name,'primitives':prims});ni=len(self.d['nodes']);self.d['nodes'].append({'name':name,'mesh':i,'skin':0});self.d['nodes'][65]['children'].append(ni)
 def neckline(self):
  points=[];indices=[]
  for y,z,width in [(1.375,.112,.002),(1.4,.104,.018),(1.43,.071,.044),(1.46,.033,.07),(1.49,.012,.065),(1.52,.012,.035)]:
   for k in range(5):
    x=(k/2-1)*width;points.append([x,y,z-abs(x)*.12])
  for row in range(5):
   for k in range(4):
    a=row*5+k;b=a+5;indices.extend([a,a+1,b,a+1,b+1,b])
  count=len(points);normals=np.tile([0,.3,1],(count,1)).astype('f4');normals/=np.linalg.norm(normals,axis=1,keepdims=True);joints=np.zeros((count,4),dtype='u2');joints[:,0]=4;weights=np.zeros((count,4),dtype='f4');weights[:,0]=1
  mid=len(self.d['materials']);self.d['materials'].append({'name':'skin','doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'roughnessFactor':.85,'metallicFactor':0}});mi=len(self.d['meshes']);self.d['meshes'].append({'name':'Fitted neckline insert','primitives':[{'attributes':{'POSITION':self.acc(np.array(points,dtype='f4')),'NORMAL':self.acc(normals),'JOINTS_0':self.acc(joints),'WEIGHTS_0':self.acc(weights)},'indices':self.acc(np.array(indices,dtype='u4').reshape((-1,1))),'material':mid}]});ni=len(self.d['nodes']);self.d['nodes'].append({'name':'Fitted neckline insert','mesh':mi,'skin':0});self.d['nodes'][65]['children'].append(ni)
 def robe(self):
  positions=[];normals=[];indices=[]
  for height,radius in [(.14,.285),(.48,.245),(.8,.19),(1.025,.13)]:
   for k in range(25):
    angle=k/24*np.pi*2;positions.append([np.cos(angle)*radius,height,np.sin(angle)*radius*.7]);normals.append([np.cos(angle),.18,np.sin(angle)/.7])
  for ring in range(3):
   for k in range(24):
    a=ring*25+k;b=a+25;indices.extend([a,b,a+1,a+1,b,b+1])
  normals=np.array(normals,dtype='f4');normals/=np.linalg.norm(normals,axis=1,keepdims=True);count=len(positions);joints=np.zeros((count,4),dtype='u2');joints[:,0]=1;weights=np.zeros((count,4),dtype='f4');weights[:,0]=1
  mid=len(self.d['materials']);self.d['materials'].append({'name':'robe','doubleSided':True,'pbrMetallicRoughness':{'roughnessFactor':.9,'metallicFactor':0}});mi=len(self.d['meshes']);self.d['meshes'].append({'name':'Ceremonial robe','primitives':[{'attributes':{'POSITION':self.acc(np.array(positions,dtype='f4')),'NORMAL':self.acc(normals),'JOINTS_0':self.acc(joints),'WEIGHTS_0':self.acc(weights)},'indices':self.acc(np.array(indices,dtype='u4').reshape((-1,1))),'material':mid}]});ni=len(self.d['nodes']);self.d['nodes'].append({'name':'Ceremonial robe','mesh':mi,'skin':0});self.d['nodes'][65]['children'].append(ni)
 def animations(self):
  gait=document('gaits.glb');extra=document('animations.glb');mapping=[(gait,'Idle_Loop','Idle'),(gait,'Walk_Loop','Walking_A'),(gait,'Jog_Fwd_Loop','Running_A'),(extra,'Sword_Regular_A','1H_Melee_Attack_Chop'),(extra,'Sword_Regular_B','1H_Melee_Attack_Slice_Diagonal'),(extra,'Sword_Heavy_Combo','2H_Melee_Attack_Slice'),(gait,'Hit_Chest','Hit_A'),(gait,'Death01','Death_A'),(gait,'Spell_Simple_Shoot','Spellcast_Shoot'),(extra,'Consume','Interact'),(extra,'Sword_Block','Block')]
  names={n.get('name'):i for i,n in enumerate(self.d['nodes'][:65])}
  for doc,old,new in mapping:
   a=copy.deepcopy(next(a for a in doc[0]['animations'] if a['name']==old));a['name']=new
   samplers=[];channels=[]
   for channel in a['channels']:
    node=doc[0]['nodes'][channel['target']['node']]['name'];path=channel['target']['path'];sampler=a['samplers'][channel['sampler']];times=array(doc,sampler['input']);values=array(doc,sampler['output'])
    # Translation/scale tracks are constant rest values in this shared rig.
    # Keep pelvis motion, discard redundant scale tracks and decimate 60fps
    # rotation samples to 30fps while retaining both endpoints.
    if path=='scale':continue
    if path=='translation' and node not in ['root','pelvis']:continue
    take=np.unique(np.r_[np.arange(0,len(times),2),len(times)-1])
    if np.max(np.abs(values-values[0]))<.00001:take=np.array([0,len(times)-1])
    channel['target']['node']=names[node];channel['sampler']=len(samplers);samplers.append({'input':self.acc(times[take]),'output':self.acc(values[take]),'interpolation':'LINEAR'});channels.append(channel)
   a['samplers']=samplers;a['channels']=channels;self.d['animations'].append(a)
 def save(self):
  self.d['buffers']=[{'byteLength':len(self.binary)}];j=json.dumps(self.d,separators=(',',':')).encode();j+=b' '*(4-len(j)%4 if len(j)%4 else 0);b=bytes(self.binary);b+=b'\0'*(4-len(b)%4 if len(b)%4 else 0);out=struct.pack('<III',0x46546c67,2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b;p=OUT/f'adult-{self.gender.lower()}.glb';p.write_bytes(out);print(p,len(out))

def build(gender):
 p=Pack(gender);d=p.base
 p.mesh(d,1,'Authored eyes','eyes');p.mesh(d,0,'Authored eyebrows','hair');p.mesh(d,2,'Authored face and neck','skin',keep=lambda v:(v[:,:,1].min(1)>1.485))
 for outfit in ['Ranger','Peasant']:
  doc=document(f'outfits/{gender}_{outfit}.gltf')
  for i,m in enumerate(doc[0]['meshes']):
   if 'Hood' in m['name']:continue
   role='ranger' if outfit=='Ranger' else 'peasant'
   p.mesh(doc,i,m['name'],role,clip=(lambda v:v[1]-.525) if outfit=='Ranger' and m['name'].endswith('_Legs') else (lambda v:max(1.385+abs(v[0])*1.03-v[1],-.065-v[2])) if gender=='Female' and m['name']=='Female_Ranger_Body' else None)
 for file,name in [('Hair_BuzzedFemale' if gender=='Female' else 'Hair_Buzzed','cropped'),('Hair_SimpleParted','swept'),('Hair_Long','long'),('Hair_Buns','buns'),('Hair_Beard','beard')]:
  doc=document('hair/'+file+'.gltf');p.mesh(doc,0,'Hair '+name,'hair')
 if gender=='Female':p.neckline()
 p.robe();p.animations();p.save()
OUT.mkdir(exist_ok=True,parents=True)
for gender in ['Female','Male']:build(gender)
for source,name in [('base-license.txt','BASE'),('outfits-license.txt','OUTFITS'),('animations-license.txt','ANIMATIONS')]: (OUT/f'LICENSE-QUATERNIUS-{name}.txt').write_text((SRC/source).read_text())
