// player.js — playable character (PSX Killer_04) : on-foot mode + driver in the BMW (seat, wheel IK, gear hand).
// Hooks in game.js: window.__G handles, step() input gate (__PLY.foot), frame render (__PLY.tick / __PLY.cam), setGear -> __PLY.onGear.
// Controls (on foot): WASD/arrows move, Shift run, C crouch, Space jump, V 1st/3rd person, F enter/exit car, mouse drag look (wheel = zoom).
// Mobile: left-half virtual joystick (push to the edge = run), right-half drag = look, buttons 🚪 🦆 👁 ⤒.
(function(){
const G=window.__G;if(!G){console.warn('player.js: no __G');return;}
const T=THREE,{S,car,cab,body,st,K,XM,cam}=G,mobile=G.mobile;
const PLY={foot:false,cam:null,ready:false,mode:'car',seq:null,fpv:false,crouch:false};window.__PLY=PLY;
const retarget=(t,CLIPS,SRCB)=>{if(t.clips)return t.clips;const CB={};t.sk.skeleton.bones.forEach(b=>{CB[b.name]={q:t.rest[b.name],par:b.parent&&b.parent.isBone?b.parent.name:null};});
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
const PART=n=>/Head|Neck/.test(n)?0:/LeftShoulder|LeftArm|LeftForeArm|LeftHand/.test(n)?1:/RightShoulder|RightArm|RightForeArm|RightHand/.test(n)?2:/LeftUpLeg|LeftLeg|LeftFoot|LeftToe/.test(n)?3:/RightUpLeg|RightLeg|RightFoot|RightToe/.test(n)?4:5;
let CLIPS={},SRCB={},tpl=null,o=null,sk=null,mx=null,A={},cur=null,B={};
const ldp=(ld,u)=>new Promise((a,b)=>ld.load(u,a,undefined,b));
const ld=new T.GLTFLoader();if(window.MeshoptDecoder)ld.setMeshoptDecoder(MeshoptDecoder);
// ---------- camera for on-foot
const fcam=new T.PerspectiveCamera(mobile&&innerWidth<innerHeight?80:62,innerWidth/innerHeight,.05,1500);addEventListener('resize',()=>{fcam.aspect=innerWidth/innerHeight;fcam.updateProjectionMatrix();});
const P={x:0,z:0,y:0,vy:0,h:0,yaw:0,pitch:-.12,dist:3.2,spd:0,air:false,anim:''};PLY.P=P;
// ---------- collision: building edges grid + game obstacles
const CS=8,BG={};const bk=(x,z)=>Math.floor(x/CS)+','+Math.floor(z/CS);
(G.C.b||[]).forEach(b=>{const p=b.p;for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length];const x0=Math.min(a[0],c[0]),x1=Math.max(a[0],c[0]),z0=Math.min(a[1],c[1]),z1=Math.max(a[1],c[1]);
 for(let gx=Math.floor(x0/CS);gx<=Math.floor(x1/CS);gx++)for(let gz=Math.floor(z0/CS);gz<=Math.floor(z1/CS);gz++)(BG[gx+','+gz]=BG[gx+','+gz]||[]).push([a[0],a[1],c[0],c[1]]);}});
const segP=(x,z,ax,az,bx,bz)=>{const dx=bx-ax,dz=bz-az,L=dx*dx+dz*dz||1;const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/L));return [ax+dx*t,az+dz*t];};
const pushC=(cx,cz,r,R)=>{const dx=P.x-cx,dz=P.z-cz,d=Math.hypot(dx,dz),m=r+R;if(d<m&&d>1e-6){P.x=cx+dx/d*m;P.z=cz+dz/d*m;}};
const pushOBB=(cx,cz,h,hx,hz,R)=>{const s=Math.sin(h),c=Math.cos(h),dx=P.x-cx,dz=P.z-cz;let lx=dx*c-dz*s,lz=dx*s+dz*c;const qx=Math.max(-hx,Math.min(hx,lx)),qz=Math.max(-hz,Math.min(hz,lz));let ex=lx-qx,ez=lz-qz,d=Math.hypot(ex,ez);
 if(d>=R)return;if(d<1e-6){const px=hx-Math.abs(lx),pz=hz-Math.abs(lz);if(px<pz){lx=Math.sign(lx||1)*(hx+R);}else lz=Math.sign(lz||1)*(hz+R);}else{lx=qx+ex/d*R;lz=qz+ez/d*R;}P.x=cx+lx*c+lz*s;P.z=cz-lx*s+lz*c;};
