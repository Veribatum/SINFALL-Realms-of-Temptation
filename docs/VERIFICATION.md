# Rebuild verification · 2026-10-26

The player story is: create a separate hero → investigate a village mystery → gather evidence on the road → choose an alliance → enter a connected undercrypt → fight the guardian → choose an ending → begin a different campaign with the same stronger character.

## Automated verification

21 tests cover the following behavior:

- 200 generated undercrypt seeds have reachable objectives and encounters.
- Seed reproducibility and variation, complete campaign progression, no premature ending rewards, no repeated reward claims, and use of all mystery frameworks before repeating one.
- Distinct alliance and ending effects, actual armor defense, ability costs and interruption, prerequisites and talent bonuses, combat resource bounds for all ten classes.
- Side quests, including gathering before accepting a task, location restrictions on turn-in, and resolved resource nodes.
- Equipment swapping, consumable bounds, separate heroes, checkpoints, export/import, rejection of incomplete saves, and legacy hero migration.
- Auth PKCE/state/nonce and issued-client handling; signed identity validation and rejection of mismatched claims; SSE chunking and Unicode; usage-limit and interrupted-stream failures.
- Town, road and crypt scene construction, finite mesh transforms/vertices, and approachable interaction positions. A tree-placement collision found during verification was corrected by reserving space around interactable entities.

The source check verifies syntax, module imports, required images and graphics dependencies, and checks first-party modules for credential-shaped values.

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

## Verification limits

The managed browser reports `GL_VENDOR = Disabled` and `GL_RENDERER = Disabled`; it cannot create a WebGL context. The normal 3D view therefore could not be visually rendered or driven in this environment. The browser story test used the existing no-WebGL interaction fallback. Geometry generation and collision checks ran separately, but they do not establish rendered appearance, touch movement feel, or mobile GPU performance.

Live ChatGPT consent and inference were not performed with the user’s account. OAuth identity checks and response-stream handling were tested with local fixtures; actual eligibility, sign-in, token refresh against OpenAI, account model discovery, and in-game inference still require a connected eligible account in the local edition. The public browser edition remains procedural unless an AI-written story pack is imported.

The earlier repository state is preserved on `archive/before-living-realms-overhaul`.
