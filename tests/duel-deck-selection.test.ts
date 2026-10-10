import { describe, expect, test } from 'bun:test';
import { canAddSavedDeckCopy, savedDeckCopyCounts } from '../src/features/duel/duel-deck-selection';

describe('Duel Companion saved-deck card selection', () => {
  const copies = savedDeckCopyCounts({
    id: 'deck-1',
    name: 'Test deck',
    cardIds: [7, 7, 0],
  });

  test('counts duplicate cards in saved decks without mutating them', () => {
    expect([...copies.entries()]).toEqual([[7, 2], [0, 1]]);
    expect(savedDeckCopyCounts(undefined).size).toBe(0);
  });

  test('bounds selection across Hand and Field, including catalog-added cards', () => {
    expect(canAddSavedDeckCopy(7, copies, [])).toBe(true);
    expect(canAddSavedDeckCopy(7, copies, [{ cardId: 7 }])).toBe(true);
    expect(canAddSavedDeckCopy(7, copies, [{ cardId: 7 }, { cardId: 7 }])).toBe(false);
    expect(canAddSavedDeckCopy(0, copies, [{ cardId: 0 }])).toBe(false);
    expect(canAddSavedDeckCopy(853, copies, [])).toBe(false);
  });
});
