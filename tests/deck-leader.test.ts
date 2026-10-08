import { expect, test } from 'bun:test';
import { loadCanonical } from '../scripts/data/canonical';
import {
  DECK_LEADER_RANKS,
  DECK_LEADER_SOURCES,
  LEADER_TYPE_REPORTS,
  leaderTypeReport,
  rankIndex,
  reportedAbilitiesAtRank,
} from '../src/lib/dotr/deck-leader';

const data = await loadCanonical();

test('rank reference lists the twelve promoted ranks in their documented order', () => {
  expect(DECK_LEADER_RANKS.map((item) => item.code)).toEqual([
    '2LT', '1LT', 'CPT', 'MAJ', 'LTC', 'COL',
    'BG', 'RADM', 'VADM', 'ADM', 'SADM', 'SD',
  ]);
  expect(new Set(DECK_LEADER_RANKS.map((rank) => rank.code)).size).toBe(12);
  expect(rankIndex('2LT')).toBe(0);
  expect(rankIndex('SD')).toBe(11);
});

test('starter choices resolve to known monster card IDs, not extra deck copies', () => {
  const byId = new Map(data.cards.map((card) => [card.id, card]));
  const leaderIds = new Set(data.starters.groups.flatMap((group) => group.leaderCardIds));
  expect(leaderIds.size).toBe(17);
  expect([...leaderIds].every((id) => byId.get(id)?.kind === 'monster')).toBe(true);
  expect(byId.get(34)?.name).toBe('Twin-Headed Behemoth');
  expect(byId.get(34)?.monsterType).toBe('Dragon');
});

test('source-backed type reports have valid ranks and canonical monster types', () => {
  const knownTypes = new Set(data.cards.map((card) => card.monsterType).filter(Boolean));
  const seen = new Set<string>();
  for (const profile of LEADER_TYPE_REPORTS) {
    expect(knownTypes.has(profile.monsterType)).toBe(true);
    expect(seen.has(profile.monsterType)).toBe(false);
    seen.add(profile.monsterType);
    for (const ability of profile.reports) {
      expect(rankIndex(ability.rank)).toBeGreaterThanOrEqual(0);
      expect(ability.name).not.toBe('');
    }
  }
  expect(DECK_LEADER_SOURCES.faq.url).toContain('gamefaqs.gamespot.com');
});

test('reported timeline never asserts unlocked effects for an unknown rank', () => {
  expect(reportedAbilitiesAtRank('Dragon', null)).toEqual([]);
  expect(reportedAbilitiesAtRank('Dragon', '2LT')).toEqual([]);
  expect(reportedAbilitiesAtRank('Dragon', 'ADM').map((a) => a.name))
    .toEqual(['Increased Deck Leader Movement']);
  expect(reportedAbilitiesAtRank('Dragon', 'SD').map((a) => a.name))
    .toEqual(['Increased Deck Leader Movement', 'Decreased Summoning Cost']);
  expect(leaderTypeReport('Beast-Warrior')).toBeNull();
  expect(leaderTypeReport(null)).toBeNull();
});
