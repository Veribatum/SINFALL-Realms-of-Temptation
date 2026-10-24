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

## Artwork update (60 assets)
The application now references 60 generated assets in `assets/`: four dungeon scenes, the main splash, class roster, four class portraits, 16 consumable icons, 16 equipment icons, 16 skill icons, companions, and bestiary. The source code is committed, but these JPEG/PNG **binary images still must be uploaded** to `assets/` on the `main` branch. The connected GitHub text-file tools do not accept a local image file reference. Extract `sinfall-art-update.zip`, open GitHub `assets/`, and drag the contents of the extracted assets folder into the GitHub upload interface. Do not commit the ZIP itself as a substitute. 

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
