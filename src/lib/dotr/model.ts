export const MONSTER_TYPES = [
  'Dragon', 'Spellcaster', 'Zombie', 'Warrior', 'Beast-Warrior', 'Beast',
  'Winged-Beast', 'Fiend', 'Fairy', 'Insect', 'Dinosaur', 'Reptile', 'Fish',
  'Sea Serpent', 'Machine', 'Thunder', 'Aqua', 'Pyro', 'Rock', 'Plant', 'Immortal',
] as const;
export const ATTRIBUTES = ['LIGHT', 'DARK', 'EARTH', 'WIND', 'WATER', 'FIRE'] as const;
export const FUSION_TAGS = ['Horned', 'Egg', 'Toon', 'Female', 'Elf', 'Shell', 'Caterpillar', 'Turtle'] as const;

export type CardId = number;
export type MonsterType = typeof MONSTER_TYPES[number];
export type Attribute = typeof ATTRIBUTES[number];
export type FusionTag = typeof FUSION_TAGS[number];

export interface Card {
  id: CardId;
  name: string;
  kind: 'monster' | 'magic' | 'trap' | 'ritual';
  monsterType: MonsterType | null;
  attribute: Attribute | null;
  level: number | null;
  deckCost: number | null;
  atk: number | null;
  def: number | null;
  trapRange: 'limited' | 'full' | null;
  magicClass: 'normal' | 'power-up' | null;
  password: string | null;
  effect: { status: 'not-recorded' | 'untranscribed'; text: null };
  fusionTags: FusionTag[];
  powerUpCardIds: CardId[];
}

// A finite ID-set predicate preserves the game's actual lookup table and its
// exceptions. It deliberately does not infer generic rules from modern TCG types.
export interface FusionRule {
  materials: [CardId[], CardId[]];
  resultCardId: CardId;
}

export type CombinationOutcome =
  | { kind: 'card'; cardId: CardId }
  | { kind: 'random'; mechanic: 'insect-imitation' };

export interface Transformation {
  materials: [CardId, CardId];
  outcome: CombinationOutcome;
}

export interface FusionData {
  schemaVersion: 1;
  rules: FusionRule[];
  transformations: Transformation[];
}

export interface StarterData {
  schemaVersion: 1;
  groups: { id: number; leaderCardIds: [CardId, CardId, CardId] }[];
  decks: { leaderCardId: CardId; cardIds: CardId[]; status: 'single-source' | 'manual-review' }[];
}

export interface ImageRecord {
  cardId: CardId;
  file: string;
  source: string | null;
  status: 'verified' | 'probable' | 'missing' | 'manual-review';
}

export interface CanonicalData {
  cards: Card[];
  fusions: FusionData;
  starters: StarterData;
  images: ImageRecord[];
}
