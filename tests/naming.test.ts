import { describe, expect, test } from 'bun:test';
import { nameGroup, starterDecksForName, characterValue } from '../src/lib/dotr/naming';

describe('DotR player naming', () => {
  test('reproduces the published reverse-engineering example', () => {
    expect(nameGroup('CM Punk')).toBe(9);
    expect(starterDecksForName('CM Punk')).toEqual({ groupId: 9, leaderCardIds: [458,132,266] });
  });
  test.each([['A',0], ['B',1], ['Rose',4], ['a',13], [' ',10], ['AAAAAAAAAAAA',8], ['¥',13]])('%s selects group %d', (name, group) => {
    expect(nameGroup(name)).toBe(group);
  });
  test('all 16 groups can be selected and contain three ID-based choices', () => {
    for (const [group, letter] of [...'ABCDEFGHIJKLMNOP'].entries()) {
      const result = starterDecksForName(letter);
      expect(result.groupId).toBe(group);
      expect(result.leaderCardIds).toHaveLength(3);
      expect(result.leaderCardIds.every(Number.isInteger)).toBe(true);
    }
  });
  test('uses game codes rather than Unicode codes, retaining case and spaces', () => {
    expect(characterValue('A')).toBe(6);
    expect(characterValue('a')).toBe(3);
    expect(characterValue('1')).toBe(15);
    expect(characterValue('0')).toBe(8);
    expect(characterValue(',')).toBe(2);
    expect(characterValue(' ')).toBe(0);
    expect(nameGroup('A ')).not.toBe(nameGroup('A'));
  });
  test.each(['', 'ABCDEFGHIJKLM', '@', '\\', 'é', '😀', 'A\n', 'A\t'])('rejects unsupported input %j', name => {
    expect(() => starterDecksForName(name)).toThrow();
  });
  test('returns fresh choices rather than allowing callers to mutate canonical data', () => {
    starterDecksForName('A').leaderCardIds[0] = 0;
    expect(starterDecksForName('A').leaderCardIds).toEqual([670,132,34]);
  });
});
