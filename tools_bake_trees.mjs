globalThis.document={createElementNS:()=>({addEventListener(){},removeEventListener(){},style:{}})};
const {Tree}=await import('@dgreenheck/ez-tree');import fs from 'fs';
const SP={
 birch:{p:'Ash Medium',H:15,bark:'birch',leaf:'aspen',o:o=>{o.branch.force.strength=-0.05;o.branch.angle[1]=40;o.leaves.size*=.85;o.bark.textureScale={x:1,y:2};}},
 poplar:{p:'Aspen Large',H:22,bark:'willow',leaf:'aspen',o:o=>{o.branch.angle[1]=22;o.branch.angle[2]=30;o.branch.force.strength=0.03;o.leaves.count=Math.round(o.leaves.count*2.2);}},
 popcut:{p:'Ash Medium',H:11,bark:'willow',leaf:'aspen',o:o=>{o.branch.levels=2;o.branch.length[0]*=.55;o.branch.start[1]=.75;o.branch.children[0]=7;o.branch.length[1]*=.3;o.branch.length[2]*=.5;o.branch.angle[1]=30;o.branch.radius[0]*=1.5;o.leaves.count=34;}},
 linden:{p:'Oak Medium',H:14,bark:'oak',leaf:'oak',o:o=>{}},
 maple:{p:'Oak Small',H:11,bark:'oak',leaf:'oak',o:o=>{o.branch.angle[1]=60;o.leaves.count=Math.round(o.leaves.count*2);}},
 rowan:{p:'Ash Small',H:7,bark:'willow',leaf:'ash',o:o=>{}},
 spruce:{p:'Pine Medium',H:13,bark:'pine',leaf:'pine',o:o=>{}},
 pine:{p:'Pine Large',H:20,bark:'pine',leaf:'pine',o:o=>{o.branch.start[1]=.55;}},
 lilac:{p:'Bush 1',H:3,bark:'willow',leaf:'oak',o:o=>{}},
 hawthorn:{p:'Bush 2',H:3.5,bark:'oak',leaf:'ash',o:o=>{o.leaves.count*=2;}},
 shrub:{p:'Bush 3',H:1.8,bark:'willow',leaf:'aspen',o:o=>{}}};
const bufs=[];let off=0;const man={};
const put=(arr)=>{const b=Buffer.from(arr.buffer,arr.byteOffset,arr.byteLength);const o=off;bufs.push(b);off+=b.length;const pad=(4-off%4)%4;if(pad){bufs.push(Buffer.alloc(pad));off+=pad;}return [o,arr.length];};
for(const [k,s] of Object.entries(SP)){man[k]={bark:s.bark,leaf:s.leaf,v:[]};
 for(let v=0;v<2;v++){const t=new Tree();t.loadPreset(s.p);t.options.seed=1000+v*7919+k.length*31;s.o(t.options);const B=t.options.branch;for(const l in B.segments)B.segments[l]=Math.max(3,Math.round(B.segments[l]*.6));for(const l in B.sections)B.sections[l]=Math.max(3,Math.round(B.sections[l]*.5));t.options.leaves.size*=1.5;t.options.leaves.count=Math.round(t.options.leaves.count*1.1);t.generate();
  const ms=[];t.traverse(o=>{if(o.isMesh)ms.push(o);});
  let ymax=0;ms.forEach(m=>{m.geometry.computeBoundingBox();ymax=Math.max(ymax,m.geometry.boundingBox.max.y);});const sc=s.H/ymax;
  const e={};ms.forEach((m,i)=>{const g=m.geometry;const nm=i==0?'b':'l';const P=g.attributes.position.array.slice();for(let j=0;j<P.length;j++)P[j]*=sc;
   e[nm]={p:put(Int16Array.from(P,x=>Math.round(x*500))),n:put(Int8Array.from(g.attributes.normal.array,x=>Math.round(x*127))),u:put(Int16Array.from(g.attributes.uv.array,x=>Math.round(x*1000))),i:put(g.index.count>65535?new Uint32Array(g.index.array):new Uint16Array(g.index.array)),i32:g.index.count>65535};});
  man[k].v.push(e);console.log(k,v,ms[0].geometry.attributes.position.array[300].toFixed(2),ms.map(m=>m.geometry.index.count/3|0).join('+'));}}
fs.writeFileSync('/workspace/lytkarino-game/data/trees.bin',Buffer.concat(bufs));fs.writeFileSync('/workspace/lytkarino-game/data/trees.json',JSON.stringify(man));console.log('bytes',off);
