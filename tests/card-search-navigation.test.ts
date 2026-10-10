import { describe, expect, test } from 'bun:test';
import { cardSearchAllPath, cardSearchCardPath } from '../src/components/shell/card-search-navigation';

describe('Global card search navigation', () => {
  test('preserves library name searches and encodes special characters', () => {
    expect(cardSearchAllPath(' blue eye ')).toBe('/cards/?q=blue%20eye');
    expect(cardSearchAllPath('Black & White')).toBe('/cards/?q=Black%20%26%20White');
    expect(cardSearchAllPath('  ')).toBe('/cards/');
  });

  test('uses canonical padded card IDs for direct suggestions', () => {
    expect(cardSearchCardPath(0)).toBe('/cards/?q=000');
    expect(cardSearchCardPath(7)).toBe('/cards/?q=007');
    expect(cardSearchCardPath(853)).toBe('/cards/?q=853');
  });

  test('bounds the existing global-search URL query contract', () => {
    expect(new URL(cardSearchAllPath('a'.repeat(100)), 'https://example.test').searchParams.get('q'))
      .toHaveLength(80);
  });
});
