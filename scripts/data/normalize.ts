import { ATTRIBUTES, FUSION_TAGS, MONSTER_TYPES, type Card, type FusionData, type FusionRule, type StarterData, type Transformation } from '../../src/lib/dotr/model';
import groups from '../../data/manifests/starter-groups.json';

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Expected a data record');
  return value as Record<string, unknown>;
}
function number(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) throw new Error(`Expected integer ${label}`);
  return value;
}
function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Expected text ${label}`);
  return value;
}

export function normalizeCards(value: unknown): Card[] {
  if (!Array.isArray(value)) throw new Error('Expected source card array');
  return value.map<Card>(item => {
    const raw = record(item);
    const known = ['id','name','type','attribute','lv','dc','atk','def','powerUp','pw','effect','archetype','fusionInfo','abillity_summon'];
    for (const key of Object.keys(raw)) if (!known.includes(key)) throw new Error(`Unknown source card field: ${key}`);
    const id = number(raw['id'], 'id');
    const type = string(raw['type'], 'type');
    const kind = type === 'Magic' ? 'magic' : type === 'Trap' ? 'trap' : type === 'Ritual' ? 'ritual' : 'monster';
    if (kind === 'monster' && !(MONSTER_TYPES as readonly string[]).includes(type)) throw new Error(`Unknown monster type: ${type}`);
    const attribute = raw['attribute'] ?? null;
    if (kind === 'monster' && attribute !== null && !(ATTRIBUTES as readonly unknown[]).includes(attribute)) throw new Error(`Unknown attribute for ${id}`);
    if (kind === 'trap' && !['Limited Range','Full Range'].includes(String(attribute))) throw new Error(`Unknown trap range for ${id}`);
    if (kind === 'magic' && attribute !== null && attribute !== 'Power Up' || kind === 'ritual' && attribute !== null) throw new Error(`Unexpected nonmonster attribute for ${id}`);
    const tags = raw['archetype'] === undefined ? [] : string(raw['archetype'],'archetype').split(', ').map(tag => tag === 'Catterpillar' ? 'Caterpillar' : tag).sort();
    for (const tag of tags) if (!(FUSION_TAGS as readonly string[]).includes(tag)) throw new Error(`Unknown fusion tag ${tag}`);
    const powerUps = raw['powerUp'] === undefined ? [] : string(raw['powerUp'], 'powerUp').split(', ').map(text => {
      if (!/^\d+$/.test(text)) throw new Error(`Malformed power-up ID ${text}`);
      return Number(text);
    }).sort((a,b) => a-b);
    const duplicateIds = powerUps.filter((value,index)=>index>0 && powerUps[index-1]===value);
    const documentedDuplicate = id>=208 && id<=223 ? 780 : id===356 ? 770 : null;
    if (duplicateIds.some(value=>value!==documentedDuplicate)) throw new Error(`Undocumented duplicate power-up relation for ${id}`);
    const password = raw['pw'] === undefined ? null : typeof raw['pw'] === 'number' ? String(number(raw['pw'],'password')).padStart(8,'0') : string(raw['pw'],'password');
    return {
      id, name: string(raw['name'],'name').trim(), kind,
      monsterType: kind === 'monster' ? type as Card['monsterType'] : null,
      attribute: kind === 'monster' ? attribute as Card['attribute'] : null,
      level: kind === 'monster' && id !== 671 ? number(raw['lv'],'level') : null,
      deckCost: id === 671 ? null : number(raw['dc'],'deckCost'),
      atk: kind === 'monster' && id !== 671 ? number(raw['atk'],'atk') : null,
      def: kind === 'monster' && id !== 671 ? number(raw['def'],'def') : null,
      trapRange: kind === 'trap' ? attribute === 'Full Range' ? 'full' : 'limited' : null,
      magicClass: kind === 'magic' ? attribute === 'Power Up' ? 'power-up' : 'normal' : null,
      password, effect: { status: raw['effect'] === undefined ? 'not-recorded' : 'untranscribed', text: null },
      fusionTags: tags as Card['fusionTags'], powerUpCardIds: [...new Set(powerUps)],
    };
  }).sort((a,b) => a.id-b.id);
}

const transformPairs = new Set(['272,797','401,798','407,798','416,798','423,798','426,798','7,799','342,799','16,800','17,800','167,800','332,800','379,800']);

export function normalizeFusions(value: unknown): FusionData {
  const raw = record(value);
  const rows = new Map<string, { left: number; right: number[]; result: number }>();
  const transformations: Transformation[] = [];
  for (const [pair, result] of Object.entries(raw)) {
    if (!/^\d+,\d+$/.test(pair)) throw new Error(`Malformed fusion pair ${pair}`);
    const [left, right] = pair.split(',').map(Number) as [number,number];
    if (left > right) throw new Error(`Noncanonical pair ${pair}`);
    if (transformPairs.has(pair)) {
      if (result !== '?' && typeof result !== 'number') throw new Error(`Unknown transformation ${pair}`);
      transformations.push({ materials: [left,right], outcome: result === '?' ? { kind:'random',mechanic:'insect-imitation' } : {kind:'card',cardId:number(result,'transform result')} });
    } else {
      const resultId = number(result,'fusion result');
      const key = `${left}:${resultId}`;
      const row = rows.get(key) ?? {left,right:[],result:resultId};
      row.right.push(right);
      rows.set(key,row);
    }
  }
  if (transformations.length !== transformPairs.size) throw new Error('Incomplete researched transformation coverage');
  // Lossless rectangle compression: only combine rows with identical right sets
  // and results. No unobserved pairs or inferred type/ATK rules are introduced.
  const grouped = new Map<string, FusionRule>();
  for (const row of rows.values()) {
    row.right.sort((a,b)=>a-b);
    const key = `${row.result}:${row.right.join(',')}`;
    const rule = grouped.get(key) ?? {materials:[[],row.right],resultCardId:row.result};
    rule.materials[0].push(row.left);
    grouped.set(key,rule);
  }
  const rules = [...grouped.values()];
  for (const rule of rules) rule.materials[0].sort((a,b)=>a-b);
  rules.sort((a,b)=>a.resultCardId-b.resultCardId || a.materials[0][0]!-b.materials[0][0]!);
  transformations.sort((a,b)=>a.materials[0]-b.materials[0] || a.materials[1]-b.materials[1]);
  return {schemaVersion:1,rules,transformations};
}

export function normalizeStarters(value: unknown, cards: Card[]): StarterData {
  const presets = record(value);
  const leaderIds = [...new Set(groups.flat())].sort((a,b)=>a-b);
  const decks = leaderIds.map(leaderCardId => {
    const leader = cards.find(card => card.id === leaderCardId);
    if (!leader) throw new Error(`Unknown starter leader ${leaderCardId}`);
    const ids = presets[leader.name]; // name matching exists only at the import boundary
    if (!Array.isArray(ids)) throw new Error(`Missing starter deck ${leader.name}`);
    return {leaderCardId,cardIds:ids.map(id=>number(id,'starter card')),status:leaderCardId === 458 ? 'manual-review' as const : 'single-source' as const};
  });
  return {schemaVersion:1,groups:groups.map((ids,id)=>({id,leaderCardIds:[...ids] as [number,number,number]})),decks};
}
