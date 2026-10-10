import { expect, test } from 'bun:test';
import {
  MAX_BATTLE_LOGS, validateBattleLogs, summarizeBattles,
  type BattleLog,
} from '../src/features/battle-lab/model';

const a: BattleLog = {
  id: 'a', playedAt: '2026-10-10T09:00:00.000Z', opponentId: 'weevil',
  deckId: 'd1', deckName: 'Test vs Weevil', outcome: 'win',
  turns: 5, note: 'Good terrain',
};
const b: BattleLog = {
  ...a, id: 'b', outcome: 'loss', turns: 9,
};

test('M5-08 validates strict bounded local-only feedback without silent overwrite', () => {
  expect(validateBattleLogs({ schemaVersion: 1, matches: [a, b] }).matches).toHaveLength(2);
  expect(() => validateBattleLogs({ schemaVersion: 2, matches: [] })).toThrow();
  expect(() => validateBattleLogs({ schemaVersion: 1, matches: [a, a] })).toThrow(/Duplicate/);
  expect(() => validateBattleLogs({ schemaVersion: 1, matches: [{ ...a, turns: 0 }] })).toThrow();
  expect(() => validateBattleLogs({ schemaVersion: 1, matches: [{ ...a, outcome: 'draw' }] })).toThrow();
  expect(() => validateBattleLogs({ schemaVersion: 1, matches: [{ ...a, opponentId: 'other' }] })).toThrow();
  expect(() => validateBattleLogs({ schemaVersion: 1, matches: [{ ...a, note: 'x'.repeat(401) }] })).toThrow();
  expect(() => validateBattleLogs({
    schemaVersion: 1,
    matches: Array.from({ length: MAX_BATTLE_LOGS + 1 }, (_, i) => ({ ...a, id: String(i) })),
  })).toThrow();
});
test('battle summary is observed descriptive statistics only', () => {
  expect(summarizeBattles([])).toEqual({
    battles: 0, wins: 0, losses: 0, observedWinRate: null, averageTurns: null,
  });
  expect(summarizeBattles([a, b])).toEqual({
    battles: 2, wins: 1, losses: 1, observedWinRate: 0.5, averageTurns: 7,
  });
});
