/** Manual companion state, not a reflection of a PS2/PCSX2 save. */
export const REINCARNATION_STORAGE_KEY = 'rose-codex.reincarnation.v1';
export const REINCARNATION_DUELS = 5;

export interface ReincarnationProgress {
  schemaVersion: 1;
  duelsCompleted: number;
}

export function emptyReincarnationProgress(): ReincarnationProgress {
  return { schemaVersion: 1, duelsCompleted: 0 };
}

export function validateReincarnationProgress(value: unknown): ReincarnationProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a reincarnation progress object.');
  const data = value as Record<string, unknown>;
  if (data.schemaVersion !== 1)
    throw new Error('Unsupported reincarnation progress version.');
  const count = data.duelsCompleted;
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0 || count > REINCARNATION_DUELS)
    throw new Error('Duel progress must be a whole number from 0 to 5.');
  return { schemaVersion: 1, duelsCompleted: count };
}

export function adjustReincarnationProgress(
  progress: ReincarnationProgress,
  change: -1 | 1,
): ReincarnationProgress {
  return {
    schemaVersion: 1,
    duelsCompleted: Math.max(0, Math.min(REINCARNATION_DUELS, progress.duelsCompleted + change)),
  };
}
