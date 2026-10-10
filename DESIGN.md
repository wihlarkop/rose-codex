---
name: Rose Codex
description: Compact visual DotR companion for desktop play
colors:
  background: "#f0ede8"
  surface: "#fbf9f5"
  elevated: "#e7e2dc"
  foreground: "#29272a"
  mutedForeground: "#666166"
  border: "#d4cec8"
  primary: "#995665"
  selected: "#f0e2e6"
  ring: "#ac6877"
  warning: "#855d29"
rounded:
  control: "6px"
  tile: "10px"
---
# Rose Codex interface

A compact tool for recognizing cards while playing DotR. A soft warm-neutral
canvas and clear card surfaces support long lookup sessions with authentic game
screenshots. Dusty rose marks active navigation, actions and keyboard focus;
amber identifies unavailable imagery. Body text stays dark and readable.

Tokens in `src/styles/global.css` are the source of truth. Tailwind's inline theme
maps semantic colors and radii to those variables. Spacing follows the small
quarter-rem scale. Prefer existing tokens and utilities over new literal colors.
The custom `app-container` avoids Tailwind's responsive `container` utility.

Smart Deck Coach at /coach/ follows the existing card, opponent and builder
UI language: left-side opponent/path/style controls, right-side 40-card
recommendation cards with small actual DotR artwork, canonical IDs, known
stats, DC and brief evidence explanations. Keep the limits and unverified
Deck Leader rank highly visible. The handoff to Deck Builder is a proposal,
not auto-import: the receiving route exposes an explicit add/dismiss panel
and never replaces the player's existing decks. No LLM, AI chat or speculative
"win chance" visuals.

M5-03 adds a compact "How to play this deck" playbook within the
existing generated deck result, using three setup/terrain/threat paragraphs,
bounded reported-threat and terrain comparison lists, and small canonical
power-up and ordinary fusion highlights. Avoid a chat UI, extra route,
probability visualization or claims about the unseen PCSX2 board; warnings
about unknown Summoning Points and card effects remain discoverable in
an expandable "Important uncertainties" section. Do not disturb
existing Deck Builder acceptance behavior.

M5-04 adds a standalone /duel/ route rather than overloading the
existing Fusion Workspace advisor. Its two-column layout keeps
manual Hand/Field/known-enemy controls on the left, with clearly
labelled conditional next-step considerations on the right. Use
existing card thumbnails and CardPicker, brief caution notes,
and the established subtle warm-neutral styling. Labels must
distinguish Field stat checks from speculative Hand preparation
and possible fusions. No simulated game board, screen capture,
agent chat, or fake turn/SP indicators.

The homepage opens directly into the functional Card Library; `/cards/` remains
an equivalent library route. The shell exposes Cards, Fusion, and Decks with
the current destination marked. Navigation wraps on narrow screens.
Content is capped at 1480px with 32px desktop gutters, then 24px on narrow
desktops. The library uses 220px minimum tiles and 16px gaps, yielding a denser
six-column grid at wide desktop sizes and larger cards as the viewport narrows.

Tiles show the full DotR game screen and flip in place to canonical metadata.
The front repeats the readable card name; the back shows classification, known
stats, ID, and deck cost. Missing #676 remains a clearly labelled unavailable
placeholder. There is no artwork toggle or individual card detail route.

The toolbar offers immediate local search and kind/type/attribute filters,
removable active chips, reset and result counts. Quick lookup uses a visual
Command/Popover picker with keyboard selection and focus. Native selects remain
appropriate for the short filter lists. Selecting a tile flips that tile without
changing routes or discarding library state. Enter and Space provide the same
image/metadata interaction. Quick lookup selects the in-grid card.

CardArtwork, CardFlipTile, and CardPickerOption share
image and metadata treatment across library, workspaces and picker uses.
Standard controls use the existing shadcn-svelte primitives; Tailwind handles
routine layout and shared CSS variables define the palette. Custom CSS is limited
to product-specific image crops and the card flip. Astro renders static pages.
Each workspace has one Svelte island owning local interaction; canonical models, search and
game mechanics remain outside presentation components. Images are local,
lazy-loaded and dimensioned. Provenance and confidence are recorded in the image
coverage documentation.

PCSX2 Save Inspector uses the existing compact, warm-neutral page layout at
`/saves/`. The in-browser file picker is the only input. A scoped alert
communicates rejected formats and unreadable FAT chains. Recognized geometry
and root folder names use small text grids and a clearly qualified possible
DotR identifier; no character/card imagery is implied by filename matching.
Candidate DotR directories expand to a short list of file names, sizes and
opt-in, collapsed raw hex prefixes. The previews are clearly qualified as
save research rather than decoded cards and may contain private save bytes.
Save Comparison appears below the existing single-card inspector, not as a
second app route. It has exactly two locally selected .ps2 snapshots and
a deliberate Compare action; outputs are concise per-file status rows with
expandable, bounded **offset-only** differences. Instructions encourage a
one-change experiment and distinguish game state from ancillary checksums,
timestamps and save counters. The report never shows raw byte content.
No file bytes are persisted, uploaded or written back to the input.

