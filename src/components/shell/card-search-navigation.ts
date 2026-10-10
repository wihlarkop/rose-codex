export function cardSearchAllPath(query: string): string {
  const value = query.trim().slice(0, 80);
  return '/cards/' + (value ? '?q=' + encodeURIComponent(value) : '');
}

export function cardSearchCardPath(cardId: number): string {
  return '/cards/?q=' + String(cardId).padStart(3, '0');
}
