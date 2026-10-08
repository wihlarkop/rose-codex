/** Browser-only practice draws. This does not model DotR turn rules or game RNG. */
export interface PracticeHandCard {
  instanceId: string;
  cardId: number;
}

export interface PracticeSession {
  drawPile: number[];
  hand: PracticeHandCard[];
  setAside: number[];
}

export function shuffledDeck(cardIds: readonly number[], random: () => number = Math.random): number[] {
  const ids = [...cardIds];
  for (let i = ids.length - 1; i > 0; i--) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1)
      throw new RangeError('Shuffle random value must be between 0 inclusive and 1 exclusive.');
    const j = Math.floor(value * (i + 1));
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  }
  return ids;
}

export function drawToFive(
  session: PracticeSession,
  nextInstanceId: () => string,
): PracticeSession {
  const take = Math.min(5 - session.hand.length, session.drawPile.length);
  if (take <= 0) return session;
  return {
    drawPile: session.drawPile.slice(take),
    hand: [
      ...session.hand,
      ...session.drawPile.slice(0, take).map((cardId) => ({
        instanceId: nextInstanceId(),
        cardId,
      })),
    ],
    setAside: session.setAside,
  };
}

export function setAsideHandCard(session: PracticeSession, instanceId: string): PracticeSession {
  const card = session.hand.find((item) => item.instanceId === instanceId);
  if (!card) return session;
  return {
    drawPile: session.drawPile,
    hand: session.hand.filter((item) => item.instanceId !== instanceId),
    setAside: [...session.setAside, card.cardId],
  };
}

export type HandLinkSource = 'simulator' | 'recipes';

export function handLink(cardIds: readonly number[], source?: HandLinkSource): string {
  if (!cardIds.length || cardIds.length > 5 || !cardIds.every(Number.isSafeInteger))
    throw new RangeError('Hand link must contain between one and five canonical card IDs.');
  const hand = '/fusion/?hand=' + encodeURIComponent(cardIds.join(','));
  return source ? hand + '&from=' + source : hand;
}

export function parseHandLink(query: string, allowedIds: ReadonlySet<number>): number[] | null {
  const value = new URLSearchParams(query).get('hand');
  if (value === null) return null;
  const tokens = value.split(',');
  if (tokens.length < 1 || tokens.length > 5 || tokens.some((token) => !/^[0-9]{1,3}$/.test(token)))
    return [];
  const ids = tokens.map(Number);
  return ids.every((id) => allowedIds.has(id)) ? ids : [];
}
