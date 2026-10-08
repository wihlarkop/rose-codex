import { expandFusionRules } from './fusion';
import type { FusionData } from './model';

export interface EncyclopediaRecipe {
  materials: [number, number];
  resultCardId: number;
}

export interface FusionEncyclopedia {
  ordinary: ReadonlyMap<number, readonly EncyclopediaRecipe[]>;
  special: ReadonlyMap<number, readonly EncyclopediaRecipe[]>;
  resultIds: number[];
  ordinaryCount: number;
}

/** Reverse the canonical *resolved* pair table. No generic fusion inference or
 * exponential chain enumeration; specials remain separate from ordinary pairs. */
export function buildFusionEncyclopedia(data: FusionData): FusionEncyclopedia {
  const ordinary = new Map<number, EncyclopediaRecipe[]>();
  const special = new Map<number, EncyclopediaRecipe[]>();
  const pairs = expandFusionRules(data.rules);
  for (const [key, resultCardId] of pairs) {
    const [left, right] = key.split(',').map(Number);
    const recipes = ordinary.get(resultCardId) ?? [];
    recipes.push({ materials: [left!, right!], resultCardId });
    ordinary.set(resultCardId, recipes);
  }
  for (const entry of data.transformations) {
    if (entry.outcome.kind !== 'card') continue;
    const materials = [...entry.materials].sort((a, b) => a - b) as [number, number];
    const recipes = special.get(entry.outcome.cardId) ?? [];
    recipes.push({ materials, resultCardId: entry.outcome.cardId });
    special.set(entry.outcome.cardId, recipes);
  }
  const sort = (recipes: EncyclopediaRecipe[]) =>
    recipes.sort(
      (a, b) => a.materials[0] - b.materials[0] || a.materials[1] - b.materials[1],
    );
  for (const recipes of ordinary.values()) sort(recipes);
  for (const recipes of special.values()) sort(recipes);
  const resultIds = [...new Set([...ordinary.keys(), ...special.keys()])].sort((a, b) => a - b);
  return { ordinary, special, resultIds, ordinaryCount: pairs.size };
}

export interface MissingCopy {
  cardId: number;
  needed: number;
  owned: number;
}

/** A pair with identical material IDs consumes two distinct owned copies.
 * A null owned record means ownership is unknown, never 'not owned'. */
export function missingOwnedCopies(
  materials: readonly [number, number],
  owned: Readonly<Record<string, number>> | null,
): MissingCopy[] | null {
  if (owned === null) return null;
  const required = new Map<number, number>();
  for (const id of materials) required.set(id, (required.get(id) ?? 0) + 1);
  const missing: MissingCopy[] = [];
  for (const [cardId, needed] of required) {
    const have = owned[String(cardId)] ?? 0;
    if (have < needed) missing.push({ cardId, needed, owned: have });
  }
  return missing;
}
