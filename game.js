(function(){
'use strict';
const C=window.CITY,Q=location.search,demo=Q.includes('demo'),topv=Q.includes('top'),mobile='ontouchstart' in window;
const R=new THREE.WebGLRenderer({antialias:!mobile,preserveDrawingBuffer:true});
R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.domElement.id='gl';R.setSize(innerWidth,innerHeight,false);document.body.prepend(R.domElement);
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
// ---------- roads (opaque asphalt, world-space UVs so overlaps are seamless) ----------
const ASZ=512;
const asphH=cv(ASZ,ASZ,(g,w,h)=>{g.fillStyle='#808080';g.fillRect(0,0,w,h);for(let i=0;i<26000;i++){const v=90+rnd()*80|0;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2);}
 g.strokeStyle='#303030';g.lineWidth=1.3;for(let i=0;i<9;i++){let x=rnd()*w,y=rnd()*h;g.beginPath();g.moveTo(x,y);for(let k=0;k<14;k++){x+=(rnd()-.5)*30;y+=(rnd()-.5)*30;g.lineTo(x,y);}g.stroke();}});
const asphC=cv(ASZ,ASZ,(g,w,h)=>{g.fillStyle='#46474a';g.fillRect(0,0,w,h);for(let i=0;i<5;i++){g.fillStyle=`rgba(${rnd()<.5?'30,30,32':'80,80,82'},.35)`;g.fillRect(rnd()*w,rnd()*h,40+rnd()*120,30+rnd()*90);}// patches
 g.drawImage(asphH,0,0);g.globalCompositeOperation='multiply';g.fillStyle='#5a5b5f';g.fillRect(0,0,w,h);g.globalCompositeOperation='source-over';
 for(let i=0;i<3;i++){g.fillStyle='rgba(20,20,22,.25)';g.beginPath();g.ellipse(rnd()*w,rnd()*h,20+rnd()*40,10+rnd()*20,rnd()*3,0,6.3);g.fill();}});
function normFrom(c,str){const w=c.width,h=c.height,src=c.getContext('2d').getImageData(0,0,w,h).data;return cv(w,h,(g)=>{const id=g.createImageData(w,h),d=id.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,l=src[(y*w+(x+w-1)%w)*4],r=src[(y*w+(x+1)%w)*4],u=src[(((y+h-1)%h)*w+x)*4],dn=src[(((y+1)%h)*w+x)*4];
  let nx=(l-r)/255*str,ny=(u-dn)/255*str,nz=1;const L=Math.hypot(nx,ny,nz);d[i]=(nx/L*.5+.5)*255;d[i+1]=(ny/L*.5+.5)*255;d[i+2]=(nz/L*.5+.5)*255;d[i+3]=255;}g.putImageData(id,0,0);});}
const maxAn=R.capabilities.getMaxAnisotropy();
const aT=tex(asphC),aN=tex(normFrom(asphH,2.5)),aR=tex(cv(64,64,(g)=>{g.fillStyle='#e0e0e0';g.fillRect(0,0,64,64);noise(g,64,64,.3,400);}));[aT,aN,aR].forEach(t=>t.anisotropy=maxAn);
const roadM=new THREE.MeshStandardMaterial({map:aT,normalMap:aN,normalScale:new THREE.Vector2(.6,.6),roughnessMap:aR,roughness:.92,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
const walkM=new THREE.MeshLambertMaterial({map:tex(cv(128,128,(g,w,h)=>{g.fillStyle='#a3a29c';g.fillRect(0,0,w,h);noise(g,w,h,.2,1500);g.strokeStyle='#8a8983';for(let i=0;i<=w;i+=32){g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke();}}))});
const RS=7;// metres per asphalt tile
function ribbon(list,mat,y,wf,caps){const P=[];list.forEach(r=>{const h=wf(r)/2;if(h<=0)return;for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1,nx=-dz/L*h,nz=dx/L*h;
 P.push(a[0]+nx,y,a[1]+nz,b[0]+nx,y,b[1]+nz,b[0]-nx,y,b[1]-nz,a[0]+nx,y,a[1]+nz,b[0]-nx,y,b[1]-nz,a[0]-nx,y,a[1]-nz);}
 if(caps)r.p.forEach(q=>{for(let k=0;k<16;k++){const a1=k/16*6.283,a2=(k+1)/16*6.283;P.push(q[0],y,q[1],q[0]+Math.cos(a2)*h,y,q[1]+Math.sin(a2)*h,q[0]+Math.cos(a1)*h,y,q[1]+Math.sin(a1)*h);}});});
 const U=[];for(let i=0;i<P.length;i+=3)U.push(P[i]/RS,P[i+2]/RS);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.computeVertexNormals();
 {const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);}
 const m=new THREE.Mesh(g,mat);m.material.side=THREE.DoubleSide;m.receiveShadow=true;S.add(m);return m;}
const drive=C.r.filter(r=>r.w>=4),major=C.r.filter(r=>r.w>=6),minor=C.r.filter(r=>r.w<6);
// all drivable surfaces at one height + same world-UV texture => no z-fighting at overlaps
ribbon(C.r.filter(r=>r.w>=3),roadM,0.07,r=>r.w,true);

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
 const n=Math.min(300,(x1-x0)*(z1-z0)/120);for(let i=0;i<n;i++){const x=x0+rnd()*(x1-x0),z=z0+rnd()*(z1-z0);if(inPoly(x,z,p)&&!hit(x,z))trees.push([x,z,1]);}});
// varied trees: birch, spruce, linden, poplar (instanced per type)
const barkB=tex(cv(32,128,(g,w,h)=>{g.fillStyle='#e9e6de';g.fillRect(0,0,w,h);g.fillStyle='#2a2a2a';for(let i=0;i<40;i++)g.fillRect(rnd()*w,rnd()*h,4+rnd()*10,1+rnd()*2);}));
const TT={birch:{tr:new THREE.CylinderGeometry(.1,.16,6,6).translate(0,3,0),trm:new THREE.MeshLambertMaterial({map:barkB}),cr:[new THREE.IcosahedronGeometry(1,1).scale(1.7,3.2,1.7).translate(0,6.3,0)],h:[.27,.5,.42]},
 spruce:{tr:new THREE.CylinderGeometry(.15,.25,2,6).translate(0,1,0),trm:new THREE.MeshLambertMaterial({color:0x4a3526}),cr:[new THREE.ConeGeometry(2.4,4.5,8).translate(0,3.6,0),new THREE.ConeGeometry(1.7,4,8).translate(0,6.6,0),new THREE.ConeGeometry(1,3,8).translate(0,9,0)],h:[.36,.45,.18]},
 linden:{tr:new THREE.CylinderGeometry(.2,.3,3.2,6).translate(0,1.6,0),trm:new THREE.MeshLambertMaterial({color:0x5a4030}),cr:[new THREE.IcosahedronGeometry(2.9,1).scale(1,.9,1).translate(0,5.4,0)],h:[.25,.48,.26]},
 poplar:{tr:new THREE.CylinderGeometry(.18,.28,3,6).translate(0,1.5,0),trm:new THREE.MeshLambertMaterial({color:0x6a5a4a}),cr:[new THREE.IcosahedronGeometry(1,1).scale(1.5,6,1.5).translate(0,8,0)],h:[.22,.42,.3]}};
const TL={birch:[],spruce:[],linden:[],poplar:[]};
trees.forEach((t,i)=>{const r=rnd();const type=t.length>2&&t[2]?(r<.35?'birch':r<.7?'spruce':'linden'):(r<.45?'linden':r<.75?'birch':'poplar');TL[type].push(t);});
const M=new THREE.Matrix4(),col=new THREE.Color(),Qt=new THREE.Quaternion(),Vs=new THREE.Vector3(),Vp=new THREE.Vector3(),Yax=new THREE.Vector3(0,1,0);
Object.keys(TT).forEach(k=>{const L=TL[k],T0=TT[k];if(!L.length)return;const tr=new THREE.InstancedMesh(T0.tr,T0.trm,L.length);tr.castShadow=true;S.add(tr);
 const crs=T0.cr.map(g=>{const m=new THREE.InstancedMesh(g,new THREE.MeshLambertMaterial({color:0xffffff}),L.length);m.castShadow=true;S.add(m);return m;});
 L.forEach((t,i)=>{const s=.7+rnd()*.6;Qt.setFromAxisAngle(Yax,rnd()*6.28);M.compose(Vp.set(t[0],0,t[1]),Qt,Vs.set(s,s*(.85+rnd()*.3),s));tr.setMatrixAt(i,M);
  col.setHSL(T0.h[0]+(rnd()-.5)*.05,T0.h[1]+(rnd()-.5)*.15,T0.h[2]*(.8+rnd()*.4));crs.forEach(m=>{m.setMatrixAt(i,M);m.setColorAt(i,col);});});});

const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.07,.1,7,6).translate(0,3.5,0),new THREE.MeshLambertMaterial({color:0x55585c}),lamps.length);
const head=new THREE.InstancedMesh(new THREE.BoxGeometry(.3,.15,1.6).translate(0,7,.7),new THREE.MeshBasicMaterial({color:0xfff6d8}),lamps.length);
lamps.forEach((l,i)=>{M.makeRotationY(l[2]).setPosition(l[0],0,l[1]);pole.setMatrixAt(i,M);head.setMatrixAt(i,M);});pole.castShadow=true;S.add(pole,head);
// ---------- junctions, curbs/sidewalks, traffic lights, signs, crossings, bus stops ----------
const JN={};const jk=q=>Math.round(q[0]*2)+','+Math.round(q[1]*2);
major.forEach((r,ri)=>r.p.forEach((q,i)=>{const k=jk(q);(JN[k]=JN[k]||{p:q,n:0,roads:new Set(),w:0,ang:0});const J=JN[k];J.n+=(i==0||i==r.p.length-1)?1:2;J.roads.add(ri);if(r.w>J.w){J.w=r.w;const b=r.p[Math.min(i+1,r.p.length-1)],a=r.p[Math.max(i-1,0)];J.ang=Math.atan2(b[0]-a[0],b[1]-a[1]);}}));
const junc=Object.values(JN).filter(J=>J.roads.size>=2&&J.n>=3);const isJ=k=>JN[k]&&JN[k].roads.size>=2&&JN[k].n>=3;
{const P=[],U=[];const SW=2.6,CH=.15;
 major.forEach(r=>{for(let i=0;i<r.p.length-1;i++){let a=r.p[i],b=r.p[i+1];const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1)continue;const ux=dx/L,uz=dz/L,cut=r.w/2+SW+2;
  let t0=isJ(jk(a))?cut:0,t1=isJ(jk(b))?L-cut:L;if(t1-t0<1)continue;const A=[a[0]+ux*t0,a[1]+uz*t0],B=[a[0]+ux*t1,a[1]+uz*t1];
  [1,-1].forEach(sd=>{const nx=-uz*sd,nz=ux*sd,o1=r.w/2,o2=r.w/2+SW;
   const q=(o,y)=>[[A[0]+nx*o,y,A[1]+nz*o],[B[0]+nx*o,y,B[1]+nz*o]];const [i1,i2]=q(o1,CH),[e1,e2]=q(o2,CH),[g1,g2]=q(o1,0.02);
   P.push(...i1,...e2,...e1,...i1,...i2,...e2);U.push(0,0,1,(t1-t0)/3,1,0,0,0,0,(t1-t0)/3,1,(t1-t0)/3);
   P.push(...g1,...g2,...i2,...g1,...i2,...i1);U.push(0,0,1,0,1,.05,0,0,1,.05,0,.05);});}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:walkM.map,side:THREE.DoubleSide}));m.receiveShadow=true;S.add(m);}
