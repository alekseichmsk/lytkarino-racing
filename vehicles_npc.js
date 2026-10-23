// NPC vehicles (police UAZ Patriot, OMON PAZ-3205, civilian Lada Priora) with opening doors + exit/seat metadata.
// Standalone module: window.VNPC.load(kind) -> Promise<veh>. Not wired into traffic/AI yet (see npcveh.html test page).
// Vehicle space: +z forward, +y up, +x = vehicle's LEFT side, origin at ground centre. Models pre-normalised by tools_npcveh.mjs.
(function(){
const T=THREE;
// ---- helpers ----
const toFloat=g=>{// meshopt-quantised attributes -> plain float (so applyMatrix4/clipping work)
 const o=new T.BufferGeometry();for(const k of ['position','normal','uv']){const a=g.attributes[k];if(!a)continue;const n=a.itemSize,arr=new Float32Array(a.count*n);
  for(let i=0;i<a.count;i++){arr[i*n]=a.getX(i);if(n>1)arr[i*n+1]=a.getY(i);if(n>2)arr[i*n+2]=a.getZ(i);}o.setAttribute(k,new T.BufferAttribute(arr,n));}
 if(g.index)o.setIndex(g.index.clone());return o;};
const bakedMeshes=(scene)=>{scene.updateMatrixWorld(true);const out=[];scene.traverse(o=>{if(!o.isMesh)return;const g=toFloat(o.geometry).applyMatrix4(o.matrixWorld);out.push({name:o.name,parent:o.parent&&o.parent.name,geo:g.index?g.toNonIndexed():g,mat:o.material});});return out;};
const capM=new T.MeshBasicMaterial({color:0x101214,side:T.DoubleSide});
// Sutherland-Hodgman clip of side-facing triangles against convex door outlines (projected to (z,y)); same idea as the ambulance in game.js
function splitDoors(geo,DS){const P=geo.attributes.position,N=geo.attributes.normal,U=geo.attributes.uv;
 const V8=i=>[P.getX(i),P.getY(i),P.getZ(i),N?N.getX(i):0,N?N.getY(i):0,N?N.getZ(i):0,U?U.getX(i):0,U?U.getY(i):0];
 const lerp=(p,q,t)=>p.map((x,i)=>x+(q[i]-x)*t);const pj=v=>[v[2],v[1]];
 const cut=(poly,A,B)=>{const f=v=>{const p=pj(v);return (B[0]-A[0])*(p[1]-A[1])-(B[1]-A[1])*(p[0]-A[0]);};const I=[],O=[];
  for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],fp=f(p),fq=f(q);if(fp>=0)I.push(p);else O.push(p);if((fp>=0)!==(fq>=0)){const x=lerp(p,q,fp/(fp-fq));I.push(x);O.push(x);}}return [I,O];};
 const fan=(poly,out)=>{for(let i=1;i<poly.length-1;i++)out.push(poly[0],poly[i],poly[i+1]);};
 const rest=[],dv=DS.map(()=>[]);
 for(let i=0;i<P.count;i+=3){const t=[V8(i),V8(i+1),V8(i+2)];const c=[0,1,2].map(k=>(t[0][k]+t[1][k]+t[2][k])/3);
  const e1=[0,1,2].map(k=>t[1][k]-t[0][k]),e2=[0,1,2].map(k=>t[2][k]-t[0][k]);let n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];const nl=Math.hypot(...n)||1;n=n.map(x=>x/nl);
  let hit=false;for(let di=0;di<DS.length;di++){const d=DS[di];if(!(n[0]*d.sd>d.nx&&c[0]*d.sd>d.xmin))continue;let inside=t,outs=[];const pl=d.poly;
   for(let k=0;k<pl.length&&inside.length>=3;k++){const [I,O]=cut(inside,pl[k],pl[(k+1)%pl.length]);if(O.length>=3)outs.push(O);inside=I;}
   if(inside.length>=3){fan(inside,dv[di]);outs.forEach(o=>fan(o,rest));hit=true;break;}}
  if(!hit)rest.push(...t);}
 const mkG=arr=>{if(!arr.length)return null;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(arr.flatMap(v=>v.slice(0,3)),3));
  g.setAttribute('normal',new T.Float32BufferAttribute(arr.flatMap(v=>v.slice(3,6)),3));g.setAttribute('uv',new T.Float32BufferAttribute(arr.flatMap(v=>v.slice(6,8)),2));return g;};
 return {body:mkG(rest),doors:dv.map(mkG)};}
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;};
// a decal band along one side, split into z-segments so each piece can ride on its own door pivot (UV continuous)
function sideBand(veh,sd,x,y0,y1,z0,z1,tex,segs){const m=new T.MeshBasicMaterial({map:tex,transparent:true,polygonOffset:true,polygonOffsetFactor:-2,side:T.DoubleSide});
 segs.forEach(([a,b,parent])=>{a=Math.min(a,z1);b=Math.max(b,z0);if(a<=b)return;const g=new T.PlaneGeometry(a-b,y1-y0);const uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++){const zz=uv.getX(i)?(sd>0?b:a):(sd>0?a:b);uv.setX(i,sd>0?(z1-zz)/(z1-z0):(zz-z0)/(z1-z0));}// text reads front->back on both sides
  const p=new T.Mesh(g,m);p.rotation.y=sd*Math.PI/2;const wp=new T.Vector3(sd*x,(y0+y1)/2,(a+b)/2);(parent||veh.body).add(p);(parent||veh.body).worldToLocal(veh.root.localToWorld(wp));p.position.copy(wp);});}
