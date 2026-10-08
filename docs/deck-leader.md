# Deck Leader Reference & rank research

The `/leaders/` page is a **read-only game-reference tool**. It reuses the 854
canonical cards (only Monster cards are searchable as candidates), local DotR
artwork, and the existing 17 recorded starter Deck Leader IDs. By default it
shows **#034 Twin-Headed Behemoth**, the familiar Dragon starting option. A
`?card=34` link selects the matching canonical Monster without persisting
anything. The Naming Simulator links its selected starter directly here.

## What is established

- A Deck Leader acts as the duelist's movable base, represents their LP, and
  normally moves one square each turn. It plays cards into surrounding
  Summoning Areas and can receive a direct attack.
- Players receive an initial Deck Leader; ordinary monsters are not automatically
  eligible to lead until promoted in-game. The **first promoted rank is 2LT**,
  per Yugipedia's rank table and initial Deck description.
- The Leader is designated **in addition to** the normal 40-card deck. Its
  game-specific Leader role should not be confused with the regular card's
  ATK/DEF values.
- There are **12 promoted ranks** from Second Lieutenant (2LT) to
  Secretary of Defence (SD). The unranked state (NCO) is not counted among
  those twelve. There are abilities that depend on rank, monster type/level,
  and sometimes specific cards.
- The user must inspect their actual in-game Leader rank. No rank, XP,
  experience threshold, individual Leader ability, or save-game rank is stored
  in Rose Codex's current canonical card data.

## Evidence levels and limitations

**Manual/gameplay rules:** the original Konami US instruction booklet and
Yugipedia's Deck Leader description are used for core rules. The twelve
promoted rank names and their order are cross-checked with CloudStryfe's
GameFAQs guide (§7-2).

**Community type patterns only:** rank-specific ability reports in
`src/lib/dotr/deck-leader.ts` are a deliberately *limited transcription*
of Lord_Blade's 2004 Deck Leader FAQ (version 0.7). That FAQ explicitly warns
that ability families have **monster-level exceptions** and is incomplete
for multiple monster types. Each display entry is therefore labelled
**Reported at [rank]**, not "unlocked", "available", or "guaranteed".
There is no inferred ability assigned to individual Monster cards; types with
no transcribed milestones show **not yet recorded**, not **no abilities**.
Low-level exceptions and entries with unknown threshold are only described
in caveat text, never promoted to precise unlock claims.

**Source disagreement:** an early community FAQ casually says the first
eligible rank is 1LT; the game description, other walkthroughs, and
Yugipedia consistently identify **2LT** as the first promotion. We adopt 2LT
for the rank sequence and flag the contradiction here rather than quietly
treating the FAQ as complete game data.

**Hypothetical rank selector:** manually selecting a rank shows a *count*
of FAQ type-pattern entries reported at or below that rank. It does not save
the rank or assert those abilities are activated in the player's actual game.
Type-specific rank listings are displayed whether or not the user selects
a hypothetical rank. In particular, incomplete community research is never
used to decide if a monster is legal as the user's next Leader, or to
automatically alter the Duel Strategy / Fusion recommendation algorithm.

## Sources

1. [US instruction manual (Konami)](https://www.videogamemanual.com/PS2/Yu-Gi-Oh%21%20The%20Duelists%20of%20the%20Roses%20%28USA%29.pdf) — Deck Leader movement, rank and listed abilities.
2. [Yugipedia Deck Leader](https://yugipedia.com/wiki/Deck_Leader) — game function, 2LT first promoted rank, unranked NCO and ranking.
3. [CloudStryfe's GameFAQs walkthrough](https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/22437) — section 7-2 provides twelve rank names.
4. [Lord_Blade's Deck Leader FAQ v0.7](https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/30813) — incomplete community type/rank observations, low-level exceptions and hidden abilities.
5. [Yugipedia Initial Deck](https://yugipedia.com/wiki/Initial_Deck_(The_Duelists_of_the_Roses)) — seventeen original starter choices, separate from promoted-candidate eligibility.

## Integration and out-of-scope work

No change to `rose-codex.decks.v1`, `rose-codex.collection.v1`,
the 40-card builder, naming algorithm, Fusion calculations, or Deck Simulator.
The selected Leader on a Naming starter is still represented **only in the
deck title**, not as a persistent structured attribute. Neither the page
nor its rank selector claims a save-game integration.

A future milestone may add **explicit structured Deck Leader selection** and
player-confirmed rank/abilities to a new versioned deck schema, but only after
a separate compatibility/migration design and stronger per-card evidence.
Actual PCSX2 memory-card reading/editing and terrain-aware duel simulation
remain separate research topics. Tests cover rank order, source-data
integrity, all seventeen starter references, and refusal to infer ability
availability from an unknown rank. Browser usability still needs acceptance.
