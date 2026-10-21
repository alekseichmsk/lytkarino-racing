import math,os,json,urllib.request,concurrent.futures as cf
from PIL import Image
Z=18;LAT0,LON0=55.577,37.905;k=math.cos(math.radians(LAT0))*111320
def tx(lon):return (lon+180)/360*2**Z
def ty(lat):r=math.radians(lat);return (1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**Z
def lon_(x):return x/2**Z*360-180
def lat_(y):n=math.pi-2*math.pi*y/2**Z;return math.degrees(math.atan(math.sinh(n)))
x0,x1=int(tx(37.893)),int(tx(37.917));y0,y1=int(ty(55.584)),int(ty(55.570))
def get(xy):
    x,y=xy;f=f'/tmp/tiles/{x}_{y}.jpg'
    if not os.path.exists(f):
        rq=urllib.request.Request(f'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{y}/{x}',headers={'User-Agent':'lytkarino-game'})
        open(f,'wb').write(urllib.request.urlopen(rq,timeout=30).read())
    return f
xs=list(range(x0,x1+1));ys=list(range(y0,y1+1))
with cf.ThreadPoolExecutor(8) as ex:list(ex.map(get,[(x,y) for x in xs for y in ys]))
nx,ny=len(xs),len(ys);hx,hy=(nx+1)//2,(ny+1)//2;meta=[]
for cx in range(2):
  for cy in range(2):
    X=xs[cx*hx:(cx+1)*hx];Y=ys[cy*hy:(cy+1)*hy]
    if not X or not Y:continue
    im=Image.new('RGB',(256*len(X),256*len(Y)))
    for i,x in enumerate(X):
      for j,y in enumerate(Y):im.paste(Image.open(f'/tmp/tiles/{x}_{y}.jpg').convert('RGB'),(i*256,j*256))
    n=f'sat/s{cx}{cy}.jpg';im.save(n,quality=80)
    L=lon_(X[0]);Rr=lon_(X[-1]+1);T=lat_(Y[0]);B=lat_(Y[-1]+1)
    meta.append({'f':n,'x0':round((L-LON0)*k,2),'x1':round((Rr-LON0)*k,2),'z0':round(-(T-LAT0)*110540,2),'z1':round(-(B-LAT0)*110540,2)})
open('sat.js','w').write('window.SAT='+json.dumps(meta)+';');print(nx,ny,meta)
