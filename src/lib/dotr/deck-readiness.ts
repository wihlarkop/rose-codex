import type { BrowserCard } from './browser';
import type { OpponentProfile } from './opponents';

/** Deliberate manual statement about the player's *current game save*.
 * No canonical card metadata establishes an individual leader's earned rank. */
export type LeaderRankEvidence = 'unknown' | 'confirmed-eligible' | 'confirmed-ineligible';
export type CheckStatus = 'pass' | 'fail' | 'unknown';

export interface DeckReadinessCheck {
  id: 'card-count' | 'copies' | 'leader' | 'campaign-cost';
  status: CheckStatus;
  detail: string;
}
export interface CopyExcess {
  cardId: number;
  name: string;
  count: number;
  excess: number;
}
export interface CostPressure {
  cardId: number;
  name: string;
  copies: number;
  eachCost: number;
  combinedCost: number;
}
export interface DeckReadinessReport {
  checks: DeckReadinessCheck[];
  summary: 'needs-changes' | 'needs-confirmation' | 'conditionally-ready';
  cardCount: number;
  knownCost: number;
  unknownCosts: number;
  overCopyLimits: CopyExcess[];
  costPressure: CostPressure[];
  /** Minimal cost reduction needed assuming the currently known total.
   * If any costs are unknown this is a *lower bound*, not a final target. */
  minimumReduction: number | null;
  remainingBudget: number | null;
}

/** Pure advisory: never changes deck order, inventory, saved leader, or game state.
 * The official US PS2 manual requires exactly 40 main cards, <=3 copies each,
 * one rank-eligible Monster leader and a strictly lower campaign deck cost. */
export function analyzeDeckReadiness(
  cardIds: readonly number[],
  cards: ReadonlyMap<number, BrowserCard>,
  leaderCardId: number | null,
  rankEvidence: LeaderRankEvidence,
  opponent: Pick<OpponentProfile, 'deckCost'> | null,
): DeckReadinessReport {
  let knownCost = 0;
  let unknownCosts = 0;
  const counts = new Map<number, number>();
  for (const id of cardIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
    const cost = cards.get(id)?.deckCost;
    if (cost === undefined || cost === null) unknownCosts++;
    else knownCost += cost;
  }
  const overCopyLimits = [...counts.entries()]
    .filter(([, count]) => count > 3)
    .map(([cardId, count]) => ({
      cardId,
      name: cards.get(cardId)?.name ?? '#' + String(cardId).padStart(3, '0'),
      count,
      excess: count - 3,
    }))
    .sort((a, b) => b.excess - a.excess || a.name.localeCompare(b.name));

  const costPressure = [...counts.entries()].flatMap(([id, copies]) => {
    const card = cards.get(id);
    if (!card || card.deckCost === null) return [];
    return [{
      cardId: id,
      name: card.name,
      copies,
      eachCost: card.deckCost,
      combinedCost: card.deckCost * copies,
    }];
  }).sort((a, b) => b.eachCost - a.eachCost || a.cardId - b.cardId).slice(0, 5);

  const leader = leaderCardId === null ? null : cards.get(leaderCardId);
  const hasOrdinaryMonsterLeader = !!leader && leader.kind === 'monster' && leader.level !== null;
  const leaderStatus: CheckStatus = leaderCardId !== null && !hasOrdinaryMonsterLeader
    ? 'fail'
    : !hasOrdinaryMonsterLeader || rankEvidence === 'unknown'
      ? 'unknown'
      : rankEvidence === 'confirmed-ineligible' ? 'fail' : 'pass';

  const costStatus: CheckStatus = !opponent
    ? 'unknown'
    : knownCost >= opponent.deckCost
      ? 'fail'
      : unknownCosts > 0 ? 'unknown' : 'pass';
  const minimumReduction = opponent === null
    ? null
    : Math.max(0, knownCost - opponent.deckCost + 1);
  const remainingBudget = opponent && unknownCosts === 0 && costStatus === 'pass'
    ? opponent.deckCost - knownCost - 1
    : null;

  const checks: DeckReadinessCheck[] = [
    {
      id: 'card-count',
      status: cardIds.length === 40 ? 'pass' : 'fail',
      detail: cardIds.length === 40
        ? 'Exactly 40 main-deck cards.'
        : cardIds.length < 40
          ? 'Add ' + (40 - cardIds.length) + ' more main-deck cards.'
          : 'Remove ' + (cardIds.length - 40) + ' main-deck cards.',
    },
    {
      id: 'copies',
      status: overCopyLimits.length ? 'fail' : 'pass',
      detail: overCopyLimits.length
        ? overCopyLimits.length + ' card type(s) exceed three copies.'
        : 'No more than three copies of any main-deck card.',
    },
    {
      id: 'leader',
      status: leaderStatus,
      detail: leaderCardId === null
        ? 'Choose a separate Monster Deck Leader.'
        : !hasOrdinaryMonsterLeader
          ? 'Selected card is not an ordinary Monster Deck Leader candidate.'
          : rankEvidence === 'unknown'
            ? 'Confirm this Monster is at least 2LT in your actual game save.'
            : rankEvidence === 'confirmed-ineligible'
              ? 'You marked this Monster as below 2LT; choose an eligible leader.'
              : 'You confirmed this Monster has at least 2LT rank in your save.',
    },
    {
      id: 'campaign-cost',
      status: costStatus,
      detail: !opponent
        ? 'Choose a campaign opponent for a Deck Cost comparison.'
        : knownCost >= opponent.deckCost
          ? 'Known cost alone is not below this opponent’s Deck Cost.'
          : unknownCosts > 0
            ? 'Some card costs are unknown; the campaign comparison is inconclusive.'
            : 'Main-deck cost is strictly lower than the selected opponent’s cost.',
    },
  ];

  return {
    checks,
    summary: checks.some((check) => check.status === 'fail')
      ? 'needs-changes'
      : checks.some((check) => check.status === 'unknown')
        ? 'needs-confirmation'
        : 'conditionally-ready',
    cardCount: cardIds.length,
    knownCost,
    unknownCosts,
    overCopyLimits,
    costPressure,
    minimumReduction,
    remainingBudget,
  };
}
