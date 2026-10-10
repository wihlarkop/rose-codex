import type { FusionOccurrence } from '../../lib/dotr/fusion-discovery';

/** Prepare a read-only recipe handoff. The caller explicitly decides whether
 * to replace its current planner inputs; saved decks are never touched. */
export function createRecipeHand(
  materials: readonly number[],
  allowedCards: ReadonlyMap<number, unknown>,
  newId: () => string,
): FusionOccurrence[] | null {
  if (materials.length < 2 || !materials.every(id => Number.isInteger(id) && allowedCards.has(id)))
    return null;

  return materials.map(cardId => ({
    instanceId: newId(),
    cardId,
    zone: 'hand' as const,
  }));
}
