<script lang="ts">
  import { onMount } from 'svelte';
  import { DECK_STORAGE_KEY, validateDeckEnvelope, type DeckRecord } from '../../features/decks/model';
  let { allowedCardIds }: { allowedCardIds: number[] } = $props();
  let decks = $state<DeckRecord[]>([]);
  let status = $state<'empty' | 'ready' | 'invalid'>('empty');

  onMount(() => {
    try {
      const raw = localStorage.getItem(DECK_STORAGE_KEY);
      if (!raw) return;
      decks = validateDeckEnvelope(JSON.parse(raw), new Set(allowedCardIds)).decks;
      status = decks.length ? 'ready' : 'empty';
    } catch {
      status = 'invalid';
    }
  });
</script>
<div class="continue-surface">
  {#if status === 'ready'}
    <div class="continue-text">
      <strong>{decks.length} saved {decks.length === 1 ? 'deck' : 'decks'}</strong>
      <p>Available in this browser. Open your workshop to keep building or practice with a completed deck.</p>
      <span class="deck-names">{decks.slice(0, 3).map(deck => deck.name).join(' · ')}</span>
    </div>
    <a class="continue-action" href="/decks/">Open Deck Workshop →</a>
  {:else if status === 'invalid'}
    <div class="continue-text">
      <strong>Saved decks need attention</strong>
      <p>Stored deck data could not be validated. Nothing was changed or overwritten.</p>
    </div>
    <a class="continue-action" href="/decks/">Review saved data →</a>
  {:else}
    <div class="continue-text">
      <strong>Your deck journey starts here.</strong>
      <p>No saved decks found in this browser. Create one, or import a deck backup when you are ready.</p>
    </div>
    <a class="continue-action" href="/decks/">Create a deck →</a>
  {/if}
</div>
<style>
  .continue-surface { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem;
    background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:1.15rem; }
  .continue-text { min-width:0; flex:1; }
  strong { display:block; font-size:.95rem; }
  p { max-width:75ch; margin:.25rem 0; color:var(--muted-foreground); font-size:.82rem; line-height:1.5; }
  .deck-names { display:block; color:var(--muted-foreground); font-size:.74rem; overflow-wrap:anywhere; }
  .continue-action { display:inline-block; text-decoration:none; color:var(--primary); font-size:.82rem; font-weight:700; }
  .continue-action:hover { text-decoration:underline; }
</style>
