# M5-04 — Manual Tactical Duel Coach

## Scope and intent

A new /duel/ page accepts manually observed Hand, Field and visible
enemy state from a PS2 Duelists of the Roses session. It reuses the
existing Fusion Workspace ordinary recipe discovery and stat-only
Duel Strategy Advisor; it does NOT model, edit or interact with PCSX2.

The optional story-opponent selector provides strategy text only.
It never infers the actual enemy Monster from partial notable-card
highlights. The player explicitly selects a known face-up enemy
Monster and its observed Attack or Defense position, or leaves it
unknown; sets the expected *contact-square* terrain independently.

The Hand allows up to five independently removable occurrences.
The bounded Field input allows up to eight planning entries; this
limit is a UI research bound, NOT a claim about board legality or
game capacity. Repeated cards remain distinct instances.
Existing /fusion/?hand query semantics are reused for a read-only
handoff from Fusion Workspace, without saving a deck.

## Data and interpretation

- \`src/lib/dotr/tactical-duel.ts\` classifies existing
  \`suggestDuelPlays\` results into **Field combat comparison**,
  **possible ordinary fusion**, and **Hand preparation**.
  Field considerations are listed first, but ranking order is
  NOT a legal command to attack. A Hand monster can never attack
  merely because its ATK is higher.
- Ordinary +/-500 modifiers are evaluated on the SAME manually
  selected contact terrain as for the established advisor.
  Face-up enemy Attack: ATK-vs-ATK; Defense: ATK-vs-DEF.
  The resulting difference is an informational *stat difference*,
  not calculated damage or a win probability.
- Concealed enemy identity/position, special Toon, Crush and
  Labyrinth, missing monster ATK/DEF: report unknown rather
  than treat unknown as Normal.
- Fusion results and material IDs derive from canonical ordinary
  recipe discovery using the exact unique input instances.
  Incomplete bounded discovery produces an explicit warning.

**Excluded:** full board geometry, movement, adjacency, active
turn, Summoning Points, individual card effects, hidden traps,
leader abilities, equip timing, precise battle outcomes, game
memory and screenshot analysis. These require independently
verified rules or runtime data. No game AI/LLM is included.

All working state is local Svelte memory. No localStorage/IndexedDB,
network, file import/export, backend, PCSX2 write or modifications
to existing saved Deck Builder and Collection data.

## Manual acceptance

From Warp, checkout the M5-04 PR branch and run bun run dev.
Open http://localhost:4321/duel/.

1. Add Blue-Eyes White Dragon to your Field, identify Kaiser Dragon
   as face-up Attack, and select Mountain as contact terrain.
   The Field comparison should be 3500 adjusted ATK versus 2800
   and +700 conditional difference (not a guaranteed legal attack).
2. Add cards #021 and #036 to Hand, and check for a potential
   canonical ordinary fusion; the recipe remains conditional.
3. Set opponent position to Hidden, or contact terrain to Crush.
   All favorable stat claims must vanish; values become unknown.
4. Open Fusion Workspace with a populated Hand, select
   "Plan duel with this Hand", and verify the Hand is filled
   at /duel/ without changing saved decks.
5. Clear all and verify the form resets without localStorage writes.
6. Review the page at narrow and desktop widths.

Automated tests cover Field-vs-Hand classification, canonical
fusion instance/material identity, concealed/special-terrain
unknowns and invalid input rejection. Existing lint, formatting,
data, TypeScript/Svelte, tests and build remain mandatory.
