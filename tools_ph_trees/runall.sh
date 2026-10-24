b(){ blender -b -P build.py -- $1 $2 $3 10 $4 3000 1 2>&1 | grep -E "LEAF|DONE|Traceback|Error:" | grep -v "Cannot read"; }
b island_tree_01/island_tree_01_1k.gltf island_tree_01 isl1 2200
b island_tree_02/island_tree_02_1k.gltf island_tree_02 isl2 2000
b island_tree_03/island_tree_03_1k.gltf island_tree_03 isl3 2000
b tree_small_02/tree_small_02_1k.gltf tree_small_02 sm2 2000
CF=0.12 b fir_tree_01/fir_tree_01_1k.gltf fir_tree_01_a fira 2600
CF=0.12 b fir_tree_01/fir_tree_01_1k.gltf fir_tree_01_b firb 2400
CF=0.12 b fir_tree_01/fir_tree_01_1k.gltf fir_tree_01_c firc 2400
