# Collection, Active Deck, and Reserve

The **Collection** page at `/collection/` records actual cards owned and their
individual copy counts. It is separate from **Deck Builder**, where each saved
deck is an alternative 40-card plan. Selecting a duel deck in Collection shows
its active card list alongside the unassigned owned copies (Reserve).

## Preserving pre-existing decks

The existing Deck Builder JSON schema and `rose-codex.decks.v1` localStorage
key are unchanged. On the first opening of Collection, if no collection record
exists, the UI initializes owned counts from the **maximum** quantity of each
card across saved deck presets, *not their sum*. This is only an estimate of
actual ownership: multiple deck presets can share copies. It does not
automatically change, truncate, or choose cards from any saved deck.

For example, an existing 43-card deck still shows **43 / 40** and all 43
copies. Select that deck and click **To reserve** on three copies chosen by
the player. Before the first removal is saved, the estimated owned inventory is
persisted, so the removed cards remain owned. The active deck then becomes
40/40 and Reserve has those three cards, provided no other owned copies are
unassigned.

**Add cards earned after duels** updates Collection inventory only. Such
cards initially appear in Reserve. **To deck** moves one reserve copy into
the selected deck, but only while the target deck has fewer than 40 cards.
To swap a card at 40, first move one out. **− Owned** is blocked when any
saved deck preset still uses that copy. All transfers are per physical copy
and require an explicit player action.

## Persistence and safety

Collection has its own separate versioned key:
`rose-codex.collection.v1`, format
`{"schemaVersion":1,"owned":{"21":2,"36":1}}`.
Positive safe-integer counts and known canonical IDs are validated.
Malformed collection or deck data is not overwritten. Writes check the
previous stored snapshots to avoid silently replacing changes made in another
tab. Storage failures display a warning without claiming a successful move.
The original deck backup remains exportable in Deck Builder; Collection has
a separate **Export collection JSON** backup action.

Changes made to deck presets directly through the existing Deck Builder are
still planning edits and do not automatically assert physical ownership. If
they require more copies than Collection records, a deficit warning appears:
use Collection's **+ Owned** only for cards actually acquired. Refresh the
Collection page after editing decks in another tab.

No server, authentication, shared multi-device inventory, automatic rewards
sync, or full DotR leader/rank legality is implemented.
