// cops.js — police / spetsnaz PSX characters (models/peds/cops.glb), not wired into AI yet.
// Node names: <ROLE>_<G>_<file>, ROLE: P=police, S=swat(spetsnaz); G: F/M.
// Usage: COPS.load(gltfLoader).then(C=>{ const e=C.police[0]; const p=COPS.spawn(e); scene.add(p.o); p.A.Walk.play(); /* p.mx.update(dt) */ });
// Same rig & per-character retarget as peds.glb (copied from game.js), shares models/peds/anims.glb.
(function(){
const ROLES={
 police:['P_F_Character_17_Female_Police','P_F_Character_18_Female_Police','P_F_Character_19_Female_Police','P_F_Character_20_Female_Police','P_F_Character_25_Female_Police','P_F_Character_26_Female_Police','P_M_Character_17_Police','P_M_Character_18_Police','P_M_Character_19_Police','P_M_Character_20_Police'],
 swat:['S_M_Character_21_Police','S_M_Character_22_Police']};
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
const sclone=src=>{const sm=new Map(),cm=new Map(),c=src.clone();const par=(a,b,f)=>{f(a,b);for(let i=0;i<a.children.length;i++)par(a.children[i],b.children[i],f);};par(src,c,(a,b)=>{sm.set(b,a);cm.set(a,b);});c.traverse(n=>{if(!n.isSkinnedMesh)return;const s=sm.get(n),bn=s.skeleton.bones;n.skeleton=s.skeleton.clone();n.bindMatrix.copy(s.bindMatrix);n.skeleton.bones=bn.map(b=>cm.get(b));n.bind(n.skeleton,n.bindMatrix);});return c;};
const PART=n=>/Head|Neck/.test(n)?0:/LeftShoulder|LeftArm|LeftForeArm|LeftHand/.test(n)?1:/RightShoulder|RightArm|RightForeArm|RightHand/.test(n)?2:/LeftUpLeg|LeftLeg|LeftFoot|LeftToe/.test(n)?3:/RightUpLeg|RightLeg|RightFoot|RightToe/.test(n)?4:5;
let CLIPS=null,SRCB=null,P=null;
const prep=o=>{let sk=null;o.traverse(n=>{if(n.isSkinnedMesh)sk=n;});if(!sk)return null;const m=sk.material;
 if(m.map){m.map.magFilter=THREE.NearestFilter;m.map.minFilter=THREE.NearestMipmapLinearFilter;m.map.encoding=THREE.sRGBEncoding;}
 sk.material=new THREE.MeshLambertMaterial({map:m.map});sk.frustumCulled=false;o.position.set(0,0,0);o.traverse(n=>{if(n.isBone)n.name=n.name.replace(/_\d+$/,'');});
 const w=new THREE.Group();w.add(o);w.name=o.name;
 const sw=sk.geometry.attributes.skinWeight,si=sk.geometry.attributes.skinIndex,bp=sk.skeleton.bones.map(b=>PART(b.name)),vp=new Uint8Array(sw.count);
 for(let i=0;i<sw.count;i++){let bw=-1,bj=0;for(let c=0;c<4;c++){const ww=[sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)][c];if(ww>bw){bw=ww;bj=[si.getX(i),si.getY(i),si.getZ(i),si.getW(i)][c];}}vp[i]=bp[bj];}
 const rest={},restP={};sk.skeleton.bones.forEach(b=>{rest[b.name]=b.quaternion.clone();restP[b.name]=b.position.clone();});
 const [r,gd]=o.name.split('_');return {o:w,vp,name:o.name,sk,rest,restP,role:r==='S'?'swat':'police',gender:gd};};
const ldp=(ld,u)=>new Promise((a,b)=>ld.load(u,a,undefined,b));
const load=(ld,base='models/peds/')=>P||(P=(async()=>{ld=ld||new THREE.GLTFLoader();if(window.MeshoptDecoder&&ld.setMeshoptDecoder)ld.setMeshoptDecoder(MeshoptDecoder);
 const ga=await ldp(ld,base+'anims.glb');CLIPS={};ga.animations.forEach(a=>{a.tracks=a.tracks.filter(t=>t.name.endsWith('.quaternion')||/Hips\.position/.test(t.name));CLIPS[a.name]=a;});
 SRCB={};ga.scene.traverse(n=>{if(n.isBone||/mixamorig/.test(n.name))SRCB[n.name]={q:n.quaternion.clone(),p:n.position.clone(),par:n.parent&&/mixamorig/.test(n.parent.name)?n.parent.name:null};});
 const g=await ldp(ld,base+'cops.glb');const R={police:[],swat:[],all:[]};g.scene.children.slice().forEach(o=>{const e=prep(o);if(!e)return;R[e.role].push(e);R.all.push(e);});
 window.COPS.ready=R;return R;})());
// clone a template into a live instance with retargeted actions (A.Walk, A.Run, A.Idle, A.Death, ...)
const spawn=t=>{const o=sclone(t.o);let sk=null;o.traverse(n=>{if(n.isSkinnedMesh)sk=n;});const mx=new THREE.AnimationMixer(o),A={},CL=retarget(t,CLIPS,SRCB);for(const n in CL)A[n]=mx.clipAction(CL[n]);return {o,sk,mx,A,t,role:t.role,gender:t.gender};};
window.COPS={ROLES,load,spawn,ready:null};
})();
