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

## Implemented in 2.4

This pass takes the playable loop, rather than the size of the map, as its comparison point. Last Epoch's published skill descriptions emphasize changing a skill's role; Blizzard's necromancer description gives each undead form a combat purpose. Sinfall now makes those choices easier to understand and adds actual interactions between guard, siphon and the summoned servant. This is a small authored system, not a claim of equivalent depth.

- Inventory icons and held weapons use the same stable visual descriptor. Straight, leaf, curved, heavy and rapier blades, bone/thorn/astral staves and other weapon families use different original geometry. Materials and runes reflect quality. Blades use a lowered carry grip, weapons track the palm through animation, and basic action-combat range/damage type follow the equipped weapon. Supplies stack visually and gear shows the difference against the equipped slot.
- Enemy rigs enter an evaluated idle pose immediately and animate outside combat. The dungeon's vertical drag direction is corrected, with an explicit inversion setting.
- Each settlement has 25 ambient residents, in addition to quest contacts and staffed establishments. Household identities have clock-based breakfast, work, shopping, evening and home phases; watchmen patrol after dark. Changes route existing actors toward new destinations without repositioning them each frame. Bounded pathfinding avoids buildings; residents retire at their thresholds and appear in their own homes at night. These are scheduled activities, not a full needs/economy simulation. Main quest contacts remain available.
- Main-town market stalls are moved away from the street network. Shutters, flower boxes, evening inn guests and the household population add detail to existing neighborhoods. All nine settlements' scheduled route endpoints and market clearance are checked against world geometry.
- The necromancer has nine talents arranged in Soulcraft, Gravebound and Bone Wards, with explicit prerequisites, level gates and a paid full point refund. Other classes show their existing connected offense/survival paths. Hero, Skills and Servant pages keep the long character screen usable on a phone. Existing learned talent IDs remain valid.
- The servant has an anatomical rib cage, skull/jaw, articulated elbows/knees and distinct equipment. Its lifetime is consumed during combat; it recovers health while exploring. Rally heals the existing ally and increases damage for six seconds. New talents extend combat lifetime/armor, mend the servant on guard, and restore servant health/mana when Soul Siphon lands. Retraining dismisses an existing servant so old build bonuses cannot linger.
- A tracked optional quest no longer borrows the main plot's chapter label. Turning it in returns tracking to the same main story and offers an explicit resume action. The relic choice is labeled as the main plot's final decision. Completing it leaves the player in the existing world; starting another campaign is a deliberate Journal action.

## Remaining gaps after 2.4

1. **Hosted AI dungeon master:** remains unconnected. A verified approved integration and backend are still required; authored quests and manual story-pack imports do not enable live AI.
2. **Broader content:** the six main mystery frameworks and three faction graphs remain finite authored content. More distinct plots, enemy behaviors, architecture and bespoke interiors would improve replay depth.
3. **Presentation:** equipment and the servant now have distinct silhouettes, but these remain small procedural models. More authored animation, sound and environmental art would improve combat weight and atmosphere.
4. **Simulation:** schedules and obstacle-aware walks are implemented; complex needs, crowd avoidance, jobs/economy and fully simulated indoor/outdoor navigation remain future work.

## Primary sources consulted

- Bethesda, [Make Your Mark on Skyrim](https://bethesda.net/en-US/news/the-elder-scrolls-v-skyrim-make-your-mark) — factions, comrades, discovery and activities.
- Blizzard, [Diablo IV Quarterly Update—June 2022](https://news.blizzard.com/en-us/article/23816542/diablo-iv-quarterly-updatejune-2022) — necromancer resources, class builds and customizable summons. Used for design principles, not a claim about current live balance.
- Larian, [Community Update #21: Forging Your Legacy](https://baldursgate3.game/news/community-update-21-forging-your-legacy_77) — character identity, reactive crowds and consequences.
- Supergiant Games, [Hades: The Superstar Update](https://www.supergiantgames.com/blog/hades-superstar-update-patch-notes/) — weapon aspects, boons, permanent upgrades and variable rewards.
- OpenAI, [Sign in with ChatGPT quickstart](https://developers.openai.com/siwc/quickstart), [website integration](https://developers.openai.com/siwc/website), [plan-usage overview](https://developers.openai.com/siwc/token-sharing-open-source), [open-source registration and sign-in](https://developers.openai.com/siwc/token-sharing-open-source/sign-in) — hosted identity, separate plan-usage scopes, registered clients, and loopback callback requirement for the current open-source flow.

- Eleventh Hour Games, [Skills](https://lastepoch.com/skills/) and [Skill Specialization](https://support.lastepoch.com/hc/en-us/articles/46363203944859-Skill-Specialization) — skill trees alter abilities and support changing a build. Used as a design reference, not a replication of its progression rules.
