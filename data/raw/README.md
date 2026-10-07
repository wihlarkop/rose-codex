# Local research captures

`bun run data:fetch` downloads a small, pinned set of public reference files here.
They are ignored by Git and never imported by application code. SHA-256 digests
in `data/manifests/sources.json` must match before parsing. Nothing is evaluated
as JavaScript. Do not commit the downloaded implementation or effect prose.

See `docs/data-sources.md` for provenance and limits on reuse.
