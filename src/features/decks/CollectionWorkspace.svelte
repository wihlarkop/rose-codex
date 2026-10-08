<script lang="ts">
  import { onMount } from 'svelte';
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import { filterCards, type BrowserCard } from '../../lib/dotr/browser';
  import { DECK_STORAGE_KEY, validateDeckEnvelope, type DeckRecord } from './model';
  import {
    COLLECTION_STORAGE_KEY,
    collectionFromDecks,
    countCopies,
    maxRequiredCopies,
    validateCollection,
    type CollectionEnvelope,
  } from './collection';

  let { cards }: { cards: BrowserCard[] } = $props();
  const cardById = $derived(new Map(cards.map((card) => [card.id, card])));
  const allowedIds = $derived(new Set(cardById.keys()));
  let decks = $state<DeckRecord[]>([]);
  let collection = $state<CollectionEnvelope>({ schemaVersion: 1, owned: {} });
  let activeId = $state('');
  let query = $state('');
  let addSearch = $state('');
  let view = $state('all');
  let ready = $state(false);
  let blocked = $state(false);
  let warning = $state('');
  let notice = $state('');
  let deckSnapshot = '';
  let collectionSnapshot: string | null = null;

  const active = $derived(decks.find((deck) => deck.id === activeId));
  const activeCounts = $derived(countCopies(active?.cardIds ?? []));
  const requiredCounts = $derived(maxRequiredCopies(decks));
  const ownedTotal = $derived(Object.values(collection.owned).reduce((sum, n) => sum + n, 0));
  const reserveTotal = $derived.by(() => {
    let total = 0;
    for (const [key, owned] of Object.entries(collection.owned))
      total += Math.max(0, owned - (activeCounts.get(Number(key)) ?? 0));
    return total;
  });
  const deficitTotal = $derived.by(() => {
    let total = 0;
    for (const [id, count] of activeCounts)
      total += Math.max(0, count - (collection.owned[String(id)] ?? 0));
    return total;
  });
  const rows = $derived.by(() => {
    const known = new Set<number>([
      ...Object.keys(collection.owned).map(Number),
      ...activeCounts.keys(),
    ]);
    const items = [...known].map((id) => ({
      id,
      card: cardById.get(id),
      owned: collection.owned[String(id)] ?? 0,
      inDeck: activeCounts.get(id) ?? 0,
      reserve: Math.max(0, (collection.owned[String(id)] ?? 0) - (activeCounts.get(id) ?? 0)),
    }));
    const matching = filterCards(
      items.flatMap((item) => (item.card ? [item.card] : [])),
      { query, kind: '', monsterType: '', attribute: '' },
    );
    const allowed = new Set(matching.map((card) => card.id));
    return items
      .filter((item) => allowed.has(item.id))
      .filter((item) =>
        view === 'reserve' ? item.reserve > 0 : view === 'deck' ? item.inDeck > 0 : true,
      )
      .sort((a, b) => (a.card?.name ?? '').localeCompare(b.card?.name ?? ''));
  });
  const addMatches = $derived(
    addSearch.trim()
      ? filterCards(cards, { query: addSearch, kind: '', monsterType: '', attribute: '' }).slice(
          0,
          8,
        )
      : [],
  );

  onMount(() => {
    try {
      const rawDecks = localStorage.getItem(DECK_STORAGE_KEY);
      deckSnapshot = rawDecks ?? '';
      decks = rawDecks ? validateDeckEnvelope(JSON.parse(rawDecks), allowedIds).decks : [];
      activeId = decks.at(-1)?.id ?? '';
      collectionSnapshot = localStorage.getItem(COLLECTION_STORAGE_KEY);
      collection =
        collectionSnapshot === null
          ? collectionFromDecks(decks)
          : validateCollection(JSON.parse(collectionSnapshot), allowedIds);
      if (collectionSnapshot === null && decks.length)
        notice =
          'Your owned cards are initialized from the maximum copies in your saved deck presets. Review and correct this estimate if needed.';
    } catch (error) {
      blocked = true;
      warning =
        'Saved deck or collection data could not be read safely. Nothing was overwritten: ' +
        (error instanceof Error ? error.message : 'Unknown error');
    }
    ready = true;
  });

  function stillCurrent() {
    try {
      if (
        (localStorage.getItem(DECK_STORAGE_KEY) ?? '') !== deckSnapshot ||
        localStorage.getItem(COLLECTION_STORAGE_KEY) !== collectionSnapshot
      ) {
        warning =
          'Saved data changed in another tab. Refresh Collection before editing to avoid overwriting newer changes.';
        return false;
      }
      return true;
    } catch {
      warning = 'Browser storage cannot be read. Your saved cards were not modified.';
      return false;
    }
  }

  function persistCollection(next: CollectionEnvelope): boolean {
    if (!ready || blocked || !stillCurrent()) return false;
    try {
      const raw = JSON.stringify(next);
      localStorage.setItem(COLLECTION_STORAGE_KEY, raw);
      collectionSnapshot = raw;
      collection = next;
      warning = '';
      return true;
    } catch {
      warning =
        'Collection could not be saved. No inventory change was applied. Check browser storage or export a backup.';
      return false;
    }
  }

  function changeOwned(id: number, delta: number) {
    if (blocked || !cardById.has(id)) return;
    const current = collection.owned[String(id)] ?? 0;
    const nextCount = current + delta;
    if (
      nextCount < (requiredCounts.get(id) ?? 0) ||
      nextCount < 0 ||
      !Number.isSafeInteger(nextCount)
    ) {
      notice =
        'Cannot remove an owned copy still required by a saved deck. Move it out of the deck first.';
      return;
    }
    const owned = { ...collection.owned };
    if (nextCount) owned[String(id)] = nextCount;
    else delete owned[String(id)];
    if (persistCollection({ schemaVersion: 1, owned }))
      notice = (cardById.get(id)?.name ?? 'Card') + ' owned count updated to ' + nextCount + '.';
  }

  function transfer(id: number, direction: 'reserve' | 'deck') {
    if (!active || blocked || !ready || !stillCurrent()) return;
    if (direction === 'reserve' && !active.cardIds.includes(id)) return;
    if (direction === 'deck') {
      if (active.cardIds.length >= 40) {
        notice =
          'This deck already has 40 or more cards. Move a card to reserve before adding another.';
        return;
      }
      if ((collection.owned[String(id)] ?? 0) <= (activeCounts.get(id) ?? 0)) return;
    }
    // Store the bootstrap inventory before changing the legacy deck; otherwise
    // removing one of the original 43 cards would make it disappear on reload.
    if (collectionSnapshot === null && !persistCollection(collection)) return;
    const nextIds = [...active.cardIds];
    if (direction === 'reserve') nextIds.splice(nextIds.lastIndexOf(id), 1);
    else nextIds.push(id);
    const updated = decks.map((deck) =>
      deck.id === active.id ? { ...deck, cardIds: nextIds } : deck,
    );
    try {
      const raw = JSON.stringify({ schemaVersion: 1, decks: updated });
      localStorage.setItem(DECK_STORAGE_KEY, raw);
      deckSnapshot = raw;
      decks = updated;
      warning = '';
      notice =
        (cardById.get(id)?.name ?? 'Card') +
        (direction === 'reserve'
          ? ' moved to reserve. Your owned copy is preserved.'
          : ' added to the active deck.');
    } catch {
      warning =
        'Deck update could not be saved. Your deck was left unchanged and the owned collection was preserved.';
    }
  }

  function exportCollection() {
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'rose-codex-collection.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }
</script>

<section aria-label="Card collection">
  <header class="page-header">
    <div>
      <h1 class="page-title">My Collection</h1>
      <p class="page-description">
        Track cards you own, choose 40 for a duel, and keep the rest in reserve.
      </p>
    </div>
    <a href="/decks/" class="text-link text-sm">Edit deck details →</a>
  </header>
  {#if !ready}
    <p>Loading your saved decks and collection…</p>
  {:else if blocked}
    <p class="warning-note" role="alert">{warning}</p>
  {:else}
    {#if warning}<p class="warning-note" role="alert">{warning}</p>{/if}
    {#if notice}<p class="text-sm text-muted-foreground" role="status">{notice}</p>{/if}
    <div class="summary-grid">
      <div class="surface summary-box">
        <strong>{ownedTotal}</strong><span>Total owned copies</span>
      </div>
      <div class="surface summary-box">
        <strong>{active?.cardIds.length ?? 0} / 40</strong><span>Selected duel deck</span>
      </div>
      <div class="surface summary-box">
        <strong>{reserveTotal}</strong><span>Reserve copies</span>
      </div>
    </div>
    <div class="surface section-box">
      <div class="deck-heading">
        <label for="collection-deck">Selected deck for duel</label>
        <select id="collection-deck" bind:value={activeId}>
          {#each decks as deck (deck.id)}
            <option value={deck.id}>{deck.name} · {deck.cardIds.length}/40</option>
          {/each}
        </select>
        {#if !decks.length}<a href="/decks/" class="text-link">Create a deck first</a>{/if}
      </div>
      {#if active && active.cardIds.length > 40}
        <p class="warning-note">
          {active.cardIds.length - 40} cards over the 40-card target. Nothing was removed automatically.
          Choose which cards to move to reserve below.
        </p>
      {:else if active?.cardIds.length === 40}
        <p class="text-sm text-muted-foreground">
          40-card target reached. You can swap a card by moving one to reserve first.
        </p>
      {/if}
      {#if deficitTotal}
        <p class="warning-note">
          {deficitTotal} copies in this deck exceed recorded ownership. Adjust owned counts to match your
          real in-game collection.
        </p>
      {/if}
      <p class="helper">
        Decks are alternative saved setups; the same owned card may appear in several presets.
        Reserve means owned copies not used by the currently selected deck. Changes here preserve
        the existing deck data format.
      </p>
    </div>
    <section class="surface section-box" aria-label="Add owned cards">
      <h2>Add cards earned after duels</h2>
      <p class="helper">
        Search by card name or ID and add each actual copy you obtained. New cards go to reserve
        until you choose to use them.
      </p>
      <input
        class="search-input"
        aria-label="Find a card to add to my collection"
        placeholder="Search card name or ID…"
        type="search"
        bind:value={addSearch}
      />
      {#if addSearch.trim() && !addMatches.length}
        <p class="helper">No matching cards. Try a different name or ID.</p>
      {/if}
      {#if addMatches.length}
        <ul class="card-rows">
          {#each addMatches as card (card.id)}
            <li class="card-row">
              <div class="artwork">
                <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
              </div>
              <span class="card-name"
                >{card.name} <small>#{String(card.id).padStart(3, '0')}</small></span
              >
              <span class="muted-count">{collection.owned[String(card.id)] ?? 0} owned</span>
              <button class="collection-button" onclick={() => changeOwned(card.id, 1)}
                >+ Owned</button
              >
            </li>
          {/each}
        </ul>
      {/if}
    </section>
    <section class="section-box" aria-label="Owned card inventory">
      <div class="list-heading">
        <h2>Owned cards</h2>
        <button class="collection-button" onclick={exportCollection}>Export collection JSON</button>
      </div>
      <div class="filters">
        <label
          >Show
          <select bind:value={view}>
            <option value="all">All owned</option>
            <option value="deck">In selected deck</option>
            <option value="reserve">In reserve</option>
          </select>
        </label>
        <label
          >Find a card
          <input type="search" placeholder="Name or ID" bind:value={query} />
        </label>
      </div>
      {#if rows.length}
        <ul class="card-rows">
          {#each rows as row (row.id)}
            <li class="card-row surface">
              <div class="artwork">
                {#if row.card}
                  <CardArtwork
                    image={row.card.image}
                    name={row.card.name}
                    cardId={row.id}
                    decorative
                  />
                {/if}
              </div>
              <span class="card-name"
                >{row.card?.name ?? 'Unknown card'}
                <small>#{String(row.id).padStart(3, '0')}</small>
              </span>
              <div class="copies">
                <span>{row.owned} owned</span>
                <span>{row.inDeck} deck · {row.reserve} reserve</span>
              </div>
              <div class="actions">
                <button
                  class="collection-button"
                  disabled={!row.inDeck || !active}
                  aria-label={'Move one ' + row.card?.name + ' from deck to reserve'}
                  onclick={() => transfer(row.id, 'reserve')}>To reserve</button
                >
                <button
                  class="collection-button"
                  disabled={!active || !row.reserve || active.cardIds.length >= 40}
                  aria-label={'Add one ' + row.card?.name + ' from reserve to deck'}
                  onclick={() => transfer(row.id, 'deck')}>To deck</button
                >
                <button
                  class="collection-button"
                  disabled={row.owned <= (requiredCounts.get(row.id) ?? 0)}
                  aria-label={'Remove one owned ' + row.card?.name}
                  onclick={() => changeOwned(row.id, -1)}>− Owned</button
                >
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="helper">No cards in this view. Add earned cards above, or change the filters.</p>
      {/if}
    </section>
  {/if}
</section>

<style>
  .surface {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .summary-box {
    display: grid;
    gap: 0.2rem;
    padding: 1rem;
  }
  .summary-box strong {
    font-size: 1.4rem;
    font-variant-numeric: tabular-nums;
  }
  .summary-box span,
  .helper {
    font-size: 0.8125rem;
    color: var(--muted-foreground);
  }
  .helper {
    line-height: 1.5;
    margin: 0.5rem 0 0;
  }
  .section-box {
    padding: 1rem;
    margin-bottom: 1rem;
    min-width: 0;
  }
  .section-box h2 {
    font-size: 1rem;
    margin: 0 0 0.4rem;
  }
  .deck-heading,
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.65rem;
  }
  .deck-heading label,
  .filters label {
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .deck-heading select,
  .filters select,
  .filters input,
  .search-input {
    min-width: 0;
    padding: 0.55rem 0.65rem;
    background: var(--elevated);
    color: var(--foreground);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 0.875rem;
  }
  .deck-heading select {
    max-width: 100%;
    width: min(30rem, 100%);
  }
  .filters label {
    display: grid;
    gap: 0.3rem;
    flex: 1;
    min-width: 12rem;
  }
  .search-input {
    display: block;
    width: 100%;
    margin-top: 0.75rem;
  }
  .list-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .list-heading h2 {
    margin: 0;
  }
  .card-rows {
    display: grid;
    gap: 0.4rem;
    list-style: none;
    margin: 0.75rem 0 0;
    padding: 0;
  }
  .card-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem;
    padding: 0.55rem 0.7rem;
    min-width: 0;
  }
  .artwork {
    width: 3rem;
    flex: 0 0 3rem;
  }
  .artwork :global(.card-artwork) {
    width: 3rem;
    height: 2.4rem;
    border-radius: 4px;
  }
  .card-name {
    display: grid;
    flex: 1;
    min-width: 7rem;
    font-size: 0.875rem;
    font-weight: 600;
  }
  .card-name small,
  .muted-count,
  .copies {
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  .copies {
    display: grid;
    min-width: 6.5rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-left: auto;
  }
  .collection-button {
    padding: 0.4rem 0.6rem;
    min-height: 2rem;
    font-size: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--foreground);
  }
  .collection-button:hover:not(:disabled) {
    border-color: var(--primary);
    background: var(--selected);
  }
  .collection-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
  @media (max-width: 600px) {
    .summary-grid {
      gap: 0.4rem;
    }
    .summary-box {
      padding: 0.6rem;
    }
    .summary-box strong {
      font-size: 1rem;
    }
    .card-name {
      min-width: 50%;
    }
    .actions {
      flex-basis: 100%;
    }
  }
</style>
