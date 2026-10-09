# Rose Codex

## Platform and purpose

A static companion for desktop/laptop players of Yu-Gi-Oh! The Duelists of the
Roses who want to recognize cards visually without memorizing names. The library
supports local name/ID search, kind/type/attribute filters, authentic game imagery,
in-grid card metadata and keyboard-friendly visual quick lookup. Fusion planning
and browser-local deck construction reuse the same canonical cards and images.

## Constraints

Astro, strict TypeScript, Svelte islands, Bun, Tailwind with selective local
shadcn-svelte primitives, and canonical static data. DotR ID is identity. No
backend, database, SSR, authentication, PWA, service worker, analytics, global
state library or third-party browser data fetch. Images must be DotR-specific;
prefer an honest missing image to incorrect art. Rights uncertainty remains
explicit. Cloudflare deployment, the custom domain and R2 remain deferred.

## Presentation

Warm-neutral, compact, subtle and desktop-oriented. Default tiles preserve the game
screen and flip in place to show metadata. Card imagery and readable names
dominate the visual hierarchy; all workspace interactions stay on their route.

## PCSX2 Save Inspector v1

A new `/saves/` route accepts a local PCSX2 **File Memory Card** `.ps2` image via the browser File API and inspects its PS2 superblock, capacity, per-page spare/ECC layout and bounded root directory. A matching `SLUS-20515` name is labeled **possible** DotR save (NTSC-U/C), never proof of verified game data. The parser bounds file size (70 MiB), validates filesystem geometry, traverses FAT for root entries with a cycle guard, and reports a warning for damaged or incomplete directory metadata. The original file is never changed or uploaded, and the app does not download, persist or store save bytes. Folder-based PCSX2 cards, non-`.ps2` game-save containers, exported save payloads, and DotR gameplay fields (card ownership, deck, ranks, campaign progress, reincarnation) remain unsupported until independently verified. See [save inspector design and evidence](docs/pcsx2-save-tools.md).

## Fusion Workspace

The reusable picker returns canonical IDs without owning navigation or game
state. The workspace allows unlimited, individually removable card
occurrences, including duplicates. Each unique instance ID references a canonical
card ID and belongs to Hand or Summoning Area, with movement between zones.
Entering cards automatically discovers ordinary direct fusions and ordered
successful chains, including subsets and alternative recipes. Results group by
final card and show images, materials, intermediate monsters, and occurrence
labels. Every input shows direct, chain-only, no-current-ordinary-fusion, or
undetermined compatibility derived from the full discovery set, before sorting
or filtering. Known deterministic special pairs get a separate indicator.
Hand and Summoning Area have unlimited planning capacity, not simulated game
capacity. Field-assisted recipes begin with a field card; field pairs are
conditional on legal movement. A 25,000-check budget bounds discovery. Budget,
unsupported field sequences, and unresolved random pairs make limitations visible
and prevent definitive negative compatibility. Previews never consume materials.
An optional explicit Summon result action consumes the chosen recipe's original
planning occurrences and adds one result in Summoning Area, with one-step Undo;
automatic previews never modify the workspace. Board legality, failed-fusion
discards, equip bonuses, rituals, and random results are not simulated. See [Fusion behavior](docs/fusion-workspace.md).

## Conditional Duel Strategy Advisor

Fusion Workspace offers an optional **Duel Strategy** context panel. Players
can choose a visible opposing Monster, its Attack/Defense position and an
assumed contact-square terrain. It compares ordinary Monsters already entered
in Hand/Field with confirmed fusion results using known ATK/DEF and the
documented +/-500 ordinary terrain type effects. Unknown enemy cards,
face-down positions, unavailable stats and Toon/Crush/Labyrinth terrain are
**unknown outcomes**, never treated as neutral or guaranteed wins.

A compact five-option read-only ranking links fusion candidates to their
existing detailed recipes. No duplicate Summon controls, save changes or
new data dependencies. Advice is conditional on valid board movement,
summoning points and card/effect legality, which remain unmodeled. See
[Duel Strategy Advisor](docs/duel-strategy-advisor.md).

## Fusion Encyclopedia

A separate **Recipes** route reverses the canonical 26,540-pair ordinary
fusion table: select a result by name/ID and inspect every recorded direct
material pair. Results have authentic small DotR images, incremental display,
optional material search and Collection readiness based on exact owned-copy
counts, including duplicated material IDs. Readiness is unknown when saved
Collection is absent or invalid; this feature never writes stored data.
Deterministic special transformations are explicitly separate. Full multi-step
reverse-chain search remains out of scope; Fusion Workspace already explores
chains from actual Hand inputs. See [Fusion Encyclopedia](docs/fusion-encyclopedia.md).

## Deck Builder

Multiple named decks support individual copies, duplication/deletion, count,
composition, and known-cost totals with unknown costs reported separately.
Names and canonical card IDs persist in versioned browser storage and portable
JSON. Invalid imports leave the workspace intact; corrupt saved records remain
untouched until explicit valid replacement. Storage errors allow in-tab editing
and JSON export. The 40-card and three-copy guidance does not confirm legality:
leader selection/rank and opponent cost are not modeled.

## Deck Readiness & Campaign Budget

The existing Deck Builder includes a collapsible, read-only deck readiness adviser. It checks exactly 40 cards and no more than three copies of the same main-deck card, and optionally compares canonical known Deck Cost against a selected reported campaign opponent (from Opponent Encyclopedia). The manual's strict lower-than threshold is used, excluding the separate Deck Leader. A chosen Monster Deck Leader requires explicit **user-verified rank >= 2LT** in their game save; merely selecting a starter leader never claims rank eligibility. Unknown card costs and unknown leader rank produce inconclusive results, while known violations fail. The adviser displays minimum DC reduction required and high-cost card candidates for manual revision, but never edits the deck or suggests false guaranteed replacements. No Deck Leader, rank, or opponent is persisted or added to deck schema v1. A conditional pass is not claimed as legal in the current game save. See [Deck Builder rules](docs/deck-builder.md).

