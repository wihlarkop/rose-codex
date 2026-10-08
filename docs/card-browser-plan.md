# Card Library implementation plan

Historical data/image implementation plan. Current presentation uses full-screen
tiles that flip in place; see [interface guidance](../DESIGN.md).

Goal: a player can recognize and find DotR cards visually while playing on PC.
The user's M1 request and artwork-focused grid answer are the design brief.
Root implements/integrates and owns Git writes; research agents are read-only.

## Design

Retain M0's static architecture. Discover explicit numbered gallery associations
before acquisition; record source URLs, source kind, name discrepancies and
review confidence. Never join on gallery position or guessed names. Keep raw
captures/originals ignored. Download politely and resume from validated cache.
Normalize full screenshots into ID-named WebP assets; crop only their display in
the grid after checking varied source layouts. Pin Sharp as a development
dependency because Bun/Astro has no built-in deterministic raster conversion.
Keep rights unresolved where evidence does not establish a redistribution grant.

Canonical images gain source-kind, dimensions and content digest, with explicit
missing/probable/verified/manual-review status. Reviewed acquisition manifests
become deterministic generator inputs; regeneration never re-downloads images.
CI validates committed outputs, never crawls the gallery or downloads its images.

Astro owns the shell and library routes. One Svelte island owns local
search/filter state and the image grid with in-place metadata. A pure browser projection/filter
module consumes canonical cards/images; it excludes effects/equip arrays and
does not depend on a UI framework. Numeric queries match ID; name tokens ignore
case/punctuation. Kind, type and attribute filters compose; native controls,
keyboard focus, result counts and empty/missing states remain explicit.

## Work and evidence

- [x] Discovery: inspect full gallery; build parser tests for explicit IDs,
  duplicates, unexpected numbering, source variants and name discrepancies;
  produce the complete mapping report before downloading the collection.
- [x] Assets: pilot representative monster/Magic/Trap/Ritual screenshots,
  inspect conversion/crop quality; acquire sequentially with retries/checkpoints;
  record hashes/dimensions, uncertain identities, failures and actual total size.
- [x] Validation: test manifest/file disagreement, absent provenance, invalid
  WebP/dimensions/digest and extra assets. Extend canonical generation/validation
  without changing card/fusion/naming behavior. CI uses committed artifacts.
- [x] Browser: test pure search/filter behavior, implement shell/grid/metadata,
  lazy local images and deterministic placeholders; no fusion/tool placeholders.
- [x] Acceptance: inspect desktop and smaller viewport, separated IDs and all
  kinds, name/ID search, filters, empty/missing state and card metadata.
  Run bun ci, data:validate, bun test, check, build, image checks and whitespace.
- [x] Delivery preparation: fresh scoped review, update source/image/README/report
  docs. Root stages an explicit manifest, commits once and pushes normally to main;
  commit/push/Actions outcome is recorded in the final delivery message.
  No Cloudflare/domain changes.

## Review focus

Gallery omissions/duplicate IDs must not silently shift identities. A valid URL
does not imply art permission or in-image identity review. Unexpected screenshot
layout must not produce a misleading crop. Missing imagery must remain a useful
card tile. Committed image changes must fail verification if their hash or
manifest disagree. Search must find Blue-Eyes from `blue eyes` and Baby Dragon
from both `21` and `021`. All checks preserve the existing M0 invariants.
