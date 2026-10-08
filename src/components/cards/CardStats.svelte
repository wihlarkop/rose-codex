<script lang="ts">
  import type { BrowserCard } from '../../lib/dotr/browser';
  let { card }: { card: BrowserCard } = $props();
</script>
{#if card.kind === 'monster'}
<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[0.8125rem] number">
  {#if card.atk !== null}
    <span><span class="text-xs text-muted-foreground">ATK</span> {card.atk}</span>
    <span><span class="text-[0.6875rem] text-muted-foreground">DEF</span> {card.def}</span>
  {:else}<span class="text-muted-foreground">Stats unknown</span>{/if}
</div>
{/if}
