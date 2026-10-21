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
function facade(o){return cv(512,384,(g,w,h)=>{const fl=128;g.fillStyle=o.base;g.fillRect(0,0,w,h);
 if(o.brick){for(let y=0;y<h;y+=8)for(let x=(y/8%2)*8;x<w;x+=16){const l=o.brick[2]+(rnd()-.5)*8;g.fillStyle=`hsl(${o.brick[0]+rnd()*6},${o.brick[1]}%,${l}%)`;g.fillRect(x,y,15,7);}}
 else{noise(g,w,h,.08,4000);if(o.panel){g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=2;for(let x=0;x<=w;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(let y=0;y<=h;y+=128){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}}}
 if(o.cornice){g.fillStyle=o.trim;g.fillRect(0,0,w,6);}
 for(let fy=0;fy<3;fy++)for(let fx=0;fx<4;fx++){const ww=o.tall?52:68,wh=o.tall?76:60,x=fx*128+(128-ww)/2,y=fy*128+(o.tall?22:30);const lit=rnd()<.12;
  const gr=g.createLinearGradient(0,y,0,y+wh);gr.addColorStop(0,lit?'#f3d9a0':'#a8bccb');gr.addColorStop(1,lit?'#c9a060':'#2c3a48');
  if(o.trim){g.fillStyle=o.trim;g.fillRect(x-6,y-6,ww+12,wh+12);if(o.tall){g.fillRect(x-10,y-14,ww+20,8);}}
  g.fillStyle='#f4f4f0';g.fillRect(x-2,y-2,ww+4,wh+4);g.fillStyle=gr;g.fillRect(x,y,ww,wh);g.fillStyle='#eee';g.fillRect(x+ww/2-2,y,4,wh);g.fillRect(x,y+wh*.3,ww,3);
  if(o.balc&&((fx+(o.balcAll?1:0))%2==0||o.balcAll)){g.fillStyle='rgba(0,0,0,.3)';g.fillRect(x-14,y+wh+4,ww+28,5);g.fillStyle=o.balc[(fx+fy)%o.balc.length];g.fillRect(x-14,y+wh+9,ww+28,34);g.strokeStyle='rgba(0,0,0,.25)';g.strokeRect(x-14,y+wh+9,ww+28,34);}}
});}
const F={
 stalinCream:facade({base:'#e6d3a3',trim:'#f3ecdc',tall:1,cornice:1}),
 stalinPeach:facade({base:'#e3b994',trim:'#f2e6d6',tall:1,cornice:1}),
 stalinYellow:facade({base:'#e9cf7a',trim:'#f5f0e2',tall:1,cornice:1}),
 stalinPink:facade({base:'#dcb0a4',trim:'#f1e7df',tall:1,cornice:1}),
 khrushSilicate:facade({base:'#d9d6cf',brick:[40,8,82],balc:['#cfcac0']}),
 khrushRed:facade({base:'#a9553c',brick:[10,48,40],balc:['#d8d2c8']}),
 panel9:facade({base:'#e4e2dc',panel:1,balc:['#d4d0c6','#c9c4b8'],balcAll:1}),
 panel16:facade({base:'#efeee9',panel:1,balc:['#e9e7e0','#c8573e','#5a7fa8'],balcAll:1}),
 modern:facade({base:'#e8e4dc',panel:1,balc:['#b97a52','#e8e4dc'],balcAll:1}),
 school:facade({base:'#e7c9a2',trim:'#f4efe6',cornice:1}),
 kinder:facade({base:'#f1dfa0',trim:'#ffffff'}),
 public:facade({base:'#dcd6ca',panel:1}),
 white:facade({base:'#f1eee6',trim:'#ffffff',tall:1,cornice:1}),
};
const FM={};Object.keys(F).forEach(k=>FM[k]=new THREE.MeshLambertMaterial({map:tex(F[k])}));
const greyM=new THREE.MeshLambertMaterial({map:tex(cv(128,128,(g,w,h)=>{g.fillStyle='#9a968e';g.fillRect(0,0,w,h);noise(g,w,h,.2,1500);g.fillStyle='#6d6a64';for(let x=8;x<w;x+=42)g.fillRect(x,40,34,88);}))});
const glassM=new THREE.MeshLambertMaterial({map:tex(cv(256,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#9fb9cc');gr.addColorStop(1,'#33475a');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#d0d4d8';for(let x=0;x<w;x+=64)g.fillRect(x,0,4,h);g.fillRect(0,0,w,6);g.fillRect(0,60,w,4);}))});
const plinth=new THREE.MeshLambertMaterial({map:tex(cv(512,128,(g,w,h)=>{g.fillStyle='#8c857b';g.fillRect(0,0,w,h);noise(g,w,h,.2,2000);
 for(let i=0;i<4;i++){const x=i*128;if(i==1){g.fillStyle='#5b4632';g.fillRect(x+40,40,48,88);g.fillStyle='#3a2a1c';g.fillRect(x+62,40,4,88);g.fillStyle='#ccc';g.fillRect(x+30,30,68,8);g.fillStyle='#2a5a9a';g.fillRect(x+52,14,24,12);}else{g.fillStyle='#e0e0e0';g.fillRect(x+34,46,60,44);g.fillStyle='#3c4c5a';g.fillRect(x+38,50,52,36);}}}))});
const shopM=new THREE.MeshLambertMaterial({map:tex(cv(512,128,(g,w,h)=>{g.fillStyle='#d8d6d0';g.fillRect(0,0,w,h);
 for(let i=0;i<2;i++){const x=i*256;const gr=g.createLinearGradient(0,30,0,128);gr.addColorStop(0,'#a8c4d8');gr.addColorStop(1,'#203040');g.fillStyle=gr;g.fillRect(x+14,30,228,98);g.fillStyle='#555';g.fillRect(x+120,30,5,98);g.fillStyle='#f5e6b0';g.fillRect(x+30,95,60,25);}}))});
const roofM=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,map:tex(cv(64,64,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);noise(g,w,h,.15,500);}),1,1)});
// landmark presets (hand tuned)
const LM=[
 [/Дом культуры/,{f:'stalinYellow',cols:'#f6f2e8',sign:'ДК «ЦЕНТР МОЛОДЁЖИ»',sc:'#7a2a20'}],
 [/Усадьба/,{f:'white',cols:'#ffffff',sign:'УСАДЬБА ЧЕРНЫШОВЫХ',sc:'#5a4a30'}],
 [/Школа|Колледж|музыкальная/,{f:'school',sign:null}],
 [/Детский сад/,{f:'kinder'}],
 [/Весна/,{f:'modern',glass:1,sign:'ТРЦ ВЕСНА',sc:'#2e8b3a'}],
 [/Пятёрочка/,{f:'public',glass:1,sign:'ПЯТЁРОЧКА',sc:'#d0231c'}],
 [/Импульс/,{f:'public',glass:1,sign:'ТЦ ИМПУЛЬС',sc:'#1d5aa8'}],
 [/Ассортида/,{f:'public',glass:1,sign:'АССОРТИДА',sc:'#8a2a8a'}],
 [/^Лыткарино$/,{f:'public',glass:1,sign:'ТД ЛЫТКАРИНО',sc:'#1d5aa8'}],
 [/Ледовый/,{f:'public',sign:'ЛЕДОВЫЙ КОМПЛЕКС',sc:'#1d6ab0'}],
 [/Кристалл/,{f:'public',sign:'КРИСТАЛЛ',sc:'#1d6ab0'}],
 [/Поликлиника|консультация/,{f:'school',sign:'ПОЛИКЛИНИКА',sc:'#1d7a4a'}],
];
function pick(b,i){const n=b.n||'';for(const [re,o] of LM)if(re.test(n))return o;const k=b.k,l=b.l;
 if(k=='garages'||k=='service'||k=='construction')return{f:null};
 if(b.s)return{f:'public',glass:1};
 if(k=='school')return{f:'school'};if(k=='kindergarten')return{f:'kinder'};
 if(l>=12)return{f:i%3?'panel16':'modern'};if(l>=9)return{f:'panel9'};
 if(b.rs&&l<=5)return{f:['stalinCream','stalinPeach','stalinYellow','stalinPink'][i%4]};
 if(l==5)return{f:i%3?'khrushSilicate':'khrushRed'};
 if(l>=6)return{f:'panel9'};
 return{f:['stalinCream','khrushSilicate','stalinPeach'][i%3]};}
const buf={};function bf(m){return buf[m.uuid]||(buf[m.uuid]={m,P:[],U:[],C:[]});}
function wall(b,p,y0,y1,vs,us){const B=bf(b);let u=0;for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]),u1=u+L;
 B.P.push(a[0],y0,a[1],c[0],y0,c[1],c[0],y1,c[1],a[0],y0,a[1],c[0],y1,c[1],a[0],y1,a[1]);const v0=y0/vs,v1=y1/vs,U0=u/us,U1=u1/us;B.U.push(U0,v0,U1,v0,U1,v1,U0,v0,U1,v1,U0,v1);u=u1;}}