const pip=(x,z,p)=>{let n=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])n=!n;}return n;};
function collide(){const R=.28;const gx=Math.floor(P.x/CS),gz=Math.floor(P.z/CS);const CX=G.COLX;
 for(let it=0;it<2;it++){for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++){const k=(gx+a)+','+(gz+c);(BG[k]||[]).forEach(s=>{const q=segP(P.x,P.z,s[0],s[1],s[2],s[3]);pushC(q[0],q[1],0,R);});
   (CX.S[k]||[]).forEach(o2=>{const q=segP(P.x,P.z,o2.a[0],o2.a[1],o2.b[0],o2.b[1]);pushC(q[0],q[1],o2.th,R);});(CX.P&&CX.P[k]||[]).forEach(o2=>{if(!o2.down)pushC(o2.x,o2.z,o2.r,R);});(CX.G[k]||[]).forEach(o2=>{if(!o2.bush)pushC(o2.x,o2.z,o2.r,R);});}
  pushOBB(st.x,st.z,st.h,.97,2.45,R);
  if(window.__PCAR)__PCAR.L.forEach(q=>{if(Math.abs(q[0]-P.x)<4&&Math.abs(q[1]-P.z)<4)pushOBB(q[0],q[1],q[2],.82,2.05,R);});}}
const camBlock=(x0,z0,x1,z1)=>{// shortest fraction along head->camera crossing a building edge or car box
 let best=1;const gx0=Math.floor(Math.min(x0,x1)/CS)-1,gx1=Math.floor(Math.max(x0,x1)/CS)+1,gz0=Math.floor(Math.min(z0,z1)/CS)-1,gz1=Math.floor(Math.max(z0,z1)/CS)+1;
 const isx=(ax,az,bx,bz)=>{const rx=x1-x0,rz=z1-z0,sx=bx-ax,sz=bz-az,dn=rx*sz-rz*sx;if(Math.abs(dn)<1e-9)return;const t=((ax-x0)*sz-(az-z0)*sx)/dn,u=((ax-x0)*rz-(az-z0)*rx)/dn;if(t>0&&t<best&&u>=0&&u<=1)best=t;};
 for(let a=gx0;a<=gx1;a++)for(let c=gz0;c<=gz1;c++)(BG[a+','+c]||[]).forEach(s=>isx(s[0],s[1],s[2],s[3]));
 const s=Math.sin(st.h),c=Math.cos(st.h),cr=[[1,2.4],[-1,2.4],[-1,-2.4],[1,-2.4]].map(([lx,lz])=>[st.x+lx*c+lz*s,st.z-lx*s+lz*c]);for(let i=0;i<4;i++){const a=cr[i],b=cr[(i+1)%4];isx(a[0],a[1],b[0],b[1]);}
 return best;};
