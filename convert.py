import json,math,os
from PIL import Image
d=json.load(open('data/osm.json'))
N={e['id']:(e['lat'],e['lon']) for e in d['elements'] if e['type']=='node'}
LAT0,LON0=55.577,37.905;Z=18
k=math.cos(math.radians(LAT0))*111320
def p(n):
    la,lo=N[n];return [round((lo-LON0)*k,1),round(-(la-LAT0)*110540,1)]
# satellite roof sampling
TC={}
def tile(x,y):
    if (x,y) not in TC:
        f=f'/tmp/tiles/{x}_{y}.jpg';TC[(x,y)]=Image.open(f).convert('RGB') if os.path.exists(f) else None
    return TC[(x,y)]
def px(x,z):
    lon=x/k+LON0;lat=-z/110540+LAT0;r=math.radians(lat)
    X=(lon+180)/360*2**Z*256;Y=(1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**Z*256
    t=tile(int(X//256),int(Y//256));return t.getpixel((int(X%256),int(Y%256))) if t else None
def inpoly(x,z,P):
    c=False;j=len(P)-1
    for i in range(len(P)):
        a,b=P[i],P[j]
        if (a[1]>z)!=(b[1]>z) and x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]:c=not c
        j=i
    return c
def roofcol(P):
    cx=sum(q[0] for q in P)/len(P);cz=sum(q[1] for q in P)/len(P)
    S=[[cx+(q[0]-cx)*.7,cz+(q[1]-cz)*.7] for q in P]
    xs=[q[0] for q in S];zs=[q[1] for q in S];cols=[]
    st=max(.6,(max(xs)-min(xs))/14)
    x=min(xs)
    while x<=max(xs):
        z=min(zs)
        while z<=max(zs):
            if inpoly(x,z,S):
                c=px(x,z)
                if c:cols.append(c)
            z+=st
        x+=st
    if not cols:return None
    m=[sorted(c[i] for c in cols)[len(cols)//2] for i in range(3)]
    return '#%02x%02x%02x'%tuple(m)
W={'motorway':14,'trunk':12,'primary':11,'secondary':10,'tertiary':8,'residential':6,'unclassified':6,'living_street':5,'service':4,'track':3,'footway':2,'path':2,'pedestrian':4,'cycleway':2}
DEF={'apartments':4,'residential':4,'yes':2,'kindergarten':2,'school':3,'garages':1,'service':1,'construction':1,'retail':1,'commercial':2,'civic':3,'sports_centre':2}
B=[];R=[];G=[];A=[]
for e in d['elements']:
    if e['type']!='way' or any(n not in N for n in e['nodes']):continue
    t=e.get('tags',{});pts=[p(n) for n in e['nodes']]
    if 'building' in t and len(pts)>3:
        try:lv=float(t['building:levels'])
        except:lv=DEF.get(t['building'],2)
        try:h=float(t['height'])
        except:h=lv*3+(0.6 if lv>1 else 0)
        shop='shop' in t or t['building'] in('retail','commercial','supermarket','kiosk')
        nm=t.get('name','');P=pts[:-1]
        B.append({'p':P,'h':round(h,1),'l':int(lv),'s':1 if shop else 0,'k':t['building'],'rs':1 if t.get('roof:shape')=='hipped' else 0,
                  'rc':roofcol(P),'n':nm,'a':t.get('amenity') or t.get('leisure') or t.get('shop') or t.get('historic') or '','id':e['id']})
    elif 'highway' in t and t['highway'] in W:
        R.append({'p':pts,'w':W[t['highway']],'n':t.get('name','')})
    elif t.get('natural')=='water' or t.get('waterway')=='riverbank':A.append(pts[:-1])
    elif t.get('leisure') in('park','garden') or t.get('landuse') in('grass','forest','park') or t.get('natural')=='wood':G.append(pts[:-1])
T=[p(e['id']) for e in d['elements'] if e['type']=='node' and e.get('tags',{}).get('natural')=='tree']
open('data.js','w').write('window.CITY='+json.dumps({'b':B,'r':R,'g':G,'w':A,'t':T},separators=(',',':'),ensure_ascii=False)+';')
print(len(B),sum(1 for b in B if b['rc']),[b['rc'] for b in B[:8]])
