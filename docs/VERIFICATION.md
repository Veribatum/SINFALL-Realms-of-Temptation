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
