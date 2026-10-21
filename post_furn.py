import json,math
d=json.load(open('data/osm_city.json'));E=d['elements'] if isinstance(d,dict) else d
L0,O0=55.577,37.905;K=math.cos(math.radians(L0))*111320
xy=lambda la,lo:[round((lo-O0)*K,1),round(-(la-L0)*110540,1)]
N={e['id']:xy(e['lat'],e['lon']) for e in E if e['type']=='node'}
W={e['id']:e for e in E if e['type']=='way'}
F={k:[] for k in ['fe','wl','gr','hg','sc','pk','wb','bs','lp','sw','sh','bn']}
def pts(w):return [N[n] for n in w.get('nodes',[]) if n in N]
for e in E:
  t=e.get('tags',{})
  if e['type']=='node':
    p=N[e['id']]
    if t.get('amenity')=='waste_basket':F['wb'].append(p)
    elif t.get('amenity')=='bench':F['bn'].append(p)
    elif t.get('highway')=='bus_stop':F['bs'].append(p+[t.get('name','')])
    elif t.get('highway')=='street_lamp':F['lp'].append(p)
    if 'shop' in t or t.get('amenity') in('pharmacy','cafe','fast_food','bank'):
      F['sh'].append(p+[t.get('brand') or t.get('name') or '',t.get('shop') or t.get('amenity')])
  elif e['type']=='way':
    P=pts(e)
    if len(P)<2:continue
    b=t.get('barrier')
    if b=='fence':F['fe'].append(P)
    elif b in('wall','retaining_wall'):F['wl'].append(P)
    elif b=='guard_rail':F['gr'].append(P)
    elif b=='hedge':F['hg'].append(P)
    if t.get('natural')=='scrub':F['sc'].append(P)
    if t.get('amenity')=='parking' and len(P)>3 and t.get('parking','surface')=='surface':F['pk'].append(P)
    if t.get('footway')=='sidewalk' or (t.get('highway')=='footway' and 'footway' not in t):F['sw'].append(P)
  elif e['type']=='relation' and e.get('tags',{}).get('natural')=='scrub':
    for m in e.get('members',[]):
      if m['type']=='way' and m.get('role')=='outer' and m['ref'] in W:F['sc'].append(pts(W[m['ref']]))
open('furn.js','w').write('window.FURN='+json.dumps(F,ensure_ascii=False,separators=(',',':'))+';')
print({k:len(v) for k,v in F.items()})
