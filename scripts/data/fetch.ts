import { sources, sourceUrl, verifySource } from './source';

for (const entry of sources) {
  const target = new URL(`../../data/raw/${entry.file}`, import.meta.url);
  if (await Bun.file(target).exists()) {
    verifySource(new Uint8Array(await Bun.file(target).arrayBuffer()), entry.sha256, entry.file);
    console.log(`Verified cached ${entry.file}`);
    continue;
  }
  const response = await fetch(sourceUrl(entry.path), {
    headers: { 'User-Agent': 'Rose-Codex-data-research/0.0.0' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Source fetch failed: ${entry.file}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  verifySource(bytes, entry.sha256, entry.file);
  await Bun.write(target, bytes);
  console.log(`Fetched and verified ${entry.file} (${bytes.length} bytes)`);
}
