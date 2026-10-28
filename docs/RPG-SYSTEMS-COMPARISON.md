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

## Remaining gaps, in order

1. **Hosted AI dungeon master.** The phone release remains offline. Text generated from a seed is not live AI. The current integration uses an HTTP loopback sign-in callback for a locally running open-source client. The hosted edition needs an approved OAuth client with a registered website callback, plan-usage authorization, and a deployed session/inference backend. No such hosted client is configured in this repository. Sign-in alone is identity, not inference access. User account consent and a successful real inference request are required before claiming connection.
2. **Quest topology.** Add authored multi-stage faction quests and alternative methods with real scene changes. AI prose alone does not create these mechanics. NPC motives, route changes and persistent world consequences must be represented in engine data and validated.
3. **Encounter variety.** Current combat supports one active opponent. Group encounter coordination, enemy locomotion and stronger impact animation remain separate work; no claim that this update adds them.
4. **Exploration density.** Expand genuinely interactive destinations and distinctive interiors before adding more empty map area. Town density changes shipped in 2.1.1; this release does not claim another settlement expansion.
5. **Campaign identity.** Branching quest graphs, distinct guardians and persistent story facts must supplement fresh wording and seeded rewards. The existing six authored mystery frameworks are a fallback, not unlimited AI campaigns.

## Primary sources consulted

- Bethesda, [Make Your Mark on Skyrim](https://bethesda.net/en-US/news/the-elder-scrolls-v-skyrim-make-your-mark) — factions, comrades, discovery and activities.
- Blizzard, [Diablo IV Quarterly Update—June 2022](https://news.blizzard.com/en-us/article/23816542/diablo-iv-quarterly-updatejune-2022) — necromancer resources, class builds and customizable summons. Used for design principles, not a claim about current live balance.
- Larian, [Community Update #21: Forging Your Legacy](https://baldursgate3.game/news/community-update-21-forging-your-legacy_77) — character identity, reactive crowds and consequences.
- Supergiant Games, [Hades: The Superstar Update](https://www.supergiantgames.com/blog/hades-superstar-update-patch-notes/) — weapon aspects, boons, permanent upgrades and variable rewards.
- OpenAI, [Sign in with ChatGPT quickstart](https://developers.openai.com/siwc/quickstart), [website integration](https://developers.openai.com/siwc/website), [open-source registration and sign-in](https://developers.openai.com/siwc/token-sharing-open-source/sign-in) — hosted identity, separate plan-usage scopes, registered clients, and loopback callback requirement for the current open-source flow.
