# M0 delivery report

Local implementation verified on 2026-10-08. Publication commit SHA, push result,
and live GitHub Actions result are reported in the final delivery message because
a commit cannot contain its own SHA. This file describes the implementation that
adds it. No real Cloudflare deployment was executed.

| Requested item | Result |
| --- | --- |
| 1. Repository before work | Clean main checkout; only README.md; origin wihlarkop/rose-codex; initial commit `6cdb65fa9942d99edba95092d0c046897f8d9fed`; no applicable checkout AGENTS.md. |
| 2. Bun | 1.4.2, pinned in .bun-version, packageManager and engines; used for installation, tooling, tests, framework CLIs and Wrangler. |
| 3. Project versions | Astro 7.3.6; @astrojs/svelte 9.0.1; Svelte 5.57.2; TypeScript 6.0.3; @astrojs/check 0.9.10; svelte-check 4.7.6; Wrangler 4.148.0; @types/bun 1.4.2. Exact direct dependency pins. |
| 4. Structure | data/raw (ignored captures), data/manifests, data/canonical, scripts/data, docs, public/cards, src/pages, src/lib/dotr, GitHub workflow; minimal homepage and static 404. |
| 5–6. Research and sources | Seven requested Eenkin scripts; live reference/naming/fusion/reincarnation pages; primary GMS reverse engineering, encoding, fusion table/announcement; DotR wiki/card/gallery samples; established guide; image provider; official Astro/Bun/Cloudflare/action metadata. Full inspected/attempted inventory: data-sources.md. |
| 7. Licensing/provenance | Eenkin has no declared license. Raw implementation ignored and never evaluated. First-party algorithms; selected factual game fields/ID relationships derived with pinned revision and hashes. Effect prose, source implementation and images not copied. No blanket game/artwork redistribution license asserted. |
| 8. Card schema | Required identity/kind, nullable non-applicable stats, 21 monster types, six attributes, separate trap range/Magic class, string passwords, effect transcription status, game-specific tags and compatible power-up IDs. See card-schema.md. |
| 9. Count/range | 854 contiguous numbered library entries, 000..853, corroborated by list/gallery and source array; excludes story Rose cards, includes special 671. |
| 10. Card coverage | 854 records: 683 monster-class, 118 Magic, 29 Trap, 24 Ritual. 734 passwords. Most fields single-source; two wiki samples cross-checked. 452 effect descriptions deliberately untranscribed; missing-source descriptions not declared effectless. |
| 11. Fusion findings | Game stores resolved original-card pairs. Type/category/attribute/ATK patterns have gaps and exceptions. Modified battle ATK/type does not change researched identity outcomes. No invented generic precedence. |
| 12. Fusion representation | Two finite ID-set predicates → result ID; lossless compression of actual table rows. Special power-up pairs and card/random outcomes stored separately. |
| 13. Fusion coverage | All 26,540 extracted ordinary pairs → 153 predicates / 95 result IDs; 13 additional transformations, eight deterministic and five unknown-pool random outcomes. Whole-table agreement recorded, with shared-provenance/region limitations. |
| 14. Naming implementation | Pure game-code remainder arithmetic, twelve-slot padding value 14, modulo 16; returns canonical leader IDs. Rejects unsupported/empty/overlength input, retains case/spaces, no DOM/framework dependency. |
| 15. Naming regressions | Published CM Punk → 9 → 458/132/266; independently calculated cases, all groups, code/punctuation/case/space behavior, twelve-character boundary, bad characters and mutation isolation. |
| 16. Starter data | 16 ordered groups of three choices, 17 forty-card lists, separate leader IDs; all references validated. Deck lists single-source; 458 list flagged manual-review. |
| 17. Reincarnation | Research/model/feasibility documented. Implementation deferred: max versus summed A/B ranks and high cost range disagree. RNG/three-award mechanics and eligibility still need evidence. No canonical eligibility table or calculator. |
| 18. Images | Explicit-number Yugipedia DotR gallery is strongest researched mapping. One temporary in-game screenshot inspected; no collection committed. All 854 manifest entries missing; future assets 000.webp..853.webp. YGOPRODeck only a generic-artwork fallback; rights/quality/completeness unresolved. |
| 19. Pipeline | Explicit hashed acquisition → nonexecuting JSON-literal parser → first-party normalization → strict validation → deterministic committed JSON. No runtime third-party requests. |
| 20. Validation | Exact card range/count, unique identity/name, strict fields/enums/numeric/null semantics, passwords, ID references, nonempty/nonoverlapping predicates, exact researched coverage, starter groups/deck lengths, image mapping/provenance/existence, sampled independent card facts. Reincarnation references not applicable. |
| 21. Lockfile | bun.lock generated, exact workspace specs synchronized, frozen bun ci passed. No npm/pnpm/yarn lockfile or alternate test framework. |
| 22. CI | PRs/main pushes; one fast job; SHA-pinned checkout/setup-bun; bun ci, pinned acquisition and exact-byte regeneration comparison, validation, bun:test, framework/type checks, guarded static build. |
| 23. CD | Later step in same successful job, main push only, just-built dist assets; missing credentials produce notice and intentional skip. No PR deployment or unverified build path. |
| 24. Cloudflare/Wrangler | Static assets directory ./dist; no main Worker/adapter/SSR/bindings; compatibility date 2026-10-08; static 404 handling. Dry run passed. Windows bunx --bun path issue documented; direct installed entry point runs under Bun. |
| 25. Secrets | CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID repository secrets, as current official guidance requires. No values committed or needed by browser runtime. |
| 26. Real deployment | Intentionally not executed. Repository secret list is empty; no Cloudflare environment credentials found; existing local OAuth session expired and could not refresh noninteractively. Custom domain deferred. |
| 27. Verification | Full results below. Initial implementation failures were diagnosed and corrected; no failing product check remains. Independent review found one freshness gate gap, corrected and behavior-probed. |
| 28–29. Commit/push | One coherent conventional foundation commit; normally pushed to main; exact SHA, push and workflow result in final delivery message. |
| 30. Unknowns | Full metadata/gameplay/region audit, effect transcription rights, 671 missing stats, incomplete tag taxonomy, Serpentine starter warning, randomized transform pool/weights, equip/ritual/failed-chain semantics, reincarnation discrepancies/eligibility, image rights/completeness, Cloudflare credentials and custom domain. |

