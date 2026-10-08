# UI Foundation and Card Picker

Historical tooling and picker verification record; current presentation is
documented in [DESIGN.md](../DESIGN.md). Obsolete navigation and image modes have
been removed from this description.

Completed on 2026-10-08 from clean main at `c973fde`.

## Implementation

- Tailwind 4.3.3 through its Vite plugin; Astro 7.3.6, Svelte 5.57.2,
  TypeScript 6.0.3 and Bun 1.4.2 remain pinned. Bun lockfile updated.
- Only local shadcn-svelte Button, Input, Command and Popover primitives remain.
  Generated with CLI 1.7.0, using Bits UI 2.18.0; MIT notice retained. Unused
  generated Dialog/InputGroup/Textarea code was removed. No animation dependency.
- Warm neutral surfaces, dark text, muted rose actions/selection, amber
  unavailable states and clear focus rings. Semantic CSS tokens drive Tailwind,
  primitives and custom cards. See DESIGN.md and the README picker contract.
- Shared shell, active navigation, homepage opening the library,
  and no unimplemented navigation destinations.
- Library: prominent search, native kind/type/attribute filters, removable chips,
  reset, result count and recoverable empty state. Existing punctuation-insensitive,
  multi-token, case-insensitive name and exact numeric/padded-ID matching is reused.
- Tiles show authentic game screens and flip in place to canonical metadata.
  Readable wrapping names remain visible. Unknown stats, absent passwords and
  untranscribed effects remain honest; source/confidence lives in image documentation.
- CardPicker searches the complete supplied BrowserCard catalog, shows the first
  20 real matches with counts, supports clear/no-results, and emits only a numeric
  canonical ID. CardQuickLookup handles navigation outside the picker. Optional
  selectedCardId is included in the trigger's accessible name.
- Command supplies combobox/listbox and keyboard selection; Popover supplies
  Escape/focus behavior. ArrowDown, ArrowUp, Enter and mouse selection work.
  Custom artwork, tile, stats and option components serve actual current flows.
  No global state, zone behavior or Fusion Workspace was added.

## Acceptance and verification

Chrome review at normal 1920px and narrow 1000px desktop widths covered homepage,
active navigation, library image/metadata, filter chips/reset, empty recovery,
and #000, #021, #676, Magic #683, Trap #829 and Ritual #830. The image
and visible game number matched the reviewed available samples. #676 remained
unavailable in grid and picker. No horizontal overflow at the reviewed widths.

Picker checks covered partial/exact/mixed-case names, multiple tokens, 21/021/000,
no matches, clearing, arrows, Enter navigation, mouse selection and Escape returning
focus to its trigger. Visible tile focus and selected-suggestion contrast were
inspected; hover styling was reviewed in source. No separate screen-reader session.
Production static preview confirmed keyboard quick lookup and Ritual filtering.

| Command | Result |
| --- | --- |
| bun ci | Passed, frozen lockfile unchanged |
| bun run data:validate | Passed: 854 cards and existing fusion/starter references |
| bun test | Passed: 105 existing tests, no new tests |
| bun run check | Passed: Astro/Svelte/TypeScript, zero errors or warnings |
| bun run build | Passed: reproduction, validation, tests, checks, 857 static pages |
| bun run images:validate | Passed: 853/854 local assets; content/dimensions/manifests match |
| git diff --check | Passed after removing an extra blank line |

Canonical data, image bytes/manifests, domain logic and tests have no diff. No image
acquisition was rerun. Library JavaScript totals about 247 KiB uncompressed / 74 KiB
gzip across its three generated chunks in that delivery; the shell is not hydrated.
Images remain lazy-loaded with reserved aspect ratios and declared dimensions.

Historical plans/reports were renamed descriptively with their contents preserved.
Existing CI/CD and Wrangler configuration are unchanged. No Cloudflare credentials,
custom domain or deployment were configured. GitHub Actions is triggered by the
normal main push; its final outcome is not awaited.

## Limits and references

#676 identity review, mostly probable image mappings, incomplete effect text and
unresolved screenshot redistribution rights remain existing limitations. The next
workspace can reuse the picker; Summoning Area mechanics still need research.

Integration follows [Astro styling](https://docs.astro.build/en/guides/styling/),
[Tailwind Vite](https://tailwindcss.com/docs/installation/using-vite),
[shadcn-svelte Astro](https://www.shadcn-svelte.com/docs/installation/astro) and
[shadcn-svelte Combobox](https://www.shadcn-svelte.com/docs/components/combobox).