// traffic lights: OSM signals + major junctions
const LIGHTS=[];const lampG=new THREE.SphereGeometry(.13,10,8),poleM=new THREE.MeshLambertMaterial({color:0x3a3d40}),boxM=new THREE.MeshLambertMaterial({color:0x1a1a1a});
function addLight(x,z,ang,w){if(LIGHTS.some(l=>Math.hypot(l.x-x,l.z-z)<50))return;const L={x,z,ang,off:rnd()*20,heads:[]};
 [0,1].forEach(ax=>{const a=ang+ax*Math.PI/2;const s=Math.sin(a),c=Math.cos(a),o=w/2+1.8;
  [1,-1].forEach(sd=>{const px=x-s*o*sd+c*o*sd,pz=z-c*o*sd-s*o*sd;const g=new THREE.Group();g.position.set(px,0,pz);g.rotation.y=a+(sd>0?Math.PI:0);
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,3.4,8),poleM);pole.position.y=1.7;g.add(pole);const bx=new THREE.Mesh(new THREE.BoxGeometry(.38,1.05,.25),boxM);bx.position.set(0,3.6,0);g.add(bx);
   const ms=['#ff2a1a','#ffc21a','#22e05a'].map((cl,k)=>{const m=new THREE.MeshBasicMaterial({color:0x222222});const l=new THREE.Mesh(lampG,m);l.position.set(0,3.95-k*.34,.13);g.add(l);return [m,new THREE.Color(cl)];});
   S.add(g);L.heads.push({ax,ms});});});LIGHTS.push(L);}
C.ts.forEach(t=>addLight(t[0],t[1],t[2],10));
junc.filter(J=>J.w>=8).sort((a,b)=>b.n-a.n).forEach(J=>{if(LIGHTS.length<22)addLight(J.p[0],J.p[1],J.ang,J.w);});
function lstate(L,ax,t){const c=((t+L.off)%20+20)%20;const a=c<8?2:c<10?1:0,b=c<10?0:c<18?2:1;return ax?b:a;}// 0 red 1 yellow 2 green
function updLights(t){LIGHTS.forEach(L=>L.heads.forEach(h=>{const s=lstate(L,h.ax,t);h.ms.forEach(([m,c],k)=>m.color.copy(k===[0,1,2].indexOf(s===0?0:s===1?1:2)?c:new THREE.Color(0x222222)));}));}
function aiMustStop(x,z,a,t){for(const L of LIGHTS){const dx=L.x-x,dz=L.z-z,d=Math.hypot(dx,dz);if(d<5||d>22)continue;if((dx*Math.sin(a)+dz*Math.cos(a))/d<.8)continue;const ax=Math.abs(Math.sin(a-L.ang))<.5?0:1;if(lstate(L,ax,t)<2)return true;}return false;}
// ---------- lane markings (decals), stop lines, manholes & drains ----------
{const P=[];const Y=.078;const quad=(ax,az,ux,uz,len,wd)=>{const nx=-uz*wd/2,nz=ux*wd/2,bx=ax+ux*len,bz=az+uz*len;P.push(ax+nx,Y,az+nz,bx+nx,Y,bz+nz,bx-nx,Y,bz-nz,ax+nx,Y,az+nz,bx-nx,Y,bz-nz,ax-nx,Y,az-nz);};
 major.forEach(r=>{let ph=0;for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1)continue;const ux=dx/L,uz=dz/L,nx=-uz,nz=ux;
  const cut=r.w/2+3,t0=isJ(jk(a))?cut:0,t1=isJ(jk(b))?L-cut:L;if(t1-t0<1)continue;
  if(r.w>=7){let t=t0+((3-ph)%9+9)%9;for(;t<t1;t+=9){const l=Math.min(3,t1-t);if(l>.3)quad(a[0]+ux*t,a[1]+uz*t,ux,uz,l,.12);}}// dashed centre
  [1,-1].forEach(sd=>{const o=(r.w/2-.35)*sd;quad(a[0]+ux*t0+nx*o,a[1]+uz*t0+nz*o,ux,uz,t1-t0,.12);});// edge lines
  ph=(ph+L)%9;}});
 // stop lines at traffic lights: on each approaching major road, right half
 LIGHTS.forEach(Lt=>{major.forEach(r=>{for(let i=0;i<r.p.length;i++){const q=r.p[i];if(Math.hypot(q[0]-Lt.x,q[1]-Lt.z)>2)continue;[-1,1].forEach(dir=>{const j=i+dir;if(j<0||j>=r.p.length)return;const o=r.p[j],dx=o[0]-q[0],dz=o[1]-q[1],L=Math.hypot(dx,dz);if(L<r.w)return;const ux=dx/L,uz=dz/L,d=r.w/2+3.5;
   const cx=q[0]+ux*d,cz=q[1]+uz*d,nx=-uz,nz=ux,sx=cx+nx*r.w/4*-1,sz=cz+nz*r.w/4*-1;quad(sx-ux*.2,sz-uz*.2,ux,uz,.4,r.w/2-.4);});}});});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xf2f2ea,roughness:.6,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,depthWrite:false}));m.renderOrder=3;m.receiveShadow=true;S.add(m);}
{const mh=[],dr=[];major.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<20)continue;const ux=dx/L,uz=dz/L,nx=-uz,nz=ux;
  for(let t=10+rnd()*20;t<L-8;t+=35+rnd()*30){const o=(r.w/4)*(rnd()<.5?1:-1);mh.push([a[0]+ux*t+nx*o,a[1]+uz*t+nz*o]);}
  for(let t=8;t<L-5;t+=25){const o=(r.w/2-.25);dr.push([a[0]+ux*t+nx*o,a[1]+uz*t+nz*o,Math.atan2(ux,uz)]);}}});
 const mhT=new THREE.CanvasTexture(cv(128,128,(g)=>{g.fillStyle='#2e2c2a';g.beginPath();g.arc(64,64,62,0,6.3);g.fill();g.strokeStyle='#4a4744';g.lineWidth=4;for(let r=14;r<60;r+=12){g.beginPath();g.arc(64,64,r,0,6.3);g.stroke();}for(let k=0;k<8;k++){g.beginPath();g.moveTo(64,64);g.lineTo(64+Math.cos(k*.785)*58,64+Math.sin(k*.785)*58);g.stroke();}}));
 const drT=new THREE.CanvasTexture(cv(64,128,(g)=>{g.fillStyle='#2a2826';g.fillRect(0,0,64,128);g.fillStyle='#111';for(let y=8;y<120;y+=12)g.fillRect(8,y,48,6);}));
 const mk=(geo,map,L,rot)=>{if(!L.length)return;const im=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({map,roughness:.5,metalness:.6,transparent:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,depthWrite:false}),L.length);im.renderOrder=2;
  L.forEach((p,i)=>{M.makeRotationY(rot?p[2]:rnd()*6).setPosition(p[0],.079,p[1]);im.setMatrixAt(i,M);});S.add(im);};
 mk(new THREE.CircleGeometry(.35,20).rotateX(-Math.PI/2),mhT,mh,0);mk(new THREE.PlaneGeometry(.4,.8).rotateX(-Math.PI/2),drT,dr,1);}
// signs (give way at non-signal junctions) — instanced poles + textured plates
const signTex=(f)=>new THREE.CanvasTexture(cv(128,128,f));
const giveT=signTex((g)=>{g.fillStyle='#fff';g.beginPath();g.moveTo(8,14);g.lineTo(120,14);g.lineTo(64,118);g.fill();g.strokeStyle='#d01818';g.lineWidth=14;g.stroke();});
const mainT=signTex((g)=>{g.translate(64,64);g.rotate(Math.PI/4);g.fillStyle='#fff';g.fillRect(-42,-42,84,84);g.fillStyle='#f2c418';g.fillRect(-30,-30,60,60);});
const pedT=signTex((g)=>{g.fillStyle='#1d5aa8';g.fillRect(0,0,128,128);g.fillStyle='#fff';g.beginPath();g.moveTo(64,14);g.lineTo(118,112);g.lineTo(10,112);g.fill();g.fillStyle='#111';g.fillRect(40,92,48,6);g.beginPath();g.arc(66,46,7,0,6.3);g.fill();g.fillRect(60,54,10,26);});
const busT=signTex((g)=>{g.fillStyle='#1d5aa8';g.fillRect(0,0,128,128);g.fillStyle='#fff';g.font='bold 90px sans-serif';g.textAlign='center';g.fillText('А',64,98);});
const SIGNS={give:[],main:[],ped:[],bus:[]};
function sign2(type,x,z,ang){SIGNS[type].push([x,z,ang]);}
junc.forEach(J=>{if(LIGHTS.some(l=>Math.hypot(l.x-J.p[0],l.z-J.p[1])<30))return;const s=Math.sin(J.ang),c=Math.cos(J.ang),o=J.w/2+1.5;
 sign2('main',J.p[0]-s*(o+6)+c*o,J.p[1]-c*(o+6)-s*o,J.ang);sign2('give',J.p[0]+c*(o+6)-s*o,J.p[1]-s*(o+6)-c*o,J.ang+Math.PI/2);});