## Naming & Starter Deck Simulator

Deck Builder embeds an optional name-based starter explorer. The exact English
DotR player name maps to one of 16 groups and three possible starting Deck
Leaders. All 17 unique leader choices have a recorded 40-card list; #458 remains
flagged for manual review. Users can preview an option and copy its main-deck
cards into a **new** editable browser-local deck. The selected leader is named in
the deck title, not stored as a structured Deck Leader under schema version 1.
Shuffle, draws, Deck Leader ranks and match legality remain future work.

## Deck Leader Reference

The read-only `/leaders/` page uses canonical Monster cards and the 17
starter choices to explain Deck Leader role, twelve promoted ranks, and
sourced community reports about type-specific ability milestones. The
rank/ability reports are labelled incomplete, with explicit caveats about
monster level and unverified individual unlocks; absence of a report does
not mean an ability is unavailable. The interface defaults to starter
Twin-Headed Behemoth #034 and links from selected starter previews.
A hypothetical rank chooser does **not** read or modify user save data,
declare a card eligible, change deck storage, or power gameplay strategy.
See [Deck Leader research](docs/deck-leader.md).

## Owned Collection and deck-assisted Fusion

`/collection/` records per-card owned copy counts under a separate versioned
localStorage key, initially estimated conservatively from the maximum
usage across existing deck presets. The user explicitly moves active deck
cards to Reserve or moves owned Reserve cards back into a deck. Existing
overfull deck contents and the deck storage schema are preserved.
Full legality checks, syncing game rewards, and structured leader data
remain out of scope.

Fusion can display any saved deck and let a user select specific real
Hand/Field cards from it, not automatically load all 40 into Hand.
Deck-assisted Fusion does not shuffle or draw yet.

## Deck practice and suggested fusion plays

`/simulate/` loads saved 40-card decks without writing to deck or owned-card
storage. Players shuffle a copied deck, draw a five-card Hand without
replacement, set aside selected copies, and draw into open Hand slots. This
practice does not claim to model game turn rules or its RNG.

Suggested Plays reuses canonical fusion discovery to show up to three
ordered, valid fusion recipes ranked by highest known result ATK, then fewer
materials, DEF and ID. This ranking is guidance, not optimal duel strategy.
Simulator Hands can be opened in Fusion through a validated card-ID query.
The full Fusion Workspace also shows suggestions for its current inputs.
See [Deck Simulator](docs/deck-simulator.md).

## Opponent / Character Encyclopedia

The static `/opponents/` route lets players choose their **joined** Red or White Rose path, search encounter names and locations, and inspect twenty reported fights (ten per path, counting the two route-specific Manawyddan endings). Each profile provides a reported Deck Leader with canonical DotR artwork, community-reported Deck Cost and terrains, three selected example deck cards by canonical ID, and short cautious battle-preparation notes. Deep links use `?opponent=<id>`; the reference does not save user state or update gameplay data. All profiles are authored from an identifiable 2012 GameFAQs walkthrough, not game binaries, and the app presents a single-source caveat. Card highlights are not complete opponent decks, effect transcriptions, guaranteed rewards, drop rates or automated strategy/legality conclusions. See [Opponent source and acceptance](docs/opponents.md).

## Reincarnation Research Calculator v2

The existing `/reincarnation/` page offers an **optional research-estimate calculator** next to the accepted manual duel tracker. Players choose a candidate sacrifice card and manually enter Deck Leader ranks for slots A and B; unknown rank values do not silently default to zero. The first-party pure TypeScript model uses GenericMadScientist's published NTSC-U account: class probabilities, **maximum** rank A/B, high-cost (+1..+10) and low-cost (-10..+1) choices uniformly within each range, the 167 published reward-exclusion card IDs, candidate DC fallback and Fake Trap. Another independent community calculator matches the reward eligibility **set** but disagrees on rank combination/range weighting; this implementation does not claim to resolve the disputed mechanics. The UI shows the top modeled outcomes and supports a specific reward CardPicker for its modeled **single-award** probability. No promise is made about the probability of receiving the card across three awards, RNG state, independence or duplication of awards; no source code is copied from third parties. The original reincarnation tracker version and storage are left untouched. See [Reincarnation research](docs/reincarnation.md).

## Reincarnation Guide & Planner

`/reincarnation/` is a read-only canonical card lookup with an explicitly manual five-duel tracker for the next reincarnation opportunity. The tracker is stored under its own versioned browser key and never reads or changes decks, Collection, or PCSX2 saves. Players record completed 1-player CPU duels, can undo an entry, and manually reset the counter after using reincarnation. The counter caps at five: the game grants only one pending opportunity at a time, not two from ten duels. Saved progress is validated; unexpected/corrupt data and cross-tab edits are not overwritten.

The guide uses the original PS2 manual for controls (Chest → select a card → L3 → confirm) and the three-card exchange. Any selected card is only a **candidate preview**, not an assertion that it is owned, allowed, or present in the Chest. Because community probability formulas and eligible card sets remain unresolved, v1 does not estimate outcomes, simulate RNG, or claim exact drop rates. See [reincarnation research and v1 scope](docs/reincarnation.md).

## Evidence and open questions

Canonical data covers 854 numbered records, IDs 000..853. Metadata is mostly
single-source; effects remain untranscribed. 853 local DotR images exist, with
#676 withheld for identity review; most image mappings remain probable rather
than individually verified. Screenshot redistribution rights remain unresolved.
