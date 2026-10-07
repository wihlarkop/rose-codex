import type { Card, CombinationOutcome, FusionData, FusionRule } from './model';

export const pairKey = (a: number,b: number): string => `${Math.min(a,b)},${Math.max(a,b)}`;

export function expandFusionRules(rules: FusionRule[]): Map<string,number> {
  const pairs = new Map<string,number>();
  for (const rule of rules) {
    for (const left of rule.materials[0]) for (const right of rule.materials[1]) {
      const key = pairKey(left,right);
      if (pairs.has(key)) throw new Error(`Overlapping fusion predicates: ${key}`);
      pairs.set(key,rule.resultCardId);
    }
  }
  return pairs;
}

export interface FusionStep { materials: [number,number]; resultCardId: number }
export type ChainResult =
  | {status:'complete';resultCardId:number;steps:FusionStep[]}
  | {status:'no-fusion';at:number;resultCardId:number;steps:FusionStep[]};

export function createFusionEngine(cards: Card[],data: FusionData) {
  const ids = new Set(cards.map(card=>card.id));
  const pairs = expandFusionRules(data.rules);
  const transformations = new Map(data.transformations.map(entry=>[pairKey(...entry.materials),entry.outcome]));
  function known(id: number): void {
    if (!Number.isInteger(id) || !ids.has(id)) throw new RangeError(`Unknown DotR card ID: ${id}`);
  }
  function fuse(left: number,right: number): number | null {
    known(left); known(right);
    return pairs.get(pairKey(left,right)) ?? null;
  }
  function transform(left: number,right: number): CombinationOutcome | null {
    known(left); known(right);
    const outcome = transformations.get(pairKey(left,right));
    return outcome ? {...outcome} : null;
  }
  function chain(materialIds: readonly number[]): ChainResult {
    if (materialIds.length < 2) throw new RangeError('A fusion chain requires at least two cards');
    materialIds.forEach(known);
    let current = materialIds[0]!;
    const steps: FusionStep[] = [];
    for (let at=1;at<materialIds.length;at++) {
      const next = materialIds[at]!;
      const result = fuse(current,next);
      if (result === null) return {status:'no-fusion',at,resultCardId:current,steps};
      steps.push({materials:[current,next],resultCardId:result});
      current = result;
    }
    return {status:'complete',resultCardId:current,steps};
  }
  function forward(cardId: number): {materialCardId:number;resultCardId:number}[] {
    known(cardId);
    const results = [];
    for (const materialCardId of [...ids].sort((a,b)=>a-b)) {
      const resultCardId = fuse(cardId,materialCardId);
      if (resultCardId !== null) results.push({materialCardId,resultCardId});
    }
    return results;
  }
  return {fuse,transform,chain,forward};
}
