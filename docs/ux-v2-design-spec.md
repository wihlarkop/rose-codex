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
3. **UX-03 Fusion** — two-panel Workbench and Find Recipes connected as one coherent task flow; preserve recipe search, chains, repeated occurrences, warnings and Undo. **Dedicated PR, acceptance required before merge.**
4. **UX-04 Decks** — Build/Practice/Inventory integrated views; Generate/Optimize as explicit proposal within Build. Preserve stale-data protections and backups, copy limits, strict cost notices and existing URLs. **PR scope: unified /decks/ experience with modular existing feature islands; old feature URLs remain valid.**
5. **UX-05 Duel** — compact battle-state editor and unified evidence-labeled next-move list, optional screenshot/advanced coordinates, separate History view. **UX-05 PR: integrated Plan/History modes, compact decision-first presentation, and read-only battle constraints preserved.**
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

## UX-03 Fusion acceptance

1. Open `/fusion/`: **Workbench** and **Find Recipes** modes are available within one Fusion workspace; the left panel has a unified card picker with Hand/Field destination; the right panel shows live results.
2. Enter repeated card instances into Hand and Field; check direct and chain results, suggested plays, partial result warnings, apply fusion and Undo. Search/filter and CardPicker must preserve existing semantics.
3. Switch to **Find Recipes** while Hand/Field is populated; inspect a result and switch back to Workbench. The existing planner state and undo context must survive non-destructive mode switches.
4. Click **Try in Workbench** from a recipe. With an empty planner, its exact material instances populate the Hand. With existing planner cards, accept or reject the explicit replacement confirmation; cancellation preserves input. This does not write saved deck or Collection data. The confirmation is a Rose Codex themed modal (not a native `window.confirm`), previewing current input counts and selected recipe cards. Cancel and Escape preserve all planner input and undo context; focus starts on Cancel and background content is inert while open.
5. Switch back to Find Recipes: the in-workspace recipe selection should remain visible after its first opening. Compare ownership/missing materials against genuine Collection data and check both ordinary and special handoffs.
6. Verify the legacy `/recipes/?card=024` page and its **Try in Fusion** links still work. Verify `/fusion/?hand=...`, simulator handoff, optional `/fusion/?mode=recipes&card=024` and normal Back/Forward navigation of URLs.
7. Try desktop, ~550px PCSX2 split view and narrow mobile; all results/controls remain usable with keyboard, screen readers and dark/light/system appearance. No permanent sidebar.
8. CI: lint, format check, canonical data validation, Bun tests (including handoff duplicate/invalid scenarios), Svelte/TypeScript checks and production build.

UX-03 scopes the Fusion UI and navigation only. It does not reinterpret fusion rules, persist planner state across page reloads, change card inventory, or implement Deck Workshop/Duel merging.


## UX-04 Deck Workshop acceptance

1. Visit `/decks/`. Confirm **Build**, **Practice**, **Inventory** buttons within one Deck Workshop and **Generate Deck** as an action in Build. The legacy `/coach/`, `/simulate/`, and `/collection/` routes must remain independent and usable.
2. **Build**: create/select/rename/edit a deck, inspect and flip cards, check readiness/copy count/cost, and confirm it saves only through the existing Deck Builder flows.
3. **Generate Deck**: select opponent/style, generate/optimize, then select **Review in Build**. The proposal must be validated by the existing Smart Deck link parser before display, and **no new saved deck** appears until the player explicitly clicks **Add as a new deck**. Confirm Dismiss is non-destructive. Legacy `/coach/?opponent=weevil` and its link to `/decks/?suggest=...` must remain supported.
4. **Practice**: `/decks/?mode=practice` loads the existing five-card draw and Fusion Advisor against a saved 40-card deck. Sending a hand to Fusion still works. A practice draw does not write to saved decks or Collection; when switching to other modes and back, the mounted practice session remains until ended or shuffled again.
5. **Inventory**: `/decks/?mode=inventory` loads Collection and Reserve. Positive ownership counts, transfers, exports, and the cross-tab stale-write protection must remain unchanged. Returning to Build remounts its editor from stored data rather than keeping a competing stale instance alive. Existing Collection's bootstrap estimation disclosure must not be presented as verified physical ownership.
6. Check Back/Forward between modes with `?mode=` and deep links with a `?deck=` selection. URLs from /simulate and /collection must continue to resolve. Refresh after changing modes must open the right mode.
7. Verify missing/corrupt local storage, disabled storage, saved deck conflict behavior, keyboard focus, screen-reader labels, dark/light/system themes, and ~550px PCSX2 split-screen.
8. Run lint, formatting, Bun tests (including mode/URL parser), Svelte/TypeScript checks, canonical data check, and production static build. Local visual acceptance is required before merge.

