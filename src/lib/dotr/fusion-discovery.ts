import { createFusionEngine, type FusionStep } from './fusion';
import type { Card, FusionData } from './model';

export type FusionZone = 'hand' | 'summoning';
export interface FusionOccurrence { instanceId: string; cardId: number; zone: FusionZone }
export type RecipeMode = 'hand' | 'summon' | 'field-pair';
export interface DiscoveryStep extends FusionStep {
  sourceInstanceIds: string[];
  addedInstanceId: string;
  inputInstanceIds: string[];
}
export interface FusionRecipe {
  instanceIds: string[];
  resultCardId: number;
  mode: RecipeMode;
  steps: DiscoveryStep[];
}
export interface FusionResult { resultCardId: number; recipes: FusionRecipe[] }
export interface SpecialRecipe {
  instanceIds: [string, string]; materials: [number, number]; resultCardId: number;
}
export interface OccurrenceCompatibility {
  instanceId: string;
  ordinary: 'direct' | 'chain' | 'none' | 'undetermined';
  special: boolean;
}
export type DiscoveryLimit = 'budget' | 'field-sequences' | 'random';
export interface FusionDiscovery {
  results: FusionResult[];
  specials: SpecialRecipe[];
  compatibility: OccurrenceCompatibility[];
  complete: boolean;
  checks: number;
  maxChecks: number;
  limits: DiscoveryLimit[];
}

export const DEFAULT_MAX_CHECKS = 25_000;

/** Successful sequential folds only, never arbitrary binary trees or failed-pair replacement.
 * The canonical engine/expanded pair map is built once per factory, outside reactive updates.
 * Hand seeds are unordered (lookup is symmetric); subsequent orderings remain distinct.
 * A field-assisted chain starts on the field and adds hand occurrences. Field-to-field is
 * direct planning only: repeated board movements and hand-chain-to-field timing are unresolved.
 */
export function createFusionDiscovery(cards: Card[], data: FusionData) {
  const engine = createFusionEngine(cards, data);
  const known = new Set(cards.map(card => card.id));

  return function discover(inputs: readonly FusionOccurrence[], options: { maxChecks?: number } = {}): FusionDiscovery {
    const maxChecks = options.maxChecks ?? DEFAULT_MAX_CHECKS;
    if (!Number.isSafeInteger(maxChecks) || maxChecks < 0) throw new RangeError('Invalid search budget');
    const occurrenceIds = new Set<string>();
    for (const input of inputs) {
      if (!known.has(input.cardId)) throw new RangeError(`Unknown DotR card ID: ${input.cardId}`);
      if (!input.instanceId || occurrenceIds.has(input.instanceId)) throw new RangeError('Occurrence IDs must be unique');
      if (input.zone !== 'hand' && input.zone !== 'summoning') throw new RangeError('Unknown planning zone');
      occurrenceIds.add(input.instanceId);
    }
    const limits = new Set<DiscoveryLimit>();
    if (inputs.length > 2 && inputs.some(input => input.zone === 'summoning')) limits.add('field-sequences');
    let checks = 0;
    function spend(): boolean {
      if (checks >= maxChecks) { limits.add('budget'); return false; }
      checks++;
      return true;
    }
    const groups = new Map<number, FusionRecipe[]>();
    const specials: SpecialRecipe[] = [];
    const direct = new Set<string>();
    const chain = new Set<string>();
    const special = new Set<string>();
    const queue: FusionRecipe[] = [];
    function record(recipe: FusionRecipe) {
      const recipes = groups.get(recipe.resultCardId) ?? [];
      recipes.push(recipe);
      groups.set(recipe.resultCardId, recipes);
      const participants = recipe.instanceIds.length === 2 ? direct : chain;
      recipe.instanceIds.forEach(id => participants.add(id));
      if (recipe.mode !== 'field-pair') queue.push(recipe);
    }

    // Enumerate direct subsets first so a large collection gets broad pair coverage before chains.
    pairs: for (let left = 0; left < inputs.length; left++) {
      for (let right = left + 1; right < inputs.length; right++) {
        if (!spend()) break pairs;
        let a = inputs[left]!; let b = inputs[right]!;
        if (a.zone === 'hand' && b.zone === 'summoning') [a, b] = [b, a];
        const resultCardId = engine.fuse(a.cardId, b.cardId);
        const instanceIds = [a.instanceId, b.instanceId];
        if (resultCardId !== null) {
          const mode: RecipeMode = a.zone === 'hand' ? 'hand' : b.zone === 'hand' ? 'summon' : 'field-pair';
          record({ resultCardId, instanceIds, mode, steps: [{
            materials: [a.cardId, b.cardId], resultCardId,
            sourceInstanceIds: [a.instanceId], addedInstanceId: b.instanceId,
            inputInstanceIds: instanceIds,
          }] });
        }
        const transformation = engine.transform(a.cardId, b.cardId);
        if (transformation?.kind === 'card') {
          specials.push({ instanceIds: [a.instanceId, b.instanceId], materials: [a.cardId, b.cardId], resultCardId: transformation.cardId });
          instanceIds.forEach(id => special.add(id));
        } else if (transformation?.kind === 'random') limits.add('random');
      }
    }

    // Memoize viable next hand materials per intermediate ID for this exact input collection.
    // Keep recipe prefixes distinct: merging states would lose alternative sequences/provenance.
    const nextMaterials = new Map<number, { input: FusionOccurrence; resultCardId: number }[]>();
    function nextFor(cardId: number) {
      const cached = nextMaterials.get(cardId);
      if (cached) return cached;
      const candidates = [];
      for (const input of inputs) {
        if (!spend()) break;
        if (input.zone !== 'hand') continue;
        const resultCardId = engine.fuse(cardId, input.cardId);
        if (resultCardId !== null) candidates.push({ input, resultCardId });
      }
      nextMaterials.set(cardId, candidates);
      return candidates;
    }
    chains: for (let index = 0; index < queue.length; index++) {
      const prefix = queue[index]!;
      for (const { input, resultCardId } of nextFor(prefix.resultCardId)) {
        if (!spend()) break chains;
        if (prefix.instanceIds.includes(input.instanceId)) continue;
        const instanceIds = [...prefix.instanceIds, input.instanceId];
        record({ resultCardId, instanceIds, mode: prefix.mode, steps: [...prefix.steps, {
          materials: [prefix.resultCardId, input.cardId], resultCardId,
          sourceInstanceIds: prefix.instanceIds, addedInstanceId: input.instanceId,
          inputInstanceIds: instanceIds,
        }] });
      }
      if (limits.has('budget')) break;
    }
    const complete = limits.size === 0;
    return {
      results: [...groups].sort(([a], [b]) => a - b).map(([resultCardId, recipes]) => ({ resultCardId, recipes })),
      specials, complete, checks, maxChecks, limits: [...limits],
      compatibility: inputs.map(input => ({
        instanceId: input.instanceId,
        ordinary: direct.has(input.instanceId) ? 'direct' : chain.has(input.instanceId) ? 'chain' : complete ? 'none' : 'undetermined',
        special: special.has(input.instanceId),
      })),
    };
  };
}
