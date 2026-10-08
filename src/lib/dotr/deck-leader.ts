import type { MonsterType } from './model';

/** Display order of the game's twelve promoted ranks, not a player progress tracker.
 * The in-game underlying XP and current rank are NOT in Rose Codex card data. */
export const DECK_LEADER_RANKS = [
  { code: '2LT', name: 'Second Lieutenant' },
  { code: '1LT', name: 'First Lieutenant' },
  { code: 'CPT', name: 'Captain' },
  { code: 'MAJ', name: 'Major' },
  { code: 'LTC', name: 'Lieutenant Colonel' },
  { code: 'COL', name: 'Colonel' },
  { code: 'BG', name: 'Brigadier' },
  { code: 'RADM', name: 'Rear Admiral' },
  { code: 'VADM', name: 'Vice Admiral' },
  { code: 'ADM', name: 'Admiral' },
  { code: 'SADM', name: 'Senior Admiral' },
  { code: 'SD', name: 'Secretary of Defence' },
] as const;

export type DeckLeaderRank = (typeof DECK_LEADER_RANKS)[number]['code'];

export const DECK_LEADER_SOURCES = {
  manual: {
    title: 'Official US instruction manual · Deck Leader / Leader Ability',
    url: 'https://www.videogamemanual.com/PS2/Yu-Gi-Oh%21%20The%20Duelists%20of%20the%20Roses%20%28USA%29.pdf',
  },
  gameplay: {
    title: 'Yugipedia · Deck Leader',
    url: 'https://yugipedia.com/wiki/Deck_Leader',
  },
  ranks: {
    title: 'CloudStryfe · GameFAQs walkthrough, §7-2 rank order',
    url: 'https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/22437',
  },
  faq: {
    title: 'Lord_Blade · Deck Leader FAQ v0.7 (incomplete community observations)',
    url: 'https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/30813',
  },
} as const;

/** Each entry is a *reported type-family unlock* in the community FAQ, not a
 * verified per-card ability or a claimed current unlock on the player's save.
 * Exceptions by level/card exist, and the FAQ is explicitly unfinished. */
export interface ReportedLeaderAbility {
  name: string;
  rank: DeckLeaderRank;
  detail?: string;
}
export interface LeaderTypeReport {
  monsterType: MonsterType;
  reports: readonly ReportedLeaderAbility[];
  caveat?: string;
}
export const LEADER_TYPE_REPORTS: readonly LeaderTypeReport[] = [
  { monsterType: 'Dragon', reports: [
    { name: 'Increased Deck Leader Movement', rank: 'ADM' },
    { name: 'Decreased Summoning Cost', rank: 'SADM', detail: 'FAQ excludes Level 1–3 leaders.' },
  ], caveat: 'Low-level Dragons may follow an extra Open Opponent’s Card pattern; its unlock rank is not specified.' },
  { monsterType: 'Spellcaster', reports: [
    { name: 'Increased Strength for Same Type Friendlies', rank: 'COL' },
    { name: 'Extended Support Range', rank: 'VADM' },
    { name: 'Weaken Specific Enemy Type: Fiend', rank: 'SADM' },
  ], caveat: 'FAQ separately suggests a low-level Yami terrain ability without a verified level/rank threshold.' },
  { monsterType: 'Warrior', reports: [
    { name: 'Extended Support Range', rank: 'ADM' },
    { name: 'Weaken Specific Enemy Type: Dragon', rank: 'SD' },
  ], caveat: 'The FAQ reports an extra Open Opponent’s Card ability for some low-level Warriors.' },
  { monsterType: 'Fairy', reports: [
    { name: 'Increased Strength for Same Type Friendlies', rank: '1LT' },
    { name: 'Improved Resistance for Same Type Friendlies', rank: 'LTC' },
    { name: 'Spellbind Specific Enemy Type: Zombie', rank: 'COL' },
    { name: 'Destroy Specific Enemy Type: Fiend', rank: 'BG' },
    { name: 'Extended Support Range', rank: 'RADM' },
    { name: 'LP Recovery', rank: 'SADM' },
  ], caveat: 'Level 1 Fairy leaders have a separately reported low-level ability; not included as a guaranteed unlock.' },
  { monsterType: 'Fiend', reports: [
    { name: 'Increased Strength for Same Type Friendlies', rank: 'COL' },
    { name: 'Weaken Specific Enemy Type: Spellcaster', rank: 'BG' },
    { name: 'Extended Support Range', rank: 'VADM' },
  ], caveat: 'The FAQ separately reports a low-level Yami terrain effect at RADM.' },
  { monsterType: 'Insect', reports: [
    { name: 'Weaken Specific Enemy Type: Sea Serpent', rank: 'MAJ' },
    { name: 'Increased Strength for Same Type Friendlies', rank: 'LTC' },
    { name: 'Extended Support Range', rank: 'BG' },
  ], caveat: 'Level 1 Insects may have a Forest terrain effect at COL according to the FAQ.' },
  { monsterType: 'Plant', reports: [
    { name: 'Increased Strength for Same Type Friendlies', rank: 'CPT' },
    { name: 'Extended Support Range', rank: 'COL' },
    { name: 'Spellbind Specific Enemy Type: Dragon', rank: 'BG' },
    { name: 'Destroy Specific Enemy Type: Thunder', rank: 'RADM' },
  ], caveat: 'LP Recovery at SADM appears in the low-level section; exact card eligibility is unverified.' },
  { monsterType: 'Machine', reports: [
    { name: 'Increased Movement for Same Type Friendlies', rank: '1LT' },
    { name: 'Increased Deck Leader Movement', rank: 'BG' },
  ], caveat: 'Decreased Summoning Cost is reported without a rank and is omitted from ranked entries.' },
  { monsterType: 'Zombie', reports: [
    { name: 'Extended Support Range', rank: 'MAJ' },
    { name: 'Increased Strength for Same Type Friendlies', rank: 'LTC' },
  ], caveat: 'FAQ highest tested rank was VADM; other abilities are incomplete.' },
  { monsterType: 'Beast', reports: [
    { name: 'Increased Movement for Same Type Friendlies', rank: 'CPT' },
    { name: 'Increased Strength for Same Type Friendlies', rank: 'LTC' },
    { name: 'Weaken Specific Enemy Type: Fish', rank: 'BG' },
  ], caveat: 'FAQ observations only reached BG rank.' },
  { monsterType: 'Sea Serpent', reports: [
    { name: 'Increased Movement for Same Type Friendlies', rank: 'MAJ' },
    { name: 'Decreased Summoning Cost', rank: 'SD', detail: 'Not applicable to Level 1–3 leaders per FAQ.' },
  ] },
];

const profiles = new Map(LEADER_TYPE_REPORTS.map(profile => [profile.monsterType, profile]));

export function leaderTypeReport(type: MonsterType | null): LeaderTypeReport | null {
  return type ? profiles.get(type) ?? null : null;
}
export function rankIndex(rank: DeckLeaderRank): number {
  return DECK_LEADER_RANKS.findIndex(entry => entry.code === rank);
}
export function reportedAbilitiesAtRank(
  type: MonsterType | null,
  rank: DeckLeaderRank | null,
): readonly ReportedLeaderAbility[] {
  const profile = leaderTypeReport(type);
  if (!profile || !rank) return [];
  return profile.reports.filter(item => rankIndex(item.rank) <= rankIndex(rank));
}
