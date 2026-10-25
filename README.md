# SINFALL — Realms of Temptation

## Playable alpha v0.3

The live game is launched from `index.html` and uses `v3.css` plus `sinfall-v3.js`. Previous `game.js`, `dungeon.js`, and `style.css` are legacy files **not loaded by the new game**.

### Implemented

- Single-screen, mobile-first 9×9 dungeon crawler with fog of war and touch movement
- Random floors, treasure, traps, shrines, NPCs, monsters, stairs, and repeated descents
- D20 checks, melee combat, spells, damage, defeats, retreat, rewards
- Four classes, upgrades, XP, skill tree, gold, healing and inventory
- Companion relationship counters, chronicle, bestiary and saves (localStorage)
- Save export/import, mobile-friendly UI, safe image fallbacks

### Artwork issue

**IMPORTANT: The current GitHub repository still has no `assets/` directory.** The generated image files were previously delivered as `sinfall-art-update.zip`, but GitHub's available connector accepts text and cannot read the image file bytes from the local image-generation runtime. As a result, the live GitHub Pages site will display fallback colors where the artwork should go. The code references those image paths correctly, but they will not render until assets are actually uploaded. Upload the **contents** of the extracted `assets/` directory to `main/assets/` through the GitHub web upload UI.

Required images include `assets/splash.jpg`, `assets/class-shadowblade.jpg`, `assets/class-spellbinder.jpg`, `assets/class-oathbreaker.jpg`, `assets/class-ranger.jpg`, `assets/scene-crypt.jpg`, `assets/scene-throne.jpg`, `assets/companions.jpg`, `assets/bestiary.jpg`, plus skill/item icons.

### AI

Live AI narration and Sign in with ChatGPT are **not** included in this alpha. The offline encounters are deterministic and immediately playable. Do not commit API tokens to GitHub Pages.

### Deployment

GitHub Settings → Pages → Deploy from branch → main → /(root).
