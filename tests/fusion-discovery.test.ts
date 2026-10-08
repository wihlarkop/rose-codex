import { describe, expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import { createFusionEngine } from '../src/lib/dotr/fusion';
import { createFusionDiscovery, type FusionOccurrence } from '../src/lib/dotr/fusion-discovery';

const data = await loadCanonical();
const engine = createFusionEngine(data.cards, data.fusions);
const discover = createFusionDiscovery(data.cards, data.fusions);
const hand = (...ids: number[]): FusionOccurrence[] =>
  ids.map((cardId, index) => ({ instanceId: `copy-${index}`, cardId, zone: 'hand' }));

describe('automatic canonical fusion discovery', () => {
  test('discovers direct results and every successful subset/ordering, with source provenance', () => {
    const basic = discover(hand(21, 36));
    expect(basic.results.map(result => result.resultCardId)).toEqual([24]);
    expect(basic.compatibility.map(entry => entry.ordinary)).toEqual(['direct', 'direct']);
    const result = discover(hand(21, 36, 533));
    expect(result.complete).toBe(true);
    expect(result.results.map(entry => entry.resultCardId)).toEqual([24, 535, 536, 538, 544]);
    const chain = result.results.find(entry => entry.resultCardId === 538)!.recipes
      .find(recipe => recipe.instanceIds.join() === 'copy-0,copy-1,copy-2')!;
    expect(chain.steps.map(step => step.resultCardId)).toEqual([24, 538]);
    expect(chain.steps[1]).toMatchObject({
      materials: [24, 533], sourceInstanceIds: ['copy-0', 'copy-1'],
      addedInstanceId: 'copy-2', inputInstanceIds: ['copy-0', 'copy-1', 'copy-2'],
    });
    expect(result.compatibility.every(entry => entry.ordinary === 'direct')).toBe(true);
  });

  test('exhausts a real five-card hand and recognizes intermediate-only participation', () => {
    const inputs = hand(21, 36, 534, 0, 683);
    expect(engine.fuse(21, 534)).toBeNull();
    expect(engine.fuse(36, 534)).toBeNull();
    const result = discover(inputs);
    expect(result.complete).toBe(true);
    expect(result.compatibility.map(entry => entry.ordinary)).toEqual([
      'direct', 'direct', 'chain', 'none', 'none',
    ]);
    // Independent exhaustive permutation fold, including subsets, against the unchanged engine.
    const expected = new Set<string>();
    function visit(order: number[], remaining: number[]) {
      if (order.length >= 2) {
        const folded = engine.chain(order.map(index => inputs[index]!.cardId));
        if (folded.status !== 'complete') return;
        const normalized = [...order];
        if (normalized[0]! > normalized[1]!) [normalized[0], normalized[1]] = [normalized[1]!, normalized[0]!];
        expected.add(`${folded.resultCardId}:${normalized.join(',')}`);
      }
      for (const index of remaining) visit([...order, index], remaining.filter(other => other !== index));
    }
    visit([], inputs.map((_, index) => index));
    const actual = new Set(result.results.flatMap(group => group.recipes.map(recipe =>
      `${group.resultCardId}:${recipe.instanceIds.map(id => inputs.findIndex(input => input.instanceId === id)).join(',')}`,
    )));
    expect(actual).toEqual(expected);
    expect(result.results.map(entry => entry.resultCardId)).toEqual([24, 538]);
  });

  test('requires distinct copies for same-ID fusions and retains alternative occurrence recipes', () => {
    expect(discover(hand(73)).results).toEqual([]);
    const copies = discover(hand(73, 73));
    expect(copies.results.map(entry => entry.resultCardId)).toEqual([312]);
    expect(copies.compatibility.map(entry => entry.ordinary)).toEqual(['direct', 'direct']);
    const alternatives = discover(hand(21, 21, 36, 534));
    expect(alternatives.results.find(entry => entry.resultCardId === 24)!.recipes).toHaveLength(2);
    for (const result of alternatives.results) for (const recipe of result.recipes) {
      expect(new Set(recipe.instanceIds).size).toBe(recipe.instanceIds.length);
      expect(engine.chain(recipe.instanceIds.map(id => hand(21, 21, 36, 534)
        .find(entry => entry.instanceId === id)!.cardId)).resultCardId).toBe(result.resultCardId);
    }
    expect(() => discover([{ instanceId: 'same', cardId: 21, zone: 'hand' },
      { instanceId: 'same', cardId: 36, zone: 'hand' }])).toThrow();
  });

  test('recalculates zone constraints; field starts precede hand cards and field pairs stay direct', () => {
    const inputs = hand(21, 36, 534);
    inputs[2]!.zone = 'summoning';
    const fieldLast = discover(inputs);
    expect(fieldLast.results.map(entry => entry.resultCardId)).toEqual([24]);
    expect(fieldLast.compatibility[2]!.ordinary).toBe('undetermined');
    inputs[2]!.zone = 'hand'; inputs[0]!.zone = 'summoning';
    const fieldFirst = discover(inputs);
    expect(fieldFirst.results.find(entry => entry.resultCardId === 538)!.recipes[0]!.instanceIds[0]).toBe('copy-0');
    expect(fieldFirst.results.find(entry => entry.resultCardId === 538)!.recipes[0]!.mode).toBe('summon');
    inputs[1]!.zone = 'summoning';
    const fieldPair = discover(inputs);
    expect(fieldPair.results.find(entry => entry.resultCardId === 24)!.recipes[0]!.mode).toBe('field-pair');
    expect(fieldPair.results.some(entry => entry.resultCardId === 538)).toBe(false);
    expect(fieldPair.complete).toBe(false);
  });

  test('budget exhaustion preserves results and never assigns a definitive negative', () => {
    const result = discover(hand(21, 36, 534, 0, 683), { maxChecks: 1 });
    expect(result.complete).toBe(false);
    expect(result.limits).toContain('budget');
    expect(result.results.map(entry => entry.resultCardId)).toEqual([24]);
    expect(result.compatibility.map(entry => entry.ordinary)).toEqual([
      'direct', 'direct', 'undetermined', 'undetermined', 'undetermined',
    ]);
    const large = discover(hand(...Array.from({ length: 100 }, (_, index) => [21, 36, 534][index % 3]!)));
    expect(large.checks).toBeLessThanOrEqual(25_000);
    expect(large.limits).toContain('budget');
    expect(large.compatibility.every(entry => entry.ordinary !== 'none')).toBe(true);
  });

  test('keeps verified special pairs separate and random transformations unresolved', () => {
    const result = discover(hand(7, 799));
    expect(result.results).toEqual([]);
    expect(result.specials[0]).toMatchObject({ resultCardId: 501, instanceIds: ['copy-0', 'copy-1'] });
    expect(result.compatibility.every(entry => entry.special)).toBe(true);
    const random = discover(hand(16, 800));
    expect(random.specials).toEqual([]);
    expect(random.limits).toContain('random');
    expect(random.compatibility.every(entry => entry.ordinary === 'undetermined')).toBe(true);
    expect(() => discover(hand(854))).toThrow();
  });
});
