import type { BrowserCard } from './browser';

/** Factual DotR reward exclusions transcribed as *numeric identifiers* from the
 * primary community reverse-engineering list (GenericMadScientist, 2017).
 * This is NOT a licensed copy of another app's calculator implementation.
 * Region: NTSC-U. Not independently verified on a PS2 game binary.
 * Source: https://pastebin.com/VH4Yw8Xw
 * Source algorithm notes: https://www.speedrun.com/yugiohdotr/forums/ch2hb
 */
export const REINCARNATION_EXCLUDED_REWARD_IDS: readonly number[] = [
  0, 1, 2, 6, 7, 9, 10, 11, 13, 14, 23, 24, 31,
  34, 42, 43, 53, 54, 57, 58, 60, 76, 77, 78, 79, 83,
  86, 87, 95, 108, 113, 115, 118, 128, 132, 135, 143, 144, 145,
  146, 147, 148, 151, 154, 155, 187, 189, 190, 195, 210, 211, 215,
  219, 220, 221, 223, 248, 266, 269, 272, 273, 284, 291, 294, 300,
  337, 338, 339, 340, 341, 342, 343, 352, 353, 365, 392, 401, 402,
  403, 417, 422, 427, 428, 429, 445, 458, 472, 478, 479, 486, 488,
  498, 500, 501, 502, 505, 510, 528, 538, 539, 552, 596, 612, 622,
  629, 632, 635, 667, 668, 670, 671, 672, 673, 674, 675, 676, 677,
  678, 680, 681, 682, 685, 687, 699, 700, 702, 715, 718, 731, 732,
  733, 748, 749, 750, 773, 778, 780, 789, 790, 791, 792, 793, 794,
  798, 806, 811, 814, 819, 825, 827, 829, 830, 832, 833, 834, 835,
  837, 840, 841, 842, 843, 844, 846, 848, 849, 851, 852,
];
export const REINCARNATION_EXCLUDED_REWARDS: ReadonlySet<number> = new Set(
  REINCARNATION_EXCLUDED_REWARD_IDS,
);

export const REINCARNATION_RESEARCH = {
  rules: 'https://www.speedrun.com/yugiohdotr/forums/ch2hb',
  exclusions: 'https://pastebin.com/VH4Yw8Xw',
  alternate: 'https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/reincarnation.js',
} as const;

// NCO / no promoted rank is 0, then 2LT ... SD are 1 ... 12.
export const REINCARNATION_RANK_OPTIONS = [
  { value: 0, label: 'NCO / no promoted leader' },
  { value: 1, label: '2LT · Second Lieutenant' },
  { value: 2, label: '1LT · First Lieutenant' },
  { value: 3, label: 'CPT · Captain' },
  { value: 4, label: 'MAJ · Major' },
  { value: 5, label: 'LTC · Lieutenant Colonel' },
  { value: 6, label: 'COL · Colonel' },
  { value: 7, label: 'BG · Brigadier' },
  { value: 8, label: 'RADM · Rear Admiral' },
  { value: 9, label: 'VADM · Vice Admiral' },
  { value: 10, label: 'ADM · Admiral' },
  { value: 11, label: 'SADM · Senior Admiral' },
  { value: 12, label: 'SD · Secretary of Defence' },
] as const;

export type ReincarnationProbability = { cardId: number; probability: number };
export interface ReincarnationEstimate {
  inputCardId: number;
  effectiveRank: number;
  highRangeChance: number;
  lowRangeChance: number;
  results: ReincarnationProbability[];
  total: number;
}

/** Report the modeled probability for *one reward position*, never the
 * probability of seeing a card among three awards: RNG dependence, replacement,
 * and duplicate award semantics have not been established.
 *
 * First-party interpretation of GenericMadScientist's published NTSC-U account:
 * - output class picked first: monster/non-monster = 80/20 or 60/40;
 * - max(A,B) determines high (+1..+10) versus low (-10..+1);
 * - each offset uniform *within its own range* (10 versus 12 outcomes);
 * - eligible same-class ID picked uniformly after stepping the target DC down;
 * - sacrificed ID excluded from ordinary candidates; empty search gives Fake Trap.
 *
 * The independent community UI differs on max versus sum, boundaries and weights.
 * These estimates are RESEARCH, not independently game-verified drop rates.
 */
export function estimateReincarnation(
  inputCardId: number,
  rankA: number,
  rankB: number,
  cards: readonly BrowserCard[],
): ReincarnationEstimate | null {
  if (![rankA, rankB].every(rank => Number.isSafeInteger(rank) && rank >= 0 && rank <= 12))
    throw new Error('Expected Deck Leader ranks 0 through 12.');
  const input = cards.find(card => card.id === inputCardId);
  if (!input || input.deckCost === null) return null;

  const byClass: Record<'monster' | 'other', Map<number, number[]>> = {
    monster: new Map(),
    other: new Map(),
  };
  for (const card of cards) {
    if (card.id === inputCardId || card.deckCost === null
      || REINCARNATION_EXCLUDED_REWARDS.has(card.id)) continue;
    const category = card.kind === 'monster' ? 'monster' : 'other';
    const entries = byClass[category].get(card.deckCost) ?? [];
    entries.push(card.id);
    byClass[category].set(card.deckCost, entries);
  }

  const effectiveRank = Math.max(rankA, rankB);
  const highRangeChance = (8 + 2 * effectiveRank) / 100;
  const lowRangeChance = 1 - highRangeChance;
  const monsterChance = input.kind === 'monster' ? 0.8 : 0.6;
  const outputCategories = [
    { category: 'monster', weight: monsterChance },
    { category: 'other', weight: 1 - monsterChance },
  ] as const;
  const ranges = [
    { from: 1, to: 10, chance: highRangeChance },
    { from: -10, to: 1, chance: lowRangeChance },
  ] as const;

  const chances = new Map<number, number>();
  for (const output of outputCategories) {
    for (const range of ranges) {
      const costCount = range.to - range.from + 1;
      const branchWeight = output.weight * range.chance / costCount;
      for (let offset = range.from; offset <= range.to; offset++) {
        let target = input.deckCost + offset;
        // The game reports a lower-DC fallback for sparse or empty pools.
        while (target >= 1 && !(byClass[output.category].get(target)?.length)) target--;
        const candidates = target < 1 ? [820] : byClass[output.category].get(target)!;
        for (const id of candidates) {
          chances.set(id, (chances.get(id) ?? 0) + branchWeight / candidates.length);
        }
      }
    }
  }
  const results = [...chances.entries()]
    .map(([cardId, probability]) => ({ cardId, probability }))
    .sort((a, b) => b.probability - a.probability || a.cardId - b.cardId);
  return {
    inputCardId,
    effectiveRank,
    highRangeChance,
    lowRangeChance,
    results,
    total: results.reduce((sum, row) => sum + row.probability, 0),
  };
}
