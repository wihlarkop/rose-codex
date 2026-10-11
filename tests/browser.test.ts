import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';
import cards from '../data/canonical/cards.json';
import { browserCards, filterCards } from '../src/lib/dotr/browser';
import type { Card } from '../src/lib/dotr/model';

const library = browserCards(cards as Card[]);
const all = { query: '', kind: '', monsterType: '', attribute: '' };

describe('text-first library search and filters', () => {
  test('projects canonical inspect metadata without fusion payload', () => {
    expect(library).toHaveLength(854);
    expect(library[0]).not.toHaveProperty('powerUpCardIds');
    expect(library[0]).not.toHaveProperty('effect');
    expect(library[0]!.password).toBe((cards as Card[])[0]!.password);
  });
  test('searches punctuation-insensitive name tokens', () => {
    expect(filterCards(library, { ...all, query: ' bLuE   eyes ' }).map(c => c.id)).toContain(0);
    expect(filterCards(library, { ...all, query: 'eyes blue' }).map(c => c.id)).toContain(0);
    expect(filterCards(library, { ...all, query: 'no such dotr card' })).toHaveLength(0);
  });
  test('preserves Greek letters and matches apostrophes naturally', () => {
    expect(filterCards(library, { ...all, query: 'α' }).map(c => c.id)).toEqual([414]);
    expect(filterCards(library, { ...all, query: 'harpies pet' }).map(c => c.id)).toEqual([30]);
  });
  test.each(['21', '021'])('finds exact ID %s', query => {
    expect(filterCards(library, { ...all, query }).map(c => c.id)).toEqual([21]);
  });
  test('composes kind, monster type and attribute without coercing null', () => {
    const result = filterCards(library, { ...all, kind: 'monster', monsterType: 'Dragon', attribute: 'LIGHT' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(c => c.kind === 'monster' && c.monsterType === 'Dragon' && c.attribute === 'LIGHT')).toBe(true);
    expect(filterCards(library, { ...all, kind: 'trap', attribute: 'LIGHT' })).toHaveLength(0);
    expect(filterCards(library, all)).toHaveLength(854);
  });


  test('does not expose artwork fields or bundle card images in public assets', () => {
    expect(library.every((card) => !Object.hasOwn(card, 'image'))).toBe(true);
    const publicPath = new URL('../public/', import.meta.url);
    const files = existsSync(publicPath) ? readdirSync(publicPath, { recursive: true }) : [];
    expect(files.filter((name) => /\.(webp|png|jpe?g|gif|avif)$/i.test(name))).toEqual([]);
  });

});
