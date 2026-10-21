(function(){
'use strict';
const C=window.CITY,Q=location.search,demo=Q.includes('demo'),topv=Q.includes('top'),mobile='ontouchstart' in window;
const R=new THREE.WebGLRenderer({antialias:!mobile,preserveDrawingBuffer:true});
R.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:2));R.setSize(innerWidth,innerHeight);document.body.prepend(R.domElement);
R.shadowMap.enabled=!mobile;R.shadowMap.type=THREE.PCFSoftShadowMap;
const S=new THREE.Scene();
let rnd=(()=>{let s=12345;return()=>(s=(s*16807)%2147483647)/2147483647;})();
function cv(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);return c;}
function tex(c,rx,ry){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.anisotropy=4;return t;}
function noise(g,w,h,a,n){for(let i=0;i<n;i++){g.fillStyle=`rgba(${rnd()<.5?'0,0,0':'255,255,255'},${a*rnd()})`;g.fillRect(rnd()*w,rnd()*h,2,2);}}
// sky
S.background=tex(cv(2,256,(g)=>{const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#3d7cc9');gr.addColorStop(.6,'#a9cdeb');gr.addColorStop(1,'#dde8ee');g.fillStyle=gr;g.fillRect(0,0,2,256);}));
S.fog=new THREE.Fog(0xc9dbe6,120,650);
S.add(new THREE.HemisphereLight(0xdfefff,0x6a7a55,0.75));
const sun=new THREE.DirectionalLight(0xfff2dd,0.85);sun.position.set(80,150,60);S.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-120,right:120,top:120,bottom:-120,near:1,far:500});sun.shadow.bias=-0.0005;
// ground
const grass=tex(cv(256,256,(g,w,h)=>{g.fillStyle='#6b8f4e';g.fillRect(0,0,w,h);for(let i=0;i<4000;i++){g.fillStyle=`hsl(${80+rnd()*30},${30+rnd()*25}%,${25+rnd()*20}%)`;g.fillRect(rnd()*w,rnd()*h,2,3);}}),400,400);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshLambertMaterial({map:grass}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;S.add(ground);
function flat(polys,mat,y){polys.forEach(p=>{if(p.length<3)return;const g=new THREE.ShapeGeometry(new THREE.Shape(p.map(q=>new THREE.Vector2(q[0],-q[1]))));g.rotateX(-Math.PI/2);const o=new THREE.Mesh(g,mat);o.position.y=y;o.receiveShadow=true;S.add(o);});}
(window.SAT||[]).forEach(t=>{const tx=new THREE.TextureLoader().load(t.f);tx.anisotropy=8;const m=new THREE.Mesh(new THREE.PlaneGeometry(t.x1-t.x0,t.z1-t.z0),new THREE.MeshLambertMaterial({map:tx}));m.rotation.x=-Math.PI/2;m.position.set((t.x0+t.x1)/2,0.015,(t.z0+t.z1)/2);m.receiveShadow=true;S.add(m);});
// ---------- roads ----------
const asph=(lines)=>cv(128,256,(g,w,h)=>{g.fillStyle='#4a4a4d';g.fillRect(0,0,w,h);noise(g,w,h,.25,3000);if(lines){g.fillStyle='#e8e8e0';g.fillRect(4,0,4,h);g.fillRect(w-8,0,4,h);g.fillRect(w/2-3,0,6,h*.5);}});
const roadMajor=new THREE.MeshLambertMaterial({map:tex(asph(true)),transparent:true,opacity:.6,depthWrite:false}),roadMinor=new THREE.MeshLambertMaterial({map:tex(asph(false)),transparent:true,opacity:.35,depthWrite:false});
const walkM=new THREE.MeshLambertMaterial({map:tex(cv(128,128,(g,w,h)=>{g.fillStyle='#a3a29c';g.fillRect(0,0,w,h);noise(g,w,h,.2,1500);g.strokeStyle='#8a8983';for(let i=0;i<=w;i+=32){g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke();}}))});
function ribbon(list,mat,y,wf,caps){const P=[],U=[];list.forEach(r=>{const h=wf(r)/2;if(h<=0)return;let d=0;for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1,nx=-dz/L*h,nz=dx/L*h,v0=d/8,v1=(d+L)/8;d+=L;
P.push(a[0]+nx,y,a[1]+nz,b[0]+nx,y,b[1]+nz,b[0]-nx,y,b[1]-nz,a[0]+nx,y,a[1]+nz,b[0]-nx,y,b[1]-nz,a[0]-nx,y,a[1]-nz);U.push(0,v0,0,v1,1,v1,0,v0,1,v1,1,v0);}
if(caps)r.p.forEach(q=>{for(let k=0;k<10;k++){const a1=k/10*6.283,a2=(k+1)/10*6.283;P.push(q[0],y-.004,q[1],q[0]+Math.cos(a2)*h,y-.004,q[1]+Math.sin(a2)*h,q[0]+Math.cos(a1)*h,y-.004,q[1]+Math.sin(a1)*h);U.push(.5,0,.5,0,.5,0);}});});
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.computeVertexNormals();
const m=new THREE.Mesh(g,mat);m.material.side=THREE.DoubleSide;m.receiveShadow=true;S.add(m);}
const drive=C.r.filter(r=>r.w>=4),major=C.r.filter(r=>r.w>=6),minor=C.r.filter(r=>r.w<6);
ribbon(major,roadMajor,0.07,r=>r.w,true);ribbon(minor,roadMinor,0.06,r=>r.w,true);
// ---------- buildings ----------
function facade(base,brick,balc){return cv(512,384,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);
 if(brick){for(let y=0;y<h;y+=8)for(let x=(y/8%2)*8;x<w;x+=16){g.fillStyle=`hsl(${8+rnd()*10},${45+rnd()*15}%,${35+rnd()*12}%)`;g.fillRect(x,y,15,7);}}else{noise(g,w,h,.12,4000);g.strokeStyle='rgba(0,0,0,.12)';for(let x=0;x<=w;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(let y=0;y<=h;y+=128){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}}
 for(let fy=0;fy<3;fy++)for(let fx=0;fx<4;fx++){const x=fx*128+30,y=fy*128+30;const gr=g.createLinearGradient(0,y,0,y+62);const lit=rnd()<.15;gr.addColorStop(0,lit?'#f3d9a0':'#9fb6c8');gr.addColorStop(1,lit?'#c9a060':'#2c3c4c');
  g.fillStyle='#eee';g.fillRect(x-4,y-4,76,70);g.fillStyle=gr;g.fillRect(x,y,68,62);g.fillStyle='#ddd';g.fillRect(x+32,y,4,62);g.fillRect(x,y+20,68,3);
  if(balc&&fx%2==0){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x-14,y+66,96,6);g.fillStyle=['#d8d4cc','#b9c4c8','#cfb9a0'][(fx+fy)%3];g.fillRect(x-14,y+72,96,30);g.strokeStyle='rgba(0,0,0,.2)';g.strokeRect(x-14,y+72,96,30);}}
});}
const facades=[facade('#e9e6df',0,1),facade('#efe2b8',0,1),facade('#c9dbe2',0,0),facade('#d9c9e0',0,1),facade('#b5563c',1,0),facade('#f2f0ea',0,0)].map(c=>new THREE.MeshLambertMaterial({map:tex(c)}));
const greyM=new THREE.MeshLambertMaterial({map:tex(cv(128,128,(g,w,h)=>{g.fillStyle='#9a968e';g.fillRect(0,0,w,h);noise(g,w,h,.2,1500);g.fillStyle='#6d6a64';for(let x=8;x<w;x+=42)g.fillRect(x,40,34,88);}))});
const plinth=new THREE.MeshLambertMaterial({map:tex(cv(512,128,(g,w,h)=>{g.fillStyle='#8c857b';g.fillRect(0,0,w,h);noise(g,w,h,.2,2000);
 for(let i=0;i<4;i++){const x=i*128;if(i==1){g.fillStyle='#5b4632';g.fillRect(x+40,40,48,88);g.fillStyle='#3a2a1c';g.fillRect(x+62,40,4,88);g.fillStyle='#ccc';g.fillRect(x+30,30,68,8);g.fillStyle='#2a5a9a';g.fillRect(x+52,14,24,12);}else{g.fillStyle='#e0e0e0';g.fillRect(x+34,46,60,44);g.fillStyle='#3c4c5a';g.fillRect(x+38,50,52,36);}}}))});