// ---------- driver door: cut the exterior body around the front-left door into a hinged mesh
const DOOR={piv:null,a:0,tg:0};PLY.DOOR=DOOR;
function cutDoor(){if(DOOR.piv||!XM.root)return;const inv=new T.Matrix4().copy(body.matrixWorld).invert();body.updateMatrixWorld(true);
 const HZ=.96,RZ=-.40,Y0=.36,Y1=1.47,X0=.72;const pos=[],nor=[],uvs=[];const piv=new T.Group();piv.position.set(1.02,0,HZ);body.add(piv);
 XM.root.traverse(m=>{if(!m.isMesh||!/^Body/.test(m.name)||!m.geometry.index)return;const g=m.geometry,Pp=g.attributes.position,Nn=g.attributes.normal,Uu=g.attributes.uv,ix=g.index;
  const M=new T.Matrix4().multiplyMatrices(inv,m.matrixWorld),NM=new T.Matrix3().getNormalMatrix(M),v=new T.Vector3(),n=new T.Vector3();const keep=[],dp=[],dn=[],du=[];
  const W=i=>v.fromBufferAttribute(Pp,i).applyMatrix4(M).clone();
  for(let t=0;t<ix.count;t+=3){const a=ix.getX(t),b=ix.getX(t+1),c=ix.getX(t+2);const pa=W(a),pb=W(b),pc=W(c);const cx=(pa.x+pb.x+pc.x)/3,cy=(pa.y+pb.y+pc.y)/3,cz=(pa.z+pb.z+pc.z)/3;
   const inDoor=cx>X0&&cz<HZ&&cz>RZ&&cy>Y0&&cy<Y1&&!(cy>1.0&&cz>HZ-.25-(cy-1.0)*1.1);// A-pillar slope above the beltline stays on the body
   if(!inDoor){keep.push(a,b,c);continue;}
   [[a,pa],[b,pb],[c,pc]].forEach(([i,p])=>{dp.push(p.x-1.02,p.y,p.z-HZ);if(Nn){n.fromBufferAttribute(Nn,i).applyMatrix3(NM).normalize();dn.push(n.x,n.y,n.z);}if(Uu)du.push(Uu.getX(i),Uu.getY(i));});}
  if(!dp.length)return;const ng=g.clone();ng.setIndex(keep);m.geometry=ng;// cabin clone keeps the original (shared) geometry
  const dg=new T.BufferGeometry();dg.setAttribute('position',new T.Float32BufferAttribute(dp,3));if(dn.length)dg.setAttribute('normal',new T.Float32BufferAttribute(dn,3));else dg.computeVertexNormals();if(du.length)dg.setAttribute('uv',new T.Float32BufferAttribute(du,2));
  const dm=new T.Mesh(dg,m.material);dm.castShadow=m.castShadow;dm.name='Door_'+m.name;piv.add(dm);});
 DOOR.piv=piv;console.log('PLY door cut',piv.children.length,'parts');}
// ---------- load
(async()=>{try{const ga=await ldp(ld,'models/peds/anims_player.glb');ga.animations.forEach(a=>{a.tracks=a.tracks.filter(t=>t.name.endsWith('.quaternion')||/Hips\.position/.test(t.name));CLIPS[a.name]=a;});
 ga.scene.traverse(n=>{if(n.isBone||/mixamorig/.test(n.name))SRCB[n.name]={q:n.quaternion.clone(),p:n.position.clone(),par:n.parent&&/mixamorig/.test(n.parent.name)?n.parent.name:null};});
 const g=await ldp(ld,'models/peds/player.glb');o=g.scene.children[0];o.traverse(n=>{if(n.isSkinnedMesh)sk=n;if(n.isBone)n.name=n.name.replace(/_\d+$/,'');});
 const m=sk.material;if(m.map){m.map.magFilter=T.NearestFilter;m.map.encoding=T.sRGBEncoding;}sk.material=new T.MeshLambertMaterial({map:m.map});sk.frustumCulled=false;sk.castShadow=true;o.position.set(0,0,0);
 const rest={},restP={};sk.skeleton.bones.forEach(b=>{rest[b.name]=b.quaternion.clone();restP[b.name]=b.position.clone();B[b.name]=b;});tpl={sk,rest,restP};
 const root=new T.Group();root.add(o);root.name="PLAYER";PLY.root=root;mx=new T.AnimationMixer(o);const CL=retarget(tpl,CLIPS,SRCB);for(const n in CL)A[n]=mx.clipAction(CL[n]);
 ['JumpStart','JumpLand','SitExit','SitEnter','Interact'].forEach(n=>{if(A[n]){A[n].setLoop(T.LoopOnce);A[n].clampWhenFinished=true;}});
 car.add(root);play('Drive',0);PLY.ready=true;PLY.clips=Object.keys(A);console.log('PLY ready clips',PLY.clips.join(','));}catch(e){console.error('player.js load',e);}})();
