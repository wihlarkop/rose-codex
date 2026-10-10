# Rose Codex

A fast, static, browser-based companion for **Yu-Gi-Oh! The Duelists of the
Roses (PS2)**. Current status: **visual card library, Fusion Workspace, and Deck Builder**.
Open `/cards/` to browse/search the numbered library; select a card for its full
game screen and metadata in place. `/fusion/` automatically discovers ordinary
fusions and compatibility for distinct planning occurrences; `/decks/` manages
browser-local decks with JSON backups. The Reincarnation Guide at `/reincarnation/` includes card lookup, a separate manual
five-duel tracker, and a community-sourced single-reward probability estimate with
visible limitations. It does not read PCSX2 saves or predict the actual three cards.
The `/opponents/` Encyclopedia covers 20 reported story encounters across both Rose
paths, linking selected enemy cards and Deck Leaders to canonical DotR card images.
It is a single-guide reference, not a verified full deck or reward-drop database.

The **Smart Deck Coach** at `/coach/` combines deterministic, explained opponent
matchup scoring (M5-01) with a 40-card, three-copy, strict-Deck-Cost deck
generator (M5-02). Its cost search uses canonical ATK/DEF, ordinary terrain,
selected reported opponent monsters, potential ordinary fusion links, and
verified power-up compatibility. It assumes cards unlocked, does not infer
earned Deck Leader ranks or untranscribed card effects, and never claims a
predicted win rate. Suggestions can be **reviewed and deliberately added**
as a new deck in Deck Builder without replacing existing decks.
See [Smart Deck Coach limitations](docs/smart-deck-coach.md).

The `/saves/` PCSX2 Save Inspector reads a selected `.ps2` image locally in the
browser: signature, capacity, filesystem geometry, and bounded top-level save
folder names. For NTSC-U DotR candidate folders it also lists contained file names,
file sizes, and optional 24-byte hex header previews for format research.
A new local **Save Comparison** panel can compare before/after `.ps2` snapshots
and report changed DotR save filenames, byte counts, and bounded changed
file-relative offset ranges without revealing byte values.
It does not upload or edit files, and does not decode DotR inventory,
Deck Leader rank or story progress. Folder cards and other save formats are not
supported yet. See [memory card inspector](docs/pcsx2-save-tools.md).

Long-term direction: Card Browser, Visual Fusion Simulator, Fusion Reference,
Naming / Starter Deck Simulator, Deck Tools, and verified Reincarnation probability tools.

## Develop

Install **Bun 1.4.2**, as pinned in `.bun-version` and `package.json`.

```sh
bun ci
bun run dev
bun run lint
bun run format:check
bun run data:validate
bun test
bun run check
bun run build
```

Astro 7.3.6 produces static assets in `dist/`. The card browser uses one Svelte 5
interactive island per workspace. TypeScript 6.0.3 satisfies the integrations'
current peer ranges (TypeScript 7 is not supported by these pinned checkers).
Everything runs through Bun, including the installed Wrangler entry point.

Oxlint and Oxfmt run through Bun too. `bun run lint:fix` applies safe lint fixes;
`bun run format` writes scoped formatting. Existing application/data/test files
are excluded from the initial formatting baseline to avoid a broad rewrite.
Astro formatting is unsupported; framework/type checks remain required.
See [tooling coverage and exclusions](docs/tooling.md).

## UI foundation

Tailwind CSS 4.3.3 uses the official Vite integration. Local shadcn-svelte Nova
primitives are limited to Button, Input, Command and Popover (CLI 1.7.0; Bits UI
2.18.0). Their MIT notice is retained in `src/components/ui/LICENSE.md`.
Astro renders the shell without hydration; the library
and quick lookup share one Svelte island and one canonical browser projection.

Theme colors, radius and spacing live in `src/styles/global.css`. Change tokens
there; `@theme inline` exposes them to Tailwind and shadcn. Use semantic surface,
foreground, muted, primary, selected and ring tokens in custom components.
See [interface guidance](DESIGN.md) and [UI report](docs/ui-foundation-report.md).

`CardPicker` accepts `cards: BrowserCard[]`, `onselect(cardId: number)`, optional
`label` and `selectedCardId`. It searches the full supplied catalog and shows the
first 20 matches with an honest count. Command supplies combobox/listbox semantics
and ArrowUp/ArrowDown/Enter; Popover supplies Escape and focus return. The callback
returns only canonical identity. `CardQuickLookup` handles navigation separately;
future tools can handle selection without copying picker behavior. Artwork,
tiles, stats and suggestion rows are project-owned under `src/components/cards/`.
Feature state stays within each workspace; there is no global store.

