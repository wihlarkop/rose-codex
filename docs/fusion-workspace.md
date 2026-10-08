# Automatic Fusion Workspace

Enter available cards on `/fusion/`; ordinary results, complete ordered recipes,
and per-occurrence compatibility update automatically on add, copy, removal,
zone movement, or clear. There is no manual pair selection, chain button, or
sequence editor. State is local to the island and is not persisted. Unlimited
planning inputs are not a simulation of the game's five-card hand or board.

## Discovery contract

`src/lib/dotr/fusion-discovery.ts` is pure TypeScript above the unchanged canonical
`createFusionEngine`. Its factory constructs the expanded ordinary lookup once.
Each call validates unique occurrence IDs and known card IDs, enumerates all
distinct two-occurrence seeds, then explores successful sequential extensions
breadth first. Every successful prefix is a result: recipes may use a subset.
Each extension combines the previous monster with one unused original Hand
occurrence. Arbitrary binary fusion trees and failed-pair replacement are absent.

Symmetric starting pairs are deduplicated; later material orderings and different
copies remain distinct. Two copies can supply a same-ID pair; a single occurrence
cannot supply both materials. Every step retains the previous result's source
occurrence IDs, the newly added occurrence ID, and all contributing IDs. Next
material candidates are memoized by intermediate card ID within a search;
unsuccessful extensions are pruned. Prefixes are kept distinct to retain all
alternative recipes and their participation information.

Results group by final canonical card. Breadth-first enumeration places a recipe
with the fewest materials first. Alternatives are expanded on demand in batches
of ten; collapsed alternatives create no recipe DOM. Canonical `CardArtwork` and
`CardFlipTile` show real DotR images, IDs, names, and known ATK/DEF. Sorting by ATK,
materials, name or ID and result filtering operate only on presentation.

## Compatibility

Compatibility is calculated from all discovered ordinary recipes before any
result sorting/filtering, independently for each occurrence:

| Status | Meaning |
| --- | --- |
| Direct fusion available | Participates in a discovered ordinary two-card recipe. |
| Available in fusion chain | No found direct pair, but participates in a successful multi-step ordinary recipe. |
| No ordinary fusion with current cards | No participation after a complete supported search. Only applies to this input set, not all DotR recipes or other card utilities. |
| Not fully evaluated | No proven ordinary participation and the computation or applicable mechanics are incomplete. |
| Special combination available | Separate additional indicator for an exact original-input pair with a deterministic canonical power-up transformation. |

Direct status takes precedence over chain status; confirmed positive participation
remains positive during a partial search. Every indicator has an icon and readable
text. Unproven occurrences are never disabled or removed. Definitive negative
counts appear only for complete searches; partial summaries use "at least" and
report undetermined occurrences instead.

The canonical eight deterministic transformation pairs are evaluated separately,
including #007 + #799 → #501. They do not become ordinary recipes or feed ordinary
chains. The five Insect Imitation pairs produce a visible unresolved-random notice,
no invented result, and no definitive negatives. General equipment compatibility,
stat bonuses, rituals, and unknown transformations are not inferred.

## Game evidence and field planning

The [US PS2 instruction manual, Combos, printed p. 34](https://www.videogamemanual.com/PS2/Yu-Gi-Oh%21%20The%20Duelists%20of%20the%20Roses%20%28USA%29.pdf)
describes ordered hand tagging and sequential fusion using each resulting monster,
a field monster in the Summon Square combining with an arriving Hand card, and
field-to-field fusion through movement onto another friendly monster's square.
It also distinguishes ordinary Fusion from Power-up. The canonical table's
provenance and special transformation evidence remain in
[fusion-research.md](fusion-research.md).

Supported planning searches include Hand-only chains, field-first chains followed
by Hand occurrences, and direct field-to-field pairs. Field-first chaining is a
planning fold of these documented operations, not a verified single-turn action.
Summoning Area holds candidate field occurrences: it does not assert that several
monsters occupy one Summon Square. Every field recipe states its required starting
position or legal movement and that board legality is not evaluated.

The manual alone does not establish hand-chain-to-field timing or arbitrary
sequences involving several field cards. With a field card and three or more total
inputs, discovery conservatively reports incomplete mechanics and leaves unproven
occurrences undetermined. It does not silently permute field cards into Hand
chains. Movement, board occupancy, capacity, actual material consumption,
failed-fusion discards, equipped state, rituals, and random outcomes are outside
this workspace. Original-console/emulator behavior has not been tested here.

## Computation and responsiveness

The default budget is 25,000 checks shared by direct seeds, next-material scans,
and extension visits. Exhaustion returns discovered results with `budget` in
`limits`; it never asserts full coverage or assigns negative compatibility.
Iterative breadth-first expansion avoids recursive stack growth. Recipe creation
and candidate scanning are bounded by the budget; there is no backend or added
dependency. Five-card Hand searches are exhaustive within this budget (even all
possible successful five-card orderings fit comfortably). Large collections can
be partial. Reducing inputs allows a complete applicable search.

## Acceptance evidence

Focused canonical algorithm tests cover direct/subset discovery, provenance,
intermediate-only participation, duplicates, field ordering, budget exhaustion,
and deterministic versus random transformations. The five-card test independently
compares every successful permutation/subset against the canonical chain engine.

| Scenario | Actual canonical results |
| --- | --- |
| Hand #021, #036 | #024; both occurrences direct-compatible. |
| Hand #021, #036, #533 | #024, #535, #536, #538, #544, including #021 + #036 → #024, then #024 + #533 → #538. All three have direct participation as well. |
| Hand #021, #036, #534, #000, #683 | Complete search: #024 and #538. #021/#036 direct; #534 chain-only; #000/#683 no ordinary combination. Summary: five inputs, three usable, two without ordinary combinations. |
| Two #073 occurrences | #312; neither occurrence is reused. One copy alone gives no recipe. |
| #534 moved from Hand to Summoning Area | Hand #021/#036 still yields #024; #538 is not inferred from a hand-chain-to-field operation. #534 becomes undetermined. |
| #007, #799 | Separate #501 special transformation; both special indicators, no ordinary result. |
| #016, #800 | Random-outcome notice and undetermined compatibility, no invented result. |
| 27 planning inputs: seven each of #073/#036/#021, five #533, one #683 | Browser reached the 25,000-check budget, retained results, and showed at least 26 participating occurrences. #683 was "Not fully evaluated", never definitively incompatible. |

Chrome desktop (1440 × 1000) and mobile (390 × 844) verification covers the real
picker and keyboard selection, automatic results, five-card statuses, copy/removal
isolation, reactive movement, filtering without compatibility changes, sorting,
metadata flip, empty/no-match states, and alternative recipe expansion. Mobile
stacks the sections, wraps recipes and controls, and has no horizontal document
overflow. Escape returns picker focus. Field-first #021 + Hand #036 and field-only
#021 + #036 both showed #024 with the appropriate position/movement caveat.
Large-result expansion rendered eleven recipes (preferred plus ten alternatives),
then twenty-one after "Show more recipes"; mobile keyboard expansion also worked.
The inspected browser console had no errors or warnings. No separate screen-reader session or large
automated UI suite is claimed. Required lint/format/types/tests/build checks and
publication status are reported in the delivery message.