const shopM=new THREE.MeshLambertMaterial({map:tex(cv(512,128,(g,w,h)=>{g.fillStyle='#d8d6d0';g.fillRect(0,0,w,h);const cols=['#c0392b','#2a7ab0','#27ae60','#e67e22'];
 for(let i=0;i<2;i++){const x=i*256;g.fillStyle=cols[i*2];g.fillRect(x+10,6,236,26);g.fillStyle='#fff';g.font='bold 20px sans-serif';g.fillText(['ПРОДУКТЫ','АПТЕКА'][i],x+70,27);
 const gr=g.createLinearGradient(0,40,0,128);gr.addColorStop(0,'#a8c4d8');gr.addColorStop(1,'#203040');g.fillStyle=gr;g.fillRect(x+14,40,228,88);g.fillStyle='#555';g.fillRect(x+120,40,5,88);g.fillStyle='#f5e6b0';g.fillRect(x+30,95,60,25);}}))});
const roofM=new THREE.MeshLambertMaterial({map:tex(cv(64,64,(g,w,h)=>{g.fillStyle='#6d6a66';g.fillRect(0,0,w,h);noise(g,w,h,.3,600);}),0.1,0.1)});
const roofM2=new THREE.MeshLambertMaterial({color:0x7a4a3a});
const buf={};function bf(m){return buf[m.uuid]||(buf[m.uuid]={m,P:[],U:[]});}
function wall(b,p,y0,y1,vs,us){const B=bf(b);let u=0;for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]),u1=u+L;
 B.P.push(a[0],y0,a[1],c[0],y0,c[1],c[0],y1,c[1],a[0],y0,a[1],c[0],y1,c[1],a[0],y1,a[1]);const v0=y0/vs,v1=y1/vs,U0=u/us,U1=u1/us;B.U.push(U0,v0,U1,v0,U1,v1,U0,v0,U1,v1,U0,v1);u=u1;}}
