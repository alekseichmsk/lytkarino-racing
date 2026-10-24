import json,numpy as np,shutil
from PIL import Image,ImageFilter
O='out/';G='/tmp/pubV/'
names=['isl1','isl2','isl3','sm2','fira','firb','firc']
yy,xx=np.mgrid[0:512,0:512];r=np.hypot(xx-255.5,yy-255.5)/256
rng=np.random.default_rng(3)
for n in []:
  a=Image.new('RGBA',(1024,1024),(0,0,0,0))
  for q in range(4):
    im=np.array(Image.open(O+f'{n}_c{q}.png').convert('RGBA')).astype(np.float32)
    ang=np.arctan2(yy-255.5,xx-255.5);wob=1+.08*np.sin(ang*5+q)+.05*np.sin(ang*9+2*q)
    m=np.clip((0.98*wob-r)/0.12,0,1);im[...,3]*=m
    a.paste(Image.fromarray(im.astype(np.uint8)),((q%2)*512,(q//2)*512))
  # bleed colour into transparent texels to avoid dark fringes in mips
  rgb=a.convert('RGB').filter(ImageFilter.MaxFilter(5));A=np.array(a);B=np.array(rgb);mask=A[...,3]<8;A[...,:3][mask]=B[mask];a=Image.fromarray(A)
  a.save(G+f'tex/leaf_ph_{n}.webp',quality=80,method=6)
  shutil.copy(O+f'bark_{n}.jpg',G+f'tex/bark_ph_{n}.jpg')
SP={'birch':(15,['isl2','isl1'],.8),'poplar':(22,['isl2','isl1'],.6),'popcut':(11,['sm2','isl3'],1),'linden':(14,['isl1','isl3'],1),'maple':(11,['isl3','sm2'],1),'rowan':(7,['sm2','isl2'],1),'spruce':(13,['firb','firc'],1),'pine':(20,['fira','firb'],.85)}
bufs=[];off=[0];man={}
def put(arr):
  b=arr.tobytes();o=off[0];bufs.append(b);off[0]+=len(b);pad=(4-off[0]%4)%4
  if pad: bufs.append(b'\0'*pad);off[0]+=pad
  return [o,int(arr.size)]
cache={}
for k,(H,vs,xz) in SP.items():
  man[k]={'bark':'ph_'+vs[0],'leaf':'ph_'+vs[0]+'.webp','v':[]}
  for v in vs:
    d=json.load(open(O+v+'.json'));e={'bark':'ph_'+v,'leaf':'ph_'+v+'.webp'}
    for part in 'bl':
      g=d[part];P=np.array(g['p'],np.float32).reshape(-1,3)*(H/10)
      if part=='l' and len(P)%4==0:
        Q=P.reshape(-1,4,3);c=Q.mean(1,keepdims=True);c2=c.copy();c2[...,0]*=xz;c2[...,2]*=xz;P=(Q-c+c2).reshape(-1,3)
      else: P[:,0]*=xz;P[:,2]*=xz
      N=np.array(g['n'],np.float32).reshape(-1,3);N/=np.linalg.norm(N,axis=1,keepdims=True)+1e-6
      U=np.array(g['u'],np.float32);I=np.array(g['i'])
      e[part]={'p':put(np.round(P*500).astype(np.int16)),'n':put(np.round(N*127).astype(np.int8)),'u':put(np.round(U*1000).astype(np.int16)),'i':put(I.astype(np.uint32 if len(P)>65535 else np.uint16)),'i32':bool(len(P)>65535)}
    man[k]['v'].append(e)
open(G+'data/trees.bin','wb').write(b''.join(bufs));json.dump(man,open(G+'data/trees.json','w'))
print('bin',off[0])
