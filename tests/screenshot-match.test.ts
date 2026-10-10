import { expect, test } from 'bun:test';
import {
  bestVisualCandidates, describePixels, similarityScore, type VisualSignature,
} from '../src/lib/dotr/screenshot-match';

type Pixel = [number, number, number];
function image(
  width: number, height: number, f: (x: number, y: number) => Pixel,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const [r, g, b] = f(x, y);
    data.set([r, g, b, 255], idx);
  }
  return data;
}

test('M5-09 signature is bounded and self-similarity is exactly 100', () => {
  const bitmap = image(64, 48, (x, y) => [
    (x * 3) % 256, (y * 5) % 256, (x + y) % 256,
  ]);
  const feature = describePixels(bitmap, 64, 48);
  expect(feature.luminance).toHaveLength(48);
  expect(feature.colors).toHaveLength(36);
  expect(feature.luminance.every(Number.isFinite)).toBe(true);
  expect(feature.colors.every(v => v >= 0 && v <= 1)).toBe(true);
  expect(similarityScore(feature, feature)).toBe(100);
  expect(() => describePixels(bitmap, 64, 47)).toThrow(RangeError);
  expect(() => describePixels(bitmap, 0, 48)).toThrow(RangeError);
  expect(() => describePixels(bitmap, 4097, 48)).toThrow(RangeError);
});

test('coarse color and shape ranking distinguishes synthetic reference appearances', () => {
  const query = describePixels(image(32, 24, (x, y) =>
    x > 15 ? [255, 0, y * 8] : [0, 15, 230]), 32, 24);
  const matched = describePixels(image(32, 24, (x, y) =>
    x > 15 ? [248, 3, y * 8] : [0, 15, 235]), 32, 24);
  const inverse = describePixels(image(32, 24, (x, y) =>
    x < 16 ? [255, 0, y * 8] : [0, 15, 230]), 32, 24);
  const result = bestVisualCandidates(query, [
    { cardId: 12, signature: inverse },
    { cardId: 3, signature: matched },
  ]);
  expect(result[0]?.cardId).toBe(3);
  expect(result[0]!.similarity).toBeGreaterThan(result[1]!.similarity);
  expect(similarityScore(query, inverse)).toBeLessThan(100);
  expect(bestVisualCandidates(query, [], 12)).toEqual([]);
});

test('relative visual rank uses stable card ID ties but never emits a confidence verdict', () => {
  const pattern = describePixels(image(16, 12, () => [80, 25, 120]), 16, 12);
  const ranked = bestVisualCandidates(pattern, [
    { cardId: 21, signature: pattern },
    { cardId: 3, signature: pattern },
  ], 1);
  expect(ranked).toEqual([{ cardId: 3, similarity: 100 }]);
  expect(() => bestVisualCandidates(pattern, [
    { cardId: 3, signature: pattern }, { cardId: 3, signature: pattern },
  ])).toThrow(/Duplicate/);
  expect(() => bestVisualCandidates(pattern, [], 0)).toThrow(RangeError);
  expect(() => bestVisualCandidates(pattern, [], 31)).toThrow(RangeError);
  expect(() => bestVisualCandidates(pattern, [{ cardId: 854, signature: pattern }]))
    .toThrow(RangeError);
});

test('malformed visual signatures never produce valid-looking scores', () => {
  const good = describePixels(image(16, 12, () => [50, 60, 70]), 16, 12);
  const corrupted: VisualSignature = {
    luminance: Array.from(good.luminance),
    colors: Array.from(good.colors),
  };
  corrupted.colors[0] = Number.NaN;
  expect(() => similarityScore(good, corrupted)).toThrow(RangeError);
});
