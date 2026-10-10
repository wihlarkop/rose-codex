# Rose Codex · UX v2 approved direction

Status: **approved design direction**. Implementation ships in incremental, locally accepted PRs. This document distinguishes decisions from features already implemented.

## Product goals

A compact, keyboard-accessible Duelists of the Roses gaming companion that works when docked next to PCSX2. Preserve all original game art, game-data provenance and independent deterministic mechanic engines. Reduce top-level navigation, task switching and duplicated input; do not turn it into a CMS dashboard.

## Decisions already approved

| Surface | UX v2 target |
| --- | --- |
| Identity | Charcoal & Rose; warm-neutral light theme, charcoal dark theme, authentic DotR artwork |
| Theme | Follow OS/browser by default; explicit System / Dark / Light; persist explicit overrides |
| Navigation | Compact top navigation: Home, Cards, Fusion, Decks, Duel, Reference |
| Homepage / | Dedicated Hybrid Gaming Companion homepage, three-card hero composition, prominent search, four task shortcuts, genuine browser-local resume state |
| Cards | Responsive grid; preserve in-place flip. Adaptive Compact Toolbar (full near top; search/filter accessible while scrolling) |
| Fusion | Adaptive Two-Panel Workbench; Find Recipes part of same Fusion navigation and handoff |
| Decks | Build / Practice / Inventory; Generate and Optimize within Build; Collection and Reserve in Inventory |
| Duel | Compact Duel Mode; primary Hand, Field, enemy, SP, terrain and conditional recommendations. Screenshot and coordinates remain discoverable advanced controls. Battle History shares Duel navigation |
| Reference | Reference Hub landing with Opponents, Deck Leaders, Reincarnation and PCSX2 Save Tools |

### Interaction and responsive behavior

- Full desktop prioritizes dual-panel work and visible card artwork. Split-screen PCSX2 uses responsive stacking/compact density; avoid permanent sidebars.
- Navigation uses ordinary links and an active secondary link row. Current routes and query parameters remain functional; no forced redirects while feature merging is underway.
- Search can be invoked globally via Ctrl/Cmd+K and routes to a filtered Card Library; the homepage also provides an immediately visible search field.
- Minimize hover-only functionality, preserve visible focus and meaningful link text, handle Escape for modal dialogs. Design for keyboard and mouse; touch remains usable.
- Animations should be ~120–180 ms or disabled for prefers-reduced-motion. No autoplay or parallax.
- Avoid claims of observed duel legality, win rate, screenshot recognition confidence, inventory decoded from saves, or auto AI behavior.

## Integration boundaries

- Canonical DotR card ID remains identity; preserve game art and image provenance.
- Reuse existing pure fusion, deck, duel and validation functions. Component merging MUST NOT create a monolithic Svelte component.
- Preserve localStorage envelope keys, schemas, storage guards, backups, and explicit confirm flows. Never silently overwrite/deplete collection or saved deck for a proposal or practice session.
- A generated/optimized deck is a proposal until explicitly committed as a new deck.
- Practice draw does not mutate persisted decks. Fusion from practice or recipes stays a validated link/handoff until an integrated state model is safely tested.
- A screenshot remains in the browser and a visual candidate is never committed to battle state until the player confirms it.
- No backend, login, analytics, model inference, third-party card fetch, or PCSX2 save writing is introduced by UX work.

## Roadmap

1. **UX-01 Foundation** — dedicated homepage, top-level + contextual navigation, Reference Hub, browser/system theme, global search, initial design-system tokens. Legacy feature routes remain separate. **This PR's scope.**
2. **UX-02 Cards** — adaptive compact toolbar, grid density, flip card and focus regression, ownership indicator only if genuine collection data can be safely read. **Stacked PR scope following UX-01; no merge until local acceptance.**
3. **UX-03 Fusion** — two-panel Workbench and Find Recipes connected as one coherent task flow; preserve recipe search, chains, repeated occurrences, warnings and Undo.
4. **UX-04 Decks** — Build/Practice/Inventory integrated views; Generate/Optimize as explicit proposal within Build. Preserve stale-data protections and backups, copy limits, strict cost notices and existing URLs.
5. **UX-05 Duel** — compact battle-state editor and unified evidence-labeled next-move list, optional screenshot/advanced coordinates, separate History view.
6. **UX-06 Reference** — improve contextual links/opponent-to-leader/coach handoffs and polish all Reference tools, no unrelated mechanic research.
7. **UX-07 Integration/QA** — navigation/back-forward/deep links, browser storage regression, keyboard/mouse/touch, themes, split-screen, performance.

Changes ship in bounded PRs; tests and local acceptance before merge. UX-01 must not prematurely remove old routes or alter localStorage.

## UX-01 acceptance

1. Open /: homepage is distinct from /cards/. Verify authentic card art (#000, #007, #060), working links and card search that opens /cards/?q=... with the filter applied.
2. Verify six top-level categories and context-specific subnavigation; follow old /recipes, /coach, /simulate, /collection, /lab, /opponents, /leaders, /reincarnation, /saves routes unchanged.
3. Verify /reference/ hub and all four tool links.
4. On system dark/light settings, System mode follows OS appearance. Explicit Dark/Light works and persists over reload. Reset to System follows live OS changes. No dependence on storage availability.
5. Ctrl/Cmd+K from multiple routes opens global card search. Enter routes to filtered Card Library; Escape closes dialog. Keyboard focus remains visible.
6. Check homepage fresh-browser state vs valid saved decks vs malformed storage (never overwrite). No false "recent activity" shown.
7. Test desktop, roughly half-width PCSX2 browser, and narrow viewport; top nav remains navigable by horizontal scroll if needed, without creating a vertical sidebar.
8. Run lint, formatting, Bun tests, Astro/Svelte/TypeScript check, canonical data and production static build.

## Not yet in UX-01

Adaptive Cards toolbar, merging Deck Builder/Coach/Inventory into a single Svelte island, Fusion two-mode state handoff, compact tactical layout and migration to unified Duel input are all **later phases**, not already implemented just because category links exist.


## UX-02 Cards acceptance · stacked after UX-01

1. Open \`/cards/\` near the top: search, Kind, Monster Type, Attribute and Reset are all visible, accessible and preserve existing semantics.
2. Scroll down several rows: toolbar sticks at viewport top, collapses to a compact Search + Filters trigger, and frees vertical space. Test desktop and a ~550px split-screen browser; no cards or keyboard focus should be hidden.
3. In compact mode, open Filters, change a filter, check filtered result count and badge count, then close via button, Escape and outside click. Active filter values must survive collapse/expand, including scroll back up.
4. Global search and homepage search must still open \`/cards/?q=\` with correct name/ID filtering. Quick Lookup continues to locate and flip its card. Normal in-grid flip state, keyboard Enter/Space and the 854-card data set stay intact.
5. With **valid, explicitly saved Collection** data, positive owned-copy counts display on card fronts; zero recorded copies do not get a positive badge. With **no Collection** or **invalid storage**, badges are omitted without changing or repairing data. When another tab changes the Collection, the displayed copies refresh via storage event.
6. Check first render (no unexpected sticky popup), scroll up/down, no IntersectionObserver support fallback, keyboard focus, reduced-motion setting, system light/dark theme and mobile width.
7. Run repository CI: lint, scoped format, canonical data checks, Bun tests, Svelte/TS checks and production static build.

UX-02 only changes Card Library presentation and its read-only Collection display. It does not implement Deck Workshop's Inventory merger or alter saved-card data.
