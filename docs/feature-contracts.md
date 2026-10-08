# Fusion and deck workspace contracts

The authorized parallel wave adds `/fusion/` and `/decks/` to the existing static
Astro app. Each route hosts one Svelte 5 island; all editing stays on that route.
Keep the current warm neutral palette, compact controls and in-grid card flip.
The existing Card Library is outside this change.

## Shared interfaces

- Canonical `CardId` is the integer `Card.id` from `src/lib/dotr/model.ts`.
  Names and image URLs are never identity. Runtime data imports only committed
  `data/canonical/`; never fetch data from external services in the browser.
- `browserCards(cards, images)` supplies `BrowserCard[]` for presentation.
  Feature islands accept `cards: BrowserCard[]`. Build an ID map once; unknown
  IDs must produce a visible error or a rejected import, never fabricated metadata.
- `CardPicker` accepts `cards`, `onselect(cardId)`, optional `label` and
  `selectedCardId`. Reuse it without changing its shared implementation.
- Reuse `CardArtwork` for screenshots and missing imagery and `CardFlipTile`
  for image/metadata interaction. Its optional `onflip(cardId, next)` and
  `flipped` are local presentation state. Instance controls stay outside its
  interactive surface. Pass its optional `id` with a feature prefix plus the
  occurrence's instance ID to keep repeated cards' DOM identities unique.
- Workspace occurrences have unique `instanceId: string` and `cardId: CardId`.
  Use `crypto.randomUUID()` when adding an occurrence. Removing/moving one
  occurrence must not affect another copy of the same canonical card.
- Ordinary fusion uses unchanged `createFusionEngine(...).fuse/chain/forward`.
  `chain` processes an explicitly ordered selection and stops at a failed pair;
  it does not specify discarded cards. Special transformations remain separate,
  and random results must remain unknown. Fusion previews do not consume or
  replace workspace instances automatically.
- Deck persistence uses key `rose-codex.decks.v1` and envelope
  `{ schemaVersion: 1, decks: [{ id: string, name: string, cardIds: number[] }] }`.
  Store IDs and user names only. Duplicate occurrences are allowed in editing;
  validation is guidance and must not prevent saving incomplete decks.
  JSON import/export uses this same envelope. Imports validate completely before
  replacing/merging live state. Catch localStorage read/write failures; never
  silently overwrite malformed or unsupported saved data during initialization.

## Ownership and execution

| Owner | Writable paths |
| --- | --- |
| Luna High, Fusion | `src/features/fusion/**`, `src/pages/fusion/index.astro`, `docs/fusion-workspace.md` |
| Luna Medium, Deck Builder | `src/features/decks/**`, `src/pages/decks/index.astro`, `docs/deck-builder.md` |
| Parent, Sol 6.1 High | Shared components/domain/configuration, shell/navigation, product docs, integration and all Git writes |
| Optional Luna Medium research | Read-only findings delivered to parent |

Agents work in separate `.worktrees/fusion` and `.worktrees/decks` checkouts
starting from the shared-contract commit. Every Git command uses that checkout's
verified `safe.directory`. Agents leave edits uncommitted; the parent reviews,
commits each worktree and integrates. No child pushes or changes shared files.
No new packages or automated test files. Use lint, Oxfmt and framework checks;
the parent runs the existing suite/build once after integration and manually
checks the actual browser interactions at desktop and a narrow viewport.

## Game rules and scope

Hand and Summoning Area are user-organized planning zones, with unlimited input
instances. They do not assert unlimited in-game capacity. Research real game
mechanics before deriving any field/hand calculations. Sequence order must be
visible and editable; show successful intermediate results and the failed pair.
Do not extend the solver or guess equip, ritual, failed-chain or random behavior.

Deck count, total known cost, unknown cost and kind/type composition derive from
canonical card metadata. Research construction rules and cite sources before
claiming validity. Expose incomplete/unknown metadata, including special #671.
Do not infer CPU deck records or silently change starter deck semantics.

Acceptance includes duplicate-instance isolation, picker keyboard behavior,
zone moves/removal/order and chain failures; multiple-deck lifecycle, reload,
JSON round trip, invalid imports and storage failure; honest missing imagery;
and navigation to both workspaces without altering the library.
