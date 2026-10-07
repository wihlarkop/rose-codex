# Rose Codex

A fast, static, browser-based companion for **Yu-Gi-Oh! The Duelists of the
Roses (PS2)**. Current status: **M0 — foundation and data research**. The homepage
only proves static build and hosting. None of the planned product tools has a UI.

Long-term direction: Card Browser, Visual Fusion Simulator, Fusion Reference,
Naming / Starter Deck Simulator, Deck Tools, and Reincarnation Tools.

## Develop

Install **Bun 1.4.2**, as pinned in `.bun-version` and `package.json`.

```sh
bun ci
bun run dev
bun run data:validate
bun test
bun run check
bun run build
```

Astro 7.3.6 produces static assets in `dist/`. Svelte 5 is installed for future
interactive islands; M0 has none. TypeScript 6.0.3 satisfies the integrations'
current peer ranges (TypeScript 7 is not supported by these pinned checkers).
Everything runs through Bun, including the installed Wrangler entry point.

## Data

The application may import **only `data/canonical/`**, never raw captures or
development manifests. Card IDs are integers `0..853`; filenames use three-digit
padding. Names are display/search values, never canonical relational keys.

The committed dataset contains 854 numbered library records, 26,540 ordinary
fusion outcomes represented by 153 lossless ID-set predicates, 13 special
power-up transformations, 16 starter choice groups and 17 forty-card starter
lists. All 854 image entries are `missing`; no collection has been acquired.

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
execute third-party code. `data:build` reads JSON literals, normalizes factual
fields, validates the whole dataset, then writes deterministic JSON. Do not
mass-edit generated files; change first-party import decisions/manifests instead.
`data:check` regenerates in memory and compares exact bytes, failing on stale or
missing files. It needs the verified raw captures, while ordinary dev and tests
use committed canonical data and need no source-network access. Production build
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
