import type { BrowserCard } from './browser';
import type { FusionDiscovery, FusionRecipe } from './fusion-discovery';

export interface SuggestedPlay {
  resultCardId: number;
  recipe: FusionRecipe;
  atk: number | null;
  def: number | null;
}

/** Transparent heuristic: strongest *known* result ATK, then fewer source
 * cards, then DEF and ID. This does not optimize a full DotR duel. */
export function suggestFusionPlays(
  discovery: FusionDiscovery,
  cardById: ReadonlyMap<number, BrowserCard>,
  limit = 3,
): SuggestedPlay[] {
  return discovery.results
    .flatMap((group) => {
      const card = cardById.get(group.resultCardId);
      const recipe = group.recipes[0];
      return card && recipe
        ? [{ resultCardId: group.resultCardId, recipe, atk: card.atk, def: card.def }]
        : [];
    })
    .sort(
      (a, b) =>
        (b.atk ?? -1) - (a.atk ?? -1) ||
        a.recipe.instanceIds.length - b.recipe.instanceIds.length ||
        (b.def ?? -1) - (a.def ?? -1) ||
        a.resultCardId - b.resultCardId,
    )
    .slice(0, limit);
}
