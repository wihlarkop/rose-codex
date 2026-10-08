# Naming and starter choices

`src/lib/dotr/naming.ts` independently implements the published game-code
calculation. [GenericMadScientist's research](https://www.speedrun.com/yugiohdotr/forums/ch2hb)
describes padding to twelve slots, remainder arithmetic, and a worked example.
The [character map](https://pastebin.com/znxgzEct) supplies codes. Eenkin's
[naming page](https://eenkin.github.io/dotr-fusion-simulator/naming_simulator) and
[script](https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/starterDeckSim.js)
corroborate supported input and choice groups. No implementation code is copied.

Each supported character contributes its game code modulo 16. Unused slots
contribute 14; the sum modulo 16 selects a group 0..15. Comma is code 0x002;
uppercase A..Z start at 0x056; space is 0x070; brackets/lowercase/digits/punctuation
continue from 0x071 through 0x0A6. The encoding map also includes dialogue/control
symbols outside the name-entry set; those are intentionally rejected.

Accepted input is 1..12 characters, case-sensitive, including spaces and the
documented punctuation `!"#$%&'=^-¥./_,()[]`. No trimming, Unicode normalization,
case folding or transliteration is performed. `@` is a symbolic filler in the
research explanation, not a valid typed character. The reference UI truncates
overlength input; Rose Codex's pure API instead throws so callers must handle
the maximum explicitly. Empty input and unsupported characters also throw.

`nameGroup(name)` returns the group number. `starterDecksForName(name)` returns
`{groupId, leaderCardIds}` with three fresh ID choices from canonical JSON.
This describes deck options, not an automatic choice or all three complete decks.
Canonical starter data separately contains the 17 forty-card lists.

Regression evidence includes the published example **CM Punk → group 9 →
458/132/266**. Hand-computed cases include A→0, B→1, Rose→4, a→13,
one space→10, twelve As→8, and ¥→13. Tests exercise all 16 groups, game codes,
case/space significance, twelve-character boundary, invalid punctuation,
newlines/tabs/non-ASCII/emoji, and mutation isolation.

The worked example is independent of Rose Codex's implementation, but the
community simulator credits the same research author; it is not a second
independent game disassembly. No emulator, original console, or regional naming
comparison was performed. The current contract targets the inspected English
name-entry research.

The [Deck Leader Reference](/leaders/) now allows players to review the
selected starter's monster type, ranked ability research and general
Leader rules. The Naming Simulator links to that reference. Choosing
a card in this reference does not change the original starter or
persist a Deck Leader assignment.

## Naming simulator in Deck Builder

The Deck Builder contains an expandable **Try starter decks by player name**
section. Enter the player's original in-game name exactly (1–12 supported
characters, case and whitespace preserved). The UI calls
`starterDecksForName` without normalizing the name, then displays the three
canonical Deck Leader choices for the computed group. Selecting a leader shows
the corresponding recorded 40-card list, grouped copy counts, local DotR card
thumbnails and known/unknown Deck Cost. This is a lookup, not a random generator.

The canonical data has 17 leader-specific 40-card lists covering every leader
referenced by the 16 naming groups. Each list is sourced, not independently
verified against an original game session; the #458 list is explicitly flagged
`manual-review` and the UI highlights that limitation. The selected leader is
**not** saved as a separate deck-leader property because the existing version-1
Deck Builder schema only stores deck IDs, names and main-deck card IDs. Instead,
**Create as new deck** makes a new editable copy of the 40 cards and includes the
leader's name in the deck title. Existing user decks are never replaced. This
simulator does not implement a duel, draw, Deck Leader rank, or legality checks.
