# extracts OSM traffic_sign=city_limit nodes and oneway=yes drivable ways -> signs_osm.js
import json,math
d=json.load(open('data/osm_city.json'));E=d['elements']
N={e['id']:(e['lat'],e['lon']) for e in E if e['type']=='node'}
LAT0,LON0=55.577,37.905;k=math.cos(math.radians(LAT0))*111320
p=lambda n:[round((N[n][1]-LON0)*k,1),round(-(N[n][0]-LAT0)*110540,1)]
CL=[]
for e in E:
  t=e.get('tags',{})
  if e['type']=='node' and t.get('traffic_sign')=='city_limit':CL.append(p(e['id'])+[t.get('name','Лыткарино'),t.get('direction','')])
OW=[]
for e in E:
  t=e.get('tags',{})
  if e['type']=='way' and t.get('oneway') in('yes','-1') and t.get('highway') in('primary','secondary','tertiary','residential','unclassified','secondary_link','primary_link','tertiary_link','service','living_street'):
    q=[p(n) for n in e['nodes'] if n in N]
    if t['oneway']=='-1':q=q[::-1]
    if len(q)>1:OW.append(q)
open('signs_osm.js','w').write('window.SOSM='+json.dumps({'cl':CL,'ow':OW},ensure_ascii=False,separators=(',',':'))+';')
print(CL,len(OW))
