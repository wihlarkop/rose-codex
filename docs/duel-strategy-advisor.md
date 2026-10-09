# Duel Strategy Advisor — scoped first iteration

The optional **Duel Strategy** disclosure is embedded at the top of the
existing Fusion Workspace results area. It deliberately keeps the established
Hand, Summoning Area, Suggested Plays, result cards, and **Summon result / Undo**
controls unchanged. No new route or account/backend is added.

## What the player enters

- Cards actually in Hand and Summoning Area using existing controls,
  saved-deck picker or simulator/recipe handoff.
- Optionally select a **known, visible opponent Monster** from the canonical
  searchable card list, and choose its observed face-up Attack or Defense
  position. An unknown/face-down card stays **unknown** and cannot yield
  a claimed battle result.
- Choose the **expected terrain at the battle/contact square** (default Normal).
  This is a hypothetical scenario: the app does not observe the board or
  infer whether movement and contact are possible.

The existing fusion engine supplies confirmed ordinary direct/chain results
from the actual Hand/Field occurrences. The advisor adds each Monster
occurrence as a possible ordinary card, plus one shortest known recipe per
Monster fusion result. Duplicate physical copies remain separate candidates
and recipes are not synthesized from generic monster types.

## Calculation and ranking

For the *seven ordinary* terrain types Normal, Forest, Wasteland, Mountain,
Meadow, Sea and Dark, the advisor uses the documented +/-500 modification
to both stats based on Monster Type. Other types have no ordinary modifier
on those terrains. It applies the **same expected contact-square terrain** to
both cards for this hypothetical stat comparison, but it does not simulate
the movement needed to reach that square.

For a visibly identified opposing Monster:
- Attack position compares our adjusted ATK to its adjusted ATK.
- Defense position compares our adjusted ATK to its adjusted DEF.
- The difference is labelled **stat edge, tie or trailing**, explicitly *not*
  a guarantee of battle outcome or exact Life Point damage.

Known favorable comparisons appear before ties/unknowns/trailing comparisons.
For each group, the ranking considers the known stat difference, adjusted
ATK, number of source occurrences and deterministic card ID. It displays up
to five options and labels whether each is currently in Hand, Summoning Area
or is a confirmed ordinary Fusion. Each Fusion result offers **View recipe**,
which scrolls/focuses the existing result instead of duplicating Summon controls.

For an unknown opponent or unrevealed position, the result stays **unknown**;
known ATK may be displayed for informational comparison, but a winning
battle is never asserted.

**Special terrains** Toon, Labyrinth and Crush are listed as possible context
but **never treated as Normal or just another +/-500 modifier**. Their monster
exceptions, instant destruction, access and movement rules are not modeled.
The advisor marks projected results unknown on these terrains.

## Explicit exclusions

This is not a playable DotR board or a full strategy agent. It does not
determine summon legality, one-card-per-turn restrictions, Summoning Points,
physical tile distance, obstacles, chain/equip timing, positioning,
deck-leader abilities/rank, hidden traps, hidden enemy identities, flip
effects, monster-specific abilities, type/attribute interactions,
battle-triggered terrain changes, or LP loss. Existing canonical
`Card.effect` text is not recorded for most Monsters, so it would be unsafe
to assert actual optimal combat tactics. The advisor does not claim an
ordinary Hand Monster can immediately attack when only the Hand is known.

All current state is Svelte in-memory state. It does **not** write to
`rose-codex.decks.v1`, `rose-codex.collection.v1`, or a new localStorage
key; nothing is sent to PCSX2. The existing **Fusion Play Advisor** remains a
distinct ATK-ranked fusion-only recommendation without enemy/terrain context.

## Source traceability

- [Yugipedia: DotR gameplay](https://yugipedia.com/wiki/Yu-Gi-Oh%21_The_Duelists_of_the_Roses_Gameplay):
  seven ordinary terrain advantage/disadvantage type mappings, 500-point
  changes, and special Toon/Crush/Labyrinth exceptions.
- [Yugipedia: Terrain](https://yugipedia.com/wiki/Terrain):
  per-square terrain and field bonuses in DotR.
- [GameFAQs strategy/boss guide](https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/56310):
  opponent-specific gameplay caveats, traps, and field influences.

Test fixtures cover normal/+500/-500 interactions, each excluded special
terrain, ATK-to-ATK/DEF comparisons, concealed enemy information, and
canonical direct fusion options. CI performs the existing lint, formatting,
data validation, Svelte/TS checks, unit tests and static production build.
