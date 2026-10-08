# Oxc tooling foundation

Oxlint 1.87.0 and Oxfmt 0.72.0 are exact development dependencies installed with
Bun 1.4.2. Scripts force the Bun runtime with `bun --bun`; Node is not a required
project runtime. No standalone Prettier, extra Oxc packages, or new tests were added.

| Command                | Purpose                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `bun run lint`         | Check first-party JS/TS and framework script blocks; warnings fail |
| `bun run lint:fix`     | Apply safe Oxlint fixes with the same scope                        |
| `bun run format`       | Write formatting in the initial scope                              |
| `bun run format:check` | Check that scope without writing                                   |

## Lint coverage

Correctness rules from TypeScript, Unicorn and Oxc run across first-party source,
scripts, tests and configuration. Browser globals belong to source; Node/Bun
globals belong to scripts/tests/configuration. Astro and Svelte environments are
explicit. Template references cannot be checked by Oxlint, so `no-unused-vars` is
disabled only for those framework files. `astro check`, `svelte-check` and `tsc`
remain authoritative for templates and types, through the unchanged `check` script.

Generated outputs, canonical/raw data, public assets and copied UI primitives are
excluded. The image gallery parser's one unnecessary regex escape was removed
without changing its accepted characters.

## Format coverage

The initial baseline covers root JSON/JS configuration, GitHub Actions YAML,
`scripts/check-svelte.ts`, `src/lib/utils.ts` and this document. New first-party
paths such as `src/features/` are covered automatically. Two-space indentation,
single quotes and LF match repository conventions; import, package-field and
Tailwind sorting are disabled.

To avoid a large formatting-only rewrite, the existing component, domain, style,
data/image script and test directories are excluded explicitly in `.oxfmtrc.json`.
Historical Markdown documents are also excluded. Those exclusions apply only to
formatting; first-party source and tests still receive lint and type checks.
Remove a specific exclusion when its owner intentionally adopts formatting.

Oxfmt does not support `.astro`; these files are explicitly excluded. Svelte
formatting is enabled using the already-installed Svelte 5 compiler and Oxfmt's
bundled formatter. A temporary Svelte 5 runes probe was formatted and checked
through Bun on Windows. Existing components retain their current formatting;
new Svelte components outside the excluded paths receive formatting checks.

Canonical JSON, raw captures/manifests, all public imagery, Bun's lockfile,
dependencies, build output and local worktrees are excluded from formatting.

## Verification

GitHub Actions runs lint and scoped format checks immediately after `bun ci`,
before its existing data, tests, framework checks and build steps. Build and
deployment behavior remains unchanged. The tooling commit must pass that workflow
before feature implementation agents begin.

Official references: [Oxlint configuration](https://oxc.rs/docs/guide/usage/linter/config-file-reference),
[Oxfmt configuration](https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html),
[language support](https://oxc.rs/docs/guide/usage/formatter/language-support.html),
and [framework compatibility](https://oxc.rs/compatibility.html).
