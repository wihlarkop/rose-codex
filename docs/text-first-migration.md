# Text-first migration · source cleanup and QA

**Approved decision:** Keep Rose Codex text-first. No artwork, local artwork
import, third-party image hotlinks, screenshots as reference material,
card flip, or visual/AI screenshot assistance.

## Scope implemented in PR #31

- Show card facts directly in Card Library; present compact card ID/name in
  search, Fusion, Decks, Duel, and Reference using CardIdentity.
- Replace homepage image showcase with interactive factual card references.
- Remove visual matcher, screenshot UI and tests, legacy flip component,
  853 bundled WebPs, manifests, discovery/acquisition/conversion scripts,
  and related validations.
- Keep the 854-card factual catalog, Fusion rules, Deck Workshop, saved deck
  selection, Duel Companion manual editing, and read-only PCSX2 save inspection.
- Remove runtime image imports, URLs, and asset loading. Preserve independent
  canonical card identity and existing storage formats.

## Distribution caveat

Deleting image files from the **current Git tree** does **not** purge older
commits/branches, forks, caches, prior downloadable archives, or hosted copies.
The public repo was previously published with third-party screenshots.
Before declaring legacy redistribution remediated, separately decide on
backups, history rewrite or a clean new repository, and downstream effects.
Neither operation guarantees deletion of independently held copies.

Third-party code/data licensing also remains an independent review item.
See [source attribution](data-sources.md).

## QA checklist

| Area | Expected behavior |
| --- | --- |
| Home | Fact-based featured card shortcuts, name/ID search; no game images |
| Cards | 854 searchable cards, legible direct metadata and no flip |
| Search | Ctrl/Cmd+K, quick lookup, keyboard and focus unchanged |
| Fusion | Names, IDs, saved-deck material browsing, recipes, Undo |
| Decks | Builder, details, Practice and Collection without visual placeholders |
| Duel | Manual Hand/Field, saved-deck picker and Battle History; no screenshot matcher |
| Reference | Opponents, leaders, reincarnation, save tools remain usable |
| Data/build | Canonical data reproducible; no image downloads, imports or assets |
| UI | Charcoal & Rose, System/Light/Dark, 550px and mobile responsive |
| Persistence | No stale-write, import or storage-contract regressions |

Only merge after CI and local user QA. A separate history/hosting decision is
required before claiming previous distribution of third-party art is resolved.
