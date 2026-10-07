import starters from '../../../data/canonical/starters.json';

const codes = new Map<string,number>([[',',0x002],[' ',0x070]]);
for (const [characters,start] of [
  ['ABCDEFGHIJKLMNOPQRSTUVWXYZ',0x056],
  ['[]abcdefghijklmnopqrstuvwxyz()1234567890!"#$%&\'=^-¥./_',0x071],
] as const) {
  [...characters].forEach((character,index)=>codes.set(character,start+index));
}

export function characterValue(character: string): number {
  const code = codes.get(character);
  if (code === undefined) throw new RangeError(`Unsupported DotR name character: ${JSON.stringify(character)}`);
  return code % 16;
}

export function nameGroup(name: string): number {
  const characters = [...name];
  if (characters.length < 1 || characters.length > 12) throw new RangeError('DotR names require 1..12 characters');
  return (characters.reduce((sum,character)=>sum+characterValue(character),0) + (12-characters.length)*14) % 16;
}

export function starterDecksForName(name: string): {groupId:number;leaderCardIds:[number,number,number]} {
  const groupId = nameGroup(name);
  const group = starters.groups[groupId];
  if (!group || group.leaderCardIds.length !== 3) throw new Error(`Missing canonical starter group ${groupId}`);
  return {groupId,leaderCardIds:[group.leaderCardIds[0]!,group.leaderCardIds[1]!,group.leaderCardIds[2]!]};
}
