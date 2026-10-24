# Лыткарино Гонки
Браузерная игра: езда по Лыткарино из салона авто. Данные © OpenStreetMap contributors (ODbL), Imagery © Esri.

## Credits (assets)
- Combat/footstep/whoosh/impact sounds: synthesized in-browser (WebAudio), no samples. Punch_Jab/Punch_Cross/Hit_Head: Quaternius Universal Animation Library (CC0).
- Road/parking asphalt: **asphalt_02** by Poly Haven (https://polyhaven.com/a/asphalt_02), CC0 1.0 — downscaled webp, packed AO/roughness/height (tex/asph).
- Ground (CC0, Poly Haven): clean_pebbles, brown_mud_leaves_01, forest_ground_06, concrete_pavement (tex/gnd2).
- Trees (CC0, Poly Haven): island_tree_01/02/03, tree_small_02, fir_tree_01 — decimated trunks + leaf-cluster cards rendered from the real foliage, far LOD = runtime impostors (tools_ph_trees/). Bushes: wild_rooibos_bush (CC0). Grass: grass_medium_02, grass_bermuda_01 (CC0).
- Cabin (CC0, Poly Haven, opt-in ?cabtex): fabric_leather_02, velour_velvet, coated_pine (tex/cab).

- Pedestrians: user's PSX character packs; animations: Quaternius Universal Animation Library (CC0), retargeted in Blender.
- Ambulance: **"ГАЗ-3221 Скорая помощь / GAZ-3221 Ambulance R.2"** by Yo.Ri (@grox777), https://sketchfab.com/3d-models/3221-gaz-3221-ambulance-r2-f3daf79ea4e843c8a159e8ead7af6e74 — licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Modified: scaled to 5.5 m, doors cut out of the body mesh at load time onto hinge pivots, added lightbar/head/tail light overlays (models/ambulance.glb).
- Body bag: **"Dead body in a plastic bag"** by returnhappiness, https://sketchfab.com/3d-models/dead-body-in-a-plastic-bag-714c623018e94d9aa1cc4fdd5f3bb261 — CC BY 4.0 (models/bodybag.glb, scaled).
- Gurney: **"PS1 Horror Hospital Gurney"** by Jan_Strydom, https://sketchfab.com/3d-models/ps1-horror-hospital-gurney-7fce61ac484343959e25208bc75c08ff — CC BY 4.0 (models/gurney.glb; wheels re-pivoted at load time to spin).
- Paramedic voice lines: Piper TTS (ru_RU dmitri / ruslan / denis voices).

### NPC vehicles (vehicles_npc.js, test page npcveh.html — not wired into traffic yet)
- `models/npc_uaz.glb` — "UAZ Patriot" by tiunov.se, CC BY 4.0 (Sketchfab). Police (ДПС livery, lightbar added in code).
- `models/npc_paz.glb` — "PAZ bus" by Yo.Ri (@grox777), CC BY 4.0 (Sketchfab). OMON/Rosgvardia bus, tinted windows.
- `models/npc_priora.glb` — "Lada Priora VAZ-2170" by Okopchi, CC BY 4.0 (Sketchfab). Civilian traffic.
Models were rescaled, re-oriented, textures resized to WebP and meshopt-compressed (`tools_npcveh.mjs`).
