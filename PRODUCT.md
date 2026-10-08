# Rose Codex

## Platform and purpose

A static companion for desktop/laptop players of Yu-Gi-Oh! The Duelists of the
Roses who want to recognize cards visually without memorizing names. The library
supports local name/ID search, kind/type/attribute filters, authentic game imagery,
static card details and keyboard-friendly visual quick lookup.

## Constraints

Astro, strict TypeScript, Svelte islands, Bun, Tailwind with selective local
shadcn-svelte primitives, and canonical static data. DotR ID is identity. No
backend, database, SSR, authentication, PWA, service worker, analytics, global
state library or third-party browser data fetch. Images must be DotR-specific;
prefer an honest missing image to incorrect art. Rights uncertainty remains
explicit. Cloudflare deployment, the custom domain and R2 remain deferred.

## Presentation

Dark, compact, subtle and desktop-oriented. Default tiles preserve the game
screen, with an optional artwork view for scanning. Detail pages retain the
full screenshot. Card imagery and readable names dominate the visual hierarchy.

## Future Fusion Workspace

The reusable picker returns canonical IDs without owning navigation or game
state. A future workspace will allow unlimited, individually removable card
instances, including duplicates. Each unique instance ID references a canonical
card ID and belongs to Hand or Summoning Area, with movement between zones.
Results and intermediate fusion steps should show images and the actual sequence.
Summoning Area semantics require game research before implementation. No fixed
five/six-card input limit, zone state or solver changes are implemented now.

## Evidence and open questions

Canonical data covers 854 numbered records, IDs 000..853. Metadata is mostly
single-source; effects remain untranscribed. 853 local DotR images exist, with
#676 withheld for identity review; most image mappings remain probable rather
than individually verified. Screenshot redistribution rights remain unresolved.
