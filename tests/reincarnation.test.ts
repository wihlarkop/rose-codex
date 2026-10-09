import { expect, test } from 'bun:test';
import {
  adjustReincarnationProgress,
  emptyReincarnationProgress,
  validateReincarnationProgress,
} from '../src/lib/dotr/reincarnation';

test('manual duel tracker stops at five until the player explicitly resets it', () => {
  let progress = emptyReincarnationProgress();
  for (let i = 0; i < 8; i++) progress = adjustReincarnationProgress(progress, 1);
  expect(progress.duelsCompleted).toBe(5);
  progress = adjustReincarnationProgress(progress, -1);
  expect(progress.duelsCompleted).toBe(4);
  expect(emptyReincarnationProgress().duelsCompleted).toBe(0);
  expect(adjustReincarnationProgress(emptyReincarnationProgress(), -1).duelsCompleted).toBe(0);
});

test('saved progress accepts only the expected version and a bounded integer', () => {
  expect(validateReincarnationProgress({ schemaVersion: 1, duelsCompleted: 5 }))
    .toEqual({ schemaVersion: 1, duelsCompleted: 5 });
  for (const invalid of [
    null, { schemaVersion: 2, duelsCompleted: 2 },
    { schemaVersion: 1, duelsCompleted: -1 },
    { schemaVersion: 1, duelsCompleted: 6 },
    { schemaVersion: 1, duelsCompleted: 1.5 },
    { schemaVersion: 1, duelsCompleted: '3' },
  ]) expect(() => validateReincarnationProgress(invalid)).toThrow();
});
