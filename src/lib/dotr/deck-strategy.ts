import { DUEL_TERRAINS, terrainModifier, type DuelTerrain } from './duel-advisor';
import { expandFusionRules, pairKey } from './fusion';
import type { Card, FusionData } from './model';
import type { OpponentProfile } from './opponents';
import type { SmartDeck } from './smart-deck';

/** M5-03: deterministic evidence-backed advice for a *hypothetical* generated
 * deck. Never implies knowledge of the current board/hand/SP or enemy effects.
 */
export interface PlaybookThreat {
  cardId: number;
  bestCardId: number | null;
  terrain: DuelTerrain | null;
  attackEdge: number | null;
  /** A positive value only means adjusted ATK > adjusted enemy ATK. */
  statEdgeOnly: true;
}
export interface PlaybookTerrain {
  terrain: DuelTerrain;
  cardId: number;
  adjustedAttack: number;
  modifier: number;
}
export interface PlaybookEquip {
  equipCardId: number;
  monsterCardId: number;
}
export interface PlaybookFusion {
  leftId: number;
  rightId: number;
  resultCardId: number;
  attackGain: number;
}
export interface StrategyPlaybook {
  opponentId: string;
  style: SmartDeck['style'];
  setup: string;
  positioning: string;
  threatResponse: string;
  threats: PlaybookThreat[];
  terrainPicks: PlaybookTerrain[];
  equipPairs: PlaybookEquip[];
  fusionPairs: PlaybookFusion[];
  warnings: string[];
}
const SPECIAL = new Set(['Crush', 'Labyrinth', 'Toon']);

function ordinaryTerrains(opponent: OpponentProfile): DuelTerrain[] {
  return [...new Set(opponent.terrains)]
    .filter((terrain): terrain is DuelTerrain =>
      DUEL_TERRAINS.includes(terrain as DuelTerrain) && !SPECIAL.has(terrain));
}

function adjustedAttack(card: Card, terrain: DuelTerrain): number | null {
  if (card.kind !== 'monster' || card.atk === null) return null;
  const modifier = terrainModifier(card.monsterType, terrain);
  return modifier === null ? null : Math.max(0, card.atk + modifier);
}

