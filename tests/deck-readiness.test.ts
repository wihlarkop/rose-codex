import { expect, test } from 'bun:test';
import { analyzeDeckReadiness } from '../src/lib/dotr/deck-readiness';
import type { BrowserCard } from '../src/lib/dotr/browser';

const sample = (id: number, deckCost: number | null, kind: BrowserCard['kind'] = 'monster'): BrowserCard => ({
  id, name: 'Card ' + id, kind, deckCost,
  level: kind === 'monster' ? 4 : null,
  monsterType: kind === 'monster' ? 'Warrior' : null,
  attribute: kind === 'monster' ? 'EARTH' : null,
  atk: kind === 'monster' ? 1000 : null, def: kind === 'monster' ? 1000 : null,
  trapRange: null, magicClass: null, password: null, effectText: null, image: null,
});

test('strict campaign budget and leader confirmation do not create false legal claims', () => {
  const cards = new Map(Array.from({ length: 41 }, (_, id) => [id, sample(id, 10)] as const));
  const deck = Array.from({ length: 40 }, (_, id) => id);
  const under = analyzeDeckReadiness(deck, cards, 40, 'confirmed-eligible', { deckCost: 401 });
  expect(under.summary).toBe('conditionally-ready');
  expect(under.remainingBudget).toBe(0);
  expect(under.minimumReduction).toBe(0);
  const equal = analyzeDeckReadiness(deck, cards, 40, 'confirmed-eligible', { deckCost: 400 });
  expect(equal.summary).toBe('needs-changes');
  expect(equal.minimumReduction).toBe(1);
  expect(analyzeDeckReadiness(deck, cards, 40, 'unknown', { deckCost: 401 }).summary)
    .toBe('needs-confirmation');
  expect(analyzeDeckReadiness(deck, cards, 40, 'confirmed-eligible', null).summary)
    .toBe('needs-confirmation');
});

test('flags excess copies and unknown cost, without claiming a false positive', () => {
  const cards = new Map([
    [1, sample(1, 10)],
    [2, sample(2, null)],
    [3, sample(3, 5, 'magic')],
  ]);
  const overfull = analyzeDeckReadiness([1, 1, 1, 1, 2], cards, 3, 'confirmed-eligible', { deckCost: 50 });
  expect(overfull.overCopyLimits).toEqual([{ cardId: 1, name: 'Card 1', count: 4, excess: 1 }]);
  expect(overfull.unknownCosts).toBe(1);
  expect(overfull.checks.find((item) => item.id === 'leader')?.status).toBe('fail');
  expect(overfull.summary).toBe('needs-changes');
  const unknown = analyzeDeckReadiness([2], cards, 1, 'confirmed-eligible', { deckCost: 20 });
  expect(unknown.checks.find((item) => item.id === 'campaign-cost')?.status).toBe('unknown');
  expect(unknown.remainingBudget).toBeNull();
});
