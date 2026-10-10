import type { Card, FusionData } from './model';
import type { OpponentProfile } from './opponents';
import { assessCardMatchup, type SmartDeck } from './smart-deck';

/** M5-07 local search over a valid baseline; a higher proxy score does NOT
 * imply improved win rate. No server, model, or historical outcomes. */
export interface DeckOptimization {
  deck: SmartDeck;
  baselineScore: number;
  optimizedScore: number;
  replacements: number;
  objective: string;
}

export function optimizeSuggestedDeck(
  baseline: SmartDeck,
  cards: readonly Card[],
  opponent: OpponentProfile,
  fusionData: FusionData,
): DeckOptimization {
  if (baseline.opponentId !== opponent.id || baseline.cardIds.length !== 40)
    throw new RangeError('Optimization requires a matching valid 40-card suggestion.');
  const byId = new Map(cards.map(c => [c.id, c]));
  const initial = [...baseline.cardIds];
  const budget = opponent.deckCost - 1;
  const isKnown = (id: number) => {
    const c = byId.get(id);
    return !!c && c.deckCost !== null && Number.isFinite(c.deckCost);
  };
  const isMonster = (id: number) => byId.get(id)?.kind === 'monster';
  const count = (ids: readonly number[]) => {
    const result = new Map<number, number>();
    for (const id of ids) result.set(id, (result.get(id) ?? 0) + 1);
    return result;
  };
  const cost = (ids: readonly number[]) =>
    ids.reduce((total, id) => total + byId.get(id)!.deckCost!, 0);
  function valid(ids: readonly number[]): boolean {
    if (ids.length !== 40 || !ids.every(isKnown)) return false;
    if ([...count(ids).values()].some(n => n > 3)) return false;
    if (cost(ids) > budget) return false;
    const monsterIds = new Set(ids.filter(isMonster));
    return ids.filter(id => byId.get(id)?.magicClass === 'power-up')
      .every(id => [...monsterIds].some(hostId =>
        byId.get(hostId)?.powerUpCardIds.includes(id)));
  }
  if (!valid(initial)) throw new RangeError('Baseline violates a required deck invariant.');
  const monsters = cards.filter(c => c.kind === 'monster' && c.atk !== null
    && c.def !== null && c.deckCost !== null && c.deckCost > 0);
  const profile = new Map(monsters.map(card => [
    card.id, assessCardMatchup(card, opponent, byId, baseline.style).rating,
  ]));
  const costWeight = Math.max(0.12, Math.min(0.85,
    0.85 - (budget / 40 - 18) * 0.022));
  const scoring = (id: number): number => {
    const c = byId.get(id)!;
    if (c.kind === 'monster') {
      const level = c.level;
      const spPenalty = level !== null && level > 8 ? (level - 8) * 1.25 : 0;
      return (profile.get(id) ?? 0) - c.deckCost! * costWeight - spPenalty;
    }
    return -c.deckCost! * 0.3;
  };
  const pairs = new Map<string, number>();
  for (const rule of fusionData.rules) {
    const result = byId.get(rule.resultCardId);
    if (result?.atk === null || result?.kind !== 'monster') continue;
    for (const a of rule.materials[0]) for (const b of rule.materials[1]) {
      const ca = byId.get(a), cb = byId.get(b);
      if (ca?.atk === null || cb?.atk === null) continue;
      if (result.atk > Math.max(ca?.atk ?? Infinity, cb?.atk ?? Infinity))
        pairs.set(Math.min(a, b) + ':' + Math.max(a, b), result.atk);
    }
  }
  function score(ids: readonly number[]): number {
    const grouped = count(ids);
    let total = 0;
    for (const [id, n] of grouped) {
      total += scoring(id) * n;
      // Diversify identical cards to avoid fragile 3-of concentration.
      total -= (n * (n - 1) / 2) * 4.5;
    }
    const chosen = [...grouped.keys()].filter(isMonster);
    let fusionBonus = 0;
    for (let i = 0; i < chosen.length; i++) for (let j = i + 1; j < chosen.length; j++) {
      if (pairs.has(Math.min(chosen[i]!, chosen[j]!) + ':' + Math.max(chosen[i]!, chosen[j]!)))
        fusionBonus += 0.3;
    }
    return total + Math.min(8, fusionBonus);
  }
  // Keep the candidate pool bounded and stable so a browser remains responsive.
  const candidates = [
    ...monsters.toSorted((a, b) =>
      scoring(b.id) - scoring(a.id) || a.id - b.id).slice(0, 75),
    ...monsters.toSorted((a, b) =>
      a.deckCost! - b.deckCost! || a.id - b.id).slice(0, 30),
    ...monsters.toSorted((a, b) =>
      b.atk! - a.atk! || a.id - b.id).slice(0, 20),
  ];
  const candidateIds = [...new Set(candidates.map(c => c.id))].sort((a, b) => a - b);
  let current = [...initial];
  let currentScore = score(current);
  const initialScore = currentScore;
  let replacements = 0;
  // Strictly increasing swaps guarantee termination and never worsen proxy fitness.
  for (let pass = 0; pass < 2; pass++) {
    let improved = false;
    for (let slot = 0; slot < current.length; slot++) {
      if (!isMonster(current[slot]!)) continue;
      let bestId = current[slot]!;
      let bestScore = currentScore;
      for (const candidateId of candidateIds) {
        if (candidateId === current[slot]) continue;
        const draft = [...current];
        draft[slot] = candidateId;
        if (!valid(draft)) continue;
        const rating = score(draft);
        if (rating > bestScore + 1e-8
          || (Math.abs(rating - bestScore) <= 1e-8 && bestId !== current[slot]
            && candidateId < bestId)) {
          bestId = candidateId; bestScore = rating;
        }
      }
      if (bestId !== current[slot]) {
        current[slot] = bestId;
        currentScore = bestScore;
        replacements++;
        improved = true;
      }
    }
    if (!improved) break;
  }
  const groups = [...count(current).entries()].map(([cardId, copies]) => {
    const original = baseline.groups.find(entry => entry.cardId === cardId);
    return {
      cardId, copies,
      reason: original?.reason ?? (
        'Local-search candidate, selected using canonical printed stats, known ordinary terrain and cost; effects unverified.'
      ),
    };
  }).sort((a, b) =>
    (byId.get(a.cardId)?.kind === 'monster' ? -1 : 1)
    - (byId.get(b.cardId)?.kind === 'monster' ? -1 : 1)
    || a.cardId - b.cardId);
  const deck: SmartDeck = {
    ...baseline,
    cardIds: current, deckCost: cost(current), groups,
    equipCount: current.filter(id => byId.get(id)?.kind === 'magic').length,
    notes: [
      ...baseline.notes,
      'M5-07 used bounded swap-based local search on printed-stat heuristic only. Improved proxy score does not prove improved game win rate.',
    ],
  };
  return {
    deck, baselineScore: initialScore, optimizedScore: currentScore, replacements,
    objective: 'Stat/terrain matchup minus Deck Cost and high-Level pressure, with bounded fusion synergy and copy-diversity bonuses. No empirical win rate.',
  };
}
