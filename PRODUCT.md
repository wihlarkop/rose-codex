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

## Deck Builder

Multiple named decks support individual copies, duplication/deletion, count,
composition, and known-cost totals with unknown costs reported separately.
Names and canonical card IDs persist in versioned browser storage and portable
JSON. Invalid imports leave the workspace intact; corrupt saved records remain
untouched until explicit valid replacement. Storage errors allow in-tab editing
and JSON export. The 40-card and three-copy guidance does not confirm legality:
leader selection/rank and opponent cost are not modeled.

## Naming & Starter Deck Simulator

Deck Builder embeds an optional name-based starter explorer. The exact English
DotR player name maps to one of 16 groups and three possible starting Deck
Leaders. All 17 unique leader choices have a recorded 40-card list; #458 remains
flagged for manual review. Users can preview an option and copy its main-deck
cards into a **new** editable browser-local deck. The selected leader is named in
the deck title, not stored as a structured Deck Leader under schema version 1.
Shuffle, draws, Deck Leader ranks and match legality remain future work.

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

## Evidence and open questions

Canonical data covers 854 numbered records, IDs 000..853. Metadata is mostly
single-source; effects remain untranscribed. 853 local DotR images exist, with
#676 withheld for identity review; most image mappings remain probable rather
than individually verified. Screenshot redistribution rights remain unresolved.
