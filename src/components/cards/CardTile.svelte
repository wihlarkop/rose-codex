<script lang="ts">
  import type { BrowserCard } from '../../lib/dotr/browser';
  import CardArtwork from './CardArtwork.svelte';
  import CardStats from './CardStats.svelte';
  let { card, presentation = 'screen' }: { card: BrowserCard; presentation?: 'screen' | 'artwork' } = $props();
</script>
<a class="card-tile group" href={'/cards/' + String(card.id).padStart(3, '0') + '/'}>
  <CardArtwork image={card.image} name={card.name} cardId={card.id} {presentation} decorative />
  <div class="tile-copy">
    <h2 class="card-name group-hover:text-primary">{card.name}</h2>
    <div class="mb-2 text-xs text-muted-foreground">{card.monsterType ?? (card.kind === 'magic' ? 'Magic' : card.kind === 'trap' ? 'Trap' : 'Ritual')}{card.attribute ? ' · ' + card.attribute : ''}</div>
    <CardStats {card} />
    <div class="mt-2 flex justify-between text-xs text-muted-foreground number"><span>#{String(card.id).padStart(3, '0')}</span><span>DC {card.deckCost ?? '—'}</span></div>
  </div>
</a>
<style>
  .card-tile { height: 100%; display: flex; flex-direction: column; background: var(--surface); border-radius: var(--radius); overflow: hidden; text-decoration: none; }
  .card-tile:hover { background: var(--hover); }
  .card-tile:focus-visible { outline-offset: 3px; }
  .tile-copy { padding: var(--space-3); }
  .card-name { font-size: .875rem; font-weight: 650; line-height: 1.35; min-height: 2.7em; margin-bottom: var(--space-1); overflow-wrap: anywhere; text-wrap: pretty; }
</style>
