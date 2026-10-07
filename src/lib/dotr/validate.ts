import { ATTRIBUTES, FUSION_TAGS, MONSTER_TYPES, type CanonicalData, type FusionRule } from './model';
import { expandFusionRules, pairKey } from './fusion';
import { validateImages } from './images';

function assert(condition: unknown,message: string): asserts condition {
  if (!condition) throw new Error(`Invalid canonical data: ${message}`);
}
function object(value: unknown,keys: readonly string[],label: string): Record<string,unknown> {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value),`${label}: expected object`);
  const obj = value as Record<string,unknown>;
  assert(Object.keys(obj).length === keys.length && keys.every(key=>Object.hasOwn(obj,key)) && Object.keys(obj).every(key=>keys.includes(key)),`${label}: unexpected or missing fields`);
  return obj;
}
function array(value: unknown,label: string): unknown[] {
  assert(Array.isArray(value),`${label}: expected array`);
  return value as unknown[];
}
function integer(value: unknown,min: number,max: number,label: string): asserts value is number {
  assert(typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max,`${label}: expected integer ${min}..${max}`);
}
function member(value: unknown,values: readonly unknown[],label: string): void {
  assert(values.includes(value),`${label}: unknown domain value ${String(value)}`);
}
function uniqueSortedIds(value: unknown,label: string): number[] {
  const ids = array(value,label);
  ids.forEach((id,i)=>{
    integer(id,0,853,label);
    if (i>0) assert((ids[i-1] as number)<id,`${label}: duplicate or unsorted IDs`);
  });
  return ids as number[];
}

