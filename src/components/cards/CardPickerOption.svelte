<script lang="ts">
  import type { BrowserCard } from '../../lib/dotr/browser';
  import CardArtwork from './CardArtwork.svelte';
  let { card }: { card: BrowserCard } = $props();
</script>
<div class="w-16 shrink-0 overflow-hidden rounded-sm"><CardArtwork image={card.image} name={card.name} cardId={card.id} presentation="artwork" decorative /></div>
<div class="min-w-0 flex-1">
  <span class="block text-sm font-medium leading-snug">{card.name}</span>
  <span class="text-xs text-muted-foreground">{card.monsterType ?? (card.kind === 'magic' ? 'Magic' : card.kind === 'trap' ? 'Trap' : 'Ritual')}{card.attribute ? ' · ' + card.attribute : ''}{!card.image ? ' · Image unavailable' : ''}</span>
</div>
<span class="shrink-0 text-xs text-muted-foreground number">#{String(card.id).padStart(3, '0')}</span>