export function buildStrategyPlaybook(
  deck: Pick<SmartDeck, 'opponentId' | 'style' | 'cardIds'>,
  opponent: OpponentProfile,
  cards: readonly Card[],
  fusions: FusionData,
): StrategyPlaybook {
  if (deck.opponentId !== opponent.id)
    throw new RangeError('The deck and opponent do not refer to the same encounter.');
  const byId = new Map(cards.map(card => [card.id, card]));
  const deckCounts = new Map<number, number>();
  for (const id of deck.cardIds) {
    if (!byId.has(id)) throw new RangeError('The deck references an unknown card.');
    deckCounts.set(id, (deckCounts.get(id) ?? 0) + 1);
  }
  const selected = [...deckCounts.keys()].map(id => byId.get(id)!);
  const monsters = selected.filter(card =>
    card.kind === 'monster' && card.atk !== null && card.def !== null);
  const terrains = ordinaryTerrains(opponent);

  // Ordinary terrain only; an unknown/special square is NEVER treated as Normal.
  const terrainPicks: PlaybookTerrain[] = terrains.flatMap(terrain => {
    const candidates = monsters.flatMap(card => {
      const attack = adjustedAttack(card, terrain);
      const modifier = terrainModifier(card.monsterType, terrain);
      return attack === null || modifier === null ? []
        : [{ terrain, cardId: card.id, adjustedAttack: attack, modifier }];
    }).sort((a, b) =>
      b.adjustedAttack - a.adjustedAttack || a.cardId - b.cardId);
    return candidates.slice(0, 1);
  });

  const threats: PlaybookThreat[] = opponent.notableCardIds.flatMap(id => {
    const enemy = byId.get(id);
    if (!enemy || enemy.kind !== 'monster' || enemy.atk === null) return [];
    const comparisons = terrains.flatMap(terrain => {
      const enemyAtk = adjustedAttack(enemy, terrain);
      if (enemyAtk === null) return [];
      return monsters.flatMap(card => {
        const ours = adjustedAttack(card, terrain);
        return ours === null ? [] : [{
          cardId: card.id, terrain, attackEdge: ours - enemyAtk,
        }];
      });
    }).sort((a, b) =>
      b.attackEdge - a.attackEdge || a.cardId - b.cardId
      || a.terrain.localeCompare(b.terrain));
    const best = comparisons[0];
    return [{
      cardId: id, bestCardId: best?.cardId ?? null,
      terrain: best?.terrain ?? null,
      attackEdge: best?.attackEdge ?? null, statEdgeOnly: true as const,
    }];
  });

  const equipPairs: PlaybookEquip[] = selected
    .filter(card => card.kind === 'magic' && card.magicClass === 'power-up')
    .flatMap(equip => {
      const compatible = monsters
        .filter(monster => monster.powerUpCardIds.includes(equip.id))
        .sort((a, b) => b.atk! - a.atk! || a.id - b.id)[0];
      return compatible
        ? [{ equipCardId: equip.id, monsterCardId: compatible.id }] : [];
    })
    .slice(0, 4);

  const fusionMap = expandFusionRules(fusions.rules);
  const fusionPairs: PlaybookFusion[] = [];
  for (let i = 0; i < monsters.length; i++) {
    const left = monsters[i]!;
    for (let j = i + 1; j < monsters.length; j++) {
      const right = monsters[j]!;
      const id = fusionMap.get(pairKey(left.id, right.id));
      if (id === undefined) continue;
      const result = byId.get(id);
      if (!result || result.kind !== 'monster' || result.atk === null) continue;
      const attackGain = result.atk - Math.max(left.atk!, right.atk!);
      if (attackGain <= 0) continue;
      fusionPairs.push({
        leftId: left.id, rightId: right.id, resultCardId: result.id,
        attackGain,
      });
    }
  }
  fusionPairs.sort((a, b) =>
    b.attackGain - a.attackGain || a.resultCardId - b.resultCardId
    || a.leftId - b.leftId || a.rightId - b.rightId);

  const priority = monsters.toSorted((a, b) =>
    (deck.style === 'defensive'
      ? b.def! - a.def! || b.atk! - a.atk!
      : b.atk! - a.atk! || b.def! - a.def!)
    || a.id - b.id)[0];
  const leadTerrain = terrainPicks.find(item => item.modifier > 0)
    ?? terrainPicks[0];
  const threatened = threats.find(item => item.attackEdge !== null && item.attackEdge > 0);
  const source = threatened ? byId.get(threatened.bestCardId!) : null;
  const biggestThreat = threats.toSorted((a, b) =>
    (byId.get(b.cardId)?.atk ?? -1) - (byId.get(a.cardId)?.atk ?? -1)
    || a.cardId - b.cardId)[0];
  const enemy = biggestThreat ? byId.get(biggestThreat.cardId) : null;

  return {
    opponentId: opponent.id,
    style: deck.style,
    setup: priority
      ? 'Look for ' + priority.name + ' as a ' + deck.style
        + ' stat priority if it is in hand and you have enough Summoning Points. This is not a confirmed legal summon.'
      : 'No monster with known ATK/DEF is available in this deck; there is no verified opening suggestion.',
    positioning: leadTerrain
      ? 'If the board permits, consider ' + byId.get(leadTerrain.cardId)!.name
        + ' on ' + leadTerrain.terrain + ': calculated ATK '
        + leadTerrain.adjustedAttack + ' (terrain modifier '
        + (leadTerrain.modifier >= 0 ? '+' : '') + leadTerrain.modifier
        + '). Check the destination and opponent effects first.'
      : 'No ordinary battlefield terrain from this profile can be evaluated; check special tiles and actual board positions manually.',
    threatResponse: threatened && source
      ? 'Against the reported monster ' + byId.get(threatened.cardId)!.name
        + ', ' + source.name + ' has an adjusted ATK edge of '
        + threatened.attackEdge + ' on ' + threatened.terrain
        + '. This compares attack values only, not a guaranteed duel outcome.'
      : enemy
        ? 'Reported threat ' + enemy.name
          + ' has no verified positive ATK matchup across the known ordinary terrains. Avoid assuming a safe attack.'
        : 'The reported notable cards do not provide a known enemy-monster ATK matchup. Check the actual game field before acting.',
    threats,
    terrainPicks,
    equipPairs,
    fusionPairs: fusionPairs.slice(0, 4),
    warnings: [
      'Advice is conditional: hand, Summoning Points, turn, movement, adjacency, and hidden cards are not available.',
      'Attack comparisons assume both monsters are in attack position on the indicated ordinary terrain. Effects, boosts, defensive position and traps can change the result.',
      'Equipment pairs use recorded power-up compatibility, not verified activation timing or power increase.',
      'Fusion pairs are potential ordinary recipes; field/summon legality and intermediate steps are not simulated.',
    ],
  };
}
