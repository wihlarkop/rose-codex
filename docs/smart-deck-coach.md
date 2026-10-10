# M5-01 / M5-02 · Smart Deck Coach

## Scope
The client-only /coach/ route allows choosing one of 20 community-reported
campaign opponents, a Rose path and Balanced/Aggressive/Defensive style.
It generates 40 main-deck cards under the reported opponent Deck Cost,
with at most three copies of a card, using canonical card costs, known
ATK/DEF, ordinary terrain, selected opponent highlights, potential
fusion pairs and power-up compatibility from canonical card records.

The pure TypeScript matchup evaluator in src/lib/dotr/smart-deck.ts
scores favorable *stat-only* contact-terrain comparisons and terrain
modifiers. Unknown special terrain and hidden cards are NOT interpreted
as ordinary. The deck generator is a reproducible budget-constrained
greedy heuristic, not globally optimal or an estimated victory chance.
Unknown trap, magic and ritual effects are NOT ranked; the selected
power-up candidates have canonical compatibility with deck monsters.

## Player safety and uncertainty
- 40 main cards, maximum three copies, each Deck Cost known, and
  total main-deck DC < reported opponent DC are hard constraints.
- The Deck Leader is SEPARATE and never included in main-deck DC.
  The player must confirm that a Monster Leader has a sufficient
  earned 2LT rank; unlocking the catalog does not prove leader rank
  or actual card copy counts.
- No gameplay or save-state access; output assumes all catalog cards
  are unlocked and can be obtained in enough quantities.
- No LLM, cloud account, analytics, new dependencies or writes to PCSX2.
- A link to Deck Builder opens only a PROPOSAL, validated against
  canonical card IDs, quantity limits, known costs and selected
  opponent. Nothing changes until the user explicitly clicks
  Add as a new deck; existing decks are not replaced.

## Evidence provenance
- Canonical card IDs/kinds/DC/ATK/DEF/power-up links:
  data/canonical/cards.json, built from pinned data sources.
- Ordinary fusion possibilities: data/canonical/fusions.json.
  Ordinary pairs are not guaranteed valid actions in every board state.
- Opponent deck costs and notable enemy cards:
  src/lib/dotr/opponents.ts and its OPPONENT_GUIDE community walkthrough.
  These are reported highlights, NOT verified full opponent decks.
- Normal terrain modifiers reuse src/lib/dotr/duel-advisor.ts.
  Toon, Crush, Labyrinth and incomplete layouts remain unscored.

## Acceptance
Open /coach/ with bun run dev. Generate three styles for opponents
with different Deck Costs, e.g. Weevil, Seto and Yugi. Every generated
list must have 40 cards and DC strictly below that opponent.
Review in Deck Builder: the proposal should appear before any save.
Dismiss without changes; then open again and explicitly Add as a new
deck, retaining all existing decks. Check narrow screens and keyboard
controls. CI tests all 20 opponents x 3 styles, reject invalid links
and impossible decks, and run existing lint/type/data/build gates.

## Limitations
This is not a trained AI/LLM, game-memory reader, hidden-card predictor,
full deterministic duel simulator, player-collection verifier or a
battle-outcome guarantee. Future improvements should be driven by
controlled actual PCSX2 feedback and verified game rules/effects.
