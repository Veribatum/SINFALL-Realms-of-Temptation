# Sinfall character models

Rogue, Knight, Mage, and Barbarian from **KayKit: Adventurers Character Pack 1.0**, by Kay Lousberg.

Source: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0

License: CC0 1.0. The original license is included as `LICENSE-KAYKIT.txt`.

The models retain their meshes, embedded texture atlases, skeletons and eleven original gameplay animations. `scripts/asset-tools/trim-glb.py` removes unused animation clips and compacts the binary without resampling the remaining data. No external model service is required during play.

Three.js GLTFLoader, SkeletonUtils and BufferGeometryUtils match the vendored Three.js r170, under `vendor/LICENSE-THREE.txt`.

## Adult character expansion

Female and male adult Superhero base bodies, authored faces/eyes, rigged hair,
Ranger and Peasant modular outfits, and animation clips are Quaternius CC0:

- https://quaternius.com/packs/universalbasecharacters.html
- https://quaternius.itch.io/universal-base-characters
- https://quaternius.itch.io/modular-character-outfits-fantasy
- https://quaternius.com/packs/universalanimationlibrary.html

Retained source mirror: https://github.com/OpenAgentsInc/openagents/tree/main/assets/verse/characters/quaternius
The original base/outfit/animation license texts are bundled alongside the GLBs.
The Sinfall packer removes covered base-body triangles, retains authored skinned
heads, combines fitted outfits and hairstyles on the shared 65-bone skeleton,
embeds compressed WebP atlases, and retains eleven named animation clips.
It adds a fitted female neckline with a covered collar insert and removes
trouser geometry hidden inside boots. It never includes teen models.
Rebuild with scripts/asset-tools/pack-adult-characters.py and the source mirror.
