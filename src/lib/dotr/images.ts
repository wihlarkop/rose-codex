import type { ImageRecord } from './model';

export function imageAvailable(image: ImageRecord): boolean {
  return image.status === 'verified' || image.status === 'probable';
}

export function validateImages(value: unknown): asserts value is ImageRecord[] {
  function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(`Invalid image manifest: ${message}`);
  }
  assert(Array.isArray(value) && value.length === 854, 'expected 854 ID mappings');
  const keys = ['cardId', 'file', 'source', 'sourceKind', 'status', 'width', 'height', 'sha256'];
  value.forEach((entry: unknown, id: number) => {
    assert(entry !== null && typeof entry === 'object' && !Array.isArray(entry), `record ${id}`);
    const image = entry as Record<string, unknown>;
    assert(Object.keys(image).length === keys.length && keys.every(key => Object.hasOwn(image, key)), 'unexpected or missing fields');
    assert(image['cardId'] === id, 'IDs must be integer, ordered, unique and contiguous');
    assert(image['file'] === `${String(id).padStart(3, '0')}.webp`, 'wrong ID-based filename');
    assert(['verified', 'probable', 'missing', 'manual-review'].includes(String(image['status'])), 'unknown status');
    assert(image['sourceKind'] === null || image['sourceKind'] === 'dotr-game-render', 'only DotR game renders are supported in M1');
    if (image['source'] !== null) {
      assert(typeof image['source'] === 'string', 'invalid provenance URL');
      const url = new URL(image['source']);
      assert(url.protocol === 'https:' && !url.username && !url.password, 'source must be public HTTPS');
      assert(image['sourceKind'] === 'dotr-game-render', 'source kind required with provenance');
    } else assert(image['sourceKind'] === null, 'source kind without source');
    if (image['status'] === 'verified' || image['status'] === 'probable') {
      assert(image['source'] !== null && image['sourceKind'] === 'dotr-game-render', 'available image needs provenance');
      for (const field of ['width', 'height']) {
        const number = image[field];
        assert(typeof number === 'number' && Number.isInteger(number) && number >= 200 && number <= 640, `invalid ${field}`);
      }
      assert(typeof image['sha256'] === 'string' && /^[a-f0-9]{64}$/.test(image['sha256']), 'available image needs content digest');
    } else {
      assert(image['width'] === null && image['height'] === null && image['sha256'] === null, 'unavailable image must not claim a local asset');
    }
  });
}
