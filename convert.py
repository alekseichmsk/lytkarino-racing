import json,math
d=json.load(open('data/osm.json'))
N={e['id']:(e['lat'],e['lon']) for e in d['elements'] if e['type']=='node'}
LAT0,LON0=55.577,37.905
k=math.cos(math.radians(LAT0))*111320
def p(n):
    la,lo=N[n];return [round((lo-LON0)*k,1),round(-(la-LAT0)*110540,1)]
W={'motorway':14,'trunk':12,'primary':11,'secondary':10,'tertiary':8,'residential':6,'unclassified':6,'living_street':5,'service':4,'track':3,'footway':2,'path':2,'pedestrian':4,'cycleway':2}
B=[];R=[];G=[];A=[]
for e in d['elements']:
    if e['type']!='way' or any(n not in N for n in e['nodes']):continue
    t=e.get('tags',{});pts=[p(n) for n in e['nodes']]
    if 'building' in t and len(pts)>3:
        h=None
        try:h=float(t.get('height','').replace('m',''))
        except:pass
        if not h:
            try:h=float(t.get('building:levels'))*3
            except:h={'apartments':15,'residential':15,'yes':6,'kindergarten':6,'school':9,'garages':2.5,'service':3,'construction':4,'retail':4,'commercial':6}.get(t['building'],5)
        shop='shop' in t or t['building'] in('retail','commercial','supermarket','kiosk') or 'amenity' in t
        B.append({'p':pts[:-1],'h':round(h,1),'s':1 if shop else 0,'k':t['building']})
    elif 'highway' in t and t['highway'] in W:
        R.append({'p':pts,'w':W[t['highway']],'n':t.get('name','')})
    elif t.get('natural')=='water' or t.get('waterway')=='riverbank':A.append(pts[:-1])
    elif t.get('leisure') in('park','garden') or t.get('landuse') in('grass','forest','park') or t.get('natural')=='wood':G.append(pts[:-1])
T=[p(e['id']) for e in d['elements'] if e['type']=='node' and e.get('tags',{}).get('natural')=='tree']
open('data.js','w').write('window.CITY='+json.dumps({'b':B,'r':R,'g':G,'w':A,'t':T},separators=(',',':'))+';')
print(len(B),len(R),len(G),len(A))
