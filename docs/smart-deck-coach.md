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

## M5-03 · Deterministic Strategy Playbook

`src/lib/dotr/deck-strategy.ts` derives an evidence-limited plan from
the *already generated* 40-card list and selected known opponent.
No change is made to M5-01/M5-02 search weights, results or storage.

The result includes three **conditional** tips: setup candidate
(ATK- or DEF-biased for the selected style, summon legality
unverified), an ordinary-terrain positioning reference, and a
reported-monster response that clearly says **ATK vs ATK only**
(on a named ordinary terrain, assuming both monsters are in
attack position). In addition, a short table shows:
- Best adjusted-ATK candidate on each known ordinary terrain.
- Best stat-only comparison against each reported highlighted
  opponent monster with a documented printed ATK.
- Up to four power-up pairs verified with canonical
  `powerUpCardIds` compatibility in the suggested deck.
- Up to four ordinary fusion pairs verified using the exact
  canonical fusion table and with an increase in the printed ATK
  versus both listed materials.

The plan does **not** infer Summoning Points, positions, movement,
turn order, hidden information, effect timing or trap interactions,
and never treats Crush/Toon/Labyrinth/unknown terrain as Normal.
Its strongest ATK candidate is a reference, **not** an instruction
to summon it immediately. The plan is stat-derived, not an
empirical ranking of win rates. If a category has no verified
candidate, the UI explains why rather than inventing one.

Manual acceptance: generate Weevil, Seto and a special-terrain
opponent; inspect the playbook for specific card names, readable
known terrain and candidate pairings, and explicit unknowns.
Switch styles and verify the plan changes without touching the
saved decks. Open **Review in Deck Builder** and ensure explicit
user confirmation still gates new saves. Tests cover 3 distinct
opponents × 3 styles for determinism and canonical citations,
unsupported terrain suppression, and rejected stale opponent/ID
references. LLM is deliberately deferred.
