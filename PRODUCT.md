# Rose Codex

## Platform

Static web application for a normal desktop/laptop browser.

## Users and purpose

Players of Yu-Gi-Oh! The Duelists of the Roses on PC who want to recognize cards
visually while playing, without memorizing their names. M1 supplies a searchable
visual library; fusion simulation remains future work.

## Constraints

Astro, strict TypeScript, Svelte islands, Bun, plain CSS and canonical static data.
DotR ID is identity. No backend, runtime database, SSR, authentication, PWA,
service worker, analytics, UI/state/search framework or third-party browser fetch.
Images must be DotR-specific; prefer an honest missing image to incorrect art.
Rights uncertainty must remain explicit. The custom domain and R2 are deferred.

## M1 presentation

User-selected artwork-focused card grid, with full game screenshots on static
card detail pages. Dark, compact, restrained; desktop scanning is primary.
Basic name/ID search and kind/type/attribute filters. Card imagery dominates.

## Evidence and open questions

M0 canonical data covers numbered library IDs 000..853. Metadata is mostly
single-source; effects are intentionally untranscribed. Full image mapping,
source availability and rights must be audited rather than presumed.
