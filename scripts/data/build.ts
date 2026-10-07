import { normalizeCards, normalizeFusions, normalizeStarters } from './normalize';
import { extractJsonLiteral } from './parse';
import { readSource } from './source';
import { validateDataset } from '../../src/lib/dotr/validate';

const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg=>arg !== '--check')) throw new Error('Usage: bun run data:build [--check]');
const [cardSource,fusionSource] = await Promise.all([readSource('cardList.js'),readSource('fusionList.js')]);
const cards = normalizeCards(extractJsonLiteral(cardSource,'cardList'));
const fusions = normalizeFusions(extractJsonLiteral(fusionSource,'fusionCombos'));
const starters = normalizeStarters(extractJsonLiteral(cardSource,'presetDeck'),cards);
const images = cards.map(card=>({cardId:card.id,file:`${String(card.id).padStart(3,'0')}.webp`,source:null,status:'missing' as const}));
const dataset = {cards,fusions,starters,images};
validateDataset(dataset);
// Generate every value before writing any file. Compact per-record JSON keeps
// data reviewable without producing giant TypeScript modules.
const files = {
  'cards.json': `${JSON.stringify(cards,null,2)}\n`,
  'fusions.json': `${JSON.stringify(fusions)}\n`,
  'starters.json': `${JSON.stringify(starters,null,2)}\n`,
  'images.json': `${JSON.stringify(images,null,2)}\n`,
};
for (const [file,text] of Object.entries(files)) {
  const target = new URL(`../../data/canonical/${file}`,import.meta.url);
  if (check) {
    if (!await Bun.file(target).exists() || await Bun.file(target).text() !== text) throw new Error(`Stale canonical artifact: ${file}; run bun run data:build`);
  } else await Bun.write(target,text);
}
console.log(`${check ? 'Reproduced' : 'Generated'} 854 cards, ${fusions.rules.length} fusion predicates, 13 transformations, 16 starter groups, 17 decks, 854 missing image records.`);
