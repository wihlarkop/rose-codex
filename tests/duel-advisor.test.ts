import { expect, test } from 'bun:test';
import { browserCards } from '../src/lib/dotr/browser';
import { createFusionDiscovery, type FusionOccurrence } from '../src/lib/dotr/fusion-discovery';
import {
  compareBattleStats,
  suggestDuelPlays,
  terrainAdjustedStat,
  terrainModifier,
  DUEL_TERRAINS,
} from '../src/lib/dotr/duel-advisor';
import { loadCanonical } from '../scripts/data/canonical';

const canonical = await loadCanonical();
const cards = browserCards(canonical.cards, canonical.images);
const byId = new Map(cards.map((card) => [card.id, card]));
const discover = createFusionDiscovery(canonical.cards, canonical.fusions);

test('terrain modifier applies documented +500/-500 by Monster type', () => {
  expect(terrainModifier('Dragon', 'Mountain')).toBe(500);
  expect(terrainModifier('Zombie', 'Mountain')).toBe(-500);
  expect(terrainModifier('Reptile', 'Mountain')).toBe(0);
  expect(terrainModifier('Beast', 'Forest')).toBe(500);
  expect(terrainModifier('Fiend', 'Forest')).toBe(-500);
  expect(terrainModifier('Spellcaster', 'Meadow')).toBe(-500);
  expect(terrainModifier('Thunder', 'Sea')).toBe(500);
  expect(terrainModifier('Machine', 'Sea')).toBe(-500);
  expect(terrainModifier('Spellcaster', 'Dark')).toBe(500);
  expect(terrainModifier('Fairy', 'Dark')).toBe(-500);
  expect(terrainModifier('Plant', 'Wasteland')).toBe(-500);
  expect(terrainModifier('Dinosaur', 'Wasteland')).toBe(500);
  expect(terrainModifier('Dragon', 'Normal')).toBe(0);
});

test('special terrains are explicitly unsupported rather than treated as neutral', () => {
  expect(DUEL_TERRAINS).toContain('Toon');
  expect(DUEL_TERRAINS).toContain('Labyrinth');
  expect(DUEL_TERRAINS).toContain('Crush');
  for (const name of ['Toon', 'Labyrinth', 'Crush'] as const) {
    expect(terrainModifier('Dragon', name)).toBeNull();
    expect(terrainAdjustedStat(3000, 'Dragon', name)).toBeNull();
  }
  expect(terrainAdjustedStat(null, 'Dragon', 'Mountain')).toBeNull();
  expect(terrainAdjustedStat(200, 'Zombie', 'Mountain')).toBe(0);
});

test('face-up attack compares adjusted ATK to ATK at the same battle terrain', () => {
  const blueEyes = byId.get(0)!;
  const kaiser = byId.get(3)!;
  expect(compareBattleStats(blueEyes, kaiser, {
    opponentCardId: 3, opponentPosition: 'attack', terrain: 'Mountain',
  })).toEqual({ attack: 3500, targetStat: 2800, advantage: 700, outcome: 'stat-edge' });
});

test('face-up defense compares ATK to DEF while concealed information stays unknown', () => {
  const blueEyes = byId.get(0)!;
  const kaiser = byId.get(3)!;
  const defense = compareBattleStats(blueEyes, kaiser, {
    opponentCardId: 3, opponentPosition: 'defense', terrain: 'Normal',
  });
  expect(defense).toEqual({ attack: 3000, targetStat: 2000, advantage: 1000, outcome: 'stat-edge' });
  expect(compareBattleStats(blueEyes, kaiser, {
    opponentCardId: 3, opponentPosition: 'unknown', terrain: 'Normal',
  }).outcome).toBe('unknown');
  expect(compareBattleStats(blueEyes, null, {
    opponentCardId: null, opponentPosition: 'attack', terrain: 'Normal',
  }).advantage).toBeNull();
});

test('ranks direct Monster and confirmed fusion options from actual source occurrences', () => {
  const inputs: FusionOccurrence[] = [
    { instanceId: 'a', cardId: 21, zone: 'hand' },
    { instanceId: 'b', cardId: 36, zone: 'hand' },
    { instanceId: 'c', cardId: 3, zone: 'hand' },
  ];
  const result = suggestDuelPlays(inputs, discover(inputs), byId, {
    opponentCardId: 3, opponentPosition: 'attack', terrain: 'Normal',
  }, 10);
  expect(result.some((candidate) => candidate.cardId === 24 && candidate.source === 'fusion')).toBe(true);
  expect(result.some((candidate) => candidate.cardId === 21 && candidate.source === 'hand')).toBe(true);
  expect(result.find((candidate) => candidate.cardId === 24 && candidate.source === 'fusion')?.materialCount).toBe(2);
  const unknown = suggestDuelPlays(inputs, discover(inputs), byId, {
    opponentCardId: null, opponentPosition: 'unknown', terrain: 'Normal',
  });
  expect(unknown.every((candidate) => candidate.outcome === 'unknown')).toBe(true);
});
