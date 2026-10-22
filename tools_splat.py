# builds tex/gnd/splat.png (R=dirt, G=gravel, B=paving/plitka; asphalt comes from asph.js) at 4 m/px over the city
import json,re,subprocess,numpy as np
from PIL import Image,ImageDraw,ImageFilter
X0,Z0,C,W,H=-3247.54,-4265.63,4,2074,2059
city=json.loads(subprocess.check_output(['node','-e',"global.window={};require('./data.js');process.stdout.write(JSON.stringify(window.CITY))"]))
# satellite mosaic -> bare-soil mask
mos=Image.new('RGB',(3*2048,3*2048))
for i in range(3):
  for j in range(3):mos.paste(Image.open(f'sat/c{i}{j}.jpg').convert('RGB'),(i*2048,j*2048))
sx=(5048.76-X0)/(3*2048);sz=(3972.26-Z0)/(3*2048)
mos=mos.resize((W,H),Image.BOX)  # extents match to ~0.1%
a=np.asarray(mos).astype(np.float32);r,g,b=a[...,0],a[...,1],a[...,2]
mx=a.max(-1);mn=a.min(-1);sat=(mx-mn)/(mx+1)
soil=((r>g*1.04)&(r>b*1.18)&(mx>100)&(mx<215)&(sat>.14)).astype(np.uint8)*255
soil=np.asarray(Image.fromarray(soil).filter(ImageFilter.MedianFilter(3)))
def img():return Image.new('L',(W,H),0)
def P(q):return [((x-X0)/C,(z-Z0)/C) for x,z in q]
pav=img();dp=ImageDraw.Draw(pav)
for rd in city['hw']:
  if rd['w']<=2:dp.line(P(rd['p']),fill=255,width=1)
for bd in city['b']:
  if bd.get('k') in ('apartments','residential','school','kindergarten','retail','commercial','public','civic','office','church'):dp.polygon(P(bd['p']),outline=255,fill=None);dp.line(P(bd['p']+[bd['p'][0]]),fill=255,width=2)
grv=img();dg=ImageDraw.Draw(grv)
for bd in city['b']:
  if bd.get('k') in ('garage','garages','industrial','warehouse','service','hangar','shed'):
    xs=[p[0] for p in bd['p']];zs=[p[1] for p in bd['p']];dg.rectangle([(min(xs)-14-X0)/C,(min(zs)-14-Z0)/C,(max(xs)+14-X0)/C,(max(zs)+14-Z0)/C],fill=200)
grn=img();dn=ImageDraw.Draw(grn);ply=img();dy=ImageDraw.Draw(ply)
for t,p in city['gr']:
  if len(p)>2:(dy if t=='p' else dn).polygon(P(p),fill=255)
pav=np.asarray(pav).astype(np.float32)/255;grv=np.asarray(grv).astype(np.float32)/255;grn=np.asarray(grn).astype(np.float32)/255;ply=np.asarray(ply).astype(np.float32)/255
dirt=soil.astype(np.float32)/255*(1-.6*grn)
dirt=np.maximum(dirt,ply*.5);pav=np.maximum(pav,ply*.35)
grv=grv*(1-pav)
st=np.stack([dirt,grv,pav],-1)
im=Image.fromarray((np.clip(st,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.7))
im.save('tex/gnd/splat.png',optimize=True)
print('dirt%',(dirt>.5).mean()*100,'grv%',(grv>.5).mean()*100,'pav%',(pav>.5).mean()*100)
