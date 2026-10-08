<script lang="ts">
  import CardPicker from './CardPicker.svelte';
  import type { BrowserCard } from '../../lib/dotr/browser';
  let { cards }: { cards: BrowserCard[] } = $props();
  function openDetail(cardId: number) { window.location.assign('/cards/' + String(cardId).padStart(3, '0') + '/'); }
</script>
<CardPicker {cards} label="Quick lookup" onselect={openDetail} />
