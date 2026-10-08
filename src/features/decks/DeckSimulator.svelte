<script lang="ts">
  import { onMount } from 'svelte';
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import FusionAdvisor from '../fusion/FusionAdvisor.svelte';
  import { DECK_STORAGE_KEY, validateDeckEnvelope, type DeckRecord } from '../decks/model';
  import {
    drawToFive,
    handLink,
    setAsideHandCard,
    shuffledDeck,
    type PracticeSession,
  } from '../../lib/dotr/deck-simulation';
  import { createFusionDiscovery, type FusionOccurrence } from '../../lib/dotr/fusion-discovery';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import type { Card, FusionData } from '../../lib/dotr/model';

  let {
    cards,
    canonicalCards,
    fusionData,
  }: {
    cards: BrowserCard[];
    canonicalCards: Card[];
    fusionData: FusionData;
  } = $props();

  function createIslandData() {
    return {
      discover: createFusionDiscovery(canonicalCards, fusionData),
      cardById: new Map(cards.map((card) => [card.id, card])),
    };
  }
  const { discover, cardById } = createIslandData();

  let decks = $state<DeckRecord[]>([]);
  let selectedDeckId = $state('');
  let session = $state<PracticeSession | null>(null);
  let sessionDeckName = $state('');
  let sessionDeckId = $state('');
  let ready = $state(false);
  let storageWarning = $state('');
  let notice = $state('');
  const selectedDeck = $derived(decks.find((deck) => deck.id === selectedDeckId));
  const hand = $derived(session?.hand ?? []);
  const handInputs = $derived<FusionOccurrence[]>(
    hand.map((entry) => ({ instanceId: entry.instanceId, cardId: entry.cardId, zone: 'hand' })),
  );
  const labels = $derived(
    new Map(handInputs.map((entry, index) => [entry.instanceId, 'Hand ' + (index + 1)] as const)),
  );
  const discovery = $derived(discover(handInputs));
  const fusionHref = $derived(hand.length ? handLink(hand.map((entry) => entry.cardId), 'simulator') : '');

  function refreshDecks() {
    try {
      const raw = localStorage.getItem(DECK_STORAGE_KEY);
      decks = raw ? validateDeckEnvelope(JSON.parse(raw), new Set(cardById.keys())).decks : [];
      if (!decks.some((deck) => deck.id === selectedDeckId))
        selectedDeckId = decks.at(-1)?.id ?? '';
      storageWarning = '';
    } catch (error) {
      decks = [];
      selectedDeckId = '';
      storageWarning =
        'Saved decks could not be read. No data was changed: ' +
        (error instanceof Error ? error.message : 'Unknown error.');
    }
    ready = true;
  }

  onMount(() => {
    refreshDecks();
    const requested = new URLSearchParams(window.location.search).get('deck');
    if (requested && decks.some((deck) => deck.id === requested)) selectedDeckId = requested;
  });

  function start() {
    if (!selectedDeck || selectedDeck.cardIds.length !== 40) {
      notice = 'Select a deck with exactly 40 cards before starting a practice draw.';
      return;
    }
    session = drawToFive(
      { drawPile: shuffledDeck(selectedDeck.cardIds), hand: [], setAside: [] },
      () => crypto.randomUUID(),
    );
    sessionDeckName = selectedDeck.name;
    sessionDeckId = selectedDeck.id;
    notice = 'New 40-card practice deck shuffled. Five cards drawn without replacement.';
  }

  function draw() {
    if (!session || session.hand.length >= 5 || !session.drawPile.length) return;
    const next = drawToFive(session, () => crypto.randomUUID());
    const count = next.hand.length - session.hand.length;
    session = next;
    notice = count + (count === 1 ? ' card' : ' cards') + ' drawn from the remaining pile.';
  }

  function aside(instanceId: string) {
    if (!session) return;
    session = setAsideHandCard(session, instanceId);
    notice =
      'Selected copy set aside for practice. You can draw another card into the open Hand slot.';
  }

  function stop() {
    session = null;
    sessionDeckName = '';
    sessionDeckId = '';
    notice = 'Practice session cleared. Your saved deck and collection are unchanged.';
  }
</script>

