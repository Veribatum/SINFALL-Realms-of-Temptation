# SINFALL — Realms of Temptation

A mobile-first, adult-themed dark fantasy RPG prototype.

## Play

Deploy GitHub Pages from **main / (root)**. Open `index.html` directly or browse the Pages URL. Add to Home Screen on iPhone for a standalone view.

## Implemented

- Multiple hero classes and portrait archetype selection
- Four atmospheric locations, each with three branching skill-based checks
- Genuine random D20 rolls, DCs, class bonuses, natural 1/20 handling
- HP/MP, XP, level progression, unlockable skill tree
- Loot, equippable weapons/armor, consumable healing potions, gold
- Quest tracker, companion rapport, chronicle history
- Local autosave, manual save, JSON export/import
- Original hand-authored SVG fantasy character and dungeon environment art
- Mobile-responsive layout, installable PWA manifest

## Generated art installation

The HTML/CSS/JS references images under `assets/` but the GitHub connector available to this chat cannot upload binary files. **Those generated images have not yet been committed.** Download the provided `sinfall-generated-assets.zip`, extract its `assets` folder, and upload all five JPG files into the repository's `assets/` directory on the `main` branch. Once uploaded, GitHub Pages will display the art automatically. Do not assume the art is live before the files exist.

Files: `splash.jpg`, `scene-gate.jpg`, `scene-hall.jpg`, `scene-crypt.jpg`, `scene-throne.jpg`.

## AI roadmap

**AI is NOT yet connected.** The story engine currently runs offline using authored encounters. The freeform intent input records actions but does not generate AI responses. Do not market it as live AI.

Official [Sign in with ChatGPT](https://developers.openai.com/siwc/quickstart) allows eligible users to authorize plan usage, but hosted web deployments have different onboarding requirements than local open-source applications. GitHub Pages cannot safely host OAuth server callbacks or store persistent authentication tokens. A secure, policy-compliant integration must be completed separately before enabling live AI, and model usage is subject to plan limits.

Proposed architecture:
1. Structured immutable game state tracked by a deterministic local rules engine.
2. Authenticated AI narration returns strictly validated JSON of narration and suggested world-state actions; the rules engine alone mutates stats, loot and dice.
3. Story summaries + journal and companion affinity persist between sessions.
4. Auth and entitlement handling through a supported OpenAI sign-in integration, with tokens stored only in an authorized local user-controlled runtime where required.
5. Optional generated scene art only with appropriate image service access and user permission.

## Security and limitations

No API credentials should be committed or stored in public client JavaScript. Saves are stored per-browser/device unless exported. All characters depicted and future romance options are adults. Generated artwork is referenced in the UI but needs binary asset upload as explained above.