C.cr.forEach(q=>{const s=Math.sin(q[2]),c=Math.cos(q[2]),o=q[3]/2+1.2;sign2('ped',q[0]+c*o-s*2,q[1]-s*o-c*2,q[2]);sign2('ped',q[0]-c*o+s*2,q[1]+s*o+c*2,q[2]+Math.PI);});
{const all=[].concat(...Object.values(SIGNS));const pm=new THREE.InstancedMesh(new THREE.CylinderGeometry(.04,.04,2.6,6).translate(0,1.3,0),poleM,all.length);
 all.forEach((p,i)=>{M.makeTranslation(p[0],0,p[1]);pm.setMatrixAt(i,M);});S.add(pm);
 const T2={give:giveT,main:mainT,ped:pedT,bus:busT};Object.keys(SIGNS).forEach(k=>{const L=SIGNS[k];if(!L.length)return;const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(.7,.7).translate(0,2.7,0),new THREE.MeshBasicMaterial({map:T2[k],transparent:true,side:THREE.DoubleSide,alphaTest:.3}),L.length);
  L.forEach((p,i)=>{M.makeRotationY(p[2]).setPosition(p[0],0,p[1]);im.setMatrixAt(i,M);});S.add(im);});}
// zebra crossings
{const zt=new THREE.CanvasTexture(cv(256,64,(g)=>{g.clearRect(0,0,256,64);g.fillStyle='rgba(245,245,240,.95)';for(let x=8;x<256;x+=32)g.fillRect(x,0,16,64);}));
 C.cr.forEach(q=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(q[3]-.4,3.2),new THREE.MeshLambertMaterial({map:zt,transparent:true,depthWrite:false}));m.geometry.rotateX(-Math.PI/2);m.position.set(q[0],.085,q[1]);m.rotation.y=q[2]+Math.PI/2;m.renderOrder=2;S.add(m);});}
// bus stops (OSM) with shelter, bench and sign
{const glassS=new THREE.MeshLambertMaterial({color:0x9fc0d8,transparent:true,opacity:.45}),frame=new THREE.MeshLambertMaterial({color:0x2e5a8a});
 C.bs.forEach(b=>{let [x,z,a,d]=b;const s=Math.sin(a),c=Math.cos(a);// move to sidewalk side (right of road direction relative to point)
  const g=new THREE.Group();g.position.set(x,.15,z);g.rotation.y=a;const box=(w,h,dd,m,px,py,pz)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,dd),m);o.position.set(px,py,pz);o.castShadow=true;g.add(o);};
  box(1.6,.08,4,frame,0,2.5,0);box(.05,2.4,4,glassS,.75,1.25,0);[-1.9,1.9].forEach(zz=>{box(.08,2.5,.08,frame,.75,1.25,zz);box(.08,2.5,.08,frame,-.7,1.25,zz);});box(.4,.08,2.6,new THREE.MeshLambertMaterial({color:0x8a5a3a}),.45,.5,0);
  S.add(g);sign2('bus',x+c*2.6,z-s*2.6,a);});
 if(SIGNS.bus.length){const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(.6,.6).translate(0,2.7,0),new THREE.MeshBasicMaterial({map:busT,side:THREE.DoubleSide}),SIGNS.bus.length);const pm=new THREE.InstancedMesh(new THREE.CylinderGeometry(.04,.04,2.6,6).translate(0,1.3,0),poleM,SIGNS.bus.length);
  SIGNS.bus.forEach((p,i)=>{M.makeRotationY(p[2]).setPosition(p[0],0,p[1]);im.setMatrixAt(i,M);pm.setMatrixAt(i,M);});S.add(im,pm);}}
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
const pBtn=add(new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.008,16),new THREE.MeshStandardMaterial({color:0x222222,emissive:0x000000})),0,.745,-.2);const knobHi=new THREE.Mesh(new THREE.TorusGeometry(.055,.004,6,32),new THREE.MeshBasicMaterial({color:0x4fb4ff,transparent:true,opacity:0}));add(knobHi,0,.68,-.2,-Math.PI/2);
const idr=add(new THREE.Mesh(new THREE.CylinderGeometry(.03,.032,.025,32),mAlu),0,.682,-.02);
add(new THREE.Mesh(new THREE.TorusGeometry(.12,.002,4,48,Math.PI),mAmb),0,.67,-.02,-Math.PI/2);
// seats hint
add(new THREE.Mesh(new THREE.BoxGeometry(1.8,.05,2.2),mSoft),0,.3,-.2);add(new THREE.Mesh(new THREE.BoxGeometry(1.7,.4,.05),mSoft),0,.45,-1.15);

// ---- detailed cabin: seats, belts, visors, roof console, climate, glovebox, door switches, pedals ----
const mSeat=new THREE.MeshStandardMaterial({map:tex(cv(256,256,(g,w,h)=>{g.fillStyle='#8c4e2e';g.fillRect(0,0,w,h);for(let i=0;i<6000;i++){g.fillStyle=`rgba(${rnd()<.5?'40,20,10':'200,140,100'},${.12*rnd()})`;g.beginPath();g.arc(rnd()*w,rnd()*h,.6+rnd()*1.5,0,6.3);g.fill();}}),2,2),roughness:.6});
const mSeatD=new THREE.MeshStandardMaterial({color:0x2a1d16,roughness:.7});
function seat(x,z,rear){const g=new THREE.Group();g.position.set(x,0,z);cab.add(g);const b=(w,h,d,r,m,px,py,pz,rx)=>{const o=rbox(w,h,d,r,m);o.position.set(px,py,pz);o.rotation.x=rx||0;g.add(o);return o;};
 const W=rear?1.3:.54;
 b(W,.14,.56,.06,mSeat,0,.5,-.02,.06);// cushion
 if(!rear){b(.13,.2,.56,.06,mSeat,-.25,.56,-.02,.06);b(.13,.2,.56,.06,mSeat,.25,.56,-.02,.06);}
 b(W,.72,.14,.06,mSeat,0,.92,.32,-.14);// backrest
 if(!rear){b(.12,.62,.18,.05,mSeat,-.25,.9,.3,-.14);b(.12,.62,.18,.05,mSeat,.25,.9,.3,-.14);}
 (rear?[-.42,0,.42]:[0]).forEach(hx=>{b(.26,.19,.11,.05,mSeat,hx,1.4,.4,-.1);const p=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.12),mAlu);p.position.set(hx,1.27,.39);g.add(p);});
 for(let k=0;k<4;k++)b(W*.72,.006,.11,.003,mStitch,0,.66+k*.14,.243,-.14);
 b(W,.06,.5,.02,mSeatD,0,.4,0);// base
 if(!rear){const r=b(.04,.04,.4,.015,mAlu,-.29,.38,0);}return g;}
seat(-.37,0,false);seat(.37,0,false);seat(0,1.05,true);
// rear cabin: roof extension, C-pillars, rear window frame, rear doors
add(rbox(1.6,.07,1.2,.03,mLiner),0,1.5,1.15);[-1,1].forEach(s=>{add(rbox(.06,.55,1.0,.02,mDash),s*.87,.66,1.1);add(rbox(.07,.05,1.0,.02,mDash2),s*.865,.935,1.1);add(rbox(.08,.55,.25,.03,mLiner),s*.8,1.22,1.65);});
add(rbox(1.5,.08,.06,.02,mLiner),0,1.46,1.72);add(rbox(1.5,.3,.1,.03,mDash2),0,.98,1.75);