const Gd={},CS=20;
C.b.forEach((b,i)=>{let p=b.p.slice();let A=0;for(let k=0;k<p.length;k++){const a=p[k],c=p[(k+1)%p.length];A+=a[0]*c[1]-c[0]*a[1];}if(A>0)p.reverse();
 const h=Math.max(2.5,b.h),k=b.k,fm=k=='garages'||k=='service'||k=='construction'?greyM:k=='kindergarten'||k=='school'?facades[1]:(k=='apartments'||k=='residential')&&h>=24?facades[i%2?0:5]:(k=='apartments'||k=='residential')?facades[[0,5,4,2][i%4]]:facades[[4,1,3,0][i%4]];
 if(h>4&&fm!==greyM){wall(b.s?shopM:plinth,p,0,3,3,12);wall(fm,p,3,h,9,12);}else wall(b.s?shopM:fm,p,0,h,b.s?3:fm===greyM?3:9,b.s?12:fm===greyM?3:12);
 const g=new THREE.ShapeGeometry(new THREE.Shape(b.p.map(q=>new THREE.Vector2(q[0],-q[1])))).toNonIndexed();g.rotateX(-Math.PI/2);const pa=g.attributes.position.array,B=bf(h<8&&i%3==0?roofM2:roofM);
 for(let k=0;k<pa.length;k+=3){B.P.push(pa[k],h,pa[k+2]);B.U.push(pa[k],pa[k+2]);}
 let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;b.p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);});
 for(let gx=Math.floor(x0/CS);gx<=Math.floor(x1/CS);gx++)for(let gz=Math.floor(z0/CS);gz<=Math.floor(z1/CS);gz++)(Gd[gx+','+gz]=Gd[gx+','+gz]||[]).push(b.p);});
Object.values(buf).forEach(B=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(B.P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(B.U,2));g.computeVertexNormals();const m=new THREE.Mesh(g,B.m);m.castShadow=m.receiveShadow=true;S.add(m);});
function inPoly(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
function hit(x,z){const l=Gd[Math.floor(x/CS)+','+Math.floor(z/CS)];return l&&l.some(p=>inPoly(x,z,p));}
// ---------- trees & lamps (instanced) ----------
const trees=[],lamps=[],rs=[];
C.t.forEach(t=>trees.push(t));
major.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1)continue;const nx=-dz/L,nz=dx/L,o=r.w/2+4.5;
 for(let s=6;s<L-4;s+=14){const x=a[0]+dx/L*s,z=a[1]+dz/L*s;[1,-1].forEach(sd=>{if(rnd()<.75){const tx=x+nx*sd*(o+rnd()*2),tz=z+nz*sd*(o+rnd()*2);if(!hit(tx,tz))trees.push([tx,tz]);}});}
 for(let s=10;s<L-5;s+=32){const x=a[0]+dx/L*s+nx*(r.w/2+1.2),z=a[1]+dz/L*s+nz*(r.w/2+1.2);if(!hit(x,z))lamps.push([x,z,Math.atan2(-nx,-nz)]);}}});
