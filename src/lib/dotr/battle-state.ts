import type { BrowserCard } from './browser';
import type { FusionOccurrence } from './fusion-discovery';
import type { TacticalReport, TacticalOption } from './tactical-duel';

/** M5-05: manual observations, never inferred from PCSX2. */
export const BOARD_SIZE = 7;
export const START_SP = 4;
export const SP_PER_TURN = 3;
export const MAX_SP = 12;
export type PlayedCard = 'unknown' | 'yes' | 'no';
export interface GridSquare { row: number; col: number }
export interface BattleSnapshot {
  summoningPoints: number | null;
  alreadyPlayedCard: PlayedCard;
  leaderSquare: GridSquare | null;
  enemySquare: GridSquare | null;
  fieldSquares: Readonly<Record<string, GridSquare | null>>;
}
export interface Decision {
  id: string;
  type: 'summon' | 'attack-check' | 'fusion-check' | 'reposition' | 'hold';
  cardId: number | null;
  status: 'blocked' | 'conditional' | 'information-needed';
  priority: number;
  title: string;
  detail: string;
}

export function isGridSquare(square: GridSquare | null): square is GridSquare {
  return square !== null
    && Number.isInteger(square.row) && square.row >= 0 && square.row < BOARD_SIZE
    && Number.isInteger(square.col) && square.col >= 0 && square.col < BOARD_SIZE;
}

/** At a start of turn, SP increases by three, capped at twelve.
 * Caller must not use this as a live clock or turn detector. */
export function nextTurnSP(current: number): number {
  if (!Number.isInteger(current) || current < 0 || current > MAX_SP)
    throw new RangeError('SP must be an integer from 0 to 12.');
  return Math.min(MAX_SP, current + SP_PER_TURN);
}

export function summonAssessment(
  card: Pick<BrowserCard, 'kind' | 'level'>,
  snapshot: BattleSnapshot,
): { status: Decision['status']; explanation: string } {
  const { summoningPoints: sp, alreadyPlayedCard: used, leaderSquare: leader } = snapshot;
  if (sp !== null && (!Number.isInteger(sp) || sp < 0 || sp > MAX_SP))
    throw new RangeError('SP must be an integer from 0 to 12.');
  if (leader !== null && !isGridSquare(leader))
    throw new RangeError('Leader square must be inside the seven-by-seven board.');
  if (used === 'yes') return {
    status: 'blocked',
    explanation: 'Already played a card this turn (one card play per turn).',
  };
  if (card.kind === 'monster') {
    if (card.level === null) return {
      status: 'information-needed', explanation: 'This monster’s summon Level is unknown.',
    };
    if (sp !== null && sp < card.level) return {
      status: 'blocked', explanation: 'Requires ' + card.level + ' SP, currently ' + sp + '.',
    };
  }
  if (sp === null && card.kind === 'monster') return {
    status: 'information-needed',
    explanation: 'Current SP is unknown. The monster requires ' + card.level + ' SP.',
  };
  return {
    status: 'conditional',
    explanation: (card.kind === 'monster'
      ? 'Known SP covers Level ' + card.level + '. ' : 'No SP cost for Spell/Trap. ')
      + (used === 'unknown' ? 'Card-play availability is not confirmed. ' : '')
      + (leader ? 'Choose an unoccupied summoning square adjacent to your Deck Leader. '
        : 'Deck Leader position and free summoning square are unknown. ')
      + 'Other restrictions and actual board occupancy remain unverified.',
  };
}

export function squareRelation(a: GridSquare | null, b: GridSquare | null):
  'unknown' | 'same' | 'neighbor' | 'separated' {
  if (a === null || b === null) return 'unknown';
  if (!isGridSquare(a) || !isGridSquare(b)) throw new RangeError('Invalid board coordinate.');
  const dr = Math.abs(a.row - b.row), dc = Math.abs(a.col - b.col);
  if (dr === 0 && dc === 0) return 'same';
  return Math.max(dr, dc) === 1 ? 'neighbor' : 'separated';
}

/** M5-06: conservative, explainable options. "conditional" only means
 * basic preconditions were not disproven: it NEVER means legal or optimal.
 * Movement, adjacency obstacles, once-per-turn moves and effects are unknown.
 */
