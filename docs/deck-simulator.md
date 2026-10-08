# Deck Simulator and Fusion Play Advisor

The standalone `/simulate/` route is a lightweight, browser-only **practice**
tool. It loads existing named decks from the same validated
`rose-codex.decks.v1` format as Deck Builder, but never writes to it or to
`rose-codex.collection.v1`. Deep links from Deck Builder may preselect a deck
by its saved ID. No new persistence keys, backend or dependencies are required.

## Practice draws

Select a deck containing exactly 40 card occurrences, then select
**Shuffle & draw 5**. The Fisher–Yates shuffle creates a copied 40-card
sequence. The first five occurrences enter Hand; the remainder are kept in
the draw pile. Each occurrence keeps a separate generated instance ID,
including multiple copies of the same numbered DotR card.

Players can **Set aside** an individual Hand copy and later **Draw to 5** from
the remaining pile; already drawn or set-aside copies cannot reappear until
**Shuffle & start over**. Set aside is an explicit practice zone, **not**
a faithful representation of DotR's graveyard, discard rules or turn order.
End practice discards the ephemeral practice state only. Selecting a different
deck never silently replaces an in-progress Hand; starting a new session
is explicit. Invalid/overfull deck presets cannot initiate a 40-card draw.

## Suggested Plays

The simulator displays **Suggested Plays** directly below the Hand. It passes
its actual five Hand occurrences to the existing bounded ordinary fusion
discovery engine, preserving the exact canonical fusion and chain rules.
For each result, the shortest discovered recipe is ranked using this transparent
heuristic: **highest known result ATK**, then **fewest consumed original
occurrences**, then DEF and canonical ID. The three highest-ranked results
show each step in order, final card, material count, and remaining input count.
A suggestion is **not** a guaranteed best strategic move: terrain, board
positions, opponent state, power-ups, and Deck Leader state are not modeled.
Partial discovery cannot assert that unlisted plays do not exist.

The Fusion Workspace also displays this advisor for its manually selected
Hand/Summoning Area cards; on that route the user can click the existing
**Summon result** button directly.

## Simulator → Fusion

**Open Hand in Fusion** encodes only the current one-to-five canonical card IDs
in an ordinary `/fusion/?hand=21%2C36` URL query. Fusion checks count,
integer syntax and card membership against the canonical library, then creates
individual Hand occurrences. Invalid links do not add cards. Duplicated card
IDs remain distinct copies. No special storage handoff is needed, and the
practice deck, Collection, and browser deck presets are not modified by
opening the link. Once in Fusion, the user may apply or undo fusion recipes
as ordinary workspace planning actions.

## Boundaries

This is not a game-connected emulator, true game RNG implementation,
opponent AI, probability predictor, Deck Leader validator, battle turn
simulator, or complete play optimizer. Practice is entirely local to the
current browser tab and resets on page reload. The former manual Fusion
pickers and existing unlimited planning mode remain available.

Unit tests cover per-copy shuffling/drawing/set-aside behavior and exact hand
query decoding; lint, formatting, type checks, canonical data validation and
static production build run via the repository's existing CI.
