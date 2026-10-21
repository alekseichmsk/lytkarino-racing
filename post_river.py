import json,math,glob
L0,O0=55.577,37.905;K=math.cos(math.radians(L0))*111320
xy=lambda la,lo:[round((lo-O0)*K,1),round(-(la-L0)*110540,1)]
def rings(ws):
  ws=[list(w) for w in ws];out=[]
  while ws:
    r=ws.pop(0)
    while r[0]!=r[-1]:
      for i,w in enumerate(ws):
        if w[0]==r[-1]:r+=w[1:];break
        if w[-1]==r[-1]:r+=w[::-1][1:];break
        if w[-1]==r[0]:r=w+r[1:];break
        if w[0]==r[0]:r=w[::-1]+r[1:];break
      else:break
      ws.pop(i)
    if len(r)>3:out.append(r)
  return out
RV=[]
for f in glob.glob('data/river/*.json'):
  E=json.load(open(f))['elements'];N={e['id']:e for e in E if e['type']=='node'};W={e['id']:e['nodes'] for e in E if e['type']=='way'}
  rel=[e for e in E if e['type']=='relation'][0]
  o=[W[m['ref']] for m in rel['members'] if m['type']=='way' and m['role']!='inner' and m['ref'] in W]
  i=[W[m['ref']] for m in rel['members'] if m['type']=='way' and m['role']=='inner' and m['ref'] in W]
  P=lambda r:[xy(N[n]['lat'],N[n]['lon']) for n in r]
  H=[P(r) for r in rings(i)]
  for r in rings(o):RV.append([P(r),H])
open('river.js','w').write('window.RIVER='+json.dumps(RV,separators=(',',':'))+';')
print(len(RV),sum(len(r[0]) for r in RV),[ (min(p[0] for p in r[0]),max(p[0] for p in r[0]),min(p[1] for p in r[0]),max(p[1] for p in r[0])) for r in RV][:3])
