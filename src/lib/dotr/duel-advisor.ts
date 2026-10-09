import type { BrowserCard } from './browser';
import type { FusionDiscovery, FusionOccurrence, FusionRecipe } from './fusion-discovery';
import type { MonsterType } from './model';

/** Terrain at the planned contact square. Special terrains and card effects
 * require separate rules and must never be approximated as neutral. */
export const DUEL_TERRAINS = [
  'Normal', 'Forest', 'Wasteland', 'Mountain', 'Meadow', 'Sea', 'Dark',
  'Toon', 'Labyrinth', 'Crush',
] as const;
export type DuelTerrain = (typeof DUEL_TERRAINS)[number];
export type OpponentPosition = 'unknown' | 'attack' | 'defense';

const TERRAIN_TYPES: Partial<Record<DuelTerrain, {
  positive: readonly MonsterType[];
  negative: readonly MonsterType[];
}>> = {
  Normal: { positive: [], negative: [] },
  Forest: {
    positive: ['Plant', 'Beast', 'Beast-Warrior', 'Insect', 'Pyro'],
    negative: ['Fiend'],
  },
  Wasteland: {
    positive: ['Rock', 'Dinosaur', 'Zombie', 'Machine'],
    negative: ['Aqua', 'Plant', 'Sea Serpent', 'Fish'],
  },
  Mountain: {
    positive: ['Fairy', 'Dragon', 'Thunder', 'Winged-Beast'],
    negative: ['Zombie'],
  },
  Meadow: {
    positive: ['Warrior', 'Beast-Warrior'],
    negative: ['Spellcaster'],
  },
  Sea: {
    positive: ['Aqua', 'Thunder', 'Fish', 'Sea Serpent'],
    negative: ['Pyro', 'Machine'],
  },
  Dark: {
    positive: ['Spellcaster', 'Fiend', 'Zombie'],
    negative: ['Fairy'],
  },
};

export interface BattleContext {
  terrain: DuelTerrain;
  opponentPosition: OpponentPosition;
  opponentCardId: number | null;
}

export type BattleStatus = 'stat-edge' | 'stat-trail' | 'stat-tie' | 'unknown';
export interface DuelPlay {
  cardId: number;
  source: 'hand' | 'field' | 'fusion';
  sourceLabel: string;
  recipe: FusionRecipe | null;
  materialCount: number;
  attack: number | null;
  targetStat: number | null;
  advantage: number | null;
  outcome: BattleStatus;
}

/** +500/-500 for ordinary known terrain/type interactions. Null explicitly
 * means special terrain or missing monster type, NOT zero. */
export function terrainModifier(type: MonsterType | null, terrain: DuelTerrain): number | null {
  const rule = TERRAIN_TYPES[terrain];
  if (!rule || !type) return null;
  if (rule.positive.includes(type)) return 500;
  if (rule.negative.includes(type)) return -500;
  return 0;
}

export function terrainAdjustedStat(
  base: number | null,
  type: MonsterType | null,
  terrain: DuelTerrain,
): number | null {
  const modifier = terrainModifier(type, terrain);
  return base === null || modifier === null ? null : Math.max(0, base + modifier);
}

export function compareBattleStats(
  attacker: BrowserCard,
  opponent: BrowserCard | null,
  context: BattleContext,
): { attack: number | null; targetStat: number | null; advantage: number | null; outcome: BattleStatus } {
  const attack = terrainAdjustedStat(attacker.atk, attacker.monsterType, context.terrain);
  const stat = context.opponentPosition === 'attack' ? opponent?.atk ?? null
    : context.opponentPosition === 'defense' ? opponent?.def ?? null : null;
  const targetStat = opponent && context.opponentPosition !== 'unknown'
    ? terrainAdjustedStat(stat, opponent.monsterType, context.terrain)
    : null;
  if (attack === null || targetStat === null)
    return { attack, targetStat, advantage: null, outcome: 'unknown' };
  const advantage = attack - targetStat;
  return {
    attack, targetStat, advantage,
    outcome: advantage > 0 ? 'stat-edge' : advantage < 0 ? 'stat-trail' : 'stat-tie',
  };
}

/** Read-only candidate comparison. It does NOT claim summon legality,
 * adjacency, movement, hidden-card identity, card effects, trap immunity or
 * Deck Leader rank. Each fusion is one discovered recipe, preserving its
 * explicit source occurrences and provisional field-summon restrictions. */
export function suggestDuelPlays(
  inputs: readonly FusionOccurrence[],
  discovery: FusionDiscovery,
  byId: ReadonlyMap<number, BrowserCard>,
  context: BattleContext,
  limit = 5,
): DuelPlay[] {
  const opponent = context.opponentCardId === null ? null : byId.get(context.opponentCardId) ?? null;
  const options: DuelPlay[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const entry = inputs[i]!;
    const card = byId.get(entry.cardId);
    if (!card || card.kind !== 'monster') continue;
    const compare = compareBattleStats(card, opponent, context);
    options.push({
      cardId: card.id, source: entry.zone === 'hand' ? 'hand' : 'field',
      sourceLabel: (entry.zone === 'hand' ? 'Hand' : 'Summoning Area') + ' ' +
        (inputs.filter((candidate) => candidate.zone === entry.zone).findIndex((v) => v.instanceId === entry.instanceId) + 1),
      recipe: null, materialCount: 1,
      ...compare,
    });
  }
  for (const result of discovery.results) {
    const card = byId.get(result.resultCardId);
    if (!card || card.kind !== 'monster') continue;
    const recipe = [...result.recipes].sort((a, b) =>
      a.instanceIds.length - b.instanceIds.length ||
      a.steps.length - b.steps.length ||
      a.mode.localeCompare(b.mode),
    )[0];
    if (!recipe) continue;
    options.push({
      cardId: card.id, source: 'fusion', sourceLabel: 'Fusion · ' + recipe.instanceIds.length + ' materials',
      recipe, materialCount: recipe.instanceIds.length,
      ...compareBattleStats(card, opponent, context),
    });
  }
  // Prioritize known comparative edge before high nominal ATK, while never
  // confusing no opponent data with evidence of a safe winning attack.
  const outcomeRank: Record<BattleStatus, number> = {
    'stat-edge': 3, 'stat-tie': 2, unknown: 1, 'stat-trail': 0,
  };
  return options.toSorted((a, b) =>
    outcomeRank[b.outcome] - outcomeRank[a.outcome] ||
    (b.advantage ?? -Infinity) - (a.advantage ?? -Infinity) ||
    (b.attack ?? -1) - (a.attack ?? -1) ||
    a.materialCount - b.materialCount ||
    a.cardId - b.cardId
  ).slice(0, Math.max(0, limit));
}
