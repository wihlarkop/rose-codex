export type DuelView = 'plan' | 'history';

export function parseDuelView(search: string): DuelView {
  return new URLSearchParams(search).get('mode') === 'history' ? 'history' : 'plan';
}

export function duelViewPath(view: DuelView, search: string): string {
  const params = new URLSearchParams(search);
  if (view === 'plan') params.delete('mode');
  else params.set('mode', 'history');
  const qs = params.toString();
  return '/duel/' + (qs ? '?' + qs : '');
}
