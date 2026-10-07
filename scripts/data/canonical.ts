import type { CanonicalData } from '../../src/lib/dotr/model';

export const canonicalFiles = ['cards.json','fusions.json','starters.json','images.json'] as const;
export async function loadCanonical(): Promise<CanonicalData> {
  const [cards,fusions,starters,images] = await Promise.all(canonicalFiles.map(file=>Bun.file(new URL(`../../data/canonical/${file}`,import.meta.url)).json()));
  // This is a tooling loader. validateDataset is the runtime trust boundary for
  // these unknown JSON values; no consumer should infer correctness from a cast.
  return {cards,fusions,starters,images} as CanonicalData;
}
