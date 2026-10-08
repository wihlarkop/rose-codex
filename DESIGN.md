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

Tiles default to the full DotR game screen. In that view, the card name is the
only repeated text because card type, stats, number and deck cost already appear
in the screenshot. The optional artwork view keeps the reviewed crop and shows
classification, monster stats, ID and deck cost. The crop retains the special
#065 window. Detail pages show the full image. Missing #676 remains a clearly
labelled unavailable placeholder.

The toolbar offers immediate local search and kind/type/attribute filters,
removable active chips, reset and result counts. Quick lookup uses a visual
Command/Popover picker with keyboard selection and focus. Native selects remain
appropriate for the short filter lists. Selecting a tile opens a right-side
Quick Inspect panel without changing routes or discarding library state. Its
front follows the selected image view; its back shows canonical metadata. Escape
closes the panel, and the full detail page remains one link away.

CardArtwork, CardFlipTile, and CardPickerOption share
image and metadata treatment across homepage, library, detail and picker uses.
Standard controls use the existing shadcn-svelte primitives; Tailwind handles
routine layout and shared CSS variables define the palette. Custom CSS is limited
to product-specific image crops and the card flip. Astro renders static pages.
Each workspace has one Svelte island owning local interaction; canonical models, search and
game mechanics remain outside presentation components. Images are local,
lazy-loaded and dimensioned. Provenance and confidence remain available on
detail pages.

Historical acceptance is preserved in [Card Browser report](docs/card-browser-report.md).
Current implementation is described in [UI Foundation report](docs/ui-foundation-report.md).

Fusion and Deck Builder reuse the picker, card imagery, flip tiles, semantic
tokens, and native controls. Fusion uses two planning lists beside illustrated
previews; Deck Builder uses a deck rail beside an editor and card grid. Both
stack on narrow screens. See [workspace acceptance](docs/workspace-report.md).
