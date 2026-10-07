import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { imageAvailable, validateImages } from '../../src/lib/dotr/images';
import type { ImageRecord } from '../../src/lib/dotr/model';
import { digest } from './network';

export async function validateImageFiles(images: ImageRecord[], directory: string): Promise<void> {
  validateImages(images);
  const expected = new Set(images.filter(imageAvailable).map(image => image.file));
  for (const filename of await readdir(directory)) {
    if (filename !== '.gitkeep' && !expected.has(filename)) throw new Error(`Unexpected or unavailable local card asset: ${filename}`);
  }
  for (const image of images.filter(imageAvailable)) {
    const file = Bun.file(join(directory, image.file));
    if (!await file.exists()) throw new Error(`Missing local image: ${image.file}`);
    if (file.size === 0 || file.size > 500_000) throw new Error(`Invalid asset size: ${image.file}`);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (digest(bytes) !== image.sha256) throw new Error(`Image digest mismatch: ${image.file}`);
    const metadata = await sharp(bytes).metadata();
    if (metadata.format !== 'webp' || metadata.width !== image.width || metadata.height !== image.height || (metadata.pages ?? 1) !== 1) throw new Error(`Image format/dimensions mismatch: ${image.file}`);
    // Fully decode: a valid header alone does not prove complete image content.
    await sharp(bytes).raw().toBuffer();
  }
}

if (import.meta.main) {
  const images = await Bun.file(new URL('../../data/canonical/images.json', import.meta.url)).json();
  await validateImageFiles(images, fileURLToPath(new URL('../../public/cards/', import.meta.url)));
  console.log(`Image validation passed: ${images.filter(imageAvailable).length}/854 local DotR assets; content/dimensions/manifest match.`);
}