**Safety:** switching into Inventory unmounts the Build editor to avoid concurrent stale deck writes. Practice is mounted only when first visited and keeps its read-only session when hidden. This UX phase does not rewrite the deck/collection schemas or attempt a global reactive store.


## UX-05 Duel Companion acceptance

1. Open /duel/ and confirm one compact **Duel Companion** with **Plan Duel** and **Battle History** modes. Primary view shows Hand/Field/enemy/terrain on the left and **Next Moves** with Summoning Points and played-card context on the right on desktop. Narrow/split-screen stacks.
2. Enter and remove repeated Hand and Field occurrences. Select enemy, attack/defense state and terrain; tactical results update. Validate original Hand limit (5), Field planning limit (8), explicit Clear all and independent Reset battle inputs.
3. Check that rankings retain **Conditional · verify in-game**, **Unknown · more evidence needed**, and collapsible **Blocked** outcomes. Show all considerations, detailed tactical comparisons and full engine limitations remain accessible without false legality/win claims.
4. Expand **Advanced · 7×7 coordinates**, enter leader/enemy/field positions, collapse/re-expand and confirm input is preserved. SP/played-card input remains visible. Optional Screenshot Assistant is a disclosure below the primary two-panel layout; confirm candidates manually and verify screenshots remain local and are not stored.
5. Enter a Plan Duel state, navigate to **Battle History** then back; Plan inputs and ranking state remain unchanged. Record a real battle in History, export, then request removal. Check themed Cancel, Escape and Confirm; no changes on Cancel/Escape. Observed win rates are not predicted wins.
6. Verify /duel/?mode=history on refresh, Back/Forward switches, /duel/?opponent=weevil, hand links from Practice, and legacy independent /lab/ page (including existing storage data). No storage key/schema migration, deck or Collection mutation, inference API or PCSX2 writes.
7. Check System/Dark/Light, focus/keyboard/touch, desktop and ~550px PCSX2 split view; actions and evidence labels remain readable.
8. CI: lint, strict formatting, canonical data checks, Bun tests, Astro/Svelte/TypeScript check and production build. Local visual acceptance before merge.

Only Duel UI, Battle History presentation, navigation tests and UX specification change in this phase. No deterministic battle-state logic is modified.


## UX-06 Reference and global card search acceptance

1. Open the global Ctrl/Cmd+K search from Home, Cards, Duel and Reference. Typing a partial name such as "blue eye" lists at most six canonical card matches with existing artwork, title, kind and ID; an image without an available asset uses the project's fallback.
2. ArrowUp/ArrowDown change the active suggestion and Enter opens the exact ID-filtered Card Library. Pointer selection behaves the same way; Escape closes the native dialog. "View all results" preserves the typed phrase with URL-safe encoding, including cases where no card matches.
3. On the Weevil opponent deep link, follow contextual links to the selected Deck Leader, the Deck Coach, Duel Companion and notable cards in Card Library. Opponent selection must pass canonical IDs/known slugs rather than display names.
4. Confirm all existing Reference routes remain available through the Reference navigation: Opponents, Deck Leaders, Reincarnation and read-only PCSX2 Save Tools. Do not change game facts, storage schema, save inspection, tactical mechanics or original handoff URLs.
5. Check keyboard focus, screen readers, dark/light/system appearance, and about 550px PCSX2 split-screen; run full CI and obtain local visual acceptance before merging.

The global search reuses the canonical browser-card projection, existing filtering and CardPicker option presentation. UX-06 adds navigation/presentation only; neither global persistent state nor AI recognition is introduced.


## UX-07 Integration & QA acceptance

1. Navigation and legacy routes remain functional. Fusion Workbench/Recipes, Deck Workshop Build/Practice/Inventory and Duel Plan/History honor the URL and Back/Forward within each workspace.
2. Fusion mode changes preserve live Hand, Field, Undo and confirmed recipe handoffs; invalid links remain non-destructive. Scrolling to a suggested result respects reduced-motion preferences.
3. Battle History retains its existing local schema, but refuses a stale save/remove from another tab instead of silently overwriting fresh results. Corrupt/blocked storage stays protected.
4. Global search, dialogs, filters and primary actions remain keyboard-accessible with visible focus, Escape cancellation and responsive pointer/touch targets.
5. System/Light/Dark appearance and desktop, PCSX2 split-screen (~550px) and narrow mobile layouts must be visually accepted. Record actual measurements before making performance claims.
6. Keep the complete browser smoke matrix and outcome notes in [UX-07 integration QA](ux07-integration-qa.md). Full repository CI and local user acceptance are required before merge.

No new game mechanics, storage schema, backend or AI model are introduced by this phase.
