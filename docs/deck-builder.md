# Deck Builder

The Deck Builder is a browser-local planning workspace. It stores deck names
and canonical card IDs in `localStorage` under `rose-codex.decks.v1`; card art
and metadata always come from the committed canonical library. JSON import and
export use the same versioned envelope. Keep an export as a portable backup.

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
