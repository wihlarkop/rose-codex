import { describe, expect, test } from 'bun:test';
import { createRecipeHand } from '../src/features/fusion/recipe-handoff';

describe('recipe to Workbench handoff', () => {
  const allowed = new Map([[0, true], [7, true], [60, true]]);
  test('creates separate hand instances for repeated recipe materials', () => {
    let index = 0;
    const entries = createRecipeHand([0, 0, 7], allowed, () => 'copy-' + ++index);
    expect(entries).toEqual([
      { instanceId: 'copy-1', cardId: 0, zone: 'hand' },
      { instanceId: 'copy-2', cardId: 0, zone: 'hand' },
      { instanceId: 'copy-3', cardId: 7, zone: 'hand' },
    ]);
  });
  test('rejects invalid or incomplete handoffs without invoking the ID generator', () => {
    let called = 0;
    const id = () => { called++; return String(called); };
    expect(createRecipeHand([0], allowed, id)).toBeNull();
    expect(createRecipeHand([0, 999], allowed, id)).toBeNull();
    expect(createRecipeHand([0, 7.5], allowed, id)).toBeNull();
    expect(called).toBe(0);
  });
});
