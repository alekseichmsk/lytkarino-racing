// fight.js — on-foot combat, reusable aim system (crosshair + target raycast), footsteps & combat sounds (all synthesized WebAudio).
// Controls: LMB click / E = attack combo (right cross → left jab → kick), RMB / Q = kick. Mobile: fist button (combo), boot button (kick).
// Aim: window.__AIM = {dir, origin, target, dist, register(fn)} — fn(origin,dir) returns {obj,dist,kind}|null; future weapons/interaction can register targets.
(function(){
const G=window.__G,PLY=window.__PLY;if(!G||!PLY){console.warn('fight.js: no player');return;}
const T=THREE,mobile=G.mobile,P=PLY.P;
// ---------- sound (synth)
let ac=null,mg=null,nb=null;
const ctx=()=>{if(ac)return ac;try{ac=(window.__PED&&__PED.vctx&&__PED.vctx())||new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}
 mg=ac.createGain();mg.connect(ac.destination);const n=ac.sampleRate;nb=ac.createBuffer(1,n,n);const d=nb.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return ac;};
const vol=()=>{const VX=window.__PED&&__PED.VX;return VX&&VX.vol!=null?Math.min(1.5,VX.vol):1;};
function noise(t0,dur,type,f0,f1,q,g0){const c=ac,s=c.createBufferSource();s.buffer=nb;s.playbackRate.value=.7+Math.random()*.6;const bf=c.createBiquadFilter();bf.type=type;bf.Q.value=q;bf.frequency.setValueAtTime(f0,t0);bf.frequency.exponentialRampToValueAtTime(f1,t0+dur);
 const g=c.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(g0,t0+Math.min(.02,dur*.3));g.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(bf);bf.connect(g);g.connect(mg);s.start(t0,Math.random()*.5);s.stop(t0+dur+.05);}
function tone(t0,dur,f0,f1,g0,type='sine'){const c=ac,o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(f1,t0+dur);const g=c.createGain();g.gain.setValueAtTime(g0,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(g);g.connect(mg);o.start(t0);o.stop(t0+dur+.02);}
const SND={
 whoosh(k){if(!ctx())return;const t=ac.currentTime,v=vol();noise(t,k?.26:.18,'bandpass',k?500:900,k?1800:2600,1.4,.35*v);},
 impact(heavy){if(!ctx())return;const t=ac.currentTime,v=vol();tone(t,.16,heavy?120:150,45,.9*v);noise(t,.09,'lowpass',2200,300,.7,.8*v);noise(t+.01,.22,'bandpass',420,160,2,.45*v);// wet slap
  tone(t,.05,900,300,.18*v,'triangle');},
 step(kind,surf){if(!ctx())return;const t=ac.currentTime,v=vol()*(kind==='run'?.55:kind==='crouch'?.12:.3);
  if(surf==='grass'){noise(t,.12,'bandpass',2400,1200,.8,.5*v);noise(t,.08,'lowpass',600,200,.7,.4*v);}
  else{noise(t,.05,'bandpass',1800+Math.random()*500,900,1.2,.8*v);tone(t,.06,95,55,.5*v);noise(t+.03,.04,'highpass',3000,5000,.7,.15*v);}}};
PLY.SND=SND;
// ---------- aim system
const ch=document.createElement('div');ch.id='aimDot';ch.style.cssText='position:fixed;left:50%;top:50%;width:7px;height:7px;margin:-5px 0 0 -5px;border-radius:50%;background:#fff;border:1.5px solid rgba(0,0,0,.8);box-shadow:0 0 0 3px rgba(255,255,255,.25),0 0 3px rgba(0,0,0,.8);z-index:29;pointer-events:none;display:none;transition:transform .08s,background .08s';document.body.appendChild(ch);
const AIM={origin:new T.Vector3(),dir:new T.Vector3(0,0,-1),target:null,dist:Infinity,prov:[],register(f){this.prov.push(f);},dot:ch};window.__AIM=AIM;PLY.AIM=AIM;
// ped provider: ray vs vertical capsule (r .4, 0..1.8)
AIM.register((o,d)=>{const PED=window.__PED;if(!PED||!PED.list)return null;let best=null;for(const p of PED.list){if(p.dead||!p.g||!p.g.parent)continue;const q=p.g.position;const rx=q.x-o.x,rz=q.z-o.z,hl=d.x*d.x+d.z*d.z||1e-6;let t=(rx*d.x+rz*d.z)/hl;if(t<0)continue;t=Math.min(t,40);
 const px=o.x+d.x*t-q.x,pz=o.z+d.z*t-q.z,py=o.y+d.y*t;if(px*px+pz*pz<.16&&py>q.y-.1&&py<q.y+1.9){const D=t*Math.sqrt(hl+d.y*d.y);if(!best||D<best.dist)best={obj:p,dist:D,kind:'ped'};}}return best;});
function aimUpdate(){const c=PLY.fcam;c.updateMatrixWorld();AIM.origin.setFromMatrixPosition(c.matrixWorld);c.getWorldDirection(AIM.dir);let b=null;for(const f of AIM.prov){const r=f(AIM.origin,AIM.dir);if(r&&(!b||r.dist<b.dist))b=r;}
 // reach measured from player, not from the (3rd-person) camera
 AIM.target=b;AIM.dist=b?b.dist:Infinity;const reach=b&&b.obj.g?Math.hypot(b.obj.g.position.x-P.x,b.obj.g.position.z-P.z):99;AIM.inReach=reach<1.8;
 ch.style.background=b?(AIM.inReach?'#ff3b30':'#ffb3ad'):'#fff';ch.style.transform=b&&AIM.inReach?'scale(1.5)':'scale(1)';}
// ---------- attacks
const ATK={cross:{clip:'Cross',dur:.62,hit:.24,dmg:1,reach:1.35,ts:1.25},jab:{clip:'Jab',dur:.5,hit:.18,dmg:1,reach:1.3,ts:1.3},kick:{clip:'Idle',dur:.75,hit:.33,dmg:2,reach:1.6,kick:true}};
const COMBO=['cross','jab','kick'];let ci=0,lastEnd=-9,buf=null,cool=0;let gt=0;const now=()=>gt;// game time (robust to low fps)
function attack(kind){if(!PLY.foot||PLY.seq||!PLY.ready)return;if(PLY.atk){buf=kind;return;}if(cool>0&&now()<cool)return;let k=kind;
 if(kind==='combo'){if(now()-lastEnd>.55)ci=0;k=COMBO[ci];ci=(ci+1)%COMBO.length;}
 const a=ATK[k];PLY.atk={k,a,t:0,done:false,sw:false};const tg=AIM.target&&AIM.inReach&&AIM.target.obj.g?AIM.target.obj.g.position:null;P.h=tg?Math.atan2(tg.x-P.x,tg.z-P.z):PLY.fpv?P.h:P.yaw+Math.PI;// face aimed target in reach, else camera aim direction
 if(!a.kick)PLY.playF(a.clip,.06,a.ts);else PLY.play(PLY.crouch?'CrouchIdle':'Idle',.1);if(k==='kick'){cool=now()+.35;ci=0;}}
PLY.attack=attack;
const fwd=()=>[Math.sin(P.h),Math.cos(P.h)];
function doHit(a){const PED=window.__PED;if(!PED||!PED.list)return 0;const [fx,fz]=fwd();let n=0;
 for(const p of PED.list){if(p.dead||!p.g||!p.g.parent)continue;const dx=p.g.position.x-P.x,dz=p.g.position.z-P.z,d=Math.hypot(dx,dz);if(d>a.reach||d<.01)continue;if((dx*fx+dz*fz)/d<.45)continue;
  n++;p.hp=(p.hp==null?4:p.hp)-a.dmg;p.g.rotation.y=Math.atan2(-dx,-dz);
  if(p.hp<=0){if(PED.hit)PED.hit(p,a.kick?7.5:6,fx,fz);}
  else{if(PED.say)PED.say(p,'pain',true);if(PED.play)PED.play(p,'Hit',.05);p.st='idle';p.stT=.8;p.flee=0;clearTimeout(p._ft);p._ft=setTimeout(()=>{if(p.dead)return;p.flee=3.5;p.st='walk';if(PED.play)PED.play(p,'Run',.15);},650);}
  // tiny screen shake
  PLY.shake=.12;if(n>=2)break;}
 if(n)SND.impact(a.kick);return n;}
// procedural kick: right thigh/shin swing (rotate about character's right axis in world space)
const _q=new T.Quaternion(),_q2=new T.Quaternion(),_v=new T.Vector3();
function rotW(b,axis,ang){if(!b)return;_q.setFromAxisAngle(axis,ang);b.getWorldQuaternion(_q2);_q2.premultiply(_q);const pq=new T.Quaternion();b.parent.getWorldQuaternion(pq);b.quaternion.copy(pq.invert().multiply(_q2));b.updateMatrixWorld(true);}
const sm=(e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t);};
// ---------- footsteps (contact phases of the loop clips)
const PH={Walk:[.05,.55],Run:[.1,.6],CrouchWalk:[.1,.6]};let lastPh=null,lastAnim='';
const surf=()=>{try{const s=G.surfAt&&G.surfAt(P.x,P.z);return s||'asphalt';}catch(e){return 'asphalt';}};
// ---------- input
const cv=G.R.domElement;let md=null;
cv.addEventListener('mousedown',e=>{if(!PLY.foot)return;if(e.button===2){attack('kick');return;}if(e.button===0)md={x:e.clientX,y:e.clientY,t:performance.now()/1000};});
addEventListener('mouseup',e=>{if(!md||e.button!==0)return;const m=Math.hypot(e.clientX-md.x,e.clientY-md.y);if(m<6&&performance.now()/1000-md.t<.35)attack('combo');md=null;});
cv.addEventListener('contextmenu',e=>{if(PLY.foot)e.preventDefault();});
addEventListener('keydown',e=>{if(!PLY.foot)return;if(e.code==='KeyE'||e.code==='KeyQ'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)attack(e.code==='KeyE'?'combo':'kick');}},true);
// mobile buttons
const IC2={fist:'<img src="ui/ic_fist.webp" alt="" draggable="false">',kick:'<img src="ui/ic_kick.webp" alt="" draggable="false">'};
const ui=document.getElementById('plyUI');
if(ui&&PLY.mkB){PLY.IC.fist=IC2.fist;PLY.IC.kick=IC2.kick;const fb=PLY.mkB('fist','right:100px;bottom:112px;width:76px;height:76px',()=>attack('combo'),'E');ui.appendChild(fb);const kb=PLY.mkB('kick','right:172px;bottom:44px;width:56px;height:56px',()=>attack('kick'),'Q');ui.appendChild(kb);}
// ---------- per frame (called by player.js after mixer update, on foot only)
let sh=0;
PLY.post=dt=>{gt+=dt;ch.style.display=PLY.foot&&!(PLY.seq&&(PLY.seq.k!=='exit'||PLY.seq.t<1.1))&&!document.getElementById('fmap')?.style.display.includes('block')?'block':'none';
 if(PLY.foot&&!PLY.seq)aimUpdate();
 const A=PLY.atk;if(A){A.t+=dt;const a=A.a;if(!A.sw&&A.t>a.hit*.55){A.sw=true;SND.whoosh(a.kick);}if(!A.done&&A.t>=a.hit){A.done=true;doHit(a);}
  if(a.kick){const t=A.t/a.dur,up=sm(.08,.4,t)*(1-sm(.6,.95,t)),B=PLY.B;const root=PLY.root;const rt=_v.set(1,0,0).applyQuaternion(root.getWorldQuaternion(_q2)).clone();
   rotW(B.mixamorigSpine,rt,up*.25);rotW(B.mixamorigRightUpLeg,rt,up*1.5);rotW(B.mixamorigRightLeg,rt,-up*(1.3-1.2*sm(.22,.38,t)));rotW(B.mixamorigLeftArm,rt,-up*.6);rotW(B.mixamorigRightArm,rt,up*.5);}
  if(A.t>=a.dur){PLY.atk=null;lastEnd=now();if(buf){const b=buf;buf=null;attack(b);}}}
 // footsteps
 const an=P.anim,ph=PH[an];if(ph&&PLY.A[an]&&!P.air&&P.spd>.2){const ac0=PLY.A[an],c=(ac0.time/ac0.getClip().duration)%1;if(lastAnim===an&&lastPh!=null){for(const p of ph){if((lastPh<p&&c>=p)||(lastPh>c&&(p>lastPh||c>=p)))SND.step(an==='Run'?'run':an==='CrouchWalk'?'crouch':'walk',surf());}}lastPh=c;}else lastPh=null;lastAnim=an;
 if(PLY.shake>0){PLY.shake-=dt;}};
PLY.onEnter=()=>{ch.style.display='none';PLY.atk=null;};
console.log('fight.js ready');
})();
