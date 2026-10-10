# Rose Codex

**A companion for *Yu-Gi-Oh! The Duelists of the Roses* (PlayStation 2).**

Find the card on your screen, explore fusion recipes, build a deck, and plan your
next duel without leaving your browser. Rose Codex is designed to be comfortable
beside [PCSX2](https://pcsx2.net/) on a desktop or a smaller split-screen window.

**No account or game connection required.** It is a static, unofficial fan
project—not a PS2 emulator, cheat tool, or automatic battle simulator.

## Quick start

You need [Bun](https://bun.sh/) **1.4.2** (the version pinned by this repository).

```sh
git clone https://github.com/wihlarkop/rose-codex.git
cd rose-codex
bun ci
bun run dev
```

Open the local URL shown by Astro in your terminal. You can explore the library
and planning tools without launching PCSX2.

> The canonical game data and card images are committed to the repository.
> The first full production build additionally checks reproducibility against
> pinned external data sources; see [data sources and provenance](docs/data-sources.md).

## Explore the app

The six main navigation sections organize the tools around what you want to do:

| Section | What it does |
| --- | --- |
| **Home** (`/`) | Search for a card or jump back into a saved local deck. |
| **Cards** (`/cards/`) | Browse **854 numbered DotR cards** with original-game artwork, filters, quick lookup, and in-place card details. |
| **Fusion** (`/fusion/`) | Work with a manual Hand and Summoning Area, discover direct/chain results, or find recipes for a specific card. |
| **Decks** (`/decks/`) | Build and save decks, generate and review suggestions, practice draws, and manage your Collection/Reserve. |
| **Duel** (`/duel/`) | Record visible battle information, review **conditional** next-move considerations, and track actual results in Battle History. |
| **Reference** (`/reference/`) | Look up opponents, Deck Leaders, reincarnation information, and read-only PCSX2 save tools. |

### Find a card quickly

Press **Ctrl+K** (or **Cmd+K** on macOS) from any section. Search by card name or
DotR ID; pick a matching suggestion with the arrow keys and Enter, or choose
**View all results** to open the filtered Card Library.

The Card Library also has an adaptive toolbar for searching and filtering as you
scroll. A card can be flipped in place to inspect its available metadata.

### Plan a fusion or deck

In **Fusion**, add individual card occurrences to your Hand or Summoning Area.
You can inspect possible ordinary fusion chains and alternatives, apply a
planner-only fusion, and undo it. **Find Recipes** is part of the same workspace;
a recipe can be brought into the Workbench with an explicit replacement
confirmation when you already have cards entered.

In **Deck Workshop**, use **Build**, **Practice**, or **Inventory** without
navigating between separate tools. Generated or optimized builds are proposals:
you must explicitly add a new deck before anything is saved. Practice draws
do not consume cards or modify your saved deck.

### Keep a manual duel companion beside PCSX2

**Duel Companion** has two views:

- **Plan Duel:** enter what you can actually see—your Hand/Field, a known enemy,
  terrain, Summoning Points, and optional board positions—to get labeled,
  conditional considerations.
- **Battle History:** record completed real duels, outcomes, turns, and notes;
  review descriptive results or export a JSON backup.

The optional **Screenshot Assistant** can compare a manually cropped screenshot
against local DotR artwork and suggest possible matches. It is experimental:
you must confirm a candidate yourself. It is **not** automatic screen reading,
model confidence, or reliable battle-state detection.

## Reference and existing links

Open **Reference** (`/reference/`) for the four reference areas:

- **Opponents** (`/opponents/`) — reported encounters and selected deck cards from a
  community guide, with handoffs to Deck Leader, Deck Coach, and Duel tools.
- **Deck Leaders** (`/leaders/`) — reported type abilities, rank concepts, and
  clearly labeled gaps in verification.
- **Reincarnation** (`/reincarnation/`) — card lookup, manual five-duel progress, and
  limited community-research reward estimates.
- **Save Tools** (`/saves/`) — inspect or compare copies of supported PCSX2 `.ps2`
  File Memory Cards **locally and read-only**. This does not decode owned cards,
  decks, Deck Leader ranks, or story progress.

Older standalone URLs, including `/recipes/`, `/coach/`, `/simulate/`,
`/collection/`, and `/lab/`, remain available for existing links.

## Data, privacy, and limitations

**What is saved?** Decks, Collection information, manually recorded Battle
History, reincarnation progress, and appearance preferences use browser-local
storage. Portable JSON export is available for the supported saved workflows.
Use backups before clearing browser data or switching browsers/devices; there is
no account-based sync.

**What stays temporary?** Fusion planning inputs and screenshot/crop data are not
uploaded to a server. Uploaded memory-card images are read in browser memory
only, never written back to the original file or imported into your inventory.

**What can the tools actually conclude?** Fusion results and deck/tactical
recommendations use bounded deterministic logic and the documented game/community
sources. Incomplete effects, hidden cards, movement legality, unknown rewards,
unverified leader abilities, and real win probabilities are **not** inferred.
Battle History reflects only the results you manually record.

**Where does the artwork come from?** The repository contains **853 local WebP
card images** mapped to the 854-card catalog; missing or uncertain imagery is
shown honestly rather than substituted with unrelated artwork. Many source
records are not independently verified. See [card images](docs/card-images.md)
and [data sources](docs/data-sources.md) for coverage and provenance.

There is **no backend, login, database, analytics, hosted AI inference, or PCSX2
read/write integration** in the application. The website may load its committed
static assets; it is not claimed to be an offline PWA.

## For developers

The app uses **Astro 7**, **Svelte 5**, **TypeScript 6**, **Tailwind CSS 4**, and
**Bun 1.4.2**. Astro renders static pages, and interactive workspaces are
hydrated as Svelte islands. Canonical DotR IDs—not display names—identify cards.

| Path | Purpose |
| --- | --- |
| `src/pages/` and `src/layouts/` | Routes, static pages, and shared navigation |
| `src/components/` and `src/features/` | Reusable UI and bounded feature workspaces |
| `src/lib/dotr/` | Deterministic game logic, lookups, and validation |
| `data/canonical/` | Committed, reproducible data consumed by the app |
| `scripts/data/` and `scripts/images/` | Research-data and image pipelines |
| `tests/` | Bun tests following existing repository conventions |

### Checks

```sh
bun run lint           # Oxlint
bun run format:check   # Oxfmt (scoped to the existing baseline)
bun run data:validate  # Validate canonical records
bun test               # Unit tests
bun run check          # Astro, Svelte, and TypeScript checks
bun run build          # Reproduce data, verify, then build static output
```

`bun run build` produces `dist/`. On a clean machine, the build's
reproducibility step may need to fetch pinned source captures. Normal local
development and tests work with committed canonical files. To regenerate or
verify the source-backed data explicitly:

```sh
bun run data:fetch
bun run data:build
bun run data:validate
bun run data:check
```

Do not edit generated canonical JSON directly. Review source decisions and
manifests instead. For formatter scope and project conventions, see
[tooling](docs/tooling.md) and [interface guidance](DESIGN.md).

### Deployment

Production output is static and configured for **Cloudflare Workers Static
Assets**—no SSR adapter or application Worker logic is required.
GitHub Actions runs the checks on pull requests and the main branch;
deployment requires the Cloudflare credentials described in
[deployment setup](docs/deployment.md). No public deployment URL is assumed.

## Documentation

- [UX v2 design, navigation, and phased acceptance](docs/ux-v2-design-spec.md)
- [UX-07 integration and browser QA checklist](docs/ux07-integration-qa.md)
- [Fusion Workspace behavior](docs/fusion-workspace.md)
- [Deck Builder data and safety rules](docs/deck-builder.md)
- [Smart Deck Coach scope and limitations](docs/smart-deck-coach.md)
- [Screenshot Assistant research](docs/m5-screenshot-assistant.md)
- [Read-only PCSX2 Save Tools](docs/pcsx2-save-tools.md)
- [Canonical data provenance](docs/data-sources.md)
- [Card image coverage and acquisition](docs/card-images.md)

---

*Rose Codex is an independent, unofficial fan companion and is not affiliated
with or endorsed by Konami or the makers of PCSX2. Game names and artwork belong
to their respective rights holders. Image reuse/redistribution rights have not
been fully established; see the linked provenance documentation.*