const play=(n,f=.2,ts=1)=>{const a=A[n];if(!a)return;a.timeScale=ts;if(cur===a)return;a.reset().play();if(cur&&f>0)cur.crossFadeTo(a,f,false);else if(cur)cur.stop();cur=a;P.anim=n;};
// ---------- IK
const _a=new T.Vector3(),_b=new T.Vector3(),_c=new T.Vector3(),_d=new T.Vector3(),_e=new T.Vector3(),_q=new T.Quaternion(),_q2=new T.Quaternion(),_m=new T.Matrix4();
const wp=(b,v)=>v.setFromMatrixPosition(b.matrixWorld);
const rotBoneWorld=(bone,from,to)=>{_q.setFromUnitVectors(from.clone().normalize(),to.clone().normalize());bone.getWorldQuaternion(_q2);_q2.premultiply(_q);const pq=new T.Quaternion();bone.parent.getWorldQuaternion(pq);bone.quaternion.copy(pq.invert().multiply(_q2));bone.updateMatrixWorld(true);};
function ik(side,target,pole){const up=B['mixamorig'+side+'Arm'],lo=B['mixamorig'+side+'ForeArm'],ha=B['mixamorig'+side+'Hand'];if(!up||!lo||!ha)return;
 const s=wp(up,new T.Vector3()),e=wp(lo,new T.Vector3()),h=wp(ha,new T.Vector3());const a=s.distanceTo(e),b=e.distanceTo(h);const dv=target.clone().sub(s);let d=dv.length();d=Math.max(.01,Math.min(a+b-.002,d));dv.normalize();
 const ca=Math.max(-1,Math.min(1,(a*a+d*d-b*b)/(2*a*d))),al=Math.acos(ca);const pp=pole.clone().sub(dv.clone().multiplyScalar(pole.dot(dv)));if(pp.lengthSq()<1e-8)pp.set(0,-1,0);pp.normalize();
 const ne=s.clone().add(dv.clone().multiplyScalar(Math.cos(al)*a)).add(pp.multiplyScalar(Math.sin(al)*a));rotBoneWorld(up,e.clone().sub(s),ne.clone().sub(s));
 const e2=wp(lo,new T.Vector3()),h2=wp(ha,new T.Vector3());rotBoneWorld(lo,h2.clone().sub(e2),target.clone().sub(e2));}
// wheel grips (car-local rest frame of the steering wheel -> follow XM.sw world matrix as it turns)
let GRIP=null;const GEAR=new T.Vector3(.03,.88,.24),gearH={t:-1};PLY.GEAR=GEAR;
function initGrip(){const sw=XM.sw;if(!sw)return;sw.updateWorldMatrix(true,false);const ctr=new T.Vector3(.394,1.101,.43),n=XM.swAx.clone().normalize();const u=new T.Vector3(0,1,0).sub(n.clone().multiplyScalar(n.y)).normalize(),r=new T.Vector3().crossVectors(u,n).normalize();
 const R=.175,pt=(ang)=>ctr.clone().add(u.clone().multiplyScalar(Math.cos(ang)*R)).add(r.clone().multiplyScalar(Math.sin(ang)*R));const L=pt(1.25),Rr=pt(-1.25);const left=L.x>Rr.x?L:Rr,right=L.x>Rr.x?Rr:L;
 car.updateMatrixWorld(true);const toSW=new T.Matrix4().copy(sw.matrixWorld).invert().multiply(car.matrixWorld);const wr=p=>p.clone().sub(ctr).normalize().multiplyScalar(-.035).add(p).add(n.clone().multiplyScalar(.05)).sub(u.clone().multiplyScalar(.03));GRIP={L:wr(left).applyMatrix4(toSW),R:wr(right).applyMatrix4(toSW)};}
