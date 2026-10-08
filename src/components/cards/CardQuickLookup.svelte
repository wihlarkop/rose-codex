<script lang="ts">
  import CardPicker from './CardPicker.svelte';
  import type { BrowserCard } from '../../lib/dotr/browser';
  let { cards, onselect, selectedCardId = null }: { cards: BrowserCard[]; onselect: (cardId: number) => void; selectedCardId?: number | null } = $props();
</script>
<CardPicker {cards} label="Quick lookup" {selectedCardId} {onselect} />
