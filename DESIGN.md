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

Historical acceptance is preserved in [Card Browser report](docs/card-browser-report.md).
Current implementation is described in [UI Foundation report](docs/ui-foundation-report.md).

Fusion and Deck Builder reuse the picker, card imagery, flip tiles, semantic
tokens, and native controls. Fusion uses compact occurrence lists beside automatic
results. Icons and readable labels distinguish direct, chain-only, neutral,
special, and undetermined compatibility. Results use one image/metadata tile per
final card beside ordered illustrated steps; native disclosures reveal alternative
recipes in small batches. Desktop inputs and results sit side by side; mobile
stacks them. Clear, copy, remove and zone movement stay beside the relevant inputs.
Deck Builder uses a deck rail beside an editor and card grid. See
[Fusion behavior and acceptance](docs/fusion-workspace.md) and
[historical workspace acceptance](docs/workspace-report.md).