C.g.forEach(p=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);});
 const n=Math.min(300,(x1-x0)*(z1-z0)/120);for(let i=0;i<n;i++){const x=x0+rnd()*(x1-x0),z=z0+rnd()*(z1-z0);if(inPoly(x,z,p)&&!hit(x,z))trees.push([x,z]);}});
const tc=[];trees.forEach(t=>tc.push([t[0],t[1]]));
const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.15,.22,3,6).translate(0,1.5,0),new THREE.MeshLambertMaterial({color:0x5a4030}),trees.length);
const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.2,1).translate(0,4.3,0),new THREE.MeshLambertMaterial({color:0xffffff}),trees.length);
const M=new THREE.Matrix4(),col=new THREE.Color();
trees.forEach((t,i)=>{const s=.8+rnd()*.6;M.makeScale(s,s*(.9+rnd()*.4),s).setPosition(t[0],0,t[1]);trunk.setMatrixAt(i,M);crown.setMatrixAt(i,M);crown.setColorAt(i,col.setHSL(.24+rnd()*.08,.45+rnd()*.2,.22+rnd()*.12));});
trunk.castShadow=crown.castShadow=true;S.add(trunk,crown);
const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.07,.1,7,6).translate(0,3.5,0),new THREE.MeshLambertMaterial({color:0x55585c}),lamps.length);
const head=new THREE.InstancedMesh(new THREE.BoxGeometry(.3,.15,1.6).translate(0,7,.7),new THREE.MeshBasicMaterial({color:0xfff6d8}),lamps.length);
lamps.forEach((l,i)=>{M.makeRotationY(l[2]).setPosition(l[0],0,l[1]);pole.setMatrixAt(i,M);head.setMatrixAt(i,M);});pole.castShadow=true;S.add(pole,head);
// ---------- AI traffic & pedestrians ----------
function path(r){const c=[0];for(let i=1;i<r.p.length;i++)c.push(c[i-1]+Math.hypot(r.p[i][0]-r.p[i-1][0],r.p[i][1]-r.p[i-1][1]));return c;}
function at(r,c,s,off){s=Math.max(0,Math.min(c[c.length-1]-.01,s));let i=0;while(c[i+1]<s)i++;const a=r.p[i],b=r.p[i+1],L=c[i+1]-c[i]||1,dx=(b[0]-a[0])/L,dz=(b[1]-a[1])/L,f=s-c[i];return[a[0]+dx*f-dz*off,a[1]+dz*f+dx*off,Math.atan2(dx,dz)];}
const longR=major.map(r=>({r,c:path(r)})).filter(o=>o.c[o.c.length-1]>120);
const carCols=[0xf0f0f0,0x222222,0x9a9a9a,0x1f3f7a,0x7a1f1f,0xd8c9a0,0x2e5e3a];
const AI=[];for(let i=0;i<14&&longR.length;i++){const o=longR[Math.floor(rnd()*longR.length)],g=new THREE.Group();const m=new THREE.MeshLambertMaterial({color:carCols[i%carCols.length]});
 const b=new THREE.Mesh(new THREE.BoxGeometry(1.8,.7,4.2),m);b.position.y=.65;const c=new THREE.Mesh(new THREE.BoxGeometry(1.6,.55,2.2),new THREE.MeshLambertMaterial({color:0x1c2630}));c.position.set(0,1.25,-.2);g.add(b,c);
 [[-.8,1.3],[.8,1.3],[-.8,-1.3],[.8,-1.3]].forEach(w=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.25,10),new THREE.MeshLambertMaterial({color:0x111111}));t.rotation.z=Math.PI/2;t.position.set(w[0],.33,w[1]);g.add(t);});
 b.castShadow=true;S.add(g);AI.push({g,o,s:rnd()*o.c[o.c.length-1],d:rnd()<.5?1:-1,v:8+rnd()*5});}
