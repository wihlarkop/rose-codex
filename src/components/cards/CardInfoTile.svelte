<script lang="ts">
  import type { BrowserCard } from '../../lib/dotr/browser';

  let {
    card,
    id,
    ownedCopies = null,
  }: {
    card: BrowserCard;
    id?: string;
    ownedCopies?: number | null;
  } = $props();

  const number = $derived(String(card.id).padStart(3, '0'));
  const kind = $derived(
    card.kind === 'monster'
      ? 'Monster'
      : card.kind === 'magic'
        ? 'Magic'
        : card.kind === 'trap'
          ? 'Trap'
          : 'Ritual',
  );
  const category = $derived(
    card.kind === 'monster'
      ? card.monsterType
      : card.kind === 'magic'
        ? card.magicClass === 'power-up'
          ? 'Power-up'
          : card.magicClass === 'normal'
            ? 'Normal magic'
            : null
        : card.kind === 'trap'
          ? card.trapRange === 'full'
            ? 'Full-range trap'
            : card.trapRange === 'limited'
              ? 'Limited-range trap'
              : null
          : null,
  );
</script>

<article
  id={id ?? 'library-card-' + number}
  tabindex="-1"
  aria-label={'Card ' + number + ': ' + card.name}
  class="flex h-full min-w-0 flex-col gap-3 rounded-[10px] border border-border bg-surface p-3.5 text-foreground transition-[border-color,background-color] duration-150 hover:border-primary hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
>
  <header class="flex min-w-0 items-start justify-between gap-2">
    <div class="min-w-0">
      <p class="m-0 text-[.6875rem] font-semibold tracking-[.09em] text-primary">DOTR · #{number}</p>
      <h2 class="mt-1 break-words text-[.95rem] leading-[1.3] font-semibold tracking-[-.015em]">{card.name}</h2>
    </div>
    {#if ownedCopies !== null && ownedCopies > 0}
      <span class="shrink-0 rounded-md border border-border bg-selected px-2 py-1 text-[.6875rem] font-semibold text-primary">
        Owned ×{ownedCopies}
      </span>
    {/if}
  </header>

  <div class="flex flex-wrap items-center gap-1.5 text-[.6875rem]">
    <span class="rounded-md bg-selected px-2 py-1 font-semibold text-primary">{kind}</span>
    {#if category}
      <span class="rounded-md bg-elevated px-2 py-1 text-muted-foreground">{category}</span>
    {/if}
    {#if card.attribute}
      <span class="rounded-md bg-elevated px-2 py-1 text-muted-foreground">{card.attribute}</span>
    {/if}
    {#if card.level !== null}
      <span class="rounded-md bg-elevated px-2 py-1 text-muted-foreground">Lv {card.level}</span>
    {/if}
  </div>

  <dl class="grid grid-cols-3 gap-1.5">
    {#if card.kind === 'monster'}
      <div class="rounded-md bg-elevated p-2">
        <dt class="text-[.625rem] text-muted-foreground">ATK</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums">{card.atk ?? '—'}</dd>
      </div>
      <div class="rounded-md bg-elevated p-2">
        <dt class="text-[.625rem] text-muted-foreground">DEF</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums">{card.def ?? '—'}</dd>
      </div>
    {/if}
    <div class="rounded-md bg-elevated p-2">
      <dt class="text-[.625rem] text-muted-foreground">Deck Cost</dt>
      <dd class="mt-1 text-sm font-semibold tabular-nums">{card.deckCost ?? '—'}</dd>
    </div>
  </dl>

  {#if card.password}
    <p class="text-[.6875rem] text-muted-foreground">Password: <span class="font-semibold tabular-nums text-foreground">{card.password}</span></p>
  {/if}
  {#if card.effectText}
    <details class="mt-auto text-xs">
      <summary class="cursor-pointer font-semibold text-primary">Effect information</summary>
      <p class="mt-2 break-words leading-relaxed text-muted-foreground">{card.effectText}</p>
    </details>
  {/if}
</article>
