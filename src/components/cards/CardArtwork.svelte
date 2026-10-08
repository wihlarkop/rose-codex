<script lang="ts">
  import type { BrowserCard } from '../../lib/dotr/browser';
  let { image, name, cardId, eager = false, decorative = false }: {
    image: BrowserCard['image']; name: string; cardId: number;
    eager?: boolean; decorative?: boolean;
  } = $props();
  let failed = $state(false);
</script>
<div class="card-artwork">
  {#if image && !failed}
    <img src={image.url} alt={decorative ? '' : name + ' — DotR card ' + String(cardId).padStart(3, '0')}
      width={image.width} height={image.height} loading={eager ? 'eager' : 'lazy'} decoding="async" onerror={() => failed = true} />
  {:else}
    <div class="unavailable"><span class="number">#{String(cardId).padStart(3, '0')}</span><span>Image unavailable</span></div>
  {/if}
</div>
<style>
  .card-artwork { position: relative; overflow: hidden; aspect-ratio: 5 / 4; background: var(--artwork-background); }
  img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .unavailable { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); color: var(--warning); font-size: .75rem; }
  .unavailable .number { font-size: 1.25rem; color: var(--foreground); }
</style>