const PN=40,ped=[];const pb=new THREE.InstancedMesh(new THREE.CylinderGeometry(.2,.17,1.1,6).translate(0,.95,0),new THREE.MeshLambertMaterial({color:0xffffff}),PN);
const ph=new THREE.InstancedMesh(new THREE.SphereGeometry(.13,8,6).translate(0,1.68,0),new THREE.MeshLambertMaterial({color:0xe0b090}),PN);
const pl=new THREE.InstancedMesh(new THREE.BoxGeometry(.3,.45,.18).translate(0,.22,0),new THREE.MeshLambertMaterial({color:0x2a2e3a}),PN);
for(let i=0;i<PN&&longR.length;i++){const o=longR[Math.floor(rnd()*longR.length)];ped.push({o,s:rnd()*o.c[o.c.length-1],d:rnd()<.5?1:-1,v:1+rnd()*.6,side:(rnd()<.5?1:-1)*(o.r.w/2+2.3)});pb.setColorAt(i,col.setHSL(rnd(),.5,.35+rnd()*.3));}
S.add(pb,ph,pl);
// ---------- player car + BMW-style cockpit ----------
const car=new THREE.Group();S.add(car);const cab=new THREE.Group();cab.rotation.y=Math.PI;car.add(cab);
const leather=tex(cv(256,256,(g,w,h)=>{g.fillStyle='#1d1a19';g.fillRect(0,0,w,h);noise(g,w,h,.06,5000);}),2,2);
const mDash=new THREE.MeshStandardMaterial({map:leather,roughness:.85,metalness:0}),mDash2=new THREE.MeshStandardMaterial({color:0x2a2522,roughness:.7});
const mStitch=new THREE.MeshStandardMaterial({color:0x8a6a4a,roughness:.6}),mAlu=new THREE.MeshStandardMaterial({color:0xb8bcc0,roughness:.3,metalness:.9}),mBlack=new THREE.MeshStandardMaterial({color:0x0b0b0c,roughness:.25,metalness:.3});
const mLiner=new THREE.MeshStandardMaterial({color:0x8d877f,roughness:1}),mBody=new THREE.MeshStandardMaterial({color:0x1d2a44,roughness:.35,metalness:.6}),mWood=new THREE.MeshStandardMaterial({color:0x3b2a20,roughness:.4});
function box(w,h,d,m,x,y,z,rx,ry,rz){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.set(rx||0,ry||0,rz||0);cab.add(o);return o;}
function beam(a,b,r,m){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),L=A.distanceTo(B);const o=new THREE.Mesh(new THREE.BoxGeometry(r,r*.7,L),m);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),B.clone().sub(A).normalize());cab.add(o);return o;}
// hood (visible ahead)
box(1.9,.08,1.6,mBody,0,.9,-1.85,-.08);
// dashboard: lower slab, upper padded top, trim strip
box(1.75,.32,.55,mDash,0,.74,-.85);box(1.75,.06,.48,mDash2,0,.9,-.95,-.12);box(1.72,.035,.02,mWood,0,.84,-.575);box(1.72,.006,.006,mAlu,0,.862,-.566);

