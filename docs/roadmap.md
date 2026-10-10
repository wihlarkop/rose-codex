# Rose Codex · Roadmap after UX v2

**Status:** planning backlog, not a commitment to dates or feature completeness.
**Baseline:** UX-01 through UX-07 are merged into `main`. The next milestone is
about stronger evidence and more useful DotR workflows, not another UI overhaul.

This document tracks what was discussed, what is already implemented, and what
must be researched before an implementation PR. Individual changes should
follow the project's existing pattern: scoped work, proportional tests, CI,
local visual acceptance, then merge.

## Completed baseline · candidate v1.0.0

- **Card Library:** 854 canonical IDs, 853 local WebP assets, quick lookup,
  card flip, search/filters and adaptive toolbar.
- **Fusion:** direct/chain discovery, recipe search, conditional suggestions,
  manual Hand/Field instances and explicit handoffs.
- **Deck Workshop:** saved deck editing, generator/optimizer proposals,
  name-based starter preview, practice draws and Collection/Reserve.
- **Duel Companion:** manual battle state, evidence-labeled decisions,
  Battle History and experimental local screenshot matching.
- **Reference:** 20 reported opponent profiles, Deck Leader guide,
  reincarnation tracker/research model and read-only PCSX2 save comparison.
- **UX v2:** six top-level navigation areas, keyboard-friendly search,
  System/Light/Dark appearance, PCSX2 split-screen layouts, integrated
  workspace navigation and regression QA.

**Meaning of v1:** a usable, bounded, *unofficial* browser companion;
**not** a statement that every game mechanic is verified, every image is
licensed for redistribution, the app reads live PCSX2 data, or that the
repository is released under an open-source license.

## Release and source-rights gate · high priority

The application is functional, but its public redistribution posture remains
unresolved. Before a wider public distribution or promotion:

1. Review the source/usage rights of each category of material, especially
   the committed Konami/DotR game screenshots sourced through Yugipedia.
   The wiki's CC BY-SA footer does **not** grant blanket rights to game art.
2. Preserve per-card image URLs, source digests and review status in
   `data/manifests/image-assets.json`, `image-reviews.json`, and
   [the image dataset audit](card-images.md).
3. Keep factual community research distinct from reuse of authored code,
   guide text, datasets and other potentially protected material.
   See [source/reuse decisions](data-sources.md).
4. Retain the local shadcn-derived UI MIT notice at
   `src/components/ui/LICENSE.md`; audit dependencies' own terms separately.
5. Decide whether/when to publish a project-level source-code LICENSE.
   **None is declared currently; do not present the entire app/assets as MIT.**
6. Before creating a `v1.0.0` Git tag, verify the final main SHA and green
   CI. Align package metadata/version if a formal application release is
   planned. A Git tag is a code milestone, not a rights clearance or a
   guarantee of publicly licensed assets.

## Next feature research

### P1 · Character / CPU Deck Library (research first)

**Why:** the existing Opponent Encyclopedia displays reported Deck Leaders,
budget/terrain notes and selected example cards, but **not full verified CPU
decks**.

- Identify primary or well-documented game extracts for each opponent and
  path/region variant; record IDs, deck counts and confidence per claim.
- Compare overlapping sources and flag disagreements/unknown slots. Do not
  pad incomplete lists to 40 or copy walkthrough prose wholesale.
- Only after sufficient evidence, extend **Reference → Opponents** with
  clearly labeled confirmed, reported and unknown cards, then make
  read-only handoffs to Deck Workshop and Duel Companion.
- Acceptance: user can distinguish a full evidenced deck from a sample;
  no invented inventory, rewards, drops or win probabilities.

### P1 · Card/image provenance and catalog quality

- Revisit withheld ID **676** only when original DotR number/artwork is
  verified; do not substitute a generic TCG card or guessed asset.
- Continue targeted, hash-bound source review for the 842 still-probable
  image identities and single-source metadata.
- Prioritize material inaccuracies discovered through actual gameplay;
  retain regional differences and missing card effects as unknown.
- Run deterministic acquisition/reproduction checks for any new inputs;
  track source permissions separately from technical reproducibility.

### P2 · Deck Leader as a real deck property

- Research Deck Leader legality, abilities and rank constraints before
  implementing additional rules.
- Design a migration-safe way to associate an **explicitly chosen** leader
  with a saved deck; current v1 storage intentionally stores names and
  card IDs, not a structured Deck Leader.
- Preserve existing backup, stale-write, import validation and explicit
  user confirmation. A research summary is not a claim about the player's
  in-game rank or save data.

### P2 · Better-grounded duel mechanics and tactical guidance

- Investigate only supported mechanics: known terrain effects, card
  effects, movement restrictions, Summoning Points and reported leader
  abilities, with game/manual evidence.
- Add behavior to deterministic engines only when verified; keep
  conditional/unknown/blocked labels when state is incomplete.
- Do not infer win rates, perfect legality, exact board positions or
  future CPU behavior from approximate heuristics.

### P2 · PCSX2 save structure research (read-only)

- Repeat controlled before/after `.ps2` comparisons using **copies** from
  a known region and reproducible in-game changes.
- Confirm game-specific on-disk structures, offsets, checksums and region
  differences independently before building an inventory/deck decoder.
- Keep file inspection local and read-only. Do not edit save files or
  silently synchronize the Collection from unverified bytes.

### P3 · Everyday usability improvements

- Evaluate opt-in/session-safe Fusion workspace resume across refreshes
  only with clear persistence boundaries and migration/backups.
- Improve context handoffs, keyboard/split-screen usability and measured
  performance based on real user observations—not aesthetic changes alone.
- Add tests for new risky behavior using the repository's established
  patterns; avoid broad suites for unrelated code.

### Deferred · Optional AI/LLM explanation layer

Previously explored as M5-10; **not approved for implementation**.
Revisit only if deterministic data quality and citation/grounding improve,
and privacy, consent, keys, network costs and uncertainty are explicitly
designed. An LLM answer must never be represented as a verified DotR rule
or an observation from PCSX2.

## Working order

**Recommended first effort:** Character/CPU Deck Library evidence audit,
while treating image rights and provenance as a parallel release concern.
The result of the research should decide the implementation scope.
Avoid adding another top-level menu: integrate into the already accepted
six-section navigation.

**Decision log:** New evidence or QA findings can change these priorities.
The completed UX-v2 phase remains archived in
[the approved design/acceptance specification](ux-v2-design-spec.md).
