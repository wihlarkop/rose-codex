import { expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import { terrainModifier } from '../src/lib/dotr/duel-advisor';
import { createFusionEngine } from '../src/lib/dotr/fusion';
import { buildStrategyPlaybook } from '../src/lib/dotr/deck-strategy';
import { OPPONENTS } from '../src/lib/dotr/opponents';
import { generateSmartDeck, type DeckStyle } from '../src/lib/dotr/smart-deck';

test('strategy playbook only cites canonical equip pairs, fusion results and ordinary terrain', async () => {
  const data = await loadCanonical();
  const byId = new Map(data.cards.map(card => [card.id, card]));
  const engine = createFusionEngine(data.cards, data.fusions);
  for (const profile of [OPPONENTS[0]!, OPPONENTS[8]!, OPPONENTS[18]!]) {
    for (const style of ['balanced', 'aggressive', 'defensive'] as DeckStyle[]) {
      const deck = generateSmartDeck(data.cards, profile, style, data.fusions)!;
      const before = deck.cardIds.slice();
      const result = buildStrategyPlaybook(deck, profile, data.cards, data.fusions);
      expect(result.opponentId).toBe(profile.id);
      expect(result.style).toBe(style);
      expect(deck.cardIds).toEqual(before);
      expect(buildStrategyPlaybook(deck, profile, data.cards, data.fusions)).toEqual(result);
      for (const terrain of result.terrainPicks) {
        expect(profile.terrains).toContain(terrain.terrain);
        expect(['Crush', 'Labyrinth', 'Toon'].includes(terrain.terrain)).toBe(false);
        expect(deck.cardIds).toContain(terrain.cardId);
        const card = byId.get(terrain.cardId)!;
        const modifier = terrainModifier(card.monsterType, terrain.terrain);
        expect(modifier).toBe(terrain.modifier);
        expect(terrain.adjustedAttack).toBe(Math.max(0, card.atk! + modifier!));
      }
      for (const equip of result.equipPairs) {
        expect(deck.cardIds).toContain(equip.equipCardId);
        expect(deck.cardIds).toContain(equip.monsterCardId);
        expect(byId.get(equip.monsterCardId)!.powerUpCardIds).toContain(equip.equipCardId);
      }
      for (const fusion of result.fusionPairs) {
        expect(deck.cardIds).toContain(fusion.leftId);
        expect(deck.cardIds).toContain(fusion.rightId);
        expect(engine.fuse(fusion.leftId, fusion.rightId)).toBe(fusion.resultCardId);
        expect(fusion.attackGain).toBeGreaterThan(0);
      }
      for (const threat of result.threats) {
        expect(profile.notableCardIds).toContain(threat.cardId);
        expect(byId.get(threat.cardId)?.kind).toBe('monster');
        if (threat.bestCardId !== null) expect(deck.cardIds).toContain(threat.bestCardId);
        if (threat.terrain) expect(profile.terrains).toContain(threat.terrain);
      }
    }
  }
});

test('unknown or special-only terrain cannot become a fabricated stat advantage', async () => {
  const data = await loadCanonical();
  const profile = {
    ...OPPONENTS[0]!,
    terrains: ['Toon', 'Labyrinth', 'Crush', 'Undocumented terrain'],
  };
  const deck = generateSmartDeck(data.cards, profile, 'balanced', data.fusions)!;
  const result = buildStrategyPlaybook(deck, profile, data.cards, data.fusions);
  expect(result.terrainPicks).toEqual([]);
  expect(result.threats.every(threat => threat.terrain === null
    && threat.bestCardId === null && threat.attackEdge === null)).toBe(true);
  expect(result.positioning).toMatch(/No ordinary battlefield terrain/);
});

test('mismatched opponent and unknown deck IDs fail without inventing advice', async () => {
  const data = await loadCanonical();
  const profile = OPPONENTS[0]!;
  const deck = generateSmartDeck(data.cards, profile, 'balanced', data.fusions)!;
  expect(() => buildStrategyPlaybook(deck, OPPONENTS[1]!, data.cards, data.fusions))
    .toThrow(/same encounter/);
  expect(() => buildStrategyPlaybook({ ...deck, cardIds: [99999] },
    profile, data.cards, data.fusions)).toThrow(/unknown card/);
});
