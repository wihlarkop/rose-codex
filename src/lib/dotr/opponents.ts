/** Story-mode opponent reference based on a single community walkthrough.
 * This is a curated subset of reported cards, not complete enemy decks, an
 * extracted game table, a drop table, or a difficulty ranking. */
export const OPPONENT_GUIDE = {
  title: 'KeyBlade999 · DotR Guide and Walkthrough (2012)',
  url: 'https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/63791',
} as const;

export type RosePath = 'red' | 'white';

export interface OpponentProfile {
  id: string;
  name: string;
  path: RosePath;
  location: string;
  deckCost: number;
  leaderCardId: number;
  terrains: readonly string[];
  notableCardIds: readonly number[];
  strategy: string;
  finalBoss?: boolean;
}

/** The two final-boss encounters have different Deck Leaders and lists. */
export const OPPONENTS: readonly OpponentProfile[] = [
  {
    id: 'weevil',
    name: 'Weevil Underwood',
    path: 'red',
    location: 'Chester',
    deckCost: 854,
    leaderCardId: 397,
    terrains: ['Forest', 'Wasteland'],
    notableCardIds: [401, 798, 848],
    strategy: 'Watch the moth-evolution setup and ritual materials. Intercept the early insects before a powerful result reaches the field.',
  },
  {
    id: 'rex',
    name: 'Rex Raptor',
    path: 'red',
    location: 'Tewkesbury',
    deckCost: 960,
    leaderCardId: 434,
    terrains: ['Labyrinth', 'Wasteland'],
    notableCardIds: [436, 443, 775],
    strategy: 'Dinosaurs become more dangerous on Wasteland. Check the terrain before judging a battle by printed ATK alone.',
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    path: 'red',
    location: 'Exeter',
    deckCost: 795,
    leaderCardId: 108,
    terrains: ['Labyrinth', 'Meadow', 'Sea'],
    notableCardIds: [745, 106, 108],
    strategy: 'Keep an eye on Zombie support, particularly Call of the Haunted. Avoid assuming low base stats mean the field will stay weak.',
  },
  {
    id: 'darkness-ruler',
    name: 'Darkness Ruler',
    path: 'red',
    location: 'St. Albans',
    deckCost: 982,
    leaderCardId: 300,
    terrains: ['Dark', 'Forest'],
    notableCardIds: [298, 300, 834],
    strategy: 'Expect Fiend-oriented defenses and Dark terrain. Consider routes around protected monsters rather than rushing the fortified leader.',
  },
  {
    id: 'keith',
    name: 'Keith',
    path: 'red',
    location: 'Towton',
    deckCost: 1027,
    leaderCardId: 505,
    terrains: ['Wasteland', 'Labyrinth'],
    notableCardIds: [502, 514, 799],
    strategy: 'Machine monsters and power-up cards can make direct trades costly. Keep a defensive answer ready before engaging his stronger Machines.',
  },
  {
    id: 'labyrinth-master',
    name: 'Labyrinth Master',
    path: 'red',
    location: 'Newcastle',
    deckCost: 1016,
    leaderCardId: 190,
    terrains: ['Crush', 'Labyrinth', 'Sea', 'Normal', 'Dark', 'Forest', 'Meadow'],
    notableCardIds: [697, 486, 698],
    strategy: 'Labyrinth tiles shape the routes to the opposing leader. Plan movement and access first; ordinary ATK comparisons will not tell the whole story.',
  },
  {
    id: 'pegasus',
    name: 'Pegasus Crawford',
    path: 'red',
    location: 'Lancashire',
    deckCost: 1254,
    leaderCardId: 61,
    terrains: ['Toon', 'Labyrinth', 'Sea', 'Normal', 'Meadow'],
    notableCardIds: [611, 362, 732],
    strategy: 'Toon terrain and control cards complicate attacks. Look for safer non-Toon squares and protect valuable monsters from control effects.',
  },
  {
    id: 'ishtar',
    name: 'Ishtar',
    path: 'red',
    location: 'Isle of Man',
    deckCost: 861,
    leaderCardId: 80,
    terrains: ['Crush', 'Wasteland', 'Sea'],
    notableCardIds: [829, 476, 600],
    strategy: 'Sea and Crush areas can favor very different monsters. Watch for Mirror Wall and avoid committing attackers before checking the contact square.',
  },
  {
    id: 'seto',
    name: 'Seto Kaiba',
    path: 'red',
    location: 'Stonehenge',
    deckCost: 1184,
    leaderCardId: 0,
    terrains: ['Meadow', 'Labyrinth', 'Normal'],
    notableCardIds: [0, 3, 837],
    strategy: 'The reported deck contains several Blue-Eyes and an Ultimate Dragon ritual. Plan a response to high ATK and a possible ritual outcome.',
  },
  {
    id: 'guardian-red',
    name: 'Manawyddan fab Llyr',
    path: 'red',
    location: 'Stonehenge',
    deckCost: 1985,
    leaderCardId: 75,
    terrains: ['Meadow', 'Labyrinth', 'Crush'],
    notableCardIds: [75, 789, 827],
    strategy: 'This Skull Knight version includes Riryoku and disruptive Magic/Traps. Preserve countermeasures and account for the Crush area.',
    finalBoss: true,
  },
  {
    id: 'tea',
    name: 'Téa Gardner',
    path: 'white',
    location: 'Windsor',
    deckCost: 933,
    leaderCardId: 394,
    terrains: ['Meadow', 'Mountain', 'Normal'],
    notableCardIds: [394, 392, 763],
    strategy: 'The reported deck uses Fairies and power-ups. Maintain a reliable attacker and consider the effect of Mountain and Meadow when approaching.',
  },
  {
    id: 'tristan',
    name: 'T. Tristan Grey',
    path: 'white',
    location: 'London',
    deckCost: 1149,
    leaderCardId: 157,
    terrains: ['Varied (not fully itemized)'],
    notableCardIds: [219, 208, 751],
    strategy: 'Expect a mixed monster pool with possible control effects. Do not assume a single terrain advantage will hold across the map.',
  },
  {
    id: 'mai',
    name: 'Margaret Mai Beaufort',
    path: 'white',
    location: 'Canterbury',
    deckCost: 1003,
    leaderCardId: 272,
    terrains: ['Mountain', 'Wasteland'],
    notableCardIds: [30, 272, 797],
    strategy: 'Harpie support and Mountain can strengthen flying monsters. Prioritize the buffed threats instead of relying solely on their printed ATK.',
  },
  {
    id: 'mako',
    name: 'Mako',
    path: 'white',
    location: 'Dover',
    deckCost: 1001,
    leaderCardId: 476,
    terrains: ['Sea', 'Meadow'],
    notableCardIds: [478, 476, 563],
    strategy: 'Water monsters benefit from Sea. Watch for Aqua Dragon and position your own monsters with terrain changes in mind.',
  },
  {
    id: 'joey',
    name: 'Joey',
    path: 'white',
    location: 'Amiens',
    deckCost: 970,
    leaderCardId: 151,
    terrains: ['All standard terrains except Crush (guide summary)'],
    notableCardIds: [7, 799, 736],
    strategy: 'Metalmorph and Shield & Sword can overturn a favorable stat matchup. Keep a response to Magic cards before challenging Red-Eyes.',
  },
  {
    id: 'shadi',
    name: 'Shadi',
    path: 'white',
    location: 'Paris',
    deckCost: 982,
    leaderCardId: 633,
    terrains: ['Crush', 'Sea', 'Dark', 'Wasteland', 'Forest'],
    notableCardIds: [45, 343, 535],
    strategy: 'Crush splits the board and affects access to the leader. Take a safe route and do not count on unverified control interactions.',
  },
  {
    id: 'jasper',
    name: 'Jasper Dice Tudor',
    path: 'white',
    location: 'Le Mans',
    deckCost: 1078,
    leaderCardId: 58,
    terrains: ['Varied (not fully itemized)'],
    notableCardIds: [57, 54, 806],
    strategy: 'The reported deck includes Exodia pieces and stall cards. Interrupting its setup is more important than chasing an immediate stat advantage.',
  },
  {
    id: 'bakura',
    name: 'Bakura',
    path: 'white',
    location: 'Rennes',
    deckCost: 757,
    leaderCardId: 647,
    terrains: ['Forest', 'Crush'],
    notableCardIds: [650, 761, 794],
    strategy: 'Forest/Crush restricts movement choices. Avoid overcommitting into the field and plan how to reach the leader without depending on large monsters.',
  },
  {
    id: 'yugi',
    name: 'Yugi',
    path: 'white',
    location: 'Brest',
    deckCost: 1206,
    leaderCardId: 60,
    terrains: ['Varied (not fully itemized)'],
    notableCardIds: [60, 853, 827],
    strategy: 'Dark Magician support, rituals and Mirror Force make this more than a pure ATK duel. Keep a way to respond to back-row threats.',
  },
  {
    id: 'guardian-white',
    name: 'Manawyddan fab Llyr',
    path: 'white',
    location: 'Stonehenge',
    deckCost: 1854,
    leaderCardId: 352,
    terrains: ['Meadow', 'Labyrinth', 'Dark'],
    notableCardIds: [0, 789, 60],
    strategy: 'This Chakra version features large monsters alongside Riryoku. Bring protection against sudden ATK boosts and preserve routes to the leader.',
    finalBoss: true,
  },
];

export function findOpponents(query: string, path: RosePath | 'all', profiles: readonly OpponentProfile[] = OPPONENTS): OpponentProfile[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return profiles.filter((profile) => {
    if (path !== 'all' && profile.path !== path) return false;
    const searchable = [profile.name, profile.location, profile.id, profile.path].join(' ').toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

export function opponentById(id: string): OpponentProfile | undefined {
  return OPPONENTS.find((profile) => profile.id === id);
}
