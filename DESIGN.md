# Rose Codex · Interface Design

Rose Codex is a **text-first** companion for *Yu-Gi-Oh! The Duelists of the Roses*.
The application does not ship game artwork, render a card image, flip cards,
import user images, or provide an image/screenshot matching assistant.

## Visual identity

Retain the established **Charcoal & Rose** look: warm neutral surfaces,
charcoal dark mode, restrained rose accents for selection and keyboard focus.
System appearance is the default, with explicit Light and Dark alternatives.
Keep contrast, dense information hierarchy, and responsive layouts comfortable
next to PCSX2 at approximately 550px wide.

## Card presentation

- The Card Library displays name, canonical ID, category, type, attribute,
  level, ATK/DEF, Deck Cost, optional password, and recorded metadata **directly**.
- There is **no flip state**. Long effect notes can use a disclosure; unknown
  facts remain unknown instead of being guessed.
- Repeated cards use a compact **CardIdentity** component with ID and name,
  while full browsing/inspection uses **CardInfoTile**.
- Search and Ctrl/Cmd+K use name/ID matching, keyboard navigation,
  explicit focus, and real ownership counts only when browser storage is valid.
- No asset placeholder or third-party remote image URL is used. Iconography is
  limited to the UI component library rather than game-related images.

## Workspaces

Six main navigation sections: Home, Cards, Fusion, Decks, Duel, Reference.
Sub-tools are grouped within these workspaces rather than separate top-level
menu entries. Keep manual Hand/Field planning, conditional tactical evidence,
Deck Workshop safe persistence, and Reference lookup fully usable without images.

Duel Companion uses manual card name/ID lookup and optional saved-deck browsing.
It cannot observe PCSX2 automatically, determine hidden state, read owned cards
from save files, or promise legal moves. Battle History stores only manually
entered results. Memory-card inspection stays local and read-only.

## Interaction and accessibility

Keyboard-accessible controls, visible focus, reduced-motion support, safe
confirmation before replacing state, error messages for corrupt or blocked
storage, and narrow-screen stacking are required. Avoid nested interactions,
unjustified modals, fabricated statistics, and new navigation destinations
for minor features.

## Distribution boundary

The current-source branch excludes game artwork and the acquisition/matching
implementation, but **older commits, forks, caches, and downloaded artifacts
may still contain the former image files**. Do not equate source-tree removal
with retroactive erasure or legal clearance. See
[the migration and QA plan](docs/text-first-migration.md) and
[data provenance](docs/data-sources.md).
