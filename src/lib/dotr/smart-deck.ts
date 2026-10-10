import { DUEL_TERRAINS, terrainModifier, type DuelTerrain } from './duel-advisor';
import type { Card, FusionData } from './model';
import type { OpponentProfile } from './opponents';

/** Explainable, deterministic matchup heuristic. No game effects, Deck Leader
 * rank, summon legality, or predicted win rates are inferred. */
export type DeckStyle = 'balanced' | 'aggressive' | 'defensive';

export interface CardMatchup {
  cardId: number;
  rating: number;
  terrainAverage: number | null;
  knownThreats: number;
  winningStatChecks: number;
  totalStatChecks: number;
}
export interface SmartDeck {
  opponentId: string;
  style: DeckStyle;
  cardIds: number[];
  deckCost: number;
  costLimit: number;
  groups: { cardId: number; copies: number; reason: string }[];
  equipCount: number;
  notes: string[];
}

function supportedTerrainNames(profile: OpponentProfile): DuelTerrain[] {
  return profile.terrains.filter((terrain): terrain is DuelTerrain =>
    DUEL_TERRAINS.includes(terrain as DuelTerrain)
      && !['Toon', 'Crush', 'Labyrinth'].includes(terrain));
}

export function assessCardMatchup(card: Card, opponent: OpponentProfile,
  byId: ReadonlyMap<number, Card>, style: DeckStyle = 'balanced'): CardMatchup {
  const ordinary = supportedTerrainNames(opponent);
  const mods = ordinary.map(t => terrainModifier(card.monsterType, t))
    .filter((n): n is number => n !== null);
  const terrainAverage = mods.length
    ? mods.reduce((sum, n) => sum + n, 0) / mods.length : null;
  const threats = opponent.notableCardIds.map(id => byId.get(id))
    .filter((c): c is Card => !!c && c.kind === 'monster' && c.atk !== null);
  let winningStatChecks = 0;
  let totalStatChecks = 0;
  if (card.kind === 'monster' && card.atk !== null) {
    for (const enemy of threats) {
      for (const terrain of ordinary) {
        const ours = terrainModifier(card.monsterType, terrain);
        const theirs = terrainModifier(enemy.monsterType, terrain);
        if (ours === null || theirs === null) continue;
        totalStatChecks++;
        if (card.atk + ours > enemy.atk! + theirs) winningStatChecks++;
      }
    }
  }
  const atkWeight = style === 'aggressive' ? 1 : style === 'defensive' ? 0.40 : 0.75;
  const defWeight = style === 'aggressive' ? 0.12 : style === 'defensive' ? 0.70 : 0.35;
  return {
    cardId: card.id,
    rating: ((card.atk ?? 0) * atkWeight + (card.def ?? 0) * defWeight) / 100
      + (terrainAverage ?? 0) / 90
      + (totalStatChecks ? 5 * winningStatChecks / totalStatChecks : 0),
    terrainAverage, knownThreats: threats.length, winningStatChecks, totalStatChecks,
  };
}

/** M5-02: cost-feasible 40-card heuristic search using canonical costs and
 * known equip compatibility. This deliberately does not rank untranscribed
 * spells/traps/rituals, or claim a legal Deck Leader. */
