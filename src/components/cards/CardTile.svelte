<script lang="ts">
  import type { BrowserCard } from '../../lib/dotr/browser';
  import CardInfoTile from './CardInfoTile.svelte';
  let { card }: { card: BrowserCard } = $props();
</script>

<CardInfoTile {card} />
