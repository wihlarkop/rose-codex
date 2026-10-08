# Card Library delivery report

Historical data/image acquisition and verification record. The current visual
system and card flip behavior are described in [DESIGN.md](../DESIGN.md).

2026-10-08. Started from clean main at M0 commit
`cce72b064afbc9ed8c1efcac7b5a5162e4c845c5`.

## Image dataset

| Topic | Result |
| --- | --- |
| Sources investigated | Yugipedia's numbered DotR gallery, public MediaWiki file metadata and the DotR Necrolancer card page. M0's generic-art research retained; no generic images acquired. |
| Source strategy | Local English DotR library screenshots; gallery revision 5222290. Explicit row-local numbers determine identity; file API metadata supplies original URLs. |
| Rights | Public/downloadable; redistribution rights unresolved. No asset-specific grant found. Wiki CC terms are not claimed for Konami imagery. Originals ignored, optimized assets/provenance committed. |
| Mapping | 854/854 unique numbered entries, no ID gaps/duplicate IDs/files. Capitalization discrepancies at 155 and 612. Missing gallery EN file 065 resolved by a separately reviewed, explicitly numbered NA card-page variant. |
| Acquisition | 854 candidates/originals downloaded; 853 converted/local WebPs. No outstanding acquisition failures. Resuming reviewed pilots reused cached sources/unchanged outputs. |
| Confidence | 11 hash-bound visually reviewed identities: 000, 021, 065, 171, 350, 414, 671, 683, 758, 829, 853. Other 842 remain probable, not individually certified. |
| Withheld | 676 Carat Idol: portrait card face without visible DotR library NUMBER. Manual-review, no local asset. No missing-source IDs after the 065 override. |
| Conversion | Sharp 0.35.5 via Bun; WebP quality 93, effort 6, smartSubsample, picture preset; inside 640x640 without enlargement, metadata stripped. Full screenshot retained; grid crops display only. |
| Asset size | 853 files, 36,909,794 bytes (35.20 MiB); average 43,271 bytes. Largest: 060 (56,530), 273 (56,370), 183 (55,394 bytes). Ordinary Git; no LFS/R2. |
| Manifest | Canonical ID/filename/source/sourceKind/status/width/height/SHA-256. Separate discovery/acquisition/override/review inputs preserve original hashes and source-page associations. |

See [pipeline/review instructions](card-images.md), [full discovery audit](image-discovery-report.md)
and [source/rights record](data-sources.md). The gallery audit remains distinct
from the later override. Acquisition is sequential, bounded, atomic and resumable.
Browser runtime and normal CI never fetch third-party image datasets.

## Application and boundaries

`/cards/` is a compact full-screen card grid with in-place classification,
ATK/DEF and deck cost on the metadata back. Local lazy images have declared dimensions/fixed viewports;
missing/failed imagery has an ID-labelled placeholder. No search dependency,
virtualization library, decorative game assets or future-tool pages.

Names match case/punctuation-insensitive tokens. Numeric queries match exact ID,
including padded IDs. Kind/type/attribute filters compose. Nonmonster kinds clear
and disable monster-only filters. Counts, clear controls and empty recovery are explicit.

Astro owns the shell and library routes. One Svelte island owns grid/filter and
in-place flip state; pure projection/search stays in `src/lib/dotr/`. Tiles show
full screenshots and canonical metadata. Untranscribed effects and Exodia's
unknown stats remain honest. Image identity confidence/source is recorded in the
canonical manifest and image documentation.

## Completed verification

| Command/check | Result |
| --- | --- |
| `bun ci` | Passed; committed Bun lock, clean install unchanged. |
| `bun run images:discover` | Passed; full mapping audit before bulk acquisition. |
| Pilot `images:acquire --ids=…` | Representative screenshots inspected; 676 withheld. |
| `bun run images:acquire --all` | Passed; sequential full collection, no failures. |
| `bun run images:acquire --ids=0,21,65,171,350,414,671,683,758,829,853` | Passed; alternate 065 acquired, 11 reviews applied, ten cached sources reused. |
| `bun run data:build` | Passed; 854 cards, 853 available images; existing game datasets preserved. |
| `bun run data:check` | Passed; exact canonical byte reproduction. |
| `bun run data:validate` | Passed; existing invariants plus local image files. |
| `bun run images:validate` | Passed; 853 decoded WebPs, hashes/dimensions/manifest agree. |
| Focused M1 tests | Passed; parsing, search/filter behavior and malformed manifest/file rejection. |
| `bun test` | 105 passed, zero failed, seven files; 24 M1 cases added. Existing M0 tests green. |
| `bun run check` | Passed; Astro zero errors/warnings/hints, Svelte zero errors/warnings, TypeScript clean. |
| `bun run build` | Passed, including reproduction/validation/tests/checks; 857 static pages. |
| `git diff --check` | Passed. |
| Fresh Luna review | No material findings; code/provenance/CI image boundary and available screenshots reviewed read-only. |

Image validation rejects wrong/duplicate IDs or filenames, unavailable/orphan
files, absent available files/provenance/digests, unknown fields/source kinds,
invalid dimensions/WebP, modified bytes and decode failures. Generation verifies
discovered source associations and hash-bound identity reviews.

Manual Chrome acceptance passed on development and built static output:
desktop grid, `blue eyes` (000/002), `21`/`021` (Baby Dragon), Magic (118), Trap
(29), Ritual (24), Monster/Dragon/LIGHT (4), kind-switch clearing, empty-result
recovery, 676 placeholder and 021 metadata. Inspected image samples included
000, 021, 065, 350, 414, 683, 829 and 853; full-source pilots also covered 171,
671 and 758. Exodia metadata preserves unknown stats. A 390px viewport rendered
two columns without horizontal overflow; override reset. All grid images were
lazy; only 68/853 were decoded at the inspected desktop state. Screenshots are
ignored under `.impeccable/review/`.

## CI/CD and remaining work

Existing SHA-pinned Actions/Bun setup retained: PR/main verification, reproduction,
local image checks, tests/types/build, then main-only credential-gated deployment.
No image acquisition added to CI. Repository secret inspection returned none;
no Cloudflare deployment attempted. Required secrets remain `CLOUDFLARE_API_TOKEN`
and `CLOUDFLARE_ACCOUNT_ID`. Workers Static Assets config unchanged; domain/R2 deferred.
Commit/push and exact-commit Actions outcome are reported in the delivery message
after publication. Local testing is complete; the user requested no additional testing.

Resolve 676 and independently review the remaining 842 probable captures before
claiming complete image verification. Rights review remains open. Existing M0
metadata/effect/starter/reincarnation uncertainties persist. M2 has not begun;
no Fusion Simulator or backend was built.
