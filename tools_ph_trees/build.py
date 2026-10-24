# Blender: real Poly Haven tree -> game LOD: decimated trunk + leaf-cluster cards (cluster atlas rendered from the real foliage)
import bpy,sys,json,random,math,bmesh,os
import numpy as np
from mathutils import Vector
a=sys.argv[sys.argv.index('--')+1:]
gl,objn,name,H,NC,TT,xz=a[0],a[1],a[2],float(a[3]),int(a[4]),int(a[5]),float(a[6])
OUT='/workspace/ph_trees/out/'
random.seed(7);np.random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=gl)
obs=[o for o in bpy.data.objects if o.type=='MESH']
ob=[o for o in obs if o.name.startswith(objn)][0]
for o in obs:
  if o!=ob: bpy.data.objects.remove(o)
bpy.context.view_layer.objects.active=ob;ob.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
me=ob.data
LEAFK=('leaves','twig','branch','dead')
def isleaf(m):
  n=m.name.lower()
  if 'tree_small_02_branches' in n: return True
  return any(k in n for k in LEAFK) and not n.endswith('_trunk')
mats=list(me.materials)
lidx={i for i,m in enumerate(mats) if isleaf(m)}
tidx=[i for i in range(len(mats)) if i not in lidx]
# trunk texture = the solid material with most faces
cnt={}
for p in me.polygons: cnt[p.material_index]=cnt.get(p.material_index,0)+1
ti=max(tidx,key=lambda i:cnt.get(i,0))
print('LEAF',[mats[i].name for i in lidx],'TRUNK',mats[ti].name)
def img_of(m,key='diff'):
  for n in m.node_tree.nodes:
    if n.type=='TEX_IMAGE' and n.image and key in n.image.name: return n.image
# bounds / scale to H
co=np.zeros(len(me.vertices)*3);me.vertices.foreach_get('co',co);co=co.reshape(-1,3)
zmin=co[:,2].min();zmax=co[:,2].max();sc=H/(zmax-zmin)
cx,cy=np.median(co[:,0]),np.median(co[:,1])
# ---- leaf sample points (area weighted) ----
lp=[];la=[]
for p in me.polygons:
  if p.material_index in lidx: lp.append(p.center[:]);la.append(p.area)
lp=np.array(lp);la=np.array(la);la/=la.sum()
# ---- cluster atlas: render 4 crops of real foliage ----
# split leaf object copy for rendering
bpy.ops.object.select_all(action='DESELECT')
lob=ob.copy();lob.data=ob.data.copy();bpy.context.collection.objects.link(lob)
_b=bmesh.new();_b.from_mesh(lob.data);bmesh.ops.delete(_b,geom=[f for f in _b.faces if f.material_index==ti],context='FACES');_b.to_mesh(lob.data);_b.free()
for m in mats:
  if m is None: continue
  nt=m.node_tree;d=img_of(m);al=None
  for n in nt.nodes:
    if n.type=='TEX_IMAGE' and n.image and ('alpha' in n.image.name or 'diff' in n.image.name): al=n
  out=[n for n in nt.nodes if n.type=='OUTPUT_MATERIAL'][0]
  em=nt.nodes.new('ShaderNodeEmission');tr=nt.nodes.new('ShaderNodeBsdfTransparent');mx=nt.nodes.new('ShaderNodeMixShader')
  dn=[n for n in nt.nodes if n.type=='TEX_IMAGE' and n.image and 'diff' in n.image.name][0]
  nt.links.new(dn.outputs['Color'],em.inputs['Color'])
  nt.links.new(dn.outputs['Alpha'],mx.inputs['Fac']);nt.links.new(tr.outputs[0],mx.inputs[1]);nt.links.new(em.outputs[0],mx.inputs[2])
  nt.links.new(mx.outputs[0],out.inputs['Surface']);m.blend_method='CLIP'
