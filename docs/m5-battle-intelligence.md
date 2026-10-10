# M5-05–M5-08 · Deterministic intelligence & real battle feedback

Status: implementation candidate for local acceptance, *not* a validated
game-playing agent or proven optimal recommendation system.

## Mechanic evidence and limitations

DotR uses a 7×7 board. In normal duels SP starts at 4, gains 3 at
the start of each new turn and caps at 12. Monster summoning
requires SP equal to card Level. A Deck Leader can place one
card per turn in available surrounding Summoning Areas.
Refs:
- https://yugipedia.com/wiki/Yu-Gi-Oh%21_The_Duelists_of_the_Roses_Gameplay
- https://yugipedia.com/wiki/Deck_Leader

The player still inputs **current observed** SP; the tool
never guesses it from game time or turn count. Unknown SP or
card-play status stays unknown. If observed SP is below the
monster's known Level, or a card has already been played this
turn, M5-05 marks that Hand card play blocked. Otherwise it is
**conditional**, NOT an assertion that the player has an
empty adjacent summoning square, summon permission or rank.

Coordinates are optional 0–6 internally and rendered as
1–7 to the player; they report spatial adjacency only.
They do not establish paths, movement bonus, hidden blocks,
turn consumption or reachability.

## Tactical engine v2 — M5-06

Uses M5-04's canonical fusion and terrain-aware stat
comparisons, extends with known SP/card-play guards, and
ranks provisional actions as attack-check, reposition,
fusion-check, summon or hold. Held-SP consideration only
applies when no conditional Hand summon is known and the
user confirmed the turn has no card play yet.
Remainder of the board, effects and opponent Hand are unknown.
No action is executed; advice is never called "legal move."

## Deck optimizer v2 — M5-07

The prior generator remains the baseline and *unchanged*.
User explicitly requests local-search refinement. Search
considers canonical known-cost Monster replacement candidates;
never exceeds three copies, 40-card total, the strict
opponent cost ceiling, or verified equipped-card host
compatibility. The objective is a **heuristic proxy** combining
known matchup stats, terrain, cost, copy diversity, small fusion
potential and high-Level SP pressure. Bounded two-pass improving
swaps remain deterministic and never lower the proxy score.
No win-rate estimate or causal claim is derived.

## Battle Lab — M5-08

Player explicitly records completed duels (opponent, selected
saved deck, Win/Loss, 1–999 turns, up to 400 chars of notes)
in a new separate \`rose-codex.battle-lab.v1\` envelope.
At most 200 entries, strict validation, duplicate-ID rejection,
backup export and individually confirmed removal.
Data remains browser-local and cannot modify game saves,
deck catalog or existing user Collection. Invalid stored data
is protected from silent overwrites. Recorded win percentage
is *observed*, not extrapolated expected win probability.
No ML model is trained using these matches.

## Deferred M5-09/M5-10

Screenshot recognition and LLM explanation remain separate
future work: automatic extraction would require a measured
vision model and human confirmation; hosted inference
requires provider/credential/privacy and cost decisions.
Do not enable network inference without deliberate opt-in,
or claim generated text is a deterministic rules verdict.
A UI/UX revamp is intentionally scheduled after M5.

## Manual acceptance

1. /duel/: set Blue-Eyes White Dragon in Hand,
   observed SP=7, card played=no, check **blocked** because
   its Level is 8. Change SP to 8; it becomes conditional.
   Set played=yes; it becomes blocked again.
2. Add a Field Blue-Eyes facing visible Kaiser Dragon on
   Mountain terrain, verify stat comparison remains +700
   but does not become guaranteed legal combat.
3. Try optional 7x7 coordinates; adjacency must not be
   called guaranteed movement/attack.
4. /coach/: generate a Weevil deck, click Optimize this
   deck (v2), verify proxy score never goes down, 40
   cards/copy/budget constraints remain valid, and
   Review in Deck Builder still requires user confirmation.
5. /lab/: record a Win and Loss against Weevil using a
   saved deck, verify 1/2 (50% **observed**), export JSON,
   remove an entry and check browser reload persistence.
   If no saved deck exists, add one via Deck Builder first.
6. Validate narrow viewport, keyboard usability and
   all CI checks (lint, format, data, Bun tests,
   Astro/Svelte/TS checks, static build).

No real PCSX2 save or game screen is ever read or modified.