const RB=bf(roofM);
function rtri(a,b,c,col){const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];if(uz*vx-ux*vz<0){const t=b;b=c;c=t;}
 RB.P.push(...a,...b,...c);RB.U.push(a[0]/4,a[2]/4,b[0]/4,b[2]/4,c[0]/4,c[2]/4);for(let i=0;i<3;i++)RB.C.push(col.r,col.g,col.b);}
function obb(p){let best=null;for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L<.5)continue;const ux=(c[0]-a[0])/L,uz=(c[1]-a[1])/L;
 let s0=1e9,s1=-1e9,t0=1e9,t1=-1e9;p.forEach(q=>{const s=q[0]*ux+q[1]*uz,t=-q[0]*uz+q[1]*ux;s0=Math.min(s0,s);s1=Math.max(s1,s);t0=Math.min(t0,t);t1=Math.max(t1,t);});
 const A=(s1-s0)*(t1-t0);if(!best||A<best.A)best={A,ux,uz,s0,s1,t0,t1};}return best;}
function area(p){let A=0;for(let k=0;k<p.length;k++){const a=p[k],c=p[(k+1)%p.length];A+=a[0]*c[1]-c[0]*a[1];}return A/2;}
function sign(text,colr,a,c,y,lift){const L=Math.hypot(c[0]-a[0],c[1]-a[1]);const w=Math.min(L*.7,text.length*1.1+2),hh=1.4;
 const t=new THREE.CanvasTexture(cv(512,64,(g)=>{g.fillStyle=colr;g.fillRect(0,0,512,64);g.fillStyle='#fff';g.font='bold 40px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,34);}));
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,hh),new THREE.MeshBasicMaterial({map:t}));const dx=(c[0]-a[0])/L,dz=(c[1]-a[1])/L;
 m.position.set((a[0]+c[0])/2+dz*lift,y,(a[1]+c[1])/2-dx*lift);m.rotation.y=Math.atan2(dz,-dx);S.add(m);return m;}
const colG=new THREE.CylinderGeometry(.35,.4,1,10);const colList=[];
const Gd={},CS=20;
C.b.forEach((b,i)=>{let p=b.p.slice();if(area(p)>0)p.reverse();// now clockwise in x/z => outward normals
 const o=pick(b,i),h=Math.max(2.5,b.h),fm=o.f?FM[o.f]:greyM;
 if(o.glass){wall(glassM,p,0,Math.min(h,b.l>1?3.5:h),3.5,8);if(h>3.5)wall(fm,p,3.5,h,9,12);}
 else if(fm===greyM)wall(greyM,p,0,h,3,3);
 else if(h>4&&b.l>=5&&!o.f.startsWith('stalin')){wall(b.s?shopM:plinth,p,0,3,3,12);wall(fm,p,3,h,9,12);}
 else wall(fm,p,0,h,9,12);
 // roof colour from satellite (slightly lifted for lighting)
 const rc=new THREE.Color(b.rc||'#777777');rc.offsetHSL(0,0.05,0.06);
 const ob=obb(p),hipped=(b.rs||b.k=='kindergarten')&&ob&&Math.abs(area(p))/ob.A>.85&&b.l<=6;
 if(hipped){const Ls=ob.s1-ob.s0,Lt=ob.t1-ob.t0,cs=(ob.s0+ob.s1)/2,ct=(ob.t0+ob.t1)/2,long=Ls>=Lt,half=Math.abs(Ls-Lt)/2,rh=Math.min(4,Math.min(Ls,Lt)*.28);
  const W2=(s,t)=>[s*ob.ux-t*ob.uz,h+ (0),s*ob.uz+t*ob.ux];
  const Ra=long?W2(cs-half,ct):W2(cs,ct-half),Rb=long?W2(cs+half,ct):W2(cs,ct+half);Ra[1]=Rb[1]=h+rh;
  for(let k=0;k<p.length;k++){const a=p[k],c=p[(k+1)%p.length];const A3=[a[0],h,a[1]],C3=[c[0],h,c[1]];
   const na=Math.hypot(a[0]-Ra[0],a[1]-Ra[2])<Math.hypot(a[0]-Rb[0],a[1]-Rb[2])?Ra:Rb,nc=Math.hypot(c[0]-Ra[0],c[1]-Ra[2])<Math.hypot(c[0]-Rb[0],c[1]-Rb[2])?Ra:Rb;
   rtri(A3,C3,nc,rc);if(na!==nc)rtri(A3,nc,na,rc);}}
 else{const g=new THREE.ShapeGeometry(new THREE.Shape(b.p.map(q=>new THREE.Vector2(q[0],-q[1])))).toNonIndexed();g.rotateX(-Math.PI/2);const pa=g.attributes.position.array;
  for(let k=0;k<pa.length;k+=9)rtri([pa[k],h,pa[k+2]],[pa[k+3],h,pa[k+5]],[pa[k+6],h,pa[k+8]],rc);
  if(b.l>=5)wall(plinth,p,h,h+.6,3,12);}
 // landmark details: sign + columns on longest edge
 if(o.sign||o.cols){let li=0,ll=0;for(let k=0;k<p.length;k++){const a=p[k],c=p[(k+1)%p.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L>ll){ll=L;li=k;}}
  let a=p[li],c=p[(li+1)%p.length];{const L=Math.hypot(c[0]-a[0],c[1]-a[1]),dx=(c[0]-a[0])/L,dz=(c[1]-a[1])/L,mx=(a[0]+c[0])/2+dz*1.5,mz=(a[1]+c[1])/2-dx*1.5;
   let ins=false;for(let j=0,k2=p.length-1;j<p.length;k2=j++){const A=p[j],B2=p[k2];if((A[1]>mz)!=(B2[1]>mz)&&mx<(B2[0]-A[0])*(mz-A[1])/(B2[1]-A[1])+A[0])ins=!ins;}if(ins){const t=a;a=c;c=t;}}
  if(o.sign)sign(o.sign,o.sc,a,c,Math.min(h-.9,b.l>1?4.3:h-.9),.06);
  if(o.cols){const n=Math.max(4,Math.min(8,Math.floor(ll/4)));const dx=(c[0]-a[0])/ll,dz=(c[1]-a[1])/ll,ch=Math.min(h-.5,7.5);
   for(let j=0;j<n;j++){const s=ll/2+(j-(n-1)/2)*2.6;colList.push([a[0]+dx*s+dz*1.6,a[1]+dz*s-dx*1.6,ch]);}
   const pd=new THREE.Mesh(new THREE.BoxGeometry(n*2.6+1,1,3.4),new THREE.MeshLambertMaterial({color:o.cols}));pd.position.set(a[0]+dx*ll/2+dz*1.6,ch+.5,a[1]+dz*ll/2-dx*1.6);pd.rotation.y=Math.atan2(dx,dz)+Math.PI/2;pd.castShadow=true;S.add(pd);
   const tg=new THREE.Mesh(new THREE.CylinderGeometry(0,1,1,3,1),new THREE.MeshLambertMaterial({color:o.cols}));}}
 let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;b.p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);});
 for(let gx=Math.floor(x0/CS);gx<=Math.floor(x1/CS);gx++)for(let gz=Math.floor(z0/CS);gz<=Math.floor(z1/CS);gz++)(Gd[gx+','+gz]=Gd[gx+','+gz]||[]).push(b.p);});
