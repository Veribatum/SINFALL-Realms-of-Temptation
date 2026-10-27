# Swept ears and adult outfit variety · 2.0.2 · 2026-10-27

Elf ears now taper backward alongside the skull and follow the animated head. Corsair leathers and Moonveil silk add two fitted adult female wardrobe choices, with cropped bodices, exposed waist and legs, covered bottoms, boots and bracers; Moonveil has a split skirt. These choices are also distributed among female town and household residents. Existing hero appearances and progression remain intact.

The female GLB adds sixteen skinned meshes while retaining the original 65 bones, eleven clips, seven embedded images and original binary data. Added skin uses the authored adult body and weights. All added weights are normalized and joint indices valid; the asset packer rebuilds byte-identically. Only the selected wardrobe is visible. Equipped armor clones the selected bodice and remains on the same bones.

`npm test`: 50 passing tests. `npm run check`: all 38 source/test modules, imports and required assets pass. New regressions cover outfit visibility and animation, fitted armor swaps, swept ear geometry and head attachment, saved appearance, and wardrobe distribution across all nine towns. The browser creator offers six female outfits; changing gender filters compatible choices. Creating a Moonveil hero, switching to Corsair, saving, reloading and continuing retains the selection.

`sinfall-elf-outfits.png` shows the actual integrated, posed models. The software renderer now uses a depth buffer to inspect skirt/leg clearance without triangle-sort artifacts. The browser model harness passes all six GLBs; the updated female asset decodes its five used textures and starts Walking_A with 65 bones and eleven clips. WebGL remains disabled in the managed browser; GPU rendering and device frame rate remain unverified.

---

# Equipment fit correction · 2.0.1 · 2026-10-27

User screenshots exposed two adult-rig issues: the old wrist rotation put the staff sideways at the wrist, and an equipment-name filter left a rigid chest box visible over Traveler’s Attire. The latter also appeared over robes during character creation.

The adult grip now aligns the shaft with the authored hand frame and keeps the handle between the curled index finger and thumb each animation update. Adult handles use a slimmer grip. Starter cloth uses its authored torso directly. Leather/mail/plate clone the selected outfit’s fitted skinned torso and use the same bones and bind matrices, preserving equipment changes without the former rigid chest cube. The legacy KayKit path is unchanged. No save fields or progression data are modified.

Two regression tests exercise both adult rigs, eight weapon shapes, idle/walk/run and actor rotation, all four wardrobe settings, all three armor types, switching back to starter attire, and posed armor vertex alignment. Full suite: 47 passing tests. Syntax/import/asset checks pass. The labeled `sinfall-equipment-fit.png` is a software projection of the actual posed meshes, with a starter staff and mail over robes. GPU rendering remains unavailable in the managed verification browser.

---

# The Open Realm 2.0 verification · 2026-10-27

The expansion takes an existing hero into a continuous 3,600 × 3,600 metre realm, with nine settlements, 225 enterable buildings, 72 landmarks and nine undercrypts. Each settlement has five core buildings and twenty occupied homes, shops or halls. Household discoveries persist independently and their stories point toward wilderness sites.

`npm test`: 45 passing tests. `npm run check` verifies syntax, imports and required assets. `git diff --check` is clean.

Six new realm tests cover old-save migration without losing identity/gear/claims/surveys; all 225 doors and 180 independent household discovery states; main investigation, archive alliance and exact dungeon return; physical roads between all nine towns with river bridges; continuous terrain across region/chunk seams and safe landmark trails; and bounded scenery streaming with finite geometry and every interaction anchor approachable. Streamed detail is bounded at 25 chunks on high quality and 9 on low quality. Tests found and corrected a wilderness encounter on a steep terrain shoulder and a supply cache that intersected a river bend.

Three new character tests inspect actual authored adult female/male GLBs: skinned faces and covered fitted bodies, independent 65-bone skeletons, eleven animation clips, normalized colors and weights, six hair choices, face/outfit variation, dynamic equipment and gender model replacement. The preview-only browser harness downloaded all six models; both adults decoded five embedded textures and started Walking_A.

Normal browser controls were used to create Elara, a female Moon Elf Ranger with long hair and a regal face. She entered Elara Ashford’s home in Emberwatch, read the household journal, reloaded and resumed inside that home without restoring the claimed discovery. Asking the resident about her sister’s bottled voice offered a trail to the travelers’ camp. Leaving returned outside; the atlas displayed global distances and the expanded realm counts. Travel through a roadside story reached Duskwick, which became a discovered fast-travel destination. The 390px phone layout was inspected separately.

The labeled model and realm images are software projections of actual committed mesh geometry, not concept art. Roof winding, terrain-aligned paths, the adult neckline and overlapping outfit parts were inspected and corrected. See `sinfall-adult-models.png`, `sinfall-open-realm.jpg` and `sinfall-open-realm-phone.jpg`.

WebGL is disabled in the managed browser, so browser playthroughs used the interaction fallback. Actual GPU appearance, shader compilation, touch movement feel and device frame rate remain unverified. Browser asset/texture decoding and animation startup were checked independently of GPU rendering. Live ChatGPT account consent and inference were not performed; the expansion preserves the local integration and supplies global position, realm metrics and current landmarks to its context.

---

# Living Realms 1.2 verification

Automated checks: `npm test` and `npm run check`.