[-.62,-.08,.08,.62].forEach(x=>{box(.16,.05,.02,mBlack,x,.8,-.572);box(.17,.006,.025,mAlu,x,.828,-.57);});
box(.08,.4,.08,mDash,0,.6,-.6);// center stack
// digital curved display (cluster + center screen)
const dispC=document.createElement('canvas');dispC.width=1024;dispC.height=256;const dg=dispC.getContext('2d');const dispT=new THREE.CanvasTexture(dispC);
const dgeo=new THREE.PlaneGeometry(.82,.2,24,1);{const p=dgeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,-Math.pow(x/.41,2)*-.05);}p.needsUpdate=true;}
const disp=new THREE.Mesh(dgeo,new THREE.MeshBasicMaterial({map:dispT}));disp.position.set(-.12,1.04,-.74);disp.rotation.set(-.18,0,0);cab.add(disp);
box(.84,.215,.012,mBlack,-.12,1.039,-.747,-.18);
// steering wheel
const sw=new THREE.Group();sw.position.set(-.37,.93,-.44);sw.rotation.x=-.32;cab.add(sw);const swr=new THREE.Group();sw.add(swr);
const rim=new THREE.Mesh(new THREE.TorusGeometry(.185,.024,10,40),mDash);swr.add(rim);
const hub=new THREE.Mesh(new THREE.CylinderGeometry(.065,.075,.05,20),mDash2);hub.rotation.x=Math.PI/2;swr.add(hub);
const ring=new THREE.Mesh(new THREE.TorusGeometry(.03,.006,6,20),mAlu);ring.position.z=.028;swr.add(ring);
[[0,-.11,0,.03,.11],[-.11,-.015,0,.12,.035],[.11,-.015,0,.12,.035]].forEach(s=>{const o=new THREE.Mesh(new THREE.BoxGeometry(s[3],s[4],.025),mDash2);o.position.set(s[0],s[1],0);swr.add(o);const t=new THREE.Mesh(new THREE.BoxGeometry(s[3]*.9,.004,.026),mAlu);t.position.set(s[0],s[1]+s[4]/2,0);if(s[0])swr.add(t);});
box(.07,.07,.25,mDash2,-.37,.86,-.6,-.3);// column
// A-pillars, roof liner, doors, windshield frame
beam([-.82,.92,-1.05],[-.7,1.47,-.33],.07,mLiner);beam([.82,.92,-1.05],[.7,1.47,-.33],.07,mLiner);
box(1.6,.07,.9,mLiner,0,1.5,.12);box(1.5,.04,.05,mLiner,0,1.465,-.32);
box(.06,.55,1.5,mDash,-.86,.68,-.15);box(.06,.55,1.5,mDash,.86,.68,-.15);box(.08,.025,1.4,mDash2,-.83,.96,-.1);box(.08,.025,1.4,mDash2,.83,.96,-.1);
box(.05,.5,.06,mLiner,-.84,1.2,.55);box(.05,.5,.06,mLiner,.84,1.2,.55);// B pillars
// mirrors
box(.2,.055,.025,mBlack,0,1.42,-.47);box(.18,.045,.005,new THREE.MeshStandardMaterial({color:0x99a8b8,metalness:1,roughness:.05}),0,1.42,-.456);box(.02,.05,.02,mBlack,0,1.46,-.47);
[-1,1].forEach(s=>{box(.24,.15,.12,mBody,s*1.02,1.0,-.72,0,s*.25);box(.2,.11,.01,new THREE.MeshStandardMaterial({color:0xb8c8d8,metalness:.6,roughness:.15}),s*1.0,1.0,-.655,0,s*.25);box(.12,.05,.06,mBody,s*.92,.97,-.74);});
// center console + gear selector + iDrive
box(.24,.3,1.0,mDash,0,.5,-.1);box(.25,.02,1.0,mWood,0,.66,-.1);
const knob=new THREE.Mesh(new THREE.BoxGeometry(.05,.07,.09),new THREE.MeshStandardMaterial({color:0xd8f0ff,roughness:.05,metalness:.1,transparent:true,opacity:.85}));knob.position.set(0,.71,-.18);cab.add(knob);box(.08,.01,.12,mAlu,0,.672,-.18);
const idr=new THREE.Mesh(new THREE.CylinderGeometry(.03,.032,.025,24),mAlu);idr.position.set(0,.68,-.02);cab.add(idr);
// seats hint
box(.5,.12,.5,mDash2,-.37,.42,.15);box(.5,.12,.5,mDash2,.37,.42,.15);
cab.traverse(o=>{if(o.isMesh)o.castShadow=false;});
const cabLight=new THREE.PointLight(0xffffff,.35,2.5);cabLight.position.set(0,1.3,-.2);cab.add(cabLight);
const cam=new THREE.PerspectiveCamera(innerWidth<innerHeight?95:68,innerWidth/innerHeight,.05,1500);cam.position.set(-.37,1.2,.05);cam.rotation.x=-.07;cab.add(cam);
const topCam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,1,3000);
// minimap for center screen
const MS=0.55,mapC=cv(1800,1800,(g,w,h)=>{g.fillStyle='#16202a';g.fillRect(0,0,w,h);g.lineCap='round';
 C.g.forEach(p=>{g.fillStyle='#1f3a28';g.beginPath();p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.fill();});
 C.b.forEach(b=>{g.fillStyle='#34404c';g.beginPath();b.p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.fill();});
 C.r.forEach(r=>{if(r.w<4)return;g.strokeStyle=r.w>=8?'#e8b060':'#9aa8b4';g.lineWidth=Math.max(2,r.w*MS);g.beginPath();r.p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.stroke();});});