if(colList.length){const im=new THREE.InstancedMesh(colG,new THREE.MeshLambertMaterial({color:0xf8f6f0}),colList.length);const m4=new THREE.Matrix4();colList.forEach((c,i)=>{m4.makeScale(1,c[2],1).setPosition(c[0],c[2]/2,c[1]);im.setMatrixAt(i,m4);});im.castShadow=true;S.add(im);}
Object.values(buf).forEach(B=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(B.P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(B.U,2));if(B.C.length)g.setAttribute('color',new THREE.Float32BufferAttribute(B.C,3));g.computeVertexNormals();const m=new THREE.Mesh(g,B.m);m.castShadow=m.receiveShadow=true;S.add(m);});
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
const leather=tex(cv(512,512,(g,w,h)=>{g.fillStyle='#1c1917';g.fillRect(0,0,w,h);for(let i=0;i<14000;i++){const v=rnd();g.fillStyle=`rgba(${v<.5?0:70},${v<.5?0:60},${v<.5?0:55},${.25*rnd()})`;g.beginPath();g.arc(rnd()*w,rnd()*h,.6+rnd()*1.6,0,6.3);g.fill();}}),3,3);
const stitchT=tex(cv(64,8,(g)=>{g.fillStyle='rgba(0,0,0,0)';g.clearRect(0,0,64,8);g.fillStyle='#c9a27a';for(let x=4;x<64;x+=16)g.fillRect(x,2,9,4);}),60,1);
const mDash=new THREE.MeshStandardMaterial({map:leather,roughness:.78,metalness:0,color:0xffffff});
const mDash2=new THREE.MeshStandardMaterial({color:0x26221f,roughness:.55});
const mSoft=new THREE.MeshStandardMaterial({color:0x3a3430,roughness:.9});
const mAlu=new THREE.MeshStandardMaterial({color:0xc4c8cc,roughness:.22,metalness:.95});
const mGloss=new THREE.MeshStandardMaterial({color:0x050506,roughness:.08,metalness:.4});
const mLiner=new THREE.MeshStandardMaterial({color:0x9a948b,roughness:1});
const mBody=new THREE.MeshStandardMaterial({color:0x1b2a48,roughness:.28,metalness:.7});
const mWood=new THREE.MeshStandardMaterial({map:tex(cv(256,64,(g,w,h)=>{g.fillStyle='#3a2519';g.fillRect(0,0,w,h);for(let i=0;i<60;i++){g.strokeStyle=`rgba(${90+rnd()*40},${55+rnd()*25},30,.5)`;g.beginPath();g.moveTo(0,rnd()*h);g.bezierCurveTo(80,rnd()*h,170,rnd()*h,w,rnd()*h);g.stroke();}}),4,1),roughness:.25,metalness:.1});
const mStitch=new THREE.MeshBasicMaterial({map:stitchT,transparent:true});
const AMB=0xff9248,mAmb=new THREE.MeshBasicMaterial({color:AMB});
function add(o,x,y,z,rx,ry,rz,par){o.position.set(x,y,z);o.rotation.set(rx||0,ry||0,rz||0);(par||cab).add(o);return o;}
function rr(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function rbox(w,h,d,r,m){r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);const g=new THREE.ExtrudeGeometry(rr(w-2*r,h-2*r,Math.max(.001,r*.0)),{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:3,curveSegments:4});g.translate(0,0,-(d-2*r)/2);return new THREE.Mesh(g,m);}
function prof(pts,width,m,x0,bev){const s=new THREE.Shape();pts.forEach((p,i)=>i?(p.length>2?s.quadraticCurveTo(p[2],p[3],p[0],p[1]):s.lineTo(p[0],p[1])):s.moveTo(p[0],p[1]));
 const g=new THREE.ExtrudeGeometry(s,{depth:width,bevelEnabled:true,bevelSize:bev||.015,bevelThickness:bev||.015,bevelSegments:4,curveSegments:16});g.rotateY(Math.PI/2);g.translate(x0,0,0);const o=new THREE.Mesh(g,m);cab.add(o);return o;}