export function rankTacticalDecisions(
  hand: readonly FusionOccurrence[],
  report: TacticalReport,
  cards: ReadonlyMap<number, BrowserCard>,
  snapshot: BattleSnapshot,
): Decision[] {
  const candidates: Decision[] = [];
  if (snapshot.alreadyPlayedCard !== 'unknown'
    && snapshot.alreadyPlayedCard !== 'yes' && snapshot.alreadyPlayedCard !== 'no')
    throw new RangeError('Unknown card-play status.');
  for (const item of hand) {
    if (item.zone !== 'hand') throw new RangeError('Hand observations must have hand zone.');
    const card = cards.get(item.cardId);
    if (!card) throw new RangeError('Unknown card in Hand.');
    const assessment = summonAssessment(card, snapshot);
    candidates.push({
      id: 'summon:' + item.instanceId, type: 'summon',
      cardId: item.cardId,
      status: assessment.status,
      priority: assessment.status === 'blocked' ? -1
        : assessment.status === 'information-needed' ? 2
          : (card.atk ?? 0) / 500 + 4,
      title: 'Consider playing ' + card.name,
      detail: assessment.explanation,
    });
  }
  for (const option of report.options) {
    const card = cards.get(option.cardId);
    if (!card) continue;
    if (option.kind === 'field-comparison') {
      candidates.push({
        id: 'field:' + option.sourceLabel + ':' + option.cardId,
        type: option.outcome === 'stat-trail' ? 'reposition' : 'attack-check',
        cardId: option.cardId,
        status: 'conditional',
        priority: option.outcome === 'stat-edge' ? 8 + Math.min(5, (option.statDifference ?? 0) / 500)
          : option.outcome === 'stat-trail' ? 2 : 3,
        title: option.outcome === 'stat-trail'
          ? 'Consider protecting ' + card.name : 'Check contact with ' + card.name,
        detail: (option.outcome === 'stat-edge'
          ? 'Positive adjusted ATK difference of ' + option.statDifference + '. '
          : option.outcome === 'stat-trail'
            ? 'Lower adjusted ATK against the selected enemy stat. '
            : 'No verified favorable attack comparison. ')
          + 'Distance, intervening squares, card orientation, moves used and effects must be confirmed in-game.',
      });
    } else if (option.kind === 'fusion-possibility') {
      candidates.push({
        id: 'fusion:' + option.cardId + ':' + option.materialIds.join('-'),
        type: 'fusion-check', cardId: option.cardId,
        status: 'information-needed',
        priority: option.outcome === 'stat-edge' ? 5 : 2,
        title: 'Review ordinary fusion to ' + card.name,
        detail: 'Materials are in the manual state, but sequence, timing, remaining card play, SP and positioning have not been verified.',
      });
    }
  }
  const available = candidates.some(item =>
    item.status === 'conditional' && item.type === 'summon');
  if (!available && hand.length && snapshot.alreadyPlayedCard === 'no'
    && snapshot.summoningPoints !== null) {
    candidates.push({
      id: 'hold', type: 'hold', cardId: null, status: 'conditional', priority: 1,
      title: 'Consider preserving Summoning Points',
      detail: 'No known-SP summon passed the basic check. Waiting can replenish up to +3 SP at the next turn start (maximum 12); other plays remain unmodeled.',
    });
  }
  // Cannot turn hypothetical top-8 ranking into an exhaustive list.
  // Stable sorting, blocking only demonstrated one-card/SP impossibilities.
  return candidates.toSorted((a, b) =>
    (a.status === 'blocked' ? 1 : 0) - (b.status === 'blocked' ? 1 : 0)
    || b.priority - a.priority || a.id.localeCompare(b.id));
}

export function sourceFieldDistance(
  option: TacticalOption,
  field: readonly FusionOccurrence[],
  snapshot: BattleSnapshot,
): ReturnType<typeof squareRelation> {
  if (option.kind !== 'field-comparison') return 'unknown';
  const match = /^Summoning Area (\d+)$/.exec(option.sourceLabel);
  const index = match ? Number(match[1]) - 1 : -1;
  const instance = field[index];
  if (!instance) return 'unknown';
  return squareRelation(snapshot.fieldSquares[instance.instanceId] ?? null, snapshot.enemySquare);
}
