# Deck Builder

The Deck Builder is a browser-local planning workspace. It stores deck names
and canonical card IDs in `localStorage` under `rose-codex.decks.v1`; card art
and metadata always come from the committed canonical library. JSON import and
export use the same versioned envelope. Keep an export as a portable backup.

## Building a deck

Select a deck from **Your decks**, or choose **New deck**. Edit the active deck's
name directly; changes save automatically in this browser. The header shows save
status, progress toward 40 cards, and the known Deck Cost. Unknown costs stay
separate from that total.

The **Add cards** search field is always visible. Type a card name or numbered ID
to see matching cards with authentic thumbnails and a current in-deck copy count.
Use **+ Add** beside a result, or use the Up/Down keys and Enter directly from the
search field. Search remains open after adding a card, so multiple copies and
several different cards can be added without reopening a picker. A blank search
shows no result rows; broad queries show up to twelve matches and ask users to
narrow their search for more.

Deck contents are grouped into compact rows with thumbnails and quantities. Add or
remove one copy beside its row, or expand the copy controls to remove a specific
individual copy. Inspect a card in place to see its image and metadata. Composition
and construction guidance remain available without a grid of 40 large tiles.

**Deck options** contains duplication, deletion, and JSON backup controls.
Deleting a deck and importing a replacement require confirmation. JSON export
includes every deck; import validates the complete backup before replacing every
deck in the workspace. Invalid imports leave the current decks intact. If the
replacement cannot be saved, it remains in the tab with an unsaved warning and
backup/retry actions.

## Naming-based starter decks

Expand **Try starter decks by player name** above the card search. Enter the
same player name as the English game to see three possible starter Deck Leaders.
The name is case-sensitive, limited to 1–12 characters, and preserves spaces.
Select one of the three cards to preview its 40 recorded main-deck cards, copy
counts and known deck cost. **Create as new deck** adds a separate editable deck
without modifying existing decks or replacing the current browser backup.

The selected Deck Leader appears in the new deck's name, not in its stored
main-deck card IDs. Deck Leader selection, ranks and duel legality are not yet
modeled by the current version-1 deck schema. The lists have limited source
verification; #458 is flagged for manual review. See
[Naming and starter research](naming.md) for the calculation and evidence.

## Construction rules

The US PlayStation 2 instruction manual says a deck contains exactly 40 cards
plus one Deck Leader. It limits the main deck to three copies of a card, with
the Deck Leader excluded from that count. A Deck Leader must be a monster of
Second Lieutenant rank or higher. For campaign duels, the player's deck cost
must be lower than the opponent's; the Deck Leader's cost is excluded from the
comparison. The manual also says deck construction cannot be completed without
the required 40 cards and a leader.

Source: [Yu-Gi-Oh! The Duelists of the Roses (US PS2) instruction manual](https://www.videogamemanual.com/PS2/Yu-Gi-Oh%21%20The%20Duelists%20of%20the%20Roses%20%28USA%29.pdf).

This workspace does not assign a Deck Leader, rank, or opponent, so its count,
copy, and cost summaries are planning guidance rather than a legality check.
Deck cost totals report known card costs and separately count unknown costs;
unknown values are never treated as zero. In particular, canonical card #671
has no recorded deck cost.

## Data format

```json
{
  "schemaVersion": 1,
  "decks": [
    { "id": "user-generated-id", "name": "My deck", "cardIds": [1, 2, 2] }
  ]
}
```

Imports are checked in full for supported schema, deck structure, nonblank
names and IDs, unique deck IDs, and canonical card IDs before replacing the
workspace. Duplicated card IDs are allowed as separate copies. Malformed saved
data is preserved on startup and reported. Ordinary edits do not overwrite a
corrupt record; an explicit valid import replaces it. Export backs up the current
in-memory workspace, not the unreadable stored record. Read failures and failed
writes are reported without claiming a save; write failures expose a retry action.

## Browser acceptance

The redesigned editor was exercised in Chrome on 2026-10-09 at 1920 × 889,
390 × 844, and 320 × 740. Checks used the running app and its production static
build, with disposable storage fixtures on a separate local origin.

| Journey | Observed result |
| --- | --- |
| Empty deck and adding cards | Clear empty state and Add cards action; name/ID search, keyboard selection and focus return worked |
| Copies and inspection | Quantities updated through 1x–4x; individual and one-copy removal updated counts/costs; image/metadata inspection stayed on the page and worked by keyboard |
| Construction and composition | A 40-card fixture used 14 grouped rows; 41-card and four-copy warnings appeared; known cost and unknown #671 cost stayed separate; kind and monster-type summaries remained available |
| Deck lifecycle | Create, select, rename on Enter/blur, duplicate, delete and refresh restoration worked; blank names restored the previous name |
| Destructive guards | Cancel and Escape preserved decks and returned focus; explicit confirmation deleted the captured deck or replaced all decks; mobile options and confirmations stayed within the viewport |
| JSON backups | Export included every deck in the existing version-1 format; confirmed round-trip import preserved names, IDs, card order and copies; an unknown card ID was rejected without replacement |
| Storage protection | Existing saved data loaded with zero startup writes; corrupt data remained byte-for-byte unchanged through edits/export; denied reads allowed editing with zero writes |
| Storage recovery | Quota and import-write failures displayed unsaved status; export retained in-tab edits; retry saved after writes were restored; only a confirmed valid import replaced a corrupt record |
| Responsive layout | Desktop and narrow mobile layouts had no horizontal document overflow, including pending rename feedback at 320px |

Oxlint, Oxfmt, Astro/Svelte/TypeScript checks, canonical data reproduction and
validation, the existing 111 tests (244 expectations), and the static build
passed. No test files, dependencies, card data, shared card components, Fusion
code, storage key, or schema were changed. These are agent-driven browser
acceptance journeys, not a new-player usability study or a complete legality check.
