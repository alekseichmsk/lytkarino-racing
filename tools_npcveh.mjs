// Normalise NPC vehicle GLBs: node tools_npcveh.mjs in.glb out.glb <length_m> <yaw_deg> <tex_px>  (needs @gltf-transform/*, meshoptimizer, sharp)
// used: uaz_patriot 4.78 180 512 | paz_bus 7.0 0 512 | lada_priora_vaz-2170 4.35 110.3 1024
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {getBounds,dedup,prune,weld,meshopt,textureCompress,resample,metalRough} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';import sharp from 'sharp';
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const [src,dst,len,rotY,tex,axis]=process.argv.slice(2);
const d=await io.read(src);const r=d.getRoot();const sc=r.listScenes()[0];
const root=d.createNode('root');sc.listChildren().forEach(c=>{sc.removeChild(c);root.addChild(c);});sc.addChild(root);
const a=+rotY*Math.PI/180;root.setRotation([0,Math.sin(a/2),0,Math.cos(a/2)]);
let b=getBounds(sc);const L=b.max[2]-b.min[2];const s=+len/L;root.setScale([s,s,s]);
b=getBounds(sc);root.setTranslation([-(b.min[0]+b.max[0])/2,-b.min[1],-(b.min[2]+b.max[2])/2]);
b=getBounds(sc);console.log('final bounds',b.min.map(x=>x.toFixed(2)),b.max.map(x=>x.toFixed(2)));
await d.transform(metalRough(),dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[+tex,+tex]}),meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write(dst,d);