PLY.onGear=g=>{if(!PLY.foot&&PLY.ready)gearH.t=0;};
// seated: align head to the driver eye point, then arms to the wheel
const EYE=new T.Vector3(.394,1.32,-.12);
const armK=k=>{if(PLY._ak===k)return;PLY._ak=k;['Left','Right'].forEach(sd=>['ForeArm','Hand'].forEach(n=>{const bn=B['mixamorig'+sd+n];if(bn)bn.position.copy(tpl.restP[bn.name]).multiplyScalar(k);}));const m=sk.material;m.emissiveMap=k>1?m.map:null;m.emissive.setScalar(k>1?.45:0);m.needsUpdate=true;};
function seatPose(dt,showHead){armK(1.22);const root=PLY.root;if(root.parent!==car)car.add(root);root.position.set(0,0,0);root.rotation.set(0,0,0);o.position.set(0,0,0);
 play('Drive',.3);mx.update(dt);root.updateMatrixWorld(true);const hd=B.mixamorigHead;if(hd){const hp=car.worldToLocal(wp(hd,new T.Vector3()));o.position.set(EYE.x-hp.x,EYE.y-.07-hp.y,EYE.z+.05-hp.z);root.updateMatrixWorld(true);}
 if(GRIP===null)initGrip();if(GRIP&&XM.sw){XM.sw.updateWorldMatrix(true,false);const gl=GRIP.L.clone().applyMatrix4(XM.sw.matrixWorld),gr=GRIP.R.clone().applyMatrix4(XM.sw.matrixWorld);
  const down=new T.Vector3(0,-1,0),outL=new T.Vector3(1,0,0).transformDirection(car.matrixWorld);
  ik('Left',gl,down.clone().add(outL.clone().multiplyScalar(.6)));
  let tr=gr;if(PLY.dbgGear)gearH.t=.3;if(gearH.t>=0){gearH.t+=dt;const k=gearH.t<.18?gearH.t/.18:gearH.t<.58?1:Math.max(0,1-(gearH.t-.58)/.18);if(gearH.t>.76)gearH.t=-1;const gp=GEAR.clone().applyMatrix4(car.matrixWorld);tr=gr.clone().lerp(gp,k*k*(3-2*k));}
  ik('Right',tr,down.clone().sub(outL.clone().multiplyScalar(.6)));}
 setHead(showHead);}
const setHead=v=>{const hd=B.mixamorigHead;if(hd){const s=v?1:.001;hd.scale.setScalar(s);hd.updateMatrixWorld(true);}};
// ---------- input (on foot)
const J={x:0,y:0,on:false,id:-1,ox:0,oy:0,look:-1,lx:0,ly:0};let drag=false,dx0=0,dy0=0;
addEventListener('keydown',e=>{if(e.repeat)return;const c=e.code;if(c==='KeyF'){e.preventDefault();toggle();}
 if(!PLY.foot)return;if(c==='KeyC')PLY.crouch=!PLY.crouch;if(c==='KeyV')PLY.fpv=!PLY.fpv;if(c==='Space'&&!P.air&&!PLY.seq){P.vy=4.2;P.air=true;play('JumpStart',.1);}},true);
