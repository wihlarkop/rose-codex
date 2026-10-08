# M0 implementation plan

The user's M0 specification supplies the architecture, implementation scope,
verification commands, and authorization to commit and push to main. Implement
in this checkout, preserving the initial README's repository identity.

1. Research DotR identity, card fields, fusion behavior, naming, starter decks,
   reincarnation, images, source licensing, and current static hosting guidance.
2. Initialize Astro static output, strict TypeScript, Svelte integration, Bun
   1.4.2, and a minimal proof-of-build homepage. Pin compatible packages.
3. Define first-party types in `src/lib/dotr/model.ts`; acquire pinned raw files
   only through explicit tooling. Parse literals without evaluating source.
   Normalize factual fields to JSON; omit unlicensed effect prose. Keep known
   incomplete library records explicit. Validate all ID relationships.
4. Test naming against the published CM Punk example, boundary cases, and the
   character map. Implement pure `starterDecksForName` returning leader IDs.
5. Separate generic fusion predicates from resolved base-card outcomes; record
   source confidence and nondeterministic outcomes. Test rules, chains, lookup,
   malformed references, and disagreement between rule and outcome data.
6. Add deterministic generated-file comparison, fail-closed data validation,
   tests and framework/type checks to the production build and GitHub Actions.
   PRs verify only; main deploys only after successful verification, using the
   exact built assets and Bun-managed Wrangler. Missing credentials are reported.
7. Document schema, coverage, uncertainties, image convention, and deployment
   setup. Independently review; run all required checks; commit one coherent M0
   change and push normally. Inspect the resulting GitHub Actions run.

Review focus: unknown fields/enum values; ID 671's incomplete stats; unsupported
name characters and overlength input; randomized fusion outcomes; stale data or
PR events accidentally reaching deployment. No real product UI in this milestone.
