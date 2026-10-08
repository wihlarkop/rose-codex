import type { DeckRecord } from './model';

export const COLLECTION_STORAGE_KEY = 'rose-codex.collection.v1';

export interface CollectionEnvelope {
  schemaVersion: 1;
  owned: Record<string, number>;
}

/** Decks are alternative plans, not separate physical piles. Bootstrap with
 * the maximum count of each card across all decks, never the sum of decks. */
export function collectionFromDecks(decks: readonly DeckRecord[]): CollectionEnvelope {
  const owned: Record<string, number> = {};
  for (const deck of decks) {
    const counts = new Map<number, number>();
    for (const id of deck.cardIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (const [id, count] of counts) {
      const key = String(id);
      owned[key] = Math.max(owned[key] ?? 0, count);
    }
  }
  return { schemaVersion: 1, owned };
}

export function validateCollection(
  value: unknown,
  allowedCardIds: ReadonlySet<number>,
): CollectionEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a collection object.');
  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion !== 1) throw new Error('Unsupported collection data version.');
  if (!raw.owned || typeof raw.owned !== 'object' || Array.isArray(raw.owned))
    throw new Error('Collection must have an owned-card object.');
  const owned: Record<string, number> = {};
  for (const [key, count] of Object.entries(raw.owned as Record<string, unknown>)) {
    const id = Number(key);
    if (!/^\\d+$/.test(key) || String(id) !== key || !allowedCardIds.has(id))
      throw new Error('Collection contains an unknown card ID.');
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 1)
      throw new Error('Collection counts must be positive safe integers.');
    owned[key] = count;
  }
  return { schemaVersion: 1, owned };
}

export function countCopies(cardIds: readonly number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const id of cardIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

/** Used to protect other deck presets when reducing recorded ownership. */
export function maxRequiredCopies(decks: readonly DeckRecord[]): Map<number, number> {
  const requirements = new Map<number, number>();
  for (const deck of decks) {
    for (const [id, count] of countCopies(deck.cardIds))
      requirements.set(id, Math.max(requirements.get(id) ?? 0, count));
  }
  return requirements;
}