## Verification evidence

| Command or probe | Result |
| --- | --- |
| bun ci | Pass; reproducible installation against bun.lock. |
| bun run data:fetch | Pass; two pinned byte hashes verified; cache rechecked on subsequent calls. |
| bun run data:build | Pass; all artifacts regenerated after documented normalization fixes. |
| bun run data:check | Pass; generated bytes identical to committed candidates. |
| bun run data:validate | Pass; 854 cards, 26,540 fusion pairs, 13 transforms, 17 lists; independent sampled fields match. |
| bun test | Pass; 81 tests, zero failures, 157 assertions. |
| bun run check | Pass; Astro zero errors/warnings/hints; tsc passes; no M0 Svelte islands to check. |
| Temporary Svelte negative/positive probe | Pass; incompatible island TypeScript rejected, corrected island accepted, owned probe removed. |
| bun run build | Pass; freshness/validation/tests/checks precede two static pages; no SSR output. |
| Structurally valid stale card edit probe | Pass; build rejected edited DEF before Astro; exact original bytes restored; reproduction passed. |
| bun run wrangler --version / deploy --dry-run | Pass using installed Bun entry point; Wrangler 4.148.0, static assets and no bindings. No publication. |
| Built-in Bun YAML parsing + workflow inspection | Pass; PR/main triggers, exact Bun version file, required scripts, sequential deployment gates, main-only secrets, no verification bypass. No large YAML tooling installed. |
| Independent source-to-canonical comparison | Pass; all 26,553 source outcomes map exactly to ordinary/transform records, zero missing/extras. |
| git diff --check | Pass before staging; staged check also required before publication. |
| bunx --bun wrangler --version | Compatibility probe failed on Windows absolute child path; corrected invocation documented, no alternate runtime/package manager added. |
| bun run wrangler whoami | Authentication probe failed: expired session and no noninteractive credentials. Deployment intentionally not executed. |

An independent read-only review reported no other material code/configuration
issues. The one correction adds data freshness to local production build/deploy
as well as CI. There are no deferred cosmetic findings or undeclared review
rulings. No actual card browser, fusion/naming form, deck builder or reincarnation
UI was built. Data architecture remains reviewable before later product UI work.
