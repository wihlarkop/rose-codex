# Data sources and reuse decisions

Inspected 2026-10-08. Rose Codex is an unofficial game companion. DotR identity
and mechanics take priority over modern TCG conventions. References establish
evidence, not blanket accuracy or permission to reuse their implementation.

## Game/community sources inspected

| Source URL | Classification; contribution; reuse/licensing limits |
| --- | --- |
| [Eenkin repository](https://github.com/Eenkin/dotr-fusion-simulator/tree/91613ec9851a7a75744c1f2c7e4b342514ba315f) | Community research/application. Inspected at commit `91613ec9851a7a75744c1f2c7e4b342514ba315f`; no LICENSE/COPYING file, GitHub license metadata null. Public source is not an open-source grant. |
| [GitHub repository metadata](https://api.github.com/repos/Eenkin/dotr-fusion-simulator) | First-party hosting metadata; checked license status and repository revision. Not a game-data authority. |
| [cardList.js](https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/cardList.js) | Factual card metadata, compatible equip IDs and starter lists. Imported only names, numeric/enumerated facts, IDs, and whether effect text was recorded. Effect/fusion prose, CPU decks, slot pools and source helper code are omitted. Metadata mostly single-source. |
| [fusionList.js](https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/fusionList.js) | Resolved factual pair outcomes. Converted into first-party ID-set predicates and separate transformations. Redundant lookup arrays and implementation source omitted. |
| [fusionSimulator.js](https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/fusionSimulator.js), [forwardFusions.js](https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/forwardFusions.js) | Behavioral references for unordered pairs, successful chain folding and forward lookup. DOM, permutation enumeration, implementation code and presentation omitted. |
| [deckBuilder.js](https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/deckBuilder.js) | Starter-list semantics and the unresolved Serpentine Princess warning. No deck UI/code copied. |
| [starterDeckSim.js](https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/starterDeckSim.js) | Naming behavior comparison and group/leader matching. Reimplemented from encoding research; no code copied. |
| [reincarnation.js](https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/reincarnation.js) | Rank/range calculation and eligibility research; disagreements documented. Implementation and eligibility table not imported. |
| [existing application](https://eenkin.github.io/dotr-fusion-simulator/), [fusion reference](https://eenkin.github.io/dotr-fusion-simulator/fusion_list), [naming simulator](https://eenkin.github.io/dotr-fusion-simulator/naming_simulator), [reincarnation calculator](https://eenkin.github.io/dotr-fusion-simulator/reincarnation_calculator) | Community behavior/docs; supported input, original-stat fusion patterns and random outcomes. No frontend content or assets copied. |
| [GMS reverse-engineering notes](https://www.speedrun.com/yugiohdotr/forums/ch2hb) | Primary community research, not Konami. Naming example, starter choices and reincarnation description; no explicit reuse license observed. Mechanics summarized and independently implemented where supported. |
| [DotR character encoding](https://pastebin.com/znxgzEct) | Primary reverse-engineering character-code facts. Used to author the name-entry map; dialogue/control symbols excluded. No implementation code. |
| [extracted fusion spreadsheet](https://docs.google.com/spreadsheets/d/1N1Q5uf3Xbf1KyWx0iI3REoQi7NrqdwSHb0oR06UH-LE/edit#gid=737412572), [CSV](https://docs.google.com/spreadsheets/d/1N1Q5uf3Xbf1KyWx0iI3REoQi7NrqdwSHb0oR06UH-LE/export?format=csv) | Primary extraction publication; full 26,540-pair comparison. No explicit reuse license exposed; factual comparison only, raw CSV not committed. Capture digest/method in fusion-research.md. |
| [GMS extraction announcement](https://gamefaqs.gamespot.com/boards/589455-yu-gi-oh-the-duelists-of-the-roses/75370421) | Primary author's explanation of the game's actual array and its exceptions. No forum prose copied. |
| [DotR reverse-engineering structs](https://github.com/GenericMadScientist/DotR-Documentation/blob/master/structs.h) | Primary reverse-engineering note supporting separate transformation/equip semantics. No C source, game binary, structs or implementation imported. No code license relied upon. |
| [Yugipedia numbered list](https://yugipedia.com/wiki/List_of_Yu-Gi-Oh!_The_Duelists_of_the_Roses_cards), [gallery](https://yugipedia.com/wiki/Gallery_of_Yu-Gi-Oh!_The_Duelists_of_the_Roses_cards) | Wiki research: card count/range and explicit image-number labels. List access was intermittent/robots-limited; indexed statement and gallery corroborate numbering. Wiki footer CC BY-SA unless otherwise noted; this does not license game artwork. |
| [000 Blue-Eyes](https://yugipedia.com/wiki/Blue-Eyes_White_Dragon_(DOR)), [829 Mirror Wall](https://yugipedia.com/wiki/Mirror_Wall_(DOR)) | DotR-specific wiki samples cross-check IDs, stats/classification/cost/password. Facts in card-checks.json; no wiki effect prose copied. Same wiki license limitation. |
| [Baby Dragon DotR page](https://yugipedia.com/wiki/Baby_Dragon_(DOR)), [wiki starter-deck page](https://yugipedia.com/wiki/Yu-Gi-Oh!_The_Duelists_of_the_Roses_Starter_Decks), [wiki fusion page](https://yugipedia.com/wiki/Yu-Gi-Oh!_The_Duelists_of_the_Roses_Fusions) | Attempted inspection; inaccessible through the browsing tool. These are not counted as corroborating evidence or import inputs. Modern Baby Dragon TCG page appeared in search and was not used as DotR data. |
| [Summoned Lord Exodia](https://yugioh.fandom.com/wiki/Summoned_Lord_Exodia), [Fandom gallery](https://yugioh.fandom.com/wiki/Gallery_of_Yu-Gi-Oh!_The_Duelists_of_the_Roses_cards) | Wiki research on special record 671 and alternate image mapping. CC BY-SA footer, shared-history/source-independence uncertainty; no prose/assets imported. |
| [Yugipedia Reincarnation](https://yugipedia.com/wiki/Reincarnation) | Wiki description of feature/availability, CC BY-SA unless otherwise noted; no probability implementation inferred from it. |
| [ladd28 research report](https://www.reddit.com/r/yugioh/comments/wkjwqu/i_made_some_gameshark_codes_to_make_duelists_of/) | Primary community reverse-engineering claim about eligibility. No cheat codes/implementation/table copied; not a validation of distribution constants. |
| [CloudStryfe guide](https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/22437), [Neoseeker card-guide index](https://www.neoseeker.com/yugioh-duelistrose/faqs/131290-yu-gi-oh-dotr-card-a.html) | Established author guide / secondary host. Older fusion heuristics illustrate why thresholds should not override extracted outcomes. Neoseeker inspected via search metadata only. No guide prose/data imported or reuse license relied upon. |
| [YGOPRODeck API guide](https://ygoprodeck.com/api-guide/) | First-party provider documentation for generic artwork fallback. Its identifiers are not DotR IDs; no API dataset/images imported. Rehosting advice is not an artwork license. |
| [Blue-Eyes image sample](https://ms.yugipedia.com/7/71/BlueEyesWhiteDragon-DOR-EN-VG.png), [file-detail page](https://yugipedia.com/wiki/File:BlueEyesWhiteDragon-DOR-EN-VG.png) | One temporary screenshot inspected; file-detail rights metadata blocked. No image committed. Quality/completeness/rights unresolved; see card-images.md. |

## Technical sources inspected

- [Astro Svelte integration](https://docs.astro.build/en/guides/integrations-guide/svelte/),
  [Astro CLI](https://docs.astro.build/en/reference/cli-reference/): official static
  project integration/checking and telemetry guidance.
- [Bun installation](https://bun.sh/docs/installation), [release index](https://bun.sh/blog):
  official stable version; local installed 1.4.2 matched. Installed Bun types
  document the built-in YAML parser used for syntax inspection.
- Official npm registry metadata for Astro, @astrojs/svelte, Svelte,
  @astrojs/check, TypeScript, @types/bun, svelte-check and Wrangler: exact versions,
  engines and peer ranges. TypeScript 6.0.3 chosen because checkers/integration
  do not support the current TypeScript 7 range.
- [Workers Static Assets start](https://developers.cloudflare.com/workers/static-assets/get-started/),
  [Wrangler config](https://developers.cloudflare.com/workers/wrangler/configuration/),
  [SSG routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/),
  [GitHub Actions auth](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/):
  official configuration, routing, deployment and credentials.
- [actions/checkout](https://github.com/actions/checkout) v6 and
  [oven-sh/setup-bun](https://github.com/oven-sh/setup-bun) v2: published action tags
  resolved using Git, recorded as full SHAs in the workflow.

## Capture, reuse and confidence policy

### M1 image sources

The [public gallery parse API](https://yugipedia.com/api.php?action=parse&page=Gallery_of_Yu-Gi-Oh%21_The_Duelists_of_the_Roses_cards&prop=wikitext%7Cimages&format=json)
and MediaWiki `query/imageinfo` API were inspected directly. These are wiki
research/file metadata, not first-party game or rights-holder sources. Gallery
revision 5222290 supplies 854 explicit ID/name/file associations; imageinfo
supplies 853 original URLs, source dimensions and exposed license/usage fields.
The normalized per-ID capture, exact queries and limitations are recorded in
image-discovery.json, image-discovery-report.md and card-images.md. Historical
`parse/oldid` returned HTTP 403; current-page discovery succeeded and checks its
revision. No access challenge was solved or bypassed.

M1 downloads these public original URLs through separate development tooling,
retains ignored originals, and commits optimized accepted DotR screenshots.
Image 065's gallery file has no metadata. Its
[DotR card page](https://yugipedia.com/wiki/Necrolancer_the_Timelord_(DOR))
explicitly provides number 065 and a DOR-NA-VG image; public imageinfo resolves
[the reviewed original](https://ms.yugipedia.com//2/23/NecrolancertheTimelord-DOR-NA-VG.png).
The override records that association and the visual review binds name/NUMBER to
its SHA-256. 676's portrait source is withheld for review.
Individual source URLs/digests and optimized-byte digests are preserved in
image-assets.json/canonical images.json. Visually checked identities are bound
to original-byte hashes in image-reviews.json. Most image content remains
explicitly probable, not individually verified. No modern-artwork fallback,
game binary, decorative Konami assets or wiki prose is imported.

Exposed image license/usage metadata did not establish a redistribution grant.
Optimizing/rehosting does not create one; game imagery is not declared CC-licensed.
See card-images.md for the repository decision and remaining rights review.
Technical conversion references are official
[Sharp installation](https://sharp.pixelplumbing.com/install/),
[WebP/metadata options](https://sharp.pixelplumbing.com/api-output/) and
[Bun Node-API support](https://bun.sh/docs/runtime/node-api). Sharp 0.35.5 is pinned
as a direct dev dependency rather than relying on Astro's optional transitive one.

`data/manifests/sources.json` records revision, URLs by path, licensing status and
SHA-256 bytes for the two acquisition inputs. Raw source stays ignored. Generated
JSON contains selected factual game fields and derived factual ID relationships;
it does not redistribute community implementation or wholesale descriptions.
Pure TypeScript algorithms and normalization/compression code are first-party.

This distinction is a reuse decision, not a finding that every third-party
collection has a permissive license. No blanket license is asserted for game
data, artwork, or unlicensed reference code. Implementation code is not copied;
M1's public game-screenshot acquisition and unresolved-rights repository decision
are explicitly documented above and in card-images.md. All omitted material is
listed above; no unexplained scraped dataset enters the browser runtime.

Source agreement may reflect shared research. Region differences, 671's missing
stats, incomplete fusion tags, untranscribed effects, starter-list warning,
reincarnation discrepancies and random-transformation pools remain explicit.
Validation proves structure/reference integrity and reproduction; it does not
prove every fact against the original PS2 game.
