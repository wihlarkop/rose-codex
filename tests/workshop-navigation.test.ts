import { describe, expect, test } from 'bun:test';
import { deckWorkshopPath, parseDeckWorkshopMode } from '../src/features/decks/workshop-navigation';

describe('unified Deck Workshop navigation', () => {
  test('defaults to Build and ignores unsupported modes', () => {
    expect(parseDeckWorkshopMode('')).toBe('build');
    expect(parseDeckWorkshopMode('?mode=build')).toBe('build');
    expect(parseDeckWorkshopMode('?mode=unknown&deck=abc')).toBe('build');
  });
  test('recognizes Practice and Inventory deep links', () => {
    expect(parseDeckWorkshopMode('?mode=practice&deck=abc')).toBe('practice');
    expect(parseDeckWorkshopMode('?mode=inventory')).toBe('inventory');
  });
  test('preserves valid existing query payload while switching modes', () => {
    expect(deckWorkshopPath('practice', '?suggest=0%2C7&opponent=weevil')).toBe('/decks/?suggest=0%2C7&opponent=weevil&mode=practice');
    expect(deckWorkshopPath('inventory', '?mode=practice&deck=abc')).toBe('/decks/?mode=inventory&deck=abc');
    expect(deckWorkshopPath('build', '?mode=inventory&deck=abc')).toBe('/decks/?deck=abc');
  });
});