// hood: domed, body coloured
{const g=new THREE.BoxGeometry(1.86,.06,1.9,24,1,12);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,p.getY(i)+.07*(1-Math.pow(x/.93,2))-.05*Math.pow((z+.95)/1.9,2));}g.computeVertexNormals();add(new THREE.Mesh(g,mBody),0,.92,-2.15,-.05);
 add(rbox(1.7,.03,.05,.012,mGloss),0,.92,-1.2);}
// dashboard: bevelled, curved leather top (profile u=-z, v=y)
prof([[.56,.6],[.56,.79],[.60,.90,.555,.865],[.78,.975,.66,.96],[1.2,.92,1.0,.97],[1.2,.6]],1.66,mDash,-.83,.02);
prof([[.53,.62],[.53,.71],[.56,.75,.52,.74],[.6,.75],[.6,.62]],1.62,mSoft,-.81,.01);// lower knee pad
// trim strip + ambient light + stitching
add(rbox(1.64,.038,.03,.008,mWood),0,.815,-.552);add(rbox(1.64,.006,.012,.002,mAlu),0,.838,-.548);
add(new THREE.Mesh(new THREE.BoxGeometry(1.6,.005,.004),mAmb),0,.792,-.545);
add(new THREE.Mesh(new THREE.PlaneGeometry(1.62,.006),mStitch),0,.905,-.583,-.6);
add(new THREE.Mesh(new THREE.PlaneGeometry(1.62,.006),mStitch),0,.955,-.69,-1.2);
// vents with slats
[-.66,-.07,.07,.66].forEach(x=>{const v=add(rbox(.15,.05,.03,.012,mGloss),x,.78,-.552);for(let k=0;k<3;k++)add(new THREE.Mesh(new THREE.BoxGeometry(.13,.004,.012),mAlu),x,.766+k*.014,-.536);});
// center stack + climate panel
add(rbox(.3,.2,.06,.015,mGloss),0,.68,-.57,-.25);for(let k=0;k<5;k++)add(new THREE.Mesh(new THREE.BoxGeometry(.04,.012,.006),mAlu),-.1+k*.05,.64,-.54,-.25);
// curved glossy display (cluster + centre screen) freestanding
const dispC=document.createElement('canvas');dispC.width=1024;dispC.height=256;const dg=dispC.getContext('2d');const dispT=new THREE.CanvasTexture(dispC);
const dgeo=new THREE.PlaneGeometry(.84,.2,32,1);{const p=dgeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,.06*Math.pow(x/.42,2));}p.needsUpdate=true;dgeo.computeVertexNormals();}
const disp=add(new THREE.Mesh(dgeo,new THREE.MeshStandardMaterial({map:dispT,emissive:0xffffff,emissiveMap:dispT,emissiveIntensity:.9,roughness:.08,metalness:.3})),-.12,1.045,-.75,-.16);
{const bg=dgeo.clone();const fr=add(new THREE.Mesh(bg,mGloss),-.12,1.045,-.757,-.16);fr.scale.set(1.025,1.12,1);}
add(rbox(.5,.05,.05,.02,mDash2),-.12,.955,-.77);// display foot
// steering wheel: thick rim, hub, 3 spokes, buttons, paddles
const sw=add(new THREE.Group(),-.37,.93,-.43,-.32);const swr=new THREE.Group();sw.add(swr);
{const rim=new THREE.Mesh(new THREE.TorusGeometry(.188,.031,18,72),mDash);rim.scale.set(1,.96,.85);swr.add(rim);
 const st2=new THREE.Mesh(new THREE.TorusGeometry(.188,.0315,4,72,Math.PI*.6),mStitch);st2.rotation.z=Math.PI*.2;
 const hub=rbox(.15,.11,.06,.025,mDash2);swr.add(hub);hub.position.z=-.01;
 const cap=rbox(.1,.07,.012,.006,mGloss);cap.position.z=.026;swr.add(cap);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.024,.004,8,24),mAlu);ring.position.set(0,.005,.034);swr.add(ring);
 [[-1,0],[1,0]].forEach(([sx])=>{const s=rbox(.11,.05,.025,.012,mDash2);s.position.set(sx*.115,-.01,-.005);swr.add(s);const t=rbox(.1,.006,.026,.003,mAlu);t.position.set(sx*.115,.015,-.004);swr.add(t);
  for(let k=0;k<3;k++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.006,10),mGloss);b.rotation.x=Math.PI/2;b.position.set(sx*(.09+k*.018),-.012,.01);swr.add(b);}
  const pad=rbox(.04,.07,.006,.003,mAlu);pad.position.set(sx*.2,.04,-.045);swr.add(pad);});
 const d=rbox(.045,.1,.025,.012,mDash2);d.position.set(0,-.115,-.005);swr.add(d);const dt=rbox(.025,.09,.026,.006,mAlu);dt.position.set(0,-.12,-.004);dt.scale.set(.4,1,1);swr.add(dt);}
