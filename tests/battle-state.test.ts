import { expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import { browserCards } from '../src/lib/dotr/browser';
import {
  MAX_SP, START_SP, nextTurnSP, squareRelation, summonAssessment,
  rankTacticalDecisions, sourceFieldDistance, type BattleSnapshot,
} from '../src/lib/dotr/battle-state';
import { createFusionDiscovery, type FusionOccurrence } from '../src/lib/dotr/fusion-discovery';
import { evaluateTacticalDuel } from '../src/lib/dotr/tactical-duel';

const data = await loadCanonical();
const library = browserCards(data.cards, data.images);
const byId = new Map(library.map(card => [card.id, card]));
const blueEyes = byId.get(0)!;
const partial: BattleSnapshot = {
  summoningPoints: null, alreadyPlayedCard: 'unknown',
  leaderSquare: null, enemySquare: null, fieldSquares: {},
};

test('M5-05 normal SP rules are bounded with no inferred turn advancement', () => {
  expect(START_SP).toBe(4);
  expect(MAX_SP).toBe(12);
  expect(nextTurnSP(0)).toBe(3);
  expect(nextTurnSP(11)).toBe(12);
  expect(nextTurnSP(12)).toBe(12);
  expect(() => nextTurnSP(-1)).toThrow(RangeError);
  expect(() => nextTurnSP(12.2)).toThrow(RangeError);
  expect(() => nextTurnSP(13)).toThrow(RangeError);
});
test('level cost and one card per turn distinguish hard blocks from unknown information', () => {
  expect(blueEyes.level).toBe(8);
  expect(summonAssessment(blueEyes, partial).status).toBe('information-needed');
  const atSeven = { ...partial, summoningPoints: 7, alreadyPlayedCard: 'no' as const };
  expect(summonAssessment(blueEyes, atSeven).status).toBe('blocked');
  expect(summonAssessment(blueEyes, { ...atSeven, summoningPoints: 8 })
    .status).toBe('conditional');
  expect(summonAssessment(blueEyes, { ...partial, alreadyPlayedCard: 'yes' })
    .status).toBe('blocked');
  expect(summonAssessment(byId.get(752)!, { ...atSeven, summoningPoints: 0 })
    .status).toBe('conditional');
  expect(summonAssessment(byId.get(752)!, { ...atSeven, alreadyPlayedCard: 'yes' })
    .status).toBe('blocked');
  expect(() => summonAssessment(blueEyes, { ...partial, summoningPoints: 17 }))
    .toThrow(RangeError);
});

test('7x7 optional coordinates do not fabricate legal pathfinding', () => {
  expect(squareRelation(null, { row: 1, col: 1 })).toBe('unknown');
  expect(squareRelation({ row: 3, col: 3 }, { row: 4, col: 4 })).toBe('neighbor');
  expect(squareRelation({ row: 3, col: 3 }, { row: 3, col: 3 })).toBe('same');
  expect(squareRelation({ row: 0, col: 0 }, { row: 6, col: 6 })).toBe('separated');
  expect(() => squareRelation({ row: -1, col: 0 }, { row: 1, col: 1 }))
    .toThrow(RangeError);
});

test('M5-06 renders conditional field choices; SP blocks only supported summon checks', () => {
  const selected: FusionOccurrence[] = [
    { instanceId: 'field-blue-eyes', cardId: 0, zone: 'summoning' },
    { instanceId: 'hand-blue-eyes', cardId: 0, zone: 'hand' },
    { instanceId: 'hand-weak', cardId: 21, zone: 'hand' },
  ];
  const discover = createFusionDiscovery(data.cards, data.fusions);
  const comparison = evaluateTacticalDuel(selected, discover(selected), byId, {
    opponentCardId: 3, opponentPosition: 'attack', terrain: 'Mountain',
  });
  const state = {
    ...partial, summoningPoints: 4, alreadyPlayedCard: 'no' as const,
    enemySquare: { row: 1, col: 1 },
    fieldSquares: { 'field-blue-eyes': { row: 1, col: 2 } },
  };
  const actions = rankTacticalDecisions(
    selected.filter(item => item.zone === 'hand'), comparison, byId, state,
  );
  expect(actions.some(item => item.type === 'attack-check' && item.status === 'conditional')).toBe(true);
  expect(actions.find(item => item.id === 'summon:hand-blue-eyes')?.status).toBe('blocked');
  expect(actions.some(item => item.type === 'hold')).toBe(true);
  const fieldOption = comparison.options.find(item => item.kind === 'field-comparison')!;
  expect(sourceFieldDistance(fieldOption, selected.filter(item => item.zone === 'summoning'), state))
    .toBe('neighbor');
  expect(rankTacticalDecisions(
    selected.filter(item => item.zone === 'hand'), comparison, byId,
    { ...state, alreadyPlayedCard: 'yes' },
  ).filter(item => item.type === 'summon').every(item => item.status === 'blocked')).toBe(true);
});