pillar([.82,1.33,.52],[.12,.6,.12],.022,new THREE.MeshStandardMaterial({color:0x1a1a1c,roughness:.8}));
pillar([.82,1.33,.52],[.6,.6,.28],.02,new THREE.MeshStandardMaterial({color:0x1a1a1c,roughness:.8}));
add(rbox(.04,.07,.05,.015,mAlu),.12,.6,.12);
[-1,1].forEach(s=>{add(rbox(.42,.02,.2,.008,mLiner),s*.38,1.455,-.34,.25);add(rbox(.1,.004,.06,.002,new THREE.MeshStandardMaterial({color:0xd8dde2,roughness:.1,metalness:.6})),s*.38,1.444,-.33,.25);});
add(rbox(.32,.05,.2,.02,mDash2),0,1.46,-.24);[-.08,.08].forEach(x=>add(new THREE.Mesh(new THREE.CircleGeometry(.025,16),new THREE.MeshBasicMaterial({color:0xfff2d0})),x,1.433,-.24,Math.PI/2));
for(let k=0;k<3;k++)add(rbox(.04,.012,.025,.004,mGloss),-.05+k*.05,1.434,-.17);
add(rbox(.04,.01,.04,.004,new THREE.MeshBasicMaterial({color:0xd02020})),0,1.434,-.3);// SOS
// climate panel: two knobs, mini display
const clT=new THREE.CanvasTexture(cv(256,64,(g)=>{g.fillStyle='#050608';g.fillRect(0,0,256,64);g.fillStyle='#e8f2ff';g.font='bold 30px sans-serif';g.fillText('21.5°',10,42);g.fillText('21.5°',160,42);g.fillStyle='#4fb4ff';g.font='18px sans-serif';g.fillText('AUTO',100,40);}));
add(new THREE.Mesh(new THREE.PlaneGeometry(.2,.05),new THREE.MeshBasicMaterial({map:clT})),0,.71,-.537,-.25);
[-.115,.115].forEach(x=>{const k=new THREE.Mesh(new THREE.CylinderGeometry(.022,.024,.025,24),mAlu);add(k,x,.705,-.535,Math.PI/2-.25);});
// glovebox
add(rbox(.6,.18,.02,.01,mDash),.45,.68,-.556);add(rbox(.12,.02,.02,.006,mAlu),.45,.75,-.545);add(new THREE.Mesh(new THREE.BoxGeometry(.6,.003,.003),mStitch),.45,.775,-.548);
// door switches (driver door armrest)
for(let k=0;k<4;k++)add(rbox(.03,.012,.05,.005,mGloss),-.8,.795,-.12+(k%2)*.06+(k>1?.0:0)+(k>1?.0:0)+ (k>1? -.0:0),0,0,0);
add(rbox(.04,.012,.04,.006,mAlu),-.8,.797,.06);
// pedals
const pedG=new THREE.Group();pedG.position.set(-.37,.3,-.9);cab.add(pedG);
const gasP=rbox(.07,.24,.02,.008,mGloss);gasP.position.set(.14,.16,0);gasP.geometry.translate(0,.1,0);pedG.add(gasP);
const brkP=rbox(.17,.1,.02,.01,mGloss);brkP.position.set(-.04,.18,.03);pedG.add(brkP);
[gasP,brkP].forEach(p=>{const t=rbox(.9,.9,.1,.02,mAlu);});
const rest=rbox(.08,.2,.02,.008,mAlu);rest.position.set(-.26,.12,.05);pedG.add(rest);
cab.traverse(o=>{if(o.isMesh)o.castShadow=false;});
const cabLight=new THREE.PointLight(0xfff0e0,.45,2.5);cabLight.position.set(0,1.35,-.2);cab.add(cabLight);
const ambL=new THREE.PointLight(AMB,.25,1.2);ambL.position.set(0,.8,-.45);cab.add(ambL);
const cam=new THREE.PerspectiveCamera(innerWidth<innerHeight?95:68,innerWidth/innerHeight,.03,1500);cam.position.set(-.37,1.2,.05);cam.rotation.x=-.07;cab.add(cam);
// ---------- exterior X5-style body (chase view) — car frame: +Z forward ----------
const body=new THREE.Group();car.add(body);body.visible=false;
{const paint=new THREE.MeshStandardMaterial({color:0x2d4f93,roughness:.25,metalness:.6}),glass=new THREE.MeshStandardMaterial({color:0x10161c,roughness:.05,metalness:.6,transparent:true,opacity:.85}),
 blk=new THREE.MeshStandardMaterial({color:0x0c0c0d,roughness:.6}),chrome=new THREE.MeshStandardMaterial({color:0xd8dde2,roughness:.15,metalness:1});
 const B=(o,x,y,z,rx,ry,rz)=>{o.position.set(x,y,z);o.rotation.set(rx||0,ry||0,rz||0);o.castShadow=true;body.add(o);return o;};
 B(rbox(1.96,.72,4.9,.16,paint),0,.78,0);// lower body
 B(rbox(1.94,.12,1.55,.06,paint),0,1.16,1.55,.07);// hood slope
 B(rbox(1.72,.62,2.75,.18,glass),0,1.43,-.35);// greenhouse
 B(rbox(1.66,.07,2.4,.05,paint),0,1.76,-.45);// roof
 [-.6,.6].forEach(x=>B(rbox(.04,.03,2.2,.01,chrome),x,1.81,-.45));// roof rails
 B(rbox(2.0,.22,4.96,.08,blk),0,.36,0);// cladding/sills
 // kidney grille
 [-.2,.2].forEach(x=>{B(rbox(.34,.3,.06,.08,chrome),x,.92,2.45);B(rbox(.3,.26,.06,.07,blk),x,.92,2.465);});
 // headlights (thin LED slits) and DRL
 const hlM=new THREE.MeshBasicMaterial({color:0xdfefff});[-1,1].forEach(s=>{B(rbox(.42,.09,.05,.03,blk),s*.66,.98,2.43);B(new THREE.Mesh(new THREE.BoxGeometry(.36,.025,.02),hlM),s*.66,1.0,2.465);});
 window.tailM=new THREE.MeshBasicMaterial({color:0x550808});window.revM=new THREE.MeshBasicMaterial({color:0x333333});window.indM=new THREE.MeshBasicMaterial({color:0x553300});
 [-1,1].forEach(s=>{B(rbox(.5,.12,.05,.03,tailM),s*.64,1.1,-2.45);B(new THREE.Mesh(new THREE.BoxGeometry(.14,.06,.02),revM),s*.4,.75,-2.46);
  const i1=B(new THREE.Mesh(new THREE.BoxGeometry(.16,.05,.02),indM),s*.83,.95,2.44);i1.userData.side=s;const i2=B(new THREE.Mesh(new THREE.BoxGeometry(.14,.05,.02),indM),s*.86,1.1,-2.44);i2.userData.side=s;
  B(rbox(.12,.12,.24,.04,paint),s*1.0,1.25,.95,0,-s*.2);});
 B(rbox(1.6,.12,.05,.03,blk),0,.55,2.47);B(rbox(.52,.12,.02,.02,new THREE.MeshBasicMaterial({color:0xf2f2f2})),0,.6,-2.49);// plate
 // wheel arches
 [[1,1.48],[1,-1.48],[-1,1.48],[-1,-1.48]].forEach(([s,z])=>B(new THREE.Mesh(new THREE.TorusGeometry(.46,.07,6,16,Math.PI),blk),s*.97,.4,z,0,Math.PI/2));
}
const WH=[];{const tire=new THREE.MeshStandardMaterial({color:0x111111,roughness:.9}),rim=new THREE.MeshStandardMaterial({color:0xb0b4b8,roughness:.25,metalness:.9});
 [[1,1.48,1],[-1,1.48,1],[1,-1.48,0],[-1,-1.48,0]].forEach(([s,z,f])=>{const g=new THREE.Group();g.position.set(s*.86,.38,z);body.add(g);const sp=new THREE.Group();g.add(sp);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.28,24),tire);t.rotation.z=Math.PI/2;t.castShadow=true;sp.add(t);
  const r=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.29,18),rim);r.rotation.z=Math.PI/2;sp.add(r);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2,sk=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,.03),rim);sk.position.set(s*.15,Math.sin(a)*.12,Math.cos(a)*.12);sk.rotation.x=-a;sk.rotation.z=0;sp.add(sk);}
  WH.push({g,sp,f});});}
const chaseCam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.3,2000);let chase=false,chP=null;
function bodyTick(dt){const delta=st.steer*.6/(1+Math.abs(st.v)*.06);WH.forEach(w=>{if(w.f)w.g.rotation.y=delta;w.sp.rotation.x+=st.v/.38*dt;});
 tailM.color.setHex(st.brk>.1||st.held?0xff1010:(lights?0x8a1010:0x400606));revM.color.setHex(st.sel==='R'?0xffffff:0x333333);
 body.children.forEach(o=>{if(o.userData.side){const on=(st.haz||st.ind===o.userData.side*-1||st.ind===o.userData.side)&&indOn;}});
 const iL=(st.haz||st.ind===-1)&&indOn,iR=(st.haz||st.ind===1)&&indOn;body.children.forEach(o=>{if(o.userData.side){o.material=o.userData.side>0?(iL?indOnM:indM):(iR?indOnM:indM);}});
 if(chase){const s=Math.sin(st.h),c=Math.cos(st.h);const tx=st.x-s*6.2,tz=st.z-c*6.2;if(!chP)chP=new THREE.Vector3(tx,2.4,tz);chP.lerp(new THREE.Vector3(tx,2.4,tz),Math.min(1,dt*10));chaseCam.position.copy(chP);chaseCam.lookAt(st.x+s*3,1.1,st.z+c*3);}}
const indOnM=new THREE.MeshBasicMaterial({color:0xffa010});
function setChase(v){chase=v;body.visible=v;cab.visible=!v;chP=null;const b=document.getElementById('bCam');if(b)b.classList.toggle('a',v);}
const topCam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,1,3000);
// minimap for center screen
const MS=0.55,mapC=cv(1800,1800,(g,w,h)=>{g.fillStyle='#16202a';g.fillRect(0,0,w,h);g.lineCap='round';
 C.g.forEach(p=>{g.fillStyle='#1f3a28';g.beginPath();p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.fill();});
 C.b.forEach(b=>{g.fillStyle='#34404c';g.beginPath();b.p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.fill();});
 C.r.forEach(r=>{if(r.w<4)return;g.strokeStyle=r.w>=8?'#e8b060':'#9aa8b4';g.lineWidth=Math.max(2,r.w*MS);g.beginPath();r.p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.stroke();});});
