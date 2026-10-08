import type { Card, ImageRecord } from './model';

export type BrowserCard = Pick<Card, 'id' | 'name' | 'kind' | 'monsterType' | 'attribute' | 'level' | 'atk' | 'def' | 'deckCost' | 'trapRange' | 'magicClass' | 'password'> & {
  effectText: string | null;
  image: { url: string; width: number; height: number } | null;
};
export interface CardFilters {
  query: string;
  kind: string;
  monsterType: string;
  attribute: string;
}

export function browserCards(cards: Card[], images: ImageRecord[]): BrowserCard[] {
  const byId = new Map(images.map(image => [image.cardId, image]));
  return cards.map(({ id, name, kind, monsterType, attribute, level, atk, def, deckCost, trapRange, magicClass, password, effect }) => {
    const image = byId.get(id);
    return {
      id, name, kind, monsterType, attribute, level, atk, def, deckCost, trapRange, magicClass, password, effectText: effect.text,
      image: image && ['verified', 'probable'].includes(image.status)
        ? { url: `/cards/${image.file}`, width: image.width!, height: image.height! } : null,
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
