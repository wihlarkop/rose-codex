import { expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import { findOpponents, OPPONENTS, opponentById } from '../src/lib/dotr/opponents';

test('story routes retain separate boss encounters and searchable campaign profiles', () => {
  expect(OPPONENTS).toHaveLength(20);
  expect(new Set(OPPONENTS.map((entry) => entry.id)).size).toBe(20);
  expect(findOpponents('', 'red')).toHaveLength(10);
  expect(findOpponents('', 'white')).toHaveLength(10);
  expect(findOpponents('stonehenge', 'red')).toHaveLength(2);
  expect(findOpponents('kaiba', 'white')).toHaveLength(0);
  expect(opponentById('guardian-red')?.leaderCardId).not.toBe(opponentById('guardian-white')?.leaderCardId);
});

test('all reported card highlights and leaders resolve to canonical DotR records', async () => {
  const data = await loadCanonical();
  const byId = new Map(data.cards.map((card) => [card.id, card]));
  for (const opponent of OPPONENTS) {
    expect(opponent.deckCost).toBeGreaterThan(0);
    expect(byId.get(opponent.leaderCardId)?.kind).toBe('monster');
    expect(opponent.notableCardIds.length).toBeGreaterThan(0);
    expect(new Set(opponent.notableCardIds).size).toBe(opponent.notableCardIds.length);
    for (const id of opponent.notableCardIds) expect(byId.has(id)).toBe(true);
  }
});