add(new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,.3,16),mDash2),-.37,.86,-.6,Math.PI/2-.32);
// A-pillars (rounded), roof liner, B-pillars
function pillar(a,b,r,m){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.2,A.distanceTo(B),12),m);o.scale.z=.6;o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());cab.add(o);}
pillar([-.82,.94,-1.06],[-.69,1.47,-.34],.04,mLiner);pillar([.82,.94,-1.06],[.69,1.47,-.34],.04,mLiner);
add(rbox(1.6,.08,.95,.035,mLiner),0,1.52,.14);add(rbox(1.5,.05,.07,.02,mLiner),0,1.48,-.33);
add(rbox(.06,.5,.07,.02,mLiner),-.84,1.2,.55);add(rbox(.06,.5,.07,.02,mLiner),.84,1.2,.55);
// door panels: leather, armrest, chrome handle, speaker, ambient strip
[-1,1].forEach(s=>{const X=s*.87;add(rbox(.06,.5,1.5,.02,mDash),X,.66,-.15);add(rbox(.07,.05,1.4,.02,mDash2),X-s*.005,.935,-.12);
 add(rbox(.13,.06,.55,.025,mSoft),X-s*.07,.76,.05);add(rbox(.02,.03,.14,.01,mAlu),X-s*.04,.86,-.28);
 add(new THREE.Mesh(new THREE.BoxGeometry(.004,.004,1.3),mAmb),X-s*.032,.9,-.12);add(rbox(.02,.03,1.2,.01,mWood),X-s*.03,.87,-.1);
 const sp=new THREE.Mesh(new THREE.CircleGeometry(.07,24),mAlu);add(sp,X-s*.031,.55,-.5,0,-s*Math.PI/2);
 add(rbox(.24,.14,.1,.04,mBody),s*1.03,1.0,-.73,0,s*.25);add(new THREE.Mesh(new THREE.PlaneGeometry(.2,.1),new THREE.MeshStandardMaterial({color:0xb8c8d8,metalness:.7,roughness:.1})),s*1.0,1.0,-.67,0,s*.25);});
// rear-view mirror
add(rbox(.22,.065,.03,.02,mGloss),0,1.42,-.47);add(new THREE.Mesh(new THREE.PlaneGeometry(.2,.05),new THREE.MeshStandardMaterial({color:0xa6b6c8,metalness:.8,roughness:.08})),0,1.42,-.454);add(new THREE.Mesh(new THREE.CylinderGeometry(.008,.01,.06,8),mGloss),0,1.465,-.47);
// centre console: gloss top, crystal-like selector, iDrive knob, wood
add(rbox(.26,.3,1.0,.04,mDash),0,.5,-.1);add(rbox(.2,.02,.6,.01,mGloss),0,.66,-.05);add(rbox(.27,.012,.9,.005,mWood),0,.648,-.1);
const knob=add(new THREE.Mesh(new THREE.IcosahedronGeometry(.035,1),new THREE.MeshPhysicalMaterial({color:0xe8f6ff,roughness:.02,metalness:0,transmission:.6,thickness:.05,clearcoat:1})),0,.705,-.2);knob.scale.set(.8,1.1,1.3);
add(rbox(.07,.012,.1,.005,mAlu),0,.672,-.2);
const idr=add(new THREE.Mesh(new THREE.CylinderGeometry(.03,.032,.025,32),mAlu),0,.682,-.02);
add(new THREE.Mesh(new THREE.TorusGeometry(.12,.002,4,48,Math.PI),mAmb),0,.67,-.02,-Math.PI/2);
// seats hint
add(new THREE.Mesh(new THREE.BoxGeometry(1.8,.05,2.2),mSoft),0,.3,-.2);add(new THREE.Mesh(new THREE.BoxGeometry(1.7,.4,.05),mSoft),0,.45,-1.15);
add(rbox(.5,.12,.5,.05,mDash2),-.37,.42,.15);add(rbox(.5,.12,.5,.05,mDash2),.37,.42,.15);
cab.traverse(o=>{if(o.isMesh)o.castShadow=false;});
const cabLight=new THREE.PointLight(0xfff0e0,.45,2.5);cabLight.position.set(0,1.35,-.2);cab.add(cabLight);
const ambL=new THREE.PointLight(AMB,.25,1.2);ambL.position.set(0,.8,-.45);cab.add(ambL);
const cam=new THREE.PerspectiveCamera(innerWidth<innerHeight?95:68,innerWidth/innerHeight,.03,1500);cam.position.set(-.37,1.2,.05);cam.rotation.x=-.07;cab.add(cam);
const topCam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,1,3000);
// minimap for center screen
const MS=0.55,mapC=cv(1800,1800,(g,w,h)=>{g.fillStyle='#16202a';g.fillRect(0,0,w,h);g.lineCap='round';
 C.g.forEach(p=>{g.fillStyle='#1f3a28';g.beginPath();p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.fill();});
 C.b.forEach(b=>{g.fillStyle='#34404c';g.beginPath();b.p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.fill();});
 C.r.forEach(r=>{if(r.w<4)return;g.strokeStyle=r.w>=8?'#e8b060':'#9aa8b4';g.lineWidth=Math.max(2,r.w*MS);g.beginPath();r.p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.stroke();});});
