import { expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import { OPPONENTS } from '../src/lib/dotr/opponents';
import { assessCardMatchup, generateSmartDeck, type DeckStyle } from '../src/lib/dotr/smart-deck';
import { smartDeckLink, parseSmartDeckLink } from '../src/lib/dotr/smart-deck-link';

const styles: DeckStyle[] = ['balanced', 'aggressive', 'defensive'];

test('M5-01: matchup score compares known threats on supported terrain only', async () => {
  const data = await loadCanonical();
  const byId = new Map(data.cards.map(card => [card.id, card]));
  const card = byId.get(0)!;
  const withTerrain = assessCardMatchup(card, OPPONENTS[0]!, byId);
  expect(Number.isFinite(withTerrain.rating)).toBe(true);
  expect(withTerrain.knownThreats).toBeGreaterThanOrEqual(1);
  expect(withTerrain.totalStatChecks).toBeGreaterThan(0);
  const unsupported = assessCardMatchup(card,
    { ...OPPONENTS[0]!, terrains: ['Crush', 'Labyrinth', 'Unknown'] }, byId);
  expect(unsupported.terrainAverage).toBeNull();
  expect(unsupported.totalStatChecks).toBe(0);
  expect(unsupported.winningStatChecks).toBe(0);
});

test('M5-02: 20 opponents x 3 styles produce reproducible cost-feasible 40-card lists', async () => {
  const data = await loadCanonical();
  const cards = new Map(data.cards.map(card => [card.id, card]));
  for (const opponent of OPPONENTS) for (const style of styles) {
    const recommendation = generateSmartDeck(data.cards, opponent, style, data.fusions);
    expect(recommendation).not.toBeNull();
    const deck = recommendation!;
    expect(deck.cardIds).toHaveLength(40);
    expect(deck.deckCost).toBeLessThan(opponent.deckCost);
    expect(deck.costLimit).toBe(opponent.deckCost - 1);
    expect(deck.groups.reduce((n, group) => n + group.copies, 0)).toBe(40);
    expect(deck.groups.every(group => group.copies <= 3 && group.copies > 0)).toBe(true);
    expect(deck.cardIds.every(id => cards.get(id)?.kind === 'monster'
      || (cards.get(id)?.kind === 'magic' && cards.get(id)?.magicClass === 'power-up'))).toBe(true);
    expect(deck.cardIds.reduce((n, id) => n + cards.get(id)!.deckCost!, 0)).toBe(deck.deckCost);
    expect(generateSmartDeck(data.cards, opponent, style, data.fusions)?.cardIds)
      .toEqual(deck.cardIds);
  }
});

test('proposals are validated before manual Deck Builder acceptance', async () => {
  const data = await loadCanonical();
  const opponent = OPPONENTS[0]!;
  const deck = generateSmartDeck(data.cards, opponent, 'balanced', data.fusions)!;
  const uri = smartDeckLink(deck);
  expect(uri.startsWith('/decks/?suggest=')).toBe(true);
  const parsed = parseSmartDeckLink(uri.split('?')[1]!, data.cards);
  expect(parsed?.cardIds).toEqual(deck.cardIds);
  expect(parsed?.opponentId).toBe(opponent.id);
  const query = new URLSearchParams(uri.split('?')[1]!);
  query.set('suggest', Array(40).fill(deck.cardIds[0]).join(','));
  expect(parseSmartDeckLink(query.toString(), data.cards)).toBeNull();
  query.set('suggest', deck.cardIds.join(','));
  query.set('opponent', 'unknown-opponent');
  expect(parseSmartDeckLink(query.toString(), data.cards)).toBeNull();
  query.set('opponent', opponent.id);
  query.set('suggest', 'not forty cards');
  expect(parseSmartDeckLink(query.toString(), data.cards)).toBeNull();
});

test('cannot invent a feasible deck from empty or unaffordable source data', async () => {
  const data = await loadCanonical();
  expect(generateSmartDeck([], OPPONENTS[0]!, 'balanced', data.fusions)).toBeNull();
  const costly = data.cards.filter(card => card.kind === 'monster')
    .map(card => ({ ...card, deckCost: 99 }));
  expect(generateSmartDeck(costly, OPPONENTS[0]!, 'balanced')).toBeNull();
});
