# Canonical fusion model

Research found a resolved ID-based game table rather than evidence requiring an
invented rule DSL. The extraction author describes the game's fusion array;
26,540 published extracted pairs agree with the community simulator in full.
Source independence and regional limits are recorded in
[fusion-research.md](fusion-research.md), with URLs, capture digest, method, and
counterexamples. This is transcription corroboration, not 26,540 gameplay trials.

Generic descriptions use monster type, original ATK, attribute, specific cards,
and special categories. They contain thresholds, holes, substitute monsters, and
irregular exceptions. Names/categories alone cannot reproduce those exceptions.
The reference states original stats determine fusion, so altered battle ATK/type
do not require new dynamic predicates. A lookup over IDs is sufficient for the
researched ordinary two-card fusion identity domain. Equipped-state behavior,
failed-chain consumption, rituals and random transformations are separate.

## Representation

`data/canonical/fusions.json` contains schema version 1, `rules`, and
`transformations`. An ordinary rule has two finite ID-set material predicates and
one result ID:

```json
{"materials": [[21,22], [36]], "resultCardId": 24}
```

It applies to every Cartesian-product pair and to the reversed order. This
example illustrates Dragon materials combined with Time Wizard. Every actual
ID set is generated from observed pair outcomes, never guessed from these
descriptions. The normalizer groups lower-material rows only when they have an
identical right-material set and result. That lossless compression represents
26,540 pairs in 153 predicates, covering 95 distinct fusion result IDs.
Overlapping predicates fail validation, even if their results agree. There is no
global priority: the extracted outcomes already resolve conflicting descriptions.

Special power-ups are distinct ID pairs with discriminated outcomes:

```json
{"materials": [7,799], "outcome": {"kind": "card", "cardId": 501}}
{"materials": [16,800], "outcome": {"kind": "random", "mechanic": "insect-imitation"}}
```

Eight deterministic transformations and five uncertain Insect Imitation pairs
are represented. Unknown pools/weights are not encoded as fabricated result IDs.
The schema and functions have no name-based references.

## First-party domain implementation

`createFusionEngine(cards, fusions)` expands the small normalized rules into a
Map once. `fuse(a,b)` returns an ordinary result ID or null. `transform(a,b)`
returns a separate card/random outcome or null. `forward(id)` lists ordinary
material/result ID references. `chain(ids)` folds successful ordinary fusions
left-to-right, preserving intermediate results. It reports the failed step and
stops rather than inventing the game's discard/replacement semantics.

These pure primitives underpin the occurrence-aware automatic search in
`src/lib/dotr/fusion-discovery.ts`, without DOM, Astro or Svelte dependencies.
The engine does not claim full equip/ritual/game-state simulation. Invalid card
IDs and chains shorter than two fail explicitly. Same-ID material pairs are
permitted when present in the table; discovery requires two distinct occurrences.
See [automatic discovery, compatibility, and limits](fusion-workspace.md).

Regression cases cover exact recipes, unordered symmetry, a real successful
chain, forward lookup, random versus deterministic power-ups, an ATK gap, and
high-ATK/substitution exceptions. A universal "result ATK must exceed both
materials" rule is deliberately absent because the data has counterexamples.
