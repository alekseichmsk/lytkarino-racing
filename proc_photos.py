# process Gemini photo-based facades -> tx/ph_*.jpg (+_n,_e), phx.json meta
import numpy as np,glob,json,os,re,sys
from scipy import ndimage as nd
from PIL import Image,ImageFilter
SRC='/workspace/lytkarino-photos/gemini';OUT='/workspace/lytkarino-game/tx'
META=json.load(open('/workspace/lytkarino-game/phx_meta.json'))  # name -> {floors, fh}
rng=np.random.default_rng(1)
def seam(a,ax,w=64):
  a=a.copy();n=a.shape[ax];t=np.linspace(0,1,w)[:,None,None] if ax==0 else np.linspace(0,1,w)[None,:,None]
  if ax==1:
    L=a[:,:w].copy();R=a[:,n-w:].copy();a[:,n-w:]=R*(1-t)+L*t*0+ (R*(1-t)+L[:, ::-1]*0)*0 + 0
    # cross-fade: right edge fades into the left edge content so wrap is continuous
    a[:,n-w:]=R*(1-t)+L*t
  else:
    T=a[:w].copy();B=a[n-w:].copy();a[n-w:]=B*(1-t)+T*t
  return a
out={}
for f in sorted(glob.glob(SRC+'/*')):
  base=os.path.basename(f);m=META.get(base)
  if not m or m.get('skip'):print('skip',base);continue
  name='ph_'+m['key'];im=Image.open(f).convert('RGB');cr=m.get('crop')
  if cr:im=im.crop((0,int(im.height*cr[0]),im.width,int(im.height*cr[1])))
  im=im.resize((1024,1024),Image.LANCZOS)
  a=np.asarray(im).astype(float);a=seam(seam(a,1,72),0,24)
  Image.fromarray(a.clip(0,255).astype('uint8')).resize((512,512),Image.LANCZOS).save(f'{OUT}/{name}.jpg',quality=85)
  L=a.mean(2);gx=np.gradient(L,axis=1);gy=np.gradient(L,axis=0);s=2/255*4
  nx,ny=-gx*s,gy*s;nz=np.ones_like(L);l=np.sqrt(nx*nx+ny*ny+nz*nz)
  nm=np.stack([(nx/l+1)*127.5,(ny/l+1)*127.5,(nz/l+1)*127.5],2)
  Image.fromarray(nm.astype('uint8')).resize((256,256)).save(f'{OUT}/{name}_n.jpg',quality=85)
  rough=255-np.clip((L-L.mean())*.8+180,0,255);Image.fromarray(rough.astype('uint8')).resize((256,256)).save(f'{OUT}/{name}_r.jpg',quality=80)
  F=m['floors'];import sys;sys.path.insert(0,'/workspace/lytkarino-game/tools');from win import emissive
  e,nw=emissive(a,m['floors'],seed=hash(name)%1000);print(name,'windows',nw)
  if m.get('signs'):
    sat=a.max(2)-a.min(2);Lm=a.mean(2);hsv=np.asarray(Image.fromarray(a.clip(0,255).astype('uint8')).convert('HSV')).astype(float);S_=hsv[...,1];V_=hsv[...,2];core=(S_>170)&(V_>120);core=nd.binary_opening(core,iterations=2);reg=nd.binary_dilation(core,iterations=6)&(nd.uniform_filter(core.astype(float),31)>.25);sg=core|(reg&(V_>200))
    sg=nd.binary_opening(sg,iterations=1);e=np.maximum(e,(a*sg[...,None]*1.1).clip(0,255)).astype('uint8')
  Image.fromarray(e).resize((256,256)).save(f'{OUT}/{name}_e.jpg',quality=80)
  night=(a*.18+ e*.9).clip(0,255);Image.fromarray(night.astype('uint8')).resize((512,512)).save(f'/workspace/lytkarino-photos/processed/{name}_night.jpg',quality=85)
  cr=m.get('crop') or [0,1];out[name]={'w':round(F*m['fh']/(cr[1]-cr[0]),2),'f':F,'fh':m['fh'],'src':base,'addr':m.get('addr',''),'osm':m.get('osm',[]),'like':m.get('like'),'uniq':m.get('uniq',0),'ground':m.get('ground',0)}
json.dump(out,open('/workspace/lytkarino-game/phx.json','w'),ensure_ascii=False,indent=1)
open('/workspace/lytkarino-game/phx.js','w').write('window.PHX='+json.dumps(out,ensure_ascii=False)+';')
print(json.dumps(out,ensure_ascii=False))
