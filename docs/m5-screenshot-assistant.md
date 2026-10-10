# M5-09 · Browser-only Screenshot Candidate Matcher

## Scope

This is a deliberately **experimental** and privacy-preserving
screenshot-assist workflow, not image recognition with a measured
accuracy rate. In /duel/, expand Screenshot Assistant:

1. Upload an observed PCSX2 PNG, JPEG or WebP screenshot.
2. Drag across one visible card to crop. Keyboard users can
   directly edit Left, Top, Width, Height percentages. Minimum
   crop is 2% wide and high, within the screenshot.
3. Optionally enter a card name or numeric ID to restrict
   reference comparisons; blank searches all 853 available
   canonical game-render images. If full library is scanned,
   approximately 35 MiB of static card images can be requested.
4. Review the ranked candidate cards visually.
5. **Confirm** the correct candidate into your existing
   Hand, Field or the face-up enemy Monster slot. Confirmation
   is a required, explicit action. The manual Tactical Duel
   Coach keeps its prior rules, limits and uncertainty states.

Only same-origin static assets (/cards/###.webp) are fetched
for reference comparison. The screenshot is not uploaded to a
server, persisted in localStorage or transmitted to a model
provider. Its Object URL and ImageBitmap are disposed on clear,
replacement or component unmount. Reference image Bitmaps are
closed after descriptor extraction; multiple fetches are
bounded and cancelable.

## Algorithm and limitations

src/lib/dotr/screenshot-match.ts exposes pure/tested:
- describePixels: 8×6 brightness-normalized luminance and 4×3
  coarse RGB block averages from a 16×12 canvas thumbnail.
- similarityScore: bounded 0–100 relative similarity, combining
  coarse shape and color differences, **not** calibrated confidence.
- bestVisualCandidates: deterministic top-N ranking, strict
  canonical ID and candidate-count bounds.

The same thumbnail processing is applied to the selected local
screenshot crop and the publicly served DotR game artwork.
No OCR, rotation/perspective correction, segmentation,
frame-by-frame tracking, localization of multiple cards,
or board reconstruction is attempted. Candidate quality
depends heavily on crop scale, framing, animation and lighting.
The game-render reference art may not resemble in-battle 3D
models, face-down cards, tiny icons, UI overlays or partial cards.
The best-ranked result may still be wrong; there is **no**
automatic commitment to tactical state.

This prototype requires real player-supplied PCSX2 screenshots
and manually labeled crop/card-ID pairs before precision@K,
top-1 accuracy and false-positive rates can be estimated.
Avoid adding model-hosting, API keys, telemetry or network
inference during this milestone.

## Acceptance

1. Checkout PR branch and run bun run dev. Open /duel/.
2. Expand Screenshot Assistant, load a PNG game screenshot,
   drag a tight rectangular crop around ONE card. Verify the
   preview, crop fields, and absence of auto-selected cards.
3. Search all available art or narrow to a known name/ID.
   Verify top candidates include actual artwork and the
   relative score is clearly not called confidence.
4. Manually confirm a Monster as visible enemy; it should
   replace the current enemy ID and set Attack as the initial
   observed position. Confirm another card into Hand or Field.
   All existing Duel Coach limits still apply.
5. Use Cancel during a full-library scan, Clear image, and
   another screenshot. Verify no stale results cross sessions.
6. Test keyboard-only crop fields and narrow screens.
7. Try a face-down/poorly framed screenshot: incorrect
   candidates must not be automatically accepted.
8. Run CI (lint, format, canonical data, Bun tests,
   TypeScript/Svelte, production build).

No requirement to provide a benchmark acceptance threshold
can be claimed until labeled real screenshot examples exist.

## M5-10 remains deferred

The previously agreed LLM conversation layer remains deferred.
Nothing in screenshot comparison reads user credentials or
calls a hosted LLM. A whole-app simplification/UI/UX revamp
is planned after the accepted deterministic M5 work.
