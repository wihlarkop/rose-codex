# DotR image dataset

M1 uses local optimized **English DotR library screenshots**, discovered through
[Yugipedia's explicitly numbered gallery](https://yugipedia.com/wiki/Gallery_of_Yu-Gi-Oh!_The_Duelists_of_the_Roses_cards).
No generic TCG/ YGOPRODeck fallback is used. Card identity is always the integer
DotR ID; production paths are `/cards/000.webp` through `/cards/853.webp`.

## Discovery and coverage

The full discovery audit precedes bulk acquisition. See
[image-discovery-report.md](image-discovery-report.md) and the per-ID
`data/manifests/image-discovery.json`. Gallery revision 5222290 has 854 unique
numbered entries (000..853), 854 unique DOR-EN-VG filenames and no numbering gaps.
Original URLs and dimensions come from MediaWiki imageinfo, never filename
guessing or gallery position. Two name differences are capitalization only
(155 and 612); 414's Greek alpha matches the UTF-8 canonical name.

The gallery API resolves 853 original files. Its **065 Necrolancer the Timelord**
EN file is absent. The [explicitly numbered card page](https://yugipedia.com/wiki/Necrolancer_the_Timelord_(DOR))
provides a different DOR-NA-VG screenshot whose visible NUMBER 065 and title were
reviewed. `image-overrides.json` records that source-page association, original
URL and dimensions; it does not alter the gallery audit. **676 Carat Idol**
resolves to a portrait card face with no visible
DotR number/library screen; it remains manual-review and is not shipped.
Every other acquired file must decode and match discovered dimensions.
The final acquisition counts, missing/review IDs and measured asset sizes are in
`data/manifests/image-acquisition-report.json` and the M1 delivery report.
Do not equate gallery coverage with downloaded, visually verified or licensed
coverage.

Final coverage: **854 mapped source candidates, 854 originals downloaded,
853 local WebPs**, 11 hash-bound visually verified identities, 842 probable,
one manual-review ID (676), no missing-source IDs after the reviewed override.
The optimized assets total **36,909,794 bytes (35.20 MiB)**, averaging 43,271 bytes;
the largest is 56,530 bytes. This is small enough for ordinary Git; no LFS/R2.

## Rights and repository decision

Public accessibility and technical downloadability do **not** establish
redistribution permission. The inspected asset metadata exposes no explicit
game-screenshot license/usage terms. Yugipedia's wiki CC BY-SA footer does not
supply a blanket license for Konami artwork/screenshots. No redistribution grant
or fair-use conclusion is claimed.

M1's practical repository strategy keeps original captures ignored and commits
only reduced WebP game screenshots plus source/mapping/hash records. This does
not resolve rights uncertainty. Game imagery remains third-party material; do
not describe it as first-party or CC-licensed. An uploader/rights-holder inquiry
and asset-specific rights review remain open before claiming reuse permission.
The source collection is community-maintained and may contain mistakes.

## Pipeline and reruns

Use Bun 1.4.2; Sharp 0.35.5 is an exact development dependency, including its
locked native converter. Neither Astro nor Bun supplies a general raster decoder/
WebP conversion API. No external global converter or alternate JS runtime is
required.

```sh
bun run images:discover
bun run images:acquire --ids=0,21,683,829,853
bun run images:acquire --all
bun run data:build
bun run images:validate
bun run data:validate
bun run data:check
```

Discovery reads public API wikitext, parses filename/explicit number/display name
within each gallery row and rejects ambiguous rows, duplicate/out-of-range IDs
or non-English-DotR suffixes. Batches of at most 50 file titles resolve original
URLs, dimensions and exposed rights metadata. The live capture is ignored;
its revision/digest and normalized associations are committed. An optional
numeric revision argument asserts the current revision; the historical oldid
route returned HTTP 403 in this environment, so the script never silently
substitutes a newer revision. Acquisition is pinned to committed mappings and
source digests, independent of future gallery changes.

Acquisition is sequential, delays at least 400ms between requests, uses an
identified User-Agent, 30-second timeouts and bounded retry/backoff for transient
failures. Access denial remains a failure. Successful originals are decoded and
checked against discovered format/dimensions before atomic writes into ignored
`data/raw/images/`. State and generated manifest checkpoints make reruns
resumable; validated cached bytes avoid repeat downloads. Changed recorded source
bytes or output digests fail explicitly. A per-image failure is reported without
discarding successful outputs. Do not run two acquisition processes concurrently.

Full screens are converted with quality **93**, effort **6**, smart chroma
subsampling and the picture preset, sRGB/default metadata stripping, inside a
640x640 bound without enlargement. The accepted library sources are already
roughly 575x463, so no resizing/cropping/upscaling is needed. One full WebP serves
both the artwork-focused CSS grid crop and complete detail screen. The shared
artwork rectangle was checked across monster, Magic, Power Up, Trap, Ritual and
special library samples. #065's smaller 273x302 NA library screen uses a separately
reviewed crop with side space to preserve its taller artwork. #676's unidentified
portrait presentation is withheld. Source softness
cannot be recovered by increasing dimensions.

Conversion uses fixed settings/native versions; local repeated output hashes
are checked on resume. Cross-platform *reconversion* byte identity is not
claimed. Ordinary CI validates committed WebP bytes without fetching originals
or reconverting them.

## Manifest and review

Canonical `ImageRecord` fields are `cardId`, `file`, `source`, `sourceKind`,
`status`, `width`, `height`, `sha256`. Only `dotr-game-render` is supported
in M1. Missing or manual-review records retain their reserved filename and any
candidate source, but dimensions/digest are null and the app shows a placeholder.

- `probable`: local decoded image mapped by explicit gallery ID and matching
  label; individual screenshot content is not manually certified.
- `verified`: name and visible game NUMBER were visually checked; the review in
  `image-reviews.json` binds that decision to original SHA-256 bytes.
- `missing`: no accepted local asset.
- `manual-review`: candidate identity/presentation uncertain; not displayed.

Verified never means legally redistributable. Review an original/full screenshot,
not just a cropped grid tile. Record ID, exact source digest and the observed
name/NUMBER in `data/manifests/image-reviews.json`; rerun acquisition for those
IDs, then data:build/validation. Source digests are retained in
`image-assets.json`; the app consumes only generated canonical data.

For a gallery omission/variant, inspect the actual DotR card page and its explicit
number/image association, resolve that file through public imageinfo, then add a
small documented override and hash-bound visual review. Do not infer a filename
from a card slug. Overrides are validated against the canonical ID/name and
source host; unreviewed overrides cannot become available assets.

Validation requires ordered unique IDs, deterministic filenames, HTTPS
provenance/source kind, meaningful dimensions and digests. It rejects missing
available files, extra/orphan files, wrong format/dimensions, changed bytes and
undecodable images. Canonical reproduction checks acquired mapping inputs and
hash-bound verified reviews. Missing records require no asset. Normal CI/build
never crawl the gallery or re-download images.