function drawDisp(v,steer){const g=dg,kmh=Math.abs(v)*3.6,gear=st.sel==='D'?'D'+(st.g+1):st.sel,rpm=st.rpm;
 g.fillStyle='#05070a';g.fillRect(0,0,1024,256);
 // cluster
 let gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#0d1622');gr.addColorStop(1,'#03050a');g.fillStyle=gr;g.fillRect(0,0,500,256);
 function arc(cx,val,max,color,label){g.lineWidth=10;g.strokeStyle='#1c2836';g.beginPath();g.arc(cx,150,95,Math.PI*.8,Math.PI*2.2);g.stroke();g.strokeStyle=color;g.beginPath();g.arc(cx,150,95,Math.PI*.8,Math.PI*(.8+1.4*Math.min(1,val/max)));g.stroke();
  g.fillStyle='#8fa4b8';g.font='16px sans-serif';g.textAlign='center';g.fillText(label,cx,232);}
 arc(110,kmh,260,'#4fb4ff','км/ч');arc(390,rpm,7000,rpm>5500?'#ff5040':'#ff9a30','×1000 об/мин');
 g.textAlign='center';g.fillStyle='#fff';g.font='bold 92px sans-serif';g.fillText(Math.round(kmh),250,150);g.font='15px sans-serif';g.fillStyle='#8fa4b8';g.fillText('км/ч',250,172);g.fillStyle='#fff';g.font='bold 22px sans-serif';g.fillText((rpm/1000).toFixed(1),390,205);
 g.fillStyle=st.sel==='R'?'#ff6040':st.sel==='P'?'#ffffff':'#4fb4ff';g.font='bold 72px sans-serif';g.fillText(gear,390,170);g.fillStyle='#8fa4b8';g.font='15px sans-serif';g.fillText('ЛЫТКАРИНО  '+new Date().toTimeString().slice(0,5),250,40);if(!st.on&&st.crank<=0){g.fillStyle='rgba(0,0,0,.75)';g.fillRect(0,0,500,256);g.fillStyle='#ff6050';g.font='bold 28px sans-serif';g.textAlign='center';g.fillText('START ENGINE ⏻',250,130);}
 const blinkOn=indOn;g.fillStyle='#30e060';g.font='bold 30px sans-serif';if((st.ind<0||st.haz)&&blinkOn)g.fillText('◀',30,40);if((st.ind>0||st.haz)&&blinkOn)g.fillText('▶',470,40);
 g.font='bold 14px sans-serif';if(st.epb){g.fillStyle='#ff3030';g.fillText('(P)',60,240);}if(st.held){g.fillStyle='#30e060';g.fillText('(A)',95,240);}if(st.cruise){g.fillStyle='#30e060';g.fillText('⏲ '+Math.round(st.cruise*3.6),420,240);}if(st.launch){g.fillStyle='#ff4030';g.fillText('LAUNCH',250,60);}
 if(st.pdc<2.5){g.fillStyle=st.pdc<.6?'#ff3030':st.pdc<1.4?'#ffb020':'#30e060';g.fillRect(200,226,100*(1-st.pdc/2.5),6);}
 const MN=['COMFORT','SPORT','SPORT+'][st.mode];g.fillStyle=['#4fb4ff','#ff9a30','#ff4030'][st.mode];g.font='bold 18px sans-serif';g.fillText(MN,250,205);
 const lamp=(t,x,on,c)=>{g.font='bold 15px sans-serif';g.fillStyle=on?c:'#1c2430';g.fillText(t,x,240);};const bl=(performance.now()/120|0)%2;
 lamp('ABS',190,st.abs&&bl,'#ffb020');lamp(st.mode==2?'DSC OFF':'DSC',250,st.mode==2||((st.dsc||st.tc)&&bl),'#ffb020');lamp('TC',310,st.tc&&bl,'#ffb020');if(!st.road){g.fillStyle='#8fa4b8';g.font='13px sans-serif';g.fillText('грунт',250,188);}
 g.fillStyle='#000';g.fillRect(500,0,12,256);
 // center screen: nav map
 g.save();g.beginPath();g.rect(512,0,512,256);g.clip();g.translate(768,170);g.rotate(Math.PI+st.h);g.scale(1.6,1.6);g.drawImage(mapC,-mapC.width/2-st.x*MS,-mapC.height/2-st.z*MS);g.restore();
 g.fillStyle='#4fb4ff';g.beginPath();g.moveTo(768,155);g.lineTo(756,182);g.lineTo(768,176);g.lineTo(780,182);g.fill();
 g.fillStyle='rgba(5,10,16,.8)';g.fillRect(512,0,512,36);g.fillStyle='#fff';g.font='18px sans-serif';g.textAlign='left';g.fillText('Навигация   '+Math.round(kmh)+' км/ч',528,25);g.textAlign='right';g.fillText('22°C   ♪ Радио Лыткарино',1010,25);
 dispT.needsUpdate=true;}
// ---------- spawn ----------
let best=null,bl=1e9;major.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),D=Math.hypot(a[0],a[1]);if(L>60&&D<bl){bl=D;best=[a,b];}}});
const h0=Math.atan2(best[1][0]-best[0][0],best[1][1]-best[0][1]),off=1.6;
const DEMO0=demo||Q.includes('on');const st={x:best[0][0]+Math.sin(h0)*8-Math.cos(h0)*off,z:best[0][1]+Math.cos(h0)*8+Math.sin(h0)*off,h:h0,vx:0,vz:0,r:0,v:0,vl:0,steer:0,thr:0,brk:0,g:0,rpm:800,rev:false,shift:0,along:0,alat:0,road:true,hb:0,sel:'D',mode:1,abs:0,tc:0,dsc:0,on:DEMO0,crank:0,ind:0,haz:false,cruise:0,hud:false,autohold:true,held:false,epb:false,launch:0,pdc:9};
const start=JSON.parse(JSON.stringify(st));
// road lookup grid (for grip)
const RG={};drive.concat(C.r.filter(r=>r.w>=3&&r.w<4)).forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1];const seg=[a,b,r.w/2+.8];const xs=[a[0],b[0]],zs=[a[1],b[1]];
 for(let gx=Math.floor((Math.min(...xs)-8)/20);gx<=Math.floor((Math.max(...xs)+8)/20);gx++)for(let gz=Math.floor((Math.min(...zs)-8)/20);gz<=Math.floor((Math.max(...zs)+8)/20);gz++)(RG[gx+','+gz]=RG[gx+','+gz]||[]).push(seg);}});
function segD(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],L=dx*dx+dz*dz||1;let t=((x-a[0])*dx+(z-a[1])*dz)/L;t=Math.max(0,Math.min(1,t));const px=a[0]+dx*t,pz=a[1]+dz*t;return[Math.hypot(x-px,z-pz),px,pz];}
function onRoad(x,z){const l=RG[Math.floor(x/20)+','+Math.floor(z/20)];return !!l&&l.some(s=>segD(x,z,s[0],s[1])[0]<s[2]);}
function wallN(x,z){const l=Gd[Math.floor(x/CS)+','+Math.floor(z/CS)]||[];let bd=1e9,n=null;l.forEach(p=>{for(let i=0;i<p.length;i++){const d=segD(x,z,p[i],p[(i+1)%p.length]);if(d[0]<bd){bd=d[0];n=[x-d[1],z-d[2]];}}});
 if(!n)return null;const L=Math.hypot(n[0],n[1])||1;n=[n[0]/L,n[1]/L];return hit(x,z)?[-n[0],-n[1]]:n;}
// ---------- input ----------
const K={};addEventListener('keydown',e=>{K[e.code]=1;if(e.code=='Backspace')Object.assign(st,JSON.parse(JSON.stringify(start)));if(e.code=='Space')e.preventDefault();audioInit();});addEventListener('keyup',e=>K[e.code]=0);
const T={steer:0,gas:0,brk:0,hb:0};let swAng=0,swHeld=false;
function setGear(g){const sp=Math.abs(st.v)*3.6;if(g===st.sel)return;if(sp>3&&!(g==='N'))return flash();st.sel=g;st.rev=g==='R';if(g!=='D')st.g=0;updGsel();}
function flash(){const e=document.getElementById('lever');if(e){e.style.outline='2px solid #f44';setTimeout(()=>e.style.outline='',300);}}
function gearMove(d){const ord=['R','N','D'];const i=ord.indexOf(st.sel);if(st.sel==='P')setGear(d<0?'R':'D');else setGear(ord[Math.max(0,Math.min(2,i+d))]);knobKick=d;}
let knobKick=0;
function updGsel(){const p=document.getElementById('lvp');if(p)p.setAttribute('fill',st.sel==='P'?'#2f86ff':'#333');}
addEventListener('keydown',e=>{if(e.code=='KeyP')setGear('P');if(e.code=='KeyR')setGear('R');if(e.code=='KeyN')setGear('N');if(e.code=='KeyE'||(e.code=='KeyD'&&e.shiftKey))setGear('D');});
if(mobile||Q.includes('touch')){const tc=document.getElementById('tc');tc.classList.add('on');document.body.classList.add('tch');
 const sw=document.getElementById('sw'),swg=document.getElementById('swg');let sid=null,last=0;
 const ang=(t)=>{const r=sw.getBoundingClientRect();return Math.atan2(t.clientY-(r.top+r.height/2),t.clientX-(r.left+r.width/2))*180/Math.PI;};
 const find=(e,id)=>{for(const t of e.changedTouches)if(t.identifier===id)return t;return null;};
 sw.addEventListener('touchstart',e=>{e.preventDefault();audioInit();const t=e.changedTouches[0];sid=t.identifier;last=ang(t);swHeld=true;},{passive:false});
 sw.addEventListener('touchmove',e=>{e.preventDefault();const t=find(e,sid);if(!t)return;const a=ang(t);let d=a-last;if(d>180)d-=360;if(d<-180)d+=360;last=a;swAng=Math.max(-450,Math.min(450,swAng+d));},{passive:false});
 const swEnd=e=>{if(find(e,sid)){sid=null;swHeld=false;}};sw.addEventListener('touchend',swEnd);sw.addEventListener('touchcancel',swEnd);
 window.__swg=swg;
 [['gasP','gas'],['brkP','brk']].forEach(([id,k])=>{const el=document.getElementById(id),bar=el.querySelector('i');let pid=null;
  const upd=t=>{const r=el.getBoundingClientRect();const v=Math.max(.35,Math.min(1,1-(t.clientY-r.top)/r.height+.15));T[k]=v;bar.style.height=(v*100)+'%';};
  el.addEventListener('touchstart',e=>{e.preventDefault();audioInit();const t=e.changedTouches[0];pid=t.identifier;upd(t);},{passive:false});
  el.addEventListener('touchmove',e=>{e.preventDefault();const t=find(e,pid);if(t)upd(t);},{passive:false});
  const end=e=>{if(find(e,pid)){pid=null;T[k]=0;bar.style.height='0';}};el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);});
 const hbE=document.getElementById('hb');hbE.addEventListener('touchstart',e=>{e.preventDefault();T.hb=1;hbE.style.background='#c33';},{passive:false});const hbEnd=()=>{T.hb=0;hbE.style.background='';};hbE.addEventListener('touchend',hbEnd);hbE.addEventListener('touchcancel',hbEnd);
 {const lv=document.getElementById('lever'),k=document.getElementById('lvk'),pb=document.getElementById('lvp');let lid=null,y0=0,done=false;
  const move=gearMove;
  lv.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];const r=pb.getBoundingClientRect();if(t.clientY<r.bottom+4&&t.clientY>r.top-6){setGear('P');return;}lid=t.identifier;y0=t.clientY;done=false;},{passive:false});
  lv.addEventListener('touchmove',e=>{e.preventDefault();const t=find(e,lid);if(!t)return;const dy=Math.max(-22,Math.min(22,t.clientY-y0));k.setAttribute('transform','translate(0,'+dy*.6+')');if(!done&&Math.abs(dy)>=20){done=true;move(dy<0?-1:1);}},{passive:false});
  const le=e=>{if(find(e,lid)){lid=null;k.setAttribute('transform','');}};lv.addEventListener('touchend',le);lv.addEventListener('touchcancel',le);}
}
updGsel();{const m=/swa=(-?\d+)/.exec(Q);if(m){swAng=+m[1];swHeld=true;}}
function swTick(dt){if(!swHeld)swAng*=Math.exp(-dt*5);if(Math.abs(swAng)<.3&&!swHeld)swAng=0;T.steer=swAng/450;if(window.__swg)window.__swg.setAttribute('transform','rotate('+swAng.toFixed(1)+')');}
// ---------- engine sound (WebAudio) ----------
let AU=null;function audioInit(){if(AU||demo)return;try{const ac=new (window.AudioContext||window.webkitAudioContext)();const o1=ac.createOscillator(),o2=ac.createOscillator(),o3=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();
 o1.type='sawtooth';o2.type='square';o3.type='triangle';f.type='lowpass';f.Q.value=4;g.gain.value=0;[o1,o2,o3].forEach(o=>{o.connect(f);o.start();});f.connect(g);g.connect(ac.destination);
 const nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;const ns=ac.createBufferSource();ns.buffer=nb;ns.loop=true;const nf=ac.createBiquadFilter();nf.type='bandpass';nf.frequency.value=900;nf.Q.value=.8;const ng=ac.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(ac.destination);ns.start();
 AU={ac,o1,o2,o3,f,g,ng};}catch(e){}}