The update adds coverage for nine-region bidirectional connectivity; old three-town save migration with identity, campaign, items and visits preserved; persistent survey progress and one-time regional rewards; equipment swapping on all four actual GLB skeletons; varied deterministic NPC profiles; every interaction coordinate in all nine town/wilderness scenes; straight walkable paths to all eight landmarks in each wilderness; finite geometry; and audio mode/settings persistence.

Browser checks use the managed preview through character creation, Male/Female selection, appearance options, a created hero, the nine-region atlas, travel, landmark salvage, equipping recovered gear, the character editor, save/reload and sound settings. The cloud browser cannot create a WebGL context. GPU rendering, actual on-device frame rate and iPhone playback are therefore unverified. Model geometry, skeleton attachments and animation are checked directly against all four committed GLBs. Audio is synthesized locally after a user gesture; no external audio service is required.

---

# Rebuild verification · 2026-10-26

The player story is: create a separate hero → investigate a village mystery → gather evidence on the road → choose an alliance → enter a connected undercrypt → fight the guardian → choose an ending → begin a different campaign with the same stronger character.

## Automated verification

29 tests cover the following behavior:

- 200 generated undercrypt seeds have reachable objectives and encounters.
- Seed reproducibility and variation, complete campaign progression, no premature ending rewards, no repeated reward claims, and use of all mystery frameworks before repeating one.
- Distinct alliance and ending effects, actual armor defense, ability costs and interruption, prerequisites and talent bonuses, combat resource bounds for all ten classes.
- Side quests, including gathering before accepting a task, location restrictions on turn-in, and resolved resource nodes.
- Equipment swapping, consumable bounds, separate heroes, checkpoints, export/import, rejection of incomplete saves, and legacy hero migration.
- Auth PKCE/state/nonce and issued-client handling; signed identity validation and rejection of mismatched claims; SSE chunking and Unicode; usage-limit and interrupted-stream failures.
- Town, road and crypt scene construction, finite mesh transforms/vertices, and approachable interaction positions. A tree-placement collision found during verification was corrected by reserving space around interactable entities.

The expansion adds coverage for all five interiors, repeat-discovery prevention, save validation inside a building, return positions, the main investigation and quest turn-in indoors, seeded encounter variety, insufficient funds, repeat-reward prevention, faction favors, bounded discounts, finite room geometry, approachable interaction anchors, and camera collision. All four actual GLB files are parsed with the vendored loader, cloned into independent skeletons and driven through idle/walking/running; bone transforms must change. Only texture decoding is stubbed in Node. The atlas palette shader’s uniforms and source are also checked, but compiling it still needs WebGL.

The source check verifies syntax, module imports, required images, all four local models and graphics dependencies, and checks first-party modules for credential-shaped values.

Scenery batching benchmark (seed 239, high quality): town removes 792 individual static meshes into 15 batches, saving 777 draw submissions; road saves 338; archive saves 302. These are scene-structure counts, not measured GPU frame rates.

## Browser verification

Verified in the managed browser, using normal UI controls:

1. New Game completes all four character-creation steps.
2. A Moon Elf Spellbinder named Raven is created and survives reload through Continue.
3. Talking to the witness, accepting the main quest, traveling to the road, collecting evidence, returning to the scholar, and choosing the scholars advance the correct objectives.
4. Three talents are learned and their points are consumed.
5. The guardian battle handles a natural-1 miss, a defensive turn, ability damage, mana costs and enemy retaliation, followed by victory and the artifact objective.
6. Preserving the artifact completes the campaign and awards progression and legacy equipment.
7. A new campaign starts with Raven still at level 3 and retaining learned talents, rewards, and prior history.
8. A second character, Ash, is created independently through a 390px phone viewport. Load Game displays Ash at level 1 and Raven at level 3 with separate portraits, classes and saves.
9. The phone title screen, character creation, appearance choices, dialogs, joystick/navigation layout and load screen are inspected at a real 390px iframe viewport.

## Expansion browser check

A new Moon Elf Spellbinder, Mara, was created through the normal UI. Entering the archive changed the location and exposed its scholar, exit and book discovery. Reading the book removed the one-time interaction. Reload → Continue resumed Mara inside the archive without restoring that reward. Leaving returned to the village. The market encounter accepted a paid search party, displayed its result and removed the encounter from available interactions. The main investigation then proceeded from the witness to road evidence and back to the scholar inside the archive, where all three alliance choices were available. After siding with the wardens, the earlier town assistance raised watch reputation enough to unlock “Call in a favor from the watch” in a road encounter. See `sinfall-archive-branch.jpg` for the tested decision UI.

The preview-only model integration page also passed in the actual browser for Rogue, Knight, Mage and Barbarian: each GLB downloaded, decoded its embedded 1024 × 1024 texture, instantiated 41 bones and 11 animation clips, and started Walking_A. This validates the browser asset/decoder path without a GPU; it does not replace a rendered WebGL check.

## Verification limits

The managed browser reports `GL_VENDOR = Disabled` and `GL_RENDERER = Disabled`; it cannot create a WebGL context. The normal 3D view therefore could not be visually rendered or driven in this environment. The browser story test used the existing no-WebGL interaction fallback. Geometry generation and collision checks ran separately, but they do not establish rendered appearance, touch movement feel, or mobile GPU performance.

Live ChatGPT consent and inference were not performed with the user’s account. OAuth identity checks and response-stream handling were tested with local fixtures; actual eligibility, sign-in, token refresh against OpenAI, account model discovery, and in-game inference still require a connected eligible account in the local edition. The public browser edition remains procedural unless an AI-written story pack is imported.

The earlier repository state is preserved on `archive/before-living-realms-overhaul`.

