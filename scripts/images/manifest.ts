import { imageSources } from './sources';
import { imageAvailable, validateImages } from '../../src/lib/dotr/images';
import type { ImageRecord } from '../../src/lib/dotr/model';

export function normalizeImageRecords(value: unknown, reviews: { cardId: number; sourceSha256: string; note: string }[]): ImageRecord[] {
  const sources = imageSources();
  const manifest = value as { schemaVersion?: unknown; records?: unknown } | null;
  if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.records)) throw new Error('Invalid acquired image manifest');
  const images = manifest.records.map((value: unknown) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid acquired image record');
    const { sourceSha256, ...image } = value as Record<string, unknown>;
    const id = image['cardId'];
    if (typeof id !== 'number' || !Number.isInteger(id) || id < 0 || id > 853) throw new Error('Invalid acquired image ID');
    if (image['source'] !== sources[id]!.source) throw new Error(`Image ${id} disagrees with discovered source`);
    if (image['status'] === 'verified' || image['status'] === 'probable') {
      if (typeof sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(sourceSha256)) throw new Error(`Missing source digest for ${id}`);
      if (image['status'] === 'verified' && !reviews.some(review => review.cardId === id && review.sourceSha256 === sourceSha256 && review.note.trim())) throw new Error(`Verified image ${id} has no hash-bound identity review`);
    }
    return image;
  });
  validateImages(images);
  for (const image of images.filter(imageAvailable)) {
    const source = sources[image.cardId]!;
    if (image.width !== source.width || image.height !== source.height) throw new Error(`Unexpected normalized image dimensions ${image.cardId}`);
  }
  return images;
}
