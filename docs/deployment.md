# Static deployment

Astro's static output is hosted by Cloudflare Workers Static Assets. M0 includes
no Astro Cloudflare adapter, SSR route, `main` Worker script, binding or runtime
secret. `wrangler.jsonc` targets `dist/`, sets name `rose-codex`, compatibility
date `2026-10-08`, and uses `404-page` routing for the generated 404.html.
This follows official [configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
and [SSG routing guidance](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/).

Wrangler 4.148.0 is an exact Bun dev dependency. Bun 1.4.2 on Windows mishandled
`bunx --bun wrangler --version`: the wrapper's absolute `C:/.../cli.js` child path
was treated as a package/Git URL (`Could not resolve host: C`, `Invalid dependency
name`). Direct Bun execution of the installed `bin/wrangler.js` works, including
its child process and static-assets dry run. `bun run wrangler` wraps that path
under Bun; no Node runtime exception, alternate package manager, or global
installation is needed. The lockfile fixes the package layout this command uses.
Astro telemetry and Wrangler metrics are disabled by command-scoped environment
variables; Wrangler configuration also sets `send_metrics: false`.

## CI/CD contract

`.github/workflows/verify-deploy.yml` handles pull requests and main pushes in
one small job, with checkout/setup-bun pinned to full published tag SHAs and Bun
read from `.bun-version`. `bun ci` installs the committed text lockfile. Data
acquisition uses two immutable Git URLs and byte hashes; a source outage fails
the regeneration check rather than silently skipping it. A valid cached capture
can be used locally. Upstream changes do not silently refresh the data.

Local production build also invokes pinned acquisition and byte-for-byte
reproduction checks before validation; cached inputs permit offline builds.
Structurally valid edits to generated factual data cannot bypass this gate.
Steps run data reproduction, validation, tests, Astro/Svelte/TypeScript checking,
and the guarded production build. Deployment is a later step in that same job,
uses the just-built assets, and requires a successful push to `refs/heads/main`.
PRs never reach the credential or deploy steps. No `continue-on-error` or
`always()` bypasses verification. GitHub token permissions are read-only and
checkout does not persist credentials. Concurrent runs for the same ref are
serialized; commits being deployed have passed their own verification.

Add these **repository secrets**:

- `CLOUDFLARE_API_TOKEN`: Cloudflare Edit Cloudflare Workers token, scoped to the
  intended account and necessary resources.
- `CLOUDFLARE_ACCOUNT_ID`: the intended account's ID.

These are the requirements in current official
[Cloudflare GitHub Actions authentication guidance](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).
They exist only in the main credential/deploy steps, never in application bundles.
If either is absent, the workflow emits a notice and intentionally skips CD while
retaining CI results. A dry run checks configuration; it is not deployment.

## First deployment and later domain

1. Verify the intended account and that Worker name `rose-codex` will not replace
   an unrelated project. Add account/token repository secrets.
2. Push a verified main commit to trigger CI then CD, or authenticate locally and
   run `bun run deploy` (which runs the full guarded build first).
3. Inspect the real deployment's workers.dev URL, homepage and 404 handling.
4. Inspect Cloudflare DNS/zone state for `wihlarkop.com`; only then attach the
   planned custom domain `dotr.wihlarkop.com`.

No custom-domain route/DNS record is in M0 configuration. Credentials are never
fabricated. Actual execution/deployment results are recorded in the final M0
report rather than inferred from workflow configuration.