function drawDisp(v,steer){const g=dg,kmh=Math.abs(v)*3.6,gear=v<-.1?'R':Math.abs(v)<.2?'P':'D'+Math.min(8,1+Math.floor(Math.abs(v)/7)),
 rpm=Math.abs(v)<.2?800:900+((Math.abs(v)%7)/7)*4200+(Math.abs(v)>7?1200:0);
 g.fillStyle='#05070a';g.fillRect(0,0,1024,256);
 // cluster
 let gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#0d1622');gr.addColorStop(1,'#03050a');g.fillStyle=gr;g.fillRect(0,0,500,256);
 function arc(cx,val,max,color,label){g.lineWidth=10;g.strokeStyle='#1c2836';g.beginPath();g.arc(cx,150,95,Math.PI*.8,Math.PI*2.2);g.stroke();g.strokeStyle=color;g.beginPath();g.arc(cx,150,95,Math.PI*.8,Math.PI*(.8+1.4*Math.min(1,val/max)));g.stroke();
  g.fillStyle='#8fa4b8';g.font='16px sans-serif';g.textAlign='center';g.fillText(label,cx,232);}
 arc(110,kmh,240,'#4fb4ff','км/ч');arc(390,rpm,7000,rpm>5500?'#ff5040':'#ff9a30','×1000 об/мин');
 g.textAlign='center';g.fillStyle='#fff';g.font='bold 64px sans-serif';g.fillText(Math.round(kmh),110,170);g.font='bold 40px sans-serif';g.fillText((rpm/1000).toFixed(1),390,165);
 g.fillStyle='#4fb4ff';g.font='bold 34px sans-serif';g.fillText(gear,250,120);g.fillStyle='#8fa4b8';g.font='15px sans-serif';g.fillText('ЛЫТКАРИНО  '+new Date().toTimeString().slice(0,5),250,40);g.fillText('ECO PRO',250,200);
 g.fillStyle='#000';g.fillRect(500,0,12,256);
 // center screen: nav map
 g.save();g.beginPath();g.rect(512,0,512,256);g.clip();g.translate(768,170);g.rotate(Math.PI+st.h);g.scale(1.6,1.6);g.drawImage(mapC,-mapC.width/2-st.x*MS,-mapC.height/2-st.z*MS);g.restore();
 g.fillStyle='#4fb4ff';g.beginPath();g.moveTo(768,155);g.lineTo(756,182);g.lineTo(768,176);g.lineTo(780,182);g.fill();
 g.fillStyle='rgba(5,10,16,.8)';g.fillRect(512,0,512,36);g.fillStyle='#fff';g.font='18px sans-serif';g.textAlign='left';g.fillText('Навигация   '+Math.round(kmh)+' км/ч',528,25);g.textAlign='right';g.fillText('22°C   ♪ Радио Лыткарино',1010,25);
 dispT.needsUpdate=true;}
// ---------- spawn ----------
let best=null,bl=1e9;major.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),D=Math.hypot(a[0],a[1]);if(L>60&&D<bl){bl=D;best=[a,b];}}});
const h0=Math.atan2(best[1][0]-best[0][0],best[1][1]-best[0][1]),off=1.6;
const st={x:best[0][0]+Math.sin(h0)*8-Math.cos(h0)*off,z:best[0][1]+Math.cos(h0)*8+Math.sin(h0)*off,h:h0,v:0,steer:0};const start=Object.assign({},st);
// ---------- input ----------
const K={};addEventListener('keydown',e=>{K[e.code]=1;if(e.code=='KeyR')Object.assign(st,start);});addEventListener('keyup',e=>K[e.code]=0);
const T={steer:0,gas:0,brk:0};
if(mobile){document.querySelectorAll('.t').forEach(e=>e.style.display='flex');const joy=document.getElementById('joy'),kn=document.getElementById('knob');
 joy.addEventListener('touchmove',e=>{e.preventDefault();const r=joy.getBoundingClientRect(),t=e.targetTouches[0];const dx=Math.max(-1,Math.min(1,(t.clientX-r.left-r.width/2)/(r.width/2.5)));T.steer=dx;kn.style.left=(r.width/2-25)+dx*r.width/3+'px';},{passive:false});
 joy.addEventListener('touchend',()=>{T.steer=0;kn.style.left='';});
 [['gas','gas'],['brk','brk']].forEach(([id,k])=>{const el=document.getElementById(id);el.addEventListener('touchstart',e=>{e.preventDefault();T[k]=1;},{passive:false});el.addEventListener('touchend',()=>T[k]=0);});}
