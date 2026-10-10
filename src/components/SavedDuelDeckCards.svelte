<script lang="ts">
  import { onMount } from 'svelte';
  import CardArtwork from './cards/CardArtwork.svelte';
  import { filterCards, type BrowserCard } from '../lib/dotr/browser';
  import type { FusionOccurrence, FusionZone } from '../lib/dotr/fusion-discovery';
  import { DECK_STORAGE_KEY, validateDeckEnvelope, type DeckRecord } from '../features/decks/model';
  import { canAddSavedDeckCopy, savedDeckCopyCounts } from '../features/duel/duel-deck-selection';

  let {
    cards,
    occurrences,
    handCount,
    fieldCount,
    onadd,
  }: {
    cards: BrowserCard[];
    occurrences: FusionOccurrence[];
    handCount: number;
    fieldCount: number;
    onadd: (cardId: number, zone: FusionZone) => void;
  } = $props();

  let savedDecks = $state<DeckRecord[]>([]);
  let selectedDeckId = $state('');
  let deckSearch = $state('');
  let storageWarning = $state('');
  let ready = $state(false);

  const selectedDeck = $derived(savedDecks.find((deck) => deck.id === selectedDeckId));
  const copyCounts = $derived(savedDeckCopyCounts(selectedDeck));
  const cardById = $derived(new Map(cards.map((card) => [card.id, card])));
  const deckCards = $derived.by(() => {
    const matching = new Set(
      filterCards(cards, {
        query: deckSearch,
        kind: '',
        monsterType: '',
        attribute: '',
      }).map((card) => card.id),
    );
    return [...copyCounts.entries()]
      .filter(([id]) => matching.has(id))
      .map(([id, count]) => ({ id, count, card: cardById.get(id)! }))
      .sort((a, b) => a.card.name.localeCompare(b.card.name));
  });

  function refreshDecks() {
    try {
      const raw = localStorage.getItem(DECK_STORAGE_KEY);
      savedDecks = raw
        ? validateDeckEnvelope(JSON.parse(raw), new Set(cards.map((card) => card.id))).decks
        : [];
      if (!savedDecks.some((deck) => deck.id === selectedDeckId)) {
        const requested = new URLSearchParams(window.location.search).get('deck');
        selectedDeckId = savedDecks.some((deck) => deck.id === requested) ? requested! : '';
      }
      storageWarning = '';
    } catch (error) {
      savedDecks = [];
      selectedDeckId = '';
      storageWarning =
        'Saved decks could not be read. Your current Hand and Field were not changed: ' +
        (error instanceof Error ? error.message : 'Browser storage unavailable.');
    }
    ready = true;
  }

  onMount(refreshDecks);
</script>

<div class="mt-3 rounded-md border border-border bg-elevated p-3" aria-label="Choose cards from a saved deck">
  <div class="flex flex-wrap items-baseline justify-between gap-2">
    <h3 class="text-sm font-semibold">Cards from a saved deck</h3>
    <span class="text-xs text-muted-foreground">Optional · read-only lookup</span>
  </div>
  <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
    Select your current deck, then add only cards you actually see in PCSX2.
    Choosing or switching decks never fills or clears Hand/Field.
  </p>

  {#if storageWarning}
    <p class="warning-note mt-2" role="alert">{storageWarning}</p>
  {/if}

  <div class="mt-3 flex flex-wrap items-end gap-2">
    <label class="min-w-0 flex-1 text-xs font-semibold text-muted-foreground">
      Playing with deck
      <select
        class="native-filter mt-1 block w-full"
        aria-label="Playing with saved deck"
        bind:value={selectedDeckId}
        disabled={!savedDecks.length}
      >
        <option value="">Choose a saved deck…</option>
        {#each savedDecks as deck (deck.id)}
          <option value={deck.id}>{deck.name} · {deck.cardIds.length}/40</option>
        {/each}
      </select>
    </label>
    <button
      type="button"
      class="control-button"
      onclick={refreshDecks}
      aria-label="Refresh saved decks"
    >Refresh decks</button>
  </div>

  {#if selectedDeck}
    {#if selectedDeck.cardIds.length !== 40}
      <p class="mt-2 text-xs text-warning">
        This saved deck has {selectedDeck.cardIds.length} cards, not 40. Its entries are
        still available for manual lookup.
      </p>
    {/if}
    <label class="mt-3 block text-xs font-semibold text-muted-foreground">
      Search cards in this deck
      <input
        type="search"
        class="native-filter mt-1 block w-full"
        bind:value={deckSearch}
        placeholder="Card name or DotR ID…"
        autocomplete="off"
      />
    </label>
    <p class="mt-2 text-xs text-muted-foreground" role="status">
      {deckCards.length} matching {deckCards.length === 1 ? 'card' : 'cards'} ·
      counts include cards already entered through the full catalog.
    </p>
    <ul class="mt-2 grid max-h-64 list-none gap-1 overflow-y-auto p-0" aria-label="Saved deck cards">
      {#each deckCards as entry (entry.id)}
        {@const entered = occurrences.filter((item) => item.cardId === entry.id).length}
        {@const canAdd = canAddSavedDeckCopy(entry.id, copyCounts, occurrences)}
        <li class="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-border bg-surface p-2">
          <div class="w-10 shrink-0 overflow-hidden rounded-sm">
            <CardArtwork
              image={entry.card.image}
              name={entry.card.name}
              cardId={entry.card.id}
              decorative
            />
          </div>
          <div class="min-w-0 flex-1 text-xs">
            <strong class="block break-words">{entry.card.name}</strong>
            <span class="text-muted-foreground">
              #{String(entry.id).padStart(3, '0')} · {entered}/{entry.count} selected
            </span>
          </div>
          <div class="flex flex-wrap gap-1">
            <button
              type="button"
              class="control-button"
              aria-label={'Add ' + entry.card.name + ' from saved deck to Hand'}
              disabled={!canAdd || handCount >= 5}
              onclick={() => onadd(entry.id, 'hand')}
            >+ Hand</button>
            <button
              type="button"
              class="control-button"
              aria-label={'Add ' + entry.card.name + ' from saved deck to Field'}
              disabled={!canAdd || fieldCount >= 8}
              onclick={() => onadd(entry.id, 'summoning')}
            >+ Field</button>
          </div>
        </li>
      {/each}
    </ul>
    {#if !deckCards.length}
      <p class="mt-2 text-xs text-muted-foreground">No cards in this deck match your search.</p>
    {/if}
  {:else if ready && !savedDecks.length}
    <p class="mt-2 text-xs text-muted-foreground">
      No saved decks found. <a href="/decks/" class="text-link">Create or import one in Deck Workshop</a>.
    </p>
  {:else if ready}
    <p class="mt-2 text-xs text-muted-foreground">
      Select a deck to browse its cards, or use the full catalog below.
    </p>
  {/if}

  <p class="mt-2 text-xs text-muted-foreground">
    Need another card, such as a generated Fusion result? Use the Hand/Field
    full-catalog pickers below. No saved deck or Collection is modified.
  </p>
</div>
