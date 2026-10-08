# Fusion Encyclopedia

The standalone **Recipes** page at `/recipes/` lets players search by a
**result card** (name or original DotR ID) rather than starting from cards
already in their Hand. The default example is #024 Thousand Dragon; selecting
another result does not change any saved card data. A validated
`/recipes/?card=24` deep link may select an indexed target.

## Ordinary pair lookup

`src/lib/dotr/fusion-encyclopedia.ts` calls the existing canonical
`expandFusionRules`, reverses all **26,540 verified-transcription unordered
material pairs**, and groups them by actual result ID. A result shows every
known *direct, ordinary two-card material pair* in the table; no type pattern
or ATK heuristic fills gaps. Material order is symmetric, same-ID materials
require two distinct copies, and all list results are actual original card IDs.

The UI searches target results via the shared name/ID search and displays a
limited suggestion list. Pair rows show the original DotR thumbnail, card
names, IDs, per-card owned counts, and a **Try in Fusion** link that passes
the two original materials to the existing Hand query validator. For potentially
large result lists, only twenty rows are mounted at once; **Show 20 more**
expands incrementally. Optional material searching and owned-status filtering
further narrow the list. The unfiltered view puts ready pairs first whenever
owned data is available.

This enumeration **does not include every possible multi-step chain**
that can eventually produce the result. For chain exploration, users enter
their actual current Hand in Fusion Workspace and use the existing bounded
automatic discovery/Play Advisor. Special deterministic power-up
transformations are shown in a distinct section; unresolved random
outcomes have no invented target recipe and do not appear as deterministic
results.

## Collection comparison and data safety

Collection readiness uses the existing validated
`rose-codex.collection.v1` record. The two materials are checked against
*owned copies*, not just inclusion in a deck preset or selected Hand. A pair
with two identical materials needs at least two copies. Each recipe displays
either sufficient copies, the specific missing copies, or **ownership not
tracked**.

Missing, malformed, or inaccessible Collection storage cannot be treated as
zero ownership. A clear notice is displayed and owned-status filtering is
unavailable until a valid record exists. Players may refresh the record
explicitly after updating Collection in another tab. This route makes **no
localStorage writes** and does not modify `rose-codex.decks.v1`, owned
Collection, Fusion Workspace state, or Simulator practice state.

It reuses local canonical card screenshots and data, with no new backend,
dependencies, analytics, or generated data set.

## Verification

Focused regression tests require exactly 26,540 unique reverse pair records
and check each record against the canonical engine; they cover direct
recipes, same-card material pairs, separate deterministic transformations,
unresolved random exclusions, and accurate per-copy owned readiness.
The standard repository CI checks lint, formatting, types, data and static
build. Desktop/mobile usability still requires player acceptance.
