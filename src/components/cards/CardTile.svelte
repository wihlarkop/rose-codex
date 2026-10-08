<script lang="ts">
  import type { BrowserCard } from '../../lib/dotr/browser';
  import CardFlipTile from './CardFlipTile.svelte';
  let { card, flipped = $bindable(false), onflip }: { card: BrowserCard; flipped?: boolean; onflip?: (cardId: number, next: boolean) => void } = $props();
</script>

<CardFlipTile {card} bind:flipped {onflip} />