Collection is a separate compact inventory surface: owned copy count,
the selected duel deck and Reserve counts appear together. A visual card
list provides explicit **To reserve** and **To deck** actions, and newly won
cards are entered into owned inventory rather than implicitly extending the
40-card duel deck. Existing deck plans stay intact until changed by the user.
Fusion provides a collapsible saved-deck picker for individual Hand/Field
selection without mutating the original deck, sharing canonical art and data.

Simulator is a compact fifth navigation destination for explicit, ephemeral
40-card practice. Its five-card Hand displays canonical artwork in responsive
rows with set-aside and draw-to-five controls. Its Suggested Plays panel
ranks known ordinary fusion sequences by a plainly labeled ATK heuristic and
shows each ordered step. Fusion Workspace avoids duplicate full recipes:
one result receives an inline recommendation label, while multiple results
show compact navigable top-ranked suggestions leading to a single detailed
result and Summon action. Hand transfer is a validated local URL link with
a visible Simulator/Recipes source label, not hidden shared state, and never
mutates saved deck/Collection data.

Fusion Encyclopedia is an independent compact **Recipes** page linked from
Fusion. Users search for an output card, inspect canonical direct material
pairs with authentic thumbnails, see clearly qualified Collection availability
and optionally send a pair to Fusion. Long lists render in batches; special
transformations remain visually and semantically separate from ordinary
fusion. It never mutates deck or Collection storage.

Deck Readiness is an expandable in-page panel within the active Deck Builder,
not a duplicate route or a new deck editor. Native opponent/rank selectors and the
shared CardPicker handle manual context. A compact checklist distinguishes rule
failures from missing information and conditional pass; optional cost pressure
lists are short and read-only. Deck-switching clears ephemeral context.

Deck Leader Reference is a read-only searchable Monster lookup, with a
shortlist of 17 named starter leaders, a concise art/details preview, the
twelve ordered ranks and an explicitly qualified type ability research list.
Selected example rank is hypothetical: no player/save rank is asserted.
Source links and unavailable-evidence notes remain adjacent to reports.
A starter preview links to the corresponding Leader card without modifying
any browser deck data. The layout retains compact warm-neutral cards and
collapses into a single column on narrow screens.

Duel Strategy is a collapsed-by-default inline results-area disclosure
rather than a new screen or a competing recommendation card. Its concise
manual context inputs (known opposing Monster, position and contact-square
terrain) use existing CardPicker and native selects. Ranked previews explain
what the known ATK/DEF comparison can and cannot establish. Fusion options
jump to existing detailed result cards rather than copying recipes or
Summon actions. Unsafe/unverified terrain and unknown opposition have explicit
unknown states. The planning state is ephemeral and never writes user decks.

Opponent Encyclopedia is a two-column searchable reference with a scrollable encounter list
and an in-place selected profile. The list is organized by the player's chosen Rose path;
selected Deck Leader imagery and the canonical notable-card thumbnails reuse CardArtwork.
The selected profile shows Deck Cost, terrains, authored preparation notes, source links,
and an explicit unknown-reward caveat. No modal navigation, user storage, new imagery,
or global state is introduced; narrow screens stack the list and details.

Reincarnation v2 adds an optional in-page source-qualified odds calculator, not a
separate app or replacement for the manual tracker. Two rank selects explicitly
allow unknown values; the top dozen model outcomes reuse local CardArtwork.
A second CardPicker can inspect any desired reward probability (including the
zero-in-model state). Sources, interpretation conflicts and the one-reward-only
scope are adjacent to outputs rather than hidden behind a claim of exact odds.

Reincarnation Guide is a dedicated compact reference at `/reincarnation/`, with a
shared CardPicker, one selected-artwork preview, and an adjacent manual duel tracker.
The tracker visibly caps at five and requires a distinct explicit reset after use.
A research note explains the absence of probabilities and false eligibility claims.
The page uses the existing neutral/rose tokens without extra global state.
Main navigation wraps when space is narrow so the eighth destination stays usable.

Historical acceptance is preserved in [Card Browser report](docs/card-browser-report.md).
Current implementation is described in [UI Foundation report](docs/ui-foundation-report.md).

Fusion and Deck Builder reuse the picker, card imagery, flip tiles, semantic
tokens, and native controls. Fusion uses compact occurrence lists beside automatic
results. Icons and readable labels distinguish direct, chain-only, neutral,
special, and undetermined compatibility. Results use one image/metadata tile per
final card beside ordered text steps; native disclosures reveal alternative
recipes in small batches. A small explicit Summon result action on each ordinary
recipe consumes only its source planning occurrences, places the resulting card
in Summoning Area and exposes one-step Undo; previews remain read-only. Desktop inputs and results sit side by side; mobile
stacks them. Clear, copy, remove and zone movement stay beside the relevant inputs.
Deck Builder centers one active deck with compact selection and creation controls,
an editable name, persistent save feedback, 40-card progress and known cost.
The visual Add cards picker leads into grouped thumbnail rows with quantities and
one-copy controls. Card inspection stays in place; individual copies and composition
use disclosures. Deck options keeps JSON backups and guarded destructive actions
secondary. See
An expandable naming-based starter chooser sits before inline card search,
letting players preview three name-determined Deck Leader options and create a
separate editable 40-card deck without interrupting ordinary card entry.
[Fusion behavior and acceptance](docs/fusion-workspace.md) and
[historical workspace acceptance](docs/workspace-report.md).
