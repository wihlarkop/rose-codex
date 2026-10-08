# Tooling and workspace integration

## Execution and ownership

The Bun-powered Oxc foundation was committed separately as `bcd9490`.
[GitHub Actions run 37797507838](https://github.com/wihlarkop/rose-codex/actions/runs/37797507838)
succeeded before feature agents started. Oxlint and Oxfmt are the only added
dependencies; [tooling coverage](tooling.md) records framework and format limits.

Shared contracts were committed as `3a7de4b`. Luna High implemented Fusion in
`.worktrees/fusion`; Luna Medium implemented Deck Builder in `.worktrees/decks`.
Writable paths were disjoint, as recorded in [the contracts](feature-contracts.md).
An optional Luna Medium agent performed read-only rules/CPU-deck research.
The parent owned shared components, navigation, integration, review, and every
Git write. Parent integration commits are `d413983` (Decks) and `6b45307` (Fusion).

Both pages reuse the canonical projection, picker, artwork, and flip tiles.
The only shared card-component change adds an optional DOM ID for occurrences;
the library's default ID and behavior remain intact. Integration adds navigation,
wraps it on small screens, and uses the existing radius token. No canonical data,
image assets, domain engine, or existing tests changed. No automated test files,
packages beyond Oxc, or deployment configuration were added.

## Browser acceptance

Checks used the actual application in Chrome at desktop size and 390 × 844.
Temporary fixtures and a separate localhost storage-failure harness were used
for acceptance; they are outside committed production files.

| Surface | Observed behavior |
| --- | --- |
| Fusion inputs | Keyboard picker selection; duplicate #021 occurrences; six planning occurrences across two zones; independent movement and removal; visible positions |
| Direct fusion | #021 + #036 displayed #024 with its image and metadata |
| Ordered chain | #021, #036, #533 showed #024 then #538; adding #000 stopped at step 3 and retained #538 as the current result |
| Chain editing | Moving #000 earlier changed failure to step 2; zone movement preserved chain identity; removing a selected occurrence removed its chain reference |
| Deck lifecycle | Create, rename, duplicate, delete, select, and reload restored multiple decks |
| Copies | Removing the first #021 left the flipped second occurrence as the first copy, preserving its independent state |
| Summaries | Copy-aware counts/costs; four-copy warning; #671 reported unknown cost; #676 showed unavailable imagery; kind and monster-type composition |
| JSON | Real export download contained version, deck IDs, names, and card IDs only; round-trip import succeeded; unknown card ID import was rejected without replacement |
| Storage | Forced quota failure and import write failure showed an unsaved warning; restoring writes and retrying reported a save; malformed saved JSON remained byte-for-byte untouched with zero writes; denied reads allowed editing without writes |
| Layout | Both new pages stacked at 390px with no horizontal document overflow; wrapped navigation remained usable |
| Existing library | 854-card initial count, exact-ID search, flip interaction, and keyboard quick lookup remained functional; withheld #676 image remained honest |

The final source also passed Oxlint, Oxfmt, Astro/Svelte/TypeScript checks and a
static build. The existing suite passed 105 tests in seven files with 197
expectations. Data reproduction and validation passed with 854 cards, 26,540
ordinary pairs, and 853 local images. The design detector reported no findings.
These checks cover the recorded journeys; they are not an exhaustive browser or
game-simulation test suite.

## Game evidence and remaining scope

The [US PS2 manual](https://www.videogamemanual.com/PS2/Yu-Gi-Oh%21%20The%20Duelists%20of%20the%20Roses%20%28USA%29.pdf)
specifies a five-card hand and ordered tagging of hand cards for Fusion or
Power-up. Unlimited input in this app is planning capacity. The manual does not
settle multi-card failed-fusion consumption; the existing extracted pair table
supports ordinary lookup, not a full Summoning Area simulation.

[Deck rules and the persistence format](deck-builder.md) document 40 main-deck
cards, the three-copy guidance, separate leader requirements, and campaign cost
comparison. Leader rank, opponent selection, and complete legality remain outside
the builder. Special transformations, random outcomes, equipment, rituals,
material consumption, and Fusion persistence remain outside the preview.

The existing starter data contains 16 naming groups and 17 known lists. The
read-only research did not establish a sufficiently authoritative complete CPU
deck dataset. No CPU records were inferred or imported, and regional variants
were not compared. Naming, reincarnation, and CPU-deck interfaces remain future
work. Deployment was not initiated by this task.
