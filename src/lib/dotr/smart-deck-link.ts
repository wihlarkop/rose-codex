import type { Card } from './model';
import { OPPONENTS } from './opponents';
import type { DeckStyle, SmartDeck } from './smart-deck';

export interface PendingCoachDeck {
  cardIds: number[];
  name: string;
  opponentId: string;
}

/** URL is a transport for a suggested deck, not automatically trusted or saved.
 * The Deck Builder must require an explicit Add button to persist anything. */
export function smartDeckLink(result: SmartDeck): string {
  const params = new URLSearchParams({
    suggest: result.cardIds.join(','),
    opponent: result.opponentId,
    style: result.style,
  });
  return '/decks/?' + params.toString();
}

export function parseSmartDeckLink(
  search: string, cards: readonly Pick<Card, 'id' | 'deckCost'>[],
): PendingCoachDeck | null {
  const query = new URLSearchParams(search);
  const raw = query.get('suggest');
  const opponent = OPPONENTS.find(item => item.id === query.get('opponent'));
  const style = query.get('style') as DeckStyle | null;
  if (!raw || !opponent || !['balanced', 'aggressive', 'defensive'].includes(style ?? ''))
    return null;
  const tokens = raw.split(',');
  if (tokens.length !== 40 || tokens.some(token => !/^\d{1,3}$/.test(token)))
    return null;
  const ids = tokens.map(Number);
  const catalog = new Map(cards.map(card => [card.id, card.deckCost]));
  const counts = new Map<number, number>();
  let cost = 0;
  for (const id of ids) {
    const dc = catalog.get(id);
    if (dc === null || dc === undefined) return null;
    const next = (counts.get(id) ?? 0) + 1;
    if (next > 3) return null;
    counts.set(id, next);
    cost += dc;
  }
  if (cost >= opponent.deckCost) return null;
  return { cardIds: ids, name: 'Coach · ' + opponent.name + ' · ' + style,
    opponentId: opponent.id };
}