function audioUpd(){if(!AU)return;const t=AU.ac.currentTime,fq=st.rpm/60*3;AU.o1.frequency.setTargetAtTime(fq,t,.03);AU.o2.frequency.setTargetAtTime(fq*.5,t,.03);AU.o3.frequency.setTargetAtTime(fq*2.01,t,.03);
 AU.f.frequency.setTargetAtTime(300+st.thr*1800+st.rpm*.15,t,.05);AU.g.gain.setTargetAtTime(st.rpm>0?.05+st.thr*.09:0,t,.05);AU.ng.gain.setTargetAtTime(Math.min(.25,Math.max(0,Math.abs(st.vl)-2.5)*.04),t,.05);}
// ---------- arcade-sim driving ----------
const DYNO=Q.includes('dyno');const GR=[5.0,3.2,2.143,1.72,1.314,1.0,.822,.64],FD=3.15,RW=.36,MASS=2200,WB=2.97;// BMW X5 xDrive40i: 280 kW, 540 Nm, ZF 8HP
function torque(rpm){if(rpm>6600)return 0;if(rpm<1850)return 380+160*Math.max(0,rpm-1000)/850;return Math.min(540,280000/(rpm*Math.PI/30));}
function step(dt){
 let thrIn=(K.KeyW||K.ArrowUp)?1:T.gas,brkIn=(K.KeyS||K.ArrowDown)?1:T.brk,stIn=(K.KeyA||K.ArrowLeft?1:0)-((K.KeyD&&!K.ShiftLeft&&!K.ShiftRight)||K.ArrowRight?1:0)-T.steer,hb=(K.Space||T.hb)?1:0;
 if(demo){thrIn=Q.includes('full')?1:Q.includes('cruise')?(st.v<36?.5:.3):(st.v<16?1:.35);brkIn=0;stIn=0;hb=0;}
 const s=Math.sin(st.h),c=Math.cos(st.h);let vf=st.vx*s+st.vz*c,vl=st.vx*c-st.vz*s;
 // reverse logic
 swTick(dt);st.rev=st.sel==='R';const drv=st.sel==='D'||st.sel==='R';
 if(st.cruise){if(brkIn>.1)st.cruise=0;else thrIn=Math.max(thrIn,Math.max(0,Math.min(1,(st.cruise-st.v)*.35+.22)));}
 if(st.mode==2&&st.on&&st.sel==='D'&&Math.abs(st.v)<.5&&brkIn>.5&&thrIn>.8)st.launch=1;else if(st.launch==1&&brkIn<.2&&thrIn>.8)st.launch=2;else if(st.launch==1)st.launch=0;if(st.launch==2&&(thrIn<.5||st.v>28))st.launch=0;
 if(st.autohold&&Math.abs(st.v)<.3&&brkIn>.3&&st.sel!=='P')st.held=true;if(thrIn>.1){st.held=false;if(st.sel==='D'||st.sel==='R')st.epb=false;}
 if(!st.on)thrIn=0;
 const wantT=thrIn,wantB=(st.launch==1)?1:brkIn;
 const MODE=[{thr:3,up:.85,st:3.0,dsc:1},{thr:6,up:1,st:3.5,dsc:.6},{thr:10,up:1.08,st:4.2,dsc:0}][st.mode];st.thr+=(wantT-st.thr)*Math.min(1,dt*MODE.thr);st.brk+=(wantB-st.brk)*Math.min(1,dt*8);
 const sr=Math.abs(stIn)>Math.abs(st.steer)?MODE.st:6;st.steer+=(stIn-st.steer)*Math.min(1,dt*sr);
 st.road=DYNO||onRoad(st.x,st.z);
 // gearbox
 const sp=Math.abs(vf);if(st.rev){st.g=0;}else{const rpmG=sp/RW*GR[st.g]*FD*9.549;const up=Math.min(6500,(1700+Math.pow(st.thr,1.5)*4700)*MODE.up),dn=1050+Math.pow(st.thr,2)*3300;if(rpmG>up&&st.g<7&&st.shift<=0){st.g++;st.shift=.15;}else if(st.g>0&&rpmG<dn&&st.shift<=0&&sp/RW*GR[st.g-1]*FD*9.549<6200){st.g--;st.shift=.12;}}
 const ratio=st.rev?3.5:GR[st.g];let rpm=drv?sp/RW*ratio*FD*9.549:0;rpm=Math.max(rpm,800+st.thr*(drv?(sp<3?2200:0):5200));if(st.launch==1)rpm=3500;if(st.crank>0){st.crank-=dt;rpm=800+Math.sin(Math.max(0,st.crank)/.9*Math.PI)*900;}if(!st.on&&st.crank<=0)rpm=0;st.rpm+=(Math.min(6800,rpm)-st.rpm)*Math.min(1,dt*10);
 st.shift=Math.max(0,st.shift-dt);
 let F=torque(st.rpm)*ratio*FD/RW*st.thr*.85*(st.shift>0?0:1);const cap=(st.road?(st.launch==2?.85:.75):.45)*9.81*MASS;if(!st.on)F=0;st.tc=0;let spin=0;if(F>cap){if(MODE.dsc>0){F=cap;st.tc=F>0?1:0;}else{spin=Math.min(1,(F-cap)/cap);F=cap*.92;}}if(st.rev)F=Math.min(F,4000);if(!drv)F=0;
 const roll=(st.road?260:1400)+(st.road?0:.6*sp*sp),drag=.55*vf*vf;
 let a=(st.rev?-F:F)/MASS;a-=Math.sign(vf)*(roll+drag)/MASS;
 let brkRaw=st.brk*21000;const bcap=(st.road?1.0:.55)*9.81*MASS;st.abs=brkRaw>bcap&&sp>2?1:0;if(st.abs)brkRaw=bcap*(.9+Math.random()*.1);const brkF=(brkRaw+hb*6000)/MASS;
 const vfOld=vf;vf+=a*dt;if(Math.abs(vf)>.05){const nv=vf-Math.sign(vf)*brkF*dt;vf=Math.sign(nv)!==Math.sign(vf)?0:nv;}else if(!st.thr)vf=0;
 vf=Math.max(-9,Math.min(250/3.6,vf));if(st.sel==='P'||((st.epb||st.held)&&st.thr<.1&&Math.abs(vf)<1.5)){vf=0;st.vx=st.vz=0;}
 st.along+=(((vf-vfOld)/dt)-st.along)*Math.min(1,dt*4);
 // steering & yaw (speed-dependent, weight transfer, grip)
 const maxA=.6/(1+Math.abs(vf)*.06),delta=st.steer*maxA,wt=Math.max(.75,Math.min(1.3,1-st.along*.035));
 let grip=(st.road?1:.6)*(hb?.22:1)*(1-spin*.6);let target=vf*Math.tan(delta)/WB*wt*(hb?1.7:1);
 st.r+=(target-st.r)*Math.min(1,dt*(2+9*grip));st.h+=st.r*dt;
 st.dsc=0;if(MODE.dsc>0&&Math.abs(vl)>(MODE.dsc>.8?1.2:2.6)&&!hb){st.dsc=1;vl*=Math.exp(-dt*6*MODE.dsc);st.r+=(target-st.r)*Math.min(1,dt*6*MODE.dsc);st.thr*=1-dt*3*MODE.dsc;}
 vl*=Math.exp(-dt*11*grip);
 const s2=Math.sin(st.h),c2=Math.cos(st.h);
 // re-project: velocity keeps world direction partly (gives slide when grip low)
 let nvx=s2*vf+c2*vl,nvz=c2*vf-s2*vl;const keep=hb?.92:(st.road?.0:.3);nvx=nvx*(1-keep)+st.vx*keep*(Math.abs(vf)>.5?1:0);nvz=nvz*(1-keep)+st.vz*keep*(Math.abs(vf)>.5?1:0);
 st.vx=nvx;st.vz=nvz;st.vl=st.vx*c2-st.vz*s2;st.v=st.vx*s2+st.vz*c2;st.alat=st.v*st.r;
 // movement + sliding collisions
 const nx=st.x+st.vx*dt,nz=st.z+st.vz*dt;let hitPt=null;
 for(const [ax,bz] of [[.95,2.35],[-.95,2.35],[.95,-2.35],[-.95,-2.35],[.95,0],[-.95,0]]){const px=nx+ax*c2+bz*s2,pz=nz-ax*s2+bz*c2;if(hit(px,pz)){hitPt=[px,pz];break;}}
 let n=null;if(hitPt&&!DYNO)n=wallN(hitPt[0],hitPt[1]);if(DYNO)AI.length=0;
 AI.forEach(o=>{const dx=nx-o.g.position.x,dz=nz-o.g.position.z,d=Math.hypot(dx,dz);if(d<3.4){n=[dx/d,dz/d];}});
 if(n){const vn=st.vx*n[0]+st.vz*n[1];if(vn<0){st.vx-=1.35*vn*n[0];st.vz-=1.35*vn*n[1];st.vx*=.82;st.vz*=.82;}st.x+=n[0]*.08;st.z+=n[1]*.08;st.r*=.5;}
 else{st.x=nx;st.z=nz;}
 audioUpd();}
