(function(){
'use strict';const PT0=performance.now();let PTl=PT0;const PT=n=>{const t=performance.now();if(/prof/.test(location.search))console.log('PROF',n,(t-PTl).toFixed(0),'ms total',(t-PT0).toFixed(0));PTl=t;};
const C=window.CITY,Q=location.search,demo=Q.includes('demo'),topv=Q.includes('top'),mobile='ontouchstart' in window;
// ---------- graphics settings (presets Low/Medium/High/Ultra, auto by device; saved) ----------
const GPRE={low:{dres:1,imp:80,scale:1,cap:1.5,dist:1,green:1,gdist:1,shadow:0,mir:1,mrate:1,rain:.5,drop:1,aa:0,bloom:0,ssao:0,mblur:0,dof:0,tone:0,exp:1,wet:0,flare:0,grain:0,vig:0},
 medium:{dres:0,imp:95,scale:1,cap:1.5,dist:1.2,green:1,gdist:1,shadow:1,mir:1,mrate:1,rain:.75,drop:1,aa:1,bloom:0,ssao:0,mblur:0,dof:0,tone:0,exp:1,wet:0,flare:0,grain:0,vig:0},
 high:{dres:0,imp:110,scale:1,cap:2,dist:2,green:1.15,gdist:1.5,shadow:2,mir:2,mrate:1,rain:1,drop:1,aa:2,bloom:1,ssao:0,mblur:0,dof:0,tone:0,exp:1,wet:1,flare:1,grain:0,vig:1},
 ultra:{dres:0,imp:140,scale:1,cap:2,dist:3,green:1.35,gdist:2,shadow:3,mir:2,mrate:1,rain:1,drop:1,aa:3,bloom:1,ssao:1,mblur:1,dof:0,tone:1,exp:1.15,wet:1,flare:1,grain:1,vig:1}};
const GSET=(()=>{let auto='high';try{const c=document.createElement('canvas').getContext('webgl');const d=c&&c.getExtension('WEBGL_debug_renderer_info');const rn=d?c.getParameter(d.UNMASKED_RENDERER_WEBGL):'';if(mobile||/SwiftShader|llvmpipe|Mali-4|Adreno \(TM\) [345]/i.test(rn))auto='low';else if(/Intel/i.test(rn))auto='medium';}catch(e){}
 let s=null;try{s=JSON.parse(localStorage.getItem('x5gfxset')||'null');}catch(e){}const pm=/[?&]gq=(\w+)/.exec(Q);if(pm&&GPRE[pm[1]])s={preset:pm[1],...GPRE[pm[1]]};
 if(!s||!s.preset)s={preset:auto,...GPRE[auto]};if(s.gv!==3&&GPRE[s.preset])Object.assign(s,{dist:GPRE[s.preset].dist,gdist:GPRE[s.preset].gdist,aa:GPRE[s.preset].aa});s.gv=3;s=Object.assign({},GPRE[s.preset]||GPRE[auto],s);s.auto=auto;if(s.dres===undefined)s.dres=mobile?1:0;if(mobile&&!(localStorage.getItem('x5gfxset')||'').includes('dres'))s.dres=1;if(!s.imp)s.imp=100;s.fps=s.fps||/[?&]fps/.test(Q);return s;})();
function gsetSave(){try{localStorage.setItem('x5gfxset',JSON.stringify(GSET));}catch(e){}}
const R=new THREE.WebGLRenderer({antialias:!!GSET.aa,preserveDrawingBuffer:/[?&]shot/.test(Q)});window.__R=R;
R.setPixelRatio(Math.min(devicePixelRatio||1,GSET.cap)*GSET.scale);R.domElement.id='gl';R.setSize(innerWidth,innerHeight,false);document.body.prepend(R.domElement);
R.shadowMap.enabled=GSET.shadow>0&&!/noshadow/.test(location.search);R.shadowMap.type=GSET.shadow>=2?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;R.shadowMap.autoUpdate=false;let shF=0;
const rcG=new THREE.Group();const S=new THREE.Scene();
let rnd=(()=>{let s=12345;return()=>(s=(s*16807)%2147483647)/2147483647;})();
function cv(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);return c;}
function tex(c,rx,ry){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.anisotropy=4;return t;}
function noise(g,w,h,a,n){for(let i=0;i<n;i++){g.fillStyle=`rgba(${rnd()<.5?'0,0,0':'255,255,255'},${a*rnd()})`;g.fillRect(rnd()*w,rnd()*h,2,2);}}
// sky
S.background=tex(cv(2,256,(g)=>{const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#3d7cc9');gr.addColorStop(.6,'#a9cdeb');gr.addColorStop(1,'#dde8ee');g.fillStyle=gr;g.fillRect(0,0,2,256);}));
S.fog=new THREE.Fog(0xc9dbe6,Q.includes("city")?9000:120,Q.includes("city")?20000:650);
S.add(new THREE.HemisphereLight(0xdfefff,0x6a7a55,0.75));
const sun=new THREE.DirectionalLight(0xfff2dd,0.85);sun.position.set(80,150,60);S.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.setScalar([1024,1024,2048,4096][GSET.shadow]);Object.assign(sun.shadow.camera,{left:-120,right:120,top:120,bottom:-120,near:1,far:500});sun.shadow.bias=-0.0005;
// ground

// ---------- GROUND: tiling CC0 PBR materials (ambientCG) splat-mapped per area instead of the satellite photo ----------
// splat.png 4 m/px: R=dirt (satellite bare soil, playgrounds), G=gravel (around garages/industry), B=plitka (footways, building aprons); asphalt from the asph.js mask; grass = rest
const GND={ext:[-3247.54,-4265.63,8296.3,8237.89],ok:false};window.__GND=GND;{
 const HI=GSET.preset==='high'||GSET.preset==='ultra',LOWT=GSET.preset==='low'||mobile;const TL=new THREE.TextureLoader();
 const T=(f,srgb)=>{const t=TL.load('tex/gnd/'+f);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=mobile?2:HI?8:4;if(srgb)t.encoding=THREE.sRGBEncoding;return t;};
 const NM=/oldgnd/.test(Q)?['grass','dirt','gravel','pave','asph']:['grass','dirt','gravel','pave','asph','forest'];const U={uSpl:{value:TL.load('tex/gnd/splat.png',t=>{GND.img(t.image);})},uAsm:{value:null},uNz:{value:null},uE:{value:new THREE.Vector4(...GND.ext)},uWet:{value:0}};
 U.uSpl.value.minFilter=THREE.LinearFilter;U.uSpl.value.generateMipmaps=false;
 // Poly Haven CC0 4K sets (webp 2048 Ultra / 1024 / 512 Low): brown_mud_leaves_01, clean_pebbles, concrete_pavement, asphalt_02, forest_ground_06; grass keeps the old set
 const PHS={dirt:'gnd2/mud',gravel:'gnd2/pebbles',pave:'gnd2/concrete',forest:'gnd2/forest'},SZ=GSET.preset==='ultra'&&!mobile?2048:LOWT?512:1024;
 NM.forEach((n,i)=>{if(/oldgnd/.test(Q)&&n!=='forest'){U['uC'+i]={value:T(n+(LOWT?'_c512.jpg':'_c.jpg'),true)};if(HI)U['uN'+i]={value:T(n+'_n.jpg')};return;}if(n==='asph'){U['uC'+i]={value:T('../asph/diff_'+SZ+'.webp',true)};if(HI)U['uN'+i]={value:T('../asph/nor_'+Math.max(1024,SZ)+'.webp')};return;}
  if(PHS[n]){U['uC'+i]={value:T('../'+PHS[n]+'_c'+SZ+'.webp',true)};if(HI)U['uN'+i]={value:T('../'+PHS[n]+'_n'+Math.max(1024,SZ)+'.webp')};return;}
  U['uC'+i]={value:T(n+(LOWT?'_c512.jpg':'_c.jpg'),true)};if(HI)U['uN'+i]={value:T(n+'_n.jpg')};});
 {const N=64,d=new Uint8Array(N*N*4);for(let i=0;i<N*N*4;i++)d[i]=Math.random()*255|0;const t=new THREE.DataTexture(d,N,N);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;U.uNz.value=t;}
 {const t=new THREE.DataTexture(new Uint8Array(4),1,1);t.needsUpdate=true;U.uAsm.value=t;}
 GND.setAsm=A=>{if(!A)return;const d=new Uint8Array(A.w*A.h*4);for(let i=0;i<A.m.length;i++)d[i*4]=A.m[i]*255;const t=new THREE.DataTexture(d,A.w,A.h);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;U.uAsm.value=t;GND.A=A;};
 // CPU copy of the splat for per-surface physics
 GND.img=im=>{try{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);GND.D=g.getImageData(0,0,c.width,c.height).data;GND.W=c.width;GND.H=c.height;GND.ok=true;}catch(e){}};
 const sc=[.33,.4,.5,.45,.3,.33];// repeats per metre: grass 3 m, mud+leaves 2.5 m, pebbles 2 m, concrete 2.2 m, asphalt 3.3 m, forest floor 3 m
 const m=new THREE.MeshLambertMaterial({color:0xffffff});GND.mat=m;GND.U=U;
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader='varying vec3 vGw;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vGw=(modelMatrix*vec4(position,1.)).xyz;');
  let dec='varying vec3 vGw;uniform sampler2D uSpl,uAsm,uNz;uniform vec4 uE;uniform float uWet;\n';NM.forEach((n,i)=>{dec+='uniform sampler2D uC'+i+(HI?',uN'+i:'')+';\n';});
  // anti-tiling: two decorrelated samples (offset + rotated) blended by low-frequency noise; High+ only does the second fetch
  dec+=`vec4 gW;float gNz,gFo;
vec3 smp(sampler2D t,vec2 u){vec3 a=texture2D(t,u).rgb;${HI?'vec2 u2=mat2(.8,-.6,.6,.8)*u*.83+vec2(.37,.71);vec3 b=texture2D(t,u2).rgb;return mix(a,b,smoothstep(.35,.65,gNz));':'return a*(.88+.24*gNz);'}}
`;
  sh.fragmentShader=dec+sh.fragmentShader.replace('#include <map_fragment>',`
 vec2 su=(vGw.xz-uE.xy)/uE.zw;float ins=step(0.,su.x)*step(su.x,1.)*step(0.,su.y)*step(su.y,1.);
 gNz=texture2D(uNz,vGw.xz*.011).r*.6+texture2D(uNz,vGw.xz*.043).g*.4;float nz2=texture2D(uNz,vGw.xz*.19).b;
 vec4 spa=texture2D(uSpl,su);vec3 sp=spa.rgb*ins;float fo=(1.-spa.a)*ins;fo=clamp((fo-.5+(gNz-.5)*.6)*2.+.5,0.,1.)*step(.04,fo);gFo=fo;float wa=texture2D(uAsm,su).r*ins;
 // noisy, sharpened transitions (worn edges instead of 4 m blur)
 vec4 w=vec4(sp,wa);w=clamp((w-.5+(gNz-.5)*.55+(nz2-.5)*.25)*2.2+.5,0.,1.)*step(.04,vec4(sp,wa));
 float wg=max(0.,1.-w.x-w.y-w.z-w.w);float tot=wg+w.x+w.y+w.z+w.w;gW=w/tot;float wgr=wg/tot;
 vec2 p=vGw.xz;vec3 col=vec3(0.);
 if(wgr*(1.-gFo)>.01)col+=smp(uC0,p*${sc[0]})*wgr*(1.-gFo);${NM.length>5?'if(wgr*gFo>.01)col+=smp(uC5,p*'+sc[5]+')*wgr*gFo;':''}if(gW.x>.01)col+=smp(uC1,p*${sc[1]})*gW.x;if(gW.y>.01)col+=smp(uC2,p*${sc[2]})*gW.y;if(gW.z>.01)col+=smp(uC3,p*${sc[3]})*gW.z;if(gW.w>.01)col+=smp(uC4,p*${sc[4]})*gW.w;
 col*=mix(vec3(1.),vec3(.62,.64,.68),uWet*(1.-wgr*.5));// wet darkening
 diffuseColor.rgb*=col*1.25;`);
  if(HI)sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_maps>',`
 {vec3 nm=vec3(0.,0.,1.);vec2 p=vGw.xz;float wgr=max(0.,1.-gW.x-gW.y-gW.z-gW.w);
  vec3 a=(texture2D(uN0,p*${sc[0]}).xyz*2.-1.)*wgr*(1.-gFo)${NM.length>5?'+(texture2D(uN5,p*'+sc[5]+').xyz*2.-1.)*wgr*gFo':''}+(texture2D(uN1,p*${sc[1]}).xyz*2.-1.)*gW.x+(texture2D(uN2,p*${sc[2]}).xyz*2.-1.)*gW.y+(texture2D(uN3,p*${sc[3]}).xyz*2.-1.)*gW.z+(texture2D(uN4,p*${sc[4]}).xyz*2.-1.)*gW.w;
  a.xy*=.8;vec3 wn=normalize(vec3(a.x,a.z,a.y));normal=normalize((viewMatrix*vec4(wn,0.)).xyz);}`);
 };m.customProgramCacheKey=()=>'gnd'+(HI?1:0)+(LOWT?1:0);
 // per-surface lookup: 0 asphalt,1 plitka,2 gravel,3 dirt,4 grass
 GND.surf=(x,z)=>{if(GND.A&&(()=>{const A=GND.A,i=Math.floor((x-A.x0)/A.c),j=Math.floor((z-A.z0)/A.c);return i>=0&&j>=0&&i<A.w&&j<A.h&&A.m[j*A.w+i]===1;})())return 0;if(!GND.ok)return 4;
  const i=Math.floor((x-GND.ext[0])/GND.ext[2]*GND.W),j=Math.floor((z-GND.ext[1])/GND.ext[3]*GND.H);if(i<0||j<0||i>=GND.W||j>=GND.H)return 4;const o=(j*GND.W+i)*4,d=GND.D[o],g=GND.D[o+1],pv=GND.D[o+2];const mx=Math.max(d,g,pv);if(mx<110){if(GND.D[o+3]<128)return ((i*7+j*13)%3)?3:4;/* forest floor: dirt/grass mix */return 4;}return mx===pv?1:mx===g?2:3;};
}
const grass=tex(cv(256,256,(g,w,h)=>{g.fillStyle='#6b8f4e';g.fillRect(0,0,w,h);for(let i=0;i<4000;i++){g.fillStyle=`hsl(${80+rnd()*30},${30+rnd()*25}%,${25+rnd()*20}%)`;g.fillRect(rnd()*w,rnd()*h,2,3);}}),400,400);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(14000,14000,(window.HGT?HGT.n-1:1),(window.HGT?HGT.n-1:1)),(/[?&]sat\b/.test(Q)?new THREE.MeshLambertMaterial({map:grass}):GND.mat));ground.rotation.x=-Math.PI/2;ground.position.y=/[?&]sat\b/.test(Q)?-.25:-.07;if(window.HGT){const sc=window.SATC||[];let X0=-3000,X1=3000,Z0=-3000,Z1=3000;if(sc.length){X0=Math.min(...sc.map(c=>c.x0));X1=Math.max(...sc.map(c=>c.x1));Z0=Math.min(...sc.map(c=>c.z0));Z1=Math.max(...sc.map(c=>c.z1));}
 const pa=ground.geometry.attributes.position;for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=-pa.getY(i),d=Math.max(X0-x,x-X1,Z0-z,z-Z1,0),f=Math.min(1,d/900);pa.setZ(i,HGT.h[i]/10*f*f*(3-2*f));}pa.needsUpdate=true;ground.geometry.computeVertexNormals();}ground.receiveShadow=true;ground.userData.noSplit=1;S.add(ground);
function flat(polys,mat,y){polys.forEach(p=>{if(p.length<3)return;const g=new THREE.ShapeGeometry(new THREE.Shape(p.map(q=>new THREE.Vector2(q[0],-q[1]))));g.rotateX(-Math.PI/2);const o=new THREE.Mesh(g,mat);o.position.y=y;o.receiveShadow=true;S.add(o);});}
(/[?&]sat\b/.test(Q)?(window.SATC||[]):[]).forEach(t=>{const tx=new THREE.TextureLoader().load(t.f);tx.anisotropy=4;const m=new THREE.Mesh(new THREE.PlaneGeometry(t.x1-t.x0,t.z1-t.z0),new THREE.MeshLambertMaterial({map:tx}));m.rotation.x=-Math.PI/2;m.position.set((t.x0+t.x1)/2,-.07,(t.z0+t.z1)/2);m.receiveShadow=true;S.add(m);});// z16 whole-city satellite chunks under the z18 centre
const SATS=[];window.__SATS=SATS;(/[?&]sat\b/.test(Q)?(window.SAT||[]):[]).forEach(t=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(t.x1-t.x0,t.z1-t.z0),new THREE.MeshLambertMaterial({map:null}));m.visible=false;SATS.push([m,t]);m.rotation.x=-Math.PI/2;m.position.set((t.x0+t.x1)/2,-.05,(t.z0+t.z1)/2);m.receiveShadow=true;S.add(m);});
PT('roads (');// ---------- roads (opaque asphalt, world-space UVs so overlaps are seamless) ----------
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
const roadM=new THREE.MeshStandardMaterial({map:aT,normalMap:aN,normalScale:new THREE.Vector2(.6,.6),roughnessMap:aR,roughness:.92,metalness:0,polygonOffset:true,polygonOffsetFactor:-.5,polygonOffsetUnits:-1});
// Poly Haven asphalt_02 (CC0): 2048 Ultra / 1024 High-Medium / 512 Low webp; RAH pack = R cavity AO, G roughness, B height; normals Medium+
// anti-tiling (two rotated/offset samples blended by noise), macro variation, wet: darker + glossy + puddles in height-map low spots
{const PS=GSET.preset,SZ=PS==='ultra'?2048:(PS==='low'||mobile)?512:1024,TL=new THREE.TextureLoader(),rep=7/3.2;const ld=(f,srgb)=>{const t=TL.load('tex/asph/'+f+'_'+SZ+'.webp');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.anisotropy=maxAn;if(srgb)t.encoding=THREE.sRGBEncoding;return t;};
 roadM.map=ld('diff',1);roadM.roughnessMap=ld('rah');roadM.roughness=1;if(SZ>=1024){const n=TL.load('tex/asph/nor_'+SZ+'.webp');n.wrapS=n.wrapT=THREE.RepeatWrapping;n.repeat.set(rep,rep);n.anisotropy=maxAn;roadM.normalMap=n;roadM.normalScale.set(.9,.9);}else roadM.normalMap=null;
 const RU={uRah:{value:roadM.roughnessMap},uWetA:{value:0},uNzA:{value:null}};window.__ROADU=RU;
 {const N=64,d=new Uint8Array(N*N*4);for(let i=0;i<d.length;i++)d[i]=Math.random()*255|0;const t=new THREE.DataTexture(d,N,N);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;RU.uNzA.value=t;}
 roadM.onBeforeCompile=sh=>{Object.assign(sh.uniforms,RU);sh.fragmentShader='uniform sampler2D uRah,uNzA;uniform float uWetA;float aPud;\n'+sh.fragmentShader
  .replace('#include <map_fragment>',`#ifdef USE_MAP
   vec2 au=vUv;float an=texture2D(uNzA,au*.045).r*.6+texture2D(uNzA,au*.17).g*.4;vec2 au2=mat2(.8,-.6,.6,.8)*au*.91+vec2(.43,.17);
   vec4 t1=texture2D(map,au),t2=texture2D(map,au2);float bl=smoothstep(.38,.62,an);vec4 texelColor=mix(t1,t2,bl);
   vec3 rh=mix(texture2D(uRah,au).rgb,texture2D(uRah,au2).rgb,bl);
   texelColor.rgb*=mix(.82,1.12,texture2D(uNzA,au*.012).b)*mix(.55,1.,rh.r);
   aPud=uWetA*smoothstep(.42,.25,rh.b+(an-.5)*.35);
   texelColor.rgb*=mix(1.,.55,uWetA)*mix(1.,.7,aPud);
   diffuseColor*=texelColor;
  #endif`)
  .replace('#include <roughnessmap_fragment>',`float roughnessFactor=roughness;
  #ifdef USE_ROUGHNESSMAP
   roughnessFactor*=mix(texture2D(roughnessMap,vUv).g,1.,.0);
  #endif
   roughnessFactor=mix(roughnessFactor,.28,uWetA*.8);roughnessFactor=mix(roughnessFactor,.04,aPud);`);};
 roadM.customProgramCacheKey=()=>'roadA'+SZ;roadM.needsUpdate=true;}
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

PT('buildings ------');const S0=S.children.length;// ---------- buildings ----------
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
const CHUNKS=[];const buf={};let CK='';const CHUNK=500;function bf(m){const k=m.uuid+'|'+CK;return buf[k]||(buf[k]={m,P:[],U:[],C:[]});}
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
// photo facade materials (lytkarino-textures: one floor x 3 bays per tile) + per-edge integer bay tiling
const PHS={khrush_silicate:9.6,khrush_redbrick:9.6,panel_p44:9.0,panel_ii49:9.6,stalin_cream:10.5,shop_ground:12,entrance_ground:9,house_wood:4,house_brick:4,garage_row:10.5};
const PH={},PHE=[];const TXL=new THREE.TextureLoader();
Object.keys(PHS).forEach(n=>{const t=TXL.load('tx/'+n+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.encoding=THREE.sRGBEncoding;
 const hasE=['khrush_silicate','khrush_redbrick','panel_p44','panel_ii49','stalin_cream','shop_ground'].includes(n);
 const o={map:t};if(hasE){const e=TXL.load('tx/'+n+'_e.jpg');e.wrapS=e.wrapT=THREE.RepeatWrapping;o.emissiveMap=e;o.emissive=new THREE.Color(0xffd9a0);o.emissiveIntensity=0;}
 if(!mobile){const nm=TXL.load('tx/'+n+'_n.jpg');nm.wrapS=nm.wrapT=THREE.RepeatWrapping;o.normalMap=nm;o.normalScale=new THREE.Vector2(.6,.6);o.roughness=.85;o.metalness=0;}
 PH[n]=mobile?new THREE.MeshLambertMaterial(o):new THREE.MeshStandardMaterial(o);if(hasE)PHE.push(PH[n]);});
const PHX=window.PHX||{};Object.keys(PHX).forEach(n=>{const X=PHX[n];const t=TXL.load('tx/'+n+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.encoding=THREE.sRGBEncoding;const e=TXL.load('tx/'+n+'_e.jpg');e.wrapS=e.wrapT=THREE.RepeatWrapping;
 const o={map:t,emissiveMap:e,emissive:new THREE.Color(0xffd9a0),emissiveIntensity:0};if(!mobile){const nm=TXL.load('tx/'+n+'_n.jpg');nm.wrapS=nm.wrapT=THREE.RepeatWrapping;o.normalMap=nm;o.normalScale=new THREE.Vector2(.5,.5);const rm=TXL.load('tx/'+n+'_r.jpg');rm.wrapS=rm.wrapT=THREE.RepeatWrapping;o.roughnessMap=rm;o.roughness=1;o.metalness=0;}
 PH[n]=mobile?new THREE.MeshLambertMaterial(o):new THREE.MeshStandardMaterial(o);PHE.push(PH[n]);PHS[n]=X.w;});
const PHA={};Object.keys(PHX).forEach(n=>(PHX[n].osm||[]).forEach(id=>PHA[id]=n));const PHANCH=[];window.__phx=PHA;
window.__facadeNight=v=>PHE.forEach(m=>m.emissiveIntensity=v);
function wallI(m,p,y0,y1,vs,us){const B=bf(m);for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L<.05)continue;const nb=Math.max(1,Math.round(L/us));
 B.P.push(a[0],y0,a[1],c[0],y0,c[1],c[0],y1,c[1],a[0],y0,a[1],c[0],y1,c[1],a[0],y1,a[1]);const v0=0,v1=(y1-y0)/vs;B.U.push(0,v0,nb,v0,nb,v1,0,v0,nb,v1,0,v1);}}
function series(b,p,i){const r0=series0(b,p,i);if(PHA[b.id]&&PHX[PHA[b.id]].ground&&r0)return Object.assign({},r0,{gr:PHA[b.id],l:Math.max(2,r0.l)});if(PHA[b.id])return{up:PHA[b.id],l:Math.max(1,b.l||(r0&&r0.l)||1),ent:r0?r0.ent:false,ph:1};if(r0&&!r0.house&&r0.up!='garage_row'&&PHANCH.length){let best=null,bd=500;const c=b.p[0];PHANCH.forEach(a=>{if(a.up!==r0.up||Math.abs(a.l-r0.l)>3)return;const d=Math.hypot(a.x-c[0],a.z-c[1]);if(d<bd){bd=d;best=a;}});if(best)return Object.assign({},r0,{up:best.n,gr:null,ph:1});}return r0;}
function series0(b,p,i){const n=b.n||'';if(b.k=='church'||b.k=='chapel')return null;for(const [re] of LM)if(re.test(n))return null;const k=b.k,A=Math.abs(area(p)),ob=obb(p);const Wd=ob?Math.min(ob.s1-ob.s0,ob.t1-ob.t0):10,Ln=ob?Math.max(ob.s1-ob.s0,ob.t1-ob.t0):10;
 let l=b.l;const red=/brick/.test(b.m)||/red|#[89a-f][0-9a-f][0-4]/i.test(b.c||'');
 if(k=='garages'||k=='garage')return{up:'garage_row',l:1,h:3};
 if(['industrial','warehouse','service','construction','shed','roof','greenhouse'].includes(k))return null;
 if(k=='house'||k=='detached'||k=='bungalow'||k=='semidetached_house'||(!b.lt&&k=='yes'&&A<220))return{up:(i%3==0?'house_wood':'house_brick'),l:Math.max(1,Math.min(b.lt?l:(A<90?1:2),3)),house:1};
 if(!b.lt&&(k=='yes'||k=='apartments'||k=='residential')){if(Ln>=40&&Wd>=9.5&&Wd<=16)l=k=='yes'&&!b.s?5:Math.max(l,5);else return null;}
 let up;if(l>=12)up='panel_p44';else if(l>=6)up='panel_ii49';else if(l>=4)up=red?'khrush_redbrick':(i%4==0?'khrush_redbrick':'khrush_silicate');else up='stalin_cream';
 return{up,l,gr:b.s?'shop_ground':null,ent:!b.s&&((l>=3&&(k=='apartments'||k=='residential'))||(l>=4&&k=='yes'))};}
C.b.forEach((b,i)=>{const n=PHA[b.id];if(!n||PHX[n].uniq)return;const r0=series0(b,b.p,i);PHANCH.push({n,x:b.p[0][0],z:b.p[0][1],up:r0?r0.up:'',l:b.l||1});});const entG=[];
const colG=new THREE.CylinderGeometry(.35,.4,1,10);const colList=[];
const Gd={},CS=20;
C.b.forEach((b,i)=>{let p=b.p.slice();{let cx=0,cz=0;p.forEach(q=>{cx+=q[0];cz+=q[1];});CK=Math.floor(cx/p.length/CHUNK)+','+Math.floor(cz/p.length/CHUNK);}if(area(p)>0)p.reverse();// now clockwise in x/z => outward normals
 const SR=series(b,p,i);if(SR&&SR.ph)(window.__phc=window.__phc||{})[SR.up]=(window.__phc[SR.up]||0)+1;const o=pick(b,i);let h=Math.max(2.5,b.h);const fm=o.f?FM[o.f]:greyM;
 if(SR){const lv=SR.l,fh=SR.up.startsWith('stalin')?3.6:SR.house?3:2.8,gh=SR.gr?4:SR.house?3:3;h=SR.h||(SR.house?lv*3:gh+(lv-1)*fh+.4);
  if(SR.ph){const X=PHX[SR.up];h=lv*X.fh+.4;wallI(PH[SR.up],p,0,lv*X.fh,X.fh*X.f,X.w);wall(plinth,p,lv*X.fh,h,3,12);}
  else if(lv<=1)wallI(PH[SR.gr||SR.up],p,0,h,h,PHS[SR.gr||SR.up]);
  else{wallI(PH[SR.gr||SR.up],p,0,gh,gh,PHS[SR.gr||SR.up]);wallI(PH[SR.up],p,gh,gh+(lv-1)*fh,fh,PHS[SR.up]);if(h>gh+(lv-1)*fh)wall(plinth,p,gh+(lv-1)*fh,h,3,12);}
  if(SR.ent)entG.push([p,lv,h,b.id]);}
 else if(o.glass){wall(glassM,p,0,Math.min(h,b.l>1?3.5:h),3.5,8);if(h>3.5)wall(fm,p,3.5,h,9,12);}
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
{// entrances: doors + canopy along the courtyard side of the longest edge (side farther from roads)
 const dM=new THREE.MeshLambertMaterial({color:0x4a3b30}),cM=new THREE.MeshLambertMaterial({color:0x8a8a86});const D=[],Cn=[];
 const rd=(x,z)=>{let best=1e9;for(const r of C.r){if(r.w<5)continue;for(let i=0;i<r.p.length-1;i++){const d=segD(x,z,r.p[i],r.p[i+1])[0];if(d<best)best=d;}}return best;};
 const EG={};(C.en||[]).forEach(e=>{const c=Math.floor(e[0]/20)+','+Math.floor(e[1]/20);(EG[c]=EG[c]||[]).push(e);});let osmE=0;
 entG.forEach(([p,lv,h])=>{{const fe=[];const seen=new Set();p.forEach(q=>{for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const c=(Math.floor(q[0]/20)+dx)+','+(Math.floor(q[1]/20)+dz);if(seen.has(c))continue;seen.add(c);(EG[c]||[]).forEach(e=>{for(let k=0;k<p.length;k++){const A=p[k],B=p[(k+1)%p.length],r=segD(e[0],e[1],A,B);if(r[0]<2.5){const L=Math.hypot(B[0]-A[0],B[1]-A[1]);if(L<3)continue;let nx=(B[1]-A[1])/L,nz=-(B[0]-A[0])/L;const t=Math.max(0,Math.min(1,((e[0]-A[0])*(B[0]-A[0])+(e[1]-A[1])*(B[1]-A[1]))/(L*L))),x=A[0]+(B[0]-A[0])*t,z=A[1]+(B[1]-A[1])*t;if(inPoly(x+nx*1.5,z+nz*1.5,p)){nx=-nx;nz=-nz;}fe.push([x,z,nx,nz]);break;}}});}});
  if(fe.length){osmE+=fe.length;fe.forEach(([x,z,nx,nz])=>{const ry=Math.atan2(nx,nz);D.push([x+nx*.06,z+nz*.06,ry]);Cn.push([x+nx*.66,z+nz*.66,ry]);});return;}}
  let li=0,ll=0;for(let k=0;k<p.length;k++){const a=p[k],c=p[(k+1)%p.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L>ll){ll=L;li=k;}}
  let a=p[li],c=p[(li+1)%p.length];const dx=(c[0]-a[0])/ll,dz=(c[1]-a[1])/ll;// outward normal for clockwise poly: (dz,-dx)
  let nx=dz,nz=-dx;const mx=(a[0]+c[0])/2,mz=(a[1]+c[1])/2;if(inPoly(mx+nx*2,mz+nz*2,p)){nx=-nx;nz=-nz;}
  if(rd(mx+nx*15,mz+nz*15)<rd(mx-nx*15,mz-nz*15)){// street side faces road -> use the opposite long edge
   let bi=-1,bl=0;for(let k=0;k<p.length;k++){if(k===li)continue;const A2=p[k],C2=p[(k+1)%p.length],L=Math.hypot(C2[0]-A2[0],C2[1]-A2[1]);const ddx=(C2[0]-A2[0])/L,ddz=(C2[1]-A2[1])/L;if(L>bl&&Math.abs(ddx*dx+ddz*dz)>.9){bl=L;bi=k;}}
   if(bi>=0){a=p[bi];c=p[(bi+1)%p.length];ll=bl;const ex=(c[0]-a[0])/ll,ez=(c[1]-a[1])/ll;nx=ez;nz=-ex;const m2x=(a[0]+c[0])/2,m2z=(a[1]+c[1])/2;if(inPoly(m2x+nx*2,m2z+nz*2,p)){nx=-nx;nz=-nz;}}}
  const ex=(c[0]-a[0])/ll,ez=(c[1]-a[1])/ll,n=Math.max(1,Math.round(ll/(lv>=9?26:22)));
  for(let j=0;j<n;j++){const s2=(j+.5)*ll/n,x=a[0]+ex*s2+nx*.06,z=a[1]+ez*s2+nz*.06,ry=Math.atan2(nx,nz);D.push([x,z,ry]);Cn.push([x+nx*.6,z+nz*.6,ry]);}});
 const dG=new THREE.BoxGeometry(1.5,2.3,.1).translate(0,1.15,0),cG=new THREE.BoxGeometry(2.4,.15,1.3).translate(0,2.75,0);const m4=new THREE.Matrix4();
 const sG=new THREE.BoxGeometry(2.2,.18,1.1).translate(0,.09,.55-.6),lG=new THREE.BoxGeometry(.32,.14,.2).translate(0,2.58,-.35);const sM=new THREE.MeshLambertMaterial({color:0x9b9a94}),lM=new THREE.MeshLambertMaterial({color:0xfff1c8,emissive:0xffd890,emissiveIntensity:.05});window.__entLamp=lM;
 const si=new THREE.InstancedMesh(sG,sM,Math.max(1,Cn.length)),li2=new THREE.InstancedMesh(lG,lM,Math.max(1,Cn.length));Cn.forEach((d,j)=>{m4.makeRotationY(d[2]).setPosition(d[0],0,d[1]);si.setMatrixAt(j,m4);li2.setMatrixAt(j,m4);});si.count=li2.count=Cn.length;si.receiveShadow=true;S.add(si,li2);
 const di=new THREE.InstancedMesh(dG,dM,Math.max(1,D.length)),ci=new THREE.InstancedMesh(cG,cM,Math.max(1,Cn.length));D.forEach((d,j)=>{m4.makeRotationY(d[2]).setPosition(d[0],0,d[1]);di.setMatrixAt(j,m4);});Cn.forEach((d,j)=>{m4.makeRotationY(d[2]).setPosition(d[0],0,d[1]);ci.setMatrixAt(j,m4);});
 di.count=D.length;ci.count=Cn.length;S.add(di,ci);console.log('ENTRANCES',D.length,'buildings',entG.length,'osm',osmE);window.__ent=[D.length,entG.length,osmE];}
if(colList.length){const im=new THREE.InstancedMesh(colG,new THREE.MeshLambertMaterial({color:0xf8f6f0}),colList.length);const m4=new THREE.Matrix4();colList.forEach((c,i)=>{m4.makeScale(1,c[2],1).setPosition(c[0],c[2]/2,c[1]);im.setMatrixAt(i,m4);});im.castShadow=true;S.add(im);}
Object.values(buf).forEach(B=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(B.P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(B.U,2));if(B.C.length)g.setAttribute('color',new THREE.Float32BufferAttribute(B.C,3));g.computeVertexNormals();g.computeBoundingSphere();const m=new THREE.Mesh(g,B.m);m.castShadow=m.receiveShadow=true;S.add(m);CHUNKS.push(m);});
function inPoly(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
function hit(x,z){const l=Gd[Math.floor(x/CS)+','+Math.floor(z/CS)];return l&&l.some(p=>inPoly(x,z,p));}
PT('water:');// ---------- water: Moscow river, quarry lakes, ponds (animated normal-mapped water) + embankment edge ----------
const wN=tex(cv(256,256,(g,w,h)=>{const id=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,a=Math.sin(x*.098+Math.sin(y*.05)*2),b=Math.sin(y*.123+Math.sin(x*.07)*2);id.data[i]=128+a*40;id.data[i+1]=128+b*40;id.data[i+2]=255;id.data[i+3]=255;}g.putImageData(id,0,0);}),1,1);
wN.repeat.set(.05,.05);
const waterM=new THREE.MeshPhongMaterial({color:0x2f5566,specular:0x8fb4c8,shininess:120,normalMap:wN,normalScale:new THREE.Vector2(.5,.5),transparent:true,opacity:.9});
(C.w||[]).forEach(p=>{if(p.length<3)return;const g=new THREE.ShapeGeometry(new THREE.Shape(p.map(q=>new THREE.Vector2(q[0],-q[1]))));g.rotateX(-Math.PI/2);const uv=g.attributes.uv,pp=g.attributes.position;for(let i=0;i<pp.count;i++)uv.setXY(i,pp.getX(i),pp.getZ(i));const m=new THREE.Mesh(g,waterM);m.position.y=.03;m.renderOrder=1;S.add(m);});
{const embM=new THREE.MeshStandardMaterial({color:0x9a968c,roughness:.85});ribbon((C.w||[]).filter(p=>p.length>8).map(p=>({p:p.concat([p[0]]),w:1.6})),embM,.06,r=>r.w);}
{const RV=window.RIVER||[];const G=[];RV.forEach(r=>{const sh=new THREE.Shape(r[0].map(q=>new THREE.Vector2(q[0],-q[1])));r[1].forEach(h=>sh.holes.push(new THREE.Path(h.map(q=>new THREE.Vector2(q[0],-q[1])))));const g=new THREE.ShapeGeometry(sh);g.rotateX(-Math.PI/2);const uv=g.attributes.uv,pp=g.attributes.position;for(let i=0;i<pp.count;i++)uv.setXY(i,pp.getX(i),pp.getZ(i));const m=new THREE.Mesh(g,waterM);m.position.y=.04;m.renderOrder=1;m.receiveShadow=true;S.add(m);});
 // embankment: stone edge + sloped grassy bank along river outline
 const bankM=new THREE.MeshLambertMaterial({color:0x7d8a5a}),stoneM=new THREE.MeshLambertMaterial({color:0xa39e92});const BP=[],SP=[];
 RV.forEach(r=>[r[0]].concat(r[1]).forEach(p=>{for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<.5)continue;const nx=-dz/L,nz=dx/L;
  const q=(o,y,t)=>[a[0]+dx*t+nx*o,y,a[1]+dz*t+nz*o];const s1=[q(0,.05,0),q(0,.05,1),q(1.2,.35,1),q(1.2,.35,0)],s2=[q(-0,.05,0),q(0,.05,1),q(-1.2,.35,1),q(-1.2,.35,0)];
  [s1,s2].forEach(Qd=>{SP.push(...Qd[0],...Qd[1],...Qd[2],...Qd[0],...Qd[2],...Qd[3]);SP.push(...Qd[0],...Qd[2],...Qd[1],...Qd[0],...Qd[3],...Qd[2]);});}}));
 if(SP.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(SP,3));g.computeVertexNormals();S.add(new THREE.Mesh(g,stoneM));}
 window.__river=RV.length;}
window.__waterTick=dt=>{wN.offset.x+=dt*.004;wN.offset.y+=dt*.0025;};
PT('trees & lamps (i');// ---------- trees & lamps (instanced) ----------
const trees=[],lamps=[],rs=[];
C.t.forEach(t=>trees.push(t));
major.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1)continue;const nx=-dz/L,nz=dx/L,o=r.w/2+4.5;
 for(let s=4;s<L-3;s+=8){const x=a[0]+dx/L*s,z=a[1]+dz/L*s;[1,-1].forEach(sd=>{if(rnd()<.8){const tx=x+nx*sd*(o+rnd()*2),tz=z+nz*sd*(o+rnd()*2);if(!hit(tx,tz))trees.push([tx,tz]);}if(rnd()<.6){const tx=x+nx*sd*(o+5+rnd()*4),tz=z+nz*sd*(o+5+rnd()*4);if(!hit(tx,tz))trees.push([tx,tz]);}if(rnd()<.7){const q=s+rnd()*8,tx=a[0]+dx/L*q+nx*sd*(o-1.5),tz=a[1]+dz/L*q+nz*sd*(o-1.5);if(!hit(tx,tz))trees.push([tx,tz,'bush']);}});}
 for(let s=10;s<L-5;s+=32){const x=a[0]+dx/L*s+nx*(r.w/2+1.2),z=a[1]+dz/L*s+nz*(r.w/2+1.2);if(!hit(x,z))lamps.push([x,z,Math.atan2(-nx,-nz)]);}}});
// greenery: OSM green areas by type + courtyards, generated lazily per 250 m chunk around the car (see GREEN stream below)
const GSTR={idx:{},CH:250};{
 const GR=C.gr||C.g.map(p=>['p',p]);const bb=p=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);});return[x0,x1,z0,z1];};
 const MIX={f:{pine:.35,birch:.35,spruce:.2,linden:.05,rowan:.05},p:{linden:.28,birch:.22,maple:.16,poplar:.1,popcut:.06,spruce:.1,rowan:.08},g:{birch:.32,maple:.22,linden:.16,popcut:.14,rowan:.1,poplar:.06},s:{birch:.45,spruce:.35,linden:.2},r:{linden:.24,birch:.2,maple:.18,popcut:.14,poplar:.1,rowan:.1,spruce:.04}};
 // densities m^2 per item [tree,bush,tuft]
 const DEN={f:[16,30,0],p:[25,16,90],g:[90,35,120],s:[70,8,0],r:[22,14,110]};GSTR.MIX=MIX;GSTR.DEN=DEN;
 const CH=GSTR.CH,add=(c,p,mul)=>{const b=bb(p);for(let gx=Math.floor(b[0]/CH);gx<=Math.floor(b[1]/CH);gx++)for(let gz=Math.floor(b[2]/CH);gz<=Math.floor(b[3]/CH);gz++)(GSTR.idx[gx+','+gz]=GSTR.idx[gx+','+gz]||[]).push([c,p,mul,b]);};
 GR.forEach(([c,p])=>{if(MIX[c]&&p.length>2)add(c,p,1);});(C.res||[]).forEach(p=>{if(p.length>2&&Math.abs(area(p))<400000)add('r',p,1.6);});
 GSTR.gen=(gx,gz)=>{let sd=(gx*73856093^gz*19349663)>>>0||1;const R=()=>(sd=(sd*16807)%2147483647)/2147483647;const out=[],X0=gx*CH,Z0=gz*CH,X1=X0+CH,Z1=Z0+CH,inC=(x,z)=>x>=X0&&x<X1&&z>=Z0&&z<Z1;
  const pick=m=>{let r=R(),a=0;for(const k in m){a+=m[k];if(r<a)return k;}return Object.keys(m)[0];};const bad=window.__treeBad||(()=>false);
  (GSTR.idx[gx+','+gz]||[]).forEach(([c,p,mul,b])=>{const x0=Math.max(X0,b[0]),x1=Math.min(X1,b[1]),z0=Math.max(Z0,b[2]),z1=Math.min(Z1,b[3]);if(x1<=x0||z1<=z0)return;const A=(x1-x0)*(z1-z0),d=DEN[c].map(v=>v/GSET.green);
   [0,1,2].forEach(w=>{const den=d[w];if(!den)return;const n=Math.min(w==0?(mobile?900:1300):w==1?(mobile?1000:1500):(mobile?150:300),A/den*mul*(mobile&&w==2?.5:mobile&&w==1?.75:1));
    for(let i=0;i<n;i++){const x=x0+R()*(x1-x0),z=z0+R()*(z1-z0);if(!inPoly(x,z,p)||hit(x,z)||bad(x,z,w==1?2:0))continue;
     if(c=='r'){const l=Gd[Math.floor(x/CS)+','+Math.floor(z/CS)];if(l&&l.some(q=>{for(let k=0;k<q.length;k++)if(segD(x,z,q[k],q[(k+1)%q.length])[0]<(w==2?2.5:4))return true;return false;}))continue;}
     {const tp=w==0?pick(MIX[c]):w==1?'bush':'tuft';if(tp=='spruce'&&bad(x,z,2.6))continue;out.push([x,z,tp]);}}});
   if(c=='f'||c=='p'||c=='s')for(let k=0;k<p.length;k++){const A2=p[k],B=p[(k+1)%p.length],L=Math.hypot(B[0]-A2[0],B[1]-A2[1]);if(L<1)continue;for(let t=2;t<L;t+=c=='f'?4:6){if(R()>.7)continue;const f=t/L;let x=A2[0]+(B[0]-A2[0])*f,z=A2[1]+(B[1]-A2[1])*f;if(!inC(x,z))continue;const nx=-(B[1]-A2[1])/L*2,nz=(B[0]-A2[0])/L*2;if(inPoly(x+nx,z+nz,p)){x+=nx;z+=nz;}else{x-=nx;z-=nz;}if(!hit(x,z)&&!bad(x,z,2))out.push([x,z,'bush']);}}});
  return{L:out,R,s:sd};};}
// bus stops snapped to the kerb: nearest drivable road, side of the OSM node, offset half-width + ~2 m, open side facing the road
const BSP=(()=>{const RD=C.r.filter(r=>r.w>=3);return (C.bs||[]).map(b=>{const x=b[0],z=b[1];let bd=1e9,best=null;RD.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const A=r.p[i],B=r.p[i+1];const q=segD(x,z,A,B);if(q[0]<bd){bd=q[0];best=[r,A,B];}}});if(!best||bd>40)return null;
 const [r,A,B]=best;const dx=B[0]-A[0],dz=B[1]-A[1],L=Math.hypot(dx,dz)||1,ux=dx/L,uz=dz/L;let t=((x-A[0])*ux+(z-A[1])*uz);t=Math.max(0,Math.min(L,t));const px=A[0]+ux*t,pz=A[1]+uz*t;
 let nx=-uz,nz=ux;if((x-px)*nx+(z-pz)*nz<0){nx=-nx;nz=-nz;}let off=r.w/2+(r.w>=6?2.2:1.7)+.8;let X=px+nx*off,Z=pz+nz*off;
 for(let k=0;k<6&&(hit(X,Z)||hit(X+nx*.9,Z+nz*.9)||hit(X+ux*2,Z+uz*2)||hit(X-ux*2,Z-uz*2));k++){off-=.25;if(off<r.w/2+1.3){off=r.w/2+1.3;break;}X=px+nx*off;Z=pz+nz*off;}
 // also keep clear of any other carriageway (junctions)
 return [X,Z,Math.atan2(-nx,-nz),b[4]||'',r.w/2,off,ux,uz];}).filter(Boolean);})();window.__BSP=BSP;

// parked Zhiguli cars: bays in OSM parking lots + parallel rows along courtyard driveways; rectangles go into the building grid Gd => static colliders + greenery exclusion
const PCAR=(()=>{const L=[];const DEN=({low:.45,medium:.6,high:.7,ultra:.8}[GSET.preset]||.6)*(mobile?.75:1)*(/nopark/.test(Q)?0:1);
 const RD=C.r.filter(r=>r.w>=3);const RG={};RD.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const A=r.p[i],B=r.p[i+1];for(let gx=Math.floor((Math.min(A[0],B[0])-8)/40);gx<=Math.floor((Math.max(A[0],B[0])+8)/40);gx++)for(let gz=Math.floor((Math.min(A[1],B[1])-8)/40);gz<=Math.floor((Math.max(A[1],B[1])+8)/40);gz++)(RG[gx+','+gz]=RG[gx+','+gz]||[]).push([A,B,r.w]);}});
 const onLane=(x,z,ign)=>{const l=RG[Math.floor(x/40)+','+Math.floor(z/40)];return l&&l.some(o=>o[0]!==ign&&segD(x,z,o[0],o[1])[0]<o[2]/2+.4);};
 const corners=(x,z,a,hw,hl)=>{const c=Math.cos(a),sn=Math.sin(a);return [[-hw,-hl],[hw,-hl],[hw,hl],[-hw,hl]].map(([u,v])=>[x+u*c+v*sn,z-u*sn+v*c]);};
 const nearBS=(x,z)=>BSP.some(b=>Math.hypot(b[0]-x,b[1]-z)<9);
 const occ={};const ok=(x,z,a,ign,inLot)=>{const q=corners(x,z,a,.95,2.2);if(q.some(c=>hit(c[0],c[1])))return null;if(q.concat([[x,z]]).some(c=>onLane(c[0],c[1],ign)))return null;if(inLot&&!q.every(c=>inLot(c[0],c[1])))return null;if(nearBS(x,z))return null;
  const k=Math.floor(x/3)+','+Math.floor(z/3);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const o=occ[(Math.floor(x/3)+i)+','+(Math.floor(z/3)+j)];if(o&&o.some(p=>Math.hypot(p[0]-x,p[1]-z)<2.3))return null;}(occ[k]=occ[k]||[]).push([x,z]);return q;};
 let R0=12345;const rr=()=>(R0=(R0*16807)%2147483647)/2147483647;
 const lots=(window.FURN&&FURN.pk&&FURN.pk.length?FURN.pk:C.pk)||[];
 lots.forEach(p=>{if(p.length<4)return;const inL=(x,z)=>inPoly(x,z,p);let bi=0,bl=0;for(let i=0;i<p.length-1;i++){const l=Math.hypot(p[i+1][0]-p[i][0],p[i+1][1]-p[i][1]);if(l>bl){bl=l;bi=i;}}if(bl<5)return;
  const a=p[bi],b=p[bi+1],ux=(b[0]-a[0])/bl,uz=(b[1]-a[1])/bl;let cx=0,cz=0;p.forEach(q=>{cx+=q[0];cz+=q[1];});cx/=p.length;cz/=p.length;let nx=-uz,nz=ux;if((cx-a[0])*nx+(cz-a[1])*nz<0){nx=-nx;nz=-nz;}
  for(let row=0;row<8;row++){const off=1.2+row*(row%2?5.2:7);let any=false;for(let t=1.5;t<bl-1.5;t+=2.6){const x=a[0]+ux*t+nx*(off+2.5),z=a[1]+uz*t+nz*(off+2.5);if(!inL(x,z))continue;any=true;if(rr()>DEN)continue;
    const ang=Math.atan2(nx,nz)+(rr()<.5?0:Math.PI)+(rr()-.5)*.06;const q=ok(x,z,ang,null,inL);if(q)L.push([x,z,ang,(rr()*4)|0,q,'lot']);}if(!any&&row>1)break;}});
 // courtyard driveways / aisles: narrow service roads (3–4.5 m) inside residential areas, cars parallel at the kerb
 const RES=(C.res||[]).filter(p=>p.length>2);const inRes=(x,z)=>RES.some(p=>inPoly(x,z,p));
 C.r.forEach(r=>{if(r.w<3||r.w>4.5)return;for(let i=0;i<r.p.length-1;i++){const A=r.p[i],B=r.p[i+1],Ls=Math.hypot(B[0]-A[0],B[1]-A[1]);if(Ls<22)continue;const ux=(B[0]-A[0])/Ls,uz=(B[1]-A[1])/Ls;
   if(!inRes((A[0]+B[0])/2,(A[1]+B[1])/2))continue;const sd=rr()<.5?1:-1,nx=-uz*sd,nz=ux*sd,o=r.w/2+1.15;
   for(let t=10;t<Ls-10;t+=5.4){if(rr()>DEN*.8)continue;const x=A[0]+ux*t+nx*o,z=A[1]+uz*t+nz*o;const ang=Math.atan2(ux,uz)+(rr()<.5?0:Math.PI)+(rr()-.5)*.04;const q=ok(x,z,ang,A,null);if(q)L.push([x,z,ang,(rr()*4)|0,q,'yard']);}}});
 // colliders + greenery exclusion through the building grid
 L.forEach(c=>{const q=c[4];let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;q.forEach(v=>{x0=Math.min(x0,v[0]);x1=Math.max(x1,v[0]);z0=Math.min(z0,v[1]);z1=Math.max(z1,v[1]);});c[6]=[];for(let gx=Math.floor(x0/CS);gx<=Math.floor(x1/CS);gx++)for(let gz=Math.floor(z0/CS);gz<=Math.floor(z1/CS);gz++){const k=gx+','+gz;(Gd[k]=Gd[k]||[]).push(q);c[6].push(k);}});
 console.log('PARKED',L.length,'lot',L.filter(c=>c[5]=='lot').length,'yard',L.filter(c=>c[5]=='yard').length);return {L,ch:[]};})();window.__PCAR=PCAR;
// satellite-derived asphalt mask (grey, low-saturation pixels of the z16/z18 imagery, 4 m cells; precomputed offline into asph.js): unmapped yards/driveways/lots
const ASM=(()=>{const A=window.ASPH;if(!A)return null;const m=new Uint8Array(A.w*A.h);let p=0;A.r.split(',').forEach(t=>{const [a,b]=t.split('.');p+=parseInt(a,36);const n=parseInt(b,36);m.fill(1,p,p+n);p+=n;});return {m,w:A.w,h:A.h,x0:A.x0,z0:A.z0,c:A.c};})();window.__ASM=ASM;GND.setAsm(ASM);
const asph=(x,z)=>{if(!ASM)return false;const i=Math.floor((x-ASM.x0)/ASM.c),j=Math.floor((z-ASM.z0)/ASM.c);return i>=0&&j>=0&&i<ASM.w&&j<ASM.h&&ASM.m[j*ASM.w+i]===1;};
{// strict tree filter: all highway polylines (road half-width + 2 m sidewalk + 2 m), buildings (inside or within 4 m), parking areas
 const G={},cell=(x,z)=>Math.floor(x/20)+','+Math.floor(z/20),put=(x0,z0,x1,z1,o)=>{for(let gx=Math.floor(x0/20);gx<=Math.floor(x1/20);gx++)for(let gz=Math.floor(z0/20);gz<=Math.floor(z1/20);gz++)(G[gx+','+gz]=G[gx+','+gz]||[]).push(o);};
 const HW=(C.hw||C.r).concat(C.r);HW.forEach(r=>{const m=r.w/2+(r.w>=3?4:1.6),mg=m+3;for(let i=0;i<r.p.length-1;i++){const A=r.p[i],B=r.p[i+1];put(Math.min(A[0],B[0])-mg,Math.min(A[1],B[1])-mg,Math.max(A[0],B[0])+mg,Math.max(A[1],B[1])+mg,{t:0,A,B,m,w:r.w});}});
 const poly=(p,m,t)=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);});put(x0-m-3,z0-m-3,x1+m+3,z1+m+3,{t,p,m});};window.__vegG={G,cell};
 C.b.forEach(b=>poly(b.p,4,1));(C.pk||[]).forEach(p=>poly(p,1.5,1));(window.FURN&&FURN.pk||[]).forEach(p=>poly(p,1.5,1));PCAR.L.forEach(c=>poly(c[4],.6,1));BSP.forEach(b=>{const c=Math.cos(b[2]),sn=Math.sin(b[2]);const q=[[-2.4,-1.4],[2.4,-1.4],[2.4,1.2],[-2.4,1.2]].map(([u,v])=>[b[0]+u*c+v*sn,b[1]-u*sn+v*c]);poly(q,1.5,1);});
 const bad=(x,z,e)=>{e=e||0;if(asph(x,z))return true;const l=G[cell(x,z)];if(!l)return false;for(const o of l){if(o.t===0){if(segD(x,z,o.A,o.B)[0]<o.m+e)return true;}else{if(inPoly(x,z,o.p))return true;for(let i=0;i<o.p.length;i++){const A=o.p[i],B=o.p[(i+1)%o.p.length];if(segD(x,z,A,B)[0]<o.m)return true;}}}return false;};
 window.__treeBad=bad;window.__vegExt={spruce:2.2,bush:1.6,rowan:.6,tuft:0};const n0=trees.length;for(let i=trees.length-1;i>=0;i--)if(bad(trees[i][0],trees[i][1],trees[i][2]=='bush'?2:0))trees.splice(i,1);
 for(let i=lamps.length-1;i>=0;i--){const l=G[cell(lamps[i][0],lamps[i][1])];if(l&&l.some(o=>o.t===0&&segD(lamps[i][0],lamps[i][1],o.A,o.B)[0]<o.m-3.3))lamps.splice(i,1);}
 console.log('TREES kept',trees.length,'removed',n0-trees.length,'violations',trees.filter(t=>bad(t[0],t[1])).length);}
// varied trees: birch, spruce, linden, poplar (instanced per type)
const barkB=tex(cv(32,128,(g,w,h)=>{g.fillStyle='#e9e6de';g.fillRect(0,0,w,h);g.fillStyle='#2a2a2a';for(let i=0;i<40;i++)g.fillRect(rnd()*w,rnd()*h,4+rnd()*10,1+rnd()*2);}));
const TT={birch:{tr:new THREE.CylinderGeometry(.1,.16,6,6).translate(0,3,0),trm:new THREE.MeshLambertMaterial({map:barkB}),cr:[new THREE.IcosahedronGeometry(1,mobile?0:1).scale(1.7,3.2,1.7).translate(0,6.3,0)],h:[.27,.5,.42]},
 spruce:{tr:new THREE.CylinderGeometry(.15,.25,2,6).translate(0,1,0),trm:new THREE.MeshLambertMaterial({color:0x4a3526}),cr:[new THREE.ConeGeometry(2.4,4.5,8).translate(0,3.6,0),new THREE.ConeGeometry(1.7,4,8).translate(0,6.6,0),new THREE.ConeGeometry(1,3,8).translate(0,9,0)],h:[.36,.45,.18]},
 linden:{tr:new THREE.CylinderGeometry(.2,.3,3.2,6).translate(0,1.6,0),trm:new THREE.MeshLambertMaterial({color:0x5a4030}),cr:[new THREE.IcosahedronGeometry(2.9,mobile?0:1).scale(1,.9,1).translate(0,5.4,0)],h:[.25,.48,.26]},
 poplar:{tr:new THREE.CylinderGeometry(.18,.28,3,6).translate(0,1.5,0),trm:new THREE.MeshLambertMaterial({color:0x6a5a4a}),cr:[new THREE.IcosahedronGeometry(1,mobile?0:1).scale(1.5,6,1.5).translate(0,8,0)],h:[.22,.42,.3]}};
TT.pine={tr:new THREE.CylinderGeometry(.16,.3,10,6).translate(0,5,0),trm:new THREE.MeshLambertMaterial({color:0x8a5a3a}),cr:[new THREE.IcosahedronGeometry(1,mobile?0:1).scale(2.3,2.4,2.3).translate(0,11,0)],h:[.3,.4,.2]};
TT.maple={tr:new THREE.CylinderGeometry(.18,.28,3,6).translate(0,1.5,0),trm:TT.linden.trm,cr:[new THREE.IcosahedronGeometry(3.2,mobile?0:1).scale(1,.78,1).translate(0,5.2,0)],h:[.24,.5,.27]};
TT.rowan={tr:new THREE.CylinderGeometry(.1,.16,2.2,6).translate(0,1.1,0),trm:TT.poplar.trm,cr:[new THREE.IcosahedronGeometry(1.8,mobile?0:1).scale(1,1.05,1).translate(0,3.7,0)],h:[.25,.45,.3]};
TT.popcut={tr:new THREE.CylinderGeometry(.32,.45,7,7).translate(0,3.5,0),trm:TT.poplar.trm,cr:[new THREE.IcosahedronGeometry(1,0).scale(1.3,1.5,1.3).translate(.6,8.3,.2),new THREE.IcosahedronGeometry(1,0).scale(1.2,1.6,1.2).translate(-.7,8.7,-.3),new THREE.IcosahedronGeometry(1,0).scale(1,1.3,1).translate(0,9.8,.5)],h:[.23,.45,.3]};
TT.bush={tr:null,cr:[new THREE.IcosahedronGeometry(1,0).scale(1.3,.85,1.3).translate(0,.7,0)],h:[.26,.45,.24],r:.6,ns:1};
TT.tuft={tr:null,cr:[new THREE.ConeGeometry(.45,.55,5).translate(0,.25,0)],h:[.22,.45,.33],r:.4,ns:1};
{const HT={birch:15,poplar:22,linden:14,spruce:13,pine:20,maple:11,rowan:7,popcut:11,bush:2.6};Object.entries(HT).forEach(([k,H])=>{const T=TT[k];let top=0;T.cr.forEach(g=>{g.computeBoundingBox();top=Math.max(top,g.boundingBox.max.y);});const f=H/top;T.cr=T.cr.map(g=>g.clone().scale(f,f,f));if(T.tr)T.tr=T.tr.clone().scale(f,f,f);});}
Object.values(TT).forEach(T=>{T.crLo=T.cr.map(g=>{if(g.type!=='IcosahedronGeometry'||!g.parameters||g.parameters.detail===0)return g;const p=g.attributes.position;const b=new THREE.Box3().setFromBufferAttribute(p),sz=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());return new THREE.IcosahedronGeometry(1,0).scale(sz.x/2,sz.y/2,sz.z/2).translate(c.x,c.y,c.z);});});
const TL={};Object.keys(TT).forEach(k=>TL[k]=[]);
trees.forEach((t,i)=>{const r=rnd();const type=typeof t[2]=='string'?t[2]:t.length>2&&t[2]?(r<.35?'birch':r<.6?'spruce':r<.8?'linden':'maple'):(r<.3?'linden':r<.52?'maple':r<.72?'popcut':r<.88?'birch':'poplar');TL[type].push(t);});
const M=new THREE.Matrix4(),col=new THREE.Color(),Qt=new THREE.Quaternion(),Vs=new THREE.Vector3(),Vp=new THREE.Vector3(),Yax=new THREE.Vector3(0,1,0);
// per-chunk instancing (250 m cells) so far trees can be culled by distance on phones
const TCH=250;const TREECH=[];window.__TREECH=TREECH;{const byC={};Object.keys(TT).forEach(k=>TL[k].forEach(t=>{const c=Math.floor(t[0]/TCH)+','+Math.floor(t[1]/TCH)+','+k;(byC[c]=byC[c]||[]).push(t);}));
 const crM={};{const lt=new THREE.TextureLoader().load('tex/leaf.jpg');lt.wrapS=lt.wrapT=THREE.RepeatWrapping;lt.repeat.set(3,3);Object.keys(TT).forEach(k=>crM[k]=new THREE.MeshLambertMaterial({color:0xffffff,map:k=='tuft'?null:lt}));}
 GSTR.mk=(k,L,rr)=>{rr=rr||rnd;const T0=TT[k];const grp=new THREE.Group();let cx=0,cz=0;
  const tr=T0.tr?new THREE.InstancedMesh(T0.tr,T0.trm,L.length):null;if(tr){tr.castShadow=true;tr.frustumCulled=false;grp.add(tr);}grp.userData.r=T0.r||1;
  grp.userData.k=k;grp.userData.L=L;grp.userData.MS=new Float32Array(L.length*16);const crs=T0.cr.map((g,ci)=>{const m=new THREE.InstancedMesh(g,crM[k],L.length);m.userData.ci=ci;m.castShadow=!T0.ns;m.frustumCulled=false;grp.add(m);return m;});
  L.forEach((t,i)=>{cx+=t[0];cz+=t[1];const s=.7+rr()*.6;Qt.setFromAxisAngle(Yax,rr()*6.28);M.compose(Vp.set(t[0],0,t[1]),Qt,Vs.set(s,s*(.85+rr()*.3),s));M.toArray(grp.userData.MS,i*16);if(tr)tr.setMatrixAt(i,M);
   col.setHSL(T0.h[0]+(rr()-.5)*.05,T0.h[1]+(rr()-.5)*.15,T0.h[2]*(.8+rr()*.4));crs.forEach(m=>{m.setMatrixAt(i,M);m.setColorAt(i,col);});});
  grp.userData.c=[cx/L.length,cz/L.length];{let r=0;const c0=grp.userData.c;L.forEach(t=>{r=Math.max(r,Math.hypot(t[0]-c0[0],t[1]-c0[1]));});const sp=new THREE.Sphere(new THREE.Vector3(c0[0],6,c0[1]),r+14);grp.userData.rad=r;
  const cl=g=>{const q=g.clone();q.boundingSphere=sp.clone();return q;};grp.children.forEach(m=>{if(m.userData.ci!==undefined){m.userData.hiG=cl(T0.cr[m.userData.ci]);m.userData.loG=cl(T0.crLo[m.userData.ci]);m.geometry=m.userData.hiG;}else m.geometry=cl(m.geometry);m.frustumCulled=true;});}
 return grp;};Object.keys(byC).forEach(c=>{const g=GSTR.mk(c.split(',')[2],byC[c]);S.add(g);TREECH.push(g);});}
// GREEN stream: build dense greenery chunks near the camera a few ms per frame, dispose far ones
GSTR.live={};GSTR.q=[];GSTR.pend={};GSTR.done={};
GSTR.build=(k,gx,gz,L,rr)=>{const CH=GSTR.CH,by={};L.forEach(t=>(by[t[2]]=by[t[2]]||[]).push(t));const gs=Object.keys(by).map(tp=>{const m=GSTR.mk(tp,by[tp],rr);S.add(m);TREECH.push(m);return m;});GSTR.live[k]={gs,c:[(gx+.5)*CH,(gz+.5)*CH]};delete GSTR.pend[k];};
// Web Worker for greenery placement (point-in-polygon / road-distance tests); falls back to the main thread
try{if(!/nowk/.test(Q)&&window.Worker){const vg=window.__vegG;const src=['self.window=self;const mobile='+JSON.stringify(mobile)+',GSET={green:'+GSET.green+'};',inPoly.toString(),segD.toString(),'const CS='+CS+';let Gd,VG,GSTR={};function hit(x,z){const l=Gd[Math.floor(x/CS)+","+Math.floor(z/CS)];return l&&l.some(p=>inPoly(x,z,p));}',
  'let ASM=null;const asph=(x,z)=>{if(!ASM)return false;const i=Math.floor((x-ASM.x0)/ASM.c),j=Math.floor((z-ASM.z0)/ASM.c);return i>=0&&j>=0&&i<ASM.w&&j<ASM.h&&ASM.m[j*ASM.w+i]===1;};const bad=(x,z,e)=>{e=e||0;if(asph(x,z))return true;const l=VG.G[VG.cell(x,z)];if(!l)return false;for(const o of l){if(o.t===0){if(segD(x,z,o.A,o.B)[0]<o.m+e)return true;}else{if(inPoly(x,z,o.p))return true;for(let i=0;i<o.p.length;i++){const A=o.p[i],B=o.p[(i+1)%o.p.length];if(segD(x,z,A,B)[0]<o.m)return true;}}}return false;};self.__treeBad=bad;',
  'let MIX,DEN,CH;','onmessage=e=>{const d=e.data;if(d.init){Gd=d.Gd;ASM=d.ASM;VG={G:d.G,cell:(x,z)=>Math.floor(x/20)+","+Math.floor(z/20)};GSTR.idx=d.idx;GSTR.CH=d.CH;CH=d.CH;MIX=d.MIX;DEN=d.DEN;GSTR.gen=eval("("+d.gen+")");return;}const [gx,gz,k]=d;const g=GSTR.gen(gx,gz);postMessage([k,g.L,g.s]);};'].join('\n');
  const w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));w.onmessage=e=>{const [k,L,sd]=e.data;GSTR.done[k]={L,s:sd};};w.onerror=e=>{console.log('GREEN worker failed, main thread',e.message);GSTR.wk=null;GSTR.pend={};};
  w.postMessage({init:1,ASM,Gd,G:vg.G,idx:GSTR.idx,CH:GSTR.CH,MIX:GSTR.MIX,DEN:GSTR.DEN,gen:GSTR.gen.toString()});GSTR.wk=w;}}catch(e){console.log('no worker',e);GSTR.wk=null;}
GSTR.tick=(px,pz,force)=>{const CH=GSTR.CH,RA=(topv?600:mobile?330:430)*GSET.gdist,RD=RA+200,t0=performance.now(),cgx=Math.floor(px/CH),cgz=Math.floor(pz/CH),n=Math.ceil(RA/CH)+1,want=[];
 for(let dx=-n;dx<=n;dx++)for(let dz=-n;dz<=n;dz++){const gx=cgx+dx,gz=cgz+dz,k=gx+','+gz;if(GSTR.live[k]||!GSTR.idx[k])continue;const d=Math.hypot((gx+.5)*CH-px,(gz+.5)*CH-pz);if(d<RA+CH*.71)want.push([d,gx,gz,k]);}
 want.sort((a,b)=>a[0]-b[0]);
 const W=!force&&GSTR.wk;for(const [d,gx,gz,k] of want){if(W){if(!GSTR.pend[k]&&!GSTR.done[k]){GSTR.pend[k]=1;W.postMessage([gx,gz,k]);}continue;}const g=GSTR.gen(gx,gz);GSTR.build(k,gx,gz,g.L,g.R);if(!force&&performance.now()-t0>6)break;}
 // worker results: instance them within a small per-frame budget
 for(const k in GSTR.done){if(performance.now()-t0>(force?1e9:4))break;const r=GSTR.done[k];delete GSTR.done[k];if(GSTR.live[k])continue;const [gx,gz]=k.split(',').map(Number);if(Math.hypot((gx+.5)*CH-px,(gz+.5)*CH-pz)>RD+CH*.71)continue;let sd=r.s;GSTR.build(k,gx,gz,r.L,()=>(sd=(sd*16807)%2147483647)/2147483647);}
 for(const k in GSTR.live){const L=GSTR.live[k];if(Math.hypot(L.c[0]-px,L.c[1]-pz)>RD+CH*.71){L.gs.forEach(g=>{IMP.free&&IMP.free(g);S.remove(g);const i=TREECH.indexOf(g);if(i>=0)TREECH.splice(i,1);g.children.forEach(m=>{m.dispose&&m.dispose();m.geometry.dispose();if(m.userData.hiG){m.userData.hiG.dispose();m.userData.loG.dispose();}});});delete GSTR.live[k];}}};window.__GSTR=GSTR;
// ---------- NEAR: detailed trees/bushes baked offline with ez-tree (MIT, D. Greenheck) + wind; LOD swap with far instanced crowns ----------
const WIND={value:0};window.__WIND=WIND;
const windPatch=(m,amp)=>{m.onBeforeCompile=sh=>{sh.uniforms.uWT=WIND;sh.vertexShader='uniform float uWT;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 vec2 ip=instanceMatrix[3].xz;
 #else
 vec2 ip=vec2(0.);
 #endif
 float hh=max(position.y,0.);float ph=uWT*1.3+ip.x*.21+ip.y*.17;
 transformed.x+=(sin(ph)*.6+sin(ph*2.3+position.z*.8)*.25)*${amp.toFixed(3)}*hh*hh*.01;
 transformed.z+=(cos(ph*.9)*.5+sin(ph*2.9+position.x*.9)*.25)*${amp.toFixed(3)}*hh*hh*.01;`);};m.customProgramCacheKey=()=>'wind'+amp;};
const NEAR={sp:null,im:{},R:0,f:0};window.__NEAR=NEAR;
{const PR={low:30,medium:40,high:55,ultra:70};NEAR.R=(PR[GSET.preset]||45)*(mobile?.7:1);if(/nonear/.test(Q))NEAR.R=0;}
NEAR.map={birch:'birch',spruce:'spruce',pine:'pine',linden:'linden',poplar:'poplar',maple:'maple',rowan:'rowan',popcut:'popcut',bush:['lilac','hawthorn','shrub']};
if(NEAR.R>0)Promise.all([fetch('data/trees.json').then(r=>r.json()),fetch('data/trees.bin').then(r=>r.arrayBuffer())]).then(([man,bin])=>{
 const TL=new THREE.TextureLoader(),tx={};const T=(n,rep)=>{if(tx[n])return tx[n];const t=TL.load('tex/'+n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;return tx[n]=t;};
 const TINT={birch:0xa8c878,poplar:0x88a868,popcut:0x8fb070,linden:0x8fb468,maple:0x9cbc6c,rowan:0x9ab870,spruce:0x6f8a5c,pine:0x7c9460,lilac:0x7fa060,hawthorn:0x8aa868,shrub:0x92b06a};
 const BT={birch:0xffffff,oak:0xb8a898,pine:0xd8b8a8,willow:0xd0c8c0};
 const rd=(c,a,F)=>new F(bin,a[0],a[1]);
 const mkG=(e,F)=>{const g=new THREE.BufferGeometry();const P=rd(0,e.p,Int16Array),N=rd(0,e.n,Int8Array),U=rd(0,e.u,Int16Array);
  g.setAttribute('position',new THREE.BufferAttribute(Float32Array.from(P,x=>x/500),3));g.setAttribute('normal',new THREE.BufferAttribute(Float32Array.from(N,x=>x/127),3));g.setAttribute('uv',new THREE.BufferAttribute(Float32Array.from(U,x=>x/1000),2));
  g.setIndex(new THREE.BufferAttribute(e.i32?rd(0,e.i,Uint32Array):rd(0,e.i,Uint16Array),1));g.computeBoundingSphere();return g;};
 NEAR.sp={};Object.entries(man).forEach(([k,m])=>{const bm=new THREE.MeshLambertMaterial({map:T('bark_'+m.bark+'.jpg'),color:BT[m.bark],emissive:m.bark=='birch'?0x2a2a2a:0});windPatch(bm,.25);
  const lm=new THREE.MeshLambertMaterial({map:T('leaf_'+m.leaf+'.png'),color:TINT[k]||0xa0c070,alphaTest:.5,side:THREE.DoubleSide});windPatch(lm,1);
  const ld=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:lm.map,alphaTest:.5});
  NEAR.sp[k]=m.v.map(e=>({b:mkG(e.b),l:e.l?mkG(e.l):null,bm,lm,ld}));});
 if(/treegal=/.test(Q)){const m=/treegal=(-?[\d.]+),(-?[\d.]+),(\w+)/.exec(Q);const ks=m[3]=='all'?Object.keys(NEAR.sp):m[3].split('_');ks.forEach((k,i)=>{const V=NEAR.sp[k][0];[['b',V.b,V.bm],['l',V.l,V.lm]].forEach(([n,g,mt])=>{if(!g)return;const o=new THREE.Mesh(g,mt);o.position.set(+m[1]+(i-(ks.length-1)/2)*9,0,+m[2]);o.castShadow=true;if(n=='l')o.customDepthMaterial=V.ld;S.add(o);});});NEAR.R=0.01;window.__TG=1;}
 console.log('NEAR loaded',Object.keys(NEAR.sp).length,'species, R',NEAR.R);NEAR.f=0;}).catch(e=>console.log('NEAR fail',e));
const _m4=new THREE.Matrix4(),_z4=new THREE.Matrix4().makeScale(0,0,0),_c=new THREE.Color();
NEAR.get=(k,v,part)=>{const key=k+v+part;let im=NEAR.im[key];const V=NEAR.sp[k][v];if(!im){im=new THREE.InstancedMesh(part=='b'?V.b:V.l,part=='b'?V.bm:V.lm,64);im.count=0;im.frustumCulled=false;im.castShadow=part=='b'||GSET.shadow>=2;if(part=='l')im.customDepthMaterial=V.ld;im.receiveShadow=true;im.userData.cap=64;S.add(im);NEAR.im[key]=im;}return im;};
NEAR.tick=(px,pz)=>{if(NEAR.sp&&!IMP.ready&&!IMP.tried){IMP.tried=1;try{IMP.bake();}catch(e){console.log('IMP fail',e);}}if(!NEAR.sp||(NEAR.f++)%10)return;const R2=NEAR.R,want={};const used={};
 TREECH.forEach(g=>{const u=g.userData;if(!u.L||!NEAR.map[u.k])return;const c=u.c;const far=!g.visible||Math.hypot(c[0]-px,c[1]-pz)>R2+400;const hid=u.hid||(u.hid=new Set());
  const nowN=new Set();if(!far)u.L.forEach((t,i)=>{if(Math.abs(t[0]-px)<R2&&Math.abs(t[1]-pz)<R2&&Math.hypot(t[0]-px,t[1]-pz)<R2)nowN.add(i);});
  let ch=false;const brk=u.brk;hid.forEach(i=>{if(!nowN.has(i)&&!(brk&&brk.has(i))){_m4.fromArray(u.MS,i*16);g.children.forEach(m=>m.setMatrixAt(i,_m4));hid.delete(i);ch=true;}});
  nowN.forEach(i=>{if(!hid.has(i)){g.children.forEach(m=>m.setMatrixAt(i,_z4));hid.add(i);ch=true;}if(brk&&brk.has(i))return;
   const h=((i*2654435761)^(u.k.length*97))>>>0;let sp=NEAR.map[u.k];if(Array.isArray(sp))sp=sp[h%sp.length];if(!NEAR.sp[sp])return;const v=(h>>>4)%NEAR.sp[sp].length;(want[sp+'|'+v]=want[sp+'|'+v]||[]).push([u.MS,i,h]);});
  if(ch)g.children.forEach(m=>m.instanceMatrix.needsUpdate=true);});
 Object.entries(want).forEach(([kv,L])=>{const [k,v]=kv.split('|');['b','l'].forEach(part=>{if(part=='l'&&!NEAR.sp[k][v].l)return;let im=NEAR.get(k,v,part);
  if(L.length>im.userData.cap){S.remove(im);im.dispose();delete NEAR.im[k+v+part];im=null;const cap=Math.ceil(L.length*1.5);const V=NEAR.sp[k][v];im=new THREE.InstancedMesh(part=='b'?V.b:V.l,part=='b'?V.bm:V.lm,cap);im.frustumCulled=false;im.castShadow=part=='b'||GSET.shadow>=2;if(part=='l')im.customDepthMaterial=V.ld;im.receiveShadow=true;im.userData.cap=cap;S.add(im);NEAR.im[k+v+part]=im;}
  L.forEach(([MS,i,h],j)=>{_m4.fromArray(MS,i*16);im.setMatrixAt(j,_m4);if(part=='l'){_c.setHSL(0,0,1).offsetHSL(((h>>>8)%100)/100*.04-.02,0,((h>>>12)%100)/100*.16-.08);im.setColorAt(j,_c);}});
  im.count=L.length;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;used[k+v+part]=1;});});
 Object.keys(NEAR.im).forEach(key=>{if(!used[key])NEAR.im[key].count=0;});};
// ---------- IMP: billboard impostors baked at runtime from the ez-tree models into a 4x3 atlas; used for far tree chunks ----------
const IMP={ready:false,mat:{}};window.__IMP=IMP;
IMP.bake=()=>{if(IMP.ready||!NEAR.sp||/noimp/.test(Q))return;const MAPK={birch:'birch',spruce:'spruce',pine:'pine',linden:'linden',poplar:'poplar',maple:'maple',rowan:'rowan',popcut:'popcut',bush:'lilac'};
 const TS=mobile?128:256,AW=4*TS,AH=3*TS,rt=new THREE.WebGLRenderTarget(AW,AH);rt.texture.encoding=THREE.sRGBEncoding;const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x606050,.75));const dl=new THREE.DirectionalLight(0xffffff,.65);dl.position.set(3,6,8);sc.add(dl);
 const oc=new THREE.OrthographicCamera(-1,1,1,0,.1,200);const pr=R.getRenderTarget(),pa=R.autoClear,cc=R.getClearColor(new THREE.Color()),ca=R.getClearAlpha(),sm=R.shadowMap.enabled;R.shadowMap.enabled=false;R.setRenderTarget(rt);R.setClearColor(0x000000,0);R.clear();R.autoClear=false;
 const qg=new THREE.PlaneGeometry(1,1).translate(0,.5,0);
 Object.keys(MAPK).forEach((k,i)=>{const V=NEAR.sp[MAPK[k]]&&NEAR.sp[MAPK[k]][0];if(!V)return;const ms=[new THREE.Mesh(V.b,V.bm)];if(V.l)ms.push(new THREE.Mesh(V.l,V.lm));const bb=new THREE.Box3();ms.forEach(m=>{sc.add(m);bb.expandByObject(m);});
  const Sz=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z,bb.max.y)*1.04,cx=(bb.max.x+bb.min.x)/2;oc.left=cx-Sz/2;oc.right=cx+Sz/2;oc.top=Sz;oc.bottom=0;oc.position.set(0,0,100);oc.lookAt(0,0,0);oc.updateProjectionMatrix();
  const tx=i%4,ty=(i/4)|0;rt.viewport.set(tx*TS,ty*TS,TS,TS);rt.scissor.set(tx*TS,ty*TS,TS,TS);rt.scissorTest=true;R.setRenderTarget(rt);R.render(sc,oc);ms.forEach(m=>sc.remove(m));
  const m=new THREE.MeshLambertMaterial({map:rt.texture,alphaTest:.45,side:THREE.DoubleSide});const U={uT:{value:new THREE.Vector4(tx/4,ty/3,1/4,1/3)},uSz:{value:new THREE.Vector2(Sz,Sz)},uCx:{value:cx}};(IMP.tile=IMP.tile||{})[k]=[tx/4,ty/3,Sz,cx];
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader='uniform vec4 uT;uniform vec2 uSz;uniform float uCx;\n'+sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_UV\n vUv=uT.xy+uv*uT.zw;\n#endif').replace('#include <project_vertex>',`
   vec3 ip=instanceMatrix[3].xyz;float sx=length(instanceMatrix[0].xyz),sy=length(instanceMatrix[1].xyz);vec3 cd=cameraPosition-ip;cd.y=0.;cd=normalize(cd+vec3(1e-4,0.,0.));vec3 rgt=vec3(cd.z,0.,-cd.x);
   vec3 wp=ip+rgt*(position.x*uSz.x+uCx)*sx+vec3(0.,1.,0.)*position.y*uSz.y*sy;vec4 mvPosition=viewMatrix*vec4(wp,1.);gl_Position=projectionMatrix*mvPosition;
   #ifndef FLAT_SHADED
   vNormal=normalize((viewMatrix*vec4(normalize(cd+vec3(0.,.7,0.)),0.)).xyz);
   #endif`);};
  m.customProgramCacheKey=()=>'imp'+k;IMP.mat[k]=m;});
 rt.scissorTest=false;R.setRenderTarget(pr);R.autoClear=pa;R.setClearColor(cc,ca);R.shadowMap.enabled=sm;IMP.qg=qg;IMP.rt=rt;
 // ONE material for every species: atlas tile + size come from per-instance attributes -> one draw call per 250 m chunk
 {const m=new THREE.MeshLambertMaterial({map:rt.texture,alphaTest:.45,side:THREE.DoubleSide});m.onBeforeCompile=sh=>{sh.vertexShader='attribute vec4 aTile;\n'+sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_UV\n vUv=aTile.xy+uv*vec2(.25,1./3.);\n#endif').replace('#include <project_vertex>',`
   vec3 ip=instanceMatrix[3].xyz;float sx=length(instanceMatrix[0].xyz),sy=length(instanceMatrix[1].xyz);vec3 cd=cameraPosition-ip;cd.y=0.;cd=normalize(cd+vec3(1e-4,0.,0.));vec3 rgt=vec3(cd.z,0.,-cd.x);
   vec3 wp=ip+rgt*(position.x*aTile.z+aTile.w)*sx+vec3(0.,1.,0.)*position.y*aTile.z*sy;vec4 mvPosition=viewMatrix*vec4(wp,1.);gl_Position=projectionMatrix*mvPosition;
   #ifndef FLAT_SHADED
   vNormal=normalize((viewMatrix*vec4(normalize(cd+vec3(0.,.7,0.)),0.)).xyz);
   #endif`);};m.customProgramCacheKey=()=>'impM';IMP.mm=m;}
 IMP.ready=true;try{cullN=0;}catch(e){}console.log('IMP baked',Object.keys(IMP.mat).length);};
IMP.cells={};IMP.Z=new THREE.Matrix4().makeScale(0,0,0);
// merged per-chunk impostor: every species group of a 250 m cell owns a range in one InstancedMesh; ranges are filled/zeroed as groups switch LOD
IMP.cell=key=>{let c=IMP.cells[key];if(!c){c=IMP.cells[key]={m:null,cap:0,used:0,on:0,items:[]};}return c;};
IMP.grow=(c,need)=>{const cap=Math.max(need,Math.ceil(c.cap*1.5),64);const g=new THREE.InstancedBufferGeometry();g.index=IMP.qg.index;g.setAttribute('position',IMP.qg.attributes.position);g.setAttribute('normal',IMP.qg.attributes.normal);g.setAttribute('uv',IMP.qg.attributes.uv);
 const at=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4);g.setAttribute('aTile',at);const m=new THREE.InstancedMesh(g,IMP.mm,cap);for(let i=0;i<cap;i++)m.setMatrixAt(i,IMP.Z);m.frustumCulled=false;m.castShadow=false;m.visible=false;
 if(c.m){at.array.set(c.m.geometry.attributes.aTile.array.subarray(0,c.used*4));m.instanceMatrix.array.set(c.m.instanceMatrix.array.subarray(0,c.used*16));S.remove(c.m);c.m.geometry.attributes.aTile=null;c.m.dispose();}
 m.visible=c.on>0;c.m=m;c.cap=cap;S.add(m);};
IMP.attach=g=>{const u=g.userData,L=u.L;const c0=u.c||[L[0][0],L[0][1]];const key=Math.floor(c0[0]/250)+','+Math.floor(c0[1]/250);const c=IMP.cell(key);
 // reuse a freed range of the same size if any
 let it=c.items.find(q=>q.free&&q.n>=L.length);if(it){it.free=false;it.g=g;}else{if(c.used+L.length>c.cap)IMP.grow(c,c.used+L.length);it={off:c.used,n:L.length,g};c.used+=L.length;c.items.push(it);}
 const T=IMP.tile[u.k],a=c.m.geometry.attributes.aTile;for(let i=0;i<it.n;i++)a.setXYZW(it.off+i,T[0],T[1],T[2],T[3]);a.needsUpdate=true;u.ipr={c,it,on:false};u.ip=1;};
IMP.set=(g,on)=>{const u=g.userData,r=u.ipr;if(!r||r.on===on)return;r.on=on;const {c,it}=r,m=c.m,M=new THREE.Matrix4(),hid=u.hid?new Set(u.hid):null;
 for(let i=0;i<it.n;i++){if(on&&i<u.L.length&&!(hid&&hid.has(i))){M.fromArray(u.MS,i*16);m.setMatrixAt(it.off+i,M);}else m.setMatrixAt(it.off+i,IMP.Z);}m.instanceMatrix.needsUpdate=true;c.on+=on?1:-1;m.visible=c.on>0;};
IMP.free=g=>{const r=g.userData.ipr;if(!r)return;IMP.set(g,false);r.it.free=true;r.it.g=null;g.userData.ipr=null;};
IMP.dc=()=>Object.values(IMP.cells).filter(c=>c.m&&c.m.visible).length;
// ---------- GRASS: instanced curved blades around the camera (wrap-around field), wind, per-blade colour, distance fade; weeds at road/fence edges ----------
const GRASS={};window.__GRASS=GRASS;{
 const PG={low:[5000,9],medium:[16000,14],high:[40000,22],ultra:[90000,30]};let [N,RG]=PG[GSET.preset]||PG.medium;if(mobile)N=N*.5|0;if(/nograss/.test(Q))N=0;GRASS.N=N;GRASS.R=RG;
 if(N){const seg=4,pos=[],idx=[];for(let i=0;i<=seg;i++){const y=i/seg,w=.05*(1-y*.85);pos.push(-w,y,0,w,y,0);if(i<seg){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_,i)=>i%3==1?1:0),3));g.setIndex(idx);
  const off=new Float32Array(N*4);for(let i=0;i<N;i++){off[i*4]=(Math.random()*2-1)*RG;off[i*4+1]=(Math.random()*2-1)*RG;off[i*4+2]=Math.random();off[i*4+3]=Math.random()*6.283;}
  g.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,4));g.instanceCount=N;
  const MS=128,MC=.5;const md=new Uint8Array(MS*MS*4);const mt=new THREE.DataTexture(md,MS,MS);mt.magFilter=mt.minFilter=THREE.LinearFilter;mt.needsUpdate=true;
  const U={uWT:WIND,uCam:{value:new THREE.Vector2()},uR:{value:RG},uMask:{value:mt},uMO:{value:new THREE.Vector2()},uMS:{value:MS*MC},uCP:{value:new THREE.Vector4(0,0,1,0)}};GRASS.U=U;
  const mat=new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide});
  mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader=`uniform float uWT,uR,uMS;uniform vec4 uCP;uniform vec2 uCam,uMO;uniform sampler2D uMask;attribute vec4 aOff;varying vec3 vGC;\n`+sh.vertexShader.replace('#include <begin_vertex>',`
   vec2 wp=uCam+mod(aOff.xy-uCam+uR,2.*uR)-uR;vec4 mk=texture2D(uMask,(wp-uMO)/uMS);float d=length(wp-uCam)/uR;
   float h=(.22+aOff.z*.3)*mk.r*(1.+mk.g*1.3)*smoothstep(1.,.6,d);{vec2 q=wp-uCP.xy;vec2 l=vec2(q.x*uCP.z-q.y*uCP.w,q.x*uCP.w+q.y*uCP.z);h*=1.-(1.-smoothstep(1.05,1.35,abs(l.x)))*(1.-smoothstep(2.45,2.8,abs(l.y)));}float y=position.y;
   float ca=cos(aOff.w),sa=sin(aOff.w);float ph=uWT*1.8+wp.x*.25+wp.y*.19;float bend=(.25+aOff.z*.35+sin(ph)*.25+mk.g*.2)*y*y;
   vec3 transformed=vec3(position.x*ca*(1.+mk.g),y*h,position.x*sa*(1.+mk.g));transformed.xz+=vec2(ca,sa).yx*vec2(-1.,1.)*bend*h+vec2(sin(ph),cos(ph*.8))*.12*y*y*h;
   transformed.xz+=wp;
   vGC=mix(vec3(.20,.30,.09),vec3(.42,.56,.18),aOff.z)*mix(.4,1.,y);vGC=mix(vGC,vec3(.40,.42,.18),mk.g*.4*aOff.z);`).replace('#include <project_vertex>','vec4 mvPosition=viewMatrix*vec4(transformed,1.);gl_Position=projectionMatrix*mvPosition;');
   sh.fragmentShader='varying vec3 vGC;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb*=vGC;');};
  const gm=new THREE.Mesh(g,mat);gm.frustumCulled=false;gm.receiveShadow=true;S.add(gm);GRASS.m=gm;
  // CPU mask (0.5 m cells, 64 m square around the camera): R=grass allowed, G=weeds (verge just outside the road/sidewalk margin)
  GRASS.c=[1e9,1e9];GRASS.tick=(px,pz)=>{U.uCam.value.set(px,pz);{const e=car.rotation.y;U.uCP.value.set(car.position.x,car.position.z,Math.cos(e),Math.sin(e));}if(Math.hypot(px-GRASS.c[0],pz-GRASS.c[1])<MS*MC*.5-RG-2)return;GRASS.c=[px,pz];const ox=Math.round(px-MS*MC/2),oz=Math.round(pz-MS*MC/2);U.uMO.value.set(ox,oz);
   const VG=window.__vegG;for(let j=0;j<MS;j++)for(let i=0;i<MS;i++){const x=ox+(i+.5)*MC,z=oz+(j+.5)*MC,k=(j*MS+i)*4;let a=255,w=0;
    if(hit(x,z)||asph(x,z))a=0;else if(VG){const l=VG.G[VG.cell(x,z)];if(l)for(const o of l){if(o.t===0){const d=segD(x,z,o.A,o.B)[0],e=o.w/2+(o.w>=6?2.9:o.w>=3?.5:.15);if(d<e){a=0;break;}if(d<e+1.1&&o.w>=3)w=255;}else if(o.m<2&&inPoly(x,z,o.p)){a=0;break;}}}
    md[k]=a;md[k+1]=a?w:0;md[k+2]=0;md[k+3]=255;}mt.needsUpdate=true;};}}

const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.07,.1,7,6).translate(0,3.5,0),new THREE.MeshLambertMaterial({color:0x55585c}),lamps.length);
const head=new THREE.InstancedMesh(new THREE.BoxGeometry(.3,.15,1.6).translate(0,7,.7),new THREE.MeshBasicMaterial({color:0xfff6d8}),lamps.length);
lamps.forEach((l,i)=>{M.makeRotationY(l[2]).setPosition(l[0],0,l[1]);pole.setMatrixAt(i,M);head.setMatrixAt(i,M);});pole.castShadow=true;S.add(pole,head);
PT('junctions,');// ---------- junctions, curbs/sidewalks, traffic lights, signs, crossings, bus stops ----------
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
 // approaches: road segments arriving at this node; head faces oncoming traffic, pole on driver's right sidewalk before stop line
 const AP=[];C.r.forEach(r=>{if(r.w<5)return;r.p.forEach((q,i)=>{if(Math.hypot(q[0]-x,q[1]-z)>4)return;[i-1,i+1].forEach(j=>{const o=r.p[j];if(!o)return;let ux=q[0]-o[0],uz=q[1]-o[1];const l=Math.hypot(ux,uz);if(l<8)return;ux/=l;uz/=l;if(AP.some(a=>a.ux*ux+a.uz*uz>.85))return;AP.push({ux,uz,w:r.w});});});});
 if(!AP.length){const s=Math.sin(ang),c=Math.cos(ang);AP.push({ux:s,uz:c,w},{ux:-s,uz:-c,w});}
 AP.forEach(A=>{const {ux,uz}=A,hw=A.w/2,b=hw+4.5,rt=hw+1.3;const px=x-ux*b-uz*rt,pz=z-uz*b+ux*rt;const ax=Math.abs(Math.sin(Math.atan2(ux,uz)-ang))<.5?0:1;
  const g=new THREE.Group();g.position.set(px,0,pz);g.rotation.y=Math.atan2(-ux,-uz);(window.__LPOST=window.__LPOST||[]).push([px,pz]);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,3.4,8),poleM);pole.position.y=1.7;g.add(pole);const bx=new THREE.Mesh(new THREE.BoxGeometry(.38,1.05,.25),boxM);bx.position.set(0,3.6,0);g.add(bx);
  const ms=['#ff2a1a','#ffc21a','#22e05a'].map((cl,k)=>{const m=new THREE.MeshBasicMaterial({color:0x222222});const l=new THREE.Mesh(lampG,m);l.position.set(0,3.95-k*.34,.13);g.add(l);return [m,new THREE.Color(cl)];});
  S.add(g);L.heads.push({ax,ms});});LIGHTS.push(L);}
C.ts.forEach(t=>addLight(t[0],t[1],t[2],10));
junc.filter(J=>J.w>=8).sort((a,b)=>b.n-a.n).forEach(J=>{if(LIGHTS.length<22)addLight(J.p[0],J.p[1],J.ang,J.w);});
function lstate(L,ax,t){const c=((t+L.off)%20+20)%20;const a=c<8?2:c<10?1:0,b=c<10?0:c<18?2:1;return ax?b:a;}// 0 red 1 yellow 2 green
function updLights(t){LIGHTS.forEach(L=>L.heads.forEach(h=>{const s=lstate(L,h.ax,t);h.ms.forEach(([m,c],k)=>m.color.copy(k===[0,1,2].indexOf(s===0?0:s===1?1:2)?c:new THREE.Color(0x222222)));}));}
function aiMustStop(x,z,a,t){for(const L of LIGHTS){const dx=L.x-x,dz=L.z-z,d=Math.hypot(dx,dz);if(d<5||d>22)continue;if((dx*Math.sin(a)+dz*Math.cos(a))/d<.8)continue;const ax=Math.abs(Math.sin(a-L.ang))<.5?0:1;if(lstate(L,ax,t)<2)return true;}return false;}
PT('lane markings');// ---------- lane markings (decals), stop lines, manholes & drains ----------
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
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xf2f2ea,roughness:.6,polygonOffset:true,polygonOffsetFactor:-.5,polygonOffsetUnits:-3,depthWrite:false}));m.renderOrder=3;m.receiveShadow=true;S.add(m);}
{const mh=[],dr=[];major.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<20)continue;const ux=dx/L,uz=dz/L,nx=-uz,nz=ux;
  for(let t=10+rnd()*20;t<L-8;t+=35+rnd()*30){const o=(r.w/4)*(rnd()<.5?1:-1);mh.push([a[0]+ux*t+nx*o,a[1]+uz*t+nz*o]);}
  for(let t=8;t<L-5;t+=25){const o=(r.w/2-.25);dr.push([a[0]+ux*t+nx*o,a[1]+uz*t+nz*o,Math.atan2(ux,uz)]);}}});
 const mhT=new THREE.CanvasTexture(cv(128,128,(g)=>{g.fillStyle='#2e2c2a';g.beginPath();g.arc(64,64,62,0,6.3);g.fill();g.strokeStyle='#4a4744';g.lineWidth=4;for(let r=14;r<60;r+=12){g.beginPath();g.arc(64,64,r,0,6.3);g.stroke();}for(let k=0;k<8;k++){g.beginPath();g.moveTo(64,64);g.lineTo(64+Math.cos(k*.785)*58,64+Math.sin(k*.785)*58);g.stroke();}}));
 const drT=new THREE.CanvasTexture(cv(64,128,(g)=>{g.fillStyle='#2a2826';g.fillRect(0,0,64,128);g.fillStyle='#111';for(let y=8;y<120;y+=12)g.fillRect(8,y,48,6);}));
 const mk=(geo,map,L,rot)=>{if(!L.length)return;const im=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({map,roughness:.5,metalness:.6,transparent:true,polygonOffset:true,polygonOffsetFactor:-.5,polygonOffsetUnits:-2,depthWrite:false}),L.length);im.renderOrder=2;
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
// (old flat sign plates replaced by the GOST sign system below)
// zebra crossings
{const zt=new THREE.CanvasTexture(cv(256,64,(g)=>{g.clearRect(0,0,256,64);g.fillStyle='rgba(245,245,240,.95)';for(let x=8;x<256;x+=32)g.fillRect(x,0,16,64);}));
 C.cr.forEach(q=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(q[3],3.2),new THREE.MeshLambertMaterial({map:zt,transparent:true,depthWrite:false}));m.geometry.rotateX(-Math.PI/2);m.position.set(q[0],.085,q[1]);m.rotation.y=q[2];m.renderOrder=2;m.material.polygonOffset=true;m.material.polygonOffsetFactor=-3;S.add(m);});}
// ---------- GOST R 52290 road signs: OSM city limits + one-way ways, derived 2.1/2.4 at junctions, 5.19.1/5.19.2 at zebras, 5.16 + 3.27 at bus stops,
// 3.24 speed limits, 1.23 children near schools/kindergartens, 6.4 parking. Right side, plate bottom ~1.9 m, off the carriageway.
// One atlas, instanced: poles + retroreflective fronts (brighten when headlight direction ~ view direction) + grey galvanised backs = 3 draw calls.
const SGN={L:[],T:{},fall:[]};window.__SGN=SGN;{
 const TS=128,AC=8,AR=4,cvA=document.createElement('canvas');cvA.width=TS*AC;cvA.height=TS*AR;const g=cvA.getContext('2d');let slot=0;
 const tile=(name,wide,draw)=>{const sx=(slot%AC)*TS,sy=Math.floor(slot/AC)*TS;if(wide&&slot%AC==AC-1){slot++;return tile(name,wide,draw);}slot+=wide?2:1;g.save();g.translate(sx,sy);draw(g,wide?2*TS:TS,TS);g.restore();SGN.T[name]=[sx/cvA.width,1-(sy+TS)/cvA.height,(wide?2:1)*TS/cvA.width,TS/cvA.height,wide?2:1];};
 const circ=(g,c,r,f)=>{g.beginPath();g.arc(c,c,r,0,6.2832);g.fillStyle=f;g.fill();};const poly=(g,P,f,st,lw)=>{g.beginPath();P.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();if(f){g.fillStyle=f;g.fill();}if(st){g.strokeStyle=st;g.lineWidth=lw;g.stroke();}};
 const sq=(g,f)=>{g.fillStyle='#fff';g.beginPath();g.roundRect?g.roundRect(4,4,120,120,10):g.rect(4,4,120,120);g.fill();g.fillStyle=f;g.beginPath();g.roundRect?g.roundRect(9,9,110,110,7):g.rect(9,9,110,110);g.fill();};
 const BL='#1f5fb4',RD='#d42027';
 const man=(g,x,y,s,c)=>{g.fillStyle=c;g.beginPath();g.arc(x,y-30*s,6*s,0,6.28);g.fill();g.lineWidth=6*s;g.strokeStyle=c;g.lineCap='round';g.beginPath();g.moveTo(x,y-22*s);g.lineTo(x-2*s,y);g.lineTo(x-10*s,y+18*s);g.moveTo(x-2*s,y);g.lineTo(x+9*s,y+17*s);g.moveTo(x-1*s,y-16*s);g.lineTo(x-12*s,y-4*s);g.moveTo(x-1*s,y-16*s);g.lineTo(x+11*s,y-6*s);g.stroke();};
 tile('2.1',0,g=>{poly(g,[[64,2],[126,64],[64,126],[2,64]],'#fff','#222',2);poly(g,[[64,22],[106,64],[64,106],[22,64]],'#f6c400');});
 tile('2.4',0,g=>{poly(g,[[4,10],[124,10],[64,122]],'#fff');poly(g,[[4,10],[124,10],[64,122]],null,RD,13);});
 const ped=(m)=>g=>{sq(g,BL);poly(g,[[64,18],[112,106],[16,106]],'#fff');g.fillStyle='#222';for(let i=0;i<4;i++)g.fillRect(34+i*16,90,9,12);g.save();if(m){g.translate(128,0);g.scale(-1,1);}man(g,62,72,1,'#222');g.restore();};
 tile('5.19.1',0,ped(0));tile('5.19.2',0,ped(1));
 tile('5.16',0,g=>{sq(g,BL);g.fillStyle='#fff';g.fillRect(26,40,76,40);g.fillStyle=BL;for(let i=0;i<4;i++)g.fillRect(31+i*17,46,12,14);g.fillStyle='#fff';circ(g,0,0,'#fff');g.beginPath();g.arc(42,84,8,0,6.3);g.arc(86,84,8,0,6.3);g.fill();});
 tile('3.27',0,g=>{circ(g,64,62,RD);circ(g,64,50,BL);g.strokeStyle=RD;g.lineWidth=11;g.beginPath();g.moveTo(30,30);g.lineTo(98,98);g.moveTo(98,30);g.lineTo(30,98);g.stroke();});
 const spd=n=>g=>{circ(g,64,62,RD);circ(g,64,49,'#fff');g.fillStyle='#111';g.font='bold 58px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(n,64,68);};
 tile('3.24.60',0,spd('60'));tile('3.24.40',0,spd('40'));tile('3.24.20',0,spd('20'));
 tile('1.23',0,g=>{poly(g,[[64,6],[124,116],[4,116]],'#fff');poly(g,[[64,6],[124,116],[4,116]],null,RD,13);man(g,52,88,.75,'#111');man(g,76,92,.62,'#111');});
 tile('6.4',0,g=>{sq(g,BL);g.fillStyle='#fff';g.font='bold 92px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('P',64,70);});
 tile('5.5',0,g=>{sq(g,BL);poly(g,[[64,18],[100,58],[76,58],[76,110],[52,110],[52,58],[28,58]],'#fff');});
 tile('3.1',0,g=>{circ(g,64,62,RD);g.fillStyle='#fff';g.fillRect(22,54,84,20);});
 const city=(nm,out)=>g=>{g.fillStyle='#fff';g.fillRect(2,14,252,100);g.strokeStyle='#111';g.lineWidth=5;g.strokeRect(9,21,238,86);g.fillStyle='#111';let fs=44;g.font='bold '+fs+'px Arial,sans-serif';while(g.measureText(nm).width>220&&fs>20){fs-=2;g.font='bold '+fs+'px Arial,sans-serif';}g.textAlign='center';g.textBaseline='middle';g.fillText(nm,128,66);if(out){g.strokeStyle=RD;g.lineWidth=9;g.beginPath();g.moveTo(14,104);g.lineTo(242,26);g.stroke();}};
 const names=['Лыткарино',...new Set(((window.SOSM||{}).cl||[]).map(c=>c[2]).filter(n=>n&&n!='Лыткарино'))];names.forEach(n=>{tile('5.23:'+n,1,city(n,0));tile('5.24:'+n,1,city(n,1));});
 const atl=new THREE.CanvasTexture(cvA);atl.encoding=THREE.sRGBEncoding;atl.anisotropy=4;atl.generateMipmaps=true;SGN.atlas=cvA;
 // ---- placement
 const RD3=C.r.filter(r=>r.w>=3);const near=(x,z,R)=>SGN.L.some(q=>Math.abs(q.x-x)<R&&Math.abs(q.z-z)<R);
 const put=(type,x,z,dx,dz,w,o)=>{const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;const rx=-dz,rz=dx,off=w/2+.9+(o||0);const X=x+rx*off,Z=z+rz*off;if(!SGN.T[type]||hit(X,Z)||near(X,Z,1.2))return null;const q={type,x:X,z:Z,a:Math.atan2(-dx,-dz)};SGN.L.push(q);return q;};
 // nearest drivable road point
 const nearest=(x,z,maxD)=>{let bd=maxD,b=null;RD3.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const A=r.p[i],B=r.p[i+1];if(Math.abs(A[0]-x)>maxD+300&&Math.abs(B[0]-x)>maxD+300)continue;const q=segD(x,z,A,B);if(q[0]<bd){bd=q[0];b={r,A,B,px:q[1],pz:q[2],d:q[0]};}}});return b;};
 // junction approaches (2.1 for the wider road, 2.4 for the narrower) where no traffic light
 const AJ={};RD3.forEach(r=>r.p.forEach((q,i)=>{const k=jk(q);(AJ[k]=AJ[k]||[]).push([r,i]);}));
 Object.values(AJ).forEach(E=>{if(E.length<2)return;const P=E[0][0].p[E[0][1]];let deg=0;E.forEach(([r,i])=>{deg+=(i>0)+(i<r.p.length-1);});if(deg<3)return;if(LIGHTS.some(l=>Math.hypot(l.x-P[0],l.z-P[1])<35))return;
  const ws=E.map(e=>e[0].w).sort((a,b)=>b-a),wmax=ws[0],wmin=ws[ws.length-1];if(wmax<6&&wmax===wmin)return;if(wmin<4&&E.every(e=>e[0].w>=wmax-.01||e[0].w<4)){E.forEach(([r,i])=>{if(r.w>=4)return;[-1,1].forEach(sd=>{const j=i+sd;if(j<0||j>=r.p.length)return;const A=r.p[j],dx=P[0]-A[0],dz=P[1]-A[1],L=Math.hypot(dx,dz);if(L<12)return;put('2.4',P[0]-dx/L*(wmax/2+3),P[1]-dz/L*(wmax/2+3),dx,dz,r.w);});});return;}
  E.forEach(([r,i])=>[-1,1].forEach(sd=>{const j=i+sd;if(j<0||j>=r.p.length)return;const A=r.p[j],dx=P[0]-A[0],dz=P[1]-A[1],L=Math.hypot(dx,dz);if(L<16)return;const t=Math.max(8,wmax/2+5);
   put(r.w>=wmax-.01?'2.1':'2.4',P[0]-dx/L*t,P[1]-dz/L*t,dx,dz,r.w);}));});
 // zebras: 5.19.1 on the right at the near edge, 5.19.2 on the left at the far edge, both directions
 (C.cr||[]).forEach(q=>{const ux=Math.sin(q[2]),uz=Math.cos(q[2]),w=q[3];[1,-1].forEach(sd=>{const dx=ux*sd,dz=uz*sd;put('5.19.1',q[0]-dx*1.8,q[1]-dz*1.8,dx,dz,w);put('5.19.2',q[0]+dx*1.8,q[1]+dz*1.8,dx,dz,w,-(w+1.8));});});
 // bus stops: 5.16 at the shelter, 3.27 no stopping 20 m before
 BSP.forEach(b=>{const nx=-Math.sin(b[2]),nz=-Math.cos(b[2]);const dx=nz,dz=-nx;const c=Math.cos(b[2]),sn=Math.sin(b[2]);const X=b[0]+c*2.6+sn*1.1,Z=b[1]-sn*2.6+c*1.1;if(!near(X,Z,1)){SGN.L.push({type:'5.16',x:X,z:Z,a:Math.atan2(-dx,-dz)});}
  const rx=b[0]-nx*(b[5]||0),rz=b[1]-nz*(b[5]||0);put('3.27',rx-dx*20,rz-dz*20,dx,dz,(b[4]||3)*2);});
 // children + 40 near schools / kindergartens
 C.b.filter(b=>b.k=='school'||b.k=='kindergarten').forEach(b=>{let cx=0,cz=0;b.p.forEach(q=>{cx+=q[0];cz+=q[1];});cx/=b.p.length;cz/=b.p.length;const n=nearest(cx,cz,90);if(!n)return;const ux=n.B[0]-n.A[0],uz=n.B[1]-n.A[1],L=Math.hypot(ux,uz);
  [1,-1].forEach(sd=>{const dx=ux/L*sd,dz=uz/L*sd;put('1.23',n.px-dx*60,n.pz-dz*60,dx,dz,n.r.w);put('3.24.40',n.px-dx*57,n.pz-dz*57,dx,dz,n.r.w);});});
 // 60 on wide roads every ~700 m each direction
 RD3.filter(r=>r.w>=6).forEach(r=>{let acc=350;for(let i=0;i<r.p.length-1;i++){const A=r.p[i],B=r.p[i+1],dx=B[0]-A[0],dz=B[1]-A[1],L=Math.hypot(dx,dz);acc+=L;if(acc>700&&L>30){acc=0;put('3.24.60',A[0]+dx*.3,A[1]+dz*.3,dx,dz,r.w);put('3.24.60',A[0]+dx*.7,A[1]+dz*.7,-dx,-dz,r.w);}}});
 // parking lots: 6.4 at the road edge on the lot side
 ((window.FURN&&FURN.pk&&FURN.pk.length?FURN.pk:C.pk)||[]).forEach(p=>{let cx=0,cz=0;p.forEach(q=>{cx+=q[0];cz+=q[1];});cx/=p.length;cz/=p.length;const n=nearest(cx,cz,60);if(!n||n.d<2)return;const nx=(cx-n.px)/n.d,nz=(cz-n.pz)/n.d;put('6.4',n.px,n.pz,nz,-nx,n.r.w);});
 // OSM one-way ways: 5.5 at the start, 3.1 at the end against traffic
 ((window.SOSM||{}).ow||[]).forEach(q=>{if(q.length<2)return;const n0=nearest(q[0][0],q[0][1],8);const w=n0?n0.r.w:6;const a=q[0],b=q[1];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);let tot=0;for(let i=0;i<q.length-1;i++)tot+=Math.hypot(q[i+1][0]-q[i][0],q[i+1][1]-q[i][1]);if(tot<40||L<6)return;
  put('5.5',a[0]+(b[0]-a[0])/L*5,a[1]+(b[1]-a[1])/L*5,b[0]-a[0],b[1]-a[1],w);const e=q[q.length-1],f=q[q.length-2],L2=Math.hypot(e[0]-f[0],e[1]-f[1])||1;put('3.1',e[0]+(e[0]-f[0])/L2*3,e[1]+(e[1]-f[1])/L2*3,f[0]-e[0],f[1]-e[1],w);});
 // city limits: OSM nodes + derived where a wide road leaves the built-up area of Lytkarino
 ((window.SOSM||{}).cl||[]).forEach(c=>{const n=nearest(c[0],c[1],30);if(!n)return;const ux=n.B[0]-n.A[0],uz=n.B[1]-n.A[1],L=Math.hypot(ux,uz);const nm=c[2]||'Лыткарино';put('5.23:'+nm,n.px,n.pz,ux/L,uz/L,n.r.w);put('5.24:'+nm,n.px,n.pz,-ux/L,-uz/L,n.r.w);});
 {const BG={};C.b.forEach(b=>{const q=b.p[0];BG[Math.floor(q[0]/100)+','+Math.floor(q[1]/100)]=1;});const inT=(x,z)=>{let n=0;for(let a=-2;a<=2;a++)for(let c=-2;c<=2;c++)n+=BG[(Math.floor(x/100)+a)+','+(Math.floor(z/100)+c)]?1:0;return n>=6;};const CLP=[];
  RD3.filter(r=>r.w>=6).forEach(r=>{let prev=null,pt=null;for(let i=0;i<r.p.length;i++){const q=r.p[i],t=inT(q[0],q[1]);if(prev!==null&&t!==prev&&i>0){const A=r.p[i-1];const dx=q[0]-A[0],dz=q[1]-A[1];const L=Math.hypot(dx,dz);if(L>5&&CLP.length<8&&!CLP.some(c=>Math.hypot(c[0]-q[0],c[1]-q[1])<1500)&&!(window.SOSM||{cl:[]}).cl.some(c=>Math.hypot(c[0]-q[0],c[1]-q[1])<400)){CLP.push([q[0],q[1]]);const sg=t?1:-1;// t: entering town when moving A->q
   put('5.23:Лыткарино',A[0]+dx*.5,A[1]+dz*.5,dx*sg,dz*sg,r.w);put('5.24:Лыткарино',A[0]+dx*.5,A[1]+dz*.5,-dx*sg,-dz*sg,r.w);}}prev=t;}});SGN.clDerived=CLP.length;}
 // ---- meshes
 const N=SGN.L.length;const pg=new THREE.CylinderGeometry(.03,.03,2.9,6).translate(0,1.45,0);const pole=new THREE.InstancedMesh(pg,new THREE.MeshLambertMaterial({color:0x9ca2a8}),Math.max(1,N));
 const plG=new THREE.PlaneGeometry(.7,.7).translate(0,2.3,0);const ti=new Float32Array(Math.max(1,N)*4);
 const front=new THREE.InstancedMesh(plG.clone(),null,Math.max(1,N)),back=new THREE.InstancedMesh(plG.clone(),null,Math.max(1,N));
 [front,back].forEach(m=>m.geometry.setAttribute('aTile',new THREE.InstancedBufferAttribute(ti,4)));
 const U={uHL:{value:new THREE.Vector4()},uHD:{value:new THREE.Vector4(0,0,1,60)}};SGN.U=U;
 const mk=(isBack)=>{const m=new THREE.MeshLambertMaterial({map:atl,alphaTest:.5,side:isBack?THREE.BackSide:THREE.FrontSide,color:isBack?0x8d9196:0xffffff});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader='attribute vec4 aTile;varying vec3 vRw,vRn;\n'+sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_UV\n vUv=aTile.xy+uv*aTile.zw;\n#endif\n vRw=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;vRn=normalize(mat3(modelMatrix*instanceMatrix)*vec3(0.,0.,1.));');
   sh.fragmentShader='uniform vec4 uHL,uHD;varying vec3 vRw,vRn;\n'+sh.fragmentShader.replace('#include <map_fragment>',isBack?'#include <map_fragment>\n diffuseColor.rgb=diffuse;':'#include <map_fragment>').replace('#include <emissivemap_fragment>',isBack?'#include <emissivemap_fragment>':`#include <emissivemap_fragment>
   {vec3 L=uHL.xyz-vRw;float d=length(L);L/=d;float face=max(0.,dot(L,vRn));float cone=smoothstep(.86,.97,dot(-L,uHD.xyz));vec3 V=normalize(cameraPosition-vRw);float al=pow(max(0.,dot(V,L)),24.);
    float retro=uHL.w*face*cone*al*(1.-smoothstep(uHD.w*.5,uHD.w*1.6,d));totalEmissiveRadiance+=diffuseColor.rgb*retro*2.2;}`);};
  m.customProgramCacheKey=()=>'sgn'+(isBack?1:0);return m;};
 front.material=mk(0);back.material=mk(1);
 const M=new THREE.Matrix4(),Mr=new THREE.Matrix4(),Ms=new THREE.Matrix4();
 SGN.mat=(q,fallAx,fallA)=>{const T=SGN.T[q.type];M.makeRotationY(q.a);if(T[4]>1){Ms.makeScale(1.9,.95,1);M.multiply(Ms);}if(fallA){Mr.makeRotationAxis(fallAx,fallA);M.premultiply(Mr);}M.setPosition(q.x,0,q.z);return M;};
 SGN.L.forEach((q,i)=>{const T=SGN.T[q.type];ti.set([T[0],T[1],T[2],T[3]],i*4);const m=SGN.mat(q);front.setMatrixAt(i,m);back.setMatrixAt(i,m);M.makeTranslation(q.x,0,q.z);pole.setMatrixAt(i,M);});
 [pole,front,back].forEach(m=>{m.userData.noSplit=1;m.frustumCulled=false;m.castShadow=m===pole;S.add(m);});SGN.pole=pole;SGN.front=front;SGN.back=back;
 // knocked-down posts: bend/fall about the base towards the impact direction
 SGN.knock=(i,dx,dz,v)=>{const q=SGN.L[i];if(q.down)return;q.down=1;const L=Math.hypot(dx,dz)||1;SGN.fall.push({i,ax:new THREE.Vector3(dz/L,0,-dx/L),a:0,w:Math.min(3,v*.25),max:v>12?1.52:.9});};
 SGN.tick=dt=>{if(SGN.fall.length){SGN.fall.forEach(f=>{if(f.a>=f.max)return;f.w+=dt*6;f.a=Math.min(f.max,f.a+f.w*dt);const q=SGN.L[f.i];const m=SGN.mat(q,f.ax,f.a);front.setMatrixAt(f.i,m);back.setMatrixAt(f.i,m);M.makeRotationAxis(f.ax,f.a).setPosition(q.x,0,q.z);pole.setMatrixAt(f.i,M);});[pole,front,back].forEach(m=>m.instanceMatrix.needsUpdate=true);}
  // headlight uniforms for the retroreflective sheeting
  const on=typeof lights!='undefined'&&(lights||HB.flash);const s2=Math.sin(st.h),c2=Math.cos(st.h);U.uHL.value.set(st.x+s2*2.3,.7,st.z+c2*2.3,on?(HB.hi?1.7:1):0);U.uHD.value.set(s2,-.02,c2,HB.hi?160:60);};
 const cnt={};SGN.L.forEach(q=>cnt[q.type]=(cnt[q.type]||0)+1);SGN.cnt=cnt;console.log('signs',N,JSON.stringify(cnt));}
// split huge merged static meshes (roads, curbs, markings, junction discs...) into 400 m spatial chunks for culling
function splitBig(){const CS2=400;[...S.children].forEach(o=>{if(o.isInstancedMesh&&!o.userData.noSplit&&(o.count>150||(o.userData.fr&&o.count>8))&&!TREECH.includes(o)){const parts={},M4=new THREE.Matrix4(),v=new THREE.Vector3();for(let i=0;i<o.count;i++){o.getMatrixAt(i,M4);v.setFromMatrixPosition(M4);const key=Math.floor(v.x/250)+','+Math.floor(v.z/250);(parts[key]=parts[key]||[]).push(i);}
  Object.values(parts).forEach(ix=>{const m=new THREE.InstancedMesh(o.geometry,o.material,ix.length);let cx=0,cz=0;ix.forEach((i,j)=>{o.getMatrixAt(i,M4);m.setMatrixAt(j,M4);v.setFromMatrixPosition(M4);cx+=v.x;cz+=v.z;if(o.instanceColor){const c=new THREE.Color();o.getColorAt(i,c);m.setColorAt(j,c);}});m.castShadow=o.castShadow;m.receiveShadow=o.receiveShadow;m.renderOrder=o.renderOrder;m.frustumCulled=false;m.userData.c=[cx/ix.length,cz/ix.length];S.add(m);(o.userData.fr?FURNCH:TREECH).push(m);});S.remove(o);return;}
if(!o.isMesh||o.isInstancedMesh||o.userData.noSplit||CHUNKS.includes(o))return;let g=o.geometry;if(!g.attributes.position)return;g.computeBoundingSphere();const tri=(g.index?g.index.count:g.attributes.position.count)/3;if(!o.userData.fr&&(tri<1500||g.boundingSphere.radius<300))return;
 o.updateMatrixWorld();if(g.index)g=g.toNonIndexed();const P=g.attributes.position,names=Object.keys(g.attributes),parts={},v=new THREE.Vector3();
 for(let t=0;t<P.count/3;t++){let cx=0,cz=0;for(let k=0;k<3;k++){v.fromBufferAttribute(P,t*3+k).applyMatrix4(o.matrixWorld);cx+=v.x;cz+=v.z;}const cs=o.userData.fr?150:CS2,key=Math.floor(cx/3/cs)+','+Math.floor(cz/3/cs);(parts[key]=parts[key]||[]).push(t);}
 Object.values(parts).forEach(ts=>{const ng=new THREE.BufferGeometry();names.forEach(n=>{const a=g.attributes[n],is=a.itemSize,arr=new a.array.constructor(ts.length*3*is);ts.forEach((t,j)=>{for(let k=0;k<3*is;k++)arr[j*3*is+k]=a.array[t*3*is+k];});ng.setAttribute(n,new THREE.BufferAttribute(arr,is,a.normalized));});
  ng.computeBoundingSphere();const m=new THREE.Mesh(ng,o.material);if(o.userData.fr){m.userData.fr=1;const c=ng.boundingSphere.center;m.userData.c=[c.x,c.z];FURNCH.push(m);}m.position.copy(o.position);m.rotation.copy(o.rotation);m.scale.copy(o.scale);m.renderOrder=o.renderOrder;m.receiveShadow=o.receiveShadow;m.castShadow=o.castShadow;S.add(m);if(!o.userData.fr)CHUNKS.push(m);});
 S.remove(o);});}
// ---------- street furniture from OSM (FURN) ----------
// ---------- landmarks (hand-made models at real OSM positions) ----------
PT("pre-landmarks");{const LMs=window.LM||[];const white=new THREE.MeshLambertMaterial({color:0xf2efe6}),gold=new THREE.MeshStandardMaterial({color:0xd4a64a,metalness:.9,roughness:.25,emissive:0x2a1d05}),
 blue=new THREE.MeshStandardMaterial({color:0x2f5fa8,metalness:.5,roughness:.4}),conc=new THREE.MeshLambertMaterial({color:0xb8b4aa}),alu=new THREE.MeshStandardMaterial({color:0xc8ccd0,metalness:.7,roughness:.35}),red=new THREE.MeshLambertMaterial({color:0xb52a22});
 const bid={};C.b.forEach(b=>bid[b.id]=b);
 const onion=new THREE.LatheGeometry([[0,0],[1,.05],[1.25,.45],[1.2,.9],[.85,1.35],[.4,1.75],[.12,2.05],[0,2.2]].map(p=>new THREE.Vector2(p[0],p[1])),16);
 const cross=g=>{const c=new THREE.Group();c.add(new THREE.Mesh(new THREE.BoxGeometry(.08,1.4,.08),gold));const h=new THREE.Mesh(new THREE.BoxGeometry(.6,.07,.07),gold);h.position.y=.25;c.add(h);g.add(c);return c;};
 LMs.forEach(([k,x,z,nm,id])=>{const g=new THREE.Group();g.position.set(x,0,z);g.name='LM:'+nm;
  if(k=='church'){const b=bid[id];const top=b?b.h||8:0;if(!b){const m=new THREE.Mesh(new THREE.BoxGeometry(10,8,16).translate(0,4,0),white);g.add(m);}
   const H=b?top:8,s=b?Math.max(1,Math.min(2.2,Math.sqrt(Math.abs(b.p.reduce((a,p,i)=>{const q=b.p[(i+1)%b.p.length];return a+p[0]*q[1]-q[0]*p[1];},0))/2)/9)):1.4;
   const dr=new THREE.Mesh(new THREE.CylinderGeometry(1.6*s,1.6*s,3*s,16).translate(0,H+1.5*s,0),white);g.add(dr);const on=new THREE.Mesh(onion,id%2?gold:blue);on.scale.setScalar(1.4*s);on.position.y=H+3*s;g.add(on);const c=cross(g);c.position.y=H+3*s+3.1*s+.6;
   // bell tower at one end
   const bt=new THREE.Mesh(new THREE.BoxGeometry(3.2*s,H*1.7,3.2*s).translate(0,H*.85,0),white);bt.position.set(0,0,b?0:9);if(!b)g.add(bt);}
  else if(k=='plane'){// Antonov An-30 on pedestal
   const P=new THREE.Group();P.position.y=3.2;const fus=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,20,14).rotateX(Math.PI/2),alu);P.add(fus);const nose=new THREE.Mesh(new THREE.SphereGeometry(1.35,14,10,0,Math.PI*2,0,Math.PI/2).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:0x9fc2d6,metalness:.3,roughness:.2,transparent:true,opacity:.8}));nose.position.z=10;P.add(nose);
   const tail=new THREE.Mesh(new THREE.CylinderGeometry(1.3,.35,6,12).rotateX(-Math.PI/2),alu);tail.position.z=-13;P.add(tail);const wing=new THREE.Mesh(new THREE.BoxGeometry(29.2,.35,3.2),alu);wing.position.set(0,1.2,1);P.add(wing);
   const fin=new THREE.Mesh(new THREE.BoxGeometry(.25,5,3.5),alu);fin.position.set(0,3,-14.5);P.add(fin);const st=new THREE.Mesh(new THREE.BoxGeometry(10,.25,2.2),alu);st.position.set(0,1.2,-15);P.add(st);
   [-5,5].forEach(ex=>{const en=new THREE.Mesh(new THREE.CylinderGeometry(.75,.6,5,10).rotateX(Math.PI/2),alu);en.position.set(ex,.8,2);P.add(en);const pr=new THREE.Mesh(new THREE.BoxGeometry(4,.25,.08),new THREE.MeshLambertMaterial({color:0x222222}));pr.position.set(ex,.8,4.6);P.add(pr);});
   const stripe=new THREE.Mesh(new THREE.CylinderGeometry(1.37,1.37,18,14,1,true).rotateX(Math.PI/2),new THREE.MeshLambertMaterial({color:0x2c4f9e,side:THREE.DoubleSide}));stripe.scale.set(1,.3,1);P.add(stripe);
   g.add(P);g.add(new THREE.Mesh(new THREE.CylinderGeometry(.9,1.2,3.2,10).translate(0,1.6,0),conc));g.rotation.y=.6;}
  else if(k=='wtower'){g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.2,22,14).translate(0,11,0),conc));g.add(new THREE.Mesh(new THREE.CylinderGeometry(5.2,3,6,18).translate(0,25,0),conc));g.add(new THREE.Mesh(new THREE.ConeGeometry(5.4,2,18).translate(0,29,0),red));}
  else if(k=='stela'){const big=/Лыткарино|ЛЗОС|Слава|Героям/.test(nm);const h=big?9:3.2;g.add(new THREE.Mesh(new THREE.BoxGeometry(5,.4,5).translate(0,.2,0),conc));g.add(new THREE.Mesh(new THREE.CylinderGeometry(.35,.9,h,4).rotateY(Math.PI/4).translate(0,h/2+.4,0),big?conc:white));
   if(/Звезда|Героям|Слава/.test(nm)){const st=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?.45:1.1,a=i*Math.PI/5+Math.PI/2;st[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}const sm=new THREE.Mesh(new THREE.ExtrudeGeometry(st,{depth:.2,bevelEnabled:false}),red);sm.position.y=h+1.6;g.add(sm);}
   if(nm){const t=tex(cv(256,64,(c,w,hh)=>{c.fillStyle='#d9c27a';c.fillRect(0,0,w,hh);c.fillStyle='#2a2414';let fs=30;c.font=`bold ${fs}px Arial`;while(c.measureText(nm).width>w-10&&fs>10){fs-=2;c.font=`bold ${fs}px Arial`;}c.textAlign='center';c.textBaseline='middle';c.fillText(nm,w/2,hh/2);}));const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.45),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));pl.position.set(0,1.3,.75);g.add(pl);}}
  else if(k=='manor'){[-3,-1,1,3].forEach(cx=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,6,10).translate(0,3,0),white);c.position.set(cx,0,0);g.add(c);});const ped=new THREE.Mesh(new THREE.CylinderGeometry(0,4.8,1.6,3,1).rotateZ(Math.PI/2).rotateY(Math.PI/2),white);ped.scale.set(1,1,.4);ped.position.y=6.6;g.add(ped);}
  S.add(g);});window.__lm=LMs.length;PT("landmarks "+LMs.length);}
// ---------- credits screen ----------
{const d=document.createElement('div');d.id='credits';d.style.cssText='display:none;position:fixed;inset:6% 8%;background:rgba(10,14,20,.88);color:#dde;font:13px/1.45 Arial,sans-serif;padding:14px 18px;border-radius:10px;overflow:auto;z-index:50;backdrop-filter:blur(4px)';
 d.innerHTML='<b style="font-size:16px">Лыткарино Racing — источники и авторы</b> <span id="crx" style="float:right;cursor:pointer;font-size:18px">✕</span><ul style="padding-left:18px">'+
 '<li><b>Припаркованные «Жигули»</b>: модель «Zhiguli Soviet Cars» © spacelynxcanfly (sketchfab.com/3d-models/zhiguli-soviet-cars-7c3f4bee5d37401d853d2206dc7859fc), лицензия CC BY 4.0 (creativecommons.org/licenses/by/4.0); оптимизирована (сжатие геометрии, текстуры 1024 px WebP).</li>'+
 '<li><b>Деревья и кусты</b>: сгенерированы библиотекой ez-tree © 2024 Daniel Greenheck, лицензия MIT (github.com/dgreenheck/ez-tree), включая текстуры коры и листьев из пакета; трава — собственный шейдер.</li>'+
 '<li><b>Карта, здания, дороги, вода, магазины, достопримечательности</b>: © участники OpenStreetMap, лицензия ODbL (openstreetmap.org/copyright).</li>'+
 '<li><b>Спутниковые снимки</b>: Esri World Imagery — © Esri, Maxar, Earthstar Geographics и сообщество пользователей ГИС.</li>'+
 '<li><b>Рельеф</b>: AWS Terrain Tiles (Terrarium; данные SRTM, NASA/USGS и др., через Mapzen/Tilezen).</li>'+
 '<li><b>Фасады</b> (хрущёвки 1-447, П-44, II-49, сталинки, частные дома, гаражи, первые этажи с магазинами): процедурно сгенерированные текстуры из набора lytkarino-textures (GenerateImage + post.py). Настоящие фото фасадов Лыткарино скоро будут добавлены.</li>'+
 '<li><b>Референсы BMW X5 G05</b>: фото с Wikimedia Commons (авторы указаны на страницах файлов, CC BY-SA); размеры: официальные данные BMW (4935×2004×1765, база 2975).</li>'+
 '<li><b>Достопримечательности</b> (модели сделаны вручную по OSM): '+(window.LM||[]).filter(l=>l[3]).map(l=>l[3]).filter((v,i,a)=>a.indexOf(v)==i).join(', ')+'.</li>'+
 '<li><b>Капли на стекле</b>: техника water-map/рефракции по мотивам <a style="color:#8cf" href="https://github.com/codrops/RainEffect" target="_blank">Codrops RainEffect</a> (Lucas Bebber, лицензия Codrops: разрешено встраивать и дорабатывать), собственная реализация шейдера. Звуки дождя и дворников синтезированы. Постэффекты: three.js examples (MIT).<br><b>Звук двигателя</b>: петли motorseamless (Ziph, OpenGameArt «Some sounds», CC0) с кроссфейдом по оборотам + синтезированный V8-слой, турбина и выхлопные хлопки (Web Audio).</li><li><b>Фото-фасады</b>: текстуры по реальным фото Лыткарино (Gemini); ДК «Мир» — фото Bloger iz lyt, Wikimedia Commons, CC BY-SA 4.0.</li><li><b>3D-модель автомобиля</b>: «2024 BMW X5 xDrive40i» — <a style="color:#8cf" href="https://sketchfab.com/3d-models/2024-bmw-x5-xdrive40i-b453ba441ff04f9290955d09c3d46b9f" target="_blank">Sketchfab</a>, автор <a style="color:#8cf" href="https://sketchfab.com/ddiaz-design" target="_blank">ddiaz-design</a>, лицензия <a style="color:#8cf" href="http://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">CC BY-NC-SA 4.0</a>; модель упрощена и сжата для браузера (изменённая версия распространяется на тех же условиях).</li><li><b>Движок</b>: three.js r149 (MIT).</li></ul>';
 document.body.appendChild(d);const b=document.createElement('b');b.id='bCr';b.title='Источники и авторы';b.textContent='ⓘ';const fs=document.getElementById('fs');if(fs&&fs.parentNode)fs.parentNode.insertBefore(b,fs);
 const tg=e=>{e&&e.stopPropagation();d.style.display=d.style.display=='none'?'block':'none';};b.addEventListener('click',tg);b.addEventListener('touchend',e=>{e.preventDefault();tg(e);});d.querySelector('#crx').addEventListener('click',tg);if(/credits/.test(Q))d.style.display='block';}
PT("photo facades "+JSON.stringify(window.__phc||{}));PT("pre-furn");const FURNCH=[];window.__FURNCH=FURNCH;{const FS0=S.children.length;const F=window.FURN;if(F&&!/nofurn/.test(Q)){const mergeG=(L)=>{const A={position:[],normal:[]};L.forEach(g=>{g=g.index?g.toNonIndexed():g;A.position.push(...g.attributes.position.array);A.normal.push(...g.attributes.normal.array);});const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(A.position,3));o.setAttribute('normal',new THREE.Float32BufferAttribute(A.normal,3));return o;};
const M4=new THREE.Matrix4(),Qt=new THREE.Quaternion(),V=new THREE.Vector3(),Sc=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0);
const segs=(list,step)=>{const o=[];list.forEach(p=>{for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<.3||L>400)continue;if(!step){o.push([a,b,L]);continue;}const n=Math.max(1,Math.round(L/step));for(let k=0;k<n;k++){const t0=k/n,t1=(k+1)/n;o.push([[a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0],[a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1],L/n]);}}});return o;};
const setSeg=(im,i,s,h,w,y)=>{const a=s[0],b=s[1];Qt.setFromAxisAngle(Y,Math.atan2(-(b[1]-a[1]),b[0]-a[0]));M4.compose(V.set((a[0]+b[0])/2,y,(a[1]+b[1])/2),Qt,Sc.set(s[2]+.05,h,w));im.setMatrixAt(i,M4);};
const box=new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
const lineMesh=(list,mat,h,w,step)=>{const S2=segs(list,step);if(!S2.length)return null;const im=new THREE.InstancedMesh(box,mat,S2.length);S2.forEach((s,i)=>setSeg(im,i,s,h,w,0));S.add(im);return S2;};
// fences: semi-transparent mesh texture
const fenceT=tex(cv(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#4a5a4a';g.lineWidth=3;for(let i=0;i<w;i+=8){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();}g.lineWidth=5;g.beginPath();g.moveTo(0,4);g.lineTo(w,4);g.moveTo(0,h-4);g.lineTo(w,h-4);g.stroke();}));
lineMesh(F.fe,new THREE.MeshLambertMaterial({map:fenceT,transparent:true,alphaTest:.4,side:THREE.DoubleSide}),1.7,.05,2.5);
const wallT=tex(cv(128,64,(g,w,h)=>{g.fillStyle='#a8a49a';g.fillRect(0,0,w,h);g.fillStyle='#8e8a80';for(let i=0;i<w;i+=32)g.fillRect(i,0,2,h);noise(g,w,h,.15,400);}));
lineMesh(F.wl,new THREE.MeshLambertMaterial({map:wallT}),2.1,.22,4);
// guard rails: rail + posts
{const S2=lineMesh(F.gr,new THREE.MeshLambertMaterial({color:0xb8bcc0}),.32,.08,3);if(S2){const im=new THREE.InstancedMesh(box,new THREE.MeshLambertMaterial({color:0x6a6e72}),S2.length);S2.forEach((s,i)=>{M4.makeTranslation(s[0][0],0,s[0][1]);M4.scale(Sc.set(.1,.75,.1));im.setMatrixAt(i,M4);});S.add(im);
 // lift rail
 }}
// sidewalks from OSM footway=sidewalk / footways
{const P=[];F.sw.forEach(p=>{for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1,h=1,nx=-dz/L*h,nz=dx/L*h,y=.05;P.push(a[0]+nx,y,a[1]+nz,b[0]+nx,y,b[1]+nz,b[0]-nx,y,b[1]-nz,a[0]+nx,y,a[1]+nz,b[0]-nx,y,b[1]-nz,a[0]-nx,y,a[1]-nz);}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x9a9890,polygonOffset:true,polygonOffsetFactor:-.5}));m.receiveShadow=true;S.add(m);}
// shrubs: OSM hedges + along sidewalks + scrub polygons
{const pts=[];const pip=(x,z,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
 segs(F.sw,6).forEach((s,i)=>{if(i%3)return;const a=s[0],b=s[1],L=s[2]||1,nx=-(b[1]-a[1])/L,nz=(b[0]-a[0])/L,sd=i%2?1:-1;pts.push([a[0]+nx*1.8*sd,a[1]+nz*1.8*sd,.7+rnd()*.5]);});
 F.sc.forEach(p=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);});const n=Math.min(150,(x1-x0)*(z1-z0)/60);for(let k=0;k<n;k++){const x=x0+rnd()*(x1-x0),z=z0+rnd()*(z1-z0);if(pip(x,z,p))pts.push([x,z,1+rnd()*1.2]);}});
 const im=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.8,0).translate(0,.55,0),new THREE.MeshLambertMaterial({color:0x3f6a2c,flatShading:true}),pts.length);
 pts.forEach((p,i)=>{M4.makeRotationY(rnd()*6);M4.scale(Sc.set(p[2]*(1+rnd()*.4),p[2]*.8,p[2]));M4.setPosition(p[0],0,p[1]);im.setMatrixAt(i,M4);});S.add(im);
 // hedges (OSM barrier=hedge if any)
 lineMesh(F.hg,new THREE.MeshLambertMaterial({color:0x35602a}),1.1,.8,2);}

// curbs (бордюры): 15 cm concrete kerb along both edges of every drivable road; gaps at junctions, driveways/service roads/parking aisles, footway crossings, zebras and parking-lot entrances
const CURB={G:{},n:0,gaps:0};window.__CURB=CURB;{const P=[],N=[];const EP={};const ek=q=>Math.round(q[0])+','+Math.round(q[1]);const DR=C.r.filter(r=>r.w>=3);DR.forEach(r=>{[r.p[0],r.p[r.p.length-1]].forEach(q=>{EP[ek(q)]=(EP[ek(q)]||0)+1;});});
 // small ways that pierce the kerb: service/aisles (w<3 in C.r) + footways (C.hw w<=2)
 const SG={};const sput=(a,b,h)=>{for(let gx=Math.floor(Math.min(a[0],b[0])/20);gx<=Math.floor(Math.max(a[0],b[0])/20);gx++)for(let gz=Math.floor(Math.min(a[1],b[1])/20);gz<=Math.floor(Math.max(a[1],b[1])/20);gz++)(SG[gx+','+gz]=SG[gx+','+gz]||[]).push([a,b,h]);};
 C.r.filter(r=>r.w<3).concat((C.hw||[]).filter(r=>r.w<=2)).forEach(r=>{const h=r.w/2+(r.w<=1.6?.9:1.6);for(let i=0;i<r.p.length-1;i++)sput(r.p[i],r.p[i+1],h);});
 (C.cr||[]).forEach(q=>{const s=Math.sin(q[2]),c=Math.cos(q[2]),L=q[3]/2+3;sput([q[0]-s*L,q[1]-c*L],[q[0]+s*L,q[1]+c*L],2.2);});
 const LOTS=((window.FURN&&FURN.pk&&FURN.pk.length?FURN.pk:C.pk)||[]).map(p=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);});return{p,x0:x0-4,x1:x1+4,z0:z0-4,z1:z1+4};});
 const inP=(x,z,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
 const xs=(a,b,c,d)=>{const r0=b[0]-a[0],r1=b[1]-a[1],s0=d[0]-c[0],s1=d[1]-c[1],den=r0*s1-r1*s0;if(Math.abs(den)<1e-9)return -1;const t=((c[0]-a[0])*s1-(c[1]-a[1])*s0)/den,u=((c[0]-a[0])*r1-(c[1]-a[1])*r0)/den;return(t>=0&&t<=1&&u>=-.05&&u<=1.05)?t:-1;};
 const jn=q=>(EP[ek(q)]||0)>=2||isJ(jk(q));const W=.15,H=.16;
 const quad=(a,b,c,d,nx,ny,nz)=>{P.push(...a,...b,...c,...a,...c,...d);for(let i=0;i<6;i++)N.push(nx,ny,nz);};
 DR.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<2)continue;const ux=dx/L,uz=dz/L,cut=r.w/2+(r.w>=6?4.6:3);
  const t0=jn(a)?cut:0,t1=jn(b)?L-cut:L;if(t1-t0<1.5)continue;
  [1,-1].forEach(sd=>{const nx=-uz*sd,nz=ux*sd,o=r.w/2-.02;const LA=[a[0]+nx*o,a[1]+nz*o],LB=[b[0]+nx*o,b[1]+nz*o];
   // cut intervals along this kerb line
   const cuts=[];const seen=new Set();for(let gx=Math.floor((Math.min(LA[0],LB[0])-3)/20);gx<=Math.floor((Math.max(LA[0],LB[0])+3)/20);gx++)for(let gz=Math.floor((Math.min(LA[1],LB[1])-3)/20);gz<=Math.floor((Math.max(LA[1],LB[1])+3)/20);gz++)(SG[gx+','+gz]||[]).forEach(e=>{if(seen.has(e))return;seen.add(e);
    // extend the small way by 3 m on both ends so ways that stop at the sidewalk still cut the kerb
    const ex=e[1][0]-e[0][0],ez=e[1][1]-e[0][1],el=Math.hypot(ex,ez)||1,E0=[e[0][0]-ex/el*3,e[0][1]-ez/el*3],E1=[e[1][0]+ex/el*3,e[1][1]+ez/el*3];
    const t=xs(LA,LB,E0,E1);if(t>=0){const sn=Math.abs((ex*uz-ez*ux)/el)||.3;cuts.push([t*L-e[2]/Math.max(.35,sn),t*L+e[2]/Math.max(.35,sn)]);}});
   const lots=LOTS.filter(l=>Math.max(LA[0],LB[0])>l.x0&&Math.min(LA[0],LB[0])<l.x1&&Math.max(LA[1],LB[1])>l.z0&&Math.min(LA[1],LB[1])<l.z1);
   if(lots.length){let st0=-1;for(let t=t0;t<=t1+1;t+=1){const px=a[0]+ux*t+nx*(o+2.5),pz=a[1]+uz*t+nz*(o+2.5);const ins=t<=t1&&lots.some(l=>inP(px,pz,l.p));if(ins&&st0<0)st0=t;if(!ins&&st0>=0){if(t-st0>=2)cuts.push([st0-1.5,t+.5]);st0=-1;}}}
   cuts.sort((x,y)=>x[0]-y[0]);const runs=[];let c0=t0;cuts.forEach(c=>{if(c[1]<c0)return;if(c[0]>c0)runs.push([c0,Math.min(c[0],t1)]);c0=Math.max(c0,c[1]);CURB.gaps++;});if(c0<t1)runs.push([c0,t1]);
   runs.forEach(([q0,q1])=>{if(q1-q0<1.2)return;const A=[a[0]+ux*q0,a[1]+uz*q0],B=[a[0]+ux*q1,a[1]+uz*q1];const p=(t,oo,y)=>[t[0]+nx*oo,y,t[1]+nz*oo];
    const ai=p(A,o,H),bi=p(B,o,H),ao=p(A,o+W,H),bo=p(B,o+W,H),ag=p(A,o,.06),bg=p(B,o,.06),aE=p(A,o+W,.06);
    quad(ag,bg,bi,ai,-nx,0,-nz);quad(ai,bi,bo,ao,0,1,0);
    // end caps so cut ends look like dropped kerbs, not hollow
    P.push(...ag,...ai,...ao,...ag,...ao,...aE);for(let k=0;k<6;k++)N.push(-ux,0,-uz);
    CURB.n++;const s0=[A[0]+nx*(o+W/2),A[1]+nz*(o+W/2)],s1=[B[0]+nx*(o+W/2),B[1]+nz*(o+W/2)];for(let gx=Math.floor(Math.min(s0[0],s1[0])/20);gx<=Math.floor(Math.max(s0[0],s1[0])/20);gx++)for(let gz=Math.floor(Math.min(s0[1],s1[1])/20);gz<=Math.floor(Math.max(s0[1],s1[1])/20);gz++)(CURB.G[gx+','+gz]=CURB.G[gx+','+gz]||[]).push([s0,s1]);});});}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
 const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0xb4b2ab}));m.receiveShadow=true;S.add(m);console.log('curbs',CURB.n,'gaps',CURB.gaps);}
// kerb bump: wheel crossing a kerb line -> short vertical kick + small speed loss
CURB.side={};CURB.tick=(dt)=>{const l=CURB.G[Math.floor(st.x/20)+','+Math.floor(st.z/20)];st.bmp=(st.bmp||0)*Math.max(0,1-dt*9);if(!l)return;const s=Math.sin(st.h),c=Math.cos(st.h);
 [[1.45,.8],[1.45,-.8],[-1.5,.8],[-1.5,-.8]].forEach(([f,lat],wi)=>{const x=st.x+s*f+c*lat,z=st.z+c*f-s*lat;l.forEach((sg,k)=>{const q=segD(x,z,sg[0],sg[1]);if(q[0]>.6)return;const ux=sg[1][0]-sg[0][0],uz=sg[1][1]-sg[0][1];const sd=Math.sign((x-sg[0][0])*uz-(z-sg[0][1])*ux);const key=wi+':'+k+':'+Math.floor(st.x/20)+','+Math.floor(st.z/20);const pv=CURB.side[key];CURB.side[key]=sd;
  if(pv!==undefined&&pv!==sd&&q[0]<.35){const v=Math.abs(st.v);st.bmp=Math.min(.09,(st.bmp||0)+.02+v*.0025);const k2=Math.max(.9,1-.004*Math.min(v,15));st.vx*=k2;st.vz*=k2;}});});};
// parking lots: asphalt + bay markings + parked cars
{const AP=[],MK=[],cars=[];const pip=(x,z,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
 F.pk.forEach(p=>{const sh=new THREE.Shape(p.map(q=>new THREE.Vector2(q[0],-q[1])));const g=new THREE.ShapeGeometry(sh);g.rotateX(-Math.PI/2);AP.push(g.translate(0,.035,0));
  let bi=0,bl=0;for(let i=0;i<p.length-1;i++){const l=Math.hypot(p[i+1][0]-p[i][0],p[i+1][1]-p[i][1]);if(l>bl){bl=l;bi=i;}}
  const a=p[bi],b=p[bi+1],ux=(b[0]-a[0])/bl,uz=(b[1]-a[1])/bl;let cx=0,cz=0;p.forEach(q=>{cx+=q[0];cz+=q[1];});cx/=p.length;cz/=p.length;let nx=-uz,nz=ux;if((cx-a[0])*nx+(cz-a[1])*nz<0){nx=-nx;nz=-nz;}
  for(let row=0;row<8;row++){const off=1.2+row*(row%2?5.2:7);let any=false;for(let t=1.5;t<bl-1.5;t+=2.6){const x=a[0]+ux*t+nx*(off+2.5),z=a[1]+uz*t+nz*(off+2.5);if(!pip(x,z,p))continue;any=true;
    // marking line
    const lx=a[0]+ux*(t-1.3)+nx*off,lz=a[1]+uz*(t-1.3)+nz*off;MK.push([lx,lz,lx+nx*5,lz+nz*5]);
}if(!any&&row>1)break;}});
 if(AP.length){const g=null;const mat=new THREE.MeshLambertMaterial({color:0x4a4a4c});S.add(new THREE.Mesh(mergeG(AP),mat));}
 if(MK.length){const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2).translate(0,.06,0),new THREE.MeshBasicMaterial({color:0xe8e8e0}),MK.length);MK.forEach((m,i)=>{const L=5;Qt.setFromAxisAngle(Y,Math.atan2(-(m[3]-m[1]),m[2]-m[0]));M4.compose(V.set((m[0]+m[2])/2,0,(m[1]+m[3])/2),Qt,Sc.set(L,1,.12));im.setMatrixAt(i,M4);});S.add(im);}
 PT("parking "+F.pk.length+" lots, "+PCAR.L.length+" parked cars");}
// Zhiguli model (CC BY 4.0 spacelynxcanfly) -> per-250 m chunk InstancedMeshes, 4 colour variants; culled with street furniture
if(THREE.GLTFLoader&&PCAR.L.length){const ld=new THREE.GLTFLoader();if(window.MeshoptDecoder)ld.setMeshoptDecoder(MeshoptDecoder);ld.load('models/zhiguli.glb',gl=>{const V=[];gl.scene.updateMatrixWorld(true);gl.scene.traverse(o=>{if(o.isMesh){const g=new THREE.BufferGeometry();Object.entries(o.geometry.attributes).forEach(([n,at])=>{const k=at.itemSize,f=new Float32Array(at.count*k),G=['getX','getY','getZ','getW'];for(let i=0;i<at.count;i++)for(let c=0;c<k;c++)f[i*k+c]=at[G[c]](i);g.setAttribute(n,new THREE.BufferAttribute(f,k));});g.setIndex(o.geometry.index);g.applyMatrix4(o.matrixWorld);g.computeBoundingBox();const bb=g.boundingBox,c=bb.getCenter(new THREE.Vector3());g.translate(-c.x,-bb.min.y,-c.z);g.computeBoundingBox();
  const sz=bb.getSize(new THREE.Vector3());if(sz.x>sz.z)g.rotateY(Math.PI/2);const m=o.material;if(mobile||GSET.preset=='low'){m.normalMap=null;}m.envMapIntensity=.6;V.push([o.name,g,m]);}});
  const ord=['blue','gray','green','red'];V.sort((a,b)=>ord.findIndex(k=>a[0].includes(k))-ord.findIndex(k=>b[0].includes(k)));
  const by={};PCAR.L.forEach((c,i)=>{const k=Math.floor(c[0]/250)+','+Math.floor(c[1]/250)+','+(c[3]%V.length);(by[k]=by[k]||[]).push(i);});const M=new THREE.Matrix4();
  Object.entries(by).forEach(([k,ix])=>{const v=V[+k.split(',')[2]];const im=new THREE.InstancedMesh(v[1],v[2],ix.length);let cx=0,cz=0;ix.forEach((i,j)=>{const c=PCAR.L[i];M.makeRotationY(c[2]);M.setPosition(c[0],.02,c[1]);im.setMatrixAt(j,M);cx+=c[0];cz+=c[1];c[7]=[im,j];});
   im.castShadow=!mobile&&GSET.shadow>0;im.receiveShadow=true;im.userData.c=[cx/ix.length,cz/ix.length];im.userData.noSplit=1;im.userData.cd=(mobile?120:180)*GSET.dist;im.visible=Math.hypot(im.userData.c[0]-st.x,im.userData.c[1]-st.z)<(mobile?170:240);S.add(im);FURNCH.push(im);PCAR.ch.push(im);});
  if(PCAR.cl)PCAR.clear(...PCAR.cl);console.log('ZHIGULI chunks',PCAR.ch.length);},undefined,e=>console.log('zhiguli load fail',e));}
// remove parked cars around the player spawn (and their colliders)
PCAR.clear=(x,z,r)=>{PCAR.cl=[x,z,r];const Z=new THREE.Matrix4().makeScale(0,0,0);PCAR.L.forEach(c=>{if(c.gone||Math.hypot(c[0]-x,c[1]-z)>r)return;c.gone=1;c[6].forEach(k=>{const a=Gd[k];if(a){const i=a.indexOf(c[4]);if(i>=0)a.splice(i,1);}});if(c[7]){c[7][0].setMatrixAt(c[7][1],Z);c[7][0].instanceMatrix.needsUpdate=true;}});};
// nearest major-road direction
const nearRoad=(x,z)=>{let bd=1e9,ang=0,side=1;major.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L2=dx*dx+dz*dz||1;let t=((x-a[0])*dx+(z-a[1])*dz)/L2;t=Math.max(0,Math.min(1,t));const px=a[0]+dx*t,pz=a[1]+dz*t,d=Math.hypot(x-px,z-pz);if(d<bd){bd=d;ang=Math.atan2(dx,dz);side=((x-a[0])*dz-(z-a[1])*dx)>0?1:-1;}}});return [ang,side,bd];};
// bus stop shelters + bins + benches
{const BS=BSP;
 const glass=new THREE.MeshLambertMaterial({color:0xb8d4e0,transparent:true,opacity:.28,depthWrite:false}),frame=new THREE.MeshLambertMaterial({color:0x8d949b}),roofM=new THREE.MeshLambertMaterial({color:0x5b6168});
 const fasT=tex(cv(512,64,(g,w,h)=>{g.fillStyle='#1d5aa8';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font='bold 40px sans-serif';g.textAlign='center';g.fillText('ОСТАНОВКА ОБЩЕСТВЕННОГО ТРАНСПОРТА',w/2,46);}));
 const adT=tex(cv(128,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#f4f1e8');gr.addColorStop(1,'#d8e8f0');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#c8262c';g.fillRect(10,20,108,60);g.fillStyle='#1d5aa8';g.font='bold 22px sans-serif';g.fillText('Маршруты',12,120);g.fillStyle='#333';g.font='18px sans-serif';['№ 1  Лыткарино','№ 2  6 мкр','№ 9  Москва','№ 348 Котельники'].forEach((t,i)=>g.fillText(t,10,150+i*24));}));
 const W=4.2,D=1.7,H=2.45;// local: open side +z (faces road), back glass at -z
 const posts=[];[[-W/2,-D/2],[W/2,-D/2],[-W/2,D/2-.15],[W/2,D/2-.15],[0,-D/2]].forEach(([x,z])=>posts.push(new THREE.BoxGeometry(.08,H,.08).translate(x,H/2,z)));
 const fr=mergeG([...posts,new THREE.BoxGeometry(W+.1,.07,.07).translate(0,.25,-D/2),new THREE.BoxGeometry(W+.1,.07,.07).translate(0,H-.05,-D/2),
  // metal bench with seat slats + legs
  new THREE.BoxGeometry(2.6,.05,.42).translate(-.3,.47,-D/2+.32),new THREE.BoxGeometry(.06,.45,.06).translate(-1.5,.23,-D/2+.32),new THREE.BoxGeometry(.06,.45,.06).translate(.9,.23,-D/2+.32),new THREE.BoxGeometry(2.6,.25,.04).translate(-.3,.72,-D/2+.12)]);
 const rf=mergeG([new THREE.BoxGeometry(W+.5,.1,D+.45).translate(0,H+.05,.05),new THREE.BoxGeometry(W+.5,.06,.06).translate(0,H-.04,D/2+.25)]);
 const gl=mergeG([new THREE.PlaneGeometry(W-.1,H-.4).translate(0,(H-.4)/2+.3,-D/2+.01),new THREE.PlaneGeometry(D-.25,H-.4).rotateY(Math.PI/2).translate(-W/2,(H-.4)/2+.3,-.07)]);
 const fas=new THREE.PlaneGeometry(W+.5,.32).translate(0,H+.27,D/2+.28);
 const ad=new THREE.BoxGeometry(.12,1.9,1.2).translate(W/2-.02,1.2,-.1);
 const route=mergeG([new THREE.CylinderGeometry(.04,.04,2.9,6).translate(0,1.45,0),new THREE.BoxGeometry(.5,.8,.03).translate(0,2.05,0)]);
 const mk=(g,m,sh)=>{const im=new THREE.InstancedMesh(g,m,BS.length);BS.forEach((b,i)=>{M4.makeRotationY(b[2]);M4.setPosition(b[0],.15,b[1]);im.setMatrixAt(i,M4);});im.castShadow=!!sh;im.receiveShadow=true;S.add(im);return im;};
 mk(fr,frame,1);mk(rf,roofM,1);const gi=mk(gl,glass,0);gi.renderOrder=2;mk(fas,new THREE.MeshBasicMaterial({map:fasT}),0);mk(ad,new THREE.MeshLambertMaterial({map:adT,emissive:0x303030}),1);
 {const im=new THREE.InstancedMesh(route,new THREE.MeshLambertMaterial({map:adT}),BS.length);BS.forEach((b,i)=>{const c=Math.cos(b[2]),sn=Math.sin(b[2]);M4.makeRotationY(b[2]);M4.setPosition(b[0]-c*2.9+sn*.6,.15,b[1]+sn*2.9+c*.6);im.setMatrixAt(i,M4);});S.add(im);}
 window.__BSchk=()=>{const RD=C.r.filter(r=>r.w>=3);let onRoad=0,inB=0;BS.forEach(b=>{const c=Math.cos(b[2]),sn=Math.sin(b[2]);[[-W/2,-D/2],[W/2,-D/2],[-W/2,D/2],[W/2,D/2]].forEach(([u,v])=>{const x=b[0]+u*c+v*sn,z=b[1]-u*sn+v*c;if(RD.some(r=>{for(let i=0;i<r.p.length-1;i++)if(segD(x,z,r.p[i],r.p[i+1])[0]<r.w/2+.3)return true;return false;}))onRoad++;if(hit(x,z))inB++;});});return {n:BS.length,cornersOnRoad:onRoad,cornersInBuilding:inB};};
const bins=F.wb.slice();BS.forEach(b=>bins.push([b[0]+Math.cos(b[2])*2.9,b[1]-Math.sin(b[2])*2.9]));F.sh.forEach((s,i)=>{if(i%2==0)bins.push([s[0]+1.5,s[1]+1.5]);});
 if(C.en)C.en.forEach(e=>bins.push([e[0]+1.2,e[1]+1.2]));
 const bm=new THREE.InstancedMesh(new THREE.CylinderGeometry(.25,.2,.8,8).translate(0,.4,0),new THREE.MeshLambertMaterial({color:0x2f6b3a}),bins.length);bins.forEach((b,i)=>{M4.makeTranslation(b[0],0,b[1]);bm.setMatrixAt(i,M4);});S.add(bm);
 const bn=new THREE.InstancedMesh((mergeG([new THREE.BoxGeometry(1.8,.06,.45).translate(0,.45,0),new THREE.BoxGeometry(1.8,.4,.05).translate(0,.7,-.22),new THREE.BoxGeometry(.06,.45,.4).translate(-.8,.22,0),new THREE.BoxGeometry(.06,.45,.4).translate(.8,.22,0)]))||new THREE.BoxGeometry(1.8,.5,.45),new THREE.MeshLambertMaterial({color:0x7a5a3a}),F.bn.length);
 F.bn.forEach((b,i)=>{M4.makeRotationY(rnd()*6.28);M4.setPosition(b[0],0,b[1]);bn.setMatrixAt(i,M4);});S.add(bn);PT("bus stops "+BS.length+", bins "+bins.length);}
// shop signs on real buildings (brand colours), one atlas + one merged mesh
{const BR={'Пятёрочка':['#e31e24','#fff','#2a9d3a'],'Магнит':['#e30613','#fff'],'Дикси':['#f39200','#fff'],'Верный':['#e2001a','#fff'],'ВкусВилл':['#2bb04a','#fff'],'Перекрёсток':['#0b6e3a','#fff'],'Красное&Белое':['#9b0d1b','#fff'],'Бристоль':['#1b3d8f','#fff'],'Винлаб':['#7a1131','#fff'],'Ozon':['#005bff','#fff'],'Wildberries':['#a73afd','#fff'],'МТС':['#e30611','#fff'],'Билайн':['#ffd200','#000'],'Мегафон':['#00b956','#fff'],'Сбербанк':['#21a038','#fff'],'Сбер':['#21a038','#fff'],'Яндекс.Маркет':['#ffcc00','#000'],'Boxberry':['#ed1c24','#fff'],'Sunlight':['#000','#fff'],'Аптека':['#2e9e48','#fff'],'Ригла':['#e4002b','#fff'],'Горздрав':['#00973a','#fff'],'Доброцен':['#ffde00','#c00'],'Fix Price':['#0058a3','#fff'],'Светофор':['#e30613','#ffe600'],'Чижик':['#ffd400','#e30613'],'Spar':['#00843d','#fff'],'KFC':['#c8102e','#fff'],'Вкусно — и точка':['#ffbc0d','#264f36'],'Додо Пицца':['#ff6900','#fff']};
 const CW=256,CH=48,COLS=8,ROWS=40;const names=[];const L=[];
 const blds=C.b;const near=(x,z)=>{let best=null,bd=35;blds.forEach(b=>{const p=b.p;const c0=p[0];if(Math.abs(c0[0]-x)>150||Math.abs(c0[1]-z)>150)return;for(let i=0;i<p.length;i++){const a=p[i],q=p[(i+1)%p.length],dx=q[0]-a[0],dz=q[1]-a[1],L2=dx*dx+dz*dz;if(L2<9)continue;let t=((x-a[0])*dx+(z-a[1])*dz)/L2;t=Math.max(.1,Math.min(.9,t));const d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);if(d<bd){bd=d;best=[b,a,q,t];}}});return best;};
 const used={};F.sh.forEach(s=>{let nm=(s[2]||'').trim();if(!nm){const T={pharmacy:'Аптека',supermarket:'Продукты',convenience:'Продукты',hairdresser:'Парикмахерская',cafe:'Кафе',fast_food:'Кафе',bakery:'Пекарня',butcher:'Мясо',florist:'Цветы',alcohol:'Алкоголь',clothes:'Одежда',hardware:'Хозтовары',beauty:'Салон красоты',bank:'Банк'};nm=T[s[3]];if(!nm)return;}
  const hit=near(s[0],s[1]);if(!hit)return;const [b,a,q,t]=hit;const k=b.id+'_'+nm;if(used[k])return;used[k]=1;let idx=names.indexOf(nm);if(idx<0){if(names.length>=COLS*ROWS)return;idx=names.length;names.push(nm);}
  let cx=0,cz=0;b.p.forEach(p=>{cx+=p[0];cz+=p[1];});cx/=b.p.length;cz/=b.p.length;const dx=q[0]-a[0],dz=q[1]-a[1],el=Math.hypot(dx,dz),ux=dx/el,uz=dz/el;let nx=-uz,nz=ux;const mx=a[0]+dx*t,mz=a[1]+dz*t;if((mx-cx)*nx+(mz-cz)*nz<0){nx=-nx;nz=-nz;}
  const w=Math.min(el*.8,2.2+nm.length*.45),h=w*CH/CW*1.4;L.push([mx+nx*.18,mz+nz*.18,ux,uz,w,Math.min(h,1.1),idx,b.l>=2?3.1:Math.min(b.h||3,3)-.2]);});
 const atl=cv(CW*COLS,CH*ROWS,(g)=>{names.forEach((nm,i)=>{const x=(i%COLS)*CW,y=((i/COLS)|0)*CH,c=BR[nm]||BR[Object.keys(BR).find(k=>nm.includes(k))]||['#1f4f8a','#fff'];g.fillStyle=c[0];g.fillRect(x,y,CW,CH);if(c[2]){g.fillStyle=c[2];g.fillRect(x,y+CH-8,CW,8);}g.fillStyle=c[1];let fs=34;g.font=`bold ${fs}px Arial`;while(g.measureText(nm).width>CW-12&&fs>12){fs-=2;g.font=`bold ${fs}px Arial`;}g.textAlign='center';g.textBaseline='middle';g.fillText(nm,x+CW/2,y+CH/2);});});
 const at=new THREE.CanvasTexture(atl);at.anisotropy=4;const P=[],U=[];
 L.forEach(s=>{const [x,z,ux,uz,w,h,idx,y0]=s;const u0=(idx%COLS)/COLS,u1=u0+1/COLS,v1=1-((idx/COLS)|0)/ROWS,v0=v1-1/ROWS;const ax=x-ux*w/2,az=z-uz*w/2,bx=x+ux*w/2,bz=z+uz*w/2,y1=y0+h;
  // face winding: both sides via DoubleSide
  P.push(ax,y0,az,bx,y0,bz,bx,y1,bz,ax,y0,az,bx,y1,bz,ax,y1,az);U.push(u1,v0,u0,v0,u0,v1,u1,v0,u0,v1,u1,v1);});
 if(P.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:at,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-.5}));m.name='shopSigns';S.add(m);}
 window.__shopSigns=L.length;PT("shop signs "+L.length+" ("+names.length+" names)");}
}S.children.slice(FS0).forEach(o=>o.userData.fr=1);}
PT("AI traffic");if(!/nosplit/.test(Q))splitBig();let cullN=0;const SMALL=[];S.children.slice(S0).forEach(o=>{if(CHUNKS.includes(o)||TREECH.includes(o)||FURNCH.includes(o)||o.isLight)return;const b=new THREE.Box3().setFromObject(o);if(b.isEmpty())return;const sz=b.getSize(new THREE.Vector3());if(Math.max(sz.x,sz.z)<80){const c=b.getCenter(new THREE.Vector3());o.userData.c=[c.x,c.z];SMALL.push(o);}});// ---------- AI traffic & pedestrians ----------
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
PT('player car');// ---------- player car + BMW-style cockpit ----------
const car=new THREE.Group();
const RVL=[0].map(x=>{const l=new THREE.PointLight(0xfff4e6,0,14,1.6);l.position.set(0,.55,-4.4);car.add(l);l.visible=false;return l;});/* point light: spot lights break r149 cookie-map indexing (hl.map) */window.__RVL=RVL;
// reverse lamps: two wide white spot lights behind the tailgate (~18 m), always in the scene (intensity 0 when off -> no shader recompile)

// GLB parts with alpha textures came in as transparent+no depth write -> things drew through the body; make them alpha-tested opaque
const fixCarMats=()=>car.traverse(o=>{if(!o.isMesh||o.userData.cabM)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m.transparent&&m.opacity>=.99&&!m.userData.glass&&m.blending===THREE.NormalBlending&&!(m.isShaderMaterial||m.type==='ShaderMaterial')&&!o.userData.hud){m.transparent=false;m.depthWrite=true;m.alphaTest=Math.max(m.alphaTest,.5);m.needsUpdate=true;}});});
{let n=0;const iv=setInterval(()=>{fixCarMats();if(++n>30)clearInterval(iv);},1000);}S.add(car);const cab=new THREE.Group();window.__cab=cab;cab.rotation.y=Math.PI;car.add(cab);
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
const dispC=document.createElement('canvas');dispC.width=2048;dispC.height=342;const dg=dispC.getContext('2d');dg.scale(2048/1200,342/200);const dispT=new THREE.CanvasTexture(dispC);dispT.anisotropy=8;dispT.encoding=THREE.sRGBEncoding;
const dgeo=new THREE.PlaneGeometry(.84,.2,32,1);{const p=dgeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,.06*Math.pow(x/.42,2));}p.needsUpdate=true;dgeo.computeVertexNormals();}
const disp=add(new THREE.Mesh(dgeo,new THREE.MeshBasicMaterial({map:dispT,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-.5,polygonOffsetUnits:-2})),-.12,1.085,-.735,-.16);disp.renderOrder=3;
{const bg=dgeo.clone();const fr=add(new THREE.Mesh(bg,new THREE.MeshStandardMaterial({color:0x07080a,roughness:.15,metalness:.6})),-.12,1.085,-.742,-.16);fr.scale.set(1.035,1.16,1);}
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
// ---- BMW-style crystal shifter on a raised front console (visible from the driver's seat) ----
const SX=.06,SY=.86,SZ=-.47;
{// G05 centre console (ref: Wikimedia "BMW G05 X5 xDrive40i M Sport" photos): silver mesh trim, gloss-black control plate, iDrive, ambient edge lines
 const mesh=tex(cv(128,128,(g)=>{g.fillStyle='#8d9196';g.fillRect(0,0,128,128);for(let y=0;y<128;y+=4)for(let x=(y/4%2)*4;x<128;x+=8){g.fillStyle='#c9cdd2';g.fillRect(x,y,5,2);g.fillStyle='#55595e';g.fillRect(x,y+2,5,1);}}),3,3);
 const mMesh=new THREE.MeshStandardMaterial({map:mesh,roughness:.35,metalness:.85});
 add(rbox(.3,.24,.46,.07,mDash),0,.72,-.45);// body
 add(rbox(.31,.03,.47,.014,mMesh),0,.835,-.45);// silver mesh top frame
 add(rbox(.2,.012,.3,.02,mGloss),0,.853,-.47);// gloss black control plate
 [-1,1].forEach(sx=>add(new THREE.Mesh(new THREE.BoxGeometry(.004,.004,.46),mAmb),sx*.152,.851,-.45));// ambient edge lines
 add(rbox(.16,.03,.12,.03,mGloss),0,.84,-.67);// cupholder/phone tray recess
 [-.04,.04].forEach(x=>add(new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.008,24),new THREE.MeshStandardMaterial({color:0x111214,roughness:.6})),x,.857,-.66));
 // iDrive controller: knurled alu ring + glass top, right-rear of selector
 const kn=tex(cv(64,16,(g)=>{for(let x=0;x<64;x+=4){g.fillStyle='#e0e3e6';g.fillRect(x,0,2,16);g.fillStyle='#7c8085';g.fillRect(x+2,0,2,16);}}),12,1);
 add(new THREE.Mesh(new THREE.CylinderGeometry(.03,.031,.025,40),new THREE.MeshStandardMaterial({map:kn,roughness:.25,metalness:1})),SX+.045,.872,SZ+.09);
 add(new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.003,40),new THREE.MeshStandardMaterial({color:0x0a1830,emissive:0x1a3a80,emissiveIntensity:.6,roughness:.05})),SX+.045,.886,SZ+.09);
 // button rows (drive modes / start-stop / P / Auto H)
 const bM=new THREE.MeshStandardMaterial({color:0x0b0b0c,roughness:.2,metalness:.3});
 for(let k=0;k<5;k++)add(rbox(.032,.006,.018,.003,bM),SX-.11,.861,SZ+.03+k*.024);
 add(new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,.006,24),mAlu),SX-.11,.863,SZ-.01);// start/stop
 add(rbox(.04,.006,.022,.003,bM),SX,.861,SZ+.17);add(rbox(.04,.006,.022,.003,bM),SX+.06,.861,SZ+.17);// P / Auto H
}
add(new THREE.Mesh(new THREE.TorusGeometry(.04,.006,10,32),mAlu),SX,SY-.005,SZ,Math.PI/2);
{const pts=[];for(let i=0;i<=16;i++){const t=i/16;pts.push(new THREE.Vector2(.018+.02*Math.sin(t*Math.PI*.9)+.006*(1-t),t*.1));}pts.push(new THREE.Vector2(0,.1));
 knob.geometry.dispose();knob.geometry=new THREE.LatheGeometry(pts,28);knob.scale.set(1,1,1.35);knob.position.set(SX,SY,SZ);knob.rotation.set(-.12,0,0);
 knob.material=new THREE.MeshPhysicalMaterial({color:0xe8f4ff,roughness:.05,metalness:.1,clearcoat:1,clearcoatRoughness:.02,transparent:true,opacity:.7,emissive:0x2a3a4a,specularIntensity:1});
 const fac=new THREE.Mesh(new THREE.IcosahedronGeometry(.02,0),new THREE.MeshPhysicalMaterial({color:0xddeeff,transmission:.6,roughness:0,clearcoat:1,transparent:true,opacity:.6}));fac.position.y=.055;fac.scale.set(1,1.6,1.3);knob.add(fac);}
pBtn.position.set(SX,SY+.103,SZ-.012);pBtn.geometry=new THREE.CylinderGeometry(.011,.011,.006,20);
pBtn.material=new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(cv(64,64,(g)=>{g.fillStyle='#1a1a1a';g.fillRect(0,0,64,64);g.fillStyle='#fff';g.font='bold 44px sans-serif';g.textAlign='center';g.fillText('P',32,48);})),roughness:.3});
knobHi.position.set(SX,SY-.004,SZ);
// PRND indicator next to lever
const prC=document.createElement('canvas');prC.width=72;prC.height=256;const prT=new THREE.CanvasTexture(prC);
const prM=add(new THREE.Mesh(new THREE.PlaneGeometry(.05,.175),new THREE.MeshBasicMaterial({map:prT,transparent:true,toneMapped:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-.5})),SX-.055,.861,SZ+.085,-Math.PI/2);prM.renderOrder=7;
function drawPRND(){const g=prC.getContext('2d');g.clearRect(0,0,72,256);g.fillStyle='rgba(10,14,20,.85)';g.fillRect(2,2,68,252);g.strokeStyle='rgba(120,180,255,.6)';g.lineWidth=3;g.strokeRect(2,2,68,252);g.font='bold 52px sans-serif';g.textAlign='center';['P','R','N','D'].forEach((l,i)=>{g.fillStyle=st.sel===l?'#ffffff':'#7f8c99';if(st.sel===l){g.shadowColor='#7cf';g.shadowBlur=12;}else g.shadowBlur=0;g.fillText(l,36,52+i*62);});prT.needsUpdate=true;}
idr.position.set(SX,.85,-.3);

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
const cam=new THREE.PerspectiveCamera(innerWidth<innerHeight?95:68,innerWidth/innerHeight,.08,1500);cam.position.set(-.37,1.2,.05);cam.rotation.x=-.07;cab.add(cam);
// ---------- exterior X5-style body (chase view) — car frame: +Z forward ----------
const body=new THREE.Group();car.add(body);window.__carBody=body;body.visible=false;
{const paint=new THREE.MeshStandardMaterial({color:0x2d4f93,roughness:.25,metalness:.6}),glass=new THREE.MeshStandardMaterial({color:0x10161c,roughness:.05,metalness:.6,transparent:true,opacity:.85}),
 blk=new THREE.MeshStandardMaterial({color:0x0c0c0d,roughness:.6}),chrome=new THREE.MeshStandardMaterial({color:0xd8dde2,roughness:.15,metalness:1});
 const B=(o,x,y,z,rx,ry,rz)=>{o.position.set(x,y,z);o.rotation.set(rx||0,ry||0,rz||0);o.castShadow=true;body.add(o);return o;};
 // BMW X5 G05 official sketch: L 4922, W 2004, H 1745, WB 2975, overhang F 874 / R 1073, track F 1666 / R 1686, 21" wheels (r .39), clearance ~214
 // car frame: +z forward, front bumper z=+2.461, front axle z=+1.587, rear axle z=-1.388, rear bumper z=-2.461
 B(rbox(2.0,.24,4.9,.08,blk),0,.34,-.0);// black cladding / sills (bottom at ~.21)
 B(rbox(2.0,.62,4.86,.18,paint),0,.73,0);// main body, beltline ~1.02
 B(rbox(1.92,.1,1.36,.05,paint),0,1.01,1.79,.06);// hood (bumper top -> windshield base z 1.14)
 B(rbox(1.94,.36,.3,.12,paint),0,.83,2.33);// front fascia
 B(rbox(1.72,.62,2.5,.14,glass),0,1.38,-.95);// greenhouse side glass (spec: roof 2100, windshield 29deg)
 [-1,1].forEach(sx=>{B(rbox(.06,.62,.08,.02,blk),sx*.87,1.37,-.55);B(rbox(.06,.6,.08,.02,blk),sx*.87,1.36,-1.55);});// B/C pillars
 B(rbox(1.68,.04,1.44,.02,glass),0,1.37,.47,.506);// windshield 29 deg rake
 [-1,1].forEach(sx=>B(rbox(.06,.05,1.46,.02,paint),sx*.85,1.37,.47,.506));// A-pillars
 B(rbox(1.66,.07,2.12,.06,paint),0,1.725,-1.21);// roof, top 1.76 (H 1765)
 [-.62,.62].forEach(x=>{B(rbox(.035,.02,1.9,.008,chrome),x,1.772,-1.21);[-.35,-2.05].forEach(z=>B(rbox(.05,.03,.12,.01,blk),x,1.765,z));});// roof rails sitting on the roof with feet
 B(rbox(1.62,.04,.69,.02,glass),0,1.41,-2.37,-1.117);// rear window: tailgate 26 deg from vertical
 B(rbox(1.66,.06,.22,.03,paint),0,1.74,-2.3);// roof spoiler
 B(rbox(1.96,.6,.2,.1,paint),0,.86,-2.38);// tailgate lower
 // kidney grille
 [-.2,.2].forEach(x=>{B(rbox(.34,.32,.06,.08,chrome),x,.84,2.44);B(rbox(.3,.28,.06,.07,blk),x,.84,2.455);});
 // headlights (thin LED slits) and DRL
 const hlM=new THREE.MeshBasicMaterial({color:0xdfefff});[-1,1].forEach(s=>{B(rbox(.42,.1,.05,.03,blk),s*.66,.92,2.42);B(new THREE.Mesh(new THREE.BoxGeometry(.36,.025,.02),hlM),s*.66,.94,2.455);});
 window.tailM=new THREE.MeshBasicMaterial({color:0x550808});window.revM=new THREE.MeshBasicMaterial({color:0x333333});window.indM=new THREE.MeshBasicMaterial({color:0x553300});
 [-1,1].forEach(s=>{B(rbox(.5,.12,.05,.03,tailM),s*.66,1.07,-2.44);B(new THREE.Mesh(new THREE.BoxGeometry(.14,.06,.02),revM),s*.4,.62,-2.47);
  const i1=B(new THREE.Mesh(new THREE.BoxGeometry(.16,.05,.02),indM),s*.83,.9,2.43);i1.userData.side=s;const i2=B(new THREE.Mesh(new THREE.BoxGeometry(.14,.05,.02),indM),s*.86,1.07,-2.45);i2.userData.side=s;
  B(rbox(.11,.13,.24,.04,paint),s*1.05,1.1,1.0,0,-s*.2);});// mirrors -> 2218 mm across
 B(rbox(1.6,.12,.05,.03,blk),0,.5,2.46);B(rbox(.52,.12,.02,.02,new THREE.MeshBasicMaterial({color:0xf2f2f2})),0,.72,-2.47);// plate
 // wheel arches at axles
 [[1,1.5925],[1,-1.3825],[-1,1.5925],[-1,-1.3825]].forEach(([s,z])=>B(new THREE.Mesh(new THREE.TorusGeometry(.45,.07,6,16,Math.PI),blk),s*.98,.372,z,0,Math.PI/2));
}
const WH=[];{const tire=new THREE.MeshStandardMaterial({color:0x111111,roughness:.9}),rim=new THREE.MeshStandardMaterial({color:0xb0b4b8,roughness:.25,metalness:.9});
 [[1,1.5925,1,.838],[-1,1.5925,1,.838],[1,-1.3825,0,.851],[-1,-1.3825,0,.851]].forEach(([s,z,f,tx])=>{const g=new THREE.Group();g.position.set(s*tx,.372,z);body.add(g);const sp=new THREE.Group();g.add(sp);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.372,.372,.275,28),tire);t.rotation.z=Math.PI/2;t.castShadow=true;sp.add(t);
  const r=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.29,20),rim);r.rotation.z=Math.PI/2;sp.add(r);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2,sk=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,.03),rim);sk.position.set(s*.15,Math.sin(a)*.13,Math.cos(a)*.13);sk.rotation.x=-a;sk.rotation.z=0;sp.add(sk);}
  WH.push({g,sp,f});});}
// ---------- Sketchfab "2024 BMW X5 xDrive40i" by ddiaz-design (CC BY-NC-SA 4.0), optimised glb; procedural body stays as fallback ----------
const XM={ok:0,t0:performance.now(),eye:(/eye=([-\d.]+),([-\d.]+),([-\d.]+)/.exec(Q)||[0,-.394,1.32,.12]).slice(1).map(Number)};window.__XM=XM;
if(THREE.GLTFLoader&&!/nomodel/.test(Q)){const ld=new THREE.GLTFLoader();if(window.MeshoptDecoder)ld.setMeshoptDecoder(MeshoptDecoder);
 ld.load('models/x5.glb',gl=>{const root=gl.scene;const N={};root.traverse(o=>{if(o.name)N[o.name]=N[o.name]||o;if(o.isMesh){o.castShadow=true;o.receiveShadow=false;const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.transmission>0){m.transmission=0;m.transparent=true;m.opacity=.4;m.depthWrite=false;}if(m.name=='CARPAINT'){m.color.setHex(0x2d4f93);m.metalness=.6;m.roughness=.3;}m.envMapIntensity=1;if(m.name=='WINDOWS'&&!m.userData.wz){m.userData.wz=1;const g=o.geometry;g.computeBoundingBox();const gb=g.boundingBox;const cb=new THREE.Box3().setFromObject(root);const inv=new THREE.Matrix4().copy(o.matrixWorld).invert();const cc=cb.getCenter(new THREE.Vector3()).applyMatrix4(inv);
 // rear end of the glass = the end farther from the car centre; front windows (windshield + front doors) clear, rear tinted
 const rearPlus=(gb.max.z-cc.z)>(cc.z-gb.min.z);const span=gb.max.z-gb.min.z;const cut=rearPlus?gb.min.z+span*.56:gb.max.z-span*.56;m.color.setHex(0xcfdde4);m.opacity=.12;
 const U={uCut:{value:cut},uDir:{value:rearPlus?1:-1}};m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader='varying float vGz;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGz=position.z;');
  sh.fragmentShader='uniform float uCut,uDir;varying float vGz;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n float rr=step(0.,(vGz-uCut)*uDir);diffuseColor.rgb=mix(vec3(.80,.86,.88),vec3(.05,.06,.07),rr);diffuseColor.a=mix(.10,.62,rr);');};m.customProgramCacheKey=()=>'x5win';m.needsUpdate=true;}
 });}});
  {// ---- lights: split lamp primitives by region, own emissive materials ----
   const XL=XM.L={head:[],tail:[],brake3:[],indL:[],indR:[],rev:[]};const V=new THREE.Vector3(),SPL=[];root.updateMatrixWorld(true);
   root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const n=o.material.name;if(n!=='x5dummy_material_0_040'&&n!=='Red_Glass')return;SPL.push(o);});
   SPL.forEach(o=>{const G=o.geometry,P=G.attributes.position,I=G.index,nt=(I?I.count:P.count)/3,buck={};
    for(let t=0;t<nt;t++){let cx=0,cy=0,cz=0;for(let k=0;k<3;k++){const vi=I?I.getX(t*3+k):t*3+k;V.fromBufferAttribute(P,vi).applyMatrix4(o.matrixWorld);cx+=V.x/3;cy+=V.y/3;cz+=V.z/3;}
     const ax=Math.abs(cx),sd=cx>0?'L':'R';let key;
     if(o.material.name==='Red_Glass')key=cy>1.5?'brake3':'tail';
     else if(cz>1.5)key=ax>.78?'ind'+sd:'head';else if(cz<-1.7)key=cy<.9?'tail':(ax>.8?'ind'+sd:'tail');else if(ax>.85&&cy>1.1)key='ind'+sd;else key='tail';
     (buck[key]=buck[key]||[]).push(t);}
    const par=o.parent;Object.keys(buck).forEach(key=>{const ids=[];buck[key].forEach(t=>{for(let k=0;k<3;k++)ids.push(I?I.getX(t*3+k):t*3+k);});const g2=G.clone();g2.setIndex(ids);
     const m=o.material.clone();m.emissive=new THREE.Color(0);m.emissiveIntensity=1;if(!m.emissiveMap&&m.map)m.emissiveMap=m.map;m.toneMapped=false;
     const me=new THREE.Mesh(g2,m);me.position.copy(o.position);me.quaternion.copy(o.quaternion);me.scale.copy(o.scale);me.castShadow=false;par.add(me);XL[key].push(m);});
    par.remove(o);});
   // reverse lamps: small quads on the tailgate lamp inner ends (model has no separate reverse lens)
   const rvM=new THREE.MeshBasicMaterial({color:0x222222,toneMapped:false});[-1,1].forEach(s=>{const q=new THREE.Mesh(new THREE.PlaneGeometry(.11,.035),rvM);q.position.set(s*.4,1.065,-2.388);q.rotation.y=Math.PI;root.add(q);});XL.revB=rvM;
   // cheap glow sprites (rear red glow + head flare), additive, no lights
   const gC=cv(64,64,(c)=>{const gr=c.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,64,64);}),gT=new THREE.CanvasTexture(gC);
   const spr=(col,x,y,z,s)=>{const m=new THREE.SpriteMaterial({map:gT,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0});const sp=new THREE.Sprite(m);sp.position.set(x,y,z);sp.scale.set(s,s,1);root.add(sp);return m;};
   XL.gR=[spr(0xff2010,.66,1.1,-2.5,.7),spr(0xff2010,-.66,1.1,-2.5,.7)];XL.gF=[spr(0xdfeaff,.66,.92,2.5,.55),spr(0xdfeaff,-.66,.92,2.5,.55)];
   XL.gIL=[spr(0xffa020,.86,.92,2.4,.4),spr(0xffa020,.86,1.1,-2.4,.4)];XL.gIR=[spr(0xffa020,-.86,.92,2.4,.4),spr(0xffa020,-.86,1.1,-2.4,.4)];}
  root.position.set(0,-.029,.006);
  const xb=new THREE.Group();xb.add(root);XM.root=root;XM.int=[N.Interior,N.Steering].filter(Boolean);
  const nw=[];[['Wheel_FL','Caliper_FL',1],['Wheel_FR','Caliper_FR',1],['Wheel_RL',null,0],['Wheel_RR',null,0]].forEach(([wn,cn,f])=>{const w=N[wn];if(!w)return;const g=new THREE.Group();g.position.copy(w.position).add(root.position);xb.add(g);w.position.set(0,0,0);g.add(w);if(cn&&N[cn]){N[cn].position.set(0,0,0);g.add(N[cn]);}nw.push({g,sp:w,f});});
  if(N.Steering){const ax=(N.Steering.userData&&N.Steering.userData.axis)||[0,.909,.417];XM.sw=N.Steering;XM.swQ=N.Steering.quaternion.clone();XM.swAx=new THREE.Vector3(ax[0],ax[2],-ax[1]).normalize();}
  if(nw.length==4&&!/nocabmodel/.test(Q)){// cabin: clone of body+interior+steering with cheap unlit-ish materials, procedural cabin hidden except screens/mirrors
   const cx=root.clone(true),MC={};
   // Poly Haven CC0 cabin textures: fabric_leather_02 (wheel rim, armrests/edges), velour_velvet (seats, doors, headliner lighter), coated_pine (fineline wood trims)
   const CTON=!/[?&]nocabtex/.test(Q);const CTLO=GSET.preset==='low'||mobile;const CT=!CTON?{}:(()=>{const L=new THREE.TextureLoader(),S=(mobile||CTLO)?512:1024,t=(n,srgb)=>{const x=L.load('tex/cab/'+n+S+'.webp');x.wrapS=x.wrapT=THREE.RepeatWrapping;x.anisotropy=4;if(srgb)x.encoding=THREE.sRGBEncoding;return x;};
    return{lc:t('leather_c',1),ln:t('leather_n'),lr:t('leather_r'),vc:t('velour_c',1),vn:t('velour_n'),wc:t('wood_c',1),wn:t('wood_n'),wr:t('wood_r')};})();
   const woodRim=cx=>{// BMW-style wood segment on the upper rim arc (~10 to 2 o'clock): new torus-arc geometry parented to the rim mesh, grain along the rim
    let rim=null;cx.traverse(o=>{if(o.isMesh&&o.name==='Steering_2')rim=o;});if(!rim)return;const P=rim.geometry.attributes.position;let Rm=0,zc=0;for(let i=0;i<P.count;i++){Rm+=Math.hypot(P.getX(i),P.getY(i));zc+=P.getZ(i);}Rm/=P.count;zc/=P.count;
    rim.updateMatrixWorld(true);const up=new THREE.Vector3(0,1,0).transformDirection(rim.matrixWorld.clone().invert());const ua=Math.atan2(up.y,up.x),arc=Math.PI*2/3;
    const inArc=(x,y,pad)=>{let d=Math.atan2(y,x)-ua;d=Math.atan2(Math.sin(d),Math.cos(d));return Math.abs(d)<arc/2+pad;};
    // measure the real rim cross-section in this arc (outer ring verts only)
    let rmin=1e9,rmax=-1e9,zmin=1e9,zmax=-1e9;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),r=Math.hypot(x,y);if(r<Rm*.85||!inArc(x,y,0))continue;rmin=Math.min(rmin,r);rmax=Math.max(rmax,r);const z=P.getZ(i);zmin=Math.min(zmin,z);zmax=Math.max(zmax,z);}
    const Rc=(rmin+rmax)/2,tr=(rmax-rmin)/2,tz=(zmax-zmin)/2,tb=Math.min(tr,tz);zc=(zmin+zmax)/2;
    // cut the original rim faces under the wood so it's flush, not a sleeve
    {const ix=rim.geometry.index;if(ix){const keep=[];for(let t=0;t<ix.count;t+=3){const a0=ix.getX(t),b0=ix.getX(t+1),c0=ix.getX(t+2);const cx2=(P.getX(a0)+P.getX(b0)+P.getX(c0))/3,cy2=(P.getY(a0)+P.getY(b0)+P.getY(c0))/3,cr=Math.hypot(cx2,cy2);if(cr>Rm*.85&&inArc(cx2,cy2,-.01))continue;keep.push(a0,b0,c0);}rim.geometry.setIndex(keep);}}
    const TB0=Rc*.01,g=new THREE.TorusGeometry(Rc,TB0,12,40,arc);{const q=g.attributes.position;for(let i=0;i<q.count;i++){const x=q.getX(i),y=q.getY(i),z=q.getZ(i),r=Math.hypot(x,y),k=(Rc+(r-Rc)/TB0*tr)/r;q.setXYZ(i,x*k,y*k,z/TB0*tz);}g.computeVertexNormals();}g.rotateZ(ua-arc/2);g.translate(0,0,zc);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*3,uv.getY(i)*.35);
    const HQ=GSET.preset==='high'||GSET.preset==='ultra',PB=!CTLO;const m=HQ?new THREE.MeshPhysicalMaterial({map:CT.wc,normalMap:CT.wn,roughnessMap:CT.wr,roughness:.5,clearcoat:1,clearcoatRoughness:.05}):PB?new THREE.MeshStandardMaterial({map:CT.wc,normalMap:CT.wn,roughness:.45}):new THREE.MeshLambertMaterial({map:CT.wc});
    m.color.setScalar(2.4);m.emissiveMap=CT.wc;m.emissive=new THREE.Color(1,.85,.7);m.userData.eK=3.2;m.userData.env=1;if(PB&&CABX&&CABX.env){m.envMap=CABX.env;m.envMapIntensity=1;}if(m.normalScale)m.normalScale.set(.35,.35);if(window.__XM&&__XM.cabMats)__XM.cabMats.push(m);
    const w=new THREE.Mesh(g,m);w.name='WoodRim';rim.add(w);
    // end caps (thin chrome-ish rings at both ends of the wood)
    const cm=new THREE.MeshStandardMaterial({color:0x8a8f96,metalness:.9,roughness:.3});[ua-arc/2,ua+arc/2].forEach(a=>{const c=new THREE.Mesh(new THREE.TorusGeometry(tb*.97,tb*.05,5,16),cm);c.position.set(Math.cos(a)*Rc,Math.sin(a)*Rc,zc);c.lookAt(rim.localToWorld(new THREE.Vector3(Math.cos(a+1.5708)*Rc+Math.cos(a)*Rc,Math.sin(a+1.5708)*Rc+Math.sin(a)*Rc,zc)));c.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(-Math.sin(a),Math.cos(a),0)));w.add(c);});
    window.__WRIM=w;console.log('wood rim',Rc.toFixed(3),tb.toFixed(3),(ua*57.3).toFixed(0));};
   const woodTrim=cx=>{// thin coated_pine strip meshes laid on the dash face and both front door inserts (new geometry from ray hits on the cabin)
    car.updateMatrixWorld(true);const ms=[];cx.traverse(o=>{if(o.isMesh&&o.visible&&!/Steering|Body_8|Body_6|Body_11|Glass/i.test(o.name))ms.push(o);});const rc=new THREE.Raycaster(),cw=car.matrixWorld,cwi=cw.clone().invert(),O=new THREE.Vector3(),D=new THREE.Vector3(),N=new THREE.Vector3();
    const hitL=(o,d)=>{O.copy(o).applyMatrix4(cw);D.copy(d).transformDirection(cw);rc.set(O,D);rc.far=1.2;const h=rc.intersectObjects(ms,false)[0];if(!h||!h.face)return null;N.copy(h.face.normal).transformDirection(h.object.matrixWorld);if(N.dot(D)>0)N.negate();return [h.point.clone().applyMatrix4(cwi),N.clone().transformDirection(cwi)];};
    const strips=[];
    // dash: rays forward from the cabin centre plane at the trim height
    {const P=[];for(let x=-.74;x<=.74;x+=.03){const h=hitL(new THREE.Vector3(x,.975,0),new THREE.Vector3(0,0,1));P.push(h);}strips.push({P,up:new THREE.Vector3(0,1,0),H:.032});}
    // doors: rays sideways at elbow-insert height
    for(const sd of[-1,1]){const P=[];for(let z=-.55;z<=.42;z+=.03){const h=hitL(new THREE.Vector3(sd*.2,1.0,z),new THREE.Vector3(sd,0,0));P.push(h);}strips.push({P,up:new THREE.Vector3(0,1,0),H:.026});}
    const HQ=GSET.preset==='high'||GSET.preset==='ultra',m=HQ?new THREE.MeshPhysicalMaterial({map:CT.wc,normalMap:CT.wn,roughnessMap:CT.wr,roughness:.55,clearcoat:1,clearcoatRoughness:.06,color:0xffffff}):new THREE.MeshStandardMaterial({map:CT.wc,normalMap:CT.wn,roughnessMap:CT.wr,roughness:.55,color:0xffffff});m.normalScale=new THREE.Vector2(.4,.4);m.emissive=new THREE.Color(0xffd0a0);m.emissiveIntensity=1.6;m.emissiveMap=CT.wc;m.side=THREE.DoubleSide;m.polygonOffset=true;m.polygonOffsetFactor=-2;m.polygonOffsetUnits=-2;if(CABX&&CABX.env){m.envMap=CABX.env;m.envMapIntensity=.9;}
    m.userData.eK=3;m.userData.env=.9;if(window.__XM&&__XM.cabMats)__XM.cabMats.push(m);const g=new THREE.Group();g.name="WoodTrim";let nseg=0;
    strips.forEach(S0=>{let run=[];const flush=()=>{if(run.length<4){run=[];return;}const pos=[],nor=[],uv=[],idx=[];let L=0;run.forEach((h,i)=>{if(i)L+=h[0].distanceTo(run[i-1][0]);const p=h[0].clone().addScaledVector(h[1],S0.H<.03?.02:.008);const up=S0.up.clone().addScaledVector(h[1],-S0.up.dot(h[1])).normalize();for(const s of[-1,1]){const q=p.clone().addScaledVector(up,s*S0.H/2);pos.push(q.x,q.y,q.z);nor.push(h[1].x,h[1].y,h[1].z);uv.push(L/.3,s<0?0:.12);}if(i){const a=(i-1)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}});
      const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));G.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));G.setIndex(idx);const me=new THREE.Mesh(G,m);g.add(me);nseg++;run=[];};
     S0.P.forEach(h=>{if(!h){flush();return;}const pr=run[run.length-1];if(pr&&(h[0].distanceTo(pr[0])>.06||h[1].dot(pr[1])<.6))flush();run.push(h);});flush();});
    // car-local -> cabin-local
    cx.updateMatrixWorld(true);const toC=cx.matrixWorld.clone().invert().multiply(cw);g.children.forEach(me=>me.geometry.applyMatrix4(toC));cx.add(g);window.__WOOD=g;console.log('wood trim segments',nseg);};
   const CROLE=!CTON?{}:{Steering_2:'rim',Interior_7:'leather',Interior_8:'velour'};// Interior_2 is the shared INT_MAT atlas mesh (dash/console/spokes): re-UVing it caused the streak garbage
   // r149 BufferGeometry.clone() of GLB interleaved attributes loses the buffer byteOffset -> garbage; deinterleave by hand
   const dcl=g=>{const n=new THREE.BufferGeometry();for(const k in g.attributes){const A=g.attributes[k],it=A.itemSize,arr=new Float32Array(A.count*it);for(let i=0;i<A.count;i++)for(let j=0;j<it;j++)arr[i*it+j]=A.getComponent?A.getComponent(i,j):[A.getX(i),A.getY(i),A.getZ(i),A.getW(i)][j];n.setAttribute(k,new THREE.BufferAttribute(arr,it,A.normalized));}if(g.index)n.setIndex(g.index.clone());g.groups.forEach(q=>n.addGroup(q.start,q.count,q.materialIndex));return n;};
   const boxUV=(g,k)=>{g=dcl(g);const P=g.attributes.position,N=g.attributes.normal,uv=new Float32Array(P.count*2);for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),ax=Math.abs(N.getX(i)),ay=Math.abs(N.getY(i)),az=Math.abs(N.getZ(i));let u,v;if(az>=ax&&az>=ay){u=x;v=y;}else if(ay>=ax){u=x;v=z;}else{u=z;v=y;}uv[i*2]=u*k;uv[i*2+1]=v*k;}g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;};
   const rimUV=g=>{g=dcl(g);const P=g.attributes.position;let Rm=0,zc=0;for(let i=0;i<P.count;i++){Rm+=Math.hypot(P.getX(i),P.getY(i));zc+=P.getZ(i);}Rm/=P.count;zc/=P.count;const uv=new Float32Array(P.count*2);
    for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),r=Math.hypot(x,y);uv[i*2]=(Math.atan2(y,x)/6.2832+.5)*10;uv[i*2+1]=(Math.atan2(P.getZ(i)-zc,r-Rm)/6.2832+.5)*1.5;}g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;};
   const velCol=g=>{const P=g.attributes.position;g.computeBoundingBox();const b=g.boundingBox,c=new Float32Array(P.count*3);for(let i=0;i<P.count;i++){const t=(P.getY(i)-b.min.y)/(b.max.y-b.min.y);const hd=t>.78?1:0;const v=hd?.78:.2;c[i*3]=v*1.02;c[i*3+1]=v;c[i*3+2]=v*.97;}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;};
   
   window.__CX=cx;cx.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=false;{const role=CROLE[o.name];if(role&&!o.userData.ct){o.userData.ct=1;o.geometry=role==='rim'?rimUV(o.geometry):role==='velour'?velCol(boxUV(o.geometry,9)):boxUV(o.geometry,role==='wood'?4.5:7);o.userData.role=role;}}const f=m=>{const mk=m.uuid+(o.userData.role||'');if(MC[mk])return MC[mk];
  // interior materials by part: PBR (Standard + room env map) on Medium+, Lambert on Low; emissive kept low so trims don't blow out
  const PB=!(GSET.preset==='low'||mobile),nm=m.name||'';const K={LEATHER:{r:.5,m:0,e:.6,env:.55,stitch:1},STIT:{r:.6,m:0,e:.7,env:.3},INT_MAT:{r:.22,m:1,e:.12,env:1.25,col:0xb9bec4},INT_A:{r:.32,m:.55,e:.8,env:1},Plastic_INT:{r:.6,m:0,e:.9,env:.45},Fabric:{r:.95,m:0,e:1.2,env:.15,col:0xc9c6bf},Speaker:{r:.35,m:.8,e:.6,env:.9},Speaker_1:{r:.35,m:.8,e:.6,env:.9},grille_INT_1:{r:.3,m:.85,e:.6,env:1},Grille_Int:{r:.3,m:.85,e:.6,env:1},DISK:{r:.25,m:.9,e:.6,env:1.1},BADGES:{r:.2,m:.9,e:.6,env:1.1},x5dummy_material_39:{r:.07,m:0,e:0,env:1.3,col:0x050608,piano:1}}[nm]||{r:.6,m:0,e:.8,env:.4};
  let l=PB?new THREE.MeshStandardMaterial({color:m.color,map:m.map,transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,side:THREE.DoubleSide,alphaTest:m.alphaTest,roughness:K.r,metalness:K.m}):new THREE.MeshLambertMaterial({color:m.color,map:m.map,transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,side:THREE.DoubleSide,alphaTest:m.alphaTest});
  l.userData.src=nm;l.userData.eK=K.e;l.userData.env=K.env;if(K.col!==undefined)l.color.setHex(K.col);
  if(m.emissiveMap){l.emissive=m.emissive;l.emissiveMap=m.emissiveMap;}else if(m.map){l.emissive=new THREE.Color(.1,.1,.1);l.emissiveMap=m.map;}else l.emissive=m.color.clone().multiplyScalar(.08);
  if(K.piano){l.map=l.emissiveMap=null;l.emissive.setHex(0);}
  if(PB&&K.stitch&&CABX.leatherN){l.normalMap=CABX.leatherN;l.normalScale=new THREE.Vector2(.35,.35);}
  {const role=o.userData.role,HQ=PB&&(GSET.preset==='high'||GSET.preset==='ultra');if(role&&PB){const ph=HQ?new THREE.MeshPhysicalMaterial({side:THREE.DoubleSide}):new THREE.MeshStandardMaterial({side:THREE.DoubleSide});ph.userData=l.userData;
    if(role==='rim'||role==='leather'){ph.color.setScalar(role==='rim'?2.8:2.2);ph.map=CT.lc;ph.normalMap=CT.ln;ph.normalScale=new THREE.Vector2(.8,.8);ph.roughnessMap=CT.lr;ph.roughness=.85;if(HQ){ph.sheen=.35;ph.sheenRoughness=.45;ph.sheenColor=new THREE.Color(0x6a6660);}ph.emissive=new THREE.Color(0x0a0a0a);ph.emissiveMap=CT.lc;}
    else if(role==='velour'){ph.map=CT.vc;ph.normalMap=CT.vn;ph.normalScale=new THREE.Vector2(.6,.6);ph.vertexColors=true;ph.roughness=.95;if(HQ){ph.sheen=1;ph.sheenRoughness=.35;ph.sheenColor=new THREE.Color(0x8a8580);}ph.emissive=new THREE.Color(0x111111);ph.emissiveMap=CT.vc;}
    else if(role==='wood'){ph.map=CT.wc;ph.normalMap=CT.wn;ph.normalScale=new THREE.Vector2(.4,.4);ph.roughnessMap=CT.wr;ph.roughness=.6;if(HQ){ph.clearcoat=1;ph.clearcoatRoughness=.06;}ph.emissive=new THREE.Color(0x0c0a08);ph.emissiveMap=CT.wc;}
    ph.userData.eK=.6;ph.userData.env=role==='wood'?1.1:.35;l.dispose();l=ph;}
   else if(role&&!PB){// Low / phones: cheap Lambert with the 512 textures so the wheel/seats aren't flat black
    const lb=new THREE.MeshLambertMaterial({side:THREE.DoubleSide});lb.userData=l.userData;const cm=role==='velour'?CT.vc:CT.lc;lb.map=cm;lb.emissiveMap=cm;lb.emissive=new THREE.Color(1,1,1);if(role!=='velour')lb.color.setScalar(2.6);lb.userData.eK=role==='velour'?1.4:2.2;if(role==='velour')lb.vertexColors=true;l.dispose();l=lb;}}
  if(PB&&CABX.env){l.envMap=CABX.env;l.envMapIntensity=K.env*(tod==0?1:tod==1?.5:.12);}
  (XM.cabMats=XM.cabMats||[]).push(l);if(l.emissiveMap)l.emissive.setScalar(K.e*(tod==0?.2:tod==1?.12:.05));return MC[mk]=l;};o.material=Array.isArray(o.material)?o.material.map(f):f(o.material);});
   cx.rotation.y=Math.PI;cx.position.set(0,-.029,-.006);if(CABX.fill&&!CABX.fill.parent){car.add(CABX.fill,CABX.amb);CABX.fill.intensity=tod==0?.9:tod==1?.45:.05;CABX.amb.intensity=tod==2?.35:tod==1?.12:0;}const keep=new Set([disp,prM,rcG,hudM.parent===cab?hudM:null,...MIR.map(o=>o.mesh)]);cab.children.forEach(o=>{if(o.isCamera||o.isLight||keep.has(o))return;o.visible=false;});
   {// Curved Display fitted to the model's own screen quads (Interior_11: cluster x -.554..-.235, CID x -.161..183; measured in cab frame)
 const P=[[-.554,-.662,-.685],[-.235,-.645,-.667],[-.161,-.635,-.661],[.183,-.569,-.596]],yb=1.067,yt=1.194,N=36,pos=[],uv=[],idx=[];
 const zAt=(x,k)=>{for(let i=0;i<3;i++)if(x<=P[i+1][0]+1e-6){const t=(x-P[i][0])/(P[i+1][0]-P[i][0]);return P[i][k]+(P[i+1][k]-P[i][k])*t;}return P[3][k];};
 for(let i=0;i<=N;i++){const u=i/N,x=P[0][0]+(P[3][0]-P[0][0])*u;pos.push(x,yb,zAt(x,1)+.004,x,yt,zAt(x,2)+.004);uv.push(u,0,u,1);if(i<N){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
 disp.geometry=g;disp.position.set(0,0,0);disp.rotation.set(0,0,0);XM.disp=disp;
 rcG.position.set(.011,1.1305,-.607);rcG.rotation.set(-.2,-.19,0,'YXZ');rcG.scale.set(1,1,1);
 // ambient contour lines: one merged ribbon mesh along dash + front doors (points ray-cast on the model)
 const L=[[[-.68,.935,-.632],[-.6,.935,-.622],[-.2,.935,-.585],[-.12,.935,-.54],[0,.935,-.532],[.12,.935,-.524],[.2,.935,-.53],[.28,.935,-.57],[.4,.935,-.576],[.52,.935,-.585],[.66,.935,-.6]],
  [[.776,.975,-.42],[.778,.975,-.3],[.778,.975,-.15],[.777,.975,.02]],[[-.776,.975,-.42],[-.778,.975,-.3],[-.778,.975,-.15],[-.777,.975,.02]]],ap=[],ai=[];
 L.forEach((l,k)=>{const b=ap.length/3;l.forEach(q=>{const o=k?[0,0,0]:[0,0,.007];ap.push(q[0]+o[0],q[1]-.0025,q[2]+o[2],q[0]+o[0],q[1]+.0025,q[2]+o[2]);});for(let i=0;i<l.length-1;i++){const a=b+i*2;ai.push(a,a+2,a+1,a+1,a+2,a+3);}});
 const ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.Float32BufferAttribute(ap,3));ag.setIndex(ai);mAmb.toneMapped=false;mAmb.side=THREE.DoubleSide;const am=new THREE.Mesh(ag,mAmb);cab.add(am);XM.amb=am;ambApply();}
   if(typeof rcG!=='undefined')rcG.visible=rcG.visible;cab.add(cx);XM.cab=cx;cx.traverse(o=>{if(o.name=='Steering'){XM.sw2=o;XM.sw2Q=o.quaternion.clone();}});
   {// mirrors fitted to the model's own glass (Body_9 rear-facing tris): exact shape, planar UV, mirrored cameras
 cab.updateMatrixWorld(true);const inv=cab.matrixWorld.clone().invert();let B9=null;cx.traverse(q=>{if(q.isMesh&&q.name=='Body_9')B9=q;});
 const E=new THREE.Vector3(-.394,1.25,.12);
 const fit=(o,test,fovK,near)=>{const g=B9.geometry,p=g.attributes.position,M=inv.clone().multiply(B9.matrixWorld),A=new THREE.Vector3(),Bv=new THREE.Vector3(),C=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3(),tri=[],N=new THREE.Vector3();const cnt=g.index?g.index.count:p.count;
  for(let k=0;k<cnt;k+=3){const f=j=>g.index?g.index.getX(k+j):k+j;A.fromBufferAttribute(p,f(0)).applyMatrix4(M);Bv.fromBufferAttribute(p,f(1)).applyMatrix4(M);C.fromBufferAttribute(p,f(2)).applyMatrix4(M);c.copy(A).add(Bv).add(C).divideScalar(3);n.subVectors(Bv,A).cross(C.clone().sub(A));const ar=n.length();n.normalize();if(n.z<.8||!test(c))continue;N.addScaledVector(n,ar);tri.push(A.clone(),Bv.clone(),C.clone());}
  if(tri.length<3)return false;N.normalize();const h=new THREE.Vector3(0,1,0).cross(N).normalize(),vv=N.clone().cross(h);let u0=9,u1=-9,v0=9,v1=-9;const ctr=new THREE.Vector3();tri.forEach(q=>{const u=q.dot(h),v=q.dot(vv);u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v);ctr.add(q);});ctr.divideScalar(tri.length);
  const pos=[],uv=[];tri.forEach(q=>{const r=q.clone().addScaledVector(N,.0025);pos.push(r.x,r.y,r.z);uv.push(1-(q.dot(h)-u0)/(u1-u0),(q.dot(vv)-v0)/(v1-v0));});
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));gg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const m=o.mesh;m.geometry=gg;m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.set(1,1,1);m.material.side=THREE.FrontSide;m.material.toneMapped=false;m.material.color.setScalar(o.aim?1.1:1.35);
  const d=ctr.clone().sub(E).normalize(),rf=o.aim?o.aim.clone().sub(ctr).normalize():d.clone().addScaledVector(N,-2*d.dot(N)),cp=ctr.clone().addScaledVector(N,.01);if(!o.aim){rf.set(Math.sign(ctr.x)*.1,-.06,1).normalize();cp.x+=Math.sign(ctr.x)*.04;}// side: adjusted like a real driver would (flank just visible on the inner edge)
  o.c.position.copy(cp);o.c.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(cp,cp.clone().add(rf),new THREE.Vector3(0,1,0)));
  const w=u1-u0,ht=v1-v0,dist=ctr.distanceTo(E);o.c.fov=2*Math.atan(ht/2/dist)*57.3*fovK;o.c.aspect=w/ht;o.c.near=near;o.c.updateProjectionMatrix();o.fit={w,ht,ctr,N};return true;};
 MIR[0].aim=new THREE.Vector3(0,1.42,2.6);const ok=[fit(MIR[0],c=>Math.abs(c.x)<.13&&c.y>1.42&&c.y<1.5&&c.z<-.4&&c.z>-.53,2.6,.08),fit(MIR[1],c=>c.x<-.89&&c.y>1.12&&c.y<1.3&&c.z<-.54&&c.z>-.66,1.9,.25),fit(MIR[2],c=>c.x>.89&&c.y>1.12&&c.y<1.3&&c.z<-.54&&c.z>-.66,2.2,.25)];
 XM.mirOk=ok;cx.traverse(q=>{if(q.isMesh&&q.name=='Body_8')XM.cabWin=q;});MIR[0].modelCab=true;}cam.position.set(-.394,1.22,.15);XM.cabOk=1;if(CTON&&CT.wc)setTimeout(()=>{try{woodTrim(cx);}catch(e){console.warn('wood trim',e);}try{woodRim(cx);}catch(e){console.warn('wood rim',e);}},300);}
  if(nw.length==4){body.children.forEach(o=>o.visible=false);WH.length=0;nw.forEach(w=>WH.push(w));body.add(xb);XM.ok=1;console.log('X5 model loaded in',(performance.now()-XM.t0).toFixed(0),'ms');}},undefined,e=>console.warn('X5 model failed, keeping procedural body',e));}
// ---------- cabin look: PMREM room environment for reflections, procedural leather grain normal, window fill + night ambient lights ----------
const CABX={};{try{if(THREE.RoomEnvironment&&!(GSET.preset==='low'||mobile)){const pm=new THREE.PMREMGenerator(R);CABX.env=pm.fromScene(new THREE.RoomEnvironment(),.04).texture;pm.dispose();}}catch(e){}
 const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');const id=g.createImageData(N,N);const H=new Float32Array(N*N);for(let i=0;i<N*N;i++)H[i]=Math.random();
 for(let k=0;k<2;k++){const T=H.slice();for(let y=0;y<N;y++)for(let x=0;x<N;x++){let s=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)s+=T[((y+a+N)%N)*N+(x+b+N)%N];H[y*N+x]=s/9;}}
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,dx=(H[y*N+(x+1)%N]-H[y*N+(x+N-1)%N])*6,dy=(H[((y+1)%N)*N+x]-H[((y+N-1)%N)*N+x])*6;// stitch line every 64 px
  const st=(x%64<2)?.6:0;id.data[i*4]=128+Math.max(-127,Math.min(127,(dx+st)*127));id.data[i*4+1]=128+Math.max(-127,Math.min(127,dy*127));id.data[i*4+2]=255;id.data[i*4+3]=255;}
 g.putImageData(id,0,0);CABX.leatherN=new THREE.CanvasTexture(c);CABX.leatherN.wrapS=CABX.leatherN.wrapT=THREE.RepeatWrapping;
 // fill light from the windows (day) and a warm ambient/display glow (night), parented to the cabin
 CABX.fill=new THREE.PointLight(0xdfe8f2,0,2.6,1.5);CABX.fill.position.set(-.1,1.45,.1);CABX.amb=new THREE.PointLight(0xff9a50,0,1.6,1.6);CABX.amb.position.set(0,.85,.35);}
const chaseCam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.3,2000);let chase=false,chP=null;
const LTQ={brk:/[?&]brk/.test(Q),ih:/[?&]indhold/.test(Q)};if(/[?&]indl/.test(Q))setTimeout(()=>{st.ind=-1;},0);
function lightTick(){if(typeof HB!='undefined'&&(fr&7)==0)lightsUpd();const L=XM.L;if(!L)return;const indOn2=indOn||LTQ.ih,brk=st.brk>.1||st.held||LTQ.brk,tail=lights||tod==2,iL=(st.haz||st.ind===-1)&&indOn2,iR=(st.haz||st.ind===1)&&indOn2,rev=st.sel==='R',night=tod==2?1:tod==1?.6:.25;
 const se=(arr,hex,v)=>arr.forEach(m=>{m.emissive.setHex(hex);m.emissiveIntensity=v;});
 L.head.forEach(m=>{if(m.emissiveMap){m.emissiveMap=null;m.needsUpdate=true;}});se(L.head,0xf4f8ff,HB.hi?7:lights?4.5:(st.on?4:.15));se(L.tail,0xff1810,brk?3.2:tail?1.2:.08);se(L.brake3,0xff1810,brk?3.5:0);se(L.indL,0xffa020,iL?3.5:0);se(L.indR,0xffa020,iR?3.5:0);
 L.revB.color.setHex(rev?0xffffff:0x222222);L.gR.forEach(m=>m.opacity=(brk?.7:tail?.25:0)*night);L.gF.forEach(m=>m.opacity=HB.hi?.95*Math.max(night,.45):lights?Math.max(.55*night,.35):(st.on?.38:0));L.gIL.forEach(m=>m.opacity=iL?.9*night:0);L.gIR.forEach(m=>m.opacity=iR?.9*night:0);}
// g-force head/body motion: spring-damper on real long/lat acceleration (subtle: few cm, <=1.5 deg pitch)
const GFX={on:localStorage.getItem('x5gfx')!=='0',x:0,y:0,z:0,p:0,v:[0,0,0,0],k:1};
function gfxTick(dt){const on=GFX.on?1:0;GFX.k=on;const a=Math.max(-11,Math.min(8,st.along||0)),l=Math.max(-10,Math.min(10,st.alat||0));
 const T=[on*-l*.0022,on*(a<0?a*.0018:-a*.0006),on*Math.max(-.035,Math.min(.025,a*.0039)),on*Math.max(-.026,Math.min(.018,a*.0028))],K=70,C=2*Math.sqrt(K)*.65,key=['x','y','z','p'];
 const h=Math.min(dt,.05)/2;for(let s2=0;s2<2;s2++)for(let i=0;i<4;i++){const x=GFX[key[i]];GFX.v[i]+=(K*(T[i]-x)-C*GFX.v[i])*h;GFX[key[i]]=x+GFX.v[i]*h;}}
function bodyTick(dt){lightTick();gfxTick(dt);const delta=st.steer*.6/(1+Math.abs(st.v)*.06);if(XM.sw){XM.sw.quaternion.copy(XM.swQ).premultiply(_q1.setFromAxisAngle(XM.swAx,-st.steer*2.4));}if(XM.sw2){XM.sw2.quaternion.copy(XM.sw2Q).premultiply(_q1.setFromAxisAngle(XM.swAx,st.steer*2.4));}WH.forEach(w=>{if(w.f)w.g.rotation.y=delta;w.sp.rotation.x+=st.v/.372*dt;});
 tailM.color.setHex(st.brk>.1||st.held?0xff1010:(lights?0x8a1010:0x400606));revM.color.setHex(st.sel==='R'?0xffffff:0x333333);
 body.children.forEach(o=>{if(o.userData.side){const on=(st.haz||st.ind===o.userData.side*-1||st.ind===o.userData.side)&&indOn;}});
 const iL=(st.haz||st.ind===-1)&&indOn,iR=(st.haz||st.ind===1)&&indOn;body.children.forEach(o=>{if(o.userData.side){o.material=o.userData.side>0?(iL?indOnM:indM):(iR?indOnM:indM);}});
 if(chase){const s=Math.sin(st.h),c=Math.cos(st.h);const hb2=st.h+(st.beta||0)*.6+CA,s3=Math.sin(hb2),c3=Math.cos(hb2);const tx=st.x-s3*6.2,tz=st.z-c3*6.2;if(!chP)chP=new THREE.Vector3(tx,2.4,tz);chP.lerp(_v1.set(tx,2.4,tz),Math.min(1,dt*10));chaseCam.position.copy(chP);if(COLX.shk>0&&performance.now()-(window.__t0s||(window.__t0s=performance.now()))>3000){const k=Math.min(1,COLX.shk)**2*.35,tt=performance.now()*.05;chaseCam.position.x+=Math.sin(tt*1.3)*k;chaseCam.position.y+=Math.sin(tt*1.7)*k*.6;chaseCam.position.z+=Math.cos(tt*1.1)*k;};chaseCam.position.y+=Math.max(-.3,Math.min(.3,GFX.y*3));chaseCam.lookAt(st.x+s*3,1.1-GFX.p*6,st.z+c*3);}}
const indOnM=new THREE.MeshBasicMaterial({color:0xffa010});
function setChase(v){chase=v;body.visible=v;cab.visible=!v;chP=null;const b=document.getElementById('bCam');if(b)b.classList.toggle('a',v);}if(/[?&]chase/.test(Q))setTimeout(()=>setChase(true),0);
const topCam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,Q.includes("city")?50:1,12000);
// minimap for center screen
const MS=0.55,mapC=cv(1800,1800,(g,w,h)=>{g.fillStyle='#16202a';g.fillRect(0,0,w,h);g.lineCap='round';
 C.g.forEach(p=>{g.fillStyle='#1f3a28';g.beginPath();p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.fill();});
 C.b.forEach(b=>{g.fillStyle='#34404c';g.beginPath();b.p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.fill();});
 C.r.forEach(r=>{if(r.w<4)return;g.strokeStyle=r.w>=8?'#e8b060':'#9aa8b4';g.lineWidth=Math.max(2,r.w*MS);g.beginPath();r.p.forEach((q,i)=>g[i?'lineTo':'moveTo'](w/2+q[0]*MS,h/2+q[1]*MS));g.stroke();});});
// BMW Curved Display, OS 8 style. Logical canvas 1200x200: cluster 0..520, glass bridge 520..640, CID 640..1200
const DSP={fuel:.74,odo:0};
function drawDisp(v,steer){const g=dg,kmh=Math.abs(v)*3.6,gear=st.sel==='D'?'D'+(st.g+1):st.sel,rpm=st.rpm,MC=['#3fa8ff','#ff8a1e','#ff2a2a'][st.mode],night=tod==2;
 DSP.fuel=Math.max(.05,DSP.fuel-st.thr*kmh*2e-8);const range=Math.round(DSP.fuel*83/10.5*100);
 g.fillStyle='#000';g.fillRect(0,0,1200,200);
 // ---- cluster
 let gr=g.createRadialGradient(260,120,20,260,120,300);gr.addColorStop(0,'#0c1420');gr.addColorStop(1,'#010204');g.fillStyle=gr;g.fillRect(0,0,520,200);
 // hexagon-ish gauges: angled polyline tracks (OS8), speed left / rpm right (mirrored)
 const trk=(side,val)=>{const pts=side<0?[[150,182],[62,150],[40,100],[62,48],[150,18]]:[[370,182],[458,150],[480,100],[458,48],[370,18]];
  const segL=[];let tot=0;for(let i=0;i<4;i++){const d=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);segL.push(d);tot+=d;}
  g.lineJoin='round';g.lineCap='butt';g.lineWidth=7;g.strokeStyle='#18222e';g.beginPath();pts.forEach((q,i)=>g[i?'lineTo':'moveTo'](q[0],q[1]));g.stroke();
  let rem=Math.max(0,Math.min(1,val))*tot;g.strokeStyle=MC;g.shadowColor=MC;g.shadowBlur=night?10:4;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);
  for(let i=0;i<4&&rem>0;i++){const t=Math.min(1,rem/segL[i]);g.lineTo(pts[i][0]+(pts[i+1][0]-pts[i][0])*t,pts[i][1]+(pts[i+1][1]-pts[i][1])*t);rem-=segL[i];}g.stroke();g.shadowBlur=0;
  // ticks
  g.strokeStyle='#5a6a7c';g.lineWidth=2;for(let k=0;k<=8;k++){let r=k/8*tot,i=0;while(i<3&&r>segL[i]){r-=segL[i];i++;}const t=r/segL[i],x=pts[i][0]+(pts[i+1][0]-pts[i][0])*t,y=pts[i][1]+(pts[i+1][1]-pts[i][1])*t;g.beginPath();g.moveTo(x-side*6,y);g.lineTo(x-side*14,y);g.stroke();}};
 trk(-1,kmh/260);trk(1,rpm/7000);if(rpm>6000){g.fillStyle='rgba(255,40,30,.25)';g.fillRect(455,15,40,40);}
 g.textAlign='center';g.fillStyle='#fff';g.font='600 64px sans-serif';g.fillText(Math.round(kmh),150,118);g.font='15px sans-serif';g.fillStyle='#8ea0b4';g.fillText('км/ч',150,140);
 g.fillStyle='#fff';g.font='600 30px sans-serif';g.fillText((rpm/1000).toFixed(1),372,110);g.font='13px sans-serif';g.fillStyle='#8ea0b4';g.fillText('×1000 об/мин',372,130);
 // gear + mode
 g.fillStyle=st.sel==='R'?'#ff5a40':st.sel==='P'?'#fff':MC;g.font='bold 56px sans-serif';g.fillText(gear,260,118);
 const MN=['COMFORT','SPORT','SPORT+'][st.mode];g.fillStyle=MC;g.fillRect(222,132,76,20);g.fillStyle='#000';g.font='bold 13px sans-serif';g.fillText(MN,260,147);
 // top row: arrows, high beam, assist, clock, temp
 const bl=indOn;g.fillStyle='#2fe066';g.font='bold 28px sans-serif';if((st.ind<0||st.haz)&&bl)g.fillText('◀',196,34);if((st.ind>0||st.haz)&&bl)g.fillText('▶',324,34);
 if(st.haz&&bl){g.fillStyle='#ff3030';g.font='bold 20px sans-serif';g.fillText('⚠',260,32);}
 const hi=HB.hi;g.font='bold 16px sans-serif';g.fillStyle=hi?'#3a8bff':lights?'#2fe066':'#1a232e';g.fillText(hi?'≣D':'≣D',236,58);
 g.fillStyle=kmh>60?'#2fe066':'#5a6a7c';g.fillText('⫽',284,58);g.font='11px sans-serif';g.fillText(st.cruise?'ACC '+Math.round(st.cruise*3.6):'LKA',284,72);
 g.fillStyle='#c8d4e0';g.font='15px sans-serif';g.textAlign='left';g.fillText(new Date().toTimeString().slice(0,5),14,22);g.textAlign='right';g.fillText(['+14°C','+9°C','+6°C'][tod],506,22);
 // fuel / range
 g.textAlign='center';g.fillStyle='#1a232e';g.fillRect(205,176,110,5);g.fillStyle=DSP.fuel<.15?'#ffb020':'#c8d4e0';g.fillRect(205,176,110*DSP.fuel,5);g.font='12px sans-serif';g.fillText('⛽ '+range+' км',260,170);
 // status lamps / existing features
 g.font='bold 12px sans-serif';const bk=(performance.now()/120|0)%2;if(st.epb){g.fillStyle='#ff3030';g.fillText('(P)',196,194);}if(st.held){g.fillStyle='#2fe066';g.fillText('(A)',222,194);}
 if(st.abs&&bk||!st.absOn){g.fillStyle='#ffb020';g.fillText(st.absOn?'ABS':'ABS OFF',300,194);}if(!st.dscOn||((st.dsc||st.tc)&&bk)){g.fillStyle='#ffb020';g.fillText(st.dscOn?'DSC':'DSC OFF',336,194);}if(!st.tcOn){g.fillStyle='#ffb020';g.fillText('TC OFF',180,194);}
 if(window.__NAV&&__NAV.on){const n=__NAV.next;g.fillStyle='#3fa8ff';g.font='bold 22px sans-serif';g.textAlign='center';g.fillText(!n?'↑':n.dir<0?'⬅':'➡',430,110);g.font='13px sans-serif';g.fillStyle='#c8d4e0';g.fillText(n?(n.d<1000?Math.round(n.d/10)*10+' м':(n.d/1000).toFixed(1)+' км'):'',430,130);g.textAlign='center';}if(st.launch){g.fillStyle='#ff4030';g.font='bold 16px sans-serif';g.fillText('LAUNCH',260,88);}if(!st.road){g.fillStyle='#8ea0b4';g.font='12px sans-serif';g.fillText('грунт',372,150);}
 if(Math.abs(st.beta||0)>.09){g.fillStyle='#ffb020';g.font='bold 16px sans-serif';g.fillText('DRIFT '+Math.round(Math.abs(st.beta)*57.3)+'°',260,88);}
 if(st.pdc<2.5){g.fillStyle=st.pdc<.6?'#ff3030':st.pdc<1.4?'#ffb020':'#2fe066';g.fillRect(400,190,100*(1-st.pdc/2.5),5);}
 if(!st.on&&st.crank<=0){g.fillStyle='rgba(0,0,0,.8)';g.fillRect(0,0,520,200);g.fillStyle='#ff5a48';g.font='bold 26px sans-serif';g.fillText('START ENGINE ⏻',260,108);}
 // ---- CID: map + media tiles
 g.save();g.beginPath();g.rect(648,0,372,200);g.clip();g.translate(834,140);g.rotate(Math.PI+st.h);g.scale(1.5,1.5);g.drawImage(mapC,-mapC.width/2-st.x*MS,-mapC.height/2-st.z*MS);if(window.__NAV)__NAV.draw(g,MS);g.restore();
 g.fillStyle='#3fa8ff';g.beginPath();g.moveTo(834,126);g.lineTo(823,150);g.lineTo(834,144);g.lineTo(845,150);g.fill();
 g.fillStyle='rgba(4,8,14,.82)';g.fillRect(648,0,372,30);g.fillStyle='#fff';g.font='15px sans-serif';g.textAlign='left';g.fillText(window.__NAV&&(__NAV.on||__NAV.arrived>0)?__NAV.txt():'➤ '+(window.__ADR?__ADR.txt:'Лыткарино'),658,21);g.textAlign='right';g.fillStyle='#8ea0b4';g.fillText(Math.round(kmh)+' км/ч',1012,21);
 g.fillStyle='rgba(4,8,14,.82)';g.fillRect(648,170,372,30);g.fillStyle='#c8d4e0';g.textAlign='left';g.font='14px sans-serif';g.fillText('🏠  ⌂ Меню   ☏   ♫   ❄ 21.5°',658,190);
 const tile=(y,h,c,t1,t2)=>{g.fillStyle='#0d141d';g.fillRect(1028,y,166,h);g.fillStyle=c;g.fillRect(1028,y,4,h);g.fillStyle='#fff';g.textAlign='left';g.font='bold 14px sans-serif';g.fillText(t1,1040,y+22);g.fillStyle='#8ea0b4';g.font='12px sans-serif';g.fillText(t2,1040,y+40);};
 tile(6,58,'#3fa8ff','♫ Радио Лыткарино','101.7 FM  ▮▮ ▶▶');tile(70,58,'#2fe066','☏ Телефон','Избранное · 3');tile(134,60,MC,'⚙ My Modes',MN+' · '+(lights?'фары':'DRL'));
 { // progress bar on media tile
  g.fillStyle='#24303e';g.fillRect(1040,54,140,3);g.fillStyle='#3fa8ff';g.fillRect(1040,54,140*((performance.now()/60000)%1),3);}
 // glass bridge + reflection sheen
 g.fillStyle='#020304';g.fillRect(520,0,128,200);
 const sh=g.createLinearGradient(0,0,1200,200);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(.38,'rgba(255,255,255,0)');sh.addColorStop(.45,night?'rgba(255,255,255,.025)':'rgba(255,255,255,.07)');sh.addColorStop(.52,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sh;g.fillRect(0,0,1200,200);
 g.fillStyle=night?'rgba(255,255,255,.015)':'rgba(255,255,255,.04)';g.fillRect(0,0,1200,10);
 dispT.needsUpdate=true;}
PT('spawn');// ---------- spawn ----------
let best=null,bl=1e9;major.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),D=Math.hypot(a[0],a[1]);if(L>60&&D<bl){bl=D;best=[a,b];}}});
const h0=Math.atan2(best[1][0]-best[0][0],best[1][1]-best[0][1]),off=1.6;
const DEMO0=demo||Q.includes('on');const st={x:best[0][0]+Math.sin(h0)*8-Math.cos(h0)*off,z:best[0][1]+Math.cos(h0)*8+Math.sin(h0)*off,h:h0,vx:0,vz:0,r:0,v:0,vl:0,steer:0,thr:0,brk:0,g:0,rpm:800,rev:false,shift:0,along:0,alat:0,road:true,hb:0,sel:'D',mode:1,abs:0,tc:0,dsc:0,absOn:true,dscOn:true,tcOn:true,on:DEMO0,crank:0,ind:0,haz:false,cruise:0,hud:false,autohold:true,held:false,epb:false,launch:0,pdc:9};
const start=JSON.parse(JSON.stringify(st));
// road lookup grid (for grip)
const RG={};drive.concat(C.r.filter(r=>r.w>=3&&r.w<4)).forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1];const seg=[a,b,r.w/2+.8];const xs=[a[0],b[0]],zs=[a[1],b[1]];
 for(let gx=Math.floor((Math.min(...xs)-8)/20);gx<=Math.floor((Math.max(...xs)+8)/20);gx++)for(let gz=Math.floor((Math.min(...zs)-8)/20);gz<=Math.floor((Math.max(...zs)+8)/20);gz++)(RG[gx+','+gz]=RG[gx+','+gz]||[]).push(seg);}});
// per-surface physics: [grip dry, grip wet, rolling-resistance factor, soft-ground drag factor, bump amplitude m] for asphalt, plitka, gravel, dirt, grass
const SURF=[[1,.75,0,0,0],[.9,.65,.08,.1,.012],[.7,.6,.45,.35,.03],[.65,.4,.7,.6,.035],[.55,.35,1,1,.025]];const SURFN=['asphalt','plitka','gravel','dirt','grass'];window.__SURF=SURF;
function segD(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],L=dx*dx+dz*dz||1;let t=((x-a[0])*dx+(z-a[1])*dz)/L;t=Math.max(0,Math.min(1,t));const px=a[0]+dx*t,pz=a[1]+dz*t;return[Math.hypot(x-px,z-pz),px,pz];}
function onRoad(x,z){const l=RG[Math.floor(x/20)+','+Math.floor(z/20)];return !!l&&l.some(s=>segD(x,z,s[0],s[1])[0]<s[2]);}
function wallN(x,z){const l=Gd[Math.floor(x/CS)+','+Math.floor(z/CS)]||[];let bd=1e9,n=null;l.forEach(p=>{for(let i=0;i<p.length;i++){const d=segD(x,z,p[i],p[(i+1)%p.length]);if(d[0]<bd){bd=d[0];n=[x-d[1],z-d[2]];}}});
 if(!n)return null;const L=Math.hypot(n[0],n[1])||1;n=[n[0]/L,n[1]/L];return hit(x,z)?[-n[0],-n[1]]:n;}

// ---------- COL: full collisions (trees, posts, fences/walls/guardrails, bus shelters) on top of building/parked-car polygons ----------
// spatial hash (8 m cells); car = OBB 1.95 x 4.9; impulse response with yaw; thin trees / posts break above ~30-40 km/h
const COLX={C:8,G:{},S:{},tN:-1,shk:0,fall:[],brkN:0,log:[]};window.__COL=COLX;{
 const TR={birch:.13,rowan:.08,spruce:.17,pine:.16,linden:.21,poplar:.24,maple:.19,popcut:.23,bush:0};
 const key=(x,z)=>Math.floor(x/COLX.C)+','+Math.floor(z/COLX.C);
 const sput=(a,b,th,o)=>{const x0=Math.min(a[0],b[0])-th,x1=Math.max(a[0],b[0])+th,z0=Math.min(a[1],b[1])-th,z1=Math.max(a[1],b[1])+th;for(let gx=Math.floor(x0/COLX.C);gx<=Math.floor(x1/COLX.C);gx++)for(let gz=Math.floor(z0/COLX.C);gz<=Math.floor(z1/COLX.C);gz++)(COLX.S[gx+','+gz]=COLX.S[gx+','+gz]||[]).push(o||{a,b,th});};
 const F2=window.FURN||{};const lines=(L,th)=>(L||[]).forEach(p=>{for(let i=0;i<p.length-1;i++)sput(p[i],p[i+1],th);});
 lines(F2.fe,.12);lines(F2.wl,.2);lines(F2.gr,.15);
 // bus shelters ~4 x 1.6 m boxes behind the kerb
 (typeof BSP!='undefined'?BSP:[]).forEach(b=>{const ux=b[6],uz=b[7];if(ux===undefined)return;const nx=Math.sin(b[2]),nz=Math.cos(b[2]);const cx=b[0]-nx*.8,cz=b[1]-nz*.8;const P=[[2,.8],[-2,.8],[-2,-.8],[2,-.8]].map(([a,d])=>[cx+ux*a+nx*d,cz+uz*a+nz*d]);for(let i=0;i<4;i++)sput(P[i],P[(i+1)%4],.06);});
 // posts: traffic-light poles (solid); sign poles register through COLX.addPost (breakable)
 COLX.P={};COLX.addPost=(x,z,r,thr,obj)=>{const o={x,z,r,thr,obj,post:1};(COLX.P[key(x,z)]=COLX.P[key(x,z)]||[]).push(o);return o;};
 (window.__LPOST||[]).forEach(q=>COLX.addPost(q[0],q[1],.12,99,null));(window.__SGN?__SGN.L:[]).forEach((q,i)=>COLX.addPost(q.x,q.z,.06,6.9,(dx,dz,v)=>__SGN.knock(i,dx,dz,v)));
 // tree hash rebuilt when streaming changes TREECH
 COLX.trees=()=>{if(COLX.tN===TREECH.length)return;COLX.tN=TREECH.length;const G={};TREECH.forEach(g=>{const u=g.userData;if(!u.L||!u.MS||!(u.k in TR))return;const br=u.brk;
  for(let i=0;i<u.L.length;i++){if(br&&br.has(i))continue;const t=u.L[i];const sx=Math.hypot(u.MS[i*16],u.MS[i*16+1],u.MS[i*16+2]);const r=TR[u.k]*Math.max(.5,Math.min(2.2,sx));
   (G[key(t[0],t[1])]=G[key(t[0],t[1])]||[]).push({x:t[0],z:t[1],r:u.k=='bush'?1.1:r,bush:u.k=='bush',g,i,thin:u.k!='bush'&&(r<.15||u.k=='rowan')&&r<.2});}});COLX.G=G;};
}
// hide a tree instance everywhere (far crowns, impostor range, near detailed) and spawn a falling rigid copy
COLX.breakTree=(o,dx,dz,v)=>{const g=o.g,u=g.userData;(u.brk=u.brk||new Set()).add(o.i);(u.hid=u.hid||new Set()).add(o.i);g.children.forEach(m=>{if(m.setMatrixAt){m.setMatrixAt(o.i,_z4);m.instanceMatrix.needsUpdate=true;}});if(u.ipr&&u.ipr.on){IMP.set(g,false);IMP.set(g,true);}NEAR.f=0;
 const M=new THREE.Matrix4().fromArray(u.MS,o.i*16);let grp=new THREE.Group();try{let sp=NEAR.map[u.k];const h=((o.i*2654435761)^(u.k.length*97))>>>0;if(Array.isArray(sp))sp=sp[h%sp.length];const V=NEAR.sp[sp][(h>>>4)%NEAR.sp[sp].length];grp.add(new THREE.Mesh(V.b,V.bm));if(V.l)grp.add(new THREE.Mesh(V.l,V.lm));}catch(e){grp.add(new THREE.Mesh(new THREE.CylinderGeometry(o.r,o.r*1.2,6,6).translate(0,3,0),new THREE.MeshLambertMaterial({color:0x6b5a48})));}
 const piv=new THREE.Group();piv.position.set(o.x,0,o.z);const inner=new THREE.Group();const ps=new THREE.Vector3(),pq=new THREE.Quaternion(),pc=new THREE.Vector3();M.decompose(ps,pq,pc);inner.quaternion.copy(pq);inner.scale.copy(pc);inner.add(grp);piv.add(inner);S.add(piv);grp.children.forEach(m=>m.castShadow=true);
 const L=Math.hypot(dx,dz)||1;COLX.fall.push({piv,ax:new THREE.Vector3(dz/L,0,-dx/L),a:0,w:Math.min(1.5,v*.08),t:0});if(COLX.fall.length>14){const f=COLX.fall.shift();S.remove(f.piv);}
 if(window.__WPT&&WPT.burst)WPT.burst(o.x,2.5,o.z,40,[.25,.45,.15]);COLX.tN=-1;COLX.brkN++;sfx('crack',Math.min(1,v/15));};
COLX.tick=dt=>{window.__st=st;COLX.fall.forEach(f=>{if(f.a<1.5){f.w+=dt*(1.2+Math.sin(f.a)*9.8/3);f.a=Math.min(1.5,f.a+f.w*dt);if(f.a>=1.5&&!f.bounced){f.bounced=1;}}f.piv.setRotationFromAxisAngle(f.ax,f.a);});COLX.shk=Math.max(0,COLX.shk-dt*2.5);};
// OBB (car) vs obstacles: push out + impulse (restitution .25, tangential friction), crash sound + camera shake
COLX.resolve=dt=>{if(DYNO)return;COLX.trees();const s2=Math.sin(st.h),c2=Math.cos(st.h),HX=.97,HZ=2.45,m=2300,I=5340;
 const rx=[c2,-s2],fz=[s2,c2];const cand=[];const k0x=Math.floor((st.x-4)/COLX.C),k1x=Math.floor((st.x+4)/COLX.C),k0z=Math.floor((st.z-4)/COLX.C),k1z=Math.floor((st.z+4)/COLX.C);
 for(let gx=k0x;gx<=k1x;gx++)for(let gz=k0z;gz<=k1z;gz++){const k=gx+','+gz;(COLX.G[k]||[]).forEach(o=>cand.push(o));(COLX.P[k]||[]).forEach(o=>{if(!o.down)cand.push(o);});(COLX.S[k]||[]).forEach(o=>{const q=segD(st.x,st.z,o.a,o.b);cand.push({x:q[1],z:q[2],r:o.th,seg:1});});}
 const seen=new Set();let bushN=0;
 cand.forEach(o=>{if(seen.has(o))return;seen.add(o);const dx=o.x-st.x,dz=o.z-st.z;if(dx*dx+dz*dz>16)return;const lx=dx*rx[0]+dz*rx[1],lz=dx*fz[0]+dz*fz[1];
  const qx=Math.max(-HX,Math.min(HX,lx)),qz=Math.max(-HZ,Math.min(HZ,lz));let ex=lx-qx,ez=lz-qz,d=Math.hypot(ex,ez),nlx,nlz,pen;
  if(d<1e-6){const px=HX-Math.abs(lx),pz=HZ-Math.abs(lz);if(px<pz){nlx=Math.sign(lx)||1;nlz=0;pen=px+o.r;}else{nlx=0;nlz=Math.sign(lz)||1;pen=pz+o.r;}}else{if(d>=o.r)return;nlx=ex/d;nlz=ez/d;pen=o.r-d;}
  if(o.bush){bushN++;return;}
  // normal from obstacle to car (world)
  const nx=-(nlx*rx[0]+nlz*fz[0]),nz=-(nlx*rx[1]+nlz*fz[1]);const cxw=qx*rx[0]+qz*fz[0],czw=qx*rx[1]+qz*fz[1];
  const vpx=st.vx+st.r*czw,vpz=st.vz-st.r*cxw,vn=vpx*nx+vpz*nz;
  if((o.thin||o.post)&&-vn>(o.thr!==undefined?o.thr:(8.3+((o.i||0)%7)*.4))){// break: absorb energy, keep going
   const Eabs=o.post?9000:o.r*o.r*1.6e6+8000,E=.5*m*(st.vx*st.vx+st.vz*st.vz),k=Math.sqrt(Math.max(.2,1-Eabs/Math.max(E,1)));st.vx*=k;st.vz*=k;COLX.shk=Math.min(1,COLX.shk+.35);
   if(o.post){o.down=1;o.obj&&o.obj(-nx,-nz,-vn);sfx('metal',Math.min(1,-vn/15));}else COLX.breakTree(o,-nx,-nz,-vn);COLX.log.push(['break',o.post?'post':'tree',+(-vn*3.6).toFixed(0)]);return;}
  st.x+=nx*pen;st.z+=nz*pen;
  if(vn<0){const rn=czw*nx-cxw*nz;const j=-(1.25)*vn/(1/m+rn*rn/I);st.vx+=j*nx/m;st.vz+=j*nz/m;st.r+=j*rn/I*.6;
   const tx=-nz,tz=nx,vt=vpx*tx+vpz*tz,jt=Math.max(-Math.abs(j)*.3,Math.min(Math.abs(j)*.3,-vt*m*.5));st.vx+=jt*tx/m;st.vz+=jt*tz/m;
   if(-vn>1.5){COLX.shk=Math.min(1,COLX.shk+(-vn)/20);sfx('crash',Math.min(1,-vn/20));COLX.log.push(['hit',o.seg?'wall':o.post?'post':'tree',+(-vn*3.6).toFixed(0)]);}}});
 if(bushN){const k=Math.max(0,1-dt*1.2*bushN);st.vx*=k;st.vz*=k;if(Math.abs(st.v)>3&&Math.random()<.2&&window.__WPT&&WPT.burst)WPT.burst(st.x,1,st.z,3,[.25,.4,.15]);}};
// building / parked-car crash sound + shake (they keep the old polygon solver)
function sfx(type,v){if(!AU||v<.05)return;const A=AU;if(type=='crash'){A.burst(120,.7,.45,.9*v);A.burst(900,1.2,.25,.5*v);A.burst(3200,2,.15,.25*v);}else if(type=='crack'){for(let i=0;i<5;i++)setTimeout(()=>A.burst(1500+Math.random()*2500,4,.06,.5*v),i*35);A.burst(200,1,.5,.6*v);}else if(type=='metal'){A.burst(650,12,.6,.4*v);A.burst(1900,14,.4,.25*v);}}
// ---------- input ----------
const K={};addEventListener('keydown',e=>{K[e.code]=1;if(e.code=='Backspace')Object.assign(st,JSON.parse(JSON.stringify(start)));if(e.code=='Space')e.preventDefault();audioInit();});addEventListener('keyup',e=>K[e.code]=0);
const CA=(+(/ca=(-?\d+)/.exec(Q)||[0,0])[1])*Math.PI/180;const TST=(/tst=(\w+)/.exec(Q)||[])[1];const AID=!/aid=0/.test(Q);let tT0=0,tT=0,tPh=0,tX0=0,tZ0=0,tH0=0,tLog=0,tMax=0,tSpin=0,tSpinN=0,tLockN=0,tAbsN=0;const DRIFT=Q.includes('drift'),HBT=Q.includes('hbt');let dT=0;const T={steer:0,gas:0,brk:0,hb:0};{const m=/at=(-?\d+),(-?\d+)(?:,(-?[\d.]+))?/.exec(Q);if(m){st.x=+m[1];st.z=+m[2];if(m[3]!==undefined)st.h=+m[3]*Math.PI/180;}}let swAng=0,swHeld=false;
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
  const upd=t=>{const r=el.getBoundingClientRect();const y=1-(t.clientY-r.top)/r.height;const v=k==='brk'?Math.min(1,.7+y*.6):Math.max(.35,Math.min(1,y+.15));T[k]=v;bar.style.height=(v*100)+'%';};
  el.addEventListener('touchstart',e=>{e.preventDefault();audioInit();const t=e.changedTouches[0];pid=t.identifier;upd(t);},{passive:false});
  el.addEventListener('touchmove',e=>{e.preventDefault();const t=find(e,pid);if(t)upd(t);},{passive:false});
  const end=e=>{if(find(e,pid)){pid=null;T[k]=0;bar.style.height='0';}};el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);});
 const hbE=document.getElementById('hb');const relAll=()=>{T.hb=0;T.gas=0;T.brk=0;hbE.style.background='';for(const k in K)K[k]=false;};addEventListener('blur',relAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)relAll();});
 addEventListener('touchend',e=>{const on=id=>[...e.touches].some(t=>{const el=document.getElementById(id);return el&&el.contains(t.target);});if(!on('hb')){T.hb=0;hbE.style.background='';}if(!on('gasP'))T.gas=0;if(!on('brkP'))T.brk=0;},true);addEventListener('touchcancel',e=>{if(!e.touches.length){T.hb=0;T.gas=0;T.brk=0;hbE.style.background='';}},true);hbE.addEventListener('touchstart',e=>{e.preventDefault();T.hb=1;hbE.style.background='#c33';},{passive:false});const hbEnd=()=>{T.hb=0;hbE.style.background='';};hbE.addEventListener('touchend',hbEnd);hbE.addEventListener('touchcancel',hbEnd);
 {const lv=document.getElementById('lever'),k=document.getElementById('lvk'),pb=document.getElementById('lvp');let lid=null,y0=0,done=false;
  const move=gearMove;
  lv.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];const r=pb.getBoundingClientRect();if(t.clientY<r.bottom+4&&t.clientY>r.top-6){setGear('P');return;}lid=t.identifier;y0=t.clientY;done=false;},{passive:false});
  lv.addEventListener('touchmove',e=>{e.preventDefault();const t=find(e,lid);if(!t)return;const dy=Math.max(-22,Math.min(22,t.clientY-y0));k.setAttribute('transform','translate(0,'+dy*.6+')');if(!done&&Math.abs(dy)>=20){done=true;move(dy<0?-1:1);}},{passive:false});
  const le=e=>{if(find(e,lid)){lid=null;k.setAttribute('transform','');}};lv.addEventListener('touchend',le);lv.addEventListener('touchcancel',le);}
}
updGsel();{const m=/swa=(-?\d+)/.exec(Q);if(m){swAng=+m[1];swHeld=true;}}
function swTick(dt){if(!swHeld)swAng*=Math.exp(-dt*5);if(Math.abs(swAng)<.3&&!swHeld)swAng=0;T.steer=swAng/450;if(window.__swg)window.__swg.setAttribute('transform','rotate('+swAng.toFixed(1)+')');}
// ---------- wheel particles: dust puffs + dirt clods (sprite atlas), grass clippings, instanced low-poly gravel stones that bounce & settle, water spray in rain ----------
// emission = speed x (1 + slip) x surface; pooled; counts scaled by preset; procedural textures
const WPT={};window.__WPT=WPT;{const K=(mobile?.35:{low:.4,medium:.7,high:1,ultra:1.5}[GSET.preset]||.7);
 // 4x1 sprite atlas: 0 soft dust puff, 1 dirt clod, 2 grass blade, 3 water droplet
 const ac=document.createElement('canvas');ac.width=256;ac.height=64;const g=ac.getContext('2d');
 {let r=g.createRadialGradient(32,32,2,32,32,30);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(.5,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);
  g.fillStyle='#fff';g.beginPath();for(let k=0;k<9;k++){const a=k/9*6.283,rr=14+Math.random()*10;g.lineTo(96+Math.cos(a)*rr,32+Math.sin(a)*rr);}g.fill();
  g.strokeStyle='#fff';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(140,58);g.quadraticCurveTo(160,30,176,6);g.stroke();
  r=g.createRadialGradient(224,32,1,224,32,20);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(192,0,64,64);}
 const at=new THREE.CanvasTexture(ac);
 const N=Math.round(700*K),pos=new Float32Array(N*3).fill(-999),col=new Float32Array(N*4),sz=new Float32Array(N),tl=new Float32Array(N),V=new Float32Array(N*3),Lf=new Float32Array(N),L0=new Float32Array(N),G=new Float32Array(N),S0=new Float32Array(N),GR=new Float32Array(N);let k=0;
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('aCol',new THREE.BufferAttribute(col,4));geo.setAttribute('aSz',new THREE.BufferAttribute(sz,1));geo.setAttribute('aTl',new THREE.BufferAttribute(tl,1));
 const mat=new THREE.ShaderMaterial({uniforms:{uT:{value:at},uS:{value:innerHeight*.9}},transparent:true,depthWrite:false,
  vertexShader:'attribute vec4 aCol;attribute float aSz,aTl;varying vec4 vC;varying float vT;uniform float uS;void main(){vC=aCol;vT=aTl;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=aSz*uS/max(.5,-mv.z);}',
  fragmentShader:'uniform sampler2D uT;varying vec4 vC;varying float vT;void main(){vec2 uv=vec2((vT+gl_PointCoord.x)*.25,1.-gl_PointCoord.y);vec4 t=texture2D(uT,uv);float a=t.a*vC.a;if(a<.02)discard;gl_FragColor=vec4(vC.rgb*t.rgb,a);}'});
 const pts=new THREE.Points(geo,mat);pts.frustumCulled=false;pts.renderOrder=3;S.add(pts);
 const emit=(x,y,z,vx,vy,vz,life,size,grow,t,c,a,grav)=>{const i=k++%N;pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;V[i*3]=vx;V[i*3+1]=vy;V[i*3+2]=vz;Lf[i]=L0[i]=life;S0[i]=size;GR[i]=grow;tl[i]=t;col[i*4]=c[0];col[i*4+1]=c[1];col[i*4+2]=c[2];col[i*4+3]=a;G[i]=grav;};
 // gravel: instanced low-poly stones
 const NS=Math.round(160*K),sg=new THREE.IcosahedronGeometry(.028,0),sm=new THREE.InstancedMesh(sg,new THREE.MeshLambertMaterial({color:0x8d8a84}),Math.max(1,NS));sm.frustumCulled=false;const Z=new THREE.Matrix4().makeScale(0,0,0);for(let q=0;q<NS;q++)sm.setMatrixAt(q,Z);S.add(sm);
 const SP=new Float32Array(NS*3),SV=new Float32Array(NS*3),SL=new Float32Array(NS),SR=new Float32Array(NS*2);let sk=0;const M=new THREE.Matrix4(),Qq=new THREE.Quaternion(),E=new THREE.Euler(),Vs=new THREE.Vector3(),Vp=new THREE.Vector3();
 const C={dust3:[.62,.52,.4],clod3:[.33,.25,.17],mud:[.2,.15,.1],dust2:[.66,.64,.6],grass:[.32,.5,.18],cut:[.45,.58,.25],spray:[.85,.9,.95]};const jit=(c,j)=>c.map(v=>v*(1-j+Math.random()*j*2));
 let acc={};const rate=(key,r,dt)=>{acc[key]=(acc[key]||0)+r*dt;const n=acc[key]|0;acc[key]-=n;return Math.min(n,12);};
 WPT.tick=dt=>{const sp=Math.abs(st.v),sf=st.sf|0,sl=Math.min(1,(st.slip||0)+(st.spin||0)),wet=typeof WX!='undefined'&&WX.w>0,s2=Math.sin(st.h),c2=Math.cos(st.h),dir=st.v>=0?1:-1;
  if(sp>1.5&&!DYNO){const base=sp*(1+sl*6)*K;
   [[-1.5,.82],[-1.5,-.82],[1.47,.82],[1.47,-.82]].forEach(([f,lat],wi)=>{const rear=f<0;const x=st.x+s2*f+c2*lat,z=st.z+c2*f-s2*lat;const bx=-s2*dir,bz=-c2*dir;const R=(a)=>(Math.random()-.5)*a;
    if(rear||sl>.3){
     if(sf==3){if(!wet){for(let q=rate('d'+wi,base*.9,dt);q--;)emit(x,.15,z,bx*sp*.15+R(1),.4+Math.random()*.8,bz*sp*.15+R(1),1.6+Math.random(),.5,1.4,0,jit(C.dust3,.1),.35,-.3);}
      for(let q=rate('c'+wi,base*(wet?.8:.35),dt);q--;)emit(x,.12,z,bx*sp*.3+R(2),1+Math.random()*2.5,bz*sp*.3+R(2),.9,.07+Math.random()*.06,0,1,jit(wet?C.mud:C.clod3,.15),1,9.8);}
     if(sf==4){for(let q=rate('g'+wi,base*.6,dt);q--;)emit(x,.1,z,bx*sp*.25+R(1.6),.8+Math.random()*2,bz*sp*.25+R(1.6),1.2,.09,0,2,jit(Math.random()<.5?C.grass:C.cut,.15),1,5);
      if(!wet&&sl>.2)for(let q=rate('gd'+wi,base*.2,dt);q--;)emit(x,.15,z,R(1),.5,R(1),1.2,.4,1,0,C.dust3,.18,-.2);}
     if(sf==2){for(let q=rate('s'+wi,base*.5,dt);q--;){const i=sk++%NS;SP[i*3]=x;SP[i*3+1]=.06;SP[i*3+2]=z;SV[i*3]=bx*sp*.25+R(2);SV[i*3+1]=1+Math.random()*2.2;SV[i*3+2]=bz*sp*.25+R(2);SL[i]=1.2+Math.random()*.8;SR[i*2]=Math.random()*6;SR[i*2+1]=Math.random()*6;}
      if(!wet)for(let q=rate('sd'+wi,base*.35,dt);q--;)emit(x,.12,z,bx*sp*.1+R(1),.4,bz*sp*.1+R(1),1.3,.45,1.2,0,jit(C.dust2,.08),.25,-.2);}}
    if(wet&&sp>6)for(let q=rate('w'+wi,sp*K*(sf<=1?1.2:.6),dt);q--;)emit(x,.08,z,bx*sp*.2+R(1.5),.6+Math.random()*1.4,bz*sp*.2+R(1.5),.55,.12,1.6,3,C.spray,.45,6);});}
  for(let i=0;i<N;i++){if(Lf[i]<=0)continue;Lf[i]-=dt;if(Lf[i]<=0){pos[i*3+1]=-999;sz[i]=0;continue;}const f=Lf[i]/L0[i];V[i*3+1]-=G[i]*dt;if(G[i]<0){V[i*3]*=1-dt*1.5;V[i*3+2]*=1-dt*1.5;}
   pos[i*3]+=V[i*3]*dt;pos[i*3+1]+=V[i*3+1]*dt;pos[i*3+2]+=V[i*3+2]*dt;if(pos[i*3+1]<.02){pos[i*3+1]=.02;V[i*3+1]*=-.2;V[i*3]*=.5;V[i*3+2]*=.5;}sz[i]=S0[i]*(1+GR[i]*(1-f));col[i*4+3]=Math.min(col[i*4+3],tl[i]==0?.35*f:f);}
  geo.attributes.position.needsUpdate=geo.attributes.aCol.needsUpdate=geo.attributes.aSz.needsUpdate=geo.attributes.aTl.needsUpdate=true;
  let ch=false;for(let i=0;i<NS;i++){if(SL[i]<=0)continue;SL[i]-=dt;ch=true;if(SL[i]<=0){sm.setMatrixAt(i,Z);continue;}SV[i*3+1]-=9.8*dt;SP[i*3]+=SV[i*3]*dt;SP[i*3+1]+=SV[i*3+1]*dt;SP[i*3+2]+=SV[i*3+2]*dt;
   if(SP[i*3+1]<.02){SP[i*3+1]=.02;SV[i*3+1]=Math.abs(SV[i*3+1])>.6?-SV[i*3+1]*.35:0;SV[i*3]*=.55;SV[i*3+2]*=.55;}if(SV[i*3+1]!==0)SR[i*2]+=dt*9;
   E.set(SR[i*2],SR[i*2+1],0);Qq.setFromEuler(E);Vp.set(SP[i*3],SP[i*3+1],SP[i*3+2]);const s3=.7+((i*37)%10)/15;Vs.set(s3,s3*.8,s3);M.compose(Vp,Qq,Vs);sm.setMatrixAt(i,M);}if(ch)sm.instanceMatrix.needsUpdate=true;};
 WPT.burst=(x,y,z,n,cc)=>{for(let q=0;q<n*K+1;q++)emit(x+(Math.random()-.5)*2,y+Math.random()*2,z+(Math.random()-.5)*2,(Math.random()-.5)*4,Math.random()*2,(Math.random()-.5)*4,1.5+Math.random(),.1,0,2,jit(cc,.3),1,2.5);};
 addEventListener('resize',()=>{mat.uniforms.uS.value=innerHeight*.9;});}
// ---------- exhaust smoke from the four M60i tips: thicker when cold/idle and in rain, puffs on throttle blips; pooled, chase view only ----------
const EXH={};window.__EXH=EXH;{const N=({low:80,medium:150,high:260,ultra:420}[GSET.preset]||150)*(mobile?.6:1)|0;const pos=new Float32Array(N*3).fill(-999),al=new Float32Array(N),sz=new Float32Array(N),V=new Float32Array(N*3),Lf=new Float32Array(N),L0=new Float32Array(N);let k=0;
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');for(let i=0;i<14;i++){const x=20+Math.random()*24,y=20+Math.random()*24,r=g.createRadialGradient(x,y,1,x,y,18);r.addColorStop(0,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('aA',new THREE.BufferAttribute(al,1));geo.setAttribute('aS',new THREE.BufferAttribute(sz,1));
 const mat=new THREE.ShaderMaterial({uniforms:{uT:{value:new THREE.CanvasTexture(c)},uS:{value:innerHeight*.9},uC:{value:new THREE.Color(.82,.83,.85)}},transparent:true,depthWrite:false,
  vertexShader:'attribute float aA,aS;varying float vA;uniform float uS;void main(){vA=aA;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=aS*uS/max(.3,-mv.z);}',
  fragmentShader:'uniform sampler2D uT;uniform vec3 uC;varying float vA;void main(){vec4 t=texture2D(uT,gl_PointCoord);float a=t.a*vA;if(a<.01)discard;gl_FragColor=vec4(uC,a);}'});
 const pts=new THREE.Points(geo,mat);pts.frustumCulled=false;pts.renderOrder=3;S.add(pts);const TIPS=[[-.62,.33,-2.5],[-.46,.33,-2.5],[.46,.33,-2.5],[.62,.33,-2.5]];const V3=new THREE.Vector3();let acc=0,lastT=0,onT=0;
 EXH.tick=dt=>{pts.visible=chase;if(!st.on){onT=0;}else onT+=dt;const cold=Math.max(0,1-onT/150),wet=typeof WX!='undefined'&&WX.w>0;const sp=Math.abs(st.v);
  if(st.on&&chase&&!DYNO){let rate=(2+st.thr*10+(st.rpm||800)/1200)*(1+2.5*cold)*(wet?1.6:1)*(sp>15?.4:1);if(st.thr-lastT>.25)acc+=6;acc+=rate*dt;
   while(acc>=1){acc-=1;const tp=TIPS[(Math.random()*4)|0];V3.set(tp[0],tp[1],tp[2]);car.localToWorld(V3);const i=k++%N;pos[i*3]=V3.x;pos[i*3+1]=V3.y;pos[i*3+2]=V3.z;const s2=Math.sin(st.h),c2=Math.cos(st.h),ex=1.2+st.thr*2;
    V[i*3]=st.vx*.6-s2*ex+(Math.random()-.5)*.3;V[i*3+1]=.15+Math.random()*.2;V[i*3+2]=st.vz*.6-c2*ex+(Math.random()-.5)*.3;L0[i]=Lf[i]=(1.2+cold*1.5+(wet?.8:0))*(.7+Math.random()*.6);sz[i]=.08;al[i]=.0;}}
  lastT=st.thr;const dens=(.16+.3*cold)*(wet?1.4:1);
  for(let i=0;i<N;i++){if(Lf[i]<=0)continue;Lf[i]-=dt;if(Lf[i]<=0){pos[i*3+1]=-999;al[i]=0;continue;}const f=Lf[i]/L0[i];V[i*3]*=1-dt*2.2;V[i*3+2]*=1-dt*2.2;V[i*3+1]+=dt*.15;pos[i*3]+=V[i*3]*dt;pos[i*3+1]+=V[i*3+1]*dt;pos[i*3+2]+=V[i*3+2]*dt;sz[i]=.12+(1-f)*1.3;al[i]=dens*f*Math.min(1,(1-f)*8);}
  geo.attributes.position.needsUpdate=geo.attributes.aA.needsUpdate=geo.attributes.aS.needsUpdate=true;mat.uniforms.uC.value.setScalar(tod==2?.35:.82);};}
// ---------- engine sound (WebAudio) ----------
let AU=null;function audioInit(){if(AU||demo)return;try{const ac=new (window.AudioContext||window.webkitAudioContext)();const out=ac.createGain();out.gain.value=.9;const cab=ac.createBiquadFilter();cab.type='lowpass';cab.frequency.value=2600;cab.Q.value=.5;cab.connect(out);out.connect(ac.destination);
 // synth sub layer (V8 burble)
 const o1=ac.createOscillator(),o2=ac.createOscillator(),o3=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o1.type='sawtooth';o2.type='square';o3.type='triangle';f.type='lowpass';f.Q.value=4;g.gain.value=0;[o1,o2,o3].forEach(o=>{o.connect(f);o.start();});f.connect(g);g.connect(cab);
 const nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;const ns=ac.createBufferSource();ns.buffer=nb;ns.loop=true;const nf=ac.createBiquadFilter();nf.type='bandpass';nf.frequency.value=900;nf.Q.value=.8;const ng=ac.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(out);ns.start();
 // sampled RPM loops (CC0, Ziph / OpenGameArt): crossfade by rpm, pitch-shift, on/off-load split
 const bus=ac.createGain(),onG=ac.createGain(),offF=ac.createBiquadFilter(),offG=ac.createGain();offF.type='lowpass';offF.frequency.value=650;bus.connect(onG);onG.connect(cab);bus.connect(offF);offF.connect(offG);offG.connect(cab);onG.gain.value=0;offG.gain.value=0;
 const LP=[['idle',690],['low',1390],['mid',1960],['high',3590]].map(([n,b])=>{const gg=ac.createGain();gg.gain.value=0;gg.connect(bus);const L={b,g:gg,src:null};fetch('snd/eng_'+n+'.wav').then(r=>r.arrayBuffer()).then(x=>ac.decodeAudioData(x)).then(buf=>{const sr=ac.createBufferSource();sr.buffer=buf;sr.loop=true;sr.connect(gg);sr.start(0,Math.random()*3);L.src=sr;}).catch(()=>{});return L;});
 // turbo whistle + blow-off/pops (noise bursts)
 const tw=ac.createOscillator();tw.type='sine';const twG=ac.createGain();twG.gain.value=0;tw.connect(twG);twG.connect(cab);tw.start();
 const burst=(fq,q,dur,vol)=>{const s2=ac.createBufferSource();s2.buffer=nb;const bf=ac.createBiquadFilter();bf.type='bandpass';bf.frequency.value=fq;bf.Q.value=q;const bg=ac.createGain();const t=ac.currentTime;bg.gain.setValueAtTime(vol,t);bg.gain.exponentialRampToValueAtTime(.001,t+dur);s2.connect(bf);bf.connect(bg);bg.connect(cab);s2.start(t,Math.random()*.5,dur+.05);};
 // tyre/road layers (self-synthesised from filtered noise): asphalt roll, gravel crunch (granular clicks), grass swish, squeal (resonant band), wind
 const lay=(type,fq,q)=>{const s2=ac.createBufferSource();s2.buffer=nb;s2.loop=true;const bf=ac.createBiquadFilter();bf.type=type;bf.frequency.value=fq;bf.Q.value=q;const gg=ac.createGain();gg.gain.value=0;s2.connect(bf);bf.connect(gg);gg.connect(cab);s2.start(0,Math.random());return{f:bf,g:gg};};
 const tyR=lay('lowpass',380,.7),tyG=lay('bandpass',2600,.9),tyS=lay('highpass',3500,.5),sq=lay('bandpass',1150,9),wn=lay('bandpass',500,.4);
 const sqO=ac.createOscillator();sqO.type='triangle';sqO.frequency.value=1150;const sqG=ac.createGain();sqG.gain.value=0;sqO.connect(sqG);sqG.connect(cab);sqO.start();
 const crunch=v=>{const s2=ac.createBufferSource();s2.buffer=nb;const bf=ac.createBiquadFilter();bf.type='bandpass';bf.frequency.value=1500+Math.random()*3000;bf.Q.value=3;const bg=ac.createGain();const t=ac.currentTime;bg.gain.setValueAtTime(v,t);bg.gain.exponentialRampToValueAtTime(.001,t+.03);s2.connect(bf);bf.connect(bg);bg.connect(cab);s2.start(t,Math.random(),.05);};
 AU={ac,o1,o2,o3,f,g,ng,LP,onG,offG,offF,cab,tw,twG,burst,boost:0,lastThr:0,popT:0,tyR,tyG,tyS,sq,sqO,sqG,wn,crunch,bus,lastG:0,cut:0};}catch(e){}}
function audioUpd(){if(!AU)return;const A=AU,t=A.ac.currentTime,rpm=st.rpm,fq=rpm/60*4*(1+(Math.random()-.5)*.012*(1-st.thr));
 A.o1.frequency.setTargetAtTime(fq,t,.03);A.o2.frequency.setTargetAtTime(fq*.5,t,.03);A.o3.frequency.setTargetAtTime(fq*.25,t,.03);A.f.frequency.setTargetAtTime(150+st.thr*700+rpm*.06,t,.05);A.g.gain.setTargetAtTime(rpm>0?(.02+st.thr*.04):0,t,.05);
 A.ng.gain.setTargetAtTime(Math.min(.3,(st.slip||0)*.3),t,.04);
 // loop crossfade
 const L=A.LP;let k=0;while(k<L.length-1&&rpm>L[k+1].b)k++;const a=L[k],b=L[Math.min(k+1,L.length-1)];let w=b===a?0:Math.max(0,Math.min(1,(rpm-a.b)/(b.b-a.b)));
 L.forEach(l=>{const gv=rpm<=0?0:l===a?Math.cos(w*Math.PI/2):l===b?Math.sin(w*Math.PI/2):0;l.g.gain.setTargetAtTime(gv,t,.04);if(l.src)l.src.playbackRate.setTargetAtTime(Math.max(.3,Math.min(2.2,Math.max(rpm,500)/l.b)),t,.03);});
 const ld=Math.min(1,st.thr*1.3);A.onG.gain.setTargetAtTime(rpm>0?(.15+.55*ld)*(.7+rpm/6500*.5):0,t,.05);A.offG.gain.setTargetAtTime(rpm>0?(1-ld)*.45:0,t,.06);A.offF.frequency.setTargetAtTime(400+rpm*.1,t,.1);
 A.cab.frequency.setTargetAtTime(chase?9000:2600,t,.1);
 // turbo: boost builds with load above ~1800 rpm
 const tgt=st.thr>.3&&rpm>1800?Math.min(1,(rpm-1800)/2500)*st.thr:0;A.boost+=(tgt-A.boost)*(tgt>A.boost?.03:.15);A.tw.frequency.setTargetAtTime(1800+A.boost*5200,t,.05);A.twG.gain.setTargetAtTime(A.boost*.025,t,.05);
 if(A.lastThr>.6&&st.thr<.25&&A.boost>.4)A.burst(2500,1.2,.35,.08*A.boost);
 // exhaust pops on lift in Sport+
 if(st.mode>=1&&A.lastThr>.5&&st.thr<.15&&rpm>3200)A.popT=st.mode==2?.7:.35;if(A.popT>0){A.popT-=1/60;if(Math.random()<.18)A.burst(180+Math.random()*250,2.5,.07+Math.random()*.06,.5+Math.random()*.4);}
 // ZF 8HP shift: ~90 ms torque cut + small pitch blip on downshift
 if(st.g!==A.lastG){A.cut=st.g>A.lastG?.09:.07;if(st.g<A.lastG&&st.thr<.3)A.burst(300,1.5,.08,.05);A.lastG=st.g;}if(A.cut>0){A.cut-=1/60;A.bus.gain.setTargetAtTime(.45,t,.01);}else A.bus.gain.setTargetAtTime(1,t,.03);
 // surfaces
 const sp=Math.abs(st.v),sf=st.sf|0,inC=!chase,cabK=inC?.55:1,wet=typeof WX!='undefined'&&WX.w>0;
 A.tyR.g.gain.setTargetAtTime(Math.min(.12,sp*.004)*(sf<=1?1:.5)*cabK*(wet?1.3:1),t,.08);A.tyR.f.frequency.setTargetAtTime(250+sp*12+(wet?900:0),t,.1);
 A.tyG.g.gain.setTargetAtTime(sf==2?Math.min(.12,sp*.008)*cabK:0,t,.06);if((sf==2||sf==3)&&sp>1&&Math.random()<Math.min(.9,sp*.06))A.crunch((sf==2?.12:.05)*cabK);
 A.tyS.g.gain.setTargetAtTime(sf==4?Math.min(.06,sp*.004)*cabK:0,t,.08);
 const sl=Math.max(0,Math.min(1,((st.slip||0)-.08)*2.2+Math.abs(st.beta||0)*3-.25))*(sf<=1?1:.15)*(wet?.35:1);
 A.sq.g.gain.setTargetAtTime(sl*.22*cabK,t,.04);A.sqG.gain.setTargetAtTime(sl*.04*cabK,t,.04);const sqf=950+sl*450+Math.sin(t*23)*40;A.sq.f.frequency.setTargetAtTime(sqf,t,.05);A.sqO.frequency.setTargetAtTime(sqf,t,.05);
 A.wn.g.gain.setTargetAtTime(Math.min(.25,sp*sp*.00012)*(inC?.6:1),t,.1);A.wn.f.frequency.setTargetAtTime(300+sp*18,t,.1);
 A.lastThr=st.thr;}
if(/audtest/.test(Q))setTimeout(()=>{audioInit();setTimeout(()=>console.log('TEST audio',!!AU,AU&&AU.LP.map(l=>!!l.src).join(','),'boost',AU&&AU.boost.toFixed(2)),2500);},300);
// ---------- arcade-sim driving ----------
const DYNO=Q.includes('dyno');const GR=[5.0,3.2,2.143,1.72,1.314,1.0,.822,.64],FD=3.15,RW=.36,MASS=2420,WB=2.975,TRF=1.676,TRR=1.702;// BMW X5 M60i: 4.4 V8 390 kW (530 hp), 750 Nm, ZF 8HP, Vmax 285 (M package)
function torque(rpm){if(rpm>6600)return 0;if(rpm<1800)return 520+230*Math.max(0,rpm-1000)/800;return Math.min(750,390000/(rpm*Math.PI/30));}
function step(dt){
 let thrIn=(K.KeyW||K.ArrowUp)?1:T.gas,brkIn=(K.KeyS||K.ArrowDown)?1:T.brk,stIn=(K.KeyA||K.ArrowLeft?1:0)-((K.KeyD&&!K.ShiftLeft&&!K.ShiftRight)||K.ArrowRight?1:0)-T.steer,hb=(K.Space||T.hb)?1:0;
 if(TST){const r=tstScript(dt);thrIn=r.thr;brkIn=r.br;stIn=r.steer;hb=0;}else if(HBT){dT+=dt;const t=dT;hb=t<1.5?1:0;thrIn=(t>.5&&t<1.5)||(t>3.5&&t<4.5)||t>6.5?1:0;brkIn=(t>4.5&&t<5.5)?1:0;if(t>2&&t<2.05)st.epb=true;if(t>5.6&&t<5.65)st.autohold=true;if(t>5.8&&t<5.85){st.epb=true;}if(t>6.2&&t<6.25)st.epb=false;}else if(DRIFT){const d=driftScript(dt);thrIn=d.thr;brkIn=d.br;stIn=d.steer;hb=d.hb;if(st.mode!=2)setMode(2);}else if(demo){thrIn=Q.includes('full')?1:Q.includes('cruise')?(st.v<36?.5:.3):(st.v<16?1:.35);brkIn=0;stIn=0;hb=0;}
 const s=Math.sin(st.h),c=Math.cos(st.h);let vf=st.vx*s+st.vz*c,vl=st.vx*c-st.vz*s;
 // reverse logic
 swTick(dt);st.rev=st.sel==='R';const drv=st.sel==='D'||st.sel==='R';
 if(st.cruise){if(brkIn>.1)st.cruise=0;else thrIn=Math.max(thrIn,Math.max(0,Math.min(1,(st.cruise-st.v)*.35+.22)));}
 if(st.mode==2&&st.on&&st.sel==='D'&&Math.abs(st.v)<.5&&brkIn>.5&&thrIn>.8)st.launch=1;else if(st.launch==1&&brkIn<.2&&thrIn>.8)st.launch=2;else if(st.launch==1)st.launch=0;if(st.launch==2&&(thrIn<.5||st.v>28))st.launch=0;
 // failsafe: gas in P/N (e.g. lever accidentally tapped next to HB) -> auto D; gas always releases EPB/AutoHold/HB latch
 if(thrIn>.3&&!hb&&(st.sel==='P'||st.sel==='N')){st.pnT=(st.pnT||0)+dt;if(st.pnT>.35){setGear('D');st.pnT=0;}}else st.pnT=0;if(thrIn>.1){st.epb=false;st.held=false;st.hb=0;}
 if(st.autohold&&Math.abs(st.v)<.3&&brkIn>.3&&st.sel!=='P')st.held=true;if(thrIn>.1){st.held=false;if(st.sel==='D'||st.sel==='R')st.epb=false;}
 if(!st.on)thrIn=0;
 const wantT=thrIn,wantB=(st.launch==1)?1:brkIn;
 const MODE=[{thr:3,up:.85,st:3.0,dsc:1},{thr:6,up:1,st:3.5,dsc:.6},{thr:10,up:1.08,st:4.2,dsc:0}][st.mode];st.thr+=(wantT-st.thr)*Math.min(1,dt*MODE.thr*(wantT>st.thr?1/(1+Math.abs(st.steer)*1.5+Math.abs(st.beta||0)*8):1));st.brk+=(wantB-st.brk)*Math.min(1,dt*(wantB>st.brk?16:10));
 const sr=Math.abs(stIn)>Math.abs(st.steer)?MODE.st:6;st.steer+=(stIn-st.steer)*Math.min(1,dt*sr);
 st.road=DYNO?!/offrd/.test(Q)||(/mixrd/.test(Q)&&((st.x+st.z)/9|0)%2==0):onRoad(st.x,st.z);st.sf=st.road?0:(DYNO?4:GND.surf(st.x,st.z));const SF=SURF[st.sf],wet01=typeof WX!='undefined'?[0,.75,1][WX.w]||0:0,gr=SF[0]+(SF[1]-SF[0])*wet01;st.grip=gr;
 // gearbox
 const sp=Math.abs(vf);if(st.rev){st.g=0;}else{const rpmG=sp/RW*GR[st.g]*FD*9.549;const up=Math.min(6500,(1700+Math.pow(st.thr,1.5)*4700)*MODE.up),dn=Math.min(1050+Math.pow(st.thr,2)*3300,up*.55);if(rpmG>up&&st.g<7&&st.shift<=0&&!(Math.abs(st.beta||0)>.15&&rpmG<6300)){st.g++;st.shift=.15;}else if(st.g>0&&rpmG<dn&&st.shift<=0&&sp/RW*GR[st.g-1]*FD*9.549<6200){st.g--;st.shift=.12;}}
 const ratio=st.rev?3.5:GR[st.g];let rpm=drv?sp/RW*ratio*FD*9.549:0;rpm=Math.max(rpm,800+st.thr*(drv?(sp<3?2200:0):5200));if(st.launch==1)rpm=3500;if(st.crank>0){st.crank-=dt;rpm=800+Math.sin(Math.max(0,st.crank)/.9*Math.PI)*900;}if(!st.on&&st.crank<=0)rpm=0;st.rpm+=(Math.min(6800,rpm)-st.rpm)*Math.min(1,dt*10);
 st.shift=Math.max(0,st.shift-dt);
 let F=torque(st.rpm)*ratio*FD/RW*st.thr*.85*(st.shift>0?0:1);const Fraw=F*(st.launch==2?1:1);const cap=(st.launch==2&&st.sf==0?.85:.75)*gr*9.81*MASS;if(!st.on)F=0;st.tc=0;let spin=0;if(F>cap){if(st.tcOn){F=cap;st.tc=F>0?1:0;}else{spin=Math.min(1,(F-cap)/cap);F=cap*.92;}}if(st.rev)F=Math.min(F,4000);if(!drv)F=0;
 const roll=260+1140*SF[2]+.6*sp*sp*SF[3],drag=.55*vf*vf;if(SF[4]&&sp>1.5)st.bmp=Math.max(st.bmp||0,SF[4]*Math.min(1,sp/12)*(.5+Math.random()*.5));
 // ---- tire model: bicycle model, per-axle Pacejka-like curves, friction circle, xDrive split, ABS/TC/DSC ----
 const mu0=.85*gr;st.muF=st.muF===undefined?mu0:st.muF+(mu0-st.muF)*Math.min(1,dt*3);const mu=st.muF,GG=9.81,AA=1.45,BB=1.525,LL=AA+BB,HC=.62,IZ=4300,DS=Math.max(MODE.dsc,.4);
 const maxA=.52/(1+Math.abs(vf)*.03),delta=st.steer*maxA;// ~30 deg mean (inner ~36) at standstill; variable-ratio sport steering
 const vS=Math.abs(vf),dR=(vS<16.7?-.09*(1-vS/16.7):.04*Math.min(1,(vS-16.7)/10))*delta;// Integral Active Steering: rear opposite <60 km/h, in-phase above
 const pac=x=>{const bx=12*x;return Math.sin(1.45*Math.atan(bx+.2*(bx-Math.atan(bx))));};const pacR=x=>{const bx=12*x;return Math.sin(1.3*Math.atan(bx+.2*(bx-Math.atan(bx))));};/* rear keeps ~89% past the peak (no snap) */// MF: peak ~9 deg, keeps ~89% of peak far past it (no grip collapse)
 const rearSplit=st.mode==2&&st.thr>.75?.75:.6;let Fd=drv?(st.rev?-Math.min(Fraw,6000)*Math.max(0,Math.min(1,(20/3.6+vf)/1.5)):Fraw)*(st.on?1:0):0;
 let dCut=1,u=vf,v=vl,r=st.r,ax=st.along||0,spinR=0,slipMax=0,beta=0;const NS=4,hh=dt/NS;st.abs=0;st.tc=0;st.dsc=0;st.lock=0;
 for(let k=0;k<NS;k++){
  const Fzf=MASS*GG*BB/LL-MASS*ax*HC/LL,Fzr=MASS*GG*AA/LL+MASS*ax*HC/LL,ay=Math.abs(u*r),lf=MASS*ay*HC/1.679*.56/Math.max(800,Fzf),lr=MASS*ay*HC/1.688*.44/Math.max(800,Fzr);/* lateral load transfer (active roll stab. front-biased) -> tyre load sensitivity */const Ff=mu*Math.max(800,Fzf)*(1-.2*lf*lf),Fr=mu*Math.max(800,Fzr)*(1-.2*lr*lr);
  const den=Math.max(Math.abs(u),3),sgu=u<-.1?-1:1;const af0=sgu*delta-Math.atan2(v+AA*r,den),ar0=sgu*dR-Math.atan2(v-BB*r,den);const rk=Math.abs(u)>4?1:Math.min(1,Math.max(Math.abs(u),.5)*hh/.3);st.afR=(st.afR||0)+(af0-(st.afR||0))*rk;st.arR=(st.arR||0)+(ar0-(st.arR||0))*rk;const af=st.afR,ar=st.arR;/* lateral force always opposes contact-patch lateral velocity; valid for reverse */
  let Fxf=Fd*dCut*(1-rearSplit),Fxr=Fd*dCut*rearSplit;const bT=st.brk*52000;let Bf=bT*.62,Br=bT*.38;let lockF=false,lockR=!!hb;
  {const cor=Math.abs(delta)>.02||Math.abs(beta)>.03;if(st.absOn){const KX=1.3,kf=cor?.8*KX:1.1*KX,kr=cor?.72*KX:1.04*KX;/* ABS holds ~10-15% slip: near longitudinal peak straight, leaves lateral reserve when steering */if(Bf>Ff*kf){Bf=Ff*kf*(.97+.03*Math.random());st.abs=1;}if(Br>Fr*kr){Br=Fr*kr;st.abs=1;}}else{if(Bf>Ff*1.3){lockF=true;Bf=Ff*.85;st.lock=1;}if(Br>Fr*1.1)Br=Fr*1.1;/* proportioning valve: rear never locks from pedal */}}
  if(lockR)Br=hb&&!st.brk?Fr*.55:Fr*.7;const sg=Math.abs(u)>.15?Math.sign(u):0;Fxf-=Bf*sg;Fxr-=Br*sg;
  {const lr=Math.min(.95,Math.abs(pac(ar))),lf=Math.min(.95,Math.abs(pac(af))),limR=Fr*Math.sqrt(Math.max(.05,.94-lr*lr)),limF=Ff*Math.sqrt(Math.max(.05,.94-lf*lf));if(!lockR&&Fd*Fxr>0&&Math.abs(Fxr)>limR){const ex=Math.abs(Fxr)-limR;if(st.tcOn||st.mode<2){Fxr=Math.sign(Fxr)*limR;Fxf+=Math.sign(Fd)*ex*.85;st.tc=st.tcOn?1:0;}else{Fxf+=Math.sign(Fd)*ex*.4;Fxr-=Math.sign(Fd)*ex*.4;}}if(st.tcOn&&Fd*Fxf>0&&Math.abs(Fxf)>limF){Fxf=Math.sign(Fxf)*limF;st.tc=1;}}
  let sR=0;if(Math.abs(Fxr)>Fr*(st.brk>.05&&Fd<=0?1.45:1)){sR=Math.min(1,(Math.abs(Fxr)-Fr)/Fr+.35);Fxr=Math.sign(Fxr)*Fr*.85;}if(Math.abs(Fxf)>Ff*1.45){Fxf=Math.sign(Fxf)*Ff*1.45*.85;}
  let Fyf=Ff*pac(af),Fyr=Fr*pacR(ar);if(lockF)Fyf*=.08;if(lockR)Fyr*=.5;
  {const kxf=Fxf<0&&st.brk>.05?1.3:1.05,kxr=Fxr<0&&st.brk>.05?1.3:1.05;Fyf*=Math.max(.15,Math.sqrt(Math.max(0,1-(Fxf/(Ff*kxf))**2)));Fyr*=Math.max(.1,Math.sqrt(Math.max(0,1-(Fxr/(Fr*kxr))**2)));}if(sR)Fyr*=1-.4*sR;
  let Mz=0;beta=Math.atan2(v,Math.max(Math.abs(u),1));
  if(st.dscOn&&u>3&&!hb){const rLim=mu*GG*.85/Math.max(Math.abs(u),3),rT=Math.max(-rLim,Math.min(rLim,u*Math.tan(delta)/LL)),er=r-rT;const bMax=st.mode==2?.26:.14;if(Math.abs(beta)>.1||Math.abs(er)>.3){st.dsc=1;Mz=-(er*7-beta*16-Math.sign(beta)*Math.max(0,Math.abs(beta)-bMax)*60)*IZ*Math.max(DS,.6);dCut=Math.max(.2,1-DS*Math.min(1,Math.max(0,Math.abs(beta)-.1)*6+Math.max(0,Math.abs(er)-.35)));}}
  if(!st.dscOn&&u>5&&Math.abs(beta)>(hb?.25:.1)){const rEq=-Math.sign(beta)*mu*GG*.8/Math.max(Math.hypot(u,v),5),kk=6+25*Math.max(0,Math.abs(beta)-.4);Mz-=IZ*(r-rEq)*kk*Math.min(1,(Math.abs(beta)-.1)*6);}
  const drag=.55*u*Math.abs(u),roll=Math.abs(u)>.05?(st.road?260:1400)*Math.sign(u):0,cd=Math.cos(delta),sd=Math.sin(delta);
  const cx=lockF?1:cd,sx=lockF?0:sd;const du=(Fxf*cx-Fyf*sd+Fxr-drag-roll)/MASS+v*r,dv=(Fyf*cd+Fxf*sx+Fyr)/MASS-u*r,dr=(AA*(Fyf*cd+Fxf*sx)-BB*Fyr+Mz)/IZ;
  const u0=u;u+=du*hh;v+=dv*hh;r+=dr*hh;if(u0*u<0&&Math.abs(Fd)<50)u=0;if(st.brk>.2&&Math.abs(u)<.4&&Math.abs(Fd*(1-st.brk))<300){u*=.6;v*=.6;r*=.6;}if(Math.abs(u)<.08&&Math.abs(Fd)<50&&st.brk+hb>0)u=0;
  if(Math.abs(u)<3){const w=1-Math.abs(u)/3,kin=u*(Math.tan(delta)-Math.tan(dR))/LL;r=r*(1-w)+kin*w;v*=1-w*.6;}
  ax=du;spinR=Math.max(spinR,sR);const vr=Math.abs(v-BB*r);slipMax=Math.max(slipMax,vr>2.2?Math.min(1,vr/7):0,sR,(lockR||lockF)&&Math.abs(u)>2?.8:0);}
 vf=Math.max(-9,Math.min(285/3.6,u));vl=v;st.r=r;st.spin=spinR;st.slip=st.road?slipMax:slipMax*.5;st.beta=Math.abs(vf)>4?beta:0;
 if(st.sel==='P'||((st.epb||st.held)&&st.thr<.1&&Math.abs(vf)<1.5)){vf=0;vl=0;st.r=0;}
 st.along+=(ax-st.along)*Math.min(1,dt*4);if(spinR>0)st.rpm=Math.min(6800,st.rpm+spinR*dt*9000);
 st.h+=st.r*dt;const s2=Math.sin(st.h),c2=Math.cos(st.h);
 st.vx=s2*vf+c2*vl;st.vz=c2*vf-s2*vl;st.vl=vl;st.v=vf;st.alat=vf*st.r;
 // movement + sliding collisions
 const nx=st.x+st.vx*dt,nz=st.z+st.vz*dt;let hitPt=null;
 for(const [ax,bz] of [[.95,2.35],[-.95,2.35],[.95,-2.35],[-.95,-2.35],[.95,0],[-.95,0]]){const px=nx+ax*c2+bz*s2,pz=nz-ax*s2+bz*c2;if(hit(px,pz)){hitPt=[px,pz];break;}}
 let n=null;if(hitPt&&!DYNO)n=wallN(hitPt[0],hitPt[1]);if(DYNO)AI.length=0;
 AI.forEach(o=>{const dx=nx-o.g.position.x,dz=nz-o.g.position.z,d=Math.hypot(dx,dz);if(d<3.4){n=[dx/d,dz/d];}});
 if(n){const vn=st.vx*n[0]+st.vz*n[1];if(vn<-1.5){COLX.shk=Math.min(1,COLX.shk-vn/20);sfx('crash',Math.min(1,-vn/20));COLX.log.push(['hit','building',+(-vn*3.6).toFixed(0)]);}if(vn<0){st.vx-=1.35*vn*n[0];st.vz-=1.35*vn*n[1];st.vx*=.82;st.vz*=.82;}st.x+=n[0]*.08;st.z+=n[1]*.08;st.r*=.5;}
 else{const L=Math.hypot(nx-st.x,nz-st.z),ns=Math.max(1,Math.ceil(L/.25));const sx=(nx-st.x)/ns,sz=(nz-st.z)/ns;for(let q=0;q<ns;q++){st.x+=st.vx*dt/ns;st.z+=st.vz*dt/ns;COLX.resolve(dt/ns);}}
 audioUpd();}
let TNOW=0;function updAI(dt){TNOW+=dt;updLights(TNOW);AI.forEach(a=>{const L=a.o.c[a.o.c.length-1];let ahead=Math.hypot(a.g.position.x-st.x,a.g.position.z-st.z)<7||aiMustStop(a.g.position.x,a.g.position.z,a.g.rotation.y,TNOW)||AI.some(b=>b!==a&&Math.hypot(b.g.position.x-a.g.position.x,b.g.position.z-a.g.position.z)<6&&((b.g.position.x-a.g.position.x)*Math.sin(a.g.rotation.y)+(b.g.position.z-a.g.position.z)*Math.cos(a.g.rotation.y))>2);a.s+=a.d*a.v*dt*(ahead?0:1);if(a.s>L-2||a.s<2){a.d*=-1;a.s=Math.max(2,Math.min(L-2,a.s));}
 const p=at(a.o.r,a.o.c,a.s,a.d*a.o.r.w/4);a.g.position.set(p[0],0,p[1]);a.g.rotation.y=p[2]+(a.d<0?Math.PI:0);});
 ped.forEach((p,i)=>{const L=p.o.c[p.o.c.length-1];p.s+=p.d*p.v*dt;if(p.s>L-1||p.s<1)p.d*=-1;const q=at(p.o.r,p.o.c,p.s,p.side),t=performance.now()/300+i;
  M.makeRotationY(q[2]+(p.d<0?Math.PI:0)).setPosition(q[0],Math.abs(Math.sin(t))*.05,q[1]);pb.setMatrixAt(i,M);ph.setMatrixAt(i,M);pl.setMatrixAt(i,M);});
 pb.instanceMatrix.needsUpdate=ph.instanceMatrix.needsUpdate=pl.instanceMatrix.needsUpdate=true;}
if(/ff=(\d+)/.test(Q)){const n=+/ff=(\d+)/.exec(Q)[1];for(let i=0;i<n;i++){step(1/60);{const k=st.v*3.6;window.__m=window.__m||{};[100,200,250,280].forEach(x=>{if(k>=x-.05&&!window.__m[x]){window.__m[x]=(i/60).toFixed(2);console.log('REACH',x,'kmh at',window.__m[x],'s');}});if(i%600==0)console.log('T',(i/60).toFixed(0),'kmh',k.toFixed(1),'g',st.g+1);if((DRIFT||HBT)&&i%30==0)console.log('D t',(i/60).toFixed(1),'kmh',k.toFixed(0),'beta',((st.beta||0)*57.3).toFixed(1),'yaw',st.r.toFixed(2),'slip',(st.slip||0).toFixed(2),'spin',(st.spin||0).toFixed(2),'steer',st.steer.toFixed(2),'rpm',st.rpm|0,'epb',st.epb,'held',st.held,'thr',st.thr.toFixed(2),'sel',st.sel,'on',st.on);}}}
let LK=null;{const m=/view=(-?\d+),(-?\d+)(?:,(-?[\d.]+))?(?:,([\d.]+))?/.exec(Q);if(m){const a=+(m[3]||0.8),k=+(m[4]||1.6);LK=[+m[1],+m[2],Math.cos(a)*k,Math.sin(a)*k,k];}}{const m=/lm=([^&]+)/.exec(Q);if(m){const n=decodeURIComponent(m[1]),b=C.b.find(b=>b.n&&b.n.includes(n));if(b){let cx=0,cz=0;b.p.forEach(q=>{cx+=q[0];cz+=q[1];});cx/=b.p.length;cz/=b.p.length;const ang=+(/ang=([-\d.]+)/.exec(Q)||[0,0.6])[1];LK=[cx,cz,Math.cos(ang),Math.sin(ang)];}}}
let last=performance.now(),fr=0;
function frame(t){if(!PCAR.sp&&PCAR.clear){PCAR.sp=1;PCAR.clear(st.x,st.z,14);}GSTR.tick(LK?LK[0]:st.x,LK?LK[1]:st.z,LK&&!LK.g?(LK.g=1):0);WIND.value=t/1000;{const wp=LK?null:(chase?chaseCam:cam).getWorldPosition(_v3),cx=LK?LK[0]:wp.x,cz=LK?LK[1]:wp.z;NEAR.tick(cx,cz);satTick(cx,cz);if(GRASS.tick)GRASS.tick(cx,cz);}if(!window.__cabNS){window.__cabNS=1;cab.traverse(o=>{if(o.isMesh)o.castShadow=false;});}if(/pf/.test(Q)){R.info.autoReset=false;R.info.reset();}const dt=Math.min(0.05,(t-last)/1000)||0.016;last=t;if(TST&&/fast/.test(Q)){const fd=+(Q.match(/fdt=([\d.]+)/)||[0,1/60])[1];for(let i=0;i<Math.round(.2/fd);i++)step(fd);}else step(dt);updAI(dt);
 car.position.set(st.x,(st.bmp||0)*Math.abs(Math.sin(performance.now()*.045)),st.z);car.rotation.y=st.h;swr.rotation.z=st.steer*2.4;gasP.rotation.x=-st.thr*.35;brkP.position.z=.03-st.brk*.05;
 const vib=st.rpm>4500?(Math.random()-.5)*.0006*(st.rpm-4500)/2000:0;if(lookBack){cam.position.set(0,1.32,-.15);}else {st.gs=(st.gs||0)+((st.along||0)-(st.gs||0))*Math.min(1,dt*5);const ga=Math.max(-10,Math.min(9,st.gs)),sh=st.thr>.8&&ga>2?(Math.random()-.5)*.0025*ga/8:0;cam.position.set((XM.cabOk?XM.eye[0]:-.37)+GFX.x+sh,(XM.cabOk?XM.eye[1]:1.34)+SEAT.h+vib+GFX.y+sh,(XM.cabOk?XM.eye[2]:.05)+SEAT.f+GFX.z);const fv=(innerWidth<innerHeight?95:68)+Math.max(0,ga)*.45;if(Math.abs(cam.fov-fv)>.05){cam.fov=fv;cam.updateProjectionMatrix();}}lookTick(dt);cam.rotation.set(lookBack?-.05:-.15+SEAT.t+GFX.p+lookP,lookBack?Math.PI:lookY+(st.beta||0)*.4,-st.alat*.004*GFX.k);
 sun.position.set(st.x+80,150,st.z+60);sun.target.position.set(st.x,0,st.z);
 if(fr++%(mobile?8:6)==0)drawDisp(st.v,st.steer);// 7.5-10 Hz (2k canvas upload is expensive)
 if(LK||topv)R.shadowMap.needsUpdate=true;if(LK){if(LK.c!==TREECH.length||window.__TG!==LK.tg){LK.tg=window.__TG;LK.c=TREECH.length;TREECH.forEach(g=>{const c=g.userData.c;g.visible=!window.__TG&&Math.hypot(c[0]-LK[0],c[1]-LK[1])<300*(g.userData.r||1);});}topCam.position.set(LK[0]+LK[2]*45,LK[4]<1?12:30,LK[1]+LK[3]*45);topCam.lookAt(LK[0],LK[4]<1?3:6,LK[1]);R.render(S,topCam);}else if(topv){const far=Q.includes("city");topCam.position.set(far?0:st.x-200,far?5200:300,far?2600:st.z+250);topCam.lookAt(far?0:st.x,0,far?-300:st.z);R.render(S,topCam);}else{__waterTick(dt);if((cullN++)%15==0){const R2=topv?4000:(mobile?260:340)*Math.max(1,GSET.dist);TREECH.forEach(g=>{const c=g.userData.c;{const d=Math.hypot(c[0]-st.x,c[1]-st.z);g.visible=d<R2*(g.userData.r||1)*(IMP.ready&&g.userData.L&&IMP.mat[g.userData.k]&&g.userData.k!='bush'?1.3:1);if(g.visible&&g.userData.k&&IMP.ready&&IMP.mat[g.userData.k]&&g.userData.L){const im=d-(g.userData.rad||120)>GSET.imp;if(g.userData.im!==im){g.userData.im=im;if(im&&!g.userData.ip)IMP.attach(g);g.children.forEach(m=>{m.visible=!im;});}IMP.set(g,!!(g.visible&&g.userData.im));}else if(g.userData.ipr)IMP.set(g,false);if(g.visible&&g.userData.k){const T=TT[g.userData.k],hi=d<170;if(g.userData.hi!==hi){g.userData.hi=hi;g.children.forEach(m=>{if(m.userData.ci!==undefined)m.geometry=hi?m.userData.hiG:m.userData.loG;if(!T.ns)m.castShadow=hi;});}}}});FURNCH.forEach(o=>{const c=o.userData.c;o.visible=Math.hypot(c[0]-st.x,c[1]-st.z)<(topv?4000:o.userData.cd||(mobile?170:240));});SMALL.forEach(o=>{const c=o.userData.c;o.visible=Math.hypot(c[0]-st.x,c[1]-st.z)<(topv?4000:280*Math.min(2,Math.max(1,GSET.dist)));});}if(cullN%15==1)CHUNKS.forEach(m=>{const c=m.geometry.boundingSphere.center;m.visible=Math.hypot(c.x-st.x,c.z-st.z)-m.geometry.boundingSphere.radius<(topv?3000:(mobile?450:650)*Math.max(1,GSET.dist));});drsTick(dt);if(window.__PED&&__PED.tick)__PED.tick(dt);if(window.__AMB&&__AMB.tick)__AMB.tick(dt);if(window.__NAV){__NAV.tick(dt);if(__NAV.hud)__NAV.hud();if(__NAV.arrived>0)__NAV.arrived-=dt;const e=document.getElementById('adrHud');if(e&&(__NAV.on||__NAV.arrived>0))e.textContent=__NAV.txt();}if(SKY.tick)SKY.tick(Math.min(dt,.05));EXH.tick(Math.min(dt,.05));SGN.tick(Math.min(dt,.05));COLX.tick(Math.min(dt,.05));WPT.tick(Math.min(dt,.05));window.__CURB&&__CURB.tick(dt);featTick(dt);weatherTick(dt);postTick();uiTick();bodyTick(dt);fxTick(dt);if(R.shadowMap.enabled&&(shF++%(GSET.shadow>=2?2:3)==0))R.shadowMap.needsUpdate=true;if(chase)RENDER(chaseCam);else{const cb=window.__carBody;const nu=R.shadowMap.needsUpdate;R.shadowMap.needsUpdate=false;renderMirrors();renderRearCam();R.shadowMap.needsUpdate=nu;if(cb)cb.visible=false;RENDER(cam);if(cb)cb.visible=true;}if(/pf/.test(Q)){window.__pfc=R.info.render.calls;window.__pft=R.info.render.triangles;}}
 if(/prof/.test(Q)&&cullN%30==5){const i=R.info.render;let tri=0,n=0;S.traverse(o=>{if(o.isMesh&&o.visible){n++;}});{const A=[];S.traverseVisible(o=>{if(o.isMesh&&o.geometry){const g=o.geometry;let t=(g.index?g.index.count:g.attributes.position.count)/3;if(o.isInstancedMesh)t*=o.count;A.push([t|0,o.type,(o.material&&o.material.type)||'',o.parent===S?'S':o.parent.type,g.type]);}});A.sort((a,b)=>b[0]-a[0]);console.log('PROF top '+A.slice(0,12).map(a=>a.join(':')).join(' | '));}console.log('PROF pos',st.x.toFixed(0),st.z.toFixed(0),'chunksVis',CHUNKS.filter(m=>m.visible).length,'/',CHUNKS.length,'sat',S.children.filter(o=>o.isMesh&&o.geometry.type=='PlaneGeometry'&&o.material.map&&o.visible).length);{const rc=CHUNKS.filter(m=>m.material===roadM);const near=rc.map(m=>{const c=m.geometry.boundingSphere.center;return [Math.hypot(c.x-st.x,c.z-st.z)|0,m.visible,m.position.y.toFixed(2),m.rotation.x.toFixed(2),c.y.toFixed(1)];}).sort((a,b)=>a[0]-b[0]).slice(0,3);console.log('PROF roads',JSON.stringify(near),'ground',ground.visible,ground.position.y,'chase',chase);}{const cnt=a=>a.filter(o=>o.visible).length;let oth=0;S.traverseVisible(o=>{if(o.isMesh&&!CHUNKS.includes(o)&&!TREECH.includes(o)&&!SMALL.includes(o)&&!FURNCH.includes(o)){oth++;let r=o;while(r.parent&&r.parent!==S)r=r.parent;const k=(r.name||r.type)+(r===o?':'+o.material.type:':'+r.id+':'+(r.userData.ai?'ai':'')+(r===car?'CAR':''));(window.__OC=window.__OC||{})[k]=(window.__OC[k]||0)+1;}});console.log('PROF oth',JSON.stringify(Object.entries(window.__OC).sort((a,b)=>b[1]-a[1]).slice(0,12)));{let d=0,n=0,mm={};car.traverse(o=>{if(!o.isMesh)return;if(o.parent===car)d++;else n++;mm[o.material.uuid]=(mm[o.material.uuid]||0)+1;});const dump=(g,dep)=>g.children.forEach(c=>{let n=0;c.traverse(o=>{if(o.isMesh)n++;});if(n>3)console.log('PROF tree','-'.repeat(dep),c.type,c.name,c.id,'direct',c.children.filter(o=>o.isMesh&&!o.children.length).length,'total',n);if(dep<2)dump(c,dep+1);});dump(car,0);console.log('PROF carmesh direct',d,'nested',n,'mats',Object.keys(mm).length);}console.log('PROF vis chunks',cnt(CHUNKS),'tree',cnt(TREECH),'small',cnt(SMALL),'furn',cnt(FURNCH),'other',oth);}console.log('PROF frame',fr,'calls',i.calls,'tris',i.triangles,'meshes',n,'t',(performance.now()-PT0).toFixed(0));}
 requestAnimationFrame(frame);}

// ---------- headlights / time of day / look back ----------
let lookBack=false,lights=false,tod=0;
// seat adjustment (BMW-style): height / fore-aft / backrest tilt, saved; memory M1/M2
const SEATL={h:[-.04,.07],f:[-.08,.1],t:[-.1,.08]};let SEAT={h:0,f:0,t:0};try{Object.assign(SEAT,JSON.parse(localStorage.getItem('x5seat')||'{}'));}catch(e){}
{const m=/[?&]seat=([-\d.]+),([-\d.]+),([-\d.]+)/.exec(Q);if(m)SEAT={h:+m[1],f:+m[2],t:+m[3]};}
function seatSet(k,v){SEAT[k]=Math.max(SEATL[k][0],Math.min(SEATL[k][1],v));try{localStorage.setItem('x5seat',JSON.stringify(SEAT));}catch(e){}}['h','f','t'].forEach(k=>seatSet(k,SEAT[k]));
const hemi=S.children.find(o=>o.isHemisphereLight);
// ---------- SKY: dome with zenith gradient + horizon haze + seamless CC0 cloud layers (Screaming Brain Studios SBS) blended by time of day, overcast in rain, slow drift ----------
const SKY={};window.__SKY=SKY;if(!/oldsky/.test(Q)){const L=new THREE.TextureLoader(),T=n=>{const t=L.load('tex/sky/'+n+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;return t;};
 const U={uD:{value:T('day')},uS:{value:T('sunset')},uN:{value:T('night')},uO:{value:T('over')},uW:{value:new THREE.Vector4(1,0,0,0)},uT:{value:0},uHz:{value:new THREE.Color(0xc9dbe6)},uZ:{value:new THREE.Color(0x3d7cc9)}};SKY.U=U;
 const m=new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform sampler2D uD,uS,uN,uO;uniform vec4 uW;uniform float uT;uniform vec3 uHz,uZ;varying vec3 vD;
  vec3 sm(sampler2D t,vec2 u){return texture2D(t,u).rgb;}
  void main(){vec3 d=normalize(vD);float h=max(d.y,0.);vec2 uv=d.xz/(h+.18)*.22+vec2(uT*.004,uT*.0015);vec2 uv2=uv*.5+vec2(.31,.17)-vec2(uT*.0025,0.);
   vec3 cl=(sm(uD,uv)*.6+sm(uD,uv2)*.4)*uW.x+(sm(uS,uv)*.6+sm(uS,uv2)*.4)*uW.y+(sm(uN,uv)*.6+sm(uN,uv2)*.4)*uW.z;cl=mix(cl,sm(uO,vec2(uv.x*.3,.5+h*.3)),uW.w);
   vec3 g=mix(uHz,uZ,pow(h,.6));vec3 c=mix(g,cl,smoothstep(.02,.35,h)*.85);c=mix(c,uHz,pow(1.-h,8.));if(d.y<0.)c=uHz;gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <encodings_fragment>
  }`});
 const dome=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),m);dome.frustumCulled=false;dome.renderOrder=-10;dome.onBeforeRender=(r,sc,cm)=>{dome.position.copy(cm.getWorldPosition(new THREE.Vector3()));};S.add(dome);SKY.dome=dome;
 SKY.set=()=>{let wet=0;try{wet=WX.w;}catch(e){}U.uW.value.set(tod==0?1:0,tod==1?1:0,tod==2?1:0,wet?(wet>=2?.85:.6):0);U.uHz.value.copy(S.fog.color);U.uZ.value.setHex(tod==0?0x3d7cc9:tod==1?0x2b2f5a:0x02040c);if(wet)U.uZ.value.lerp(new THREE.Color(tod==2?0x0a0c10:0x7a838c),.7);S.background=null;};
 SKY.tick=dt=>{U.uT.value+=dt;let w=0;try{w=WX.w;}catch(e){}if((SKY.f=(SKY.f||0)+1)%30==1||SKY.lt!==tod*10+w){SKY.lt=tod*10+w;SKY.set();}};}
const hl=new THREE.SpotLight(0xfff4d8,0,90,.5,.45,1.2);hl.position.set(0,1,2.2);const hlT=new THREE.Object3D();hlT.position.set(0,0,22);car.add(hl,hlT);hl.target=hlT;
// BMW LED low beam: asymmetric cookie (flat cut-off on the left/oncoming side, 15deg rise to the right kerb side), high beam cookie = wide even spot
const HLX={};{const ck=(hi)=>{const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,N,N);
  if(hi){const r=g.createRadialGradient(N/2,N/2,4,N/2,N/2,N/2);r.addColorStop(0,'#fff');r.addColorStop(.55,'#cfd6e0');r.addColorStop(1,'#000');g.fillStyle=r;g.fillRect(0,0,N,N);}
  else{const r=g.createRadialGradient(N*.55,N*.56,4,N/2,N/2,N*.55);r.addColorStop(0,'#fff');r.addColorStop(.5,'#bfc6d0');r.addColorStop(1,'#000');g.fillStyle=r;g.fillRect(0,0,N,N);
   // cut-off: everything above the line is dark; line flat on the left half, rising 15deg on the right (cookie x is mirrored: spot looks forward)
   g.globalCompositeOperation='destination-out';g.fillStyle='#000';g.beginPath();g.moveTo(0,0);g.lineTo(N,0);g.lineTo(N,N*.52);g.lineTo(N*.5,N*.52);g.lineTo(N*.5+N*.5,N*.52-N*.5*Math.tan(.26));g.lineTo(N,0);g.closePath();
   g.beginPath();g.moveTo(0,0);g.lineTo(N,0);g.lineTo(N,N*.52-N*.5*Math.tan(.26));g.lineTo(N*.5,N*.52);g.lineTo(0,N*.52);g.closePath();g.filter='blur(3px)';g.fill();g.filter='none';g.globalCompositeOperation='source-over';}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;};HLX.lo=ck(0);HLX.hi=ck(1);try{hl.map=HLX.lo;}catch(e){}
 if(GSET.shadow>=2&&!mobile){hl.castShadow=true;hl.shadow.mapSize.set(512,512);hl.shadow.bias=-.0008;hl.shadow.camera.near=.5;hl.shadow.camera.far=120;}
 // light shafts visible in rain / mist: two additive cones from the lamps
 const cg=new THREE.CylinderGeometry(.08,3.2,22,20,1,true).translate(0,-11,0).rotateX(-Math.PI/2+.035);
 const cm=new THREE.ShaderMaterial({uniforms:{uI:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying float vL;varying vec3 vN,vV;void main(){vL=clamp(-position.z/22.,0.,1.);vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uI;varying float vL;varying vec3 vN,vV;void main(){float e=pow(abs(dot(vN,vV)),1.5);float a=uI*e*(1.-vL)*(1.-vL)*smoothstep(0.,.08,vL);gl_FragColor=vec4(vec3(.85,.9,1.)*a,a);}'});
 HLX.cones=[-.75,.75].map(x=>{const m=new THREE.Mesh(cg,cm);m.position.set(x,.72,2.4);m.frustumCulled=false;m.renderOrder=4;car.add(m);return m;});HLX.cm=cm;}
function skyTex(a,b,c){return tex(cv(2,256,(g)=>{const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,a);gr.addColorStop(.6,b);gr.addColorStop(1,c);g.fillStyle=gr;g.fillRect(0,0,2,256);}));}
const TOD=[{n:'☀️',sky:S.background,fog:0xc9dbe6,sun:.85,sc:0xfff2dd,hemi:.75,lamp:0xfff6d8},
 {n:'🌆',sky:skyTex('#2b2f5a','#d9875a','#f2c48a'),fog:0xc9a08a,sun:.45,sc:0xffb070,hemi:.45,lamp:0xffd890},
 {n:'🌙',sky:skyTex('#02040c','#0b1430','#1b2440'),fog:0x0b1020,sun:.05,sc:0x8090c0,hemi:.12,lamp:0xffe2a0}];
function applyTod(){const t=TOD[tod];if(typeof ambApply=='function')ambApply();if(window.__XM&&__XM.cabMats)__XM.cabMats.forEach(l=>{if(l.emissiveMap)l.emissive.setScalar((l.userData.eK||1)*(tod==0?.2:tod==1?.12:.05));if(l.envMap)l.envMapIntensity=(l.userData.env||.5)*(tod==0?1:tod==1?.5:.12);});if(CABX.fill){CABX.fill.intensity=tod==0?.9:tod==1?.45:.05;CABX.amb.intensity=tod==2?.35:tod==1?.12:0;}if(window.__entLamp)__entLamp.emissiveIntensity=tod==2?1.6:tod==1?.7:.05;__facadeNight(tod==2?1.3:tod==1?.35:0);S.background=t.sky;S.fog.color.setHex(t.fog);sun.intensity=t.sun;sun.color.setHex(t.sc);if(hemi)hemi.intensity=t.hemi;head.material.color.setHex(tod==2?0xffe9b0:0xfff6d8);
 lightsUpd();document.getElementById('bTod').textContent=t.n;try{if(WX.L)weatherApply();}catch(e){}}
// light switch: 0 Off/DRL, 1 Auto, 2 Low, 3 High (+ flash-to-pass, auto high beam in Auto)
const HB={lm:+((/[?&]beam=(\d)/.exec(Q)||[0,1])[1]),hi:false,flash:false,latch:false,gT:0};
function setLights(v){HB.lm=v?2:0;lightsUpd();}
function setLM(m){HB.lm=m;HB.latch=m==3;lightsUpd();}
function lightsUpd(){const kmh=Math.abs(st.v)*3.6;lights=HB.flash||HB.lm>=2||(HB.lm==1&&tod>0);HB.hi=HB.flash||(lights&&(HB.lm==3||HB.latch||(HB.lm==1&&tod==2&&kmh>40)));
 hl.intensity=HB.hi?4.6:lights?2.6:0;if(typeof HLX!='undefined'){try{hl.map=HB.hi?HLX.hi:HLX.lo;}catch(e){}let wet=false;try{wet=WX.w>0;}catch(e){}HLX.cm.uniforms.uI.value=lights&&chase?(tod==2?(wet?.16:.05):tod==1?(wet?.08:.02):(wet?.03:0))*(HB.hi?1.4:1):0;HLX.cones.forEach(m=>m.visible=HLX.cm.uniforms.uI.value>0);}hl.distance=HB.hi?170:60;hl.angle=HB.hi?.42:.52;hl.penumbra=HB.hi?.35:.5;hlT.position.set(0,HB.hi?1.2:-1.5,HB.hi?45:16);
 const b=document.getElementById('bLt');if(b){b.classList.toggle('a',lights);b.textContent=['💡','A','≡D','≣D'][HB.lm];b.style.color=HB.hi?'#6af':'';}}

function setMode(m){st.mode=m;st.dscOn=st.tcOn=m<2;const b=document.getElementById('bMode');b.style.color=['#8cf','#fb6','#f66'][m];}document.getElementById('bMode').onclick=()=>setMode((st.mode+1)%3);addEventListener('keydown',e=>{if(e.code=='KeyM')setMode((st.mode+1)%3);});setMode(st.mode);{const m=/mode=(\d)/.exec(Q);if(m)setMode(+m[1]);}
document.getElementById('bLt').onclick=()=>setLM((HB.lm+1)%4);
document.getElementById('bTod').onclick=()=>{tod=(tod+1)%3;applyTod();};if(/night/.test(Q)){tod=2;applyTod();}
{const b=document.getElementById('bBack');const on=e=>{e.preventDefault();lookBack=true;b.classList.add('a');},off=()=>{lookBack=false;b.classList.remove('a');};
 b.addEventListener('touchstart',on,{passive:false});b.addEventListener('touchend',off);b.addEventListener('mousedown',on);addEventListener('mouseup',off);}
addEventListener('keydown',e=>{if(e.code=='KeyL')setLM((HB.lm+1)%4);if(e.code=='KeyG'&&!e.repeat){HB.flash=true;HB.gT=performance.now();lightsUpd();}if(e.code=='KeyT'){tod=(tod+1)%3;applyTod();}if(e.code=='KeyB')lookBack=true;if(e.code=='KeyF')document.getElementById('fs').onclick&&document.getElementById('fs').onclick();});
addEventListener('keyup',e=>{if(e.code=='KeyB')lookBack=false;if(e.code=='KeyG'){HB.flash=false;if(performance.now()-HB.gT<350)HB.latch=!HB.latch;lightsUpd();}});
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
 const near=lookP<-.25&&lookY<0&&lookY>-1.2;knobHi.material.opacity=near?.9:0;knob.material.emissive=knob.material.emissive||new THREE.Color();knob.material.emissive.setHex(near?0x2a6ab0:0x2a3a4a);
 knobKick*=Math.exp(-dt*6);knob.position.z=SZ+knobKick*.035;knob.rotation.x=-.12+knobKick*.25;pBtn.position.z=SZ-.012+knobKick*.035;if(fr%6==0)drawPRND();}

// ---------- real mirrors (render targets) ----------
const MIR=[];window.__MIR=MIR;function mirror(w,h,pos,ry,cpos,cry,fov){const rt=new THREE.WebGLRenderTarget(256,128);const c=new THREE.PerspectiveCamera(fov,w/h,.3,mobile?150:250);c.position.set(...cpos);c.rotation.set(0,cry,0);cab.add(c);
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:rt.texture,side:THREE.DoubleSide}));m.position.set(...pos);m.rotation.y=ry;m.scale.x=-1;cab.add(m);MIR.push({rt,c,mesh:m});}
mirror(.2,.05,[0,1.42,-.452],0,[0,1.4,-.3],Math.PI,28);
mirror(.2,.1,[-1.0,1.0,-.668],-.25,[-1.06,1.0,-.75],Math.PI-.3,40);
mirror(.2,.1,[1.0,1.0,-.668],.25,[1.06,1.0,-.75],Math.PI+.3,40);
MIR.forEach((o,i)=>{o.c.far=i?110:90;o.c.updateProjectionMatrix();o.side=i>0;});let mfr=0;function renderMirrors(){mfr++;if(GSET.mir==0)return;const LOWM=GSET.preset==='low';const half=(GSET.mrate|0)>=2;if(half&&mfr%2)return;
 // full rate: every mirror every frame (desktop & phones); Low: round-robin one mirror per frame
 const list=LOWM?[MIR[mfr%MIR.length]]:MIR;const hid=[];const hide=x=>{if(x.visible){x.visible=false;hid.push(x);}};const light=mobile||LOWM;
 if(GRASS.m)hide(GRASS.m);if(light){(window.__TREECH||[]).forEach(g=>{if(g.userData.r<1)hide(g);});(window.__FURNCH||[]).forEach(hide);Object.values(NEAR.im).forEach(hide);(PCAR.ch||[]).forEach(hide);}if(window.__XM&&__XM.int)__XM.int.forEach(hide);
 if(!MIR.glass){MIR.glass=[];const T=new Set(MIR.map(m=>m.rt.texture));S.traverse(x=>{if(x.isMesh&&x.material&&!Array.isArray(x.material)&&T.has(x.material.map))MIR.glass.push(x);});}
 list.forEach(o=>{const h2=[];const hd=x=>{if(x.visible){x.visible=false;h2.push(x);}};MIR.glass.forEach(hd);/* never sample a mirror RT while rendering into it (feedback loop -> garbage textures) */let bodyOn=false;if(!o.side&&window.__XM&&__XM.cabWin)hd(__XM.cabWin);if(o.side){hd(cab);if(window.__XM&&__XM.ok&&!body.visible){body.visible=true;bodyOn=true;}}R.setRenderTarget(o.rt);R.render(S,o.c);if(bodyOn)body.visible=false;h2.forEach(x=>x.visible=true);});
 R.setRenderTarget(null);hid.forEach(x=>x.visible=true);}

// ---------- Group E: navigation (OSM road graph, A*, route on CID map + turn-by-turn on cluster/HUD) ----------

// ===== Group F: pedestrians = PSX character models (user pack) + Quaternius UAL clips retargeted in Blender; car impacts -> death, blood, dismemberment of the real mesh =====
const PED={list:[],parts:[],blood:[],kills:0,ready:false};window.__PED=PED;
{const NP=/[?&]noped/.test(Q)?0:mobile?16:36,FW=C.r.filter(r=>r.k==='footway'||r.k==='path'||r.k==='pedestrian'||r.k==='steps'),SEG=[];
 FW.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L>1.5)SEG.push([a[0],a[1],b[0],b[1],L]);}});
 C.r.forEach(r=>{if(r.w<5||FW.includes(r))return;for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<3)continue;const nx=-(b[1]-a[1])/L,nz=(b[0]-a[0])/L;for(const sd of[-1,1]){const o=(r.w/2+1.6)*sd;SEG.push([a[0]+nx*o,a[1]+nz*o,b[0]+nx*o,b[1]+nz*o,L]);}}});
 const GS={},gc=50;SEG.forEach((q,i)=>{const k=Math.floor((q[0]+q[2])/2/gc)+','+Math.floor((q[1]+q[3])/2/gc);(GS[k]=GS[k]||[]).push(i);});
 const pick=()=>{const cx=Math.floor(st.x/gc),cz=Math.floor(st.z/gc);for(let t=0;t<40;t++){const k=(cx+((Math.random()*7|0)-3))+','+(cz+((Math.random()*7|0)-3)),l=GS[k];if(!l)continue;const q=SEG[l[Math.random()*l.length|0]],u=Math.random(),x=q[0]+(q[2]-q[0])*u,z=q[1]+(q[3]-q[1])*u,d=Math.hypot(x-st.x,z-st.z);if(d>35&&d<160)return [q,u];}return null;};
 const bloodM=new THREE.MeshLambertMaterial({color:0x7a0000}),bloodD=new THREE.MeshBasicMaterial({color:0x4a0000,transparent:true,opacity:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
 const gPool=new THREE.CircleGeometry(1,14).rotateX(-Math.PI/2),gDrop=new THREE.SphereGeometry(.035,4,3),gStump=new THREE.SphereGeometry(.07,6,4);
 // --- assets
 const T={F:[],M:[],P:[],D:[],K:[]};let CLIPS={},SRCB={};
 // per-character retarget: world-space rest-relative rotation deltas (source rig rest -> this character's rest), so differing bone rolls/rests don't twist limbs
 const retarget=t=>{if(t.clips)return t.clips;const CB={};t.sk.skeleton.bones.forEach(b=>{CB[b.name]={q:t.rest[b.name],par:b.parent&&b.parent.isBone?b.parent.name:null};});
  const order=[];const seen={};const add=n=>{if(seen[n]||!CB[n])return;if(CB[n].par)add(CB[n].par);seen[n]=1;order.push(n);};Object.keys(CB).forEach(add);
  const wr=(B,get)=>{const W={};const sp=(n)=>{if(W[n])return W[n];const b=B[n];const l=get(n);const w=b&&b.par&&B[b.par]?sp(b.par).clone().multiply(l):l.clone();W[n]=w;return w;};return sp;};
  const SR=wr(SRCB,n=>SRCB[n]?SRCB[n].q:new THREE.Quaternion()),CR=wr(CB,n=>CB[n].q);const hipS=SRCB.mixamorigHips?SRCB.mixamorigHips.p.length():1,hipC=t.restP.mixamorigHips?t.restP.mixamorigHips.length():1,hr=hipC/hipS;
  const out={};for(const nm in CLIPS){const c=CLIPS[nm];const qt={},pt=[];c.tracks.forEach(tr=>{const [bn,pr]=tr.name.split('.');if(pr==='quaternion')qt[bn]=tr.createInterpolant();else pt.push(tr);});
   const N=Math.max(2,Math.round(c.duration*30)+1),times=new Float32Array(N);for(let i=0;i<N;i++)times[i]=Math.min(c.duration,i/30);const vals={};order.forEach(n=>vals[n]=new Float32Array(N*4));
   const Dq=new THREE.Quaternion(),tmp=new THREE.Quaternion();
   for(let i=0;i<N;i++){const SW={},CW={};const sw=n=>{if(SW[n])return SW[n];const b=SRCB[n];let l;if(qt[n]){const v=qt[n].evaluate(times[i]);l=new THREE.Quaternion(v[0],v[1],v[2],v[3]);}else l=b?b.q.clone():new THREE.Quaternion();const w=b&&b.par?sw(b.par).clone().multiply(l):l;SW[n]=w;return w;};
    order.forEach(n=>{let cw;if(SRCB[n]){Dq.copy(sw(n)).multiply(tmp.copy(SR(n)).invert());cw=Dq.clone().multiply(CR(n));}else{const par=CB[n].par;cw=(par?CW[par].clone():new THREE.Quaternion()).multiply(CB[n].q);}CW[n]=cw;const par=CB[n].par;const lq=par?CW[par].clone().invert().multiply(cw):cw.clone();lq.normalize();vals[n].set([lq.x,lq.y,lq.z,lq.w],i*4);});}
   const tracks=order.map(n=>new THREE.QuaternionKeyframeTrack(n+'.quaternion',times,vals[n]));pt.forEach(tr=>{const v=tr.values.slice();for(let i=0;i<v.length;i++)v[i]*=hr;tracks.push(new THREE.VectorKeyframeTrack(tr.name,tr.times,v));});
   out[nm]=new THREE.AnimationClip(nm,c.duration,tracks);}
  t.clips=out;return out;};
 // minimal SkeletonUtils.clone (r149)
 const sclone=src=>{const sm=new Map(),cm=new Map(),c=src.clone();const par=(a,b,f)=>{f(a,b);for(let i=0;i<a.children.length;i++)par(a.children[i],b.children[i],f);};par(src,c,(a,b)=>{sm.set(b,a);cm.set(a,b);});c.traverse(n=>{if(!n.isSkinnedMesh)return;const s=sm.get(n),bn=s.skeleton.bones;n.skeleton=s.skeleton.clone();n.bindMatrix.copy(s.bindMatrix);n.skeleton.bones=bn.map(b=>cm.get(b));n.bind(n.skeleton,n.bindMatrix);});return c;};
 const PART=n=>/Head|Neck/.test(n)?0:/LeftShoulder|LeftArm|LeftForeArm|LeftHand/.test(n)?1:/RightShoulder|RightArm|RightForeArm|RightHand/.test(n)?2:/LeftUpLeg|LeftLeg|LeftFoot|LeftToe/.test(n)?3:/RightUpLeg|RightLeg|RightFoot|RightToe/.test(n)?4:5;
 const JOINT=['Neck','LeftArm','RightArm','LeftUpLeg','RightUpLeg',null];
 if(NP&&THREE.GLTFLoader){const ld=new THREE.GLTFLoader();if(window.MeshoptDecoder)ld.setMeshoptDecoder(MeshoptDecoder);
  ld.load('models/peds/anims.glb',ga=>{ga.animations.forEach(a=>{// keep rotation tracks + hips position only
    a.tracks=a.tracks.filter(t=>t.name.endsWith('.quaternion')||/Hips\.position/.test(t.name));CLIPS[a.name]=a;});SRCB={};ga.scene.traverse(n=>{if(n.isBone||/mixamorig/.test(n.name))SRCB[n.name]={q:n.quaternion.clone(),p:n.position.clone(),par:n.parent&&/mixamorig/.test(n.parent.name)?n.parent.name:null};});
   ld.load('models/peds/peds.glb',g=>{g.scene.children.slice().forEach(o=>{const k=(o.name||'').split('_')[0];if(!T[k])return;let sk=null;o.traverse(n=>{if(n.isSkinnedMesh)sk=n;});if(!sk)return;
     const m=sk.material;if(m.map){m.map.magFilter=THREE.NearestFilter;m.map.minFilter=THREE.NearestMipmapLinearFilter;m.map.encoding=THREE.sRGBEncoding;}
     sk.material=new THREE.MeshLambertMaterial({map:m.map});sk.frustumCulled=false;o.position.set(0,0,0);o.traverse(n=>{if(n.isBone)n.name=n.name.replace(/_\d+$/,'');});const w=new THREE.Group();w.add(o);w.name=o.name;
     // per-vertex part from dominant bone
     const sw=sk.geometry.attributes.skinWeight,si=sk.geometry.attributes.skinIndex,bp=sk.skeleton.bones.map(b=>PART(b.name)),vp=new Uint8Array(sw.count);for(let i=0;i<sw.count;i++){let bw=-1,bj=0;for(let c=0;c<4;c++){const w=sw.getComponent?sw.getComponent(i,c):[sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)][c];if(w>bw){bw=w;bj=[si.getX(i),si.getY(i),si.getZ(i),si.getW(i)][c];}}vp[i]=bp[bj];}
     const rest={},restP={};sk.skeleton.bones.forEach(b=>{rest[b.name]=b.quaternion.clone();restP[b.name]=b.position.clone();});T[k].push({o:w,vp,name:o.name,sk,rest,restP});});
    PED.ready=true;console.log('PED models',Object.entries(T).map(([k,v])=>k+v.length).join(' '),'clips',Object.keys(CLIPS).join(','));});});}
 const kind=()=>{const night=tod==2,r=Math.random();if(night&&r<.12&&T.K.length)return 'K';if(r<.03&&T.P.length)return 'P';if(r<.05&&T.D.length)return 'D';return Math.random()<.62?'F':'M';};
 const mk=p=>{const k=kind(),L=T[k].length?T[k]:T.F,t=L[Math.random()*L.length|0],o=sclone(t.o);let sk=null;o.traverse(n=>{if(n.isSkinnedMesh)sk=n;});const sc=.95+Math.random()*.1;o.scale.multiplyScalar(sc);S.add(o);
  const mx=new THREE.AnimationMixer(o),A={},CL=retarget(t);for(const n in CL){A[n]=mx.clipAction(CL[n]);}A.Hit.setLoop(THREE.LoopOnce);A.Death.setLoop(THREE.LoopOnce);A.Death.clampWhenFinished=true;A.Hit.clampWhenFinished=true;
  Object.assign(p,{pitch:.93+Math.random()*.15,g:o,sk,t,mx,A,sc,kind:k,cur:null,dead:false,lodf:0,st:'walk',stT:4+Math.random()*20,sp:(k==='K'?1.25:1)*(.95+Math.random()*.35)});play(p,Math.random()<.15?'Walk2':'Walk',0);p.A.Walk.time=Math.random()*1;};
 const play=(p,n,f=.25)=>{const a=p.A[n];if(!a||p.cur===a)return;a.reset().play();if(p.cur)p.cur.crossFadeTo(a,f,false);p.cur=a;};
 const place=p=>{const r=pick();if(!r){p.g.visible=false;p.q=null;return;}p.q=r[0];p.u=r[1];p.dir=Math.random()<.5?1:-1;p.side=(Math.random()-.5)*1.2;p.dead=false;p.g.visible=true;p.flee=0;p.st='walk';p.stT=4+Math.random()*20;play(p,'Walk',0);};
 const spray=(x,y,z,vx,vy,vz,n)=>{for(let i=0;i<n;i++){const m=new THREE.Mesh(gDrop,bloodM);m.position.set(x,y,z);S.add(m);PED.parts.push({m,v:new THREE.Vector3(vx*.5+(Math.random()-.5)*4,vy+Math.random()*3,vz*.5+(Math.random()-.5)*4),w:new THREE.Vector3(),t:0,drop:1});}};
 const pool=(x,z,r)=>{const m=new THREE.Mesh(gPool,bloodD);m.position.set(x,.03+Math.random()*.01,z);m.scale.setScalar(.05);m.userData.R=r;m.rotation.y=Math.random()*6;S.add(m);PED.blood.push(m);if(PED.blood.length>60){const o=PED.blood.shift();S.remove(o);}};
 // bake the current skinned pose to world-space pieces split by body part
 const V=new THREE.Vector3(),V2=new THREE.Vector3();
 const dismember=p=>{const sk=p.sk;p.g.updateMatrixWorld(true);sk.skeleton.update();const P=sk.geometry.attributes.position,UV=sk.geometry.attributes.uv,ix=sk.geometry.index,n=ix?ix.count:P.count,W=new Float32Array(P.count*3);
  for(let i=0;i<P.count;i++){V.fromBufferAttribute(P,i);sk.boneTransform(i,V);V.applyMatrix4(sk.matrixWorld);W[i*3]=V.x;W[i*3+1]=V.y;W[i*3+2]=V.z;}
  const buck=[[],[],[],[],[],[]];for(let t=0;t<n;t+=3){const a=ix?ix.getX(t):t,b=ix?ix.getX(t+1):t+1,c=ix?ix.getX(t+2):t+2,vp=p.t.vp;const pa=vp[a]===vp[b]||vp[a]===vp[c]?vp[a]:vp[b];buck[pa].push(a,b,c);}
  const out=[];buck.forEach((L,pi)=>{if(!L.length)return;const pos=new Float32Array(L.length*3),uv=new Float32Array(L.length*2);let cx=0,cy=0,cz=0;L.forEach((v,j)=>{pos[j*3]=W[v*3];pos[j*3+1]=W[v*3+1];pos[j*3+2]=W[v*3+2];cx+=W[v*3];cy+=W[v*3+1];cz+=W[v*3+2];if(UV){uv[j*2]=UV.getX(v);uv[j*2+1]=UV.getY(v);}});cx/=L.length;cy/=L.length;cz/=L.length;
   for(let j=0;j<L.length;j++){pos[j*3]-=cx;pos[j*3+1]-=cy;pos[j*3+2]-=cz;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));if(UV)g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.computeVertexNormals();
   const m=new THREE.Mesh(g,sk.material);m.material.side=THREE.DoubleSide;m.position.set(cx,cy,cz);m.castShadow=true;S.add(m);
   // stump at the joint
   const jn=JOINT[pi];if(jn){const b=sk.skeleton.bones.find(b=>b.name.endsWith(jn));if(b){b.getWorldPosition(V2);const s=new THREE.Mesh(gStump,bloodM);s.position.copy(V2).sub(m.position);m.add(s);}}
   g.computeBoundingBox();out.push({m,pi,h:g.boundingBox.max.y-g.boundingBox.min.y});});
  S.remove(p.g);return out;};
 const hit=(p,spd,fx,fz)=>{say(p,'pain',true);p.dead=true;PED.kills++;const sev=spd>11;const wp=p.g.position.clone();const up=Math.min(9,spd*.45);
  if(sev){dismember(p).forEach(o=>{const jx=(Math.random()-.5)*6,jz=(Math.random()-.5)*6;PED.parts.push({m:o.m,v:new THREE.Vector3(fx*spd*.9+jx,up*(o.pi===0?1.3:1)+Math.random()*2,fz*spd*.9+jz),w:new THREE.Vector3((Math.random()-.5)*14,(Math.random()-.5)*14,(Math.random()-.5)*14),t:0,bleed:2.5,lim:o.pi===5?'tor':'l',fl:o.pi===5?.15:.06,own:p});});}
  else{// whole model: Hit -> Death clip while flung
   play(p,'Hit',.05);setTimeout(()=>{if(p.dead&&p.A)play(p,'Death',.15);},250);PED.parts.push({m:p.g,v:new THREE.Vector3(fx*spd*.75,up,fz*spd*.75),w:new THREE.Vector3(0,(Math.random()-.5)*3,0),t:0,bleed:1.2,lim:'body',fl:.12,own:p});}
  spray(wp.x,1,wp.z,fx*spd,2,fz*spd,sev?40:16);pool(wp.x,wp.z,sev?1.6:1);
  st.v*=sev?.93:.88;p.respawn=45;if(PED.onKill)PED.onKill(p,wp.x,wp.z);p.wx=wp.x;p.wz=wp.z;console.log('PED hit',(spd*3.6).toFixed(0),'km/h',sev?'dismembered':'killed',p.t.name);};

 // ---- pedestrian speech: Piper TTS (ru_RU irina / dmitri / ruslan) pre-rendered opus, WebAudio panner 3D, cooldowns, max 2 at once, subtitles
 const VX={on:true,mat:true,vol:.8,man:null,buf:{},act:0,last:0,ctx:null,lst:0};PED.VX=VX;try{const c=JSON.parse(localStorage.getItem('pedvoice')||'null');if(c){VX.on=c.on;VX.vol=c.vol;if(c.mat!==undefined)VX.mat=c.mat;}}catch(e){}
 const vctx=()=>{if(window.AU&&AU.ac)return AU.ac;if(typeof AU!=='undefined'&&AU&&AU.ac)return AU.ac;if(!VX.ctx){try{VX.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return VX.ctx;};
 const vman=()=>{if(VX.man||VX.lm)return;VX.lm=1;fetch('snd/ped/phrases.json').then(r=>r.json()).then(j=>{VX.man=j;}).catch(e=>console.warn('ped voice manifest',e));};
 const vbuf=f=>{if(VX.buf[f])return VX.buf[f];const c=vctx();VX.buf[f]=fetch('snd/ped/'+f).then(r=>r.arrayBuffer()).then(a=>new Promise((ok,no)=>c.decodeAudioData(a,ok,no))).catch(e=>{console.warn('ped voice',f,e);return null;});return VX.buf[f];};
 const sub=document.createElement('div');sub.style.cssText='position:fixed;left:0;top:0;pointer-events:none;z-index:20';document.body.appendChild(sub);const SUBS=[];
 const say=(p,cat,force)=>{if(!VX.on||VX.vol<=0||!VX.man)return false;const now=performance.now()/1000;if(!force&&(VX.act>=2||now-VX.last<1.2||(p.vcd&&now<p.vcd)))return false;
  const sx=cat==='killer'?'M':/Female/.test(p.t.name)?'F':'M',LX=VX.mat&&VX.man[cat+'_x']&&VX.man[cat+'_x'][sx],L=LX&&Math.random()<.55?LX:VX.man[cat]&&VX.man[cat][sx];if(!L||!L.length)return false;const [f,txt]=L[Math.random()*L.length|0];p.vcd=now+(cat==='pain'?0:9+Math.random()*8);VX.last=now;VX.act++;
  const pos=p.g.position.clone();const el=document.createElement('div');el.textContent=txt;el.style.cssText='position:absolute;transform:translate(-50%,-100%);background:rgba(255,255,255,.9);color:#111;font:600 13px sans-serif;padding:3px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.4)'+(cat==='killer'?';background:rgba(30,0,0,.85);color:#f55':'');sub.appendChild(el);const S0={el,p,pos,t:2.2+txt.length*.05};SUBS.push(S0);
  const c=vctx();vbuf(f).then(b=>{if(!b||!c){VX.act--;return;}const src=c.createBufferSource();src.buffer=b;src.playbackRate.value=p.pitch||1;const pn=c.createPanner();pn.panningModel='HRTF';pn.distanceModel='inverse';pn.refDistance=3;pn.maxDistance=45;pn.rolloffFactor=1.3;
   const P=p.g.position;if(pn.positionX){pn.positionX.value=P.x;pn.positionY.value=1.6;pn.positionZ.value=P.z;}else pn.setPosition(P.x,1.6,P.z);const g=c.createGain();g.gain.value=VX.vol*(cat==='pain'?1.3:1);src.connect(g);g.connect(pn);pn.connect(c.destination);src.onended=()=>{VX.act=Math.max(0,VX.act-1);};src.start();S0.t=Math.max(S0.t,b.duration/(p.pitch||1)+.6);VX.n=(VX.n||0)+1;});return true;};
 PED.say=say;PED.vctx=vctx;PED.spawnChar=k=>{const p={};mk(p);if(k&&T[k]&&T[k].length&&p.kind!==k){S.remove(p.g);const t=T[k][Math.random()*T[k].length|0];const o=sclone(t.o);let sk=null;o.traverse(n=>{if(n.isSkinnedMesh)sk=n;});S.add(o);const mx=new THREE.AnimationMixer(o),A={},CL=retarget(t);for(const n in CL)A[n]=mx.clipAction(CL[n]);Object.assign(p,{g:o,sk,t,mx,A,kind:k,cur:null});}p.play=(n,f)=>play(p,n,f);return p;};
 const vlisten=()=>{const c=vctx();if(!c||!c.listener)return;const l=c.listener,P=new THREE.Vector3(),F=new THREE.Vector3(0,0,-1);const RC=chase?chaseCam:cam;RC.getWorldPosition(P);F.applyQuaternion(RC.getWorldQuaternion(new THREE.Quaternion()));if(l.positionX){l.positionX.value=P.x;l.positionY.value=P.y;l.positionZ.value=P.z;l.forwardX.value=F.x;l.forwardY.value=F.y;l.forwardZ.value=F.z;l.upX.value=0;l.upY.value=1;l.upZ.value=0;}else{l.setPosition(P.x,P.y,P.z);l.setOrientation(F.x,F.y,F.z,0,1,0);}};
 const vsubs=dt=>{const V=new THREE.Vector3(),PL=[];for(let i=SUBS.length-1;i>=0;i--){const S0=SUBS[i];S0.t-=dt;if(S0.t<=0){S0.el.remove();SUBS.splice(i,1);continue;}const src=S0.p.dead?S0.pos:S0.p.g.position;const RC=chase?chaseCam:cam;V.set(src.x,src.y+1.95,src.z).project(RC);const vis=V.z<1&&Math.abs(V.x)<1.1&&Math.abs(V.y)<1.1&&S0.p.g.position.distanceTo(RC.getWorldPosition(new THREE.Vector3()))<40;S0.el.style.display=vis?'block':'none';let sx2=(V.x+1)/2*innerWidth,sy2=(1-V.y)/2*innerHeight;if(vis){for(const q of PL)if(Math.abs(q[0]-sx2)<160&&Math.abs(q[1]-sy2)<24)sy2=q[1]-26;PL.push([sx2,sy2]);}S0.el.style.left=sx2+'px';S0.el.style.top=sy2+'px';S0.el.style.opacity=Math.min(1,S0.t*2);}};
 PED.honkT=0;PED.honk=()=>{PED.honkT=1.6;const c=vctx();if(!c)return;const t=c.currentTime,g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.02);g.gain.setValueAtTime(.18,t+.45);g.gain.linearRampToValueAtTime(0,t+.55);g.connect(c.destination);[415,520].forEach(fq=>{const o=c.createOscillator();o.type='square';o.frequency.value=fq;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1800;o.connect(f);f.connect(g);o.start(t);o.stop(t+.6);});};
 let HN=null;PED.hornOn=()=>{if(HN)return;const c=vctx();PED.honkT=1.6;if(!c)return;if(c.state==='suspended')c.resume();const t=c.currentTime,g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.02);g.connect(c.destination);const os=[415,520].map(fq=>{const o=c.createOscillator();o.type='square';o.frequency.value=fq;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1800;o.connect(f);f.connect(g);o.start(t);return o;});HN={g,os,c};};
 PED.hornOff=()=>{if(!HN)return;const {g,os,c}=HN,t=c.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0,t+.08);os.forEach(o=>o.stop(t+.1));HN=null;PED.honkT=1.6;};
 addEventListener('keydown',e=>{if(e.code==='KeyJ'&&!e.repeat)PED.hornOn();});addEventListener('keyup',e=>{if(e.code==='KeyJ')PED.hornOff();});
 {const hb=document.getElementById('hornB');if(hb){const dn=e=>{e.preventDefault();e.stopPropagation();hb.classList.add('on');PED.hornOn();},upf=e=>{hb.classList.remove('on');PED.hornOff();};hb.addEventListener('pointerdown',dn);hb.addEventListener('pointerup',upf);hb.addEventListener('pointercancel',upf);hb.addEventListener('pointerleave',upf);}}
 // settings: 'Речь пешеходов' + volume appended to the settings panel
 setTimeout(function addUI(){const pn=document.getElementById('gfxP');if(!pn){setTimeout(addUI,1000);return;}const d=document.createElement('div');d.style.cssText='margin-top:8px;border-top:1px solid #345;padding-top:6px';d.innerHTML='<b>🗣 Звук</b><div style="margin:4px 0"><label><input type="checkbox" id="pvOn"> Речь пешеходов</label> <label style="margin-left:8px"><input type="checkbox" id="pvMat"> Мат</label></div><div>Громкость речи: <span id="pvV"></span><input type="range" id="pvVol" min="0" max="1" step="0.05" style="width:100%"></div><div style="opacity:.6">Гудок: J</div>';pn.appendChild(d);
  const mt=d.querySelector('#pvMat');mt.checked=VX.mat;const on=d.querySelector('#pvOn'),vo=d.querySelector('#pvVol'),vv=d.querySelector('#pvV');on.checked=VX.on;vo.value=VX.vol;vv.textContent=Math.round(VX.vol*100)+'%';const sv=()=>{VX.mat=mt.checked;VX.on=on.checked;VX.vol=+vo.value;vv.textContent=Math.round(VX.vol*100)+'%';try{localStorage.setItem('pedvoice',JSON.stringify({on:VX.on,vol:VX.vol,mat:VX.mat}));}catch(e){}};on.onchange=sv;mt.onchange=sv;vo.oninput=sv;},500);
 // per-ped speech triggers (called from tick)
 const segD=(q,x,z)=>{const dx=q[2]-q[0],dz=q[3]-q[1],L2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-q[0])*dx+(z-q[1])*dz)/L2));return Math.hypot(q[0]+dx*t-x,q[1]+dz*t-z);};
 const vtrig=(p,dd,spd,dt)=>{if(!VX.on)return;if(dd>30)return;
  if(p.kind==='K'&&tod==2&&dd<16&&Math.random()<dt*.25){say(p,'killer');return;}
  if(PED.honkT>0&&dd<25&&Math.random()<dt*3){say(p,'angry');return;}
  if(spd>4&&dd<10&&p.q&&segD(p.q,st.x,st.z)<2.2){if(say(p,'scared')){p.flee=2.5;p.st='walk';play(p,'Run',.15);}return;}
  if(spd>6&&dd<3.6&&Math.random()<dt*6){say(p,'angry');return;}
  if(spd<3&&dd<12&&p.kind!=='K'&&Math.random()<dt*.12)say(p,'idle');};
 let fr=0;
 PED.tick=dt=>{dt=Math.min(dt,.05);fr++;if(!PED.ready)return;vman();if(HN)PED.honkT=1.6;else if(PED.honkT>0)PED.honkT-=dt;if(fr%2==0)vlisten();vsubs(dt);if(!PED.list.length){for(let i=0;i<NP;i++){const p={};mk(p);place(p);PED.list.push(p);}}
  const ch=Math.sin(st.h),cc=Math.cos(st.h),spd=Math.abs(st.v);
  for(const p of PED.list){if(p.dead){if(p.mx&&p.g.parent)p.mx.update(dt);p.respawn-=dt;if(p.respawn<=0&&Math.hypot(p.wx-st.x,p.wz-st.z)>60){S.remove(p.g);PED.parts=PED.parts.filter(o=>{if(o.own===p){S.remove(o.m);return false;}return true;});mk(p);place(p);}continue;}
   if(!p.q){if(Math.random()<.01)place(p);continue;}
   const rx=p.g.position.x-st.x,rz=p.g.position.z-st.z,dd=Math.hypot(rx,rz);
   // behaviour: walk / stand idle / talk / sit (rare), flee runs
   p.stT-=dt;if(p.stT<=0&&p.flee<=0){if(p.st==='walk'){const r=Math.random();p.st=r<.45?'idle':r<.85?'talk':'sit';p.stT=p.st==='sit'?12+Math.random()*20:4+Math.random()*8;play(p,p.st==='idle'?'Idle':p.st==='talk'?'Talk':'Sit',.4);}else{p.st='walk';p.stT=8+Math.random()*25;play(p,'Walk',.4);}}
   const moving=p.st==='walk'||p.flee>0;
   if(moving){const q=p.q;p.u+=p.dir*p.sp*dt*(p.flee>0?3:1)/q[4];if(p.u>1||p.u<0){const ex=p.u>1?q[2]:q[0],ez=p.u>1?q[3]:q[1];let nq=null;const l=GS[Math.floor(ex/gc)+','+Math.floor(ez/gc)];if(l)for(let t=0;t<8&&!nq;t++){const c=SEG[l[Math.random()*l.length|0]];if(c!==q){if(Math.hypot(c[0]-ex,c[1]-ez)<2){nq=c;p.u=0;p.dir=1;}else if(Math.hypot(c[2]-ex,c[3]-ez)<2){nq=c;p.u=1;p.dir=-1;}}}if(nq)p.q=nq;else{p.dir*=-1;p.u=Math.max(0,Math.min(1,p.u));}}}
   const Q2=p.q,dx=Q2[2]-Q2[0],dz=Q2[3]-Q2[1],LL=Q2[4],nx=-dz/LL,nz=dx/LL,x=Q2[0]+dx*p.u+nx*p.side,z=Q2[1]+dz*p.u+nz*p.side;
   if(Math.hypot(x-st.x,z-st.z)>220){place(p);continue;}
   p.g.position.set(x,.12,z);if(moving)p.g.rotation.y=Math.atan2(dx*p.dir,dz*p.dir);else if(p.st==='talk')p.g.rotation.y+=0;
   // LOD: hide > 130 m, animate every 4th frame > 45 m, shadows < 30 m
   const vis=dd<130;p.g.visible=vis;if(vis&&(dd<45||(fr+p.sp*100|0)%4==0))p.mx.update(dd<45?dt:dt*4);p.sk.castShadow=dd<30;
   if(p.flee>0){p.flee-=dt;if(p.flee<=0){play(p,'Walk',.3);p.st='walk';}}else if(spd>8&&dd<16&&(rx*ch+rz*cc)*Math.sign(st.v)>0&&Math.random()<dt*1.2){p.flee=2.5;p.st='walk';p.side+=(rx*cc-rz*ch>0?1:-1)*.8;play(p,'Run',.15);}
   vtrig(p,dd,spd,dt);
   const lx=rx*cc-rz*ch,lz=rx*ch+rz*cc;if(Math.abs(lx)<1.15&&Math.abs(lz)<2.6){if(spd>2.2){const fx=ch*Math.sign(st.v),fz=cc*Math.sign(st.v);hit(p,spd,fx+lx*.15*cc,fz-lx*.15*ch);}else if(moving)p.dir*=-1;}}
  for(let i=PED.parts.length-1;i>=0;i--){const o=PED.parts[i];o.t+=dt;if(o.rest){if(o.drop&&o.t>1){S.remove(o.m);PED.parts.splice(i,1);}continue;}o.v.y-=9.81*dt;o.m.position.addScaledVector(o.v,dt);
   if(o.lim!=='body'){o.m.rotation.x+=o.w.x*dt;o.m.rotation.y+=o.w.y*dt;o.m.rotation.z+=o.w.z*dt;}else o.m.rotation.y+=o.w.y*dt;
   if(o.bleed>0&&!o.drop){o.bleed-=dt;if(Math.random()<dt*25)spray(o.m.position.x,o.m.position.y+(o.lim==='body'?.9:0),o.m.position.z,o.v.x*.3,0,o.v.z*.3,1);}
   const floor=o.drop?.02:o.fl;if(o.m.position.y<floor){o.m.position.y=floor;if(o.drop){o.rest=1;o.t=0;if(Math.random()<.25)pool(o.m.position.x,o.m.position.z,.18+Math.random()*.2);continue;}
    if(Math.abs(o.v.y)>1.5){o.v.y*=-.25;o.v.x*=.55;o.v.z*=.55;o.w.multiplyScalar(.5);if(Math.random()<.7)pool(o.m.position.x,o.m.position.z,.35+Math.random()*.4);}else{o.v.set(0,0,0);o.w.set(0,0,0);o.rest=1;if(o.lim==='body')o.m.position.y=.12;pool(o.m.position.x,o.m.position.z,o.lim==='l'?.5:1.4);}}}
  PED.blood.forEach(m=>{const R=m.userData.R;if(m.scale.x<R)m.scale.setScalar(Math.min(R,m.scale.x+dt*R*.6));});
  if(PED.parts.length>500){const o=PED.parts.shift();if(o.drop)S.remove(o.m);}};
}
const NAV={on:false,route:null,dest:null,name:'',t:0,next:null};window.__NAV=NAV;window.__ST=st;window.__CAM=cam;window.__CAR=car;window.__RND=R;window.__SC=S;{
 const K=(x,z)=>Math.round(x*2)+','+Math.round(z*2),N=new Map(),P=[];const node=(x,z)=>{const k=K(x,z);let i=N.get(k);if(i===undefined){i=P.length;N.set(k,i);P.push([x,z,[]]);}return i;};
 const drv=C.r.filter(r=>!(r.k==='footway'||r.k==='path'||r.k==='steps'||r.k==='cycleway'||r.k==='pedestrian'));
 const OW=new Set();try{(window.SIGNS_OSM&&SIGNS_OSM.ow||[]).forEach(()=>{});}catch(e){}
 drv.forEach(r=>{for(let i=0;i<r.p.length-1;i++){const a=node(r.p[i][0],r.p[i][1]),b=node(r.p[i+1][0],r.p[i+1][1]);if(a===b)continue;const d=Math.hypot(P[a][0]-P[b][0],P[a][1]-P[b][1])*(r.w>=6?.85:r.w<3.5?1.3:1);P[a][2].push(b,d);P[b][2].push(a,d);}});
 // grid of nodes for nearest lookup
 const G={},gc=40;P.forEach((q,i)=>{const k=Math.floor(q[0]/gc)+','+Math.floor(q[1]/gc);(G[k]=G[k]||[]).push(i);});
 const near=(x,z)=>{let b=-1,bd=1e9;for(let r=0;r<6&&b<0;r++)for(let gx=-r;gx<=r;gx++)for(let gz=-r;gz<=r;gz++){const l=G[(Math.floor(x/gc)+gx)+','+(Math.floor(z/gc)+gz)];if(l)for(const i of l){const d=Math.hypot(P[i][0]-x,P[i][1]-z);if(d<bd&&P[i][2].length){bd=d;b=i;}}}return b;};
 const astar=(s0,t0)=>{const g=new Float64Array(P.length).fill(1e18),pr=new Int32Array(P.length).fill(-1),H=[];const h=i=>Math.hypot(P[i][0]-P[t0][0],P[i][1]-P[t0][1])*.85;
  const push=(f,i)=>{H.push([f,i]);let c=H.length-1;while(c){const p=(c-1)>>1;if(H[p][0]<=H[c][0])break;[H[p],H[c]]=[H[c],H[p]];c=p;}};
  const pop=()=>{const t=H[0],l=H.pop();if(H.length){H[0]=l;let c=0;for(;;){const a=2*c+1,b=a+1;let m=c;if(a<H.length&&H[a][0]<H[m][0])m=a;if(b<H.length&&H[b][0]<H[m][0])m=b;if(m===c)break;[H[m],H[c]]=[H[c],H[m]];c=m;}}return t;};
  g[s0]=0;push(h(s0),s0);let n=0;while(H.length&&n++<400000){const [,i]=pop();if(i===t0)break;const e=P[i][2];for(let j=0;j<e.length;j+=2){const v=e[j],nd=g[i]+e[j+1];if(nd<g[v]){g[v]=nd;pr[v]=i;push(nd+h(v),v);}}}
  if(pr[t0]<0&&s0!==t0)return null;const out=[];for(let i=t0;i>=0;i=pr[i])out.push([P[i][0],P[i][1]]);return out.reverse();};
 // destinations: OSM addresses + named buildings
 const D=[];const A=window.ADDR;if(A)A.h.forEach(h=>{if(h[2]>=0)D.push([A.n[h[2]]+', '+h[3],h[0],h[1]]);});C.b.forEach(b=>{if(b.n){let x=0,z=0;b.p.forEach(q=>{x+=q[0];z+=q[1];});D.push([b.n,x/b.p.length,z/b.p.length]);}});NAV.D=D;
 NAV.go=(x,z,name)=>{const s0=near(st.x,st.z),t0=near(x,z);if(s0<0||t0<0)return false;const r=astar(s0,t0);if(!r)return false;r.unshift([st.x,st.z]);r.push([x,z]);NAV.route=r;NAV.dest=[x,z];NAV.name=name||'';NAV.on=true;NAV.ri=0;let L=0;for(let i=1;i<r.length;i++)L+=Math.hypot(r[i][0]-r[i-1][0],r[i][1]-r[i-1][1]);NAV.len=L;console.log('NAV route',r.length,'pts',L.toFixed(0),'m to',name);return true;};
 NAV.stop=()=>{NAV.on=false;NAV.route=null;};
 NAV.path=(x0,z0,x1,z1)=>{const a=near(x0,z0),b=near(x1,z1);if(a<0||b<0)return null;const r=astar(a,b);return r;};NAV.nodeAt=(x,z,dmin,dmax)=>{for(let t=0;t<60;t++){const a=Math.random()*6.283,d=dmin+Math.random()*(dmax-dmin),i=near(x+Math.cos(a)*d,z+Math.sin(a)*d);if(i>=0){const q=P[i];const dd=Math.hypot(q[0]-x,q[1]-z);if(dd>dmin*.8&&dd<dmax*1.2)return [q[0],q[1]];}}return null;};
 // progress, off-route reroute, next manoeuvre
 NAV.tick=dt=>{if(!NAV.on||!NAV.route)return;const r=NAV.route;let bi=NAV.ri,bd=1e9;for(let i=Math.max(0,NAV.ri-2);i<Math.min(r.length-1,NAV.ri+40);i++){const a=r[i],b=r[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((st.x-a[0])*dx+(st.z-a[1])*dz)/L2)),d=Math.hypot(a[0]+dx*t-st.x,a[1]+dz*t-st.z);if(d<bd){bd=d;bi=i;}}NAV.ri=bi;
  if(Math.hypot(st.x-NAV.dest[0],st.z-NAV.dest[1])<25){NAV.arrived=3;NAV.stop();return;}
  NAV.t-=dt;if(bd>30&&NAV.t<=0){NAV.t=3;NAV.go(NAV.dest[0],NAV.dest[1],NAV.name);NAV.re=2;return;}
  let rem=Math.hypot(r[bi+1][0]-st.x,r[bi+1][1]-st.z);for(let i=bi+1;i<r.length-1;i++)rem+=Math.hypot(r[i+1][0]-r[i][0],r[i+1][1]-r[i][1]);NAV.rem=rem;
  // next turn: first vertex ahead where heading changes > 35 deg
  let i0=bi+1;while(i0<r.length-1&&Math.hypot(r[i0][0]-st.x,r[i0][1]-st.z)<15)i0++;let dist=Math.hypot(r[i0][0]-st.x,r[i0][1]-st.z);NAV.next=null;for(let i=Math.max(1,i0);i<r.length-1;i++){const a1=Math.atan2(r[i][0]-r[i-1][0],r[i][1]-r[i-1][1]),a2=Math.atan2(r[i+1][0]-r[i][0],r[i+1][1]-r[i][1]);let da=a2-a1;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)>.6&&Math.hypot(r[i+1][0]-r[i][0],r[i+1][1]-r[i][1])>2){NAV.next={d:dist,dir:da>0?-1:1,sharp:Math.abs(da)>2};break;}dist+=Math.hypot(r[i+1][0]-r[i][0],r[i+1][1]-r[i][1]);if(dist>1500)break;}};
 NAV.txt=()=>{if(NAV.arrived>0)return '🏁 Вы прибыли';if(!NAV.on)return '';const n=NAV.next,f=d=>d<1000?(Math.round(d/10)*10)+' м':(d/1000).toFixed(1)+' км';const ar=!n?'↑':n.sharp?(n.dir<0?'↰':'↱'):(n.dir<0?'←':'→');return ar+' '+(n?f(n.d):f(NAV.rem||0))+'  ·  '+f(NAV.rem||0)+' · '+Math.max(1,Math.round((NAV.rem||0)/9/60))+' мин';};
 // draw route on the CID map (same transform as the map image)
 NAV.draw=(g,MS,lw)=>{if(!NAV.on||!NAV.route)return;const r=NAV.route;g.strokeStyle='rgba(63,168,255,.95)';g.lineWidth=lw||5/1.5;g.lineJoin='round';g.beginPath();for(let i=Math.max(0,NAV.ri);i<r.length;i++){const x=(r[i][0]-st.x)*MS,y=(r[i][1]-st.z)*MS;i===Math.max(0,NAV.ri)?g.moveTo(0,0):g.lineTo(x,y);}g.stroke();const d=NAV.dest;g.fillStyle='#ff4a3a';g.beginPath();g.arc((d[0]-st.x)*MS,(d[1]-st.z)*MS,5,0,6.3);g.fill();};

 // HUD minimap (chase + cabin) and on-road chevrons
 {const mm=document.createElement('canvas');mm.id='navMM';mm.width=mm.height=180;mm.style.cssText='position:fixed;left:8px;bottom:8px;width:'+(mobile?120:170)+'px;height:'+(mobile?120:170)+'px;border-radius:50%;z-index:12;display:none;box-shadow:0 0 0 2px rgba(255,255,255,.25)';document.body.appendChild(mm);const mg=mm.getContext('2d');let fc=0;
  const at=document.createElement('canvas');at.width=128;at.height=128;{const g=at.getContext('2d');g.fillStyle='rgba(63,168,255,1)';g.beginPath();g.moveTo(64,10);g.lineTo(118,70);g.lineTo(92,70);g.lineTo(64,40);g.lineTo(36,70);g.lineTo(10,70);g.closePath();g.fill();g.beginPath();g.moveTo(64,58);g.lineTo(118,118);g.lineTo(92,118);g.lineTo(64,88);g.lineTo(36,118);g.lineTo(10,118);g.closePath();g.fill();}
  const aT=new THREE.CanvasTexture(at),aM=new THREE.MeshBasicMaterial({map:aT,transparent:true,opacity:.95,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,toneMapped:false}),aG=new THREE.PlaneGeometry(3,5).rotateX(-Math.PI/2);
  const RC=new THREE.Raycaster(),YC=new Map(),DN=new THREE.Vector3(0,-1,0),OV=new THREE.Vector3();let RCH=null;NAV.ry=(x,z)=>{const k=Math.round(x)+','+Math.round(z);let y=YC.get(k);if(y!==undefined)return y;if(!RCH)RCH=CHUNKS.filter(m=>m.material===roadM);OV.set(x,30,z);RC.set(OV,DN);const h=RC.intersectObjects(RCH,false);y=h.length?h[0].point.y:.05;if(YC.size>4000)YC.clear();YC.set(k,y);return y;};const AR=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(aG,aM);m.visible=false;m.renderOrder=2;S.add(m);AR.push(m);}NAV.AR=AR;
  NAV.hud=()=>{const vis=NAV.on&&NAV.route;mm.style.display=vis?'block':'none';AR.forEach(a=>a.visible=false);if(!vis)return;const r=NAV.route;
   // chevrons: along route from 8 m ahead, every 7 m, up to ~95 m
   let k=0,acc=0,need=12;for(let i=Math.max(0,NAV.ri);i<r.length-1&&k<AR.length;i++){const a=r[i],b=r[i+1];let L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<.01)continue;let u=0;if(i===NAV.ri){const dx=b[0]-a[0],dz=b[1]-a[1];u=Math.max(0,Math.min(L,((st.x-a[0])*dx+(st.z-a[1])*dz)/L));}
    while(u+need<=L&&k<AR.length){u+=need;need=9;const t=u/L,m=AR[k++];const px=a[0]+(b[0]-a[0])*t,pz=a[1]+(b[1]-a[1])*t;m.position.set(px,NAV.ry(px,pz)+.04,pz);m.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1])+Math.PI;m.visible=true;}need-=(L-u);if(need<=0)need=9;acc+=L;if(acc>110)break;}
   if((fc++)%3)return;const g=mg,W=180;g.save();g.clearRect(0,0,W,W);g.beginPath();g.arc(90,90,90,0,6.3);g.clip();g.fillStyle='#16202a';g.fillRect(0,0,W,W);g.translate(90,105);g.rotate(Math.PI+st.h);g.scale(.9,.9);g.drawImage(mapC,-mapC.width/2-st.x*MS,-mapC.height/2-st.z*MS);NAV.draw(g,MS,6);g.restore();
   g.fillStyle='#fff';g.beginPath();g.moveTo(90,93);g.lineTo(98,113);g.lineTo(90,108);g.lineTo(82,113);g.fill();const n=NAV.next;if(n){g.fillStyle='rgba(4,8,14,.75)';g.fillRect(40,6,100,26);g.fillStyle='#fff';g.font='bold 15px sans-serif';g.textAlign='center';g.fillText(NAV.txt().split('  ·')[0],90,25);}};}
 // UI: ⌖ button / G key -> search panel (datalist of OSM addresses + named buildings)
 const ui=document.getElementById('ui');if(ui){const b=document.createElement('b');b.id='bNav';b.title='Навигация (G)';b.textContent='⌖';ui.insertBefore(b,ui.firstChild);
  const pn=document.createElement('div');pn.id='navP';pn.style.cssText='position:fixed;top:54px;right:8px;z-index:30;background:rgba(8,12,18,.92);color:#fff;padding:10px;border-radius:10px;font:14px sans-serif;display:none;width:min(340px,86vw)';
  pn.innerHTML='<div style="margin-bottom:6px">Навигация — куда едем?</div><input id="navI" list="navL" placeholder="ул. Набережная, 12 / школа…" style="width:100%;box-sizing:border-box;padding:6px;border-radius:6px;border:0"><datalist id="navL"></datalist><div style="margin-top:8px;display:flex;gap:6px"><button id="navGo">Маршрут</button><button id="navX">Сброс</button><span id="navM" style="color:#8ea0b4"></span></div>';document.body.appendChild(pn);
  const dl=pn.querySelector('#navL');const fill=q=>{q=(q||'').toLowerCase();dl.innerHTML='';let n=0;for(const d of D){if(!q||d[0].toLowerCase().includes(q)){const o=document.createElement('option');o.value=d[0];dl.appendChild(o);if(++n>40)break;}}};fill('');
  const inp=pn.querySelector('#navI');inp.oninput=()=>fill(inp.value);inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')pn.querySelector('#navGo').click();};
  pn.querySelector('#navGo').onclick=()=>{const v=inp.value.toLowerCase();const d=D.find(d=>d[0].toLowerCase()===v)||D.find(d=>d[0].toLowerCase().includes(v));const m=pn.querySelector('#navM');if(!d){m.textContent='не найдено';return;}m.textContent=NAV.go(d[1],d[2],d[0])?Math.round(NAV.len)+' м':'нет пути';if(NAV.on)setTimeout(()=>pn.style.display='none',600);};
  pn.querySelector('#navX').onclick=()=>{NAV.stop();pn.style.display='none';};
  const tg=()=>{pn.style.display=pn.style.display==='none'?'block':'none';if(pn.style.display==='block')inp.focus();};b.onclick=tg;addEventListener('keydown',e=>{if(e.code==='KeyG'&&document.activeElement!==inp)tg();});}
 {const m=/[?&]nav=(-?\d+),(-?\d+)/.exec(Q);if(m)setTimeout(()=>NAV.go(+m[1],+m[2],'точка'),1500);const m2=/[?&]navto=([^&]+)/.exec(Q);if(m2)setTimeout(()=>{const v=decodeURIComponent(m2[1]).toLowerCase(),d=D.find(d=>d[0].toLowerCase().includes(v));if(d)NAV.go(d[1],d[2],d[0]);},1500);}
}
// ---------- current address (OSM street names + addr:housenumber), ~1 Hz, spatial index ----------
const ADR={txt:'Лыткарино',t:0};window.__ADR=ADR;{const A=window.ADDR;if(A){const G={},HG={},c=50;A.s.forEach(([ni,q])=>{for(let i=0;i<q.length-1;i++){const a=q[i],b=q[i+1];for(let gx=Math.floor(Math.min(a[0],b[0])/c);gx<=Math.floor(Math.max(a[0],b[0])/c);gx++)for(let gz=Math.floor(Math.min(a[1],b[1])/c);gz<=Math.floor(Math.max(a[1],b[1])/c);gz++)(G[gx+','+gz]=G[gx+','+gz]||[]).push([a,b,ni]);}});
 A.h.forEach(h=>{(HG[Math.floor(h[0]/c)+','+Math.floor(h[1]/c)]=HG[Math.floor(h[0]/c)+','+Math.floor(h[1]/c)]||[]).push(h);});
 const sh=n=>n.replace(/^улица /,'ул. ').replace(/ улица$/,' ул.').replace(/^проспект /,'пр-т ').replace(/ проспект$/,' пр-т').replace(/^переулок /,'пер. ').replace(/ переулок$/,' пер.').replace(/^шоссе /,'ш. ').replace(/ шоссе$/,' ш.').replace(/^проезд /,'пр. ').replace(/ проезд$/,' пр.').replace(/^бульвар /,'б-р ').replace(/ бульвар$/,' б-р');
 ADR.upd=()=>{const x=st.x,z=st.z,gx=Math.floor(x/c),gz=Math.floor(z/c);let bd=40,bn=-1;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)(G[(gx+a)+','+(gz+b)]||[]).forEach(e=>{const d=segD(x,z,e[0],e[1])[0];if(d<bd){bd=d;bn=e[2];}});
  let t=bn>=0?sh(A.n[bn]):'Лыткарино';if(Math.abs(st.v)<4){let hd=35,hh=null;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)(HG[(gx+a)+','+(gz+b)]||[]).forEach(h=>{if(bn>=0&&h[2]!==bn&&h[2]>=0)return;const d=Math.hypot(h[0]-x,h[1]-z);if(d<hd){hd=d;hh=h;}});if(hh)t+=', '+hh[3];}ADR.txt=t;const e=document.getElementById('adrHud');if(e&&!(window.__NAV&&(__NAV.on||__NAV.arrived>0)))e.textContent=t;};}
 const d=document.createElement('div');d.id='adrHud';d.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:6px;padding:2px 10px;border-radius:10px;background:rgba(10,16,24,.55);color:#dfe8f0;font:12px sans-serif;pointer-events:none;z-index:40;white-space:nowrap';document.body.appendChild(d);
 setInterval(()=>{try{ADR.upd&&ADR.upd();}catch(e){}},1000);}
// ---------- BMW features: Start/Stop, indicators, cruise, PDC + rear camera, HUD, EPB/Auto Hold, Launch, ambient ----------
function blip(f,d,v){if(!AU)return;const o=AU.ac.createOscillator(),g=AU.ac.createGain();o.type='square';o.frequency.value=f;g.gain.value=v||.05;o.connect(g);g.connect(AU.ac.destination);const t=AU.ac.currentTime;g.gain.setTargetAtTime(0,t+d*.6,d*.2);o.start(t);o.stop(t+d+.05);}
function engineToggle(){if(st.on){st.on=false;st.cruise=0;return;}if(Math.abs(st.v)>1)return;st.on=true;st.crank=.9;blip(90,.5,.06);setTimeout(()=>blip(140,.25,.05),250);}
function ind(d){if(d==='h'){st.haz=!st.haz;return;}st.ind=st.ind===d?0:d;st.indArm=0;}
function cruise(){if(st.cruise)st.cruise=0;else if(st.on&&st.v>8)st.cruise=st.v;}
const AMBC=[0xff9248,0x6fc8ff,0xff3040,0xa060ff,0x40e080,0xffffff];let ambI=0;function ambApply(){try{AMBC;}catch(e){return;}const k=tod==2?1.6:tod==1?1:.55;mAmb.color.setHex(AMBC[ambI]).multiplyScalar(k);ambL.color.setHex(AMBC[ambI]);ambL.intensity=tod==2?.45:.25;if(XM.disp)XM.disp.material.color.setScalar(tod==2?.8:1);}function ambient(){ambI=(ambI+1)%AMBC.length;ambApply();}{const m=/amb=(\d)/.exec(Q);if(m)ambI=+m[1]%AMBC.length;}setTimeout(ambApply,0);
// HUD on windshield
const hudC=document.createElement('canvas');hudC.width=256;hudC.height=128;const hudG=hudC.getContext('2d'),hudT=new THREE.CanvasTexture(hudC);
const hudM=new THREE.Mesh(new THREE.PlaneGeometry(.3,.15),new THREE.MeshBasicMaterial({map:hudT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));hudM.position.set(-.37,1.16,-.92);hudM.rotation.x=.08;hudM.scale.set(.8,.8,1);cab.add(hudM);hudM.visible=false;
function drawHud(){const g=hudG;g.clearRect(0,0,256,128);g.fillStyle='rgba(120,230,255,.95)';g.textAlign='center';g.font='bold 54px sans-serif';g.fillText(Math.round(Math.abs(st.v)*3.6),90,70);g.font='16px sans-serif';g.fillText('км/ч',90,92);
 g.font='bold 30px sans-serif';g.fillText(st.sel==='D'?'D'+(st.g+1):st.sel,190,62);if(st.cruise){g.font='14px sans-serif';g.fillText('⏲ '+Math.round(st.cruise*3.6),190,92);}hudT.needsUpdate=true;}
// rear camera (shown over centre screen in R)
// BMW-style rear view camera: full CID takeover (cam view left 68% + top-down PDC tile right), tailgate camera on the model
const RCW=470,RCV=688,RCH=254;const rcRT=new THREE.WebGLRenderTarget(mobile?288:416,mobile?156:224),rcCam=new THREE.PerspectiveCamera(78,RCW/RCH,.05,120);rcCam.position.set(0,1.0,-2.47);rcCam.rotation.set(-.35,0,0,'YXZ');car.add(rcCam);window.__RCRT=rcRT;
const rcC=cv(RCV*2,RCH*2,()=>{}),rcCg=rcC.getContext('2d');rcCg.scale(2,2);const rcOv=new THREE.CanvasTexture(rcC);rcOv.encoding=THREE.sRGBEncoding;
rcG.position.set(.09,1.045,-.733);rcG.rotation.x=-.16;cab.add(rcG);
const rcScr=new THREE.Mesh(new THREE.PlaneGeometry(.344*RCW/RCV,.127),new THREE.MeshBasicMaterial({map:rcRT.texture,toneMapped:false}));rcScr.position.x=-.172+.172*RCW/RCV;rcScr.scale.x=-1;rcScr.material.side=THREE.DoubleSide;rcG.add(rcScr);
const rcLn=new THREE.Mesh(new THREE.PlaneGeometry(.344,.127),new THREE.MeshBasicMaterial({map:rcOv,transparent:true,toneMapped:false}));rcLn.position.z=.001;rcG.add(rcLn);rcG.visible=false;
let rcHold=0,rcWas=false;const RCS=(/rcst=(-?[\d.]+)/.exec(Q)||[0,null])[1];const rcV=new THREE.Vector3();
function drawRC(){const g=rcCg;g.clearRect(0,0,RCV,RCH);rcCam.updateMatrixWorld();car.updateMatrixWorld();
 const P=(x,z)=>{rcV.set(x,0.02,-z);car.localToWorld(rcV);rcV.project(rcCam);return rcV.z<1&&rcV.z>-1?[(1-(rcV.x+1)/2)*RCW,(1-(rcV.y+1)/2)*RCH]:null;};
 const line=(pts,c,w)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();let f=1;pts.forEach(q=>{if(!q){f=1;return;}g[f?'moveTo':'lineTo'](q[0],q[1]);f=0;});g.stroke();};
 const zr=2.42; // rear bumper distance behind the car centre (car frame: +z = front, guide lines drawn at -z)
 // static distance zones (straight back, car width)
 [[0,.5,'#ff3030'],[.5,1.2,'#ffc020'],[1.2,3,'#30d060']].forEach(([a,b,c])=>{line([P(-.98,zr+a),P(-.98,zr+b)],c,3);line([P(.98,zr+a),P(.98,zr+b)],c,3);line([P(-.98,zr+b),P(-.75,zr+b)],c,3);line([P(.98,zr+b),P(.75,zr+b)],c,3);});
 // dynamic trajectory: bicycle model on rear axle (wheelbase 2.97, rear axle z=+1.49), bends with steering
 const dl=(RCS!==null?RCS:st.steer)*.6,L2=2.97,ax=1.49;const pts=s=>{const out=[];for(let d=0;d<=3.2;d+=.2){let x,z;if(Math.abs(dl)<1e-3){x=s;z=ax+d;}else{const Rr=L2/Math.tan(dl),th=d/Rr;x=Rr-(Rr-s)*Math.cos(th);z=ax+(Rr-s)*Math.sin(th);}if(z>=zr-.05)out.push(P(x,z));}return out;};
 line(pts(-.86),'rgba(80,200,255,.95)',4);line(pts(.86),'rgba(80,200,255,.95)',4);
 // camera labels
 g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,0,RCW,24);g.fillStyle='#fff';g.font='13px sans-serif';g.textAlign='left';g.fillText('◉ Камера заднего вида',10,17);g.textAlign='right';g.fillText('R',RCW-10,17);
 // top-down tile with PDC arcs
 g.fillStyle='#070b10';g.fillRect(RCW,0,RCV-RCW,RCH);g.fillStyle='#000';g.fillRect(RCW,0,3,RCH);const cx=RCW+(RCV-RCW)/2,cy=RCH*.4;
 g.fillStyle='#2a3542';g.beginPath();g.roundRect?g.roundRect(cx-26,cy-58,52,116,14):g.rect(cx-26,cy-58,52,116);g.fill();g.fillStyle='#0d1218';g.fillRect(cx-20,cy-30,40,30);g.fillRect(cx-20,cy+22,40,22);g.fillStyle='#3a4a5c';g.fillRect(cx-30,cy-40,4,18);g.fillRect(cx+26,cy-40,4,18);
 const d=st.pdc,col=d<.6?'#ff3030':d<1.4?'#ffc020':'#30d060';
 for(let k=0;k<4;k++){const lim=[.3,.6,1.4,2.5][k];const on=d<2.5&&d<=lim+.0001||false;g.strokeStyle=d<2.5&&d<=[2.5,1.4,.6,.3][3-k]?col:'#1c2733';g.lineWidth=6;g.beginPath();g.arc(cx,cy+58,22+k*13,Math.PI*.15,Math.PI*.85);g.stroke();}
 g.fillStyle=d<2.5?col:'#8ea0b4';g.font='bold 16px sans-serif';g.textAlign='center';g.fillText(d<2.5?(d<.3?'STOP':(d*100|0)+' см'):'—',cx,RCH-12);
 rcOv.needsUpdate=true;}

function pdcDist(){const s=Math.sin(st.h),c=Math.cos(st.h);let best=9;const dirs=st.sel==='R'?-1:1;for(let d=0;d<=3;d+=.25)for(const ax of[-.8,0,.8]){const bz=dirs*(2.4+d),px=st.x+ax*c+bz*s,pz=st.z-ax*s+bz*c;if(hit(px,pz)||AI.some(o=>Math.hypot(o.g.position.x-px,o.g.position.z-pz)<1.6)){best=Math.min(best,d);}}return best;}
let pdcT=0,indT=0,indOn=false;
function featTick(dt){indT+=dt;if(indT>.333){indT=0;indOn=!indOn;if(st.ind||st.haz)blip(indOn?1800:1200,.03,.04);}
 if(st.ind&&Math.abs(st.steer)>.5)st.indArm=1;if(st.ind&&st.indArm&&Math.abs(st.steer)<.1)st.ind=0;
 st.pdc=9;if(st.on&&(st.sel==='R'||(st.sel==='D'&&Math.abs(st.v)<3))){st.pdc=pdcDist();if(st.pdc<2.5){pdcT-=dt;if(pdcT<=0){blip(2400,.06,.05);pdcT=st.pdc<.4?.07:.1+st.pdc*.25;}}}
 {const kmh=st.v*3.6;if(st.sel==='R'&&st.on){rcHold=8;rcWas=true;}else if(rcWas){rcHold-=dt;if(rcHold<=0||(st.sel==='D'&&Math.abs(kmh)>15)||!st.on)rcWas=false;}rcG.visible=rcWas;{const on=st.on&&(st.sel==='R'||st.rev);RVL.forEach(l=>{l.intensity+=((on?(tod==2?7:tod==1?4:1.2):0)-l.intensity)*Math.min(1,dt*12);l.visible=l.intensity>.05;});rcScr.material.color.setScalar(tod==2?2.4:tod==1?1.5:1);}if(rcWas&&fr%4==0)drawRC();}hudM.visible=!!st.hud&&st.on;if(st.hud&&fr%3==0)drawHud();}
let rcF=0;function renderRearCam(){if(!rcG.visible||!cab.visible)return;if((rcF++)%(mobile?3:2))return;const bv=body.visible;body.visible=true;cab.visible=false;const gv=GRASS.m&&GRASS.m.visible;if(GRASS.m)GRASS.m.visible=false;R.setRenderTarget(rcRT);R.render(S,rcCam);if(GRASS.m)GRASS.m.visible=gv;R.setRenderTarget(null);body.visible=bv;cab.visible=true;}
// small popup menu
{const ui=document.getElementById('ui');const mk=(id,t,ti)=>{const b=document.createElement('b');b.id=id;b.textContent=t;b.title=ti;return b;};
 const pw=mk('bPow','⏻','Start/Stop (Enter)');ui.insertBefore(pw,ui.firstChild);const mn=mk('bMenu','≡','Функции BMW');ui.insertBefore(mn,pw.nextSibling);
 const pop=document.createElement('div');pop.id='pop';document.body.appendChild(pop);
 const items=[['◀',()=>ind(-1),'Поворотник (Z)'],['▶',()=>ind(1),'Поворотник (X)'],['⚠',()=>ind('h'),'Аварийка (H)'],['⏲',cruise,'Круиз (C)'],['HUD',()=>st.hud=!st.hud,'Проекция (U)'],['Ⓐ',()=>st.autohold=!st.autohold,'Auto Hold (O)'],['Ⓟ',()=>st.epb=!st.epb,'Электроручник (J)'],['🎨',ambient,'Подсветка (K)']];
 items.forEach(([t,f,ti])=>{const b=document.createElement('b');b.textContent=t;b.title=ti;b.onclick=e=>{e.stopPropagation();f();};b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();f();},{passive:false});pop.appendChild(b);});
 const tg=e=>{e&&e.preventDefault();pop.classList.toggle('on');};mn.onclick=tg;mn.addEventListener('touchstart',tg,{passive:false});
 pw.onclick=()=>{audioInit();engineToggle();};pw.addEventListener('touchstart',e=>{e.preventDefault();audioInit();engineToggle();},{passive:false});
 addEventListener('keydown',e=>{const c=e.code;if(c=='Enter'){audioInit();engineToggle();}if(c=='KeyZ'||c=='KeyQ')ind(-1);if(c=='KeyX')ind(1);if(c=='KeyH')ind('h');if(c=='KeyC')cruise();if(c=='KeyU')st.hud=!st.hud;if(c=='KeyO')st.autohold=!st.autohold;if(c=='KeyJ')st.epb=!st.epb;if(c=='KeyK')ambient();});}
{const m=/sel=([PRND])/.exec(Q);if(m){st.sel=m[1];updGsel();}if(Q.includes('hud'))st.hud=true;if(Q.includes('ind'))st.ind=1;if(Q.includes('amb')&&!/amb=\d/.test(Q))ambient();}
setTimeout(()=>{const i=document.getElementById('info');if(i)i.style.opacity='0';},9000);
{const ui=document.getElementById('ui');const b=document.createElement('b');b.id='bCam';b.textContent='🎥';b.title='Вид (V)';ui.insertBefore(b,document.getElementById('fs'));const f=e=>{e&&e.preventDefault();setChase(!chase);};b.onclick=f;b.addEventListener('touchstart',f,{passive:false});addEventListener('keydown',e=>{if(e.code=='KeyV')setChase(!chase);});if(Q.includes('chase'))setChase(true);}
// ---------- weather: rain / heavy rain, wet road, windshield droplets, wipers (BMW stalk modes incl. auto rain sensor) ----------
const WX={w:+((/[?&]rain(=(\d))?/.exec(Q)||[0,0,0,'0'])[2]||(/[?&]rain/.test(Q)?1:0)),wm:/[?&]wip=(\d)/.test(Q)?+/[?&]wip=(\d)/.exec(Q)[1]:4,mu:1,ph:0,a:0,aPrev:0,cyc:0,intT:0,drops:0,ws:null,blades:[],t:0,sndT:0};
WX.w=Math.min(2,WX.w);window.__WX=WX;
{// rain streaks: one LineSegments draw call, animated fully in the vertex shader around the camera
 const N=mobile?3000:9000,pos=new Float32Array(N*6),e=new Float32Array(N*2);for(let i=0;i<N;i++){const x=Math.random(),y=Math.random(),z=Math.random();pos.set([x,y,z,x,y,z],i*6);e[i*2]=0;e[i*2+1]=1;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('e',new THREE.BufferAttribute(e,1));
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uC:{value:new THREE.Vector3()},uT:{value:0},uB:{value:new THREE.Vector3(36,22,36)},uL:{value:.55},uA:{value:.32},uCar:{value:new THREE.Matrix4()},uW:{value:new THREE.Vector2(.6,.2)}},
  vertexShader:`attribute float e;uniform vec3 uC,uB;uniform float uT,uL;uniform mat4 uCar;uniform vec2 uW;varying float vA,vE;void main(){vec3 p=position*uB;float sp=8.5+position.x*2.5;p.y=mod(p.y-uT*sp,uB.y);
   vec3 w=vec3(uC.x+mod(p.x-uC.x+uB.x*.5,uB.x)-uB.x*.5,uC.y+p.y-uB.y*.45,uC.z+mod(p.z-uC.z+uB.z*.5,uB.z)-uB.z*.5);
   float k=1.0-e;w.y+=uL*k;w.xz+=uW*k;vE=e;
   vec3 l=(uCar*vec4(w,1.0)).xyz;vA=(abs(l.x)<1.15&&l.y<1.85&&abs(l.z)<2.55)?0.0:1.0;float d=length(w-uC);vA*=smoothstep(34.0,6.0,d)*smoothstep(.4,2.0,d);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.0);}`,
  fragmentShader:`uniform float uA;varying float vA,vE;void main(){float a=uA*vA*vE*vE;if(a<.004)discard;gl_FragColor=vec4(.72,.77,.84,a);}`});
 const L=new THREE.LineSegments(g,m);L.frustumCulled=false;L.renderOrder=5;L.visible=false;S.add(L);WX.L=L;WX.N=N;}
// wet road env reflection (tiny cube from canvases)
{const f=(top)=>cv(8,8,(g)=>{const gr=g.createLinearGradient(0,0,0,8);gr.addColorStop(0,top?'#aab4bf':'#7c8792');gr.addColorStop(1,top?'#8c96a2':'#2c3036');g.fillStyle=gr;g.fillRect(0,0,8,8);});
 const sd=f(0);WX.env=new THREE.CubeTexture([sd,sd,f(1),cv(8,8,g=>{g.fillStyle='#222';g.fillRect(0,0,8,8);}),sd,sd]);WX.env.needsUpdate=true;WX.road0={r:roadM.roughness,c:roadM.color.clone()};}
function weatherApply(){const w=WX.w,t=tod;WX.mu=[1,.78,.66][w];if(window.__GND)__GND.U.uWet.value=[0,.6,1][w];WX.L.visible=w>0;WX.L.geometry.setDrawRange(0,((w==2?WX.N:WX.N*.5)*GSET.rain|0)*2);WX.L.material.uniforms.uL.value=w==2?1.15:.85;WX.L.material.uniforms.uA.value=(w==2?.3:.22)*(t==2?.7:1);
 if(w){const g=[[0x7d8892,0x5a636c,0x1a1e24],[0x5f6870,0x454c54,0x121518]][w-1][t];S.background=new THREE.Color(g);S.fog.color.setHex(g);S.fog.near=(w==2?25:45)*Math.max(1,GSET.dist*.7);S.fog.far=(w==2?230:340)*Math.max(1,GSET.dist*.7);sun.intensity*=w==2?.25:.4;if(hemi)hemi.intensity*=.85;
  roadM.roughness=1;roadM.color.copy(WX.road0.c);if(window.__ROADU)__ROADU.uWetA.value=w==2?1:.7;roadM.envMap=WX.env;roadM.envMapIntensity=w==2?.9:.6;}
 else{S.fog.near=Q.includes("city")?9000:120;S.fog.far=Q.includes("city")?20000:650*Math.max(1,GSET.dist);S.fog.near=Q.includes("city")?9000:120*Math.max(1,GSET.dist);roadM.roughness=WX.road0.r;roadM.color.copy(WX.road0.c);roadM.envMap=null;if(window.__ROADU)__ROADU.uWetA.value=0;}
 roadM.needsUpdate=true;if(WX.ws){WX.ws.visible=w>0||WX.drops>0;const U=WX.ws.material.uniforms;U.uSky.value.set(S.fog.color).multiplyScalar(t==2?1.6:1.15);U.uGnd.value.set(S.fog.color).multiplyScalar(.18);U.uK.value=t==2?.5:1;}}
function setWeather(w){WX.w=w;applyTod();}
function wiperMode(m){WX.wm=m;}
// windshield (fitted to the model's WINDOWS mesh in the cabin clone) + droplet canvas + blades
function buildWS(){const cx=XM.cab;let W8=null;cx.traverse(q=>{if(q.isMesh&&q.name=='Body_8')W8=q;});if(!W8)return false;cab.updateMatrixWorld(true);
 const inv=cab.matrixWorld.clone().invert(),M=inv.clone().multiply(W8.matrixWorld),g=W8.geometry,p=g.attributes.position,cnt=g.index?g.index.count:p.count,A=new THREE.Vector3(),B=new THREE.Vector3(),C=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3(),tri=[],Nn=new THREE.Vector3();
 for(let k=0;k<cnt;k+=3){const f=j=>g.index?g.index.getX(k+j):k+j;A.fromBufferAttribute(p,f(0)).applyMatrix4(M);B.fromBufferAttribute(p,f(1)).applyMatrix4(M);C.fromBufferAttribute(p,f(2)).applyMatrix4(M);c.copy(A).add(B).add(C).divideScalar(3);
  if(c.z>-.55||Math.abs(c.x)>.8||c.y<1.0)continue;n.subVectors(B,A).cross(C.clone().sub(A));const ar=n.length();n.normalize();if(Math.abs(n.x)>.5)continue;if(n.z>0)n.negate();Nn.addScaledVector(n,ar);tri.push(A.clone(),B.clone(),C.clone());}
 if(tri.length<6)return false;Nn.normalize();// Nn points outward (forward/up)
 const h=new THREE.Vector3(1,0,0),v=Nn.clone().cross(h).normalize();if(v.y<0)v.negate();let u0=9,u1=-9,v0=9,v1=-9;tri.forEach(q=>{u0=Math.min(u0,q.dot(h));u1=Math.max(u1,q.dot(h));v0=Math.min(v0,q.dot(v));v1=Math.max(v1,q.dot(v));});
 const Wm=u1-u0,Hm=v1-v0,pos=[],uv=[];tri.forEach(q=>{const r=q.clone().addScaledVector(Nn,-.006);pos.push(r.x,r.y,r.z);uv.push((q.dot(h)-u0)/Wm,(q.dot(v)-v0)/Hm);});
 const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));gg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 const CW=mobile?384:640,CH=Math.round(CW*Hm/Wm),dc=cv(CW,CH,()=>{}),dg=dc.getContext('2d'),dt=new THREE.CanvasTexture(dc);dt.encoding=THREE.sRGBEncoding;
 const ws=new THREE.Mesh(gg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{map:{value:dt},uSky:{value:new THREE.Color(.6,.65,.7)},uGnd:{value:new THREE.Color(.08,.09,.1)},uK:{value:1},uFB:{value:null},uHas:{value:0},uRes:{value:new THREE.Vector2(1,1)}},toneMapped:false,fog:false,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`uniform sampler2D map,uFB;uniform vec3 uSky,uGnd;uniform float uK,uHas;uniform vec2 uRes;varying vec2 vU;void main(){vec4 c=texture2D(map,vU);float a=clamp(c.a*2.2-.35,0.,1.);if(a<.01)discard;
   vec2 n=(vec2(c.g,c.r)-.5)*2.;float th=c.b,ln=length(n);
   // clear water bead: refract the real frame behind (previous frame copy), image inverted & minified inside the drop
   vec2 su=gl_FragCoord.xy/uRes;vec2 ru=clamp(su-n*vec2(.035,.035*uRes.x/uRes.y)*(.35+th),vec2(.001),vec2(.999));
   vec3 bg=texture2D(uFB,ru).rgb;
   float rim=smoothstep(.78,1.,ln);
   float sh=pow(max(0.,dot(normalize(vec3(n,th+.25)),normalize(vec3(-.45,-.55,.7)))),30.);
   if(uHas>.5){vec3 col=bg*(1.04-rim*.55)+sh*1.1*uK;gl_FragColor=vec4(col,a);}
   else{float al=a*(rim*.35+sh*.9);gl_FragColor=vec4(vec3(sh*1.2*uK),al);}}`}));ws.renderOrder=6;cab.add(ws);
 WX.ws=ws;WX.dc=dc;WX.dg=dg;WX.dt=dt;WX.CW=CW;WX.CH=CH;WX.Wm=Wm;WX.Hm=Hm;
 // drop sprite
 // drop sprite = water map (technique from Codrops RainEffect, Lucas Bebber): R=normal.y, G=normal.x, B=thickness, A=mask
 WX.dsp=cv(48,48,(g)=>{const im=g.createImageData(48,48);for(let y=0;y<48;y++)for(let x=0;x<48;x++){const dx=(x-23.5)/22,dy=(y-25)/22*1.08,d=Math.hypot(dx,dy),i=(y*48+x)*4;if(d>=1)continue;const t=Math.sqrt(1-d*d);
  im.data[i]=128+dy*127|0;im.data[i+1]=128+dx*127|0;im.data[i+2]=t*255|0;im.data[i+3]=Math.min(255,(1-d)*900)|0;}g.putImageData(im,0,0);});
 // blades (on the outer glass surface, children of car so visible in chase view too); tandem, LHD: pivots at the bottom, rest pointing to the passenger side
 const bm=new THREE.MeshLambertMaterial({color:/wipdbg/.test(Q)?0xff0000:0x18181a}),base=new THREE.Matrix4().makeBasis(h,v,Nn);
 [[.2,.62],[.6,.56]].forEach(([pu,len])=>{const piv=new THREE.Group();const P=new THREE.Vector3().addScaledVector(h,u0+pu*Wm).addScaledVector(v,v0+.03*Hm);// point on plane; move onto glass along Nn
  const ctr=tri.reduce((s,q)=>s.add(q),new THREE.Vector3()).divideScalar(tri.length);const d=ctr.clone().sub(P).dot(Nn);P.addScaledVector(Nn,d+.012);
  piv.position.copy(P);piv.quaternion.setFromRotationMatrix(base);const arm=new THREE.Group();piv.add(arm);
  const bl=new THREE.Mesh(new THREE.BoxGeometry(len,.024,.014),bm);bl.position.x=len/2;arm.add(bl);const ar=new THREE.Mesh(new THREE.BoxGeometry(len*.92,.008,.02),bm);ar.position.set(len*.46,0,.012);arm.add(ar);
  (WX.bg||(WX.bg=(()=>{const q=new THREE.Group();q.position.copy(cab.position);q.quaternion.copy(cab.quaternion);cab.parent.add(q);return q;})())).add(piv);WX.blades.push({piv,arm,pu,len});});
 weatherApply();return true;}
function wsWipe(a0,a1){const g=WX.dg,sx=WX.CW/WX.Wm,sy=WX.CH/WX.Hm;g.save();g.globalCompositeOperation='destination-out';g.fillStyle='#000';
 WX.blades.forEach(b=>{const px=b.pu*WX.CW,py=WX.CH-.03*WX.CH;g.beginPath();const lo=Math.min(a0,a1)-.04,hi=Math.max(a0,a1)+.04;g.moveTo(px,py);for(let k=0;k<=8;k++){const a=lo+(hi-lo)*k/8;g.lineTo(px+Math.cos(a)*b.len*sx,py-Math.sin(a)*b.len*sy);}g.closePath();g.fill();});g.restore();}
function weatherTick(dt){dt=Math.max(0,Math.min(dt||0,.1));if(!(WX.cyc>0))WX.cyc=0;WX.t+=dt;const w=WX.w,L=WX.L;
 if(L.visible){const u=L.material.uniforms;const c=chase?chaseCam:cam;c.getWorldPosition(u.uC.value);u.uT.value=WX.t;u.uCar.value.copy(car.matrixWorld).invert();u.uW.value.set(Math.sin(st.h)*st.v*.045+.08,Math.cos(st.h)*st.v*.045);}
 if(!WX.ws&&XM.cabOk&&!WX.tried){WX.tried=1;try{buildWS();}catch(e){console.warn('ws',e);}}
 // wiper motion: cycle 0..1 => angle 0..sweep..0
 const SW=1.95,kmh=Math.abs(st.v)*3.6;let run=false,per=1.3;const m=WX.wm;
 if(m==2)run=true;else if(m==3){run=true;per=.85;}else if(m==1){WX.intT+=dt;if(WX.intT>4.5){WX.intT=0;WX.cyc=Math.max(WX.cyc,.001);}}
 else if(m==4&&w>0){const thr=w==2?18:40-Math.min(20,kmh*.2);if(WX.drops>thr&&WX.cyc==0)WX.cyc=.001;if(w==2&&kmh>60)run=true;per=w==2?.9:1.3;}
 if(!st.on&&!run)run=false;
 if(run&&WX.cyc==0)WX.cyc=.001;
 if(WX.cyc>0){WX.cyc+=Math.min(dt,.1)/per;if(WX.cyc>=1){WX.cyc=run?(WX.cyc%1)+.001:0;if(AU&&WX.cyc==0)AU.burst(160,2,.08,.12);}}
 const ph=WX.cyc;const a=ph<=0?0:SW*Math.sin(Math.PI*ph);const aPrev=WX.a;WX.a=a;WX.blades.forEach(b=>b.arm.rotation.z=a);
 if(AU&&Math.abs(a-aPrev)>1e-3&&WX.sndT<=0){AU.burst(420,1.2,per*.45,.05);WX.sndT=per*.5;}WX.sndT-=dt;
 // droplets canvas @10Hz (cabin only)
 if(WX.ws){WX.dAcc=(WX.dAcc||0)+dt;if(Math.abs(a-aPrev)>1e-4)wsWipe(aPrev,a);
  if(WX.dAcc>.1&&!chase){const g=WX.dg,n=w==0?0:Math.round((w==2?30:12)*(1+kmh/60)*WX.dAcc*10);if(kmh>40&&w){g.save();g.globalAlpha=Math.min(.5,(kmh-40)/80);g.drawImage(WX.dc,0,-Math.min(6,kmh/25));g.restore();}// runs: beads creep up and smear at speed
   const el=1+Math.max(0,kmh-40)/35;for(let i=0;i<n;i++){const r=(3+Math.random()*Math.random()*11)*(WX.CW/640);g.globalAlpha=1;g.drawImage(WX.dsp,Math.random()*WX.CW-r,Math.random()*WX.CH-r*el,r*2,r*2*el);}g.globalAlpha=1;
   WX.drops=Math.min(200,WX.drops+n*.25);if(Math.abs(a-aPrev)>1e-4)WX.drops=Math.max(0,WX.drops-25);
   if(w==0&&WX.drops>0){g.save();g.globalCompositeOperation='destination-out';g.fillStyle='rgba(0,0,0,.04)';g.fillRect(0,0,WX.CW,WX.CH);g.restore();WX.drops=Math.max(0,WX.drops-.5);}
   WX.dt.needsUpdate=true;WX.dAcc=0;WX.ws.visible=(w>0||WX.drops>1)&&!!GSET.drop;}}
 // rain sound on roof/glass (synth noise; louder in cabin, heavy = denser)
 if(AU){if(!WX.snd){const ac=AU.ac,nb=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=nb.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){const wv=Math.random()*2-1;l=l*.6+wv*.4;d[i]=l+(Math.random()<.0009?(Math.random()*2-1)*3:0);}
  const s=ac.createBufferSource();s.buffer=nb;s.loop=true;const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=400;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5000;const gg=ac.createGain();gg.gain.value=0;s.connect(hp);hp.connect(lp);lp.connect(gg);gg.connect(ac.destination);s.start();WX.snd={gg,lp};}
  WX.snd.gg.gain.setTargetAtTime(w==0?0:(w==2?.22:.11)*(chase?.6:1),AU.ac.currentTime,.4);WX.snd.lp.frequency.setTargetAtTime(chase?7000:3200,AU.ac.currentTime,.3);
  if(w&&!chase&&Math.random()<dt*(w==2?30:10))AU.burst(2500+Math.random()*3000,3,.02,.03*w);}}
if(WX.w)setTimeout(()=>applyTod(),0);addEventListener('keydown',e=>{if(e.code=='KeyY')setWeather((WX.w+1)%3);if(e.code=='KeyI')wiperMode((WX.wm+1)%5);});
{// seat panel UI
 const pn=document.createElement('div');pn.id='seatP';pn.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(10,14,20,.88);color:#dfe8f0;border:1px solid #345;border-radius:12px;padding:8px 10px;font:13px sans-serif;z-index:60;display:none;touch-action:none;user-select:none';
 const rows=[['h','Высота',.01],['f','Вперёд/назад',.015],['t','Спинка',.015]];let html='<div style="text-align:center;margin-bottom:4px">💺 Сиденье</div>';
 rows.forEach(([k,n])=>{html+=`<div style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:96px">${n}</span><b data-k="${k}" data-d="-1" class="sb">−</b><span id="sv_${k}" style="width:44px;text-align:center"></span><b data-k="${k}" data-d="1" class="sb">+</b></div>`;});
 html+='<div style="display:flex;gap:6px;justify-content:center;margin-top:6px"><b class="sm" data-m="1">M1</b><b class="sm" data-m="2">M2</b><b class="sm" data-m="0">↺</b><b class="sm" data-m="x">✕</b></div><div style="font-size:10px;opacity:.6;text-align:center">M: тап — вызвать, удерж. — запомнить</div>';
 pn.innerHTML=html;document.body.appendChild(pn);pn.querySelectorAll('b').forEach(b=>b.style.cssText='display:inline-block;min-width:34px;padding:6px 8px;background:#1d2a38;border-radius:8px;text-align:center;cursor:pointer');
 const upd=()=>rows.forEach(([k])=>{document.getElementById('sv_'+k).textContent=(k=='t'?(SEAT[k]*57.3).toFixed(0)+'°':(SEAT[k]*100).toFixed(0)+' см');});upd();
 pn.querySelectorAll('.sb').forEach(b=>{let iv=null;const k=b.dataset.k,d=+b.dataset.d,stp=rows.find(r=>r[0]==k)[2];const step=()=>{seatSet(k,SEAT[k]+d*stp);upd();};
  b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();step();iv=setInterval(step,120);});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{clearInterval(iv);}));});
 pn.querySelectorAll('.sm').forEach(b=>{let t0=0;const m=b.dataset.m;b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();t0=performance.now();});b.addEventListener('pointerup',e=>{e.stopPropagation();
  if(m=='x'){pn.style.display='none';return;}if(m=='0'){['h','f','t'].forEach(k=>seatSet(k,0));upd();return;}const key='x5seatM'+m;
  if(performance.now()-t0>600){try{localStorage.setItem(key,JSON.stringify(SEAT));}catch(e){}b.style.background='#2a5';setTimeout(()=>b.style.background='#1d2a38',400);}
  else{try{const v=JSON.parse(localStorage.getItem(key)||'null');if(v){['h','f','t'].forEach(k=>seatSet(k,v[k]||0));upd();}}catch(e){}}});});
 ['pointerdown','touchstart','mousedown'].forEach(ev=>pn.addEventListener(ev,e=>e.stopPropagation()));
 window.__seatPanel=v=>{pn.style.display=v?'block':'none';upd();};if(/[?&]seatp/.test(Q))__seatPanel(true);}
// ---------- post FX (desktop): bloom, SSAO, motion blur (afterimage), DOF, ACES/exposure, vignette+grain, lens flare, wet cube reflections; FPS ----------
const POST={c:null,on:false,fr:0};
const FinalShader={uniforms:{tDiffuse:{value:null},uTone:{value:0},uExp:{value:1},uVig:{value:0},uGrain:{value:0},uT:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uTone,uExp,uVig,uGrain,uT;varying vec2 vUv;
  vec3 aces(vec3 x){x*=.6;return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 col=c.rgb*uExp;if(uTone>.5)col=aces(col*1.6);else col=min(col,vec3(1.));
   if(uVig>0.){vec2 d=vUv-.5;col*=1.-uVig*smoothstep(.35,.85,length(d*vec2(1.25,1.)));}
   if(uGrain>0.)col+=(h(vUv*vec2(1733.,977.)+uT)-.5)*uGrain;gl_FragColor=vec4(col,1.);}`};
function postBuild(){const g=GSET,want=!!(g.bloom||g.ssao||g.mblur||g.dof||g.tone||g.vig||g.grain||g.aa)&&!!THREE.EffectComposer;
 if(POST.c){POST.c.passes.forEach(p=>p.dispose&&p.dispose());POST.c=null;}POST.on=want;if(!want)return;
 const w=innerWidth,h=innerHeight,rt=new THREE.WebGLRenderTarget(w*R.getPixelRatio(),h*R.getPixelRatio(),{type:THREE.HalfFloatType});if(g.aa>=2&&R.capabilities.isWebGL2)rt.samples=g.aa>=3?8:4;POST.msaa=rt.samples|0;const c=new THREE.EffectComposer(R,rt);c.setPixelRatio(R.getPixelRatio());c.setSize(w,h);
 POST.rp=new THREE.RenderPass(S,cam);c.addPass(POST.rp);
 POST.ssao=null;if(g.ssao&&THREE.SSAOPass){const p=new THREE.SSAOPass(S,cam,w,h);p.kernelRadius=.6;p.minDistance=.0004;p.maxDistance=.02;p.output=THREE.SSAOPass.OUTPUT.Default;c.addPass(p);POST.ssao=p;}
 POST.dof=null;if(g.dof&&THREE.BokehPass){const p=new THREE.BokehPass(S,cam,{focus:25,aperture:.00008,maxblur:.006,width:w,height:h});c.addPass(p);POST.dof=p;}
 POST.bl=null;if(g.bloom&&THREE.UnrealBloomPass){const p=new THREE.UnrealBloomPass(new THREE.Vector2(w/2,h/2),.6,.45,1.0);c.addPass(p);POST.bl=p;}
 POST.ai=null;if(g.mblur&&THREE.AfterimagePass){const p=new THREE.AfterimagePass(0);c.addPass(p);POST.ai=p;}
 POST.fin=new THREE.ShaderPass(FinalShader);c.addPass(POST.fin);
 POST.aa=null;if(g.aa==1&&THREE.FXAAShader){const p=new THREE.ShaderPass(THREE.FXAAShader);const pr=R.getPixelRatio();p.uniforms.resolution.value.set(1/(w*pr),1/(h*pr));c.addPass(p);POST.aa=p;}else if(g.aa==2&&THREE.SMAAPass){const pr=R.getPixelRatio();const p=new THREE.SMAAPass(w*pr,h*pr);c.addPass(p);POST.aa=p;}
 POST.c=c;A2C();}
// alpha-to-coverage for alpha-tested foliage/grass when MSAA is active (smooth leaf edges instead of jaggies)
function A2C(){const on=GSET.aa>=2;S.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>{if(m.alphaTest>0&&!m.transparent&&m.alphaToCoverage!==on&&m.userData.a2c!==on){m.alphaToCoverage=on;m.userData.a2c=on;m.needsUpdate=true;}});});}setInterval(()=>{try{A2C();}catch(e){}},6000);
window.__postResize=(w,h)=>{if(POST.c){POST.c.setPixelRatio(R.getPixelRatio());POST.c.setSize(w,h);const pr=R.getPixelRatio();if(POST.aa&&POST.aa.uniforms&&POST.aa.uniforms.resolution)POST.aa.uniforms.resolution.value.set(1/(w*pr),1/(h*pr));}};
const DFB={t:null,w:0,h:0,v:new THREE.Vector2(),f:0};
function dropsFB(){const ws=typeof WX!='undefined'&&WX.ws;if(!ws||!ws.visible||chase||(WX.w==0&&!WX.wet))return;const U=ws.material.uniforms;R.getDrawingBufferSize(DFB.v);const w=DFB.v.x|0,h=DFB.v.y|0;
 if(!DFB.t||DFB.w!==w||DFB.h!==h){if(DFB.t)DFB.t.dispose();DFB.t=new THREE.FramebufferTexture(w,h,THREE.RGBAFormat);DFB.t.minFilter=DFB.t.magFilter=THREE.LinearFilter;DFB.w=w;DFB.h=h;}
 if((DFB.f++%(GSET.preset=='low'?3:2))==0){R.setRenderTarget(null);try{R.copyFramebufferToTexture(DFB.o||(DFB.o=new THREE.Vector2(0,0)),DFB.t);}catch(e){}}
 U.uFB.value=DFB.t;U.uHas.value=1;U.uRes.value.set(w,h);}
function RENDER(c){if(!POST.on||!POST.c){R.render(S,c);if(c===cam)dropsFB();return;}POST.rp.camera=c;if(POST.ssao)POST.ssao.camera=c;if(POST.dof){POST.dof.camera=c;POST.dof.uniforms.focus.value=chase?7:18;}
 if(POST.ai){const k=Math.abs(st.v)*3.6;POST.ai.uniforms.damp.value=k>70?Math.min(.62,(k-70)/120):0;}
 if(POST.bl)POST.bl.strength=tod==2?.85:.45;const U=POST.fin.uniforms;U.uTone.value=GSET.tone;U.uExp.value=GSET.exp;U.uVig.value=GSET.vig?.32:0;U.uGrain.value=GSET.grain?.035:0;U.uT.value=(performance.now()%1e5)/1000;POST.c.render();if(c===cam)dropsFB();}
// lens flare on the sun (day, clear)
{const fl=(sz,f)=>{const cnv=cv(sz,sz,(g)=>{const gr=g.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);f(gr);g.fillStyle=gr;g.fillRect(0,0,sz,sz);});const t=new THREE.CanvasTexture(cnv);return t;};
 if(THREE.Lensflare){const L=new THREE.Lensflare(),t0=fl(256,gr=>{gr.addColorStop(0,'rgba(255,250,235,1)');gr.addColorStop(.12,'rgba(255,240,200,.6)');gr.addColorStop(1,'rgba(255,220,160,0)');}),t1=fl(64,gr=>{gr.addColorStop(0,'rgba(160,200,255,.35)');gr.addColorStop(.7,'rgba(160,200,255,.12)');gr.addColorStop(1,'rgba(160,200,255,0)');});
  L.addElement(new THREE.LensflareElement(t0,380,0));[[.4,60],[.6,90],[.8,40],[1,120]].forEach(([d,s2])=>L.addElement(new THREE.LensflareElement(t1,s2,d)));POST.flare=L;L.visible=false;S.add(L);}}
// wet road: low-res cube reflection around the car (updated every 12 frames)
POST.cubeRT=new THREE.WebGLCubeRenderTarget(mobile||GSET.preset!='ultra'?64:128,{type:THREE.HalfFloatType});POST.cube=new THREE.CubeCamera(.5,220,POST.cubeRT);S.add(POST.cube);
function postTick(){POST.fr++;
 if(POST.flare){const on=GSET.flare&&tod==0&&(typeof WX=='undefined'||WX.w==0);POST.flare.visible=on;if(on){const c=chase?chaseCam:cam,p=_v2;c.getWorldPosition(p);POST.flare.position.copy(sun.position).sub(sun.target.position).normalize().multiplyScalar(900).add(p);}}
 if(typeof WX!='undefined'&&WX.w>0&&GSET.wet){if(roadM.envMap!==POST.cubeRT.texture){roadM.envMap=POST.cubeRT.texture;roadM.needsUpdate=true;}if(POST.fr%12==0){POST.cube.position.set(st.x,-1.4,st.z);const bv=body.visible,cv2=cab.visible;body.visible=true;cab.visible=false;if(WX.L)WX.L.visible=false;POST.cube.update(R,S);body.visible=bv;cab.visible=cv2;if(WX.L)WX.L.visible=true;}}
 // draw distance
 const far=1500*GSET.dist;if(cam.far!==far){cam.far=far;chaseCam.far=Math.max(2000,far*1.3);cam.updateProjectionMatrix();chaseCam.updateProjectionMatrix();}
 if(typeof WX=='undefined'||WX.w==0){const ff=650*GSET.dist;if(!Q.includes('city')&&S.fog.far!==ff){S.fog.far=ff;}}
 // fps
 if(GSET.fps){POST.fc=(POST.fc||0)+1;const t=performance.now();if(!POST.ft)POST.ft=t;if(t-POST.ft>500){const e=document.getElementById('fpsC')||(()=>{const d=document.createElement('div');d.id='fpsC';d.style.cssText='position:fixed;top:calc(10px + env(safe-area-inset-top));z-index:70;white-space:nowrap;font:12px monospace;color:#9f9;background:rgba(0,0,0,.5);padding:2px 5px;border-radius:4px;pointer-events:none';document.body.appendChild(d);return d;})();{const u=document.getElementById('ui');const r=u&&u.getClientRects().length?u.getBoundingClientRect():null;e.style.right=(r?Math.max(6,innerWidth-r.left+8):6)+'px';}e.textContent=(POST.fc*1000/(t-POST.ft)).toFixed(0)+' fps'+(POST.on?' · post':' · '+R.info.render.calls+' dc');POST.fc=0;POST.ft=t;}}
 else{const e=document.getElementById('fpsC');if(e)e.remove();}}
function gsetApply(){fit();try{const DD=Math.max(1,GSET.dist);if(!Q.includes('city')&&!(typeof WX!='undefined'&&WX.w)){S.fog.far=650*DD;S.fog.near=120*DD;}[cam,chaseCam].forEach(c=>{c.far=Math.max(c.userData.far0||(c.userData.far0=c.far),900*DD+700);c.updateProjectionMatrix();});}catch(e){}postBuild();MIR.forEach((o,i)=>{const sz=[[128,64],[256,128],[512,256]][GSET.mir].map(v=>mobile?v*.6|0:v);o.rt.setSize(sz[0],sz[1]);});if(typeof WX!='undefined'&&WX.L)try{weatherApply();}catch(e){}}
// settings panel
{const pn=document.createElement('div');pn.id='gfxP';pn.style.cssText='position:fixed;right:10px;top:50px;max-height:80vh;overflow:auto;width:270px;background:rgba(10,14,20,.92);color:#dfe8f0;border:1px solid #345;border-radius:12px;padding:10px;font:12px sans-serif;z-index:65;display:none;touch-action:pan-y';
 const ROW=[['scale','Масштаб рендера',.5,1.25,.05],['dist','Дальность прорисовки',.6,4,.1],['aa','Сглаживание 0 выкл / 1 FXAA / 2 MSAA4+SMAA / 3 MSAA8',0,3,1],['green','Плотность зелени',.5,1.6,.05],['gdist','Дальность зелени',.6,2.5,.05],['shadow','Тени 0/1k/2k/4k',0,3,1,1],['mir','Зеркала качество',0,2,1],['mrate','Частота зеркал (1 полная / 2 половина)',1,2,1],['rain','Частицы дождя',.2,1,.1],['exp','Экспозиция',.6,1.6,.05]];
 const CHK=[['bloom','Bloom фар/огней'],['ssao','SSAO (тяжёлое)'],['mblur','Motion blur'],['dof','Глубина резкости'],['tone','ACES тонмаппинг'],['wet','Отражения мокрой дороги'],['flare','Блики солнца'],['grain','Зерно плёнки'],['vig','Виньетка'],['drop','Капли-шейдер на стекле'],['fps','Счётчик FPS'],['dres','Динамическое разрешение (держит FPS)']];
 let h='<div style="display:flex;justify-content:space-between;align-items:center"><b>⚙ Графика</b><b id="gfxX" style="cursor:pointer;padding:2px 8px">✕</b></div><div style="margin:6px 0">Пресет: <select id="gfxPre">'+['low','medium','high','ultra','custom'].map(k=>`<option value="${k}">${{low:'Низкое',medium:'Среднее',high:'Высокое',ultra:'Ультра',custom:'Своё'}[k]}</option>`).join('')+'</select> <span style="opacity:.6">авто: '+GSET.auto+'</span></div>';
 ROW.forEach(([k,n,a,b,st2])=>h+=`<div style="margin:4px 0">${n}: <span id="gv_${k}"></span><input type="range" id="gr_${k}" min="${a}" max="${b}" step="${st2}" style="width:100%"></div>`);
 CHK.forEach(([k,n])=>h+=`<label style="display:block;margin:3px 0"><input type="checkbox" id="gc_${k}"> ${n}</label>`);h+='<div style="opacity:.6;margin-top:4px">Сглаживание и тени применяются после перезагрузки.</div>';
 pn.innerHTML=h;document.body.appendChild(pn);['pointerdown','touchstart','mousedown','wheel'].forEach(ev=>pn.addEventListener(ev,e=>e.stopPropagation(),{passive:true}));
 const sync=()=>{document.getElementById('gfxPre').value=GSET.preset;ROW.forEach(([k])=>{document.getElementById('gr_'+k).value=GSET[k];document.getElementById('gv_'+k).textContent=GSET[k];});CHK.forEach(([k])=>document.getElementById('gc_'+k).checked=!!GSET[k]);};
 const changed=(k,v)=>{const rl=(k=='shadow')&&GSET[k]!=v;GSET[k]=v;GSET.preset='custom';gsetSave();sync();if(rl){if(confirm('Перезагрузить страницу для применения?'))location.reload();}else gsetApply();};
 ROW.forEach(([k])=>document.getElementById('gr_'+k).addEventListener('change',e=>changed(k,+e.target.value)));CHK.forEach(([k])=>document.getElementById('gc_'+k).addEventListener('change',e=>changed(k,e.target.checked?1:0)));
 document.getElementById('gfxPre').addEventListener('change',e=>{const p=e.target.value;if(!GPRE[p])return;const rl=GPRE[p].aa!=GSET.aa||GPRE[p].shadow!=GSET.shadow;Object.assign(GSET,GPRE[p],{preset:p});gsetSave();sync();if(rl&&confirm('Перезагрузить страницу для применения?'))location.reload();else gsetApply();});
 document.getElementById('gfxX').onclick=()=>pn.style.display='none';window.__gfxPanel=v=>{pn.style.display=v?'block':'none';sync();};if(/[?&]gfxp/.test(Q))__gfxPanel(true);}
setTimeout(gsetApply,0);
// ---------- radial menu ----------
{const ui=document.getElementById('ui');const rb=document.createElement('b');rb.id='bRing';rb.textContent='◎';rb.title='Меню';ui.insertBefore(rb,document.getElementById('bBack'));
 const ring=document.createElement('div');ring.id='ring';document.body.appendChild(ring);
 const IT=[['ABS',()=>st.absOn=!st.absOn,()=>st.absOn],['DSC',()=>st.dscOn=!st.dscOn,()=>st.dscOn],['TC',()=>st.tcOn=!st.tcOn,()=>st.tcOn],
  [()=>['C','S','S+'][st.mode],()=>setMode((st.mode+1)%3),()=>true],[()=>['💡0','💡A','≡D','≣D'][HB.lm],()=>setLM((HB.lm+1)%4),()=>lights],['⚡',()=>{HB.flash=true;lightsUpd();setTimeout(()=>{HB.flash=false;lightsUpd();},450);},()=>HB.hi],['◀',()=>ind(-1),()=>st.ind<0],['▶',()=>ind(1),()=>st.ind>0],['⚠',()=>ind('h'),()=>st.haz],
  ['⏲',cruise,()=>!!st.cruise],['HUD',()=>st.hud=!st.hud,()=>st.hud],['Ⓟ',()=>st.epb=!st.epb,()=>st.epb],['Ⓐ',()=>st.autohold=!st.autohold,()=>st.autohold],['🎨',ambient,()=>true],
  [()=>TOD[tod].n,()=>{tod=(tod+1)%3;applyTod();},()=>true],[()=>['☁','🌧','⛈'][WX.w],()=>setWeather((WX.w+1)%3),()=>WX.w>0],[()=>'⌒'+['0','INT','1','2','A'][WX.wm],()=>wiperMode((WX.wm+1)%5),()=>WX.wm>0],['🎥',()=>setChase(!chase),()=>chase],['G',()=>{GFX.on=!GFX.on;try{localStorage.setItem('x5gfx',GFX.on?'1':'0');}catch(e){}},()=>GFX.on],['⚙',()=>__gfxPanel(document.getElementById('gfxP').style.display=='none'),()=>document.getElementById('gfxP').style.display!='none'],['💺',()=>__seatPanel(document.getElementById('seatP').style.display=='none'),()=>document.getElementById('seatP').style.display!='none']];
 const els=IT.map((it,i)=>{const b=document.createElement('b');const a=-Math.PI/2+i/IT.length*Math.PI*2;b.style.left=(95+Math.cos(a)*78-15)+'px';b.style.top=(95+Math.sin(a)*78-15)+'px';
  const f=e=>{e.preventDefault();e.stopPropagation();it[1]();upd();};b.addEventListener('click',f);b.addEventListener('touchstart',f,{passive:false});ring.appendChild(b);return b;});
 function upd(){IT.forEach((it,i)=>{els[i].textContent=typeof it[0]==='function'?it[0]():it[0];els[i].classList.toggle('on',!!it[2]());});}
 const open=v=>{ring.classList.toggle('on',v);if(v)upd();};
 const tg=e=>{e.preventDefault();e.stopPropagation();open(!ring.classList.contains('on'));};rb.addEventListener('click',tg);rb.addEventListener('touchstart',tg,{passive:false});
 const close=e=>{if(ring.classList.contains('on')&&!ring.contains(e.target)&&e.target!==rb)open(false);};addEventListener('touchstart',close,{capture:true,passive:true});addEventListener('mousedown',close,true);
 setInterval(()=>{if(ring.classList.contains('on'))upd();},300);if(Q.includes('ring'))open(true);}
function uiTick(){const p=document.getElementById('bPow');if(p){p.style.color=st.on?'#6f6':'#f66';p.style.boxShadow=st.on?'':((performance.now()/500|0)%2?'0 0 8px #f66':'');}}
// ---------- tire smoke + skid marks ----------
const SKN=2400,skP=new Float32Array(SKN*18),skG=new THREE.BufferGeometry();skG.setAttribute('position',new THREE.BufferAttribute(skP,3));
const skM=new THREE.Mesh(skG,new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.55,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-.5,polygonOffsetUnits:-4}));skM.frustumCulled=false;skM.renderOrder=4;S.add(skM);let skI=0;const skLast=[null,null,null,null];
const smT=new THREE.CanvasTexture(cv(64,64,(g)=>{const gr=g.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'rgba(235,235,235,.9)');gr.addColorStop(1,'rgba(235,235,235,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}));
const SM=[];for(let i=0;i<140;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:smT,transparent:true,depthWrite:false,opacity:0}));s.visible=false;S.add(s);SM.push({s,life:0,vx:0,vz:0});}let smI=0,smAcc=0;
function fxTick(dt){const s=Math.sin(st.h),c=Math.cos(st.h),sl=st.slip||0;const W=[[.851,-1.3825],[-.851,-1.3825],[.838,1.5925],[-.838,1.5925]];
 W.forEach(([lx,lz],i)=>{const front=i>1;const px=st.x+lx*c+lz*s,pz=st.z-lx*s+lz*c;const on=st.road&&(front?(st.lock&&Math.abs(st.v)>2):sl>.3);
  if(on){const L=skLast[i];if(L&&Math.hypot(px-L[0],pz-L[1])>.25){const dx=px-L[0],dz=pz-L[1],d=Math.hypot(dx,dz),nx=-dz/d*.13,nz=dx/d*.13,y=.082,o=skI*18;
    const v=[L[0]+nx,y,L[1]+nz,px+nx,y,pz+nz,px-nx,y,pz-nz,L[0]+nx,y,L[1]+nz,px-nx,y,pz-nz,L[0]-nx,y,L[1]-nz];for(let k=0;k<18;k++)skP[o+k]=v[k];skI=(skI+1)%SKN;skG.attributes.position.needsUpdate=true;skLast[i]=[px,pz];}else if(!L)skLast[i]=[px,pz];}else skLast[i]=null;
  if(!front&&sl>.35){smAcc+=dt*sl*45;while(smAcc>1){smAcc--;const p=SM[smI++%SM.length];p.life=1.6;p.s.visible=true;p.s.position.set(px,.3,pz);p.s.scale.set(.6,.6,.6);p.vx=st.vx*.3+(Math.random()-.5);p.vz=st.vz*.3+(Math.random()-.5);}}});
 SM.forEach(p=>{if(p.life<=0)return;p.life-=dt;const t=1-p.life/1.6;p.s.position.x+=p.vx*dt;p.s.position.z+=p.vz*dt;p.s.position.y+=dt*.8;p.vx*=.96;p.vz*=.96;const sc=.6+t*4.5;p.s.scale.set(sc,sc,sc);p.s.material.opacity=.55*(1-t);if(p.life<=0)p.s.visible=false;});}
// scripted drift test (?drift): Sport+, accelerate, handbrake flick, hold drift with throttle + countersteer
// A/B physics tests: ?tst=brake|brakest|launch|dsc  &aid=0/1
function tstScript(dt){tT+=dt;if(tT<.05){st.mode=+(Q.match(/md=(\d)/)||[0,1])[1];st.absOn=st.tcOn=st.dscOn=AID;}const k=st.v*3.6;let thr=0,br=0,steer=0;
 if(TST==='launch'){thr=1;if(!tPh){const sn=Math.sin(st.h),cs=Math.cos(st.h),vf=st.vx*sn+st.vz*cs,vl=st.vx*cs-st.vz*sn;tMax=Math.max(tMax,Math.abs(Math.atan2(vl,Math.max(Math.abs(vf),1))));tT0=Math.max(tT0||0,Math.abs(st.r));}if(/m0/.test(Q))st.mode=0;tSpin+=st.spin||0;tSpinN++;if(st.dsc)tLog++;if(st.tc)tLockN++;if(k>=100&&!tPh){tPh=1;console.log('TEST launch aid',AID,'wet',WX.w,'maxBeta',(tMax*57.3).toFixed(2),'maxYaw',(+tT0).toFixed(3),'0-100',tT.toFixed(2),'avg spin',(tSpin/tSpinN).toFixed(2),'dscFrames',tLog,'tcFrames',tLockN,'mode',st.mode);}return{thr,br,steer};}
 if(TST==='rev'){const RS=parseFloat((Q.match(/rs=(-?[\d.]+)/)||[])[1]||0);if(st.sel!=='R'){st.on=true;setGear('R');tX0=st.x;tZ0=st.z;tH0=st.h;}thr=tT<6?.6:0;br=tT>=6?1:0;steer=tT>1?RS:0;const sn=Math.sin(st.h),cs=Math.cos(st.h),vf=st.vx*sn+st.vz*cs,vl=st.vx*cs-st.vz*sn;tMax=Math.max(tMax,Math.abs(vl));tSpin=Math.min(tSpin,vf);
  if(tT>8&&!tPh){tPh=1;let dh=st.h-tH0;dh=Math.atan2(Math.sin(dh),Math.cos(dh));const R=Math.abs(dh)>.05?(Math.hypot(st.x-tX0,st.z-tZ0)/2/Math.sin(Math.abs(dh)/2)):0;console.log('TEST rev steer',RS,'aid',AID,'minVf kmh',(tSpin*3.6).toFixed(1),'heading',(dh*57.3).toFixed(1),'deg maxLat',tMax.toFixed(2),'m/s maxbeta',((tLog||0)*57.3).toFixed(1),'dist',Math.hypot(st.x-tX0,st.z-tZ0).toFixed(1),'yaw',st.r.toFixed(3),'dscF',tLockN,'R',R.toFixed(1));}
  if(st.dsc)tLockN++;tLog=Math.max(tLog,Math.abs(Math.atan2(vl,Math.max(Math.abs(vf),1))));return{thr,br,steer};}
 if(TST==='skid'||TST==='circle'||TST==='step'){const SV=+(Q.match(/sv=(\d+)/)||[0,TST==='circle'?8:40])[1],vt=SV/3.6;if(tT<.05){st.on=true;if(st.sel!=='D')setGear('D');}
  const sn=Math.sin(st.h),cs=Math.cos(st.h),vf=st.vx*sn+st.vz*cs,vl=st.vx*cs-st.vz*sn;thr=Math.max(0,Math.min(1,(vt-vf)*.6+.08+Math.abs(st.r)*vf*.012));br=vf>vt+1.5?.25:0;
  if(tPh==0){if(tT>3&&Math.abs(vf-vt)<.6){tPh=1;tT0=tT;tMax=0;tLog=0;}return{thr,br,steer};}
  const ts=tT-tT0;steer=TST!=='skid'?1:Math.min(1,ts/9);const bt=Math.atan2(vl,Math.max(Math.abs(vf),1)),al=Math.abs(vf*st.r);if(st.dsc)tLockN++;if(ts>.05)tSpin=Math.max(tSpin||0,Math.abs(bt));if(TST==='step'&&ts>.3&&ts<3&&Math.abs(vf*st.r)>tMax){tMax=Math.max(tMax,Math.abs(vf*st.r));tLog=[vf/Math.max(1e-3,Math.abs(st.r)),st.steer,bt*57.3,vf*3.6];}
  if(TST==='skid'&&ts>.5&&Math.abs(bt)<.15&&Math.abs(vf-vt)<2.5&&al>tMax){tMax=al;tLog=[vf/Math.max(1e-3,Math.abs(st.r)),st.steer,bt*57.3,vf*3.6];}
  if(ts>(TST==='skid'?9.5:TST==='step'?3:5)&&tPh==1){tPh=2;const RR=TST!=='skid'?vf/Math.max(1e-3,Math.abs(st.r)):tLog[0];console.log('TEST '+TST,'sv',SV,'wet',WX.w,'aid',AID,'maxLatG',(tMax/9.81).toFixed(3),'R',(+RR).toFixed(1),'steerAt',tLog&&(+tLog[1]).toFixed(2),'beta',tLog&&(+tLog[2]).toFixed(1),'kmhAt',tLog&&(+tLog[3]).toFixed(0),'dscF',tLockN,'TC',(2*RR+2.1).toFixed(1),'maxBetaAll',((tSpin||0)*57.3).toFixed(1),'mode',st.mode,'endYaw',st.r.toFixed(2),'endKmh',(vf*3.6).toFixed(0));}
  return{thr,br,steer};}
 if(TST==='pon'){const SV=+(Q.match(/sv=(\d+)/)||[0,60])[1],vt=SV/3.6,ST=+(Q.match(/ss=([\d.]+)/)||[0,.35])[1];if(tT<.05){st.on=true;if(st.sel!=='D')setGear('D');}
  const sn=Math.sin(st.h),cs=Math.cos(st.h),vf=st.vx*sn+st.vz*cs,vl=st.vx*cs-st.vz*sn,bt=Math.atan2(vl,Math.max(Math.abs(vf),1));
  if(tPh==0){steer=tT>2?Math.min(ST,(tT-2)*.5):0;thr=Math.max(0,Math.min(1,(vt-vf)*.6+.08+Math.abs(st.r)*vf*.012));br=vf>vt+1.5?.25:0;if(tT>7&&Math.abs(vf-vt)<1){tPh=1;tT0=tT;tMax=0;tLog=0;tLockN=0;tSpin=Math.abs(st.r);}return{thr,br,steer};}
  const ts=tT-tT0;steer=ST;thr=1;tMax=Math.max(tMax,Math.abs(bt));tLog=Math.max(tLog,Math.abs(st.r));if(st.dsc||st.tc)tLockN++;
  if(ts>3&&tPh==1){tPh=2;console.log('TEST pon sv',SV,'wet',WX.w,'steer',ST,'r0',tSpin.toFixed(2),'maxYaw',tLog.toFixed(2),'maxBeta',(tMax*57.3).toFixed(1),'spin',tMax>.45?'YES':'no','dscF',tLockN,'kmhEnd',(vf*3.6).toFixed(0),'lat',(Math.abs(vf*st.r)/9.81).toFixed(2));}
  return{thr,br,steer};}
 if(tPh==0){thr=1;if(k>=(TST==='dsc'?80:TST==='bst'?60:100)){tPh=1;tT=0;tX0=st.x;tZ0=st.z;tH0=st.h;window.__bk0=k;window.__bLat=0;window.__bLatN=0;}return{thr,br,steer};}
 if(TST==='brake'||TST==='brakest'){br=1;if(tT<.02&&/kick/.test(Q))st.r=.08;steer=TST==='brakest'?.6:0;if(st.lock)tLockN++;if(st.abs)tAbsN++;tMax=Math.max(tMax,Math.abs(st.beta||0));
  if(tT>8&&tPh==1&&!tLog){tLog=1;console.log('TEST stuck kmh',k.toFixed(1),'brk',st.brk,'thr',st.thr,'sel',st.sel,'g',st.g,'rpm',st.rpm|0);}if(Math.abs(st.v)<.3&&tPh==1){tPh=2;let dh=st.h-tH0;dh=Math.atan2(Math.sin(dh),Math.cos(dh));console.log('TEST',TST,'aid',AID,'dist',Math.hypot(st.x-tX0,st.z-tZ0).toFixed(1),'m time',tT.toFixed(2),'heading change',(dh*57.3).toFixed(1),'deg maxbeta',(tMax*57.3).toFixed(1),'lockFrames',tLockN,'absFrames',tAbsN);}return{thr,br,steer};}
 if(TST==='bst'){br=1;steer=1;const la=Math.abs(st.v*st.r)/9.81;if(k>15){__bLat=Math.max(__bLat,la);__bLatN++;window.__bLs=(window.__bLs||0)+la;}if(st.abs)tAbsN++;if(Math.abs(st.v)<.3&&tPh==1){tPh=2;let dh=st.h-tH0;dh=Math.atan2(Math.sin(dh),Math.cos(dh));console.log('TEST bst 60 dist',Math.hypot(st.x-tX0,st.z-tZ0).toFixed(1),'time',tT.toFixed(2),'decel g',(60/3.6/tT/9.81).toFixed(2),'peak lat g',__bLat.toFixed(2),'mean lat g >15kmh',(__bLs/Math.max(1,__bLatN)).toFixed(2),'heading',(dh*57.3).toFixed(0),'abs',tAbsN);}return{thr,br,steer};}
 if(TST==='dsc'){steer=tT<2.5?.9:0;thr=1;if(((tT*60)|0)%10==0)console.log('TEST t',tT.toFixed(2),'kmh',k.toFixed(0),'beta',((st.beta||0)*57.3).toFixed(1),'r',st.r.toFixed(2),'dsc',st.dsc,'tc',st.tc,'steer',st.steer.toFixed(2),'g',st.g);tMax=Math.max(tMax,Math.abs(st.beta||0));if(tT>3&&tPh==1){tPh=2;let dh=st.h-tH0;console.log('TEST dsc aid',AID,'maxbeta',(tMax*57.3).toFixed(1),'yaw',st.r.toFixed(2),'kmh',k.toFixed(0),'dsc frames',tLog);}if(st.dsc)tLog++;return{thr,br,steer};}
 return{thr,br,steer};}
function driftScript(dt){dT+=dt;let thr=0,br=0,steer=0,hb=0;if(dT<4){thr=1;}else if(dT<4.45){steer=.85;hb=dT<4.35?1:0;thr=.3;}else if(dT<14){const ab=Math.abs(st.beta);thr=Math.max(.2,Math.min(1,.6+(.4-ab)*3));steer=Math.max(-1,Math.min(1,st.beta*1.0+(ab<.15?.4*Math.sign(-st.beta||1):0)));}else{thr=0;br=.5;}return{thr,br,steer,hb};}
const _q1=new THREE.Quaternion(),_v1=new THREE.Vector3(),_v2=new THREE.Vector3(),_v3=new THREE.Vector3();const DRS={f:1,n:0,acc:0,last:0};window.__DRS=DRS;
// dynamic resolution: every 30 frames compare mean frame time with the target (50–57 fps band) and step the render scale between 0.55 and 1
let satN=0;function satTick(px,pz){if((satN++)%60)return;SATS.forEach(e=>{const [m,t]=e;const d=Math.hypot(Math.max(t.x0-px,0,px-t.x1),Math.max(t.z0-pz,0,pz-t.z1));if(d<1300&&!m.material.map&&!e.ld){e.ld=1;new THREE.TextureLoader().load(t.f,tx=>{tx.anisotropy=mobile?4:8;m.material.map=tx;m.material.needsUpdate=true;m.visible=true;e.ld=0;});}else if(d>2000&&m.material.map){m.material.map.dispose();m.material.map=null;m.visible=false;}});}
function drsTick(dt){if(!GSET.dres){if(DRS.f!==1){DRS.f=1;fit();}return;}DRS.acc+=dt;if(++DRS.n<30)return;const ms=DRS.acc/DRS.n*1000;DRS.acc=0;DRS.n=0;let f=DRS.f;if(ms>1000/45)f-=.08;else if(ms<1000/57)f+=.04;f=Math.max(.55,Math.min(1,f));if(Math.abs(f-DRS.f)>.01){DRS.f=f;fit();}}
function fit(){const w=window.innerWidth,h=window.innerHeight;if(!w||!h)return;cam.fov=w<h?95:68;[cam,topCam,chaseCam].forEach(c=>{c.aspect=w/h;c.updateProjectionMatrix();});R.setPixelRatio(Math.min(devicePixelRatio||1,GSET.cap)*GSET.scale*(GSET.dres?DRS.f:1));R.setSize(w,h,false);if(window.__postResize)__postResize(w,h);}
function refit(){fit();setTimeout(fit,150);setTimeout(fit,500);}
addEventListener('resize',refit);addEventListener('orientationchange',refit);if(window.visualViewport)visualViewport.addEventListener('resize',refit);document.addEventListener('fullscreenchange',refit);document.addEventListener('webkitfullscreenchange',refit);
{const b=document.getElementById('fs'),de=document.documentElement,req=de.requestFullscreen||de.webkitRequestFullscreen;
 if(!req||!(document.fullscreenEnabled||document.webkitFullscreenEnabled))b.style.display='none';
 else b.onclick=async()=>{try{if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}await req.call(de,{navigationUI:'hide'});if(screen.orientation&&screen.orientation.lock)await screen.orientation.lock('landscape').catch(()=>{});}catch(e){}refit();};}
{// ===== Ambulance (скорая): dispatched to each killed pedestrian; drives the road graph with siren + flashers, parks, two paramedics (PSX doctors) pick up the body, then it leaves. One at a time, incidents queued.
const AMB={q:[],st:'idle',t:0};window.__AMB=AMB;
{const QS=location.search,NEAR=/[?&]ambnear/.test(QS),FAST=/[?&]ambfast/.test(QS)?2.2:1;
 const DOORS=[];const G=new THREE.Group();G.visible=false;S.add(G);const body=new THREE.Group();G.add(body);
 // placeholder van (swapped for models/ambulance.glb when present)
 {const wm=new THREE.MeshLambertMaterial({color:0xf2f2ee}),rm=new THREE.MeshLambertMaterial({color:0xd21c1c}),gm=new THREE.MeshLambertMaterial({color:0x1a2430}),km=new THREE.MeshLambertMaterial({color:0x111111});
  const bx=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=!mobile;body.add(o);return o;};
  bx(2.05,1.95,3.6,wm,0,1.45,-.75);bx(2.0,1.25,1.7,wm,0,1.05,1.85);bx(1.9,.62,.05,gm,0,1.4,2.71);bx(2.07,.22,5.25,rm,0,1.05,0);
  // hinged doors: front cab doors hinge at the front edge, rear double doors hinge at the outer edges
  const mkDoor=(hx,hz,w,h,d,mx,my,mz,dec)=>{const pv=new THREE.Group();pv.position.set(hx,0,hz);body.add(pv);const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wm);o.position.set(mx,my,mz);o.castShadow=!mobile;pv.add(o);if(dec)dec(pv);pv.a=0;pv.tg=0;DOORS.push(pv);return pv;};
  [1,-1].forEach(sd=>{const p=mkDoor(sd*1.03,2.62,.06,1.15,1.5,0,1.05,-.75,pv=>{const g=new THREE.Mesh(new THREE.BoxGeometry(.065,.5,.85),gm);g.position.set(0,1.42,-.75);pv.add(g);const r=new THREE.Mesh(new THREE.BoxGeometry(.07,.2,1.5),rm);r.position.set(0,1.05,-.75);pv.add(r);});p.sd=sd;p.open=-sd*1.25;p.kind='F';});
  [1,-1].forEach(sd=>{const p=mkDoor(sd*1.03,-2.58,1.02,1.75,.06,-sd*.51,1.4,0,pv=>{const g=new THREE.Mesh(new THREE.BoxGeometry(.6,.45,.065),gm);g.position.set(-sd*.51,1.85,0);pv.add(g);const r=new THREE.Mesh(new THREE.BoxGeometry(1.02,.2,.07),rm);r.position.set(-sd*.51,1.05,0);pv.add(r);});p.sd=sd;p.open=-sd*1.75;p.kind='R';});
  bx(1.9,1.6,.04,gm,0,1.4,-2.53);bx(.04,.05,.05,km,0,.1,0);
  // red cross on the sides
  [1,-1].forEach(sd=>{bx(.03,.5,.16,rm,sd*1.04,1.75,-.9);bx(.03,.16,.5,rm,sd*1.04,1.75,-.9);});
  [[.88,1.55],[-.88,1.55],[.88,-1.65],[-.88,-1.65]].forEach(([x,z])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.26,12).rotateZ(Math.PI/2),km);w.position.set(x,.36,z);body.add(w);});}
 const L1=new THREE.MeshBasicMaterial({color:0x2050ff}),L2=new THREE.MeshBasicMaterial({color:0xff2020}),LO=new THREE.MeshBasicMaterial({color:0x223344});
 const lb1=new THREE.Mesh(new THREE.BoxGeometry(.55,.16,.3),LO),lb2=lb1.clone();lb1.position.set(.42,2.5,1.0);lb2.position.set(-.42,2.5,1.0);G.add(lb1,lb2);
 const PL=mobile?null:new THREE.PointLight(0x3060ff,0,22,1.5);if(PL){PL.position.set(0,2.8,.5);G.add(PL);}
 if(THREE.GLTFLoader){const ld=new THREE.GLTFLoader();if(window.MeshoptDecoder)ld.setMeshoptDecoder(MeshoptDecoder);ld.load('models/ambulance.glb',gl=>{const m=gl.scene;const b=new THREE.Box3().setFromObject(m),sz=b.getSize(new THREE.Vector3());const k=5.3/Math.max(sz.x,sz.z);m.scale.setScalar(k);if(sz.x>sz.z)m.rotation.y=Math.PI/2;m.updateMatrixWorld(true);const b2=new THREE.Box3().setFromObject(m);m.position.y-=b2.min.y;body.clear();body.add(m);console.log('ambulance model loaded');},undefined,()=>{});}
 // siren (WebAudio, positional)
 let SR=null;const sirenOn=()=>{if(SR)return;const c=PED.vctx&&PED.vctx();if(!c)return;const o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter(),pn=c.createPanner();o.type='triangle';o2.type='square';o2.detune.value=8;f.type='bandpass';f.frequency.value=1100;f.Q.value=.7;g.gain.value=.0;pn.panningModel='equalpower';pn.distanceModel='inverse';pn.refDistance=10;pn.rolloffFactor=1.1;o.connect(f);o2.connect(f);f.connect(g);g.connect(pn);pn.connect(c.destination);o.start();o2.start();SR={o,o2,g,pn,c};};
 const sirenOff=()=>{if(!SR)return;try{SR.o.stop();SR.o2.stop();}catch(e){}SR=null;};
 let V={x:0,z:0,h:0,v:0},route=null,ri=0,inc=null,medics=[],tt=0;AMB.V=V;
 const go=(from,to)=>{const r=NAV.path&&NAV.path(from[0],from[1],to[0],to[1]);if(!r||r.length<2)return false;route=r;ri=0;V.x=r[0][0];V.z=r[0][1];V.h=Math.atan2(r[1][0]-r[0][0],r[1][1]-r[0][1]);V.v=0;return true;};
 PED.onKill=(p,x,z)=>{AMB.q.push({p,x,z,t:performance.now()});console.log('AMB incident queued',AMB.q.length);};
 const drive=(dt,vmax,stopD)=>{if(!route)return true;// pure pursuit along route, keep right lane
  let tx,tz,rem=0;for(;ri<route.length-1;ri++){const a=route[ri+1];if(Math.hypot(a[0]-V.x,a[1]-V.z)>7)break;}const a=route[Math.min(ri+1,route.length-1)],b=route[Math.max(0,ri)];const dx=a[0]-b[0],dz=a[1]-b[1],L=Math.hypot(dx,dz)||1;tx=a[0]+dz/L*1.8;tz=a[1]-dx/L*1.8;
  for(let i=ri+1;i<route.length-1;i++)rem+=Math.hypot(route[i+1][0]-route[i][0],route[i+1][1]-route[i][1]);rem+=Math.hypot(a[0]-V.x,a[1]-V.z);
  const want=Math.atan2(tx-V.x,tz-V.z);let dh=want-V.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));V.h+=Math.max(-1,Math.min(1,dh))*Math.min(1,dt*2.5);
  // yield to the player car right ahead
  const fx=Math.sin(V.h),fz=Math.cos(V.h),px=st.x-V.x,pz=st.z-V.z,ahead=px*fx+pz*fz,side=Math.abs(px*fz-pz*fx);const block=ahead>0&&ahead<10&&side<2.4;
  let vt=Math.min(vmax,Math.max(2.5,rem*.5))*(Math.abs(dh)>.6?.5:1);if(block)vt=0;if(stopD!==undefined&&rem<stopD)vt=0;V.v+=(vt-V.v)*Math.min(1,dt*(vt<V.v?2.5:1.2));
  V.x+=fx*V.v*dt;V.z+=fz*V.v*dt;return (stopD!==undefined&&rem<stopD&&V.v<.4)||(ri>=route.length-2&&rem<3);};
 const collide=()=>{// heavy OBB vs player car: push the player out and kill its speed
  const c=Math.cos(V.h),s=Math.sin(V.h),dx=st.x-V.x,dz=st.z-V.z,lx=dx*c-dz*s,lz=dx*s+dz*c,HX=1.05+1.0,HZ=2.65+2.1;
  if(Math.abs(lx)<HX&&Math.abs(lz)<HZ){const px=HX-Math.abs(lx),pz=HZ-Math.abs(lz);let ox=0,oz=0;if(px<pz)ox=Math.sign(lx)*px;else oz=Math.sign(lz)*pz;st.x+=ox*c+oz*s;st.z+=-ox*s+oz*c;if(Math.abs(st.v)>1.5){st.v*=-.25;if(window.__XM&&__XM.shake)__XM.shake(.3);}else st.v*=.5;AMB.hits=(AMB.hits||0)+1;}};
 const cleanBody=p=>{if(!p)return;PED.parts=PED.parts.filter(o=>{if(o.own===p){o.m.parent&&o.m.parent.remove(o.m);return false;}return true;});if(p.g&&p.g.parent)p.g.parent.remove(p.g);p.picked=1;p.respawn=Math.min(p.respawn||0,3);};
 const doorsTo=(k,o)=>DOORS.forEach(d=>{if(d.kind===k)d.tg=o?d.open:0;});const doorsAt=k=>DOORS.every(d=>d.kind!==k||Math.abs(d.a-d.tg)<.05);
const W=(lx,lz)=>{const c=Math.cos(V.h),s2=Math.sin(V.h);return [V.x+lx*c+lz*s2,V.z-lx*s2+lz*c];};
const bag=new THREE.Mesh(new THREE.BoxGeometry(.55,.32,1.9),new THREE.MeshLambertMaterial({color:0x2a3a2a}));bag.visible=false;S.add(bag);
const walkTo=(m,t,dt,sp)=>{const P=m.g.position,dx=t[0]-P.x,dz=t[1]-P.z,d=Math.hypot(dx,dz);if(d<.15)return true;const k=Math.min(d,(sp||1.5)*dt);P.x+=dx/d*k;P.z+=dz/d*k;m.g.rotation.y=Math.atan2(dx,dz);return false;};
// scripted pickup: stop -> front doors open -> medics step out of the seats -> close -> walk to body -> kneel -> carry bag -> rear doors open -> load -> close -> back to cab -> doors open -> in -> close -> drive
const stepMedics=dt=>{const ph=AMB.ph;AMB.pt=(AMB.pt||0)+dt;const nx=p=>{AMB.ph=p;AMB.pt=0;if(window.__AMBLOG)console.log('AMB ph',p);};
 if(AMB.st==='park'){AMB.st='medic';nx('fopen');}
 if(ph==='fopen'){doorsTo('F',1);if(doorsAt('F')){for(let i=0;i<2;i++){const sd=i?1:-1,m=PED.spawnChar('D');m.sd=sd;const q=W(sd*.45,1.85);m.g.position.set(q[0],.12,q[1]);m.g.rotation.y=V.h+sd*Math.PI/2;m.g.visible=true;m.play('Walk',.2);medics.push(m);}nx('exit');}}
 else if(ph==='exit'){let ok=1;medics.forEach(m=>{if(!walkTo(m,W(m.sd*1.9,1.85),dt,1.1))ok=0;});if(ok){doorsTo('F',0);nx('tobody');}}
 else if(ph==='tobody'){let ok=1;const fx=inc.x-V.x,fz=inc.z-V.z;medics.forEach(m=>{const d=Math.hypot(fx,fz)||1;if(!walkTo(m,[inc.x-fx/d*.75*m.sd*0+(-fz/d)*.0+m.sd*.7*Math.cos(V.h),inc.z-m.sd*.7*Math.sin(V.h)],dt))ok=0;});if(ok){medics.forEach(m=>{m.g.rotation.y=Math.atan2(inc.x-m.g.position.x,inc.z-m.g.position.z);m.play(m.A.Kneel?'Kneel':(m.A.Pickup?'Pickup':'Sit'),.3);});nx('kneel');}}
 else if(ph==='kneel'){if(AMB.pt>3){cleanBody(inc.p);inc.done=1;bag.visible=true;medics.forEach(m=>m.play('Walk',.3));doorsTo('R',1);nx('carry');}}
 else if(ph==='carry'){let ok=1;medics.forEach(m=>{if(!walkTo(m,W(m.sd*.55,-3.3-(m.sd>0?0:0)),dt,1.1))ok=0;});const a=medics[0].g.position,b2=medics[1].g.position;bag.position.set((a.x+b2.x)/2,.85,(a.z+b2.z)/2);bag.rotation.y=Math.atan2(b2.x-a.x,b2.z-a.z)+Math.PI/2;if(ok&&doorsAt('R')){medics.forEach(m=>{m.g.rotation.y=V.h;m.play('Idle',.3);});nx('load');}}
 else if(ph==='load'){const k=Math.min(1,AMB.pt/1.5),q0=W(0,-3.3),q1=W(0,-1.2);bag.rotation.y=V.h;bag.position.set(q0[0]+(q1[0]-q0[0])*k,.85+.25*k,q0[1]+(q1[1]-q0[1])*k);if(k>=1){bag.visible=false;doorsTo('R',0);medics.forEach(m=>m.play('Walk',.3));nx('tocab');}}
 else if(ph==='tocab'){let ok=1;medics.forEach(m=>{const P=m.g.position,q=W(m.sd*1.9,1.85),mid=W(m.sd*1.9,-2.2);const lx=(P.x-V.x)*Math.cos(V.h)-(P.z-V.z)*Math.sin(V.h);if(Math.abs(lx)<1.6){if(!walkTo(m,mid,dt))ok=0;}else if(!walkTo(m,q,dt))ok=0;});if(ok){doorsTo('F',1);if(doorsAt('F'))nx('enter');}}
 else if(ph==='enter'){let ok=1;medics.forEach(m=>{if(!walkTo(m,W(m.sd*.45,1.85),dt,1.1))ok=0;});if(ok){medics.forEach(m=>S.remove(m.g));medics=[];doorsTo('F',0);nx('fclose');}}
 else if(ph==='fclose'){if(doorsAt('F')&&AMB.pt>.4){nx('');const away=NAV.nodeAt(V.x,V.z,300,450);if(!away||!go([V.x,V.z],away)){AMB.st='gone';}else{AMB.st='away';sirenOff();sirenOn();}console.log('AMB leaving');}}
 medics.forEach(m=>m.mx.update(dt));};
AMB.tick=dt=>{dt=Math.min(dt,.05)*FAST;tt+=dt;
  if(AMB.st==='idle'){if(!AMB.q.length||!NAV.nodeAt)return;inc=AMB.q.shift();AMB.inc=inc;if(inc.p&&inc.p.picked)return;const sp=NAV.nodeAt(inc.x,inc.z,NEAR?50:200,NEAR?90:400);if(!sp||Math.hypot(sp[0]-st.x,sp[1]-st.z)<(NEAR?30:150)){AMB.q.unshift(inc);return;}
   if(!go(sp,[inc.x,inc.z])){console.log('AMB no route');return;}AMB.st='to';G.visible=true;sirenOn();console.log('AMB dispatched',Math.hypot(sp[0]-inc.x,sp[1]-inc.z).toFixed(0),'m');}
  if(!G.visible)return;
  // flashers + siren wail
  const ph=Math.floor(tt*6)%2,lit=AMB.st!=='gone';lb1.material=lit&&ph?L1:LO;lb2.material=lit&&!ph?L2:LO;if(PL){PL.intensity=lit?(tod==2?6:2.5):0;PL.color.setHex(ph?0x3060ff:0xff3030);}
  if(SR){const c=SR.c,t=c.currentTime,f=900+450*Math.sin(tt*1.6);SR.o.frequency.setTargetAtTime(f,t,.05);SR.o2.frequency.setTargetAtTime(f*.5,t,.05);SR.g.gain.setTargetAtTime(AMB.st==='to'||AMB.st==='away'?.22:0,t,.3);const pn=SR.pn;if(pn.positionX){pn.positionX.value=V.x;pn.positionY.value=2;pn.positionZ.value=V.z;}else pn.setPosition(V.x,2,V.z);}
  if(AMB.st==='to'){if(drive(dt,13,13)){AMB.st='park';AMB.t=0;console.log('AMB arrived');}}
  else if(AMB.st==='park'||AMB.st==='medic'){V.v=0;AMB.t+=dt;stepMedics(dt);}
  else if(AMB.st==='away'){const fin=drive(dt,13);if(fin||Math.hypot(V.x-st.x,V.z-st.z)>260)AMB.st='gone';}
  if(AMB.st==='gone'){G.visible=false;sirenOff();route=null;AMB.st='idle';AMB.done=(AMB.done||0)+1;console.log('AMB despawned');return;}
  DOORS.forEach(d=>{d.a+=Math.sign(d.tg-d.a)*Math.min(Math.abs(d.tg-d.a),dt*2.2);d.rotation.y=d.a;});G.position.set(V.x,0,V.z);G.rotation.y=V.h;collide();};
}}
fit();
requestAnimationFrame(frame);
})();

