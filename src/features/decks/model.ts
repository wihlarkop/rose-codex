export const DECK_STORAGE_KEY = 'rose-codex.decks.v1';

export interface DeckRecord {
  id: string;
  name: string;
  cardIds: number[];
}

export interface DeckEnvelope {
  schemaVersion: 1;
  decks: DeckRecord[];
}

export function validateDeckEnvelope(
  value: unknown,
  allowedCardIds: ReadonlySet<number>,
): DeckEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a deck data object.');
  const envelope = value as Record<string, unknown>;
  if (envelope.schemaVersion !== 1) throw new Error('Unsupported deck data version.');
  if (!Array.isArray(envelope.decks)) throw new Error('Deck data must include a decks array.');
  const seen = new Set<string>();
  const decks = envelope.decks.map((item, index): DeckRecord => {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      throw new Error(`Deck ${index + 1} is not an object.`);
    const deck = item as Record<string, unknown>;
    if (typeof deck.id !== 'string' || !deck.id.trim())
      throw new Error(`Deck ${index + 1} has an invalid ID.`);
    if (seen.has(deck.id)) throw new Error(`Deck ID ${deck.id} appears more than once.`);
    seen.add(deck.id);
    if (typeof deck.name !== 'string' || !deck.name.trim())
      throw new Error(`Deck ${index + 1} needs a name.`);
    if (
      !Array.isArray(deck.cardIds) ||
      !deck.cardIds.every((id) => Number.isInteger(id) && allowedCardIds.has(id as number))
    ) {
      throw new Error(`Deck “${deck.name}” contains an invalid or unknown card ID.`);
    }
    return { id: deck.id, name: deck.name.trim(), cardIds: [...deck.cardIds] as number[] };
  });
  return { schemaVersion: 1, decks };
}

export function knownDeckCost(cardIds: number[], costs: ReadonlyMap<number, number | null>) {
  let known = 0;
  let unknown = 0;
  for (const id of cardIds) {
    const cost = costs.get(id);
    if (cost === null || cost === undefined) unknown++;
    else known += cost;
  }
  return { known, unknown };
}
