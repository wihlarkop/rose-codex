import { loadCanonical } from './canonical';
import { validateDataset } from '../../src/lib/dotr/validate';
import { expandFusionRules } from '../../src/lib/dotr/fusion';
import cardChecks from '../../data/manifests/card-checks.json';
import { validateImageFiles } from '../images/validate';
import { fileURLToPath } from 'node:url';

const data = await loadCanonical();
validateDataset(data);
for (const check of cardChecks) {
  const card = data.cards.find(card=>card.id === check.cardId);
  if (!card) throw new Error(`Missing cross-checked card: ${check.cardId}`);
  for (const [field,expected] of Object.entries(check.fields)) {
    if (card[field as keyof typeof card] !== expected) throw new Error(`Card ${check.cardId} ${field} disagrees with documented cross-check: ${check.source}`);
  }
}
await validateImageFiles(data.images, fileURLToPath(new URL('../../public/cards/', import.meta.url)));
console.log(`Valid: ${data.cards.length} cards, ${expandFusionRules(data.fusions.rules).size} fusion pairs, ${data.fusions.transformations.length} transformations, ${data.starters.decks.length} starter decks.`);
