import { expect, test } from 'bun:test';
import {
  collectionFromDecks,
  maxRequiredCopies,
  validateCollection,
} from '../src/features/decks/collection';

test('preserves all 43 legacy card occurrences without summing alternative deck presets', () => {
  const first = Array.from({ length: 43 }, (_, index) => index);
  const other = Array.from({ length: 40 }, (_, index) => index);
  const decks = [
    { id: 'overfull', name: 'Edo', cardIds: first },
    { id: 'other', name: 'Alternative', cardIds: other },
  ];
  const seeded = collectionFromDecks(decks);
  expect(Object.values(seeded.owned).reduce((sum, count) => sum + count, 0)).toBe(43);
  expect(Object.keys(seeded.owned)).toHaveLength(43);
  expect(maxRequiredCopies(decks).get(0)).toBe(1);
  expect(decks[0]?.cardIds).toHaveLength(43);
});

test('validates canonical owned copies rather than accepting malformed inventory', () => {
  const ids = new Set([21, 36]);
  expect(validateCollection({ schemaVersion: 1, owned: { '21': 2, '36': 1 } }, ids))
    .toEqual({ schemaVersion: 1, owned: { '21': 2, '36': 1 } });
  for (const owned of [{ '21': 0 }, { '21': -1 }, { '21': 1.5 }, { '021': 1 }, { '999': 1 }]) {
    expect(() => validateCollection({ schemaVersion: 1, owned }, ids)).toThrow();
  }
});
