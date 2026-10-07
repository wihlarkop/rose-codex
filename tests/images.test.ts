import { describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rejects } from 'node:assert/strict';
import sharp from 'sharp';
import { validateImages } from '../src/lib/dotr/images';
import { validateImageFiles } from '../scripts/images/validate';
import type { ImageRecord } from '../src/lib/dotr/model';
import assets from '../data/manifests/image-assets.json';
import reviews from '../data/manifests/image-reviews.json';
import { normalizeImageRecords } from '../scripts/images/manifest';

function missing(): ImageRecord[] {
  return Array.from({ length: 854 }, (_, cardId) => ({
    cardId, file: `${String(cardId).padStart(3, '0')}.webp`, source: null,
    sourceKind: null, status: 'missing', width: null, height: null, sha256: null,
  }));
}
function available(): ImageRecord[] {
  const images = missing();
  images[0] = { ...images[0]!, source: 'https://ms.yugipedia.com/7/71/BlueEyesWhiteDragon-DOR-EN-VG.png',
    sourceKind: 'dotr-game-render', status: 'probable', width: 320, height: 256, sha256: 'a'.repeat(64) };
  return images;
}
describe('image manifest and committed assets', () => {
  test('requires the discovered source and hash-bound identity review', () => {
    expect(() => normalizeImageRecords(assets, reviews)).not.toThrow();
    const changed = structuredClone(assets);
    changed.records[65]!.source = changed.records[0]!.source;
    expect(() => normalizeImageRecords(changed, reviews)).toThrow();
    expect(() => normalizeImageRecords(assets, [])).toThrow();
  });
  test('permits honest missing imagery and sourced available DotR screenshots', () => {
    expect(() => validateImages(missing())).not.toThrow();
    expect(() => validateImages(available())).not.toThrow();
  });
  test.each([
    ['duplicate ID', (d: ImageRecord[]) => { d[1]!.cardId = 0; }],
    ['wrong filename', (d: ImageRecord[]) => { d[0]!.file = 'dragon.webp'; }],
    ['no provenance', (d: ImageRecord[]) => { d[0]!.source = null; }],
    ['wrong source kind', (d: ImageRecord[]) => { d[0]!.sourceKind = null; }],
    ['invalid dimensions', (d: ImageRecord[]) => { d[0]!.width = 1; }],
    ['missing content hash', (d: ImageRecord[]) => { d[0]!.sha256 = null; }],
  ] as const)('rejects %s', (_name, mutate) => {
    const images = available(); mutate(images);
    expect(() => validateImages(images)).toThrow();
  });
  test('rejects absent file, invalid WebP, altered content and orphan files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'rose-images-test-'));
    try {
      const images = available();
      await rejects(validateImageFiles(images, directory));
      await Bun.write(join(directory, '000.webp'), 'not an image');
      await rejects(validateImageFiles(images, directory));
      const bytes = await sharp({ create: { width: 320, height: 256, channels: 3, background: '#456789' } }).webp().toBuffer();
      await Bun.write(join(directory, '000.webp'), bytes);
      await rejects(validateImageFiles(images, directory));
      images[0]!.sha256 = new Bun.CryptoHasher('sha256').update(bytes).digest('hex');
      await validateImageFiles(images, directory);
      await Bun.write(join(directory, '854.webp'), bytes);
      await rejects(validateImageFiles(images, directory));
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