let TNOW=0;function updAI(dt){TNOW+=dt;updLights(TNOW);AI.forEach(a=>{const L=a.o.c[a.o.c.length-1];let ahead=Math.hypot(a.g.position.x-st.x,a.g.position.z-st.z)<7||aiMustStop(a.g.position.x,a.g.position.z,a.g.rotation.y,TNOW)||AI.some(b=>b!==a&&Math.hypot(b.g.position.x-a.g.position.x,b.g.position.z-a.g.position.z)<6&&((b.g.position.x-a.g.position.x)*Math.sin(a.g.rotation.y)+(b.g.position.z-a.g.position.z)*Math.cos(a.g.rotation.y))>2);a.s+=a.d*a.v*dt*(ahead?0:1);if(a.s>L-2||a.s<2){a.d*=-1;a.s=Math.max(2,Math.min(L-2,a.s));}
 const p=at(a.o.r,a.o.c,a.s,a.d*a.o.r.w/4);a.g.position.set(p[0],0,p[1]);a.g.rotation.y=p[2]+(a.d<0?Math.PI:0);});
 ped.forEach((p,i)=>{const L=p.o.c[p.o.c.length-1];p.s+=p.d*p.v*dt;if(p.s>L-1||p.s<1)p.d*=-1;const q=at(p.o.r,p.o.c,p.s,p.side),t=performance.now()/300+i;
  M.makeRotationY(q[2]+(p.d<0?Math.PI:0)).setPosition(q[0],Math.abs(Math.sin(t))*.05,q[1]);pb.setMatrixAt(i,M);ph.setMatrixAt(i,M);pl.setMatrixAt(i,M);});
 pb.instanceMatrix.needsUpdate=ph.instanceMatrix.needsUpdate=pl.instanceMatrix.needsUpdate=true;}
if(/ff=(\d+)/.test(Q)){const n=+/ff=(\d+)/.exec(Q)[1];for(let i=0;i<n;i++){step(1/60);{const k=st.v*3.6;window.__m=window.__m||{};[100,200,250].forEach(x=>{if(k>=x-.05&&!window.__m[x]){window.__m[x]=(i/60).toFixed(2);console.log('REACH',x,'kmh at',window.__m[x],'s');}});if(i%600==0)console.log('T',(i/60).toFixed(0),'kmh',k.toFixed(1),'g',st.g+1);}}}
let LK=null;{const m=/lm=([^&]+)/.exec(Q);if(m){const n=decodeURIComponent(m[1]),b=C.b.find(b=>b.n&&b.n.includes(n));if(b){let cx=0,cz=0;b.p.forEach(q=>{cx+=q[0];cz+=q[1];});cx/=b.p.length;cz/=b.p.length;const ang=+(/ang=([-\d.]+)/.exec(Q)||[0,0.6])[1];LK=[cx,cz,Math.cos(ang),Math.sin(ang)];}}}
let last=performance.now(),fr=0;
function frame(t){const dt=Math.min(0.05,(t-last)/1000)||0.016;last=t;step(dt);updAI(dt);
 car.position.set(st.x,0,st.z);car.rotation.y=st.h;swr.rotation.z=st.steer*2.4;gasP.rotation.x=-st.thr*.35;brkP.position.z=.03-st.brk*.05;
 const vib=st.rpm>4500?(Math.random()-.5)*.0006*(st.rpm-4500)/2000:0;if(lookBack){cam.position.set(0,1.32,-.15);}else cam.position.set(-.37+st.alat*.0025,1.29+vib-Math.max(0,-st.along)*.002,.05+st.along*.004);lookTick(dt);cam.rotation.set(lookBack?-.05:-.15+st.along*.0045+lookP,lookBack?Math.PI:lookY,-st.alat*.004);
 sun.position.set(st.x+80,150,st.z+60);sun.target.position.set(st.x,0,st.z);
 if(fr++%3==0)drawDisp(st.v,st.steer);
 if(LK){topCam.position.set(LK[0]+LK[2]*45,30,LK[1]+LK[3]*45);topCam.lookAt(LK[0],6,LK[1]);R.render(S,topCam);}else if(topv){topCam.position.set(st.x-200,300,st.z+250);topCam.lookAt(st.x,0,st.z);R.render(S,topCam);}else{featTick(dt);uiTick();bodyTick(dt);if(chase)R.render(S,chaseCam);else{renderMirrors();renderRearCam();R.render(S,cam);}}
 requestAnimationFrame(frame);}

// ---------- headlights / time of day / look back ----------
let lookBack=false,lights=false,tod=0;
const hemi=S.children.find(o=>o.isHemisphereLight);
const hl=new THREE.SpotLight(0xfff4d8,0,90,.5,.45,1.2);hl.position.set(0,1,2.2);const hlT=new THREE.Object3D();hlT.position.set(0,0,22);car.add(hl,hlT);hl.target=hlT;
function skyTex(a,b,c){return tex(cv(2,256,(g)=>{const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,a);gr.addColorStop(.6,b);gr.addColorStop(1,c);g.fillStyle=gr;g.fillRect(0,0,2,256);}));}
const TOD=[{n:'☀️',sky:S.background,fog:0xc9dbe6,sun:.85,sc:0xfff2dd,hemi:.75,lamp:0xfff6d8},
 {n:'🌆',sky:skyTex('#2b2f5a','#d9875a','#f2c48a'),fog:0xc9a08a,sun:.45,sc:0xffb070,hemi:.45,lamp:0xffd890},
 {n:'🌙',sky:skyTex('#02040c','#0b1430','#1b2440'),fog:0x0b1020,sun:.05,sc:0x8090c0,hemi:.12,lamp:0xffe2a0}];
function applyTod(){const t=TOD[tod];S.background=t.sky;S.fog.color.setHex(t.fog);sun.intensity=t.sun;sun.color.setHex(t.sc);if(hemi)hemi.intensity=t.hemi;head.material.color.setHex(tod==2?0xffe9b0:0xfff6d8);
 if(tod==2&&!lights)setLights(true);document.getElementById('bTod').textContent=t.n;}
function setLights(v){lights=v;hl.intensity=v?2.2:0;document.getElementById('bLt').classList.toggle('a',v);}
function setMode(m){st.mode=m;const b=document.getElementById('bMode');b.style.color=['#8cf','#fb6','#f66'][m];}document.getElementById('bMode').onclick=()=>setMode((st.mode+1)%3);addEventListener('keydown',e=>{if(e.code=='KeyM')setMode((st.mode+1)%3);});setMode(st.mode);{const m=/mode=(\d)/.exec(Q);if(m)setMode(+m[1]);}
document.getElementById('bLt').onclick=()=>setLights(!lights);
document.getElementById('bTod').onclick=()=>{tod=(tod+1)%3;applyTod();};
{const b=document.getElementById('bBack');const on=e=>{e.preventDefault();lookBack=true;b.classList.add('a');},off=()=>{lookBack=false;b.classList.remove('a');};
 b.addEventListener('touchstart',on,{passive:false});b.addEventListener('touchend',off);b.addEventListener('mousedown',on);addEventListener('mouseup',off);}
addEventListener('keydown',e=>{if(e.code=='KeyL')setLights(!lights);if(e.code=='KeyT'){tod=(tod+1)%3;applyTod();}if(e.code=='KeyB')lookBack=true;if(e.code=='KeyF')document.getElementById('fs').onclick&&document.getElementById('fs').onclick();});
addEventListener('keyup',e=>{if(e.code=='KeyB')lookBack=false;});
if(Q.includes('back'))lookBack=true;{const m=/tod=(\d)/.exec(Q);if(m){tod=+m[1];applyTod();}}

// ---------- head look + in-cabin 3D shifter ----------
let lookY=0,lookP=0,lookHold=0;{const m=/look=(-?[\d.]+),(-?[\d.]+)/.exec(Q);if(m){lookY=+m[1];lookP=+m[2];lookHold=1e9;}}
cam.rotation.order='YXZ';const rc=new THREE.Raycaster(),v2=new THREE.Vector2();
function knobHit(x,y){v2.set(x/innerWidth*2-1,-(y/innerHeight)*2+1);rc.setFromCamera(v2,cam);const h=rc.intersectObjects([knob,pBtn,knobHi],false)[0];return h?(h.object===pBtn?'P':'K'):null;}
{const el=R.domElement;let pid=null,mode=null,x0=0,y0=0,lx=0,ly=0,done=false;
 const start=(id,x,y)=>{pid=id;x0=lx=x;y0=ly=y;done=false;mode=knobHit(x,y)||'look';if(mode==='P'){setGear('P');knobKick=.5;mode=null;}};
 const mv=(x,y)=>{if(mode==='look'){lookY+=(x-lx)*.006;lookP=Math.max(-1.2,Math.min(.5,lookP+(y-ly)*.005));lookHold=1.5;}else if(mode==='K'&&!done&&Math.abs(y-y0)>18){done=true;gearMove(y<y0?-1:1);}lx=x;ly=y;};
 el.addEventListener('touchstart',e=>{const t=e.changedTouches[0];if(pid===null)start(t.identifier,t.clientX,t.clientY);},{passive:true});
 el.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===pid)mv(t.clientX,t.clientY);},{passive:true});
 el.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===pid){pid=null;mode=null;}});
 el.addEventListener('mousedown',e=>start('m',e.clientX,e.clientY));addEventListener('mousemove',e=>{if(pid==='m')mv(e.clientX,e.clientY);});addEventListener('mouseup',()=>{if(pid==='m'){pid=null;mode=null;}});}
function lookTick(dt){lookHold-=dt;if(lookHold<0){lookY*=Math.exp(-dt*2.5);lookP*=Math.exp(-dt*2.5);}
 const near=lookP<-.55&&lookY<-.5&&lookY>-1.5;knobHi.material.opacity=near?.9:0;knob.material.emissive=knob.material.emissive||new THREE.Color();knob.material.emissive.setHex(near?0x1a4a80:0);
 knobKick*=Math.exp(-dt*6);knob.position.z=-.2+knobKick*.03;}

