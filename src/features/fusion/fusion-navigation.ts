export type FusionView = 'workbench' | 'recipes';

export function parseFusionView(search: string): FusionView {
  return new URLSearchParams(search).get('mode') === 'recipes' ? 'recipes' : 'workbench';
}

export function fusionViewPath(view: FusionView, search: string): string {
  const params = new URLSearchParams(search);
  if (view === 'workbench') params.delete('mode');
  else params.set('mode', 'recipes');
  const tail = params.toString();
  return '/fusion/' + (tail ? '?' + tail : '');
}
