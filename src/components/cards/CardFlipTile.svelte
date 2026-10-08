<script lang="ts">
  import type { BrowserCard } from '../../lib/dotr/browser';
  import CardArtwork from './CardArtwork.svelte';
  let { card, id, flipped = $bindable(false), onflip }: { card: BrowserCard; id?: string; flipped?: boolean; onflip?: ((cardId: number, next: boolean) => void) | undefined } = $props();
  const cardNumber = $derived(String(card.id).padStart(3, '0'));
  const kindLabel = $derived(card.kind === 'monster' ? 'Monster' : card.kind === 'magic' ? 'Magic' : card.kind === 'trap' ? 'Trap' : 'Ritual');
  const typeLabel = $derived(card.kind === 'monster' ? card.monsterType : card.kind === 'magic' ? (card.magicClass === 'power-up' ? 'Power-up' : card.magicClass === 'normal' ? 'Normal' : null) : card.kind === 'trap' ? (card.trapRange === 'full' ? 'Full range' : card.trapRange === 'limited' ? 'Limited range' : null) : null);
  function toggle() { flipped = !flipped; onflip?.(card.id, flipped); }
  function handleKeydown(event: KeyboardEvent) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } }
</script>
<div id={id ?? 'library-card-' + cardNumber} role="button" tabindex="0" aria-pressed={flipped}
  aria-label={flipped ? 'Show image for ' + card.name + ', card ' + cardNumber : 'Show metadata for ' + card.name + ', card ' + cardNumber}
  class="card-tile group rounded-[10px] border border-border bg-surface text-foreground transition-[transform,border-color,background-color,box-shadow] duration-150 hover:-translate-y-px hover:border-primary hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
  onclick={toggle} onkeydown={handleKeydown}>
  <div class="flip-scene" class:flipped>
    <div class="flip-rotor">
      <div class="flip-face flip-front" aria-hidden={flipped} inert={flipped}>
        <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
        <h2 class="m-0 break-words px-3 py-3 text-[.9375rem] leading-[1.3] font-semibold tracking-[-.015em] text-foreground group-hover:text-primary">{card.name}</h2>
      </div>
      <div class="flip-face flip-back flex flex-col gap-2 rounded-[10px] bg-surface p-3" aria-hidden={!flipped} inert={!flipped}>
        <header class="flex min-w-0 items-start justify-between gap-2">
          <div class="min-w-0"><p class="m-0 text-[.625rem] font-semibold tracking-[.08em] text-muted-foreground">CARD {cardNumber}</p><h2 class="m-0 line-clamp-2 break-words text-sm leading-snug font-semibold tracking-[-.015em]">{card.name}</h2></div>
          <span class="shrink-0 rounded-full bg-selected px-2 py-1 text-xs font-semibold text-primary">{kindLabel}</span>
        </header>
        <dl class="grid min-h-0 flex-1 grid-cols-2 content-start gap-1.5">
          {#if typeLabel}<div class="metadata-item"><dt>{card.kind === 'monster' ? 'Type' : card.kind === 'magic' ? 'Magic class' : 'Trap range'}</dt><dd>{typeLabel}</dd></div>{/if}
          {#if card.attribute}<div class="metadata-item"><dt>Attribute</dt><dd>{card.attribute}</dd></div>{/if}
          {#if card.level !== null}<div class="metadata-item"><dt>Level</dt><dd class="number">{card.level}</dd></div>{/if}
          {#if card.atk !== null}<div class="metadata-item"><dt>ATK</dt><dd class="number">{card.atk}</dd></div>{/if}
          {#if card.def !== null}<div class="metadata-item"><dt>DEF</dt><dd class="number">{card.def}</dd></div>{/if}
          {#if card.deckCost !== null}<div class="metadata-item"><dt>Deck cost</dt><dd class="number">{card.deckCost}</dd></div>{/if}
          {#if card.password}<div class="metadata-item col-span-2"><dt>Password</dt><dd class="number tracking-wider">{card.password}</dd></div>{/if}
          {#if card.effectText}<div class="metadata-item col-span-2"><dt>Effect</dt><dd class="line-clamp-2 whitespace-normal">{card.effectText}</dd></div>{/if}
        </dl>
      </div>
    </div>
  </div>
</div>
<style>
  .card-tile { display: block; width: 100%; height: 15.5rem; min-width: 0; overflow: hidden; cursor: pointer; text-align: left; }
  .card-tile:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 25%, transparent); }
  .flip-scene { width: 100%; height: 100%; perspective: 1100px; }
  .flip-rotor { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 340ms cubic-bezier(.2, .72, .24, 1); }
  .flip-scene.flipped .flip-rotor { transform: rotateY(180deg); }
  .flip-face { position: absolute; inset: 0; overflow: hidden; backface-visibility: hidden; }
  .flip-front { display: flex; flex-direction: column; }
  .flip-front :global(.card-artwork) { flex: 1; min-height: 0; aspect-ratio: auto; }
  .flip-front h2 { min-height: 2.9rem; }
  .flip-back { transform: rotateY(180deg); }
  .metadata-item { min-width: 0; overflow: hidden; border-radius: .375rem; background: var(--elevated); padding: .3rem .45rem; }
  .metadata-item dt { color: var(--muted-foreground); font-size: .625rem; line-height: 1.2; }
  .metadata-item dd { margin: .15rem 0 0; overflow: hidden; overflow-wrap: anywhere; font-size: .75rem; line-height: 1.2; font-weight: 600; text-overflow: ellipsis; }
  @media (prefers-reduced-motion: reduce) { .flip-rotor, .card-tile { transition: none; } }
</style>