// ---------- real mirrors (render targets) ----------
const MIR=[];function mirror(w,h,pos,ry,cpos,cry,fov){const rt=new THREE.WebGLRenderTarget(256,128);const c=new THREE.PerspectiveCamera(fov,w/h,.3,400);c.position.set(...cpos);c.rotation.set(0,cry,0);cab.add(c);
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:rt.texture,side:THREE.DoubleSide}));m.position.set(...pos);m.rotation.y=ry;m.scale.x=-1;cab.add(m);MIR.push({rt,c});}
mirror(.2,.05,[0,1.42,-.452],0,[0,1.4,-.3],Math.PI,28);
mirror(.2,.1,[-1.0,1.0,-.668],-.25,[-1.06,1.0,-.75],Math.PI-.3,40);
mirror(.2,.1,[1.0,1.0,-.668],.25,[1.06,1.0,-.75],Math.PI+.3,40);
let mfr=0;function renderMirrors(){if(mobile&&(mfr++%2))return;MIR.forEach(o=>{R.setRenderTarget(o.rt);R.render(S,o.c);});R.setRenderTarget(null);}
// ---------- BMW features: Start/Stop, indicators, cruise, PDC + rear camera, HUD, EPB/Auto Hold, Launch, ambient ----------
function blip(f,d,v){if(!AU)return;const o=AU.ac.createOscillator(),g=AU.ac.createGain();o.type='square';o.frequency.value=f;g.gain.value=v||.05;o.connect(g);g.connect(AU.ac.destination);const t=AU.ac.currentTime;g.gain.setTargetAtTime(0,t+d*.6,d*.2);o.start(t);o.stop(t+d+.05);}
function engineToggle(){if(st.on){st.on=false;st.cruise=0;return;}if(Math.abs(st.v)>1)return;st.on=true;st.crank=.9;blip(90,.5,.06);setTimeout(()=>blip(140,.25,.05),250);}
function ind(d){if(d==='h'){st.haz=!st.haz;return;}st.ind=st.ind===d?0:d;st.indArm=0;}
function cruise(){if(st.cruise)st.cruise=0;else if(st.on&&st.v>8)st.cruise=st.v;}
const AMBC=[0xff9248,0x6fc8ff,0xff3040,0xa060ff,0x40e080,0xffffff];let ambI=0;function ambient(){ambI=(ambI+1)%AMBC.length;mAmb.color.setHex(AMBC[ambI]);ambL.color.setHex(AMBC[ambI]);}
// HUD on windshield
const hudC=document.createElement('canvas');hudC.width=256;hudC.height=128;const hudG=hudC.getContext('2d'),hudT=new THREE.CanvasTexture(hudC);
const hudM=new THREE.Mesh(new THREE.PlaneGeometry(.3,.15),new THREE.MeshBasicMaterial({map:hudT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));hudM.position.set(-.37,1.16,-.92);hudM.rotation.x=.08;hudM.scale.set(.8,.8,1);cab.add(hudM);hudM.visible=false;
function drawHud(){const g=hudG;g.clearRect(0,0,256,128);g.fillStyle='rgba(120,230,255,.95)';g.textAlign='center';g.font='bold 54px sans-serif';g.fillText(Math.round(Math.abs(st.v)*3.6),90,70);g.font='16px sans-serif';g.fillText('км/ч',90,92);
 g.font='bold 30px sans-serif';g.fillText(st.sel==='D'?'D'+(st.g+1):st.sel,190,62);if(st.cruise){g.font='14px sans-serif';g.fillText('⏲ '+Math.round(st.cruise*3.6),190,92);}hudT.needsUpdate=true;}
// rear camera (shown over centre screen in R)
const rcRT=new THREE.WebGLRenderTarget(256,144),rcCam=new THREE.PerspectiveCamera(70,16/9,.1,200);rcCam.position.set(0,1.0,2.45);rcCam.rotation.set(-.35,Math.PI,0);car.add(rcCam);
const rcOv=new THREE.CanvasTexture(cv(256,144,(g)=>{g.strokeStyle='rgba(255,220,0,.9)';g.lineWidth=3;g.beginPath();g.moveTo(60,144);g.lineTo(100,60);g.moveTo(196,144);g.lineTo(156,60);g.stroke();g.strokeStyle='rgba(255,60,40,.9)';g.beginPath();g.moveTo(52,128);g.lineTo(204,128);g.stroke();}));
const rcG=new THREE.Group();rcG.position.set(.09,1.045,-.733);rcG.rotation.x=-.16;cab.add(rcG);
const rcScr=new THREE.Mesh(new THREE.PlaneGeometry(.38,.19),new THREE.MeshBasicMaterial({map:rcRT.texture}));rcScr.scale.x=-1;rcScr.material.side=THREE.DoubleSide;rcG.add(rcScr);
const rcLn=new THREE.Mesh(new THREE.PlaneGeometry(.38,.19),new THREE.MeshBasicMaterial({map:rcOv,transparent:true}));rcLn.position.z=.001;rcG.add(rcLn);rcG.visible=false;
function pdcDist(){const s=Math.sin(st.h),c=Math.cos(st.h);let best=9;const dirs=st.sel==='R'?-1:1;for(let d=0;d<=3;d+=.25)for(const ax of[-.8,0,.8]){const bz=dirs*(2.4+d),px=st.x+ax*c+bz*s,pz=st.z-ax*s+bz*c;if(hit(px,pz)||AI.some(o=>Math.hypot(o.g.position.x-px,o.g.position.z-pz)<1.6)){best=Math.min(best,d);}}return best;}
let pdcT=0,indT=0,indOn=false;
function featTick(dt){indT+=dt;if(indT>.38){indT=0;indOn=!indOn;if(st.ind||st.haz)blip(indOn?1800:1200,.03,.04);}
 if(st.ind&&Math.abs(st.steer)>.5)st.indArm=1;if(st.ind&&st.indArm&&Math.abs(st.steer)<.1)st.ind=0;
 st.pdc=9;if(st.on&&(st.sel==='R'||(st.sel==='D'&&Math.abs(st.v)<3))){st.pdc=pdcDist();if(st.pdc<2.5){pdcT-=dt;if(pdcT<=0){blip(2400,.06,.05);pdcT=st.pdc<.4?.07:.1+st.pdc*.25;}}}
 rcG.visible=st.sel==='R'&&st.on;hudM.visible=!!st.hud&&st.on;if(st.hud&&fr%3==0)drawHud();}
function renderRearCam(){if(rcG.visible){R.setRenderTarget(rcRT);R.render(S,rcCam);R.setRenderTarget(null);}}
// small popup menu
{const ui=document.getElementById('ui');const mk=(id,t,ti)=>{const b=document.createElement('b');b.id=id;b.textContent=t;b.title=ti;return b;};
 const pw=mk('bPow','⏻','Start/Stop (Enter)');ui.insertBefore(pw,ui.firstChild);const mn=mk('bMenu','≡','Функции BMW');ui.insertBefore(mn,pw.nextSibling);
 const pop=document.createElement('div');pop.id='pop';document.body.appendChild(pop);
 const items=[['◀',()=>ind(-1),'Поворотник (Z)'],['▶',()=>ind(1),'Поворотник (X)'],['⚠',()=>ind('h'),'Аварийка (H)'],['⏲',cruise,'Круиз (C)'],['HUD',()=>st.hud=!st.hud,'Проекция (U)'],['Ⓐ',()=>st.autohold=!st.autohold,'Auto Hold (O)'],['Ⓟ',()=>st.epb=!st.epb,'Электроручник (J)'],['🎨',ambient,'Подсветка (K)']];
 items.forEach(([t,f,ti])=>{const b=document.createElement('b');b.textContent=t;b.title=ti;b.onclick=e=>{e.stopPropagation();f();};b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();f();},{passive:false});pop.appendChild(b);});
 const tg=e=>{e&&e.preventDefault();pop.classList.toggle('on');};mn.onclick=tg;mn.addEventListener('touchstart',tg,{passive:false});
 pw.onclick=()=>{audioInit();engineToggle();};pw.addEventListener('touchstart',e=>{e.preventDefault();audioInit();engineToggle();},{passive:false});
 addEventListener('keydown',e=>{const c=e.code;if(c=='Enter'){audioInit();engineToggle();}if(c=='KeyZ')ind(-1);if(c=='KeyX')ind(1);if(c=='KeyH')ind('h');if(c=='KeyC')cruise();if(c=='KeyU')st.hud=!st.hud;if(c=='KeyO')st.autohold=!st.autohold;if(c=='KeyJ')st.epb=!st.epb;if(c=='KeyK')ambient();});}
{const m=/sel=([PRND])/.exec(Q);if(m){st.sel=m[1];updGsel();}if(Q.includes('hud'))st.hud=true;if(Q.includes('ind'))st.ind=1;if(Q.includes('amb'))ambient();}
setTimeout(()=>{const i=document.getElementById('info');if(i)i.style.opacity='0';},9000);
{const ui=document.getElementById('ui');const b=document.createElement('b');b.id='bCam';b.textContent='🎥';b.title='Вид (V)';ui.insertBefore(b,document.getElementById('fs'));const f=e=>{e&&e.preventDefault();setChase(!chase);};b.onclick=f;b.addEventListener('touchstart',f,{passive:false});addEventListener('keydown',e=>{if(e.code=='KeyV')setChase(!chase);});if(Q.includes('chase'))setChase(true);}
function uiTick(){const p=document.getElementById('bPow');if(p){p.style.color=st.on?'#6f6':'#f66';p.style.boxShadow=st.on?'':((performance.now()/500|0)%2?'0 0 8px #f66':'');}}
function fit(){const w=window.innerWidth,h=window.innerHeight;if(!w||!h)return;cam.fov=w<h?95:68;[cam,topCam,chaseCam].forEach(c=>{c.aspect=w/h;c.updateProjectionMatrix();});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.setSize(w,h,false);}
function refit(){fit();setTimeout(fit,150);setTimeout(fit,500);}
addEventListener('resize',refit);addEventListener('orientationchange',refit);if(window.visualViewport)visualViewport.addEventListener('resize',refit);document.addEventListener('fullscreenchange',refit);document.addEventListener('webkitfullscreenchange',refit);
{const b=document.getElementById('fs'),de=document.documentElement,req=de.requestFullscreen||de.webkitRequestFullscreen;
 if(!req||!(document.fullscreenEnabled||document.webkitFullscreenEnabled))b.style.display='none';
 else b.onclick=async()=>{try{if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}await req.call(de,{navigationUI:'hide'});if(screen.orientation&&screen.orientation.lock)await screen.orientation.lock('landscape').catch(()=>{});}catch(e){}refit();};}
fit();
requestAnimationFrame(frame);
})();