function drawDisp(v,steer){const g=dg,kmh=Math.abs(v)*3.6,gear=st.rev?'R':(Math.abs(v)<.2&&st.thr<.05?'P':'D'+(st.g+1)),rpm=st.rpm;
 g.fillStyle='#05070a';g.fillRect(0,0,1024,256);
 // cluster
 let gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#0d1622');gr.addColorStop(1,'#03050a');g.fillStyle=gr;g.fillRect(0,0,500,256);
 function arc(cx,val,max,color,label){g.lineWidth=10;g.strokeStyle='#1c2836';g.beginPath();g.arc(cx,150,95,Math.PI*.8,Math.PI*2.2);g.stroke();g.strokeStyle=color;g.beginPath();g.arc(cx,150,95,Math.PI*.8,Math.PI*(.8+1.4*Math.min(1,val/max)));g.stroke();
  g.fillStyle='#8fa4b8';g.font='16px sans-serif';g.textAlign='center';g.fillText(label,cx,232);}
 arc(110,kmh,240,'#4fb4ff','км/ч');arc(390,rpm,7000,rpm>5500?'#ff5040':'#ff9a30','×1000 об/мин');
 g.textAlign='center';g.fillStyle='#fff';g.font='bold 64px sans-serif';g.fillText(Math.round(kmh),110,170);g.font='bold 40px sans-serif';g.fillText((rpm/1000).toFixed(1),390,165);
 g.fillStyle='#4fb4ff';g.font='bold 34px sans-serif';g.fillText(gear,250,120);g.fillStyle='#8fa4b8';g.font='15px sans-serif';g.fillText('ЛЫТКАРИНО  '+new Date().toTimeString().slice(0,5),250,40);g.fillText(st.road?'SPORT':'ГРУНТ',250,200);if(Math.abs(st.vl)>3){g.fillStyle='#ffb020';g.fillText('DSC',250,225);}
 g.fillStyle='#000';g.fillRect(500,0,12,256);
 // center screen: nav map
 g.save();g.beginPath();g.rect(512,0,512,256);g.clip();g.translate(768,170);g.rotate(Math.PI+st.h);g.scale(1.6,1.6);g.drawImage(mapC,-mapC.width/2-st.x*MS,-mapC.height/2-st.z*MS);g.restore();
 g.fillStyle='#4fb4ff';g.beginPath();g.moveTo(768,155);g.lineTo(756,182);g.lineTo(768,176);g.lineTo(780,182);g.fill();
 g.fillStyle='rgba(5,10,16,.8)';g.fillRect(512,0,512,36);g.fillStyle='#fff';g.font='18px sans-serif';g.textAlign='left';g.fillText('Навигация   '+Math.round(kmh)+' км/ч',528,25);g.textAlign='right';g.fillText('22°C   ♪ Радио Лыткарино',1010,25);
 dispT.needsUpdate=true;}
// ---------- spawn ----------
let best=null,bl=1e9;major.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),D=Math.hypot(a[0],a[1]);if(L>60&&D<bl){bl=D;best=[a,b];}}});
const h0=Math.atan2(best[1][0]-best[0][0],best[1][1]-best[0][1]),off=1.6;
const st={x:best[0][0]+Math.sin(h0)*8-Math.cos(h0)*off,z:best[0][1]+Math.cos(h0)*8+Math.sin(h0)*off,h:h0,vx:0,vz:0,r:0,v:0,vl:0,steer:0,thr:0,brk:0,g:0,rpm:800,rev:false,shift:0,along:0,alat:0,road:true,hb:0};
const start=JSON.parse(JSON.stringify(st));
// road lookup grid (for grip)
const RG={};drive.concat(C.r.filter(r=>r.w>=3&&r.w<4)).forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1];const seg=[a,b,r.w/2+.8];const xs=[a[0],b[0]],zs=[a[1],b[1]];
 for(let gx=Math.floor((Math.min(...xs)-8)/20);gx<=Math.floor((Math.max(...xs)+8)/20);gx++)for(let gz=Math.floor((Math.min(...zs)-8)/20);gz<=Math.floor((Math.max(...zs)+8)/20);gz++)(RG[gx+','+gz]=RG[gx+','+gz]||[]).push(seg);}});
function segD(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],L=dx*dx+dz*dz||1;let t=((x-a[0])*dx+(z-a[1])*dz)/L;t=Math.max(0,Math.min(1,t));const px=a[0]+dx*t,pz=a[1]+dz*t;return[Math.hypot(x-px,z-pz),px,pz];}
function onRoad(x,z){const l=RG[Math.floor(x/20)+','+Math.floor(z/20)];return !!l&&l.some(s=>segD(x,z,s[0],s[1])[0]<s[2]);}
function wallN(x,z){const l=Gd[Math.floor(x/CS)+','+Math.floor(z/CS)]||[];let bd=1e9,n=null;l.forEach(p=>{for(let i=0;i<p.length;i++){const d=segD(x,z,p[i],p[(i+1)%p.length]);if(d[0]<bd){bd=d[0];n=[x-d[1],z-d[2]];}}});
 if(!n)return null;const L=Math.hypot(n[0],n[1])||1;n=[n[0]/L,n[1]/L];return hit(x,z)?[-n[0],-n[1]]:n;}
