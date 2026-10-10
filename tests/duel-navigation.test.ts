import { describe, expect, test } from 'bun:test';
import { duelViewPath, parseDuelView } from '../src/features/duel/duel-navigation';

describe('Duel Companion navigation', () => {
  test('defaults to planning and ignores unexpected views', () => {
    expect(parseDuelView('')).toBe('plan');
    expect(parseDuelView('?mode=plan')).toBe('plan');
    expect(parseDuelView('?mode=invalid')).toBe('plan');
  });
  test('resolves Battle History deep links', () => {
    expect(parseDuelView('?mode=history')).toBe('history');
  });
  test('preserves hand/opponent parameters on mode switches', () => {
    expect(duelViewPath('history', '?opponent=weevil&hand=0%2C7')).toBe(
      '/duel/?opponent=weevil&hand=0%2C7&mode=history',
    );
    expect(duelViewPath('plan', '?mode=history&opponent=weevil')).toBe(
      '/duel/?opponent=weevil',
    );
  });
});
