# Fusion research evidence

Research performed on 2026-10-08. This records evidence for the representation in [fusion-model.md](fusion-model.md); it does not claim emulator or original-console verification.

## The game has a resolved table

GenericMadScientist describes extracting the game's complete fusion array into an ID-based spreadsheet. The original author explicitly distinguishes that array from the generic patterns players infer from its contents. The same discussion identifies irregular entries, including Black Luster Soldier working where Unknown Warrior of Fiend does not. [Author's extraction announcement and follow-up, posts 1, 4 and 6](https://gamefaqs.gamespot.com/boards/589455-yu-gi-oh-the-duelists-of-the-roses/75370421).

The [published table](https://docs.google.com/spreadsheets/d/1N1Q5uf3Xbf1KyWx0iI3REoQi7NrqdwSHb0oR06UH-LE/edit#gid=737412572) was acquired through its public [CSV export](https://docs.google.com/spreadsheets/d/1N1Q5uf3Xbf1KyWx0iI3REoQi7NrqdwSHb0oR06UH-LE/export?format=csv). Captured bytes: 335,389; SHA-256: `2102b674cc06a1dbe5e234960a191581bd94a423dd6a5c9d67ce4604d19cf6ba`. No explicit reuse license was exposed by the CSV. It is treated as published factual game research, with attribution, rather than licensed implementation code.

## Whole-table cross-check

The three CSV columns were parsed as integer lower material ID, higher material ID and result ID. Each unordered pair was compared with the JSON object literal in [Eenkin's fusionList.js at the inspected commit](https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/fusionList.js). Reference JavaScript was read as text; no implementation was evaluated or incorporated.

The local comparison found:

- 26,540 spreadsheet rows and 26,540 unique material pairs.
- All 26,540 outcomes present and equal in Eenkin's table.
- No spreadsheet-only pairs and no conflicting outcomes.
- 26,553 Eenkin pairs: the same table plus 13 special power-up combinations.

These are two matching publications, but source independence is limited: Eenkin may use the same extracted game table. Agreement establishes transcription consistency, not an independent original-game playtest of every combination. The extraction documentation concerns NTSC-U; other regional versions were not compared.

## Patterns are explanatory

Eenkin documents fusion patterns involving type, original ATK and level, attribute, specific cards and game-specific categories such as Elf, Female and Turtle. Original stats govern ordinary fusion; modified ATK/type do not alter its result. The guide warns that category conflicts and inconsistent pairs defeat simple extrapolation. [Fusion guide](https://eenkin.github.io/dotr-fusion-simulator/fusion_list).

Bounded probes against the entire captured table found these exact patterns: Dragon + Thunder with both original ATK strictly below 1,600 gives 535 (120 pairs); Dragon + Zombie below 1,600 gives 106 (288 pairs); Rock + Zombie below 1,200 gives 637 (208 pairs); Plant + Reptile below 1,000 gives 665 (90 pairs); Reptile + Thunder below 850 gives 541 (20 pairs). These are observed table summaries, not replacement runtime rules. Equality at the stated ceiling cannot be assumed.

Examples preserving actual exceptions and gaps:

| Material IDs | Outcome | Significance |
| --- | --- | --- |
| 21 + 36 | 24 | Time Wizard takes precedence over the general Dragon/Spellcaster description. |
| 19 + 533 | No table fusion | A 1,800 ATK Dragon does not satisfy either Thunder Dragon tier. |
| 478 + 542 | 538 | Aqua Dragon is a Sea Serpent, but is an allowed substitute. |
| 632 + 542 | 538 | Stone D. is a Rock, but is an allowed substitute. |
| 44 + 73 | 312 | Original material ATK 1,450 exceeds the result's 1,400. |
| 155 + 613 | 151 | Original material ATK 2,300 exceeds the result's 1,800. |
| 143 + 172 | 154 | Black Luster Soldier works despite its 3,000 ATK. |
| 142 + 172 | No table fusion | The adjacent Unknown Warrior of Fiend does not work. |

No universal priority ordering was established. The resolved table already records conflict outcomes; inventing a priority DSL would add an unsupported interpretation.

## Special power-ups are separate

Reverse-engineering documentation identifies an equip effect category for transformation and separately lists Elegant Egotist, Cocoon of Evolution, Metalmorph and Insect Imitation. [EquipData documentation](https://github.com/GenericMadScientist/DotR-Documentation/blob/master/structs.h).

The 13 additions in Eenkin's table are:

| Power-up ID | Monster IDs | Outcome |
| --- | --- | --- |
| 797 | 272 | 273 |
| 798 | 401, 407, 416, 423, 426 | 427 |
| 799 | 7 | 501 |
| 799 | 342 | 488 |
| 800 | 16, 17, 167, 332, 379 | Random transformation; source uses `?`. |

Random output pools, weights and RNG were not established. `?` must not become a fabricated card ID or a deterministic result. The [reference simulator](https://eenkin.github.io/dotr-fusion-simulator/) stops exploring subsequent fusions after these uncertain outcomes.

Ordinary equip stat changes and ritual summoning need their own semantics. The captured table is sufficient for ordinary deterministic two-card fusion identity. It does not independently specify failed-combination consumption, equipped-card state, ritual procedures, or randomized transformations. Chained successful fusion can use each resolved output ID as the next material; broader in-game sequencing remains a separate behavior contract.
