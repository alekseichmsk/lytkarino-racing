# OSM street names (all named highways) + building addresses -> addr.js
import json,math
d=json.load(open('data/osm_city.json'));E=d['elements']
N={e['id']:(e['lat'],e['lon']) for e in E if e['type']=='node'}
LAT0,LON0=55.577,37.905;k=math.cos(math.radians(LAT0))*111320
p=lambda n:[round((N[n][1]-LON0)*k,1),round(-(N[n][0]-LAT0)*110540,1)]
ST=[];H=[]
for e in E:
  t=e.get('tags',{})
  if e['type']=='way' and t.get('highway') and t.get('name') and t['highway'] not in('footway','path','steps','cycleway','proposed','construction'):
    q=[p(n) for n in e['nodes'] if n in N]
    if len(q)>1:ST.append([t['name'],q])
  if 'addr:housenumber' in t:
    if e['type']=='node' and e['id'] in N:c=p(e['id'])
    elif e['type']=='way':
      q=[p(n) for n in e.get('nodes',[]) if n in N]
      if not q:continue
      c=[round(sum(a[0] for a in q)/len(q),1),round(sum(a[1] for a in q)/len(q),1)]
    else:continue
    H.append([c[0],c[1],t.get('addr:street',''),t['addr:housenumber']])
names=sorted(set(s[0] for s in ST)|set(h[2] for h in H if h[2]));ix={n:i for i,n in enumerate(names)}
open('addr.js','w').write('window.ADDR='+json.dumps({'n':names,'s':[[ix[a],q] for a,q in ST],'h':[[x,z,ix[s] if s else -1,n] for x,z,s,n in H]},ensure_ascii=False,separators=(',',':'))+';')
print(len(names),len(ST),len(H))
