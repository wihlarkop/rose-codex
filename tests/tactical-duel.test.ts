import { expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import { browserCards } from '../src/lib/dotr/browser';
import { createFusionDiscovery, type FusionOccurrence } from '../src/lib/dotr/fusion-discovery';
import { evaluateTacticalDuel } from '../src/lib/dotr/tactical-duel';

const data = await loadCanonical();
const cards = browserCards(data.cards, data.images);
const byId = new Map(cards.map(card => [card.id, card]));
const discover = createFusionDiscovery(data.cards, data.fusions);
const selected: FusionOccurrence[] = [
  { instanceId: 'f1', cardId: 0, zone: 'summoning' },
  { instanceId: 'h1', cardId: 21, zone: 'hand' },
  { instanceId: 'h2', cardId: 36, zone: 'hand' },
];
const knownContext = {
  opponentCardId: 3,
  opponentPosition: 'attack' as const,
  terrain: 'Mountain' as const,
};

test('M5-04 prioritizes an actual Field stat comparison over speculative Hand summons', () => {
  const result = evaluateTacticalDuel(selected, discover(selected), byId, knownContext);
  expect(result.contextKnown).toBe(true);
  expect(result.options[0]?.kind).toBe('field-comparison');
  expect(result.options[0]?.cardId).toBe(0);
  expect(result.options[0]?.attack).toBe(3500);
  expect(result.options[0]?.enemyStat).toBe(2800);
  expect(result.options[0]?.statDifference).toBe(700);
  expect(result.options.every(option => option.conditional)).toBe(true);
  expect(result.options.filter(option => option.kind === 'hand-preparation')
    .every(option => /NOT a monster that can attack immediately/.test(option.note))).toBe(true);
});

test('potential fusions contain only known recipe materials from actual occurrences', () => {
  const handOnly = selected.filter(item => item.zone === 'hand');
  const r = evaluateTacticalDuel(handOnly, discover(handOnly), byId,
    { opponentCardId: 3, opponentPosition: 'attack', terrain: 'Normal' }, 15);
  const fusion = r.options.find(item => item.kind === 'fusion-possibility' && item.cardId === 24);
  expect(fusion).toBeDefined();
  expect(fusion?.materialIds).toEqual([21, 36]);
  expect(fusion?.conditional).toBe(true);
});

test('concealed enemy or special terrain cannot yield a fabricated positive stat comparison', () => {
  for (const context of [
    { opponentCardId: null, opponentPosition: 'unknown' as const, terrain: 'Normal' as const },
    { opponentCardId: 3, opponentPosition: 'unknown' as const, terrain: 'Mountain' as const },
    { opponentCardId: 3, opponentPosition: 'attack' as const, terrain: 'Crush' as const },
    { opponentCardId: 3, opponentPosition: 'defense' as const, terrain: 'Toon' as const },
  ]) {
    const r = evaluateTacticalDuel(selected, discover(selected), byId, context);
    expect(r.contextKnown).toBe(false);
    expect(r.options.every(option =>
      option.outcome === 'unknown' && option.statDifference === null)).toBe(true);
  }
});

test('unknown card IDs and invalid output bounds fail closed without mutating inputs', () => {
  const untouched = selected.map(item => ({ ...item }));
  expect(() => evaluateTacticalDuel(
    [{ instanceId: 'unknown', cardId: 99999, zone: 'hand' }],
    discover(selected), byId, knownContext,
  )).toThrow(/Unknown card/);
  expect(() => evaluateTacticalDuel(
    selected, discover(selected), byId, knownContext, 31,
  )).toThrow(/Invalid tactical option limit/);
  const r = evaluateTacticalDuel(selected, discover(selected), byId, knownContext, 0);
  expect(r.options).toEqual([]);
  expect(selected).toEqual(untouched);
});
