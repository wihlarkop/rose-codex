import { expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import { OPPONENTS } from '../src/lib/dotr/opponents';
import { generateSmartDeck } from '../src/lib/dotr/smart-deck';
import { optimizeSuggestedDeck } from '../src/lib/dotr/deck-optimizer';

const data = await loadCanonical();
const byId = new Map(data.cards.map(card => [card.id, card]));
test('M5-07 bounded local search never worsens its declared proxy metric or deck constraints', () => {
  for (const opponent of [OPPONENTS[0]!, OPPONENTS[5]!, OPPONENTS[17]!]) {
    for (const style of ['balanced', 'aggressive', 'defensive'] as const) {
      const generated = generateSmartDeck(data.cards, opponent, style, data.fusions)!;
      const inputSnapshot = [...generated.cardIds];
      const result = optimizeSuggestedDeck(generated, data.cards, opponent, data.fusions);
      expect(result.optimizedScore + 1e-8).toBeGreaterThanOrEqual(result.baselineScore);
      expect(result.deck.cardIds).toHaveLength(40);
      expect(result.deck.deckCost).toBeLessThan(opponent.deckCost);
      expect(result.deck.groups.every(g => g.copies >= 1 && g.copies <= 3)).toBe(true);
      expect(result.deck.groups.reduce((sum, g) => sum + g.copies, 0)).toBe(40);
      const all = new Map<number, number>();
      for (const id of result.deck.cardIds) all.set(id, (all.get(id) ?? 0) + 1);
      expect([...all.values()].every(n => n <= 3)).toBe(true);
      expect(result.deck.deckCost).toBe(result.deck.cardIds.reduce(
        (sum, id) => sum + byId.get(id)!.deckCost!, 0));
      expect(generated.cardIds).toEqual(inputSnapshot);
      expect(result.deck.cardIds.every(id => byId.has(id))).toBe(true);
      expect(result.deck.cardIds.filter(id => byId.get(id)?.magicClass === 'power-up')
        .every(id => result.deck.cardIds.some(hostId =>
          byId.get(hostId)?.powerUpCardIds.includes(id)))).toBe(true);
    }
  }
});

test('optimizer rejects inconsistent opponent, malformed decks and unknown cards', () => {
  const first = OPPONENTS[0]!, other = OPPONENTS[1]!;
  const deck = generateSmartDeck(data.cards, first, 'balanced', data.fusions)!;
  expect(() => optimizeSuggestedDeck(deck, data.cards, other, data.fusions))
    .toThrow(/matching valid/);
  expect(() => optimizeSuggestedDeck({ ...deck, cardIds: [99999, ...deck.cardIds.slice(1)] },
    data.cards, first, data.fusions)).toThrow(/Baseline violates/);
});