function step(dt){
 let up=K.KeyW||K.ArrowUp||T.gas,dn=K.KeyS||K.ArrowDown||T.brk,steer=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0)-T.steer;
 if(demo){up=st.v<12;dn=0;steer=0;}
 st.steer+=(steer-st.steer)*Math.min(1,dt*6);
 if(up)st.v+=(st.v<0?30:9)*dt;if(dn)st.v-=(st.v>0?25:6)*dt;if(!up&&!dn)st.v*=Math.pow(0.7,dt);
 st.v=Math.max(-8,Math.min(50,st.v));
 st.h+=st.steer*dt*st.v*0.07/(1+Math.abs(st.v)*0.025);
 const nx=st.x+Math.sin(st.h)*st.v*dt,nz=st.z+Math.cos(st.h)*st.v*dt,s=Math.sin(st.h),c=Math.cos(st.h);
 let bump=[[0.9,2.3],[-0.9,2.3],[0.9,-2.3],[-0.9,-2.3]].some(([a,b])=>hit(nx+a*c+b*s,nz-a*s+b*c));
 AI.forEach(a=>{if(Math.hypot(a.g.position.x-nx,a.g.position.z-nz)<3.2)bump=true;});
 if(bump)st.v*=-0.3;else{st.x=nx;st.z=nz;}}
function updAI(dt){AI.forEach(a=>{const L=a.o.c[a.o.c.length-1];let ahead=Math.hypot(a.g.position.x-st.x,a.g.position.z-st.z)<7;a.s+=a.d*a.v*dt*(ahead?0:1);if(a.s>L-2||a.s<2){a.d*=-1;a.s=Math.max(2,Math.min(L-2,a.s));}
 const p=at(a.o.r,a.o.c,a.s,a.d*a.o.r.w/4);a.g.position.set(p[0],0,p[1]);a.g.rotation.y=p[2]+(a.d<0?Math.PI:0);});
 ped.forEach((p,i)=>{const L=p.o.c[p.o.c.length-1];p.s+=p.d*p.v*dt;if(p.s>L-1||p.s<1)p.d*=-1;const q=at(p.o.r,p.o.c,p.s,p.side),t=performance.now()/300+i;
  M.makeRotationY(q[2]+(p.d<0?Math.PI:0)).setPosition(q[0],Math.abs(Math.sin(t))*.05,q[1]);pb.setMatrixAt(i,M);ph.setMatrixAt(i,M);pl.setMatrixAt(i,M);});
 pb.instanceMatrix.needsUpdate=ph.instanceMatrix.needsUpdate=pl.instanceMatrix.needsUpdate=true;}
let last=performance.now(),fr=0;
function frame(t){const dt=Math.min(0.05,(t-last)/1000)||0.016;last=t;step(dt);updAI(dt);
 car.position.set(st.x,0,st.z);car.rotation.y=st.h;swr.rotation.z=st.steer*2.2+(demo?0.35:0);
 sun.position.set(st.x+80,150,st.z+60);sun.target.position.set(st.x,0,st.z);
 if(fr++%3==0)drawDisp(st.v,st.steer);
 if(topv){topCam.position.set(st.x-200,300,st.z+250);topCam.lookAt(st.x,0,st.z);R.render(S,topCam);}else R.render(S,cam);
 requestAnimationFrame(frame);}
addEventListener('resize',()=>{cam.fov=innerWidth<innerHeight?95:68;[cam,topCam].forEach(c=>{c.aspect=innerWidth/innerHeight;c.updateProjectionMatrix();});R.setSize(innerWidth,innerHeight);});
requestAnimationFrame(frame);
})();
