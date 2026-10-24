# Poly Haven CC0 trees -> game LOD (data/trees.bin)
Sources (CC0, https://polyhaven.com, glTF 1k): island_tree_01, island_tree_02, island_tree_03, tree_small_02, fir_tree_01 (a/b/c).
1. `runall.sh` (Blender 4 headless): trunk = largest solid material decimated to ~1.5k tris; foliage (leaves + twig/branch cards) is
   rendered from the real model in 4 orthographic crops (Cycles, albedo, transparent) -> leaf-cluster atlas; ~2-2.6k cluster cards
   are placed on area-weighted samples of the real leaf surface with canopy-radial normals.
2. `pack.py`: atlas with soft organic edge + colour bleed -> tex/leaf_ph_*.webp, bark -> tex/bark_ph_*.jpg, species/variants -> data/trees.{json,bin}
   (same quantised format as before; per-variant bark/leaf textures).
Species map: birch/poplar=isl2+isl1, linden=isl1+isl3, maple=isl3+sm2, popcut/rowan=sm2+..., spruce=fir b+c, pine=fir a+b.
Far trees/bushes/tufts: runtime impostor atlas baked from these meshes (game.js IMP), no procedural crowns are drawn (`?oldtree` restores them).