const cv=G.R.domElement;
cv.addEventListener('mousedown',e=>{if(!PLY.foot)return;drag=true;dx0=e.clientX;dy0=e.clientY;});addEventListener('mouseup',()=>drag=false);
addEventListener('mousemove',e=>{if(!PLY.foot||!drag)return;P.yaw-=(e.clientX-dx0)*.006;P.pitch=Math.max(-1.2,Math.min(.9,P.pitch-(e.clientY-dy0)*.005));dx0=e.clientX;dy0=e.clientY;});
cv.addEventListener('wheel',e=>{if(PLY.foot)P.dist=Math.max(1.6,Math.min(7,P.dist*(e.deltaY>0?1.1:.9)));},{passive:true});
// mobile UI
const ui=document.createElement('div');ui.id='plyUI';ui.style.cssText='position:fixed;inset:0;z-index:30;pointer-events:none;display:none;touch-action:none';document.body.appendChild(ui);
const jb=document.createElement('div');jb.style.cssText='position:absolute;width:120px;height:120px;border-radius:60px;border:2px solid rgba(255,255,255,.5);background:rgba(0,0,0,.18);display:none;pointer-events:none';const jk=document.createElement('div');jk.style.cssText='position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:25px;background:rgba(255,255,255,.55)';jb.appendChild(jk);ui.appendChild(jb);
const bst='position:absolute;width:58px;height:58px;border-radius:29px;border:0;background:rgba(10,16,24,.7);color:#fff;font:24px sans-serif;pointer-events:auto;touch-action:none';
const mkB=(t,css,f)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText=bst+';'+css;const h=e=>{e.preventDefault();e.stopPropagation();f();};b.addEventListener('touchstart',h,{passive:false});b.addEventListener('click',h);return b;};
ui.appendChild(mkB('🦆','right:20px;bottom:100px',()=>PLY.crouch=!PLY.crouch));ui.appendChild(mkB('⤒','right:88px;bottom:30px',()=>{if(!P.air){P.vy=4.2;P.air=true;play('JumpStart',.1);}}));ui.appendChild(mkB('👁','right:20px;bottom:168px',()=>PLY.fpv=!PLY.fpv));
const doorB=mkB('🚪','right:20px;bottom:30px',()=>toggle());doorB.style.zIndex=31;document.body.appendChild(doorB);doorB.style.position='fixed';doorB.style.display='none';doorB.title='Выйти / сесть (F)';
const tstart=e=>{if(!PLY.foot)return;for(const t of e.changedTouches){if(t.clientX<innerWidth*.45&&J.id<0){J.id=t.identifier;J.ox=t.clientX;J.oy=t.clientY;J.x=J.y=0;jb.style.display='block';jb.style.left=(t.clientX-60)+'px';jb.style.top=(t.clientY-60)+'px';}else if(J.look<0){J.look=t.identifier;J.lx=t.clientX;J.ly=t.clientY;}}};
const tmove=e=>{if(!PLY.foot)return;e.preventDefault();for(const t of e.changedTouches){if(t.identifier===J.id){let x=(t.clientX-J.ox)/55,y=(t.clientY-J.oy)/55;const l=Math.hypot(x,y);if(l>1.15){x*=1.15/l;y*=1.15/l;}J.x=x;J.y=y;jk.style.left=(35+x*45)+'px';jk.style.top=(35+y*45)+'px';}
 else if(t.identifier===J.look){P.yaw-=(t.clientX-J.lx)*.008;P.pitch=Math.max(-1.2,Math.min(.9,P.pitch-(t.clientY-J.ly)*.006));J.lx=t.clientX;J.ly=t.clientY;}}};
const tend=e=>{for(const t of e.changedTouches){if(t.identifier===J.id){J.id=-1;J.x=J.y=0;jb.style.display='none';}if(t.identifier===J.look)J.look=-1;}};
cv.addEventListener('touchstart',tstart,{passive:true});addEventListener('touchmove',tmove,{passive:false});addEventListener('touchend',tend);addEventListener('touchcancel',tend);
// ---------- enter / exit
const lerp=(a,b,t)=>a+(b-a)*t;const DOORPT=new T.Vector3(1.45,0,.05);PLY.DOORPT=DOORPT;
const doorWorld=()=>{const s=Math.sin(st.h),c=Math.cos(st.h);return [st.x+DOORPT.x*c+DOORPT.z*s,st.z-DOORPT.x*s+DOORPT.z*c];};
let prevChase=false;
function toggle(){if(!PLY.ready||PLY.seq)return;if(!PLY.foot){if(Math.abs(st.v)*3.6>4)return;exitCar();}else{const [dx,dz]=doorWorld();if(Math.hypot(P.x-dx,P.z-dz)<3.2)enterCar();}}
PLY.toggle=toggle;
function exitCar(){cutDoor();if(st.sel!=='P')G.setGear('P');prevChase=G.chase;G.setChase(true);PLY.foot=true;PLY.seq={k:'exit',t:0};const tc=document.getElementById('tc');if(tc)tc.style.visibility='hidden';ui.style.display=mobile?'block':'none';
 P.yaw=st.h+Math.PI*.75;P.pitch=-.15;P.h=st.h+Math.PI/2;PLY.cam=fcam;}
