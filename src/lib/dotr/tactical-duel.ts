import type { BrowserCard } from './browser';
import {
  suggestDuelPlays, type BattleContext, type BattleStatus, type DuelPlay,
} from './duel-advisor';
import type { FusionDiscovery, FusionOccurrence } from './fusion-discovery';

export type TacticalKind = 'field-comparison' | 'fusion-possibility' | 'hand-preparation';

export interface TacticalOption {
  kind: TacticalKind;
  cardId: number;
  sourceLabel: string;
  materialIds: number[];
  attack: number | null;
  enemyStat: number | null;
  statDifference: number | null;
  outcome: BattleStatus;
  note: string;
  /** This is always conditional; the planner never establishes game legality. */
  conditional: true;
}

export interface TacticalReport {
  options: TacticalOption[];
  discoveryComplete: boolean;
  contextKnown: boolean;
  notes: string[];
}

/** M5-04 orchestration only: compose the existing canonical fusion discovery
 * and Duel Strategy stat comparator instead of implementing rival game rules.
 * Never infer hand-to-attack legality, adjacency, effects or Summoning Points.
 */
export function evaluateTacticalDuel(
  occurrences: readonly FusionOccurrence[],
  discovery: FusionDiscovery,
  byId: ReadonlyMap<number, BrowserCard>,
  context: BattleContext,
  limit = 8,
): TacticalReport {
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 30)
    throw new RangeError('Invalid tactical option limit.');
  const known = occurrences.filter(entry => byId.has(entry.cardId));
  if (known.length !== occurrences.length)
    throw new RangeError('Unknown card in manual duel state.');
  const contextKnown = context.opponentCardId !== null
    && byId.get(context.opponentCardId)?.kind === 'monster'
    && context.opponentPosition !== 'unknown'
    && !['Toon', 'Crush', 'Labyrinth'].includes(context.terrain);
  // Reuse the existing ranked stat comparator; extract more candidates before
  // classifying the real differences between Hand, Field, and fusion plans.
  const suggestions = suggestDuelPlays(
    occurrences, discovery, byId, context, 30,
  );
  const occurrenceById = new Map(occurrences.map(item => [item.instanceId, item]));
  function materialCards(play: DuelPlay): number[] {
    return play.recipe?.instanceIds
      .map(id => occurrenceById.get(id)?.cardId)
      .filter((id): id is number => id !== undefined) ?? [];
  }
  const options: TacticalOption[] = suggestions.map(play => {
    const kind: TacticalKind = play.source === 'hand'
      ? 'hand-preparation'
      : play.source === 'field' ? 'field-comparison' : 'fusion-possibility';
    const note = play.outcome === 'stat-edge' && kind === 'field-comparison'
      ? 'This field monster has a positive ATK comparison. Consider contact only if reachable and no effects intervene.'
      : play.outcome === 'stat-edge' && kind === 'fusion-possibility'
        ? 'Potential ordinary fusion has a positive stat comparison. Recipe order, field movement and summon legality still need game verification.'
        : kind === 'hand-preparation'
          ? 'Card is in Hand. It is a preparation/summon candidate, NOT a monster that can attack immediately.'
          : kind === 'fusion-possibility'
            ? 'Potential ordinary fusion, conditional on the actual field, materials, and summon rules.'
            : play.outcome === 'stat-trail'
              ? 'Lower adjusted ATK than the visible enemy stat; avoid assuming this contact wins.'
              : play.outcome === 'unknown'
                ? 'Combat comparison is unknown. Do not infer a favorable attack.'
                : 'This is a comparison of printed stats and ordinary terrain only.';
    return {
      kind, cardId: play.cardId, sourceLabel: play.sourceLabel,
      materialIds: materialCards(play),
      attack: play.attack, enemyStat: play.targetStat,
      statDifference: play.advantage, outcome: play.outcome,
      note, conditional: true,
    };
  });
  // Prioritize potentially usable Field comparisons over speculative
  // Hand plans, while never misrepresenting a hypothetical stat edge
  // as a confirmed legal attack. Stable ordering for repeated inputs.
  const kindRank: Record<TacticalKind, number> = {
    'field-comparison': 3, 'fusion-possibility': 2, 'hand-preparation': 1,
  };
  const outcomeRank: Record<BattleStatus, number> = {
    'stat-edge': 3, 'stat-tie': 2, unknown: 1, 'stat-trail': 0,
  };
  options.sort((a, b) =>
    kindRank[b.kind] - kindRank[a.kind]
    || outcomeRank[b.outcome] - outcomeRank[a.outcome]
    || (b.statDifference ?? -Infinity) - (a.statDifference ?? -Infinity)
    || (b.attack ?? -1) - (a.attack ?? -1)
    || a.cardId - b.cardId
    || a.sourceLabel.localeCompare(b.sourceLabel));
  return {
    options: options.slice(0, limit), discoveryComplete: discovery.complete,
    contextKnown: !!contextKnown,
    notes: [
      contextKnown
        ? 'Stat comparisons use the observed enemy position and your chosen contact-square terrain.'
        : 'Enemy identity/position or special terrain prevents a reliable stat comparison.',
      'A field monster can only engage if a legal path/contact and turn state permit it.',
      'A Hand monster is a summon/preparation candidate, never an immediate attack recommendation.',
      'Fusion recipes use canonical ordinary combinations; Summoning Points, movement, hidden traps, boosts and effects are not modeled.',
      ...(!discovery.complete
        ? ['Fusion discovery hit a search limitation; available options are not exhaustive.']
        : []),
    ],
  };
}