ob.hide_render=True
scn=bpy.context.scene;scn.render.engine='CYCLES';scn.cycles.samples=24;scn.cycles.device='CPU';scn.render.film_transparent=True
scn.render.resolution_x=scn.render.resolution_y=512;scn.view_settings.view_transform='Standard'
cam=bpy.data.cameras.new('c');cam.type='ORTHO';co_=bpy.data.objects.new('c',cam);scn.collection.objects.link(co_);scn.camera=co_
r=np.hypot(lp[:,0]-cx,lp[:,1]-cy);
C=(zmax-zmin)*float(os.environ.get('CF','0.2'))
outer=np.where(r>np.percentile(r,55))[0]
for q in range(4):
  best=None
  for t in range(40):
    p=lp[random.choice(outer)];d=np.sum(np.max(np.abs(lp-p),axis=1)<C/2)
    if best is None or d>best[0]: best=(d,p)
  p=Vector(best[1]);dirv=Vector((p.x-cx,p.y-cy,0)).normalized()
  co_.location=p+dirv*(C*3);co_.rotation_euler=(dirv*-1).to_track_quat('-Z','Z').to_euler()
  cam.ortho_scale=C;cam.clip_start=C*3-C/2;cam.clip_end=C*3+C/2
  scn.render.filepath=OUT+f'{name}_c{q}.png';bpy.ops.render.render(write_still=True)
# ---- trunk: decimate ----
bpy.data.objects.remove(lob)
ob.hide_render=False
bm=bmesh.new();bm.from_mesh(me)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index!=ti],context='FACES')
bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
bm.to_mesh(me);bm.free()
nf=len(me.polygons);md=ob.modifiers.new('d','DECIMATE');md.ratio=min(1,TT/max(1,nf*2))
bpy.ops.object.modifier_apply(modifier='d')
bm=bmesh.new();bm.from_mesh(me);bmesh.ops.triangulate(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
me.calc_normals_split() if hasattr(me,'calc_normals_split') else None
uvl=me.uv_layers.active.data
P=[];N=[];U=[];I=[];vm={}
for poly in me.polygons:
  for li in poly.loop_indices:
    l=me.loops[li];v=me.vertices[l.vertex_index];uv=uvl[li].uv
    key=(l.vertex_index,round(uv[0],4),round(uv[1],4))
    if key not in vm:
      vm[key]=len(P)//3;c=v.co;n=l.normal
      P+=[(c.x-cx)*sc*xz,(c.z-zmin)*sc,-(c.y-cy)*sc*xz];N+=[n.x,n.z,-n.y];U+=[uv[0],uv[1]]
    I.append(vm[key])
B={'p':P,'n':N,'u':U,'i':I}
# ---- leaf cards ----
idx=np.random.choice(len(lp),NC,p=la)
ctr=np.array([cx,cy,(lp[:,2].min()+lp[:,2].max())/2])
LP=[];LN=[];LU=[];LI=[]
for k,j in enumerate(idx):
  p=lp[j];o=p-ctr;o[2]*=.6;nrm=o/ (np.linalg.norm(o)+1e-6)
  h=np.array([p[0]-cx,p[1]-cy,0]);h=h/(np.linalg.norm(h)+1e-6) if np.linalg.norm(h)>1e-3 else np.array([1,0,0])
  ang=random.uniform(-1.0,1.0);fx=np.array([h[0]*math.cos(ang)-h[1]*math.sin(ang),h[0]*math.sin(ang)+h[1]*math.cos(ang),0])
  rt=np.cross(fx,[0,0,1]);rt/=np.linalg.norm(rt)+1e-6;tl=random.uniform(-.5,.5);up=np.array([0,0,1])*math.cos(tl)+fx*math.sin(tl)
  s=C*random.uniform(.8,1.2)/2;q=random.randrange(4);u0=(q%2)*.5;v0=1-(q//2)*.5-.5
  b=len(LP)//3
  for (sx,sy) in [(-1,-1),(1,-1),(1,1),(-1,1)]:
    c=p+rt*sx*s+up*sy*s
    LP+=[(c[0]-cx)*sc*xz,(c[2]-zmin)*sc,-(c[1]-cy)*sc*xz];LN+=[nrm[0],nrm[2],-nrm[1]];LU+=[u0+(sx+1)/4,v0+(sy+1)/4]
  LI+=[b,b+1,b+2,b,b+2,b+3]
L={'p':LP,'n':LN,'u':LU,'i':LI}
# bark texture
im=img_of(mats[ti]);im.scale(512,512);im.filepath_raw=OUT+f'bark_{name}.jpg';im.file_format='JPEG';im.save()
json.dump({'b':B,'l':L},open(OUT+name+'.json','w'))
print('DONE',name,len(I)//3,'trunk tris',len(LI)//3,'leaf tris')