<section aria-label="Deck simulator">
  <header class="page-header">
    <div>
      <h1 class="page-title">Deck Simulator</h1>
      <p class="page-description">
        Shuffle a saved 40-card deck, practice five-card draws, and explore possible fusion plays.
      </p>
    </div>
    <a class="text-link text-sm" href="/decks/">Manage decks →</a>
  </header>

  {#if storageWarning}<p class="warning-note" role="alert">{storageWarning}</p>{/if}
  {#if notice}<p class="mb-3 text-sm text-muted-foreground" role="status">{notice}</p>{/if}
  <div class="rounded-lg border border-border bg-surface p-4">
    <div class="flex flex-wrap items-end gap-3">
      <label class="min-w-0 flex-1 text-xs font-semibold">
        Saved deck
        <select class="native-filter mt-1 block w-full" bind:value={selectedDeckId}>
          {#each decks as deck (deck.id)}
            <option value={deck.id}>{deck.name} · {deck.cardIds.length}/40</option>
          {/each}
        </select>
      </label>
      <button type="button" class="control-button" onclick={refreshDecks}>Refresh decks</button>
      <button
        type="button"
        class="primary-action"
        disabled={!selectedDeck || selectedDeck.cardIds.length !== 40}
        onclick={start}>{session ? 'Shuffle & start over' : 'Shuffle & draw 5'}</button
      >
    </div>
    {#if ready && !decks.length}
      <p class="mb-0 mt-3 text-sm text-muted-foreground">
        No saved decks found. <a class="text-link" href="/decks/">Create one in Deck Builder</a>.
      </p>
    {:else if selectedDeck && selectedDeck.cardIds.length !== 40}
      <p class="mb-0 mt-3 text-sm text-warning">
        This deck contains {selectedDeck.cardIds.length} cards. The practice draw requires exactly 40;
        adjust it in <a class="text-link" href="/collection/">Collection & Reserve</a>. Nothing will
        be removed automatically.
      </p>
    {:else}
      <p class="mb-0 mt-3 text-xs text-muted-foreground">
        Practice only: not a reconstruction of the game's shuffle, turn sequence, or official Hand
        replenishment rules. Saved decks and owned cards are never modified.
      </p>
    {/if}
  </div>

  {#if session}
    <div class="my-4 rounded-lg border border-border bg-surface p-4">
      <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="m-0 text-base font-semibold">Current practice draw</h2>
          <p class="mb-0 mt-1 text-xs text-muted-foreground">
            Using: {sessionDeckName}
            {#if sessionDeckId !== selectedDeckId}
              · Selected deck changed; press Shuffle & start over to use it
            {/if}
          </p>
        </div>
        <button type="button" class="control-button" onclick={stop}>End practice</button>
      </div>
      <div class="mb-4 grid grid-cols-3 gap-2">
        <div class="stat"><strong>{session.drawPile.length}</strong><span>Draw pile</span></div>
        <div class="stat"><strong>{hand.length} / 5</strong><span>Hand</span></div>
        <div class="stat"><strong>{session.setAside.length}</strong><span>Set aside</span></div>
      </div>
      <div class="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h3 class="m-0 text-sm font-semibold">Your Hand</h3>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="control-button"
            disabled={!session.drawPile.length || hand.length >= 5}
            onclick={draw}>Draw to 5</button
          >
          <a
            class="primary-action"
            class:disabled={!hand.length}
            aria-disabled={!hand.length}
            href={hand.length ? fusionHref : undefined}>Open Hand in Fusion →</a
          >
        </div>
      </div>
      {#if hand.length}
        <ol class="hand-grid">
          {#each hand as entry, index (entry.instanceId)}
            {@const card = cardById.get(entry.cardId)!}
            <li class="hand-card">
              <div class="hand-artwork">
                <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
              </div>
              <div class="min-w-0">
                <p class="m-0 text-xs font-semibold">{index + 1}. {card.name}</p>
                <p class="m-0 text-xs text-muted-foreground">
                  #{String(card.id).padStart(3, '0')} · ATK {card.atk ?? 'unknown'}
                </p>
              </div>
              <button
                type="button"
                class="control-button mt-auto w-full"
                aria-label={'Set aside ' + card.name + ' from Hand'}
                onclick={() => aside(entry.instanceId)}>Set aside</button
              >
            </li>
          {/each}
        </ol>
      {:else}
        <p class="text-sm text-muted-foreground">
          Hand is empty. Draw from the remaining pile or start a new shuffle.
        </p>
      {/if}
    </div>
    {#if hand.length >= 2}
      <FusionAdvisor {discovery} {cardById} {labels} inputCount={hand.length} />
      <p class="mt-2 text-xs text-muted-foreground">
        Want to apply a suggested fusion? Open this Hand in Fusion and use
        <strong>Summon result</strong>. Doing so will not alter this practice pile.
      </p>
    {/if}
  {:else if ready && decks.length}
    <p class="mt-4 text-sm text-muted-foreground">
      Choose a 40-card deck and press <strong>Shuffle & draw 5</strong> to begin.
    </p>
  {/if}
</section>

<style>
  .stat {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
    border-radius: var(--radius);
    background: var(--elevated);
    padding: 0.6rem 0.8rem;
  }
  .stat strong {
    font-size: 1.2rem;
    font-variant-numeric: tabular-nums;
  }
  .stat span {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .primary-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 0.45rem 0.7rem;
    border: 1px solid var(--primary);
    border-radius: var(--radius);
    background: var(--primary);
    color: var(--primary-foreground);
    font-size: 0.8125rem;
    font-weight: 650;
    text-decoration: none;
    cursor: pointer;
  }
  .primary-action:hover:not(:disabled) {
    filter: brightness(0.94);
  }
  .primary-action:disabled,
  .primary-action.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  .hand-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.65rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .hand-card {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.5rem;
  }
  .hand-artwork {
    width: min(100%, 8rem);
    align-self: center;
  }
  .hand-artwork :global(.card-artwork) {
    width: 100%;
    border-radius: 4px;
  }
  @media (max-width: 800px) {
    .hand-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 450px) {
    .hand-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
