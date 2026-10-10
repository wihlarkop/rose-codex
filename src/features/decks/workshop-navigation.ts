export type DeckWorkshopMode = 'build' | 'practice' | 'inventory';

/** Invalid/unknown mode values fall back to Build. Legacy ?suggest links are
 * intentionally handled by the Deck Builder rather than by navigation. */
export function parseDeckWorkshopMode(search: string): DeckWorkshopMode {
  const mode = new URLSearchParams(search).get('mode');
  return mode === 'practice' || mode === 'inventory' ? mode : 'build';
}

export function deckWorkshopPath(mode: DeckWorkshopMode, search: string): string {
  const params = new URLSearchParams(search);
  if (mode === 'build') params.delete('mode');
  else params.set('mode', mode);
  const tail = params.toString();
  return '/decks/' + (tail ? '?' + tail : '');
}
