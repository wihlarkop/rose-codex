# Opponent Encyclopedia v1

The read-only /opponents/ page covers **20 campaign encounters**: 10 for joining the Red Rose (Yugi/Lancastrian alliance, opposing the Yorkists) and 10 for joining the White Rose (Seto/Yorkist alliance, opposing the Lancastrians). The final encounter, Manawyddan fab Llyr, is deliberately separate for each route: the community guide reports different Deck Leaders, Deck Costs, and cards for those two variants.

## Evidence and limitations

- Main source: [KeyBlade999's DotR walkthrough (2012)](https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/63791), sections Five and Six (Red and White Rose). Player-authored single source, not extracted from the disc or PCSX2. An independent [Yugipedia game overview](https://ftp.yugipedia.com/wiki/Yu-Gi-Oh%21_Duelists_of_the_Roses) and [Manawyddan character page](https://yugioh.fandom.com/wiki/Manawyddan_fab_Llyr) corroborate two paths and different final-boss forms, but not every deck fact.
- Curated facts: encounter name, path joined, location, reported total Deck Cost, Deck Leader ID, reported board terrains, and **three selected examples** from that opponent's reported deck. They are neither a complete deck nor a suggested drop list.
- Card IDs resolve against the existing canonical DotR dataset and reuse its local images. Community guide spellings (such as the Red-Eyes and Ultimate Dragon ritual names) have been matched to existing canonical IDs. The full walkthrough and implementation code were not copied.
- Short strategy notes are original, conditional preparation guidance based on the reported cards and map. Not a gameplay simulation or verified optimal duel solution.
- No opponent character portraits have been acquired. List/detail art is visibly labeled Deck Leader **card artwork**, not character portraits.
- Card rewards and slot odds are unknown. Being listed in an enemy deck is not evidence a card is obtainable as a drop. No invented drop probabilities, hidden card claims, or verified leader abilities.

## Route and UX

- Static Astro /opponents/ route, single Svelte island, reused canonical card/images, no backend, external requests or new dependencies.
- Search opponent names/locations and filter the Rose path **joined**; select an encounter without leaving the page. A validated ?opponent=known-id link may open the specified profile; unknown IDs fall back safely.
- Read-only. No new saved state; deck, Collection, Fusion and Reincarnation remain unaffected.
- Detail displays selected Deck Leader, reported Deck Cost and terrains, three ID-matched sample cards, strategic considerations, source and reward caveat.

## Tests and acceptance

Two focused Bun tests ensure 20 unique encounter IDs, 10 per side, distinct final bosses, searchable profiles, all Deck Leaders resolve to monsters and every highlighted card ID resolves in canonical data. The normal CI covers formatting, static checks and build.

Manual acceptance:
1. Open /opponents/, switch Both / Red / White: expect 20 / 10 / 10.
2. Search Kaiba and Stonehenge; use unmatched search. Choose Seto and confirm Blue-Eyes, 1,184 Deck Cost, reported terrains and sample cards.
3. Compare ?opponent=guardian-red against ?opponent=guardian-white: Skull Knight / 1,985 versus Chakra / 1,854.
4. Inspect card art, selection accessibility, keyboard input, narrow viewport stacking, source disclaimer, no guaranteed drop claims.
5. Confirm navigating to Leaders works and existing decks, collection, fusion, reincarnation do not change.
