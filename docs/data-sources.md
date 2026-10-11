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
| [GMS reincarnation reward exclusions](https://pastebin.com/VH4Yw8Xw) | Published NTSC-U community reverse-engineering list of 167 reward-excluded **card IDs** (2017); first-party numeric transcription for a qualified research model, not copied program code. Independently published reference-app eligibility list is its exact complement, but the in-game table has not been directly revalidated. |
| [ladd28 research report](https://www.reddit.com/r/yugioh/comments/wkjwqu/i_made_some_gameshark_codes_to_make_duelists_of/) | Primary community reverse-engineering claim about eligibility. No cheat codes/implementation/table copied; not a validation of distribution constants. |
| [KeyBlade999 DotR walkthrough (2012)](https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/63791) | Single community walkthrough used for 20 Red/White story encounters: factual names, locations, Deck Leaders, total enemy Deck Costs, board terrain notes, and selected example deck cards. Research may contain typos or inaccuracies and has not been compared against a game binary. We did not import complete lists, prose strategies, reward tables, or any implementation code. Source attribution and caution appear in-app. |
| [CloudStryfe guide](https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/22437), [Neoseeker card-guide index](https://www.neoseeker.com/yugioh-duelistrose/faqs/131290-yu-gi-oh-dotr-card-a.html) | Established author guide / secondary host. Older fusion heuristics illustrate why thresholds should not override extracted outcomes. Neoseeker inspected via search metadata only. No guide prose/data imported or reuse license relied upon. |

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

### Current text-only reuse boundary

The shipped source contains canonical card, fusion and starter facts derived
from pinned research inputs. External authored program code, effect prose,
game screenshots and the former image pipeline are not included.
The repository used to contain third-party screenshots: deleting files from
current commits does **not** remove historical or redistributed copies.
No claim of blanket rights to those older assets is made.

`data/manifests/sources.json` records pinned source revisions and SHA-256
hashes for two research input files, used to reproduce factual JSON.
Raw research sources are ignored by Git and not executed as JavaScript.
Generated facts and first-party algorithms are distinct from copyrighted
source implementations; their provenance and confidence are documented here.

Source agreement may reflect shared research. Region differences, card 671's
missing stats, untranscribed effects, ambiguous starters, and mechanics
disagreements remain explicit. Validation proves structural consistency,
not every fact against the game itself.

## PS2 memory card research (2026-10-10)

| Source | Use and caution |
| --- | --- |
| [PCSX2 official Memory Cards guide](https://pcsx2.net/docs/configuration/memcards/) | Confirms File Memory Cards are `.ps2` images (8/16/32/64 MB), distinguishes folder memory cards, and documents how to locate the configured `memcards` directory. Supports a read-only browser file picker and explicit refusal to parse other formats. |
| [Ross Ridge PS2 filesystem documentation, distributed by PCSX2](https://github.com/PCSX2/pcsx2/blob/master/pcsx2/Reference/PS2-MemoryCardFileSystem.htm) | Public-domain technical description of superblock layout, physical page/spare structure, directory records and indirect FAT. First-party parser was written independently from the format description; no library code or game save files copied. |
| [DotR community NTSC-U/C save resource](https://www.speedrun.com/yugiohdotr/resources/46vto) | Documents a PCSX2 `.ps2` image and an exported save named `SLUS-20515~.psu`. Folder-name matching is a heuristic for **potential** DotR saves only; region, save validity and game state have not been independently verified. |

| [GMS DotR NTSC-U SaveData RAM structures](https://github.com/GenericMadScientist/DotR-Documentation/blob/master/structs.h) and [RAM map](https://github.com/GenericMadScientist/DotR-Documentation/blob/master/ram-map.md) | Direct evidence for 854 CardInfo records and three main decks in **RAM**; explicitly **not** documentation of PS2 memory-card payload serialization. No game-save offsets, rank interpretation, card ownership counts or checksums inferred from RAM addresses. |
