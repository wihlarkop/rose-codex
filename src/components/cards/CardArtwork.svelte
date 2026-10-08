<script lang="ts">
  import type { BrowserCard } from '../../lib/dotr/browser';
  let { image, name, cardId, presentation = 'screen', natural = false, eager = false, decorative = false }: {
    image: BrowserCard['image']; name: string; cardId: number;
    presentation?: 'screen' | 'artwork'; natural?: boolean; eager?: boolean; decorative?: boolean;
  } = $props();
  let failed = $state(false);
</script>
<div class="card-artwork" class:artwork={presentation === 'artwork'} class:compact-screen={image?.compactScreen} class:natural>
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
  .artwork { aspect-ratio: 4 / 3; }
  .artwork img { position: absolute; width: 207.5%; max-width: none; height: auto; left: -101.2%; top: -53.5%; }
  .artwork.compact-screen img { width: 155%; left: -58%; top: -53%; clip-path: inset(23.18% 9.52% 33.1% 49.08%); }
  .natural { aspect-ratio: auto; border-radius: var(--radius); }
  .natural img { width: 100%; height: auto; }
  .natural:has(.unavailable) { aspect-ratio: 5 / 4; }
  .unavailable { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); color: var(--warning); font-size: .75rem; }
  .unavailable .number { font-size: 1.25rem; color: var(--foreground); }
</style>
