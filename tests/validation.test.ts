import { describe, expect, test } from 'bun:test';
import { validateDataset } from '../src/lib/dotr/validate';
import { loadCanonical } from '../scripts/data/canonical';

const baseline = await loadCanonical();
describe('canonical validation', () => {
  test('accepts the complete generated dataset', () => expect(() => validateDataset(baseline)).not.toThrow());
  const corruptions: [string,(data: any)=>void][] = [
    ['missing card',d=>d.cards.pop()],
    ['duplicate ID',d=>d.cards[1].id=0],
    ['noninteger ID',d=>d.cards[1].id=1.5],
    ['duplicate name',d=>d.cards[1].name=d.cards[0].name],
    ['blank name',d=>d.cards[1].name=' '],
    ['unknown field',d=>d.cards[1].card='Seiyaryu'],
    ['invalid kind',d=>d.cards[1].kind='effect-monster'],
    ['invalid type',d=>d.cards[1].monsterType='Cyberse'],
    ['invalid attribute',d=>d.cards[1].attribute='DIVINE'],
    ['negative stats',d=>d.cards[1].atk=-1],
    ['missing normal monster stats',d=>d.cards[1].atk=null],
    ['fabricated Exodia stats',d=>d.cards[671].atk=0],
    ['nonmonster stats',d=>d.cards[683].level=4],
    ['missing trap range',d=>d.cards[829].trapRange=null],
    ['number password',d=>d.cards[829].password=53297534],
    ['invalid password',d=>d.cards[0].password='XXXXXXXXX'],
    ['invalid tag',d=>d.cards[1].fusionTags=['TCG-only']],
    ['unresolved powerup',d=>d.cards[0].powerUpCardIds=[854]],
    ['unresolved material',d=>d.fusions.rules[0].materials[0]=[854]],
    ['empty predicate',d=>d.fusions.rules[0].materials[0]=[]],
    ['unresolved result',d=>d.fusions.rules[0].resultCardId=854],
    ['overlapping rule',d=>d.fusions.rules.push(d.fusions.rules[0])],
    ['unresolved transform',d=>d.fusions.transformations[0].outcome={kind:'card',cardId:854}],
    ['fabricated random mechanism',d=>d.fusions.transformations[0].outcome={kind:'random',mechanic:'unknown'}],
    ['unresolved leader',d=>d.starters.groups[0].leaderCardIds[0]=854],
    ['invalid group count',d=>d.starters.groups.pop()],
    ['duplicate choice',d=>d.starters.groups[0].leaderCardIds[1]=d.starters.groups[0].leaderCardIds[0]],
    ['unresolved deck card',d=>d.starters.decks[0].cardIds[0]=854],
    ['invalid deck length',d=>d.starters.decks[0].cardIds.pop()],
    ['missing image record',d=>d.images.pop()],
    ['slug asset name',d=>d.images[21].file='baby-dragon.webp'],
    ['verified image without source',d=>{d.images[21].status='verified';d.images[21].source=null;}],
  ];
  test.each(corruptions)('rejects %s', (_label, mutate) => {
    const data = structuredClone(baseline);
    mutate(data);
    expect(() => validateDataset(data)).toThrow();
  });
});
