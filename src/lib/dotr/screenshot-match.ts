/**
 * M5-09 · Browser-only visual candidate ranking for manually cropped screenshots.
 * Descriptors intentionally capture coarse color and luminance structure.
 * The ranking is NOT trained recognition, OCR, calibration, or confidence.
 * It cannot reliably match 3D, face-down, animated or partial card views.
 */
export const FEATURE_WIDTH = 16;
export const FEATURE_HEIGHT = 12;
export const MAX_REFERENCE_CANDIDATES = 854;

export interface VisualSignature {
  /** 8×6 coarse, brightness-normalized luminance samples */
  luminance: number[];
  /** 4×3 coarse RGB means normalized to 0–1 */
  colors: number[];
}
export interface VisualCandidate {
  cardId: number;
  similarity: number;
}

const LUMA_W = 8;
const LUMA_H = 6;
const RGB_W = 4;
const RGB_H = 3;
const COLOR_SIZE = RGB_W * RGB_H;

export function describePixels(
  rgba: Uint8ClampedArray, width: number, height: number,
): VisualSignature {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height)
    || width < 1 || height < 1 || width > 4096 || height > 4096
    || rgba.length !== width * height * 4)
    throw new RangeError('Expected a bounded RGBA image with matching dimensions.');
  const mono = Array<number>(LUMA_W * LUMA_H).fill(0);
  const monoN = Array<number>(LUMA_W * LUMA_H).fill(0);
  const rgb = Array<number>(COLOR_SIZE * 3).fill(0);
  const rgbN = Array<number>(COLOR_SIZE).fill(0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = 4 * (y * width + x);
      const alpha = rgba[index + 3]! / 255;
      // Compositing transparency over a neutral matte avoids invisible RGB.
      const red = (rgba[index]! * alpha + 128 * (1 - alpha)) / 255;
      const green = (rgba[index + 1]! * alpha + 128 * (1 - alpha)) / 255;
      const blue = (rgba[index + 2]! * alpha + 128 * (1 - alpha)) / 255;
      const lm = Math.min(LUMA_H - 1, Math.floor(y * LUMA_H / height)) * LUMA_W
        + Math.min(LUMA_W - 1, Math.floor(x * LUMA_W / width));
      mono[lm]! += red * 0.2126 + green * 0.7152 + blue * 0.0722;
      monoN[lm]!++;
      const rc = Math.min(RGB_H - 1, Math.floor(y * RGB_H / height)) * RGB_W
        + Math.min(RGB_W - 1, Math.floor(x * RGB_W / width));
      rgb[rc * 3]! += red;
      rgb[rc * 3 + 1]! += green;
      rgb[rc * 3 + 2]! += blue;
      rgbN[rc]!++;
    }
  }
  const averaged = mono.map((v, i) => v / Math.max(1, monoN[i]!));
  const mean = averaged.reduce((sum, v) => sum + v, 0) / averaged.length;
  const std = Math.sqrt(averaged.reduce((sum, v) => sum + (v - mean) ** 2, 0)
    / averaged.length);
  return {
    luminance: averaged.map(v => std < 0.01 ? 0 : (v - mean) / std),
    colors: rgb.map((v, i) => v / Math.max(1, rgbN[Math.floor(i / 3)]!)),
  };
}

/** Pure relative similarity metric, bounded 0–100. It is not a model-derived
 * match probability and should NEVER be used for automatic confirmation. */
export function similarityScore(a: VisualSignature, b: VisualSignature): number {
  if (a.luminance.length !== LUMA_W * LUMA_H
    || b.luminance.length !== LUMA_W * LUMA_H
    || a.colors.length !== COLOR_SIZE * 3
    || b.colors.length !== COLOR_SIZE * 3
    || ![...a.luminance, ...b.luminance, ...a.colors, ...b.colors].every(Number.isFinite))
    throw new RangeError('Invalid visual signature.');
  const diff = a.luminance.reduce((sum, v, i) =>
    sum + Math.min(9, (v - b.luminance[i]!) ** 2), 0) / a.luminance.length;
  const shape = Math.max(0, 1 - Math.sqrt(diff) / 2.5);
  const rgbDifference = a.colors.reduce((sum, v, i) =>
    sum + Math.abs(v - b.colors[i]!), 0) / a.colors.length;
  const color = Math.max(0, 1 - rgbDifference);
  return Math.round((0.66 * shape + 0.34 * color) * 1000) / 10;
}

export function bestVisualCandidates(
  query: VisualSignature,
  signatures: readonly { cardId: number; signature: VisualSignature }[],
  limit = 12,
): VisualCandidate[] {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 30
    || signatures.length > MAX_REFERENCE_CANDIDATES)
    throw new RangeError('Invalid visual ranking limit.');
  const seen = new Set<number>();
  const ranked = signatures.map(item => {
    if (!Number.isSafeInteger(item.cardId) || item.cardId < 0
      || item.cardId >= MAX_REFERENCE_CANDIDATES || seen.has(item.cardId))
      throw new RangeError('Duplicate or invalid candidate card ID.');
    seen.add(item.cardId);
    return { cardId: item.cardId, similarity: similarityScore(query, item.signature) };
  });
  return ranked.sort((a, b) => b.similarity - a.similarity || a.cardId - b.cardId)
    .slice(0, limit);
}