// ---- per-vehicle specs ----
const SPECS={
 uaz:{url:'models/npc_uaz.glb',len:4.78,role:'police',credit:'UAZ Patriot by tiunov.se (CC BY 4.0)',seats:[[.42,.95,.45],[-.42,.95,.45],[.42,.95,-.45],[-.42,.95,-.45]]},
 paz:{url:'models/npc_paz.glb',len:7.0,role:'omon',credit:'PAZ bus by Yo.Ri @grox777 (CC BY 4.0)'},
 priora:{url:'models/npc_priora.glb',len:4.35,role:'civil',credit:'Lada Priora VAZ-2170 by Okopchi (CC BY 4.0)',seats:[[.38,.45,.2],[-.38,.45,.2],[.38,.45,-.65],[-.38,.45,-.65]]}};
const mkDoor=(veh,hinge,open,kind,sd,meshes)=>{const pv=new T.Group();pv.position.set(hinge[0],0,hinge[1]);veh.body.add(pv);pv.updateMatrixWorld(true);meshes.forEach(m=>pv.attach(m));
 const d={pv,open,kind,sd,a:0,tg:0};veh.doors.push(d);return d;};
const addExit=(veh,d,x,z,seat)=>{veh.exits.push({door:veh.doors.indexOf(d),pos:new T.Vector3(x,0,z),heading:Math.sign(x)*Math.PI/2,seat:seat?new T.Vector3(...seat):null});};
function buildUAZ(veh,gl){const S=gl.scene;S.updateMatrixWorld(true);const groups={};const plain=[];
 S.traverse(o=>{if(!o.isMesh)return;const m=(o.name||'').match(/^(Door_r[fr]_ok(?:001)?|boot_ok)_/);if(m)(groups[m[1]]=groups[m[1]]||[]).push(o);else plain.push(o);});
 veh.body.add(S);
 const bbOf=ms=>{const b=new T.Box3();ms.forEach(m=>b.expandByObject(m));return b;};
 const side=[];Object.keys(groups).forEach(k=>{const ms=groups[k],bb=bbOf(ms);if(k==='boot_ok'){// side-hinged rear door, hinge on the vehicle's right (-x)
   const d=mkDoor(veh,[bb.min.x+.04,bb.min.z+.04],1.7,'B',0,ms);veh.rear=d;addExit(veh,d,.45,bb.min.z-.9,null);veh.exits[veh.exits.length-1].heading=Math.PI;return;}
  const sd=Math.sign(bb.min.x+bb.max.x);const d=mkDoor(veh,[sd>0?bb.max.x-.05:bb.min.x+.05,bb.max.z-.02],-sd*1.15,'S',sd,ms);d.z0=bb.min.z;d.z1=bb.max.z;side.push(d);});
 side.sort((a,b)=>b.z1-a.z1);side.forEach(d=>{const front=d.z1>0.3;const zc=(d.z0+d.z1)/2;addExit(veh,d,d.sd*1.6,zc,[d.sd*.42,.95,zc+(front?-.1:0)]);d.kind=front?'F':'R';});
 // ---- ДПС livery: white body is in the texture; overlay blue band + text over the original red stripe, split across door pivots
 const band=canvasTex(1024,64,(c,w,h)=>{c.fillStyle='#1747b0';c.fillRect(0,0,w,h);c.fillStyle='#fff';c.fillRect(0,h*.82,w,h*.08);c.font='bold 44px Arial';c.textBaseline='middle';c.fillText('ДПС',230,h*.42);c.fillText('ПОЛИЦИЯ',470,h*.42);});
 [1,-1].forEach(sd=>{const ds=side.filter(d=>d.sd===sd).sort((a,b)=>b.z1-a.z1);const f=ds[0],r=ds[1];if(!f||!r)return;
  sideBand(veh,sd,.945,1.12,1.52,-1.9,1.45,band,[[1.45,f.z1,null],[f.z1,f.z0,f.pv],[r.z1,r.z0,r.pv],[r.z0,-1.9,null]]);});
 // hood/rear text
 const ht=canvasTex(256,64,(c,w,h)=>{c.fillStyle='#1747b0';c.font='bold 48px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('ДПС',w/2,h/2);});
 const hp=new T.Mesh(new T.PlaneGeometry(.7,.18),new T.MeshBasicMaterial({map:ht,transparent:true}));hp.rotation.x=-Math.PI/2+.12;hp.position.set(0,1.32,1.75);veh.body.add(hp);
 // roof lightbar (blue/red flashers) + siren anchor
 const lb=new T.Group();lb.position.set(0,2.06,.35);veh.body.add(lb);lb.add(new T.Mesh(new T.BoxGeometry(1.2,.08,.28),new T.MeshLambertMaterial({color:0x222428})));
 const LB=new T.MeshBasicMaterial({color:0x1c3cff}),LR=new T.MeshBasicMaterial({color:0xff1a1a});const lbB=new T.Mesh(new T.BoxGeometry(.52,.12,.26),LB),lbR=new T.Mesh(new T.BoxGeometry(.52,.12,.26),LR);
 lbB.position.set(.3,.1,0);lbR.position.set(-.3,.1,0);lb.add(lbB,lbR);veh.flashers=[{m:LB,on:0x2050ff,off:0x0a1440},{m:LR,on:0xff2020,off:0x400a0a}];
 veh.sirenAnchor=new T.Object3D();veh.sirenAnchor.position.set(0,1.9,.6);veh.body.add(veh.sirenAnchor);// attach PositionalAudio here
 veh.lightbar=lb;}
function buildCut(veh,gl,DS,recolor){const ms=bakedMeshes(gl.scene);const doorMs=DS.map(()=>[]);
 ms.forEach(({geo,mat})=>{if(recolor)mat=recolor(mat)||mat;const r=splitDoors(geo,DS);if(r.body){const b=new T.Mesh(r.body,mat);b.castShadow=true;veh.body.add(b);}
  r.doors.forEach((g,i)=>{if(!g)return;const m=new T.Mesh(g,mat);m.castShadow=true;doorMs[i].push(m);const cap=new T.Mesh(g,capM);cap.position.x=-DS[i].sd*.05;veh.body.add(cap);});});
 return DS.map((d,i)=>{const pv=mkDoor(veh,d.hinge,d.open,d.kind,d.sd,[]);doorMs[i].forEach(m=>{m.position.set(-d.hinge[0],0,-d.hinge[1]);pv.pv.add(m);});return pv;});}
function buildPriora(veh,gl){// 4 doors cut out of the shell (z,y outlines measured on the normalised model)
 const FP=[[-.29,.32],[.98,.32],[.98,.95],[.45,1.40],[-.29,1.40]],RP=[[-1.12,.32],[-.29,.32],[-.29,1.40],[-.95,1.40],[-1.48,.95],[-1.48,.62]];
 const DS=[];[1,-1].forEach(sd=>{DS.push({sd,nx:.35,xmin:.55,poly:FP,hinge:[sd*.9,.97],open:-sd*1.1,kind:'F'});DS.push({sd,nx:.35,xmin:.55,poly:RP,hinge:[sd*.9,-.30],open:-sd*1.1,kind:'R'});});
 const ds=buildCut(veh,gl,DS,m=>{if(m.metalness>.5){m.metalness=.4;m.roughness=.45;}if(/^material$/.test(m.name)||m.name==='Material.010'){}return m;});
 const tint=new T.Color().setHSL(Math.random(),.35,.35);
 ds.forEach((d,i)=>{const zc=d.kind==='F'?.35:-.75;addExit(veh,d,d.sd*1.55,zc,veh.spec.seats[i]);});veh.tint=tint;}
function buildPAZ(veh,gl){// OMON/Rosgvardia: dark body, near-black tinted glass; passenger doorway on the right (-x) with 2 folding leaves
 const P1=[[.75,.42],[1.32,.42],[1.32,2.72],[.75,2.72]],P2=[[1.32,.42],[1.89,.42],[1.89,2.72],[1.32,2.72]];
 const DS=[{sd:-1,nx:.5,xmin:1.0,poly:P1,hinge:[-1.22,.77],open:1.35,kind:'P'},{sd:-1,nx:.5,xmin:1.0,poly:P2,hinge:[-1.22,1.87],open:-1.35,kind:'P'}];
 const C={maincolor:0x2a2f35,secondcolor:0x15181c,white:0x3a3f45,orange:0xd07010};
 const cache={};const ds=buildCut(veh,gl,DS,m=>{if(cache[m.name])return cache[m.name];let n=m.clone();
  if(C[m.name]!==undefined){n.color.setHex(C[m.name]);n.roughness=.55;n.metalness=.2;}
  if(m.name==='gray'){n=new T.MeshStandardMaterial({color:0x050607,roughness:.08,metalness:.9,name:'tint'});}// windows: near-black tint
  return cache[m.name]=n;});
 veh.exits.push({door:veh.doors.indexOf(ds[0]),door2:veh.doors.indexOf(ds[1]),pos:new T.Vector3(-1.95,0,1.32),heading:-Math.PI/2,seat:new T.Vector3(-.6,1.1,1.0)});
 [-.35,-1.35,-2.35].forEach((z,i)=>veh.exits.push({door:veh.doors.indexOf(ds[0]),door2:veh.doors.indexOf(ds[1]),pos:new T.Vector3(-1.95-.0,0,1.32-(i+1)*.75),heading:-Math.PI/2,seat:new T.Vector3(i%2?.6:-.6,1.1,z),queue:i+1}));
 const band=canvasTex(1024,64,(c,w,h)=>{c.fillStyle='#0d0f12';c.fillRect(0,0,w,h);c.fillStyle='#c9a227';c.fillRect(0,h*.06,w,h*.06);c.fillRect(0,h*.88,w,h*.06);c.fillStyle='#e8e8e8';c.font='bold 40px Arial';c.textBaseline='middle';c.fillText('РОСГВАРДИЯ',140,h*.5);c.fillText('ОМОН',640,h*.5);});
 sideBand(veh,1,1.475,1.05,1.32,-3.4,3.3,band,[[3.3,-3.4,null]]);sideBand(veh,-1,1.475,1.05,1.32,-3.4,3.3,band,[[3.3,1.92,null],[.72,-3.4,null]]);}
const loader=()=>{const l=new T.GLTFLoader();if(window.MeshoptDecoder)l.setMeshoptDecoder(MeshoptDecoder);return l;};
const cache={};
function load(kind){const spec=SPECS[kind];return (cache[kind]=cache[kind]||new Promise((res,rej)=>loader().load(spec.url,res,undefined,rej))).then(src=>{
 const gl={scene:src.scene.clone(true)};gl.scene.traverse(o=>{if(o.isMesh){o.material=o.material.clone();}});
 const root=new T.Group(),body=new T.Group();root.add(body);const veh={kind,spec,role:spec.role,root,body,doors:[],exits:[],flashers:null,t:0};
 ({uaz:buildUAZ,paz:buildPAZ,priora:buildPriora})[kind](veh,gl);
 veh.setDoors=(open,filter)=>veh.doors.forEach(d=>{if(!filter||filter===d.kind||filter===veh.doors.indexOf(d))d.tg=open?1:0;});
 veh.doorsSettled=()=>veh.doors.every(d=>Math.abs(d.a-d.tg)<.02);
 veh.snapDoors=()=>veh.doors.forEach(d=>{d.a=d.tg;d.pv.rotation.y=d.a*d.open;});
 veh.exitWorld=(i,v)=>veh.root.localToWorld((v||new T.Vector3()).copy(veh.exits[i].pos));
 veh.update=(dt,siren)=>{veh.t+=dt;veh.doors.forEach(d=>{d.a+=(d.tg-d.a)*Math.min(1,dt*5);d.pv.rotation.y=d.a*d.open;});
  if(veh.flashers){const ph=Math.floor(veh.t*6)%4;veh.flashers.forEach((f,i)=>f.m.color.setHex(siren&&((ph<2)===(i===0))&&(ph%2===0||true)?f.on:f.off));}};
 return veh;});}
window.VNPC={SPECS,load};
})();
