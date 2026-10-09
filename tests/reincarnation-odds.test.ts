import { expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import { browserCards } from '../src/lib/dotr/browser';
import {
  REINCARNATION_EXCLUDED_REWARD_IDS,
  REINCARNATION_EXCLUDED_REWARDS,
  estimateReincarnation,
} from '../src/lib/dotr/reincarnation-odds';

const canonical = await loadCanonical();
const cards = browserCards(canonical.cards, canonical.images);

test('reward exclusion set is well formed and every permitted output resolves', () => {
  expect(REINCARNATION_EXCLUDED_REWARD_IDS).toHaveLength(167);
  expect(new Set(REINCARNATION_EXCLUDED_REWARD_IDS).size).toBe(167);
  expect(REINCARNATION_EXCLUDED_REWARDS.has(0)).toBe(true);
  expect(REINCARNATION_EXCLUDED_REWARDS.has(820)).toBe(false);
  expect(cards).toHaveLength(854);
  const estimate = estimateReincarnation(397, 0, 0, cards);
  expect(estimate).not.toBeNull();
  expect(estimate!.total).toBeCloseTo(1, 10);
  expect(estimate!.results.every(row =>
    row.probability > 0 && Number.isFinite(row.probability)
    && !REINCARNATION_EXCLUDED_REWARDS.has(row.cardId)
    && row.cardId !== 397 && !!cards.find(card => card.id === row.cardId),
  )).toBe(true);
});

test('rank uses maximum of A/B, with correct boundaries and stable repeated calls', () => {
  const base = estimateReincarnation(397, 2, 8, cards)!;
  const swapped = estimateReincarnation(397, 8, 2, cards)!;
  const lower = estimateReincarnation(397, 2, 2, cards)!;
  expect(base.highRangeChance).toBeCloseTo(0.24, 10);
  expect(base.results).toEqual(swapped.results);
  expect(base.results).not.toEqual(lower.results);
  expect(estimateReincarnation(397, 2, 8, cards)!.results).toEqual(base.results);
  expect(estimateReincarnation(671, 0, 0, cards)).toBeNull();
  expect(() => estimateReincarnation(397, -1, 0, cards)).toThrow();
});

test('empty cost pools fall back to Fake Trap and a sacrificed card stays excluded', () => {
  const one = cards.find(card => card.id === 397)!;
  const onlyInput = [one];
  const result = estimateReincarnation(one.id, 0, 0, onlyInput)!;
  expect(result.results).toEqual([{ cardId: 820, probability: 1 }]);
});
