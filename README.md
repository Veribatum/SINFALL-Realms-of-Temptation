# SINFALL · Realms of Temptation

A rebuilt dark fantasy browser RPG about an enduring hero, living settlements, and decisions with a price.

## Play

The GitHub Pages edition runs from the repository root. Choose **New Game**, **Load Game**, or **Continue**. Each hero has a separate save, equipment, talents, world, and chronicle. Saves are local to the browser; use Settings → Export all heroes to move a collection between devices.

Desktop controls: WASD/arrows to move, drag to look, E to interact, Shift to run, V to switch the dungeon camera. C/I/J/M open character, inventory, journal, and map. Escape closes a panel or opens the pause menu. On a phone, use the left joystick, drag the view, and use the contextual interaction button on the right.

Follow the gold quest marker to the witness in the village square. Ask other people about rumors, read the notice board, buy supplies, gather silverleaf, and investigate the old road. Enter the archive to take evidence to the scholar before deciding whom to trust. Buildings have marked doors; you can walk inside, talk to their inhabitants, and investigate objects. In combat, guard against heavy attacks, use class abilities to interrupt or heal, and equip the armor you find.

## What is implemented

- Main menu, four-step character creation, eight ancestries, ten classes, original painted portrait choices, colors, origin, omen, and a personal backstory.
- Separate hero slots, automatic saves, three manual checkpoints per hero, save export/import, recovery copy, and migration of the previous campaign-v1 hero without deleting the old save.
- A walkable third-person village, moving citizens and chickens, shops, inn, archive, chapel, notice board, contextual interaction, and a minimap. Three settlements with roads, differing biomes, names, and inhabitants are generated for each campaign.
- Connected, seeded undercrypts with exploration fog, visible encounters, coffers, inscriptions, shrines, a guardian, and an artifact. Graphics use a vendored Three.js module, with no CDN dependency.
- Main investigation, three alliances with different mechanical effects, side quests from NPCs and overheard rumors, travel decisions, relationships, reputation, and three consequential endings per campaign.
- Turn-based D20 combat with visible enemy intentions, distinct class abilities, mana, blocking, interruption, poison, healing, equipment defense, critical hits, and recoverable defeat.
- Real talent effects, equipment swapping, buying, selling, weapon improvements, consumables, XP, levels, and legacy rewards.
- After an ending, begin another campaign with the same character. Level, gear, talents, factions, history, prior relationships and endings persist; the new adventure has a new world and mystery.

The procedural edition draws from six authored mystery frameworks and seeded world/encounter variation. It is not live AI. The ChatGPT-connected local edition can write original campaign scenes and respond to freeform actions. Manually imported ChatGPT campaign packs also work in the browser edition.

The live world now uses four locally stored, rigged KayKit fantasy characters with idle, walking and running animations, class equipment, ancestry proportions, and palette customization. Characters start with a lightweight fallback while their model loads. The inn, forge, archive, apothecary and chapel have furnished, walkable interiors with their inhabitants and one-time discoveries. Static scenery is combined into material batches; the town benchmark removes 777 separate scenery draw calls. Camera collision keeps walls between the camera and the player. Daylight follows the world clock.

Seven seeded town and road encounters offer checks, paid interventions and faction consequences. Travelers can approach the hero. Completed meetings remain resolved after saving; reputation unlocks additional favors and merchant discounts. Existing schema-4 heroes remain compatible.

## Connect your ChatGPT plan

OpenAI’s documented open-source sign-in flow currently uses an HTTP loopback callback. For that reason, live ChatGPT plan sign-in belongs to the **local edition**, not the public GitHub Pages page.

1. Download this repository and install Node.js 22 or later if needed.
2. On Windows, open **start-sinfall.cmd**. Or run `npm start` from the project folder.
3. Open `http://127.0.0.1:8787`, then Dungeon Master & Settings → **Continue with ChatGPT**.
4. Sign in and authorize eligible ChatGPT plan usage. Select an available model in Settings.

There is no dependency installation and no API key field. AI usage counts toward the connected ChatGPT plan’s limits. Eligibility and successful consent are determined by OpenAI. No fallback to paid API billing is configured.

The app generates a stable installation host ID, registers a dynamic client, uses fresh state/nonce/PKCE, verifies the ID token signature/issuer/audience/expiry/nonce, checks the granted plan scopes, and refreshes credentials when needed. Credentials are written atomically to `~/.sinfall/` with owner-only Unix permissions. They are never sent to the browser, included in saves, logged, or stored in the repository. The local server binds to 127.0.0.1 and rejects other Host/Origin values on sensitive routes.

For mobile play without a local AI connection: open Dungeon Master in the game, copy a campaign request into ChatGPT, then paste the JSON reply into Import story pack. Do this at the beginning of a new adventure; active stories are protected from replacement. This manual route creates a playable AI-written campaign but is not a live chat connection.

Official implementation references:

- https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations

## Development and checks

`npm test` runs the game, save, geometry, OAuth-validation, and SSE tests. `npm run check` checks source syntax, imports, required assets, and public-source hygiene.

`npm run dev` serves the preview with AI authorization disabled. The preview-only `/__qa/mobile` page embeds a 390px phone viewport for layout verification. Production local mode does not expose this page.

The entry point is `index.html`, with the rebuilt implementation under `src/`, local ChatGPT support under `server/`, and the graphics dependency under `vendor/`. The older campaign/v3 scripts remain in Git history and the repository but are not loaded by the new entry point.

Third-party dependencies: Three.js r170 and its matching loaders/utilities, MIT; see `vendor/LICENSE-THREE.txt`. Character models: KayKit Adventurers Character Pack 1.0 by Kay Lousberg, CC0; source and license are in `assets/models/CREDITS.md` and `assets/models/LICENSE-KAYKIT.txt`. New artwork was generated for this project using the built-in Image Generation tool and encoded as WebP without changing its dimensions. Asset briefs: a twilight riverside village beneath an eclipsed moon; eight adult fantasy character portraits; four painted enemy portraits; and an impossible sanctuary with an inverted cathedral beyond the Veil.
