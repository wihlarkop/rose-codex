# Canonical card schema and coverage

The first-party contract is `src/lib/dotr/model.ts`, enforced at runtime by
`validateDataset` and build tooling. Data JSON is a dataset, not generated source
code. Names preserve English DotR spelling (including abbreviations and source
typos) with surrounding whitespace removed. Do not silently rename to modern TCG
labels. IDs are sorted integers, never padded strings; padding belongs to assets.

## Identity and required fields

[Yugipedia's DotR list](https://yugipedia.com/wiki/List_of_Yu-Gi-Oh!_The_Duelists_of_the_Roses_cards)
reports 854 numbered entries from 000 through 853. The inspected community array
has exactly those 854 contiguous IDs, and the gallery uses explicit ID labels.
The two story Rose cards are outside this range. Count/range are sufficiently
corroborated to enforce. This is library coverage: 671, Summoned Lord Exodia, is
special and should not be treated as an ordinary playable deck card just because
it has an ID. No game binary or console was used in this milestone.

| Field | Representation and meaning |
| --- | --- |
| `id`, `name` | Required integer 0..853 and nonempty trimmed display name. |
| `kind` | `monster`, `magic`, `trap`, `ritual`. Ritual is a DotR ritual card, not a modern monster subtype. |
| `monsterType` | One of 21 observed types, including Immortal; null for nonmonsters. See the exported enum. |
| `attribute` | LIGHT, DARK, EARTH, WIND, WATER, FIRE for monsters; null otherwise or for incomplete 671. |
| `level` | Integer 1..12 for ordinary monsters; null for nonmonsters and 671. |
| `deckCost` | Integer 1..99; null only for 671. |
| `atk`, `def` | Nonnegative integer base stats; zero is real, not missing. Broad sanity ceiling 9999. Null only for nonmonsters/671. |
| `trapRange` | `limited` or `full` for traps; null otherwise. Not an elemental attribute. |
| `magicClass` | `normal` or `power-up` for Magic; null otherwise. Preserves source `Power Up` classification. |
| `password` | Eight-character uppercase alphanumeric string, or null when not reported. Numeric Mirror Wall password becomes `53297534`; numeric values are padded to eight digits. Null does not promise no obtainable password. |
| `effect` | `{status: "not-recorded" | "untranscribed", text: null}`. Source absence does not prove no effect; source effect prose is not copied. |
| `fusionTags` | Observed DotR research tags, not TCG archetypes: Horned, Egg, Toon, Female, Elf, Shell, Caterpillar, Turtle. Empty means not recorded. These tags are incomplete as a fusion taxonomy. |
| `powerUpCardIds` | Sorted unique IDs of researched compatible Magic cards. These are compatibility references, not implemented equip mechanics. |

All fields exist on every record; null has an explicit meaning above. No union
of empty strings, absent properties, zero and null is allowed for the same fact.
The source calls monster level/deck cost `lv`/`dc`, password `pw`, and tags
`archetype`; those labels do not leak into canonical relational logic.

## Normalization decisions and uncertainty

- Source `Catterpillar` becomes `Caterpillar`; this is a documented spelling
  correction to a research category, not inference of new membership.
- Repeated compatible power-up IDs are deduplicated only for known cases:
  208..223 repeat 780, and 356 repeats 770. Other repeated relations fail import.
- Trap ranges and Magic power-ups occupy the source `attribute` field. They have
  separate canonical fields to avoid treating them as monster attributes.
- Source `fusionInfo` prose is omitted; actual outcomes live in canonical fusion
  data. The obscure `abillity_summon` flag is omitted: its intended semantics are
  not established, and it is not used to invent summon/leader behavior.
- 671 lacks attribute, level, deck cost, ATK and DEF in the pinned array. An
  [additional wiki entry](https://yugioh.fandom.com/wiki/Summoned_Lord_Exodia)
  suggests DARK and describes its special library appearance. The importer does
  not fill missing ordinary stats from that description.

## Current factual confidence

The array supplies 683 monster-class library entries, 118 Magic, 29 Trap and 24
Ritual. It records 734 passwords and effect prose on 452 entries, all deliberately
untranscribed. Every ID is covered, but metadata is mostly **single-source**.
Structural validation does not turn that into game verification.

The independent wiki samples are [000 Blue-Eyes White Dragon](https://yugipedia.com/wiki/Blue-Eyes_White_Dragon_(DOR))
(ID, name, Dragon/LIGHT, level 8, cost 55, 3000/2500, UB0HA94H) and
[829 Mirror Wall](https://yugipedia.com/wiki/Mirror_Wall_(DOR))
(Trap/full range, cost 80, numeric password 53297534). These facts are recorded
in `data/manifests/card-checks.json` and enforced by `data:validate`. The latter
page's DotR attack-halving description was inspected; no prose was incorporated.

Starter choices use IDs and preserve choice order. Each of the 17 lists contains
40 main-deck card IDs, retaining duplicates; `leaderCardId` is separate because
the leader is not necessarily among those 40 cards. Lists remain single-source.
Serpentine Princess (458) is `manual-review`: the source notes uncertainty about
448 Yormungarde versus 446 Armored Lizard. We preserve its current 448 entries.

Validation rejects unknown/missing fields, card count/range gaps, duplicate IDs or
names, enum errors, invalid numeric/null semantics, malformed passwords, unresolved
references, empty/overlapping fusion predicates, missing starter groups/decks,
non-40-card lists, and image manifests with wrong IDs/filenames. Available image
records need provenance and existing local files. No reincarnation references
are imported; its proposed model and unresolved mechanics remain research only.
