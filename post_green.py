# green areas with type (+ residential landuse for courtyard greenery) -> data.js 'gr','res'
import json,math
LAT0,LON0=55.577,37.905;k=math.cos(math.radians(LAT0))*111320
o=json.load(open('data/osm_city.json'));el=o['elements'];N={e['id']:(e['lat'],e['lon']) for e in el if e['type']=='node'}
W={e['id']:e for e in el if e['type']=='way'}
xy=lambda n:[round((N[n][1]-LON0)*k,1),round(-(N[n][0]-LAT0)*110540,1)]
def cls(t):
  lu,le,na=t.get('landuse'),t.get('leisure'),t.get('natural')
  if lu=='forest' or na=='wood':return 'f'
  if na=='scrub':return 's'
  if le in('park','garden') or lu in('park','recreation_ground','village_green'):return 'p'
  if lu in('grass','meadow') or na in('grassland','heath'):return 'g'
  if lu=='residential':return 'r'
def join(ws):
  segs=[[n for n in w['nodes'] if n in N] for w in ws];segs=[s for s in segs if len(s)>1];rings=[]
  while segs:
    r=segs.pop(0)
    while r[0]!=r[-1]:
      for i,s in enumerate(segs):
        if s[0]==r[-1]:r+=s[1:];break
        if s[-1]==r[-1]:r+=s[::-1][1:];break
      else:break
      segs.pop(i)
    if r[0]==r[-1] and len(r)>3:rings.append(r[:-1])
  return rings
gr=[];res=[]
for e in el:
  t=e.get('tags',{});c=cls(t)
  if not c:continue
  if e['type']=='way':R=join([e])
  elif e['type']=='relation':R=join([W[m['ref']] for m in e.get('members',[]) if m['type']=='way' and m.get('role')=='outer' and m['ref'] in W])
  else:continue
  for r in R:
    p=[xy(n) for n in r]
    (res if c=='r' else gr).append(p if c=='r' else [c,p])
s=open('data.js').read();d=json.loads(s[s.index('{'):s.rindex('}')+1]);d['gr']=gr;d['res']=res
for b in d['b']:
  if b['id']==751304371:b['l']=5;b['lt']=1;b['h']=max(b['h'],15.4)
open('data.js','w').write('window.CITY='+json.dumps(d,separators=(',',':'),ensure_ascii=False)+';')
from collections import Counter;print(Counter(g[0] for g in gr),len(res))
