---
name: Rose Codex
description: Compact visual DotR companion for desktop play
colors:
  background: "#181b20"
  surface: "#22262c"
  elevated: "#2a2f36"
  foreground: "#f1eee8"
  mutedForeground: "#b6b8be"
  border: "#3d424c"
  primary: "#d5a4ad"
  selected: "#44313a"
  ring: "#ecc3ca"
  warning: "#e4bf84"
rounded:
  control: "6px"
  tile: "6px"
---
# Rose Codex interface

A compact tool for recognizing cards while playing DotR on desktop. Charcoal
surfaces and warm off-white text support authentic game imagery; muted rose
marks active navigation, actions and selections. Amber identifies unavailable
imagery. System UI type keeps names readable; numbers use tabular figures.

Tokens in `src/styles/global.css` are the source of truth. Tailwind's inline theme
maps semantic colors and radii to those variables. Spacing follows the small
quarter-rem scale. Prefer existing tokens and utilities over new literal colors.
The custom `app-container` avoids Tailwind's responsive `container` utility.

The shell exposes only the working Cards destination. Content is capped at
1480px with 32px desktop gutters, then 24px on narrow desktops. Tiles have a
190px minimum width, 12px gaps, wrapping names and secondary stats/classification.
The default view preserves the game screen. An explicit artwork view retains
the previously reviewed crop, including the special #065 window. Details always
show the full image. Missing #676 remains an ID-labelled placeholder.

The toolbar offers immediate local search and kind/type/attribute filters,
removable active chips, reset and result counts. Quick lookup uses a visual
Command/Popover picker with prominent keyboard selection and focus. Native
selects remain appropriate for the short filter lists. No animation system,
decorative game assets, speculative navigation or future workspace UI.

Custom CardArtwork, CardTile, CardStats and CardPickerOption components share
image/metadata treatment across actual homepage, library, detail and picker uses.
Astro renders static pages. One library Svelte island owns local interaction;
canonical models/search/game mechanics remain outside presentation components.
Images are local, lazy-loaded and dimensioned. Provenance and confidence remain
available on detail pages.

Historical acceptance is preserved in [Card Browser report](docs/card-browser-report.md).
Current acceptance is recorded in [UI Foundation report](docs/ui-foundation-report.md).
