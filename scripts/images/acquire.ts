import { mkdir, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { imageSources } from './sources';
import { digest, pause, publicFetch } from './network';
import { validateImages } from '../../src/lib/dotr/images';
import type { ImageRecord } from '../../src/lib/dotr/model';

const options = { quality: 93, effort: 6, smartSubsample: true, preset: 'picture' } as const;
const converter = { sharp: sharp.versions.sharp, maxWidth: 640, maxHeight: 640, ...options };
const entries = imageSources();
const args = process.argv.slice(2);
if (args.length !== 1 || args[0] !== '--all' && !/^--ids=\d+(,\d+)*$/.test(args[0]!)) throw new Error('Usage: bun run images:acquire --all | --ids=0,21,683');
const selected = args[0] === '--all' ? null : new Set(args[0]!.slice(6).split(',').map(Number));
if (selected && [...selected].some(id => id < 0 || id > 853)) throw new Error('Invalid requested card ID');

interface AssetRecord extends ImageRecord { sourceSha256: string | null }
const manifestFile = new URL('../../data/manifests/image-assets.json', import.meta.url);
const existing = await Bun.file(manifestFile).exists() ? await Bun.file(manifestFile).json() : null;
if (existing && JSON.stringify(existing.converter) !== JSON.stringify(converter)) throw new Error('Converter settings changed; explicitly review/rebuild outputs before replacing the recorded profile');
const records: AssetRecord[] = entries.map(entry => ({
  cardId: entry.cardId, file: `${String(entry.cardId).padStart(3, '0')}.webp`,
  source: entry.source, sourceKind: entry.source ? 'dotr-game-render' : null,
  status: entry.mapping === 'manual-review' ? 'manual-review' : 'missing',
  width: null, height: null, sha256: null, sourceSha256: null,
}));
if (existing) for (const record of existing.records as AssetRecord[]) {
  if (record.source === records[record.cardId]?.source) records[record.cardId] = record;
  else if (record.sha256) throw new Error(`Source mapping changed for ${record.cardId}; review existing asset before replacement`);
}
const reviewsFile = new URL('../../data/manifests/image-reviews.json', import.meta.url);
const reviews: { cardId: number; sourceSha256: string; note: string }[] = await Bun.file(reviewsFile).exists() ? await Bun.file(reviewsFile).json() : [];
const directory = new URL('../../data/raw/images/', import.meta.url);
await mkdir(directory, { recursive: true });
const stateFile = new URL('state.json', directory);
const state: Record<string, { source: string; sha256: string }> = await Bun.file(stateFile).exists() ? await Bun.file(stateFile).json() : {};
let downloaded = 0, converted = 0, reused = 0;
const failures: { cardId: number; error: string }[] = [];

async function checkpoint() {
  validateImages(records.map(({ sourceSha256: _source, ...record }) => record));
  const manifestTemporary = new URL('manifest.part', directory);
  const stateTemporary = new URL('state.part', directory);
  await Bun.write(manifestTemporary, `${JSON.stringify({ schemaVersion: 1, converter, records }, null, 2)}\n`);
  await rename(fileURLToPath(manifestTemporary), fileURLToPath(manifestFile));
  await Bun.write(stateTemporary, `${JSON.stringify(state, null, 2)}\n`);
  await rename(fileURLToPath(stateTemporary), fileURLToPath(stateFile));
}

for (const entry of entries) {
  if (selected && !selected.has(entry.cardId) || !entry.source) continue;
  const record = records[entry.cardId]!;
  const output = new URL(`../../public/cards/${record.file}`, import.meta.url);
  const cachedSource = new URL(`${String(entry.cardId).padStart(3, '0')}.png`, directory);
  try {
    let bytes: Uint8Array;
    const previous = state[String(entry.cardId)];
    if (previous?.source === entry.source && await Bun.file(cachedSource).exists()) {
      bytes = new Uint8Array(await Bun.file(cachedSource).arrayBuffer());
      if (digest(bytes) !== previous.sha256) throw new Error('Cached source digest mismatch; inspect/remove this owned cache entry before retrying');
      reused++;
    } else {
      await pause();
      const response = await publicFetch(entry.source);
      if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('Source is not an image response');
      bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length === 0 || bytes.length > 8_000_000) throw new Error('Source image exceeds download bounds');
      downloaded++;
    }
    const sourceSha256 = digest(bytes);
    if (record.sourceSha256 && record.sourceSha256 !== sourceSha256) throw new Error('Original source bytes changed; review the new capture before replacing a recorded asset');
    const metadata = await sharp(bytes).metadata();
    if (!['png', 'jpeg'].includes(metadata.format ?? '') || metadata.width !== entry.width || metadata.height !== entry.height || (metadata.pages ?? 1) !== 1) throw new Error('Source format/dimensions disagree with discovery');
    await sharp(bytes).raw().toBuffer();
    if (!previous || previous.sha256 !== sourceSha256) {
      const temporary = new URL(`${String(entry.cardId).padStart(3, '0')}.part`, directory);
      await Bun.write(temporary, bytes);
      await rename(fileURLToPath(temporary), fileURLToPath(cachedSource));
      state[String(entry.cardId)] = { source: entry.source, sha256: sourceSha256 };
    }
    const review = reviews.find(review => review.cardId === entry.cardId && review.sourceSha256 === sourceSha256 && review.note.trim());
    if (entry.mapping === 'manual-review' && !review) continue;
    // Non-library proportions require direct content review before being offered
    // as DotR art; a suffix alone does not establish the source's presentation.
    if (entry.width! / entry.height! < 1.15 && !review) {
      record.status = 'manual-review'; record.sourceSha256 = sourceSha256;
      await checkpoint(); continue;
    }
    if (record.sha256 && record.sourceSha256 === sourceSha256 && await Bun.file(output).exists()) {
      const outputBytes = new Uint8Array(await Bun.file(output).arrayBuffer());
      if (digest(outputBytes) !== record.sha256) throw new Error('Existing output digest mismatch; inspect before overwriting');
      record.status = review ? 'verified' : 'probable';
    } else {
      const result = await sharp(bytes).resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
        .webp(options).toBuffer({ resolveWithObject: true });
      if (record.sha256 && digest(result.data) !== record.sha256) throw new Error('Conversion differs from recorded output; inspect converter/platform differences before replacement');
      const temporary = new URL(`${String(entry.cardId).padStart(3, '0')}.webp.part`, directory);
      await Bun.write(temporary, result.data);
      await rename(fileURLToPath(temporary), fileURLToPath(output));
      records[entry.cardId] = {
        ...record, status: review ? 'verified' : 'probable', width: result.info.width,
        height: result.info.height, sha256: digest(result.data), sourceSha256,
      };
      converted++;
    }
  } catch (error) {
    failures.push({ cardId: entry.cardId, error: String(error) });
    console.error(`Image ${entry.cardId} failed: ${String(error)}`);
  }
  await checkpoint();
  if (entry.cardId % 25 === 0 || selected) console.log(`Image ${entry.cardId}: ${downloaded} downloaded, ${converted} converted, ${reused} cached`);
}
await checkpoint();
const available = records.filter(record => record.sha256);
const sizes = await Promise.all(available.map(async record => ({ cardId: record.cardId, bytes: Bun.file(new URL(`../../public/cards/${record.file}`, import.meta.url)).size })));
const totalBytes = sizes.reduce((sum, record) => sum + record.bytes, 0);
const report = {
  schemaVersion: 1, discovered: entries.length, mapped: entries.length,
  sourceFiles: entries.filter(entry => entry.source).length,
  downloadedThisRun: downloaded, convertedThisRun: converted, reusedThisRun: reused,
  downloadedTotal: Object.keys(state).length, convertedTotal: available.length,
  verified: records.filter(record => record.status === 'verified').length,
  probable: records.filter(record => record.status === 'probable').length,
  missingIds: records.filter(record => record.status === 'missing').map(record => record.cardId),
  manualReviewIds: records.filter(record => record.status === 'manual-review').map(record => record.cardId),
  totalBytes, averageBytes: available.length ? Math.round(totalBytes / available.length) : 0,
  largest: sizes.sort((a, b) => b.bytes - a.bytes).slice(0, 10), failures,
};
await Bun.write(new URL('../../data/manifests/image-acquisition-report.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