export function generateSmartDeck(
  cards: readonly Card[], opponent: OpponentProfile,
  style: DeckStyle = 'balanced', fusions?: FusionData,
): SmartDeck | null {
  const byId = new Map(cards.map(card => [card.id, card]));
  const monsters = cards.filter(card => card.kind === 'monster'
    && card.atk !== null && card.def !== null && card.deckCost !== null
    && card.deckCost > 0).toSorted((a, b) => a.id - b.id);
  const equips = cards.filter(card => card.kind === 'magic'
    && card.magicClass === 'power-up' && card.deckCost !== null && card.deckCost > 0)
    .toSorted((a, b) => a.id - b.id);
  if (!monsters.length) return null;
  const monsterGoal = style === 'aggressive' ? 35 : style === 'defensive' ? 33 : 32;
  const equipGoal = 40 - monsterGoal;
  const limit = opponent.deckCost - 1;
  const cheapMonster = Math.min(...monsters.map(card => card.deckCost!));
  const cheapEquip = equips.length ? Math.min(...equips.map(card => card.deckCost!)) : cheapMonster;
  if (!Number.isSafeInteger(limit) || limit < 40 * cheapMonster) return null;
  const costWeight = Math.max(0.12, Math.min(0.85, 0.85 - (limit / 40 - 18) * 0.022));
  const evaluation = new Map(monsters.map(card =>
    [card.id, assessCardMatchup(card, opponent, byId, style)]));
  const fusionPairs = new Set<string>();
  if (fusions) for (const rule of fusions.rules) {
    const result = byId.get(rule.resultCardId);
    if (!result || result.atk === null || result.kind !== 'monster') continue;
    for (const left of rule.materials[0]) for (const right of rule.materials[1]) {
      const a = byId.get(left), b = byId.get(right);
      if (a?.atk === null || b?.atk === null || a?.kind !== 'monster' || b?.kind !== 'monster')
        continue;
      if (result.atk > Math.max(a.atk, b.atk))
        fusionPairs.add(Math.min(left, right) + ':' + Math.max(left, right));
    }
  }
  const counts = new Map<number, number>();
  const deck: Card[] = [];
  const chosenMonsters: Card[] = [];
  let cost = 0;
  const canPick = (card: Card) => card.deckCost !== null
    && (counts.get(card.id) ?? 0) < 3 && cost + card.deckCost <= limit;
  const pick = (card: Card) => {
    deck.push(card);
    cost += card.deckCost!;
    counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    if (card.kind === 'monster') chosenMonsters.push(card);
  };
  function monsterRating(card: Card): number {
    const mates = chosenMonsters.filter(other =>
      fusionPairs.has(Math.min(card.id, other.id) + ':' + Math.max(card.id, other.id))).length;
    return evaluation.get(card.id)!.rating - card.deckCost! * costWeight
      - (counts.get(card.id) ?? 0) * 5 + Math.min(2, mates * 0.4);
  }
  function cheapestMonster(reserve: number): Card | undefined {
    return monsters.filter(card => canPick(card) && cost + card.deckCost! + reserve <= limit)
      .map(card => ({ card, rating: monsterRating(card) }))
      .sort((a, b) => b.rating - a.rating || a.card.deckCost! - b.card.deckCost!
        || a.card.id - b.card.id)[0]?.card;
  }
  for (let slot = 0; slot < monsterGoal; slot++) {
    const reserve = (monsterGoal - slot - 1) * cheapMonster + equipGoal * cheapEquip;
    const chosen = cheapestMonster(reserve);
    if (!chosen) return null;
    pick(chosen);
  }
  for (let slot = 0; slot < equipGoal; slot++) {
    const remaining = equipGoal - slot - 1;
    const options = equips
      .filter(card => canPick(card) && cost + card.deckCost! + remaining * cheapEquip <= limit)
      .map(card => ({ card, hosts: chosenMonsters.filter(monster =>
        monster.powerUpCardIds.includes(card.id)).length }))
      .filter(item => item.hosts > 0)
      .sort((a, b) => b.hosts - a.hosts || a.card.deckCost! - b.card.deckCost! || a.card.id - b.card.id);
    if (options[0]) pick(options[0].card);
    else {
      // No invented effect/compatibility: fill with a known-stat monster instead.
      const replacement = cheapestMonster(remaining * cheapMonster);
      if (!replacement) return null;
      pick(replacement);
    }
  }
  if (deck.length !== 40 || cost >= opponent.deckCost
    || [...counts.values()].some(n => n > 3)) return null;
  const groups = [...counts.entries()].map(([cardId, copies]) => {
    const card = byId.get(cardId)!;
    const rating = evaluation.get(cardId);
    const reason = card.kind === 'monster'
      ? 'Stat-only ' + style + ' matchup heuristic.'
        + (rating?.terrainAverage
          ? ' Ordinary terrain average ' + (rating.terrainAverage > 0 ? '+' : '')
            + rating.terrainAverage.toFixed(0) + '.' : '')
        + (rating?.totalStatChecks
          ? ' Higher ATK in ' + rating.winningStatChecks + '/'
            + rating.totalStatChecks + ' known threat/terrain comparisons.' : '')
      : 'Canonical power-up compatibility with a selected monster; activation is conditional.';
    return { cardId, copies, reason };
  }).sort((a, b) => (byId.get(a.cardId)?.kind === 'monster' ? -1 : 1)
    - (byId.get(b.cardId)?.kind === 'monster' ? -1 : 1) || a.cardId - b.cardId);
  return {
    opponentId: opponent.id, style, cardIds: deck.map(card => card.id),
    deckCost: cost, costLimit: limit, groups,
    equipCount: deck.filter(card => card.kind === 'magic').length,
    notes: [
      'Heuristic suggestion, not a validated win rate or globally optimal build.',
      'All cards are assumed available; copies and Deck Leader rank must be confirmed in PCSX2.',
      'Special terrain, hidden information, untranscribed effects, rituals and traps were not optimized.',
      'Fusion pairs are potential combinations only, never guaranteed legal moves.',
    ],
  };
}
