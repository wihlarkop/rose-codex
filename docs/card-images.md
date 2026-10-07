# Card image research

Inspected on 2026-10-08. No image collection was downloaded or committed. One Blue-Eyes White Dragon sample was downloaded to the OS temporary directory for visual inspection; it is not an application asset.

## Sources inspected

| Source | Contribution and limitations |
| --- | --- |
| [Yugipedia English DotR gallery](https://yugipedia.com/wiki/Gallery_of_Yu-Gi-Oh!_The_Duelists_of_the_Roses_cards) | Wiki gallery with explicit DotR numbers, names, and image links, including #000 Blue-Eyes White Dragon, #021 Baby Dragon, and #853 Dark Magic Ritual. This provides an ID association rather than an implicit gallery-order guess. It remains a community source. |
| [Blue-Eyes original image](https://ms.yugipedia.com/7/71/BlueEyesWhiteDragon-DOR-EN-VG.png) | A visually inspected 579 x 462 PNG showing the game's library screen: NUMBER 000, monster classification, attribute, ATK/DEF, summoning level, rank, and deck cost. This is a DotR screen render, not a modern TCG scan. Text is visibly softened; dimensions alone do not establish high quality. |
| [Yugipedia Blue-Eyes file page](https://yugipedia.com/wiki/File:BlueEyesWhiteDragon-DOR-EN-VG.png) | Attempted to inspect rights/source metadata; live access was blocked by a Cloudflare challenge. Its specific copyright/reuse status remains unresolved. The Baby Dragon file-detail page was also unavailable through the browsing tool. |
| [Yu-Gi-Oh! Wiki/Fandom DotR gallery](https://yugioh.fandom.com/wiki/Gallery_of_Yu-Gi-Oh!_The_Duelists_of_the_Roses_cards) | Another community gallery with explicit DotR numbering. Similar organization is not proof that it is an independent image collection or independent verification of Yugipedia. No images or wiki prose were copied. |
| [YGOPRODeck official API documentation](https://ygoprodeck.com/api-guide/) | Documents card-image and alternate-artwork URLs. Its card IDs are its own card database identifiers, not DotR numbers. Consider only a generic-artwork fallback after an explicit crosswalk and manual artwork review. |

The gallery's `DOR-EN-VG` image naming supports selecting the intended game/language variant. Sample inspection corroborates this for card 000 only; it is not an audit of 854 image contents. The gallery does not by itself prove every link is live, every ID has unique artwork, or every asset has equivalent quality. Do not claim zero missing cards or no duplicates without a manifest audit. [Gallery evidence](https://yugipedia.com/wiki/Gallery_of_Yu-Gi-Oh!_The_Duelists_of_the_Roses_cards).

The generic fallback is materially different: YGOPRODeck exposes full-card, small-card, and cropped-art URLs plus alternative artworks. Its documented schema has no DotR ID field. The provider instructs consumers to store data locally and rehost images instead of continual hotlinking. Those delivery instructions do not establish ownership of Konami artwork or a blanket artwork redistribution license. [Provider documentation](https://ygoprodeck.com/api-guide/).

## Mapping convention

Use local `public/cards/000.webp` through `public/cards/853.webp` when an acquisition phase is approved. The number is the canonical card ID, left-padded to three digits. File slugs and names never establish identity.

The manifest should be a static JSON array or ID-keyed object; use the established project manifest type. A conceptual entry is:

```json
{
  "cardId": 21,
  "file": "021.webp",
  "source": null,
  "status": "missing"
}
```

The implemented canonical manifest reserves `file: "021.webp"` even when missing; the status determines availability. An acquired, reviewed entry uses its exact original `source` URL and `status: "verified"`. Here **verified means identity/content mapping was reviewed**, not permission to redistribute. Keep rights notes separately in provenance. Use `manual-review` for uncertain identity/artwork and `missing` when there is no local asset. `probable` is an available schema state; no M0 entry uses it. All 854 M0 entries are missing. The next acquisition phase must establish reviewed manifest inputs before extending the generator, which currently produces these missing records deterministically.

Import explicit gallery ID labels with their adjacent image links. Reject duplicate IDs and out-of-range labels. Compare the source's displayed name to canonical metadata as a review aid; never join production data on names. Inspect screenshots' visible NUMBER where available. Validate local filename, actual format, dimensions, and file existence before marking an entry verified.

Name matching is a development aid with an explicit crosswalk: punctuation (`Harpie's`, `#1`), abbreviations (`Red-Eyes B. Dragon`), wiki spellings (`Contruct of Mask`), alternate names, and future duplicate-name cases must not generate silent guesses. Cropped artwork from a TCG source must retain a source-kind distinction from an in-game DotR render.

## Rights and next acquisition step

Yugipedia's page footer says wiki content is Creative Commons Attribution Share Alike unless otherwise noted. That is not sufficient evidence that game screenshots/artwork are CC-licensed. No first-party Konami grant to redistribute this artwork was established during M0. Record asset-specific rights/source metadata before bulk acquisition; consult the uploader/source policy rather than treating a public image URL as permission. [Gallery footer](https://yugipedia.com/wiki/Gallery_of_Yu-Gi-Oh!_The_Duelists_of_the_Roses_cards).

The next image task should verify a small set across monster, Magic, Trap, Ritual, and game-specific cards, establish source permissions and quality, then produce a reviewed ID manifest. A deterministic conversion/download command can follow that decision. The shipped site should load local files only; it should not call wiki/CDN/API endpoints at runtime. M0 recommends Yugipedia's explicit DotR-ID gallery as the strongest investigated mapping candidate, with rights and completeness unresolved and YGOPRODeck reserved for clearly labeled generic artwork fallback.