// ---------- input ----------
const K={};addEventListener('keydown',e=>{K[e.code]=1;if(e.code=='KeyR')Object.assign(st,JSON.parse(JSON.stringify(start)));if(e.code=='Space')e.preventDefault();audioInit();});addEventListener('keyup',e=>K[e.code]=0);
const T={steer:0,gas:0,brk:0,hb:0};
if(mobile){document.querySelectorAll('.t').forEach(e=>e.style.display='flex');const joy=document.getElementById('joy'),kn=document.getElementById('knob');
 joy.addEventListener('touchmove',e=>{e.preventDefault();const r=joy.getBoundingClientRect(),t=e.targetTouches[0];const dx=Math.max(-1,Math.min(1,(t.clientX-r.left-r.width/2)/(r.width/2.5)));T.steer=dx;kn.style.left=(r.width/2-25)+dx*r.width/3+'px';},{passive:false});
 joy.addEventListener('touchend',()=>{T.steer=0;kn.style.left='';});
 [['gas','gas'],['brk','brk'],['hb','hb']].forEach(([id,k])=>{const el=document.getElementById(id);el.addEventListener('touchstart',e=>{e.preventDefault();T[k]=1;audioInit();},{passive:false});el.addEventListener('touchend',()=>T[k]=0);});}
// ---------- engine sound (WebAudio) ----------
let AU=null;function audioInit(){if(AU||demo)return;try{const ac=new (window.AudioContext||window.webkitAudioContext)();const o1=ac.createOscillator(),o2=ac.createOscillator(),o3=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();
 o1.type='sawtooth';o2.type='square';o3.type='triangle';f.type='lowpass';f.Q.value=4;g.gain.value=0;[o1,o2,o3].forEach(o=>{o.connect(f);o.start();});f.connect(g);g.connect(ac.destination);
 const nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;const ns=ac.createBufferSource();ns.buffer=nb;ns.loop=true;const nf=ac.createBiquadFilter();nf.type='bandpass';nf.frequency.value=900;nf.Q.value=.8;const ng=ac.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(ac.destination);ns.start();
 AU={ac,o1,o2,o3,f,g,ng};}catch(e){}}
function audioUpd(){if(!AU)return;const t=AU.ac.currentTime,fq=st.rpm/60*3;AU.o1.frequency.setTargetAtTime(fq,t,.03);AU.o2.frequency.setTargetAtTime(fq*.5,t,.03);AU.o3.frequency.setTargetAtTime(fq*2.01,t,.03);
 AU.f.frequency.setTargetAtTime(300+st.thr*1800+st.rpm*.15,t,.05);AU.g.gain.setTargetAtTime(.05+st.thr*.09,t,.05);AU.ng.gain.setTargetAtTime(Math.min(.25,Math.max(0,Math.abs(st.vl)-2.5)*.04),t,.05);}
// ---------- arcade-sim driving ----------
const GR=[3.9,2.4,1.62,1.22,.97,.8],FD=3.4,RW=.36,MASS=1900,WB=2.9;
function torque(rpm){if(rpm>6600)return 0;const x=Math.max(0,Math.min(1,(rpm-1000)/5200));return 330+170*Math.sin(x*Math.PI*.9);}
function step(dt){
 let thrIn=(K.KeyW||K.ArrowUp||T.gas)?1:0,brkIn=(K.KeyS||K.ArrowDown||T.brk)?1:0,stIn=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0)-T.steer,hb=(K.Space||T.hb)?1:0;
 if(demo){thrIn=Q.includes('full')?1:(st.v<16?1:.35);brkIn=0;stIn=0;hb=0;}
 const s=Math.sin(st.h),c=Math.cos(st.h);let vf=st.vx*s+st.vz*c,vl=st.vx*c-st.vz*s;
 // reverse logic
 if(!st.rev&&brkIn&&!thrIn&&vf<.5)st.rev=true;if(st.rev&&thrIn&&vf>-.5)st.rev=false;
 const wantT=st.rev?brkIn:thrIn,wantB=st.rev?thrIn:brkIn;
 st.thr+=(wantT-st.thr)*Math.min(1,dt*6);st.brk+=(wantB-st.brk)*Math.min(1,dt*8);
 const sr=Math.abs(stIn)>Math.abs(st.steer)?3.5:6;st.steer+=(stIn-st.steer)*Math.min(1,dt*sr);
 st.road=onRoad(st.x,st.z);
 // gearbox
 const sp=Math.abs(vf);if(st.rev){st.g=0;}else{const rpmG=sp/RW*GR[st.g]*FD*9.549;if(rpmG>6100&&st.g<5){st.g++;st.shift=.25;}else if(st.g>0&&sp/RW*GR[st.g-1]*FD*9.549<4300){st.g--;st.shift=.2;}}
 const ratio=st.rev?3.5:GR[st.g];let rpm=sp/RW*ratio*FD*9.549;rpm=Math.max(rpm,800+st.thr*(sp<3?2200:0));st.rpm+=(Math.min(6800,rpm)-st.rpm)*Math.min(1,dt*10);
 st.shift=Math.max(0,st.shift-dt);
 let F=torque(st.rpm)*ratio*FD/RW*st.thr*.92*(st.shift>0?.3:1)*(st.road?1:.7);if(st.rev)F=Math.min(F,4000);
 const roll=(st.road?180:1100)+(st.road?0:6*sp*sp*.1),drag=1.32*vf*vf;
 let a=(st.rev?-F:F)/MASS;a-=Math.sign(vf)*(roll+drag)/MASS;
 const brkF=(st.brk*14000+hb*5000)/MASS*(st.road?1:.6);
 const vfOld=vf;vf+=a*dt;if(Math.abs(vf)>.05){const nv=vf-Math.sign(vf)*brkF*dt;vf=Math.sign(nv)!==Math.sign(vf)?0:nv;}else if(!st.thr)vf=0;
 vf=Math.max(-9,Math.min(50.5,vf));
 st.along+=(((vf-vfOld)/dt)-st.along)*Math.min(1,dt*4);
 // steering & yaw (speed-dependent, weight transfer, grip)
 const maxA=.6/(1+Math.abs(vf)*.06),delta=st.steer*maxA,wt=Math.max(.75,Math.min(1.3,1-st.along*.035));
 const grip=(st.road?1:.6)*(hb?.22:1);let target=vf*Math.tan(delta)/WB*wt*(hb?1.7:1);
 st.r+=(target-st.r)*Math.min(1,dt*(2+9*grip));st.h+=st.r*dt;
 vl*=Math.exp(-dt*11*grip);
 const s2=Math.sin(st.h),c2=Math.cos(st.h);
 // re-project: velocity keeps world direction partly (gives slide when grip low)
 let nvx=s2*vf+c2*vl,nvz=c2*vf-s2*vl;const keep=hb?.92:(st.road?.0:.3);nvx=nvx*(1-keep)+st.vx*keep*(Math.abs(vf)>.5?1:0);nvz=nvz*(1-keep)+st.vz*keep*(Math.abs(vf)>.5?1:0);
 st.vx=nvx;st.vz=nvz;st.vl=st.vx*c2-st.vz*s2;st.v=st.vx*s2+st.vz*c2;st.alat=st.v*st.r;
 // movement + sliding collisions
 const nx=st.x+st.vx*dt,nz=st.z+st.vz*dt;let hitPt=null;
 for(const [ax,bz] of [[.95,2.35],[-.95,2.35],[.95,-2.35],[-.95,-2.35],[.95,0],[-.95,0]]){const px=nx+ax*c2+bz*s2,pz=nz-ax*s2+bz*c2;if(hit(px,pz)){hitPt=[px,pz];break;}}
 let n=null;if(hitPt)n=wallN(hitPt[0],hitPt[1]);
 AI.forEach(o=>{const dx=nx-o.g.position.x,dz=nz-o.g.position.z,d=Math.hypot(dx,dz);if(d<3.4){n=[dx/d,dz/d];}});
 if(n){const vn=st.vx*n[0]+st.vz*n[1];if(vn<0){st.vx-=1.35*vn*n[0];st.vz-=1.35*vn*n[1];st.vx*=.82;st.vz*=.82;}st.x+=n[0]*.08;st.z+=n[1]*.08;st.r*=.5;}
 else{st.x=nx;st.z=nz;}
 audioUpd();}
