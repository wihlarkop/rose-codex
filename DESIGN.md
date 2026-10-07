---
name: Rose Codex
description: Compact visual DotR library for desktop play
colors:
  background: "#12191d"
  artworkBackground: "#0b1114"
  surface: "#1a2429"
  control: "#202d33"
  line: "#35434a"
  text: "#edf1f2"
  muted: "#b4c2c9"
  accent: "#e1ba91"
  focus: "#f2cfab"
rounded:
  control: "5px"
  tile: "6px"
---
# Rose Codex interface

## Overview

M1 is an Operate surface: identify a card quickly while playing DotR on desktop.
The user specified a dark, compact, subtle card-focused grid and chose artwork
cropping for tiles with the original full screenshot on detail. No decorative
game assets, animated presentation, modal preview or future tool placeholders.

## Colors

Source: src/styles/global.css. Neutral dark surfaces support the game's varied
artwork; a muted warm accent identifies the brand, card IDs and keyboard focus.

## Typography

System UI type supports dense reading; numeric metadata uses tabular figures.

## Layout

Shared content width 1480px, desktop gutter 24px, small
viewport gutter 12px. Native controls have 42px minimum height and visible labels.

The shell has one real navigation entry, Cards. Grid tiles use a 4:3 artwork
viewport and 170px minimum width; two columns at smaller widths. Names wrap;
IDs remain explicit. Type/attribute and ATK/DEF/deck cost stay secondary. Search
and filters precede results; empty and missing states offer clear recovery.

## Components

One Svelte island filters canonical projections locally. Astro renders the shell
and ID detail pages. Links and controls remain keyboard accessible. Local images
use lazy loading, declared natural dimensions and a fixed artwork viewport.
The one full WebP per ID is clipped for grid display, with no second image set.
Sources/identity confidence remain available on detail. Missing or uncertain
imagery uses an ID-labelled placeholder rather than generic artwork.

Provenance is hash-bound in the image manifests, rather than embedded metadata
that would alter the reproducible converted asset bytes. Screenshot evidence
from acceptance is kept in ignored .impeccable/review/. Browser acceptance and
fresh-review results are recorded in docs/m1-report.md.