export function validateDataset(value: unknown): asserts value is CanonicalData {
  const data = object(value,['cards','fusions','starters','images'],'dataset');
  const cards = array(data['cards'],'cards');
  assert(cards.length === 854,'expected exactly 854 library records (000..853)');
  const names = new Set<string>();
  const kinds = new Map<number,unknown>();
  cards.forEach((value,id)=>{
    const c = object(value,['id','name','kind','monsterType','attribute','level','deckCost','atk','def','trapRange','magicClass','password','effect','fusionTags','powerUpCardIds'],`card ${id}`);
    integer(c['id'],0,853,'card ID');
    assert(c['id'] === id,'card IDs must be unique, contiguous and sorted');
    assert(typeof c['name'] === 'string' && c['name'].trim() === c['name'] && c['name'].length>0,'missing or unnormalized card name');
    const name = c['name'].toLowerCase();
    assert(!names.has(name),'duplicate canonical card name'); names.add(name);
    member(c['kind'],['monster','magic','trap','ritual'],'card kind');
    kinds.set(id,c['kind']);
    if (c['kind'] === 'monster') {
      member(c['monsterType'],MONSTER_TYPES,'monster type');
      if (id === 671) {
        assert(c['name'] === 'Summoned Lord Exodia','exceptional library record identity');
        for (const field of ['attribute','level','deckCost','atk','def']) assert(c[field] === null,`671: ${field} must remain unknown`);
      } else {
        member(c['attribute'],ATTRIBUTES,'monster attribute');
        integer(c['level'],1,12,'level'); integer(c['deckCost'],1,99,'deck cost');
        integer(c['atk'],0,9999,'ATK'); integer(c['def'],0,9999,'DEF');
      }
    } else {
      for (const field of ['monsterType','attribute','level','atk','def']) assert(c[field] === null,`nonmonster ${field} must be null`);
      integer(c['deckCost'],1,99,'nonmonster deck cost');
    }
    member(c['trapRange'],c['kind'] === 'trap' ? ['full','limited'] : [null],'trap range');
    member(c['magicClass'],c['kind'] === 'magic' ? ['normal','power-up'] : [null],'magic class');
    assert(c['password'] === null || typeof c['password'] === 'string' && /^[A-Z0-9]{8}$/.test(c['password']),'password must be an eight-character string or null');
    const effect = object(c['effect'],['status','text'],'effect');
    member(effect['status'],['not-recorded','untranscribed'],'effect status');
    assert(effect['text'] === null,'M0 does not publish third-party effect prose');
    const tags = array(c['fusionTags'],'fusion tags');
    tags.forEach(tag=>member(tag,FUSION_TAGS,'fusion tag'));
    assert(new Set(tags).size === tags.length,'duplicate fusion tags');
    uniqueSortedIds(c['powerUpCardIds'],'power-up references');
  });
  function reference(id: unknown,label: string): asserts id is number {
    integer(id,0,853,label); assert(kinds.has(id),`unresolved ${label}`);
  }
  cards.forEach(value=>{
    const c = value as CanonicalData['cards'][number];
    c.powerUpCardIds.forEach(id=>{
      reference(id,'powerup'); assert(kinds.get(id) === 'magic','powerup must refer to a magic card');
    });
  });

  const fusions = object(data['fusions'],['schemaVersion','rules','transformations'],'fusions');
  assert(fusions['schemaVersion'] === 1,'fusion schema version');
  const rules = array(fusions['rules'],'fusion rules');
  rules.forEach(value=>{
    const rule = object(value,['materials','resultCardId'],'fusion rule');
    const materials = array(rule['materials'],'fusion materials');
    assert(materials.length === 2,'fusion requires two predicates');
    for (const predicate of materials) {
      const ids = uniqueSortedIds(predicate,'fusion material IDs');
      assert(ids.length>0,'empty fusion material predicate');
      ids.forEach(id=>{reference(id,'fusion material');assert(kinds.get(id)==='monster','fusion material must be monster');});
    }
    reference(rule['resultCardId'],'fusion result');
    assert(kinds.get(rule['resultCardId'])==='monster','fusion result must be monster');
  });
  const pairs = expandFusionRules(rules as FusionRule[]);
  assert(pairs.size === 26540,'expected 26,540 researched fusion pairs');
  const transforms = array(fusions['transformations'],'transformations');
  assert(transforms.length === 13,'expected 13 researched power-up transformations');
  const seen = new Set<string>();
  transforms.forEach(value=>{
    const entry = object(value,['materials','outcome'],'transformation');
    const materials = uniqueSortedIds(entry['materials'],'transformation materials');
    assert(materials.length===2,'transformation needs two distinct cards');
    materials.forEach(id=>reference(id,'transformation material'));
    const key = pairKey(materials[0]!,materials[1]!);
    assert(!seen.has(key) && !pairs.has(key),'duplicate or overlapping transformation'); seen.add(key);
    const outcomeValue = entry['outcome'];
    assert(outcomeValue !== null && typeof outcomeValue === 'object','transformation outcome');
    const kind = (outcomeValue as Record<string,unknown>)['kind'];
    if (kind === 'card') {
      const outcome = object(outcomeValue,['kind','cardId'],'transformation outcome');
      reference(outcome['cardId'],'transformation result');
      assert(kinds.get(outcome['cardId']) === 'monster','transformation result must be monster');
    } else {
      const outcome = object(outcomeValue,['kind','mechanic'],'random outcome');
      assert(kind === 'random' && outcome['mechanic'] === 'insect-imitation' && materials[1] === 800,'unknown random outcome');
    }
  });

  const starters = object(data['starters'],['schemaVersion','groups','decks'],'starters');
  assert(starters['schemaVersion'] === 1,'starter schema version');
  const groups = array(starters['groups'],'starter groups');
  assert(groups.length===16,'expected 16 starter choice groups');
  const leaders = new Set<number>();
  groups.forEach((value,id)=>{
    const group = object(value,['id','leaderCardIds'],'starter group');
    assert(group['id'] === id,'starter group IDs must be 0..15 in order');
    const choices = array(group['leaderCardIds'],'starter choices');
    assert(choices.length === 3 && new Set(choices).size === 3,'three distinct starter choices required');
    choices.forEach(leader=>{
      reference(leader,'starter leader'); assert(kinds.get(leader)==='monster','starter leader must be monster'); leaders.add(leader);
    });
  });
  assert(leaders.size===17,'expected 17 different starter leaders');
  const decks = array(starters['decks'],'starter decks');
  assert(decks.length===17,'expected 17 starter deck lists');
  const deckLeaders = new Set<number>();
  decks.forEach(value=>{
    const deck = object(value,['leaderCardId','cardIds','status'],'starter deck');
    reference(deck['leaderCardId'],'deck leader');
    assert(leaders.has(deck['leaderCardId']) && !deckLeaders.has(deck['leaderCardId']),'unknown or duplicate deck leader');
    deckLeaders.add(deck['leaderCardId']);
    member(deck['status'],['single-source','manual-review'],'starter deck status');
    const ids = array(deck['cardIds'],'deck cards'); assert(ids.length===40,'starter deck must contain 40 cards');
    ids.forEach(id=>reference(id,'starter deck card'));
  });

  validateImages(data['images']);
}
