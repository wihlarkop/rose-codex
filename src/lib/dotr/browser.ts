import type { Card } from './model';

export type BrowserCard = Pick<Card, 'id' | 'name' | 'kind' | 'monsterType' | 'attribute' | 'level' | 'atk' | 'def' | 'deckCost' | 'trapRange' | 'magicClass' | 'password'> & {
  effectText: string | null;
};
export interface CardFilters {
  query: string;
  kind: string;
  monsterType: string;
  attribute: string;
}

export function browserCards(cards: Card[]): BrowserCard[] {
  return cards.map(({ id, name, kind, monsterType, attribute, level, atk, def, deckCost, trapRange, magicClass, password, effect }) => {
    return {
      id, name, kind, monsterType, attribute, level, atk, def, deckCost, trapRange, magicClass, password, effectText: effect.text,
    };
  });
}

function nameTokens(value: string): string[] {
  return value.toLowerCase().replace(/['’]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
}

export function filterCards(cards: BrowserCard[], filters: CardFilters): BrowserCard[] {
  const query = filters.query.trim();
  const numericId = /^\d+$/.test(query) ? Number(query) : null;
  const tokens = nameTokens(query);
  return cards.filter(card =>
    (!filters.kind || card.kind === filters.kind) &&
    (!filters.monsterType || card.monsterType === filters.monsterType) &&
    (!filters.attribute || card.attribute === filters.attribute) &&
    (numericId !== null ? card.id === numericId : tokens.length ? tokens.every(token => nameTokens(card.name).join(' ').includes(token)) : !query || card.name.toLowerCase().includes(query.toLowerCase())),
  );
}
