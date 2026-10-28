# Sinfall systems comparison — 28 October 2026

This is a design comparison against published developer descriptions, combined with an inspection of Sinfall's implemented rules. It is not a claim to match the content, animation quality or production scale of these games. No commercial game's assets or dialogue were copied.

| Reference | Principle worth adopting | Sinfall gap | Implemented in 2.2 |
|---|---|---|---|
| Skyrim | Discovery connects places, people, factions and character goals. A destination should contain a reason to stay. | Nine settlements and 225 interiors exist, but many interactions use a small set of repeated quest structures. Reputation was mostly an invisible number. | Character shows explicit patronage ranks and earned benefits; NPC reactions acknowledge real alliances, road help, the guardian, the relic ending and the summoned dead. The main quest remains a five-stage structure; this update does not claim new faction campaigns. |
| Diablo IV | Class-specific choices change combat behavior, rather than only increasing numbers. Blizzard's necromancer design separates durable, aggressive and ranged summons. | The first skeleton was a single timed melee ally. No specialization or exploration summon control. | Grave Guardian at level 2, Bone Ravager at 4, Crypt Arcanist at 6. Different health, armor, attacks, range, equipment and cadence. One servant, 10 mana, 60 seconds, one shared 16-second cooldown across encounters. Can summon while exploring. |
| Baldur's Gate 3 | Identity and choices should produce persistent, legible consequences and social reactions. | Some consequences already affected factions, prices and endings, but townsfolk often repeated static greetings before checking world state. | State-based reactions take precedence, keep the NPC's established local greeting, and identify earned faction support. At 5 reputation, townsfolk grant +1 armor, scholars reduce ability cost by 1, and the Veil grants +2 spell damage. Existing reputation prices and encounter favors remain. |
| Hades | Replay variety depends on build decisions and reward combinations, in addition to shuffled rooms. | New campaigns changed mystery, names, terrain and dungeon layout, but the reward loop was mostly random equipment. | Each defeated guardian offers one of three deterministic, seeded blessings from a pool of six. One selection per region, actual combat effects, no duplicate claim. Blessings last for that campaign; character progression and gear remain between campaigns. |

## Verification

Engine checks cover unlock levels, exploration summons, shared recovery, actual ranged attacks and wall checks, guardian reward eligibility, duplicate prevention, campaign reset, save validation, patronage effects, AI context, and navigation around a dungeon corner. Existing character, quest, loot, map, scenery and save regressions remain required. Browser checks exercise combat, specialization selection, blessing selection and reload on phone dimensions.

## Implemented in 2.3

- Three authored faction quest graphs, with actual alternative destinations, paid and checked approaches, failure routes, negotiation/combat alternatives and regional endings. Their current objectives integrate with Journal, HUD, world markers and map routing.
- Visible quest contacts, a restored Watch station with guards, a changed observatory and sanctuary, plus a removed regional road reaver after the Watch resolution. Mechanical ending benefits are explicit in Character and the quest outcome.
- Three-opponent scripted combat groups, target switching, independent pursuit and telegraphs, shared hero cooldowns, nearby ability splash, per-kill reward accounting and persistence of partial group progress. Classic combat remains individual rounds.
- Six guardian patterns tied to the six authored mystery frameworks, with an accelerated second phase below half health. Enemy rigs animate pursuit and attacks.
- Distinct guild/lodge/barracks details and one-time rewards. The guild atlas makes local landmark study checks easier without completing surveys for the player.
- Faction choices retained in campaign legacy and supplied as real state to any connected director. No live hosted AI has been enabled.

## Remaining gaps after 2.3

1. **Hosted AI dungeon master:** still blocked by the approved hosted integration and backend described above. The phone build remains explicitly offline. A working account consent and real inference request must be verified before this can be called connected.
2. **Broader quest content:** three faction graphs supplement the existing five-stage main plot. They are finite authored stories; arbitrary AI-authored quest graphs and unlimited new mechanics remain unimplemented.
3. **Larger battles:** coordinated groups are capped at three and currently used by scripted faction blockades. General large battles, complex enemy roles and cinematic impact animation remain future work.
4. **World variety:** the new activities and state changes add reasons to visit existing locations. Entirely distinct settlement architecture, many more bespoke interiors and extensive civilian schedules remain future work.

## Primary sources consulted

- Bethesda, [Make Your Mark on Skyrim](https://bethesda.net/en-US/news/the-elder-scrolls-v-skyrim-make-your-mark) — factions, comrades, discovery and activities.
- Blizzard, [Diablo IV Quarterly Update—June 2022](https://news.blizzard.com/en-us/article/23816542/diablo-iv-quarterly-updatejune-2022) — necromancer resources, class builds and customizable summons. Used for design principles, not a claim about current live balance.
- Larian, [Community Update #21: Forging Your Legacy](https://baldursgate3.game/news/community-update-21-forging-your-legacy_77) — character identity, reactive crowds and consequences.
- Supergiant Games, [Hades: The Superstar Update](https://www.supergiantgames.com/blog/hades-superstar-update-patch-notes/) — weapon aspects, boons, permanent upgrades and variable rewards.
- OpenAI, [Sign in with ChatGPT quickstart](https://developers.openai.com/siwc/quickstart), [website integration](https://developers.openai.com/siwc/website), [plan-usage overview](https://developers.openai.com/siwc/token-sharing-open-source), [open-source registration and sign-in](https://developers.openai.com/siwc/token-sharing-open-source/sign-in) — hosted identity, separate plan-usage scopes, registered clients, and loopback callback requirement for the current open-source flow.
