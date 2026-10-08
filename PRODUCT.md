# Rose Codex

## Platform and purpose

A static companion for desktop/laptop players of Yu-Gi-Oh! The Duelists of the
Roses who want to recognize cards visually without memorizing names. The library
supports local name/ID search, kind/type/attribute filters, authentic game imagery,
static card details and keyboard-friendly visual quick lookup. Fusion planning
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
screen, with an optional artwork view for scanning. Detail pages retain the
full screenshot. Card imagery and readable names dominate the visual hierarchy.

## Fusion Workspace

The reusable picker returns canonical IDs without owning navigation or game
state. The workspace allows unlimited, individually removable card
occurrences, including duplicates. Each unique instance ID references a canonical
card ID and belongs to Hand or Summoning Area, with movement between zones.
Results and intermediate fusion steps show images and the actual sequence.
Hand and Summoning Area are organizational planning labels, with no claim about
game capacity. Previews use the existing ordinary-fusion engine, stop at the
first failed pair, and never consume materials. Failed-fusion discards, equips,
rituals, and random transformations are outside this workspace.

## Deck Builder

Multiple named decks support individual copies, duplication/deletion, count,
composition, and known-cost totals with unknown costs reported separately.
Names and canonical card IDs persist in versioned browser storage and portable
JSON. Invalid imports leave the workspace intact; corrupt saved records remain
untouched until explicit valid replacement. Storage errors allow in-tab editing
and JSON export. The 40-card and three-copy guidance does not confirm legality:
leader selection/rank and opponent cost are not modeled.

## Evidence and open questions

Canonical data covers 854 numbered records, IDs 000..853. Metadata is mostly
single-source; effects remain untranscribed. 853 local DotR images exist, with
#676 withheld for identity review; most image mappings remain probable rather
than individually verified. Screenshot redistribution rights remain unresolved.