function updAI(dt){AI.forEach(a=>{const L=a.o.c[a.o.c.length-1];let ahead=Math.hypot(a.g.position.x-st.x,a.g.position.z-st.z)<7;a.s+=a.d*a.v*dt*(ahead?0:1);if(a.s>L-2||a.s<2){a.d*=-1;a.s=Math.max(2,Math.min(L-2,a.s));}
 const p=at(a.o.r,a.o.c,a.s,a.d*a.o.r.w/4);a.g.position.set(p[0],0,p[1]);a.g.rotation.y=p[2]+(a.d<0?Math.PI:0);});
 ped.forEach((p,i)=>{const L=p.o.c[p.o.c.length-1];p.s+=p.d*p.v*dt;if(p.s>L-1||p.s<1)p.d*=-1;const q=at(p.o.r,p.o.c,p.s,p.side),t=performance.now()/300+i;
  M.makeRotationY(q[2]+(p.d<0?Math.PI:0)).setPosition(q[0],Math.abs(Math.sin(t))*.05,q[1]);pb.setMatrixAt(i,M);ph.setMatrixAt(i,M);pl.setMatrixAt(i,M);});
 pb.instanceMatrix.needsUpdate=ph.instanceMatrix.needsUpdate=pl.instanceMatrix.needsUpdate=true;}
if(/ff=(\d+)/.test(Q)){const n=+/ff=(\d+)/.exec(Q)[1];for(let i=0;i<n;i++){step(1/60);if(i%120==0)console.log('T',(i/60).toFixed(0),'kmh',(st.v*3.6).toFixed(0),'g',st.g+1,'rpm',st.rpm|0);}}
let LK=null;{const m=/lm=([^&]+)/.exec(Q);if(m){const n=decodeURIComponent(m[1]),b=C.b.find(b=>b.n&&b.n.includes(n));if(b){let cx=0,cz=0;b.p.forEach(q=>{cx+=q[0];cz+=q[1];});cx/=b.p.length;cz/=b.p.length;const ang=+(/ang=([-\d.]+)/.exec(Q)||[0,0.6])[1];LK=[cx,cz,Math.cos(ang),Math.sin(ang)];}}}
let last=performance.now(),fr=0;
function frame(t){const dt=Math.min(0.05,(t-last)/1000)||0.016;last=t;step(dt);updAI(dt);
 car.position.set(st.x,0,st.z);car.rotation.y=st.h;swr.rotation.z=st.steer*2.4;
 const vib=st.rpm>4500?(Math.random()-.5)*.0006*(st.rpm-4500)/2000:0;cam.position.set(-.37+st.alat*.0025,1.2+vib-Math.max(0,-st.along)*.002,.05+st.along*.004);cam.rotation.set(-.07+st.along*.0045,0,-st.alat*.004);
 sun.position.set(st.x+80,150,st.z+60);sun.target.position.set(st.x,0,st.z);
 if(fr++%3==0)drawDisp(st.v,st.steer);
 if(LK){topCam.position.set(LK[0]+LK[2]*45,30,LK[1]+LK[3]*45);topCam.lookAt(LK[0],6,LK[1]);R.render(S,topCam);}else if(topv){topCam.position.set(st.x-200,300,st.z+250);topCam.lookAt(st.x,0,st.z);R.render(S,topCam);}else R.render(S,cam);
 requestAnimationFrame(frame);}
addEventListener('resize',()=>{cam.fov=innerWidth<innerHeight?95:68;[cam,topCam].forEach(c=>{c.aspect=innerWidth/innerHeight;c.updateProjectionMatrix();});R.setSize(innerWidth,innerHeight);});
requestAnimationFrame(frame);
})();
