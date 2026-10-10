import type { DeckRecord } from '../decks/model';

export function savedDeckCopyCounts(deck: DeckRecord | undefined): Map<number, number> {
  const counts = new Map<number, number>();
  for (const id of deck?.cardIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

export function canAddSavedDeckCopy(
  cardId: number,
  available: ReadonlyMap<number, number>,
  selected: readonly { cardId: number }[],
): boolean {
  const copies = available.get(cardId) ?? 0;
  return copies > 0 && selected.filter((card) => card.cardId === cardId).length < copies;
}