function enterCar(){cutDoor();PLY.seq={k:'enter',t:0,x0:P.x,z0:P.z,h0:P.h};}
// door point in world for a car-local point
const c2w=(lx,lz)=>{const s=Math.sin(st.h),c=Math.cos(st.h);return [st.x+lx*c+lz*s,st.z-lx*s+lz*c];};
function standAt(lx,lz,hh){const [x,z]=c2w(lx,lz);P.x=x;P.z=z;P.h=hh;}
// ---------- per frame
let wasFoot=false;
PLY.tick=dt=>{if(!PLY.ready)return;dt=Math.min(dt,.05);if(DOOR.piv){DOOR.a+=Math.sign(DOOR.tg-DOOR.a)*Math.min(Math.abs(DOOR.tg-DOOR.a),dt*3.2);DOOR.piv.rotation.y=-DOOR.a;}
 doorB.style.display=(PLY.foot||Math.abs(st.v)*3.6<4)&&!document.getElementById('fmap')?.style.display.includes('block')?(mobile?'block':'none'):'none';
 const sq=PLY.seq;
 if(!PLY.foot){seatPose(dt,G.chase);return;}
 if(sq&&sq.k==='exit'){sq.t+=dt;DOOR.tg=1.05;const t=sq.t;
  if(t<.45){seatPose(dt,true);}
  else{const k=Math.min(1,(t-.45)/.7),root=PLY.root;if(root.parent!==S){S.add(root);}o.position.set(0,0,0);root.rotation.set(0,0,0);
   const lx=lerp(.62,DOORPT.x,k),lz=lerp(-.2,DOORPT.z,k);standAt(lx,lz,st.h+lerp(Math.PI/2,Math.PI*.6,k));P.y=lerp(.25,0,k);play(k<1?'Walk':'Idle',.25,.7);if(t>1.6)DOOR.tg=0;if(t>2.0){PLY.seq=null;}}}
 else if(sq&&sq.k==='enter'){sq.t+=dt;const t=sq.t;const [dx,dz]=doorWorld();
  if(t<.5){const k=t/.5;P.x=lerp(sq.x0,dx,k);P.z=lerp(sq.z0,dz,k);P.h=Math.atan2(dx-sq.x0,dz-sq.z0)||P.h;play('Walk',.2);DOOR.tg=1.05;}
  else if(t<1.2){const k=(t-.5)/.7;standAt(lerp(DOORPT.x,.62,k),lerp(DOORPT.z,-.2,k),st.h-Math.PI/2*(1-k)+Math.PI/2*0);P.y=lerp(0,.25,k);play('Idle',.2);}
  else{DOOR.tg=0;PLY.foot=false;PLY.cam=null;PLY.seq=null;G.setChase(prevChase);const tc=document.getElementById('tc');if(tc)tc.style.visibility='';ui.style.display='none';seatPose(dt,prevChase);return;}}
 else{// free walking
  let ix=0,iz=0;if(K.KeyW||K.ArrowUp)iz+=1;if(K.KeyS||K.ArrowDown)iz-=1;if(K.KeyA||K.ArrowLeft)ix+=1;if(K.KeyD||K.ArrowRight)ix-=1;let mag=Math.min(1,Math.hypot(ix,iz));
  let run=!!(K.ShiftLeft||K.ShiftRight);if(J.id>=0){ix=-J.x;iz=-J.y;const l=Math.hypot(ix,iz);mag=Math.min(1,l);run=l>.95;if(l<.12)mag=0;}
  const cr=PLY.crouch&&!run;const vmax=cr?1.0:run?5.6:1.7;const tgt=mag*vmax;P.spd+=(tgt-P.spd)*Math.min(1,dt*(tgt>P.spd?6:9));
  const fy=P.yaw+Math.PI;if(mag>0){const wx=Math.sin(fy)*iz+Math.cos(fy)*ix,wz=Math.cos(fy)*iz-Math.sin(fy)*ix,wl=Math.hypot(wx,wz)||1;P.mx=wx/wl;P.mz=wz/wl;if(!PLY.fpv){const th=Math.atan2(wx,wz);let d=th-P.h;d=Math.atan2(Math.sin(d),Math.cos(d));P.h+=d*Math.min(1,dt*10);}}
  if(PLY.fpv){P.h=fy;P.x+=(P.mx||0)*P.spd*dt;P.z+=(P.mz||0)*P.spd*dt;}else{P.x+=Math.sin(P.h)*P.spd*dt;P.z+=Math.cos(P.h)*P.spd*dt;}collide();
  if(P.air){P.vy-=9.8*dt;P.y+=P.vy*dt;if(P.y<=0){P.y=0;P.air=false;P.vy=0;play('JumpLand',.08);P.land=.35;}else if(P.vy<1.5)play('JumpLoop',.15);}
  if(P.land>0)P.land-=dt;
  if(!P.air&&!(P.land>0)){if(cr)play(P.spd>.15?'CrouchWalk':'CrouchIdle',.25,P.spd>.15?Math.max(.6,P.spd/1.0):1);else if(P.spd<.15)play('Idle',.25);else if(P.spd>3.2)play('Run',.2,P.spd/5.6);else play('Walk',.2,Math.max(.6,P.spd/1.5));}
  if(DOOR.tg>0&&!PLY.seq)DOOR.tg=0;}
 // place model
 armK(1);const root=PLY.root;if(root.parent!==S)S.add(root);root.position.set(P.x,P.y,P.z);root.rotation.set(0,P.h,0);o.position.set(0,0,0);mx.update(dt);root.updateMatrixWorld(true);
 // camera
 const hd=B.mixamorigHead,hp=hd?wp(hd,new T.Vector3()):new T.Vector3(P.x,1.6,P.z);
 if(PLY.fpv){setHead(false);fcam.position.copy(hp).add(new T.Vector3(Math.sin(P.h)*.12,.05,Math.cos(P.h)*.12));const ly=P.yaw+Math.PI;P.h=PLY.seq?P.h:(P.spd<.1?P.h:P.h);fcam.rotation.set(0,0,0);fcam.rotation.order='YXZ';fcam.rotation.y=ly+Math.PI;fcam.rotation.x=P.pitch;
  if(!PLY.seq&&(J.id>=0||K.KeyW||K.KeyS||K.KeyA||K.KeyD||K.ArrowUp||K.ArrowDown)){}// movement already camera-relative
 }else{setHead(true);const piv=new T.Vector3(P.x,P.y+(PLY.crouch?1.05:1.55),P.z);const cp=Math.cos(P.pitch),dx=Math.sin(P.yaw)*cp,dz=Math.cos(P.yaw)*cp,dy=-Math.sin(P.pitch);
  let d=P.dist;const f=camBlock(piv.x,piv.z,piv.x+dx*(d+.3),piv.z+dz*(d+.3));d=Math.max(.5,(d+.3)*f-.3);fcam.position.set(piv.x+dx*d,Math.max(.25,piv.y+dy*d),piv.z+dz*d);fcam.lookAt(piv);}
};
})();
