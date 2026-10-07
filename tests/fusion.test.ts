import { describe, expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import { createFusionEngine } from '../src/lib/dotr/fusion';

const data = await loadCanonical();
const engine = createFusionEngine(data.cards,data.fusions);
describe('researched original-card combinations', () => {
  test.each([[21,36,24],[7,294,9],[7,19,14],[6,155,23],[356,374,483],[21,533,535],[478,542,538],[632,542,538],[35,73,312],[44,73,312],[155,613,151],[143,172,154]])('%d + %d produces %d in either order', (a,b,result) => {
    expect(engine.fuse(a,b)).toBe(result);
    expect(engine.fuse(b,a)).toBe(result);
  });
  test('preserves holes in generic ATK heuristics and known exception', () => {
    expect(engine.fuse(19,533)).toBeNull();
    expect(engine.fuse(142,172)).toBeNull();
  });
  test('chained fusions use the previous result', () => {
    expect(engine.chain([21,36,533])).toEqual({status:'complete',resultCardId:538,steps:[{materials:[21,36],resultCardId:24},{materials:[24,533],resultCardId:538}]});
  });
  test('stops at failed fusion without inventing the game discard behavior', () => {
    expect(engine.chain([21,36,0])).toMatchObject({status:'no-fusion',at:2,resultCardId:24});
  });
  test('forward lookup resolves ID references', () => {
    expect(engine.forward(21)).toContainEqual({materialCardId:36,resultCardId:24});
  });
  test('keeps special power-ups out of monster fusion lookup', () => {
    expect(engine.fuse(7,799)).toBeNull();
    expect(engine.transform(7,799)).toEqual({kind:'card',cardId:501});
    expect(engine.transform(16,800)).toEqual({kind:'random',mechanic:'insect-imitation'});
    expect(engine.fuse(16,800)).toBeNull();
  });
  test.each([-1,854,1.5,NaN])('rejects invalid card ID %s', id => {
    expect(()=>engine.fuse(id,21)).toThrow();
    expect(()=>engine.forward(id)).toThrow();
  });
  test('rejects meaningless chain length', () => {
    expect(()=>engine.chain([])).toThrow();
    expect(()=>engine.chain([21])).toThrow();
  });
});