## Planning workspaces

Fusion automatically discovers ordinary direct results and sequential chains
whenever cards are added, copied, removed, or moved between Hand and Summoning
Area. Every occurrence shows compatibility from all found recipes. Result images,
intermediates, materials, and expandable alternatives are grouped by final card;
sorting/filtering do not affect compatibility. Deterministic special power-up
pairs are separate. A 25,000-check budget and unsupported field/random mechanics
produce visible partial status and undetermined negatives. Zones have unlimited
planning capacity; they do not simulate game capacity or board legality.
Previews never consume materials or infer failed-chain discards, equip bonuses,
rituals, or random results. There are no manual pair or chain-building controls.

Deck Builder includes a read-only Deck Readiness adviser: enter a Monster leader's
manually checked rank, choose a reported story opponent, and compare count/copies
and known Deck Cost without changing save data. Exact eligibility remains conditional.

Deck Builder supports multiple decks, names, duplication/deletion, individual
copies, count/composition and known-cost summaries. Versioned localStorage saves
only IDs and names; JSON import validates the entire envelope before replacement.
Storage failures leave editing available and prompt users to export a backup.
Count/copy guidance does not establish legality without a leader and opponent.

See [Fusion behavior](docs/fusion-workspace.md), [deck format and rules](docs/deck-builder.md),
and [integration and acceptance evidence](docs/workspace-report.md).


## Data

The application may import **only `data/canonical/`**, never raw captures or
development manifests. Card IDs are integers `0..853`; filenames use three-digit
padding. Names are display/search values, never canonical relational keys.

The committed dataset contains 854 numbered library records, 26,540 ordinary
fusion outcomes represented by 153 lossless ID-set predicates, 13 special
power-up transformations, 16 starter choice groups and 17 forty-card starter
lists. Image discovery maps all 854 IDs; a reviewed NA variant resolves 065,
while 676's portrait variant is withheld for review. There are 853 local WebPs
(35.20 MiB); 11 identities were visually verified and 842 remain probable.
see [image coverage/pipeline](docs/card-images.md) and its acquisition report.

Coverage is not blanket factual verification: most metadata and starter lists
remain single-source. Two metadata samples were cross-checked. Fusion outcomes
match a published extracted game table in full, but the two publications may
share provenance. Effect text is intentionally untranscribed. ID 671 is a
special library entry with unknown ordinary stats. Serpentine Princess's starter
list needs review. See [schema and coverage](docs/card-schema.md),
[provenance](docs/data-sources.md), [fusion model](docs/fusion-model.md),
[naming](docs/naming.md), [reincarnation](docs/reincarnation.md), and
[images](docs/card-images.md).

Canonical JSON is generated and committed. To reproduce it:

```sh
bun run data:fetch
bun run data:build
bun run data:validate
bun run data:check
```

`data:fetch` explicitly acquires two public source files at a pinned Git commit,
checks their SHA-256 digests, and caches them in ignored `data/raw/`. It does not
execute third-party code. `data:build` reads JSON literals and image manifests, normalizes factual
fields, validates the whole dataset, then writes deterministic JSON. Do not
mass-edit generated files; change first-party import decisions/manifests instead.
`data:check` regenerates in memory and compares exact bytes, failing on stale or
missing files. It needs the verified raw captures, while ordinary dev and tests
use committed canonical data and need no source-network access. Image acquisition
is separate and never runs in normal CI/build; see the explicit commands in the
image documentation. Public game screenshot redistribution rights remain unresolved.
Production build
also checks reproduction: its first run needs acquisition, and later builds can
use verified cached captures offline.

## Verification and deployment

`bun run build` checks reproduction, validates data, runs `bun test`, performs Astro/TypeScript checks,
checks Svelte islands when any exist, then builds. GitHub Actions runs on PRs and
pushes to main, uses SHA-pinned actions, installs with `bun ci`, reproduces data,
and runs every required check. Production deployment is a later step in that
same job and can run only on a successful push-to-main verification.

Cloudflare Workers Static Assets hosts `dist/`, with no Astro adapter, SSR,
application Worker, database, authentication, service worker, or runtime secrets.
Set repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` for CD.
Until then, CI reports deployment as **not executed**. For an authenticated local
deployment, run `bun run deploy`; for a non-deploying config probe, run
`bun run wrangler deploy --dry-run` after building.

`dotr.wihlarkop.com` is deferred. First deploy and verify the workers.dev site,
then inspect the intended account and DNS before attaching the domain. See
[deployment setup](docs/deployment.md). Tool telemetry is disabled; the application
contains no analytics.
