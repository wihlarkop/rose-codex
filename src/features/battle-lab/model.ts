import { OPPONENTS } from '../../lib/dotr/opponents';

export const BATTLE_LOG_KEY = 'rose-codex.battle-lab.v1';
export const MAX_BATTLE_LOGS = 200;
export type BattleOutcome = 'win' | 'loss';
export interface BattleLog {
  id: string;
  playedAt: string;
  opponentId: string;
  deckId: string;
  deckName: string;
  outcome: BattleOutcome;
  turns: number;
  note: string;
}
export interface BattleLogStore {
  schemaVersion: 1;
  matches: BattleLog[];
}

export function validateBattleLogs(value: unknown): BattleLogStore {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a Battle Lab data object.');
  const data = value as Record<string, unknown>;
  if (
    data.schemaVersion !== 1 ||
    !Array.isArray(data.matches) ||
    data.matches.length > MAX_BATTLE_LOGS
  )
    throw new Error('Unsupported Battle Lab format or maximum records exceeded.');
  const ids = new Set<string>();
  const opponents = new Set(OPPONENTS.map((item) => item.id));
  const matches: BattleLog[] = data.matches.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      throw new Error('Invalid battle record at index ' + index);
    const row = item as Record<string, unknown>;
    if (typeof row.id !== 'string' || !row.id || row.id.length > 100 || ids.has(row.id))
      throw new Error('Duplicate or invalid battle record ID.');
    ids.add(row.id);
    if (
      typeof row.playedAt !== 'string' ||
      !Number.isFinite(Date.parse(row.playedAt)) ||
      row.playedAt.length > 40
    )
      throw new Error('Invalid battle record date.');
    if (typeof row.opponentId !== 'string' || !opponents.has(row.opponentId))
      throw new Error('Unknown opponent in Battle Lab.');
    if (
      typeof row.deckId !== 'string' ||
      !row.deckId ||
      row.deckId.length > 100 ||
      typeof row.deckName !== 'string' ||
      !row.deckName.trim() ||
      row.deckName.length > 100
    )
      throw new Error('Invalid recorded deck identity.');
    if (row.outcome !== 'win' && row.outcome !== 'loss') throw new Error('Invalid battle outcome.');
    if (!Number.isInteger(row.turns) || (row.turns as number) < 1 || (row.turns as number) > 999)
      throw new Error('Turn count must be between 1 and 999.');
    if (typeof row.note !== 'string' || row.note.length > 400)
      throw new Error('Battle note exceeds 400 characters.');
    return {
      id: row.id,
      playedAt: row.playedAt,
      opponentId: row.opponentId,
      deckId: row.deckId,
      deckName: row.deckName,
      outcome: row.outcome,
      turns: row.turns,
      note: row.note,
    } as BattleLog;
  });
  return { schemaVersion: 1, matches };
}
export interface BattleSummary {
  battles: number;
  wins: number;
  losses: number;
  averageTurns: number | null;
  observedWinRate: number | null;
}
export function summarizeBattles(matches: readonly BattleLog[]): BattleSummary {
  const wins = matches.filter((match) => match.outcome === 'win').length;
  return {
    battles: matches.length,
    wins,
    losses: matches.length - wins,
    observedWinRate: matches.length ? wins / matches.length : null,
    averageTurns: matches.length
      ? matches.reduce((total, match) => total + match.turns, 0) / matches.length
      : null,
  };
}
