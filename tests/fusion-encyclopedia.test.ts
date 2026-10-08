import { expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import { createFusionEngine } from '../src/lib/dotr/fusion';
import {
  buildFusionEncyclopedia,
  missingOwnedCopies,
} from '../src/lib/dotr/fusion-encyclopedia';

const data = await loadCanonical();
const index = buildFusionEncyclopedia(data.fusions);
const engine = createFusionEngine(data.cards, data.fusions);

test('reverse index covers all 26,540 canonical ordinary pairs exactly', () => {
  expect(index.ordinaryCount).toBe(26_540);
  const recipes = [...index.ordinary.values()].flat();
  expect(recipes).toHaveLength(26_540);
  const keys = new Set(recipes.map(({ materials }) => materials.join(',')));
  expect(keys.size).toBe(26_540);
  for (const recipe of recipes) {
    expect(engine.fuse(...recipe.materials)).toBe(recipe.resultCardId);
  }
});

test('searches direct material pairs and preserves duplicate-card recipes', () => {
  expect(index.ordinary.get(24)).toContainEqual({
    materials: [21, 36],
    resultCardId: 24,
  });
  expect(index.ordinary.get(35)).toContainEqual({
    materials: [379, 379],
    resultCardId: 35,
  });
  expect(index.resultIds).toContain(24);
});

test('keeps special transformations separate and unresolved random outcomes unlisted', () => {
  expect(index.special.get(501)).toContainEqual({
    materials: [7, 799],
    resultCardId: 501,
  });
  expect(index.ordinary.get(501)?.some((recipe) => recipe.materials.join() === '7,799'))
    .toBeFalsy();
  expect([...index.special.values()].flat()).toHaveLength(8);
  expect([...index.special.values()].flat().some((recipe) => recipe.materials.join() === '16,800'))
    .toBe(false);
});

test('owned readiness requires distinct copies and treats missing collection as unknown', () => {
  expect(missingOwnedCopies([73, 73], null)).toBeNull();
  expect(missingOwnedCopies([73, 73], { '73': 1 })).toEqual([
    { cardId: 73, needed: 2, owned: 1 },
  ]);
  expect(missingOwnedCopies([73, 73], { '73': 2 })).toEqual([]);
  expect(missingOwnedCopies([21, 36], { '21': 1 })).toEqual([
    { cardId: 36, needed: 1, owned: 0 },
  ]);
  expect(missingOwnedCopies([21, 36], { '21': 1, '36': 1 })).toEqual([]);
});
