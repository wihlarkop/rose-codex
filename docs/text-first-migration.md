# Rose Codex · Text-first migration and acceptance

**Decision:** Remove game artwork from the *product experience* and from the
future public distributable source. No card flip; no optional user-local artwork,
remote hotlink, per-user artwork import, or automatic card image download.

**Status:** first PR is a **UI/feature prototype**, not a rights-cleared release.
It intentionally does not rewrite Git history or delete the 853 existing
`public/cards/*.webp` files. Those files and the old revisions remain publicly
downloadable until a separate distribution-remediation decision is executed.

## Accepted interaction design to verify

- Card Library: always-visible name, DotR ID, kind, monster type, attribute,
  level where recorded, ATK/DEF, Deck Cost, password and optional effect
  disclosure. **No flip** or image-unavailable placeholders.
- Homepage: information-led featured card references from the canonical
  catalog, retaining Charcoal & Rose, search, and task shortcuts.
- Global and local card pickers: compact ID plates and names, not game art.
- Fusion, Deck Workshop, Duel, Reference and opponent flows: retain data,
  numbers, provenance labels, safe writes, keyboard behavior, and existing
  handoffs. An Inspect action can expand facts; it does not flip an image.
- Screenshot Assistant: not offered as a working tool. Its visual-matching
  behavior depends on the unlicensed reference-image corpus.
- Responsive: check full desktop, ~550px PCSX2 split-screen, narrow mobile,
  System/Light/Dark modes, keyboard, focus, reduced motion.

The browser card projection intentionally emits `image: null` so no artwork
paths are used by the running UI. The temporary `CardArtwork` compatibility
component displays card **identity text only**.

## Mandatory work before releasing/distributing an artwork-free source

1. **Remove bundled assets:** all 853 committed WebP files, any other protected
   images/icons/screenshots found in the project, and broken direct URLs.
2. **Detach artwork pipeline:** stop importing `data/canonical/images.json`
   into runtime pages, stop regenerating or validating third-party image
   binaries in the default build and CI; update scripts/manifests/tests/docs
   appropriately without changing canonical game identity/fusion facts.
   Preserve attribution/evidence docs only as appropriately scoped references.
3. **Review third-party rights:** a no-artwork UI does not itself clear licensing
   questions around any copied prose/code/data. Retain the shadcn-derived MIT
   notice and assess other dependencies separately.
4. **History/hosting remediation:** decide between a carefully reviewed Git
   history rewrite and a new clean public repository; take backups and plan
   clone/fork/tag/PR effects first. Current public history, forks, caches,
   downloads and prior builds cannot be assumed erased merely by a new commit.
   Verify old tags/releases and hosted builds independently.
5. **Check a fresh clone and final build:** the distributable checkout, Git
   archives, output `dist/`, and generated data must contain no bundled DotR
   image bytes and must not fetch them over the network.
6. **Release gate:** CI success and user QA are prerequisites to merging the
   text-first UI PR. Image-removal plus distribution review are prerequisites
   before claiming a public release has no copyrighted bundled artwork.

## Manual smoke matrix for this UI prototype

| Area | Expectation |
| --- | --- |
| Home | No game images; featured references show real IDs and stats, remain clickable |
| Cards | No flip or blanks; 854 results; type and stats legible on narrow width |
| Quick lookup | Keyboard search navigates and focuses the matching metadata tile |
| Fusion | Workbench, results, recipes and saved-deck selection retain labels and actions |
| Decks | Build, Inspect, Practice and Inventory use text identity and preserve saved state |
| Duel | Saved deck choice, Hand/Field and Battle History behave as before; Screenshot Assistant absent |
| Reference | Opponents, Deck Leaders and Reincarnation readable with ID text badges |
| Themes & input | Light/Dark/System; 550px + mobile; visible focus; no sideways overflow |

Do not tag or merge this branch purely because the product no longer visibly
renders artwork: rights and distribution cleanup remain unfinished.

See [the feature roadmap](roadmap.md) and [source rights review](card-images.md).
