import { expect, test } from 'bun:test';
import {
  drawToFive,
  handLink,
  parseHandLink,
  setAsideHandCard,
  shuffledDeck,
} from '../src/lib/dotr/deck-simulation';

test('shuffles a deck without inventing or duplicating copies', () => {
  const source = [21, 21, 36, 534, 0, 683];
  const shuffled = shuffledDeck(source, () => 0);
  expect(shuffled).toHaveLength(source.length);
  expect(shuffled.toSorted((a, b) => a - b)).toEqual(source.toSorted((a, b) => a - b));
  expect(source).toEqual([21, 21, 36, 534, 0, 683]);
});

test('draws up to five, preserves remaining pile, and sets aside exactly one physical copy', () => {
  const original = [21, 21, 36, 534, 0, 683, 587];
  let counter = 0;
  const nextId = () => String(++counter);
  const first = drawToFive({ drawPile: original, hand: [], setAside: [] }, nextId);
  expect(first.hand.map((c) => c.cardId)).toEqual(original.slice(0, 5));
  expect(first.drawPile).toEqual([683, 587]);
  expect(first.drawPile).not.toBe(original);
  const afterAside = setAsideHandCard(first, first.hand[0]!.instanceId);
  expect(afterAside.hand.map((c) => c.cardId)).toEqual([21, 36, 534, 0]);
  expect(afterAside.setAside).toEqual([21]);
  const toppedUp = drawToFive(afterAside, nextId);
  expect(toppedUp.hand.map((c) => c.cardId)).toEqual([21, 36, 534, 0, 683]);
  expect(toppedUp.drawPile).toEqual([587]);
  expect(drawToFive(toppedUp, nextId)).toBe(toppedUp);
});

test('transfers a validated five-card Hand through Fusion URL without losing copies', () => {
  const ids = [21, 21, 36, 534, 0];
  const href = handLink(ids);
  expect(href).toContain('/fusion/?hand=');
  expect(parseHandLink(new URL(href, 'https://example.test').search, new Set(ids))).toEqual(ids);
  expect(parseHandLink('?hand=21%2C999', new Set(ids))).toEqual([]);
  expect(parseHandLink('?hand=21,36,534,0,683,587', new Set(ids))).toEqual([]);
  expect(parseHandLink('?hand=garbage', new Set(ids))).toEqual([]);
  expect(parseHandLink('?filter=21', new Set(ids))).toBeNull();
  expect(handLink([21, 36], 'simulator')).toBe('/fusion/?hand=21%2C36&from=simulator');
  expect(handLink([21, 36], 'recipes')).toBe('/fusion/?hand=21%2C36&from=recipes');
  expect(parseHandLink('?hand=21%2C36&from=recipes', new Set([21, 36]))).toEqual([21, 36]);
});
