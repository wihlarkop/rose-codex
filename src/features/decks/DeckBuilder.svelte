<script lang="ts">
  import { onMount } from 'svelte';
  import CardPicker from '../../components/cards/CardPicker.svelte';
  import CardFlipTile from '../../components/cards/CardFlipTile.svelte';
  import { Button } from '../../components/ui/button';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import {
    DECK_STORAGE_KEY,
    knownDeckCost,
    validateDeckEnvelope,
    type DeckEnvelope,
    type DeckRecord,
  } from './model';

  let { cards }: { cards: BrowserCard[] } = $props();
  const cardById = $derived(new Map(cards.map((card) => [card.id, card])));
  const allowedIds = $derived(new Set(cardById.keys()));
  const costs = $derived(new Map(cards.map((card) => [card.id, card.deckCost])));
  const emptyDeck = (): DeckRecord => ({ id: crypto.randomUUID(), name: 'New deck', cardIds: [] });
  const initialDeck = emptyDeck();
  let decks = $state<DeckRecord[]>([initialDeck]);
  let occurrenceIds = $state<Record<string, string[]>>({ [initialDeck.id]: [] });
  let activeId = $state(initialDeck.id);
  let status = $state('Your decks are stored in this browser only.');
  let storageBlocked = $state(false);
  let writeFailed = $state(false);
  let importText = $state('');
  let ready = false;
  const active = $derived(decks.find((deck) => deck.id === activeId) ?? decks[0]);
  const stats = $derived(active ? knownDeckCost(active.cardIds, costs) : { known: 0, unknown: 0 });
  const constructionNotes = $derived.by(() => {
    const notes: string[] = [];
    if (active?.cardIds.length !== 40)
      notes.push(`Main deck: ${active?.cardIds.length ?? 0} of 40 cards.`);
    const counts = new Map<number, number>();
    for (const id of active?.cardIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
    if ([...counts.values()].some((count) => count > 3))
      notes.push('One or more cards exceed the three-copy limit.');
    if (stats.unknown)
      notes.push(`${stats.unknown} card cost${stats.unknown === 1 ? ' is' : 's are'} unknown.`);
    return notes;
  });
  const kinds = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const id of active?.cardIds ?? []) {
      const card = cardById.get(id);
      if (card) counts.set(card.kind, (counts.get(card.kind) ?? 0) + 1);
    }
    return [...counts.entries()];
  });
  const monsterTypes = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const id of active?.cardIds ?? []) {
      const card = cardById.get(id);
      if (card?.monsterType) counts.set(card.monsterType, (counts.get(card.monsterType) ?? 0) + 1);
    }
    return [...counts.entries()];
  });

  onMount(() => {
    try {
      const saved = localStorage.getItem(DECK_STORAGE_KEY);
      if (saved !== null) {
        try {
          const parsed = validateDeckEnvelope(JSON.parse(saved), allowedIds);
          if (parsed.decks.length) {
            decks = parsed.decks;
            occurrenceIds = Object.fromEntries(
              parsed.decks.map((deck) => [deck.id, deck.cardIds.map(() => crypto.randomUUID())]),
            );
          } else status = 'Saved data has no decks. Create a deck to begin.';
        } catch (error) {
          storageBlocked = true;
          writeFailed = false;
          status = `Saved deck data could not be loaded: ${message(error)} The stored value was left untouched; export this workspace or import a valid backup.`;
        }
      }
    } catch {
      storageBlocked = true;
      writeFailed = false;
      status =
        'Browser storage could not be read. Editing works in this tab; export JSON to keep a copy.';
    }
    activeId = decks[0]?.id ?? '';
    ready = true;
  });

  function message(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown storage error.';
  }
  function snapshot(): DeckEnvelope {
    return {
      schemaVersion: 1,
      decks: decks.map((deck) => ({ ...deck, cardIds: [...deck.cardIds] })),
    };
  }
  function save() {
    if (!ready || (storageBlocked && !writeFailed)) return false;
    try {
      localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(snapshot()));
      storageBlocked = false;
      writeFailed = false;
      status = 'Saved in this browser.';
      return true;
    } catch {
      storageBlocked = true;
      writeFailed = true;
      status =
        'Browser storage is unavailable or full. Editing continues in this tab; export JSON to keep your changes.';
      return false;
    }
  }
  function updateDeck(id: string, change: (deck: DeckRecord) => DeckRecord) {
    decks = decks.map((deck) => (deck.id === id ? change(deck) : deck));
    save();
  }
  function createDeck() {
    const deck = emptyDeck();
    decks = [...decks, deck];
    occurrenceIds = { ...occurrenceIds, [deck.id]: [] };
    activeId = deck.id;
    save();
  }
  function renameDeck(id: string, name: string) {
    if (!name.trim()) {
      status = 'Deck name cannot be blank.';
      return;
    }
    updateDeck(id, (deck) => ({ ...deck, name: name.trim() }));
  }
  function duplicateDeck() {
    if (!active) return;
    const copy = {
      id: crypto.randomUUID(),
      name: `${active.name} copy`,
      cardIds: [...active.cardIds],
    };
    decks = [...decks, copy];
    occurrenceIds = { ...occurrenceIds, [copy.id]: copy.cardIds.map(() => crypto.randomUUID()) };
    activeId = copy.id;
    save();
  }
  function deleteDeck() {
    if (!active) return;
    const remaining = decks.filter((deck) => deck.id !== active.id);
    if (!remaining.length) remaining.push(emptyDeck());
    const nextIds = { ...occurrenceIds };
    delete nextIds[active.id];
    if (!nextIds[remaining[0]!.id]) nextIds[remaining[0]!.id] = [];
    occurrenceIds = nextIds;
    decks = remaining;
    activeId = remaining[0]!.id;
    save();
  }
  function addCard(cardId: number) {
    if (!active || !allowedIds.has(cardId)) return;
    const id = active.id;
    occurrenceIds = { ...occurrenceIds, [id]: [...(occurrenceIds[id] ?? []), crypto.randomUUID()] };
    updateDeck(id, (deck) => ({ ...deck, cardIds: [...deck.cardIds, cardId] }));
  }
  function removeCard(instanceId: string) {
    if (!active) return;
    const index = (occurrenceIds[active.id] ?? []).indexOf(instanceId);
    if (index < 0) return;
    occurrenceIds = {
      ...occurrenceIds,
      [active.id]: (occurrenceIds[active.id] ?? []).filter((id) => id !== instanceId),
    };
    updateDeck(active.id, (deck) => ({
      ...deck,
      cardIds: deck.cardIds.filter((_, at) => at !== index),
    }));
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rose-codex-decks.json';
    link.click();
    URL.revokeObjectURL(url);
    status = 'Deck JSON exported.';
  }
  function importJson() {
    try {
      const parsed = validateDeckEnvelope(JSON.parse(importText), allowedIds);
      if (!parsed.decks.length) throw new Error('Import must contain at least one deck.');
      decks = parsed.decks;
      activeId = decks[0]!.id;
      occurrenceIds = Object.fromEntries(
        decks.map((deck) => [deck.id, deck.cardIds.map(() => crypto.randomUUID())]),
      );
      storageBlocked = false;
      writeFailed = false;
      ready = true;
      const saved = save();
      if (saved) status = 'Decks imported and saved.';
    } catch (error) {
      status = `Import not applied: ${message(error)}`;
    }
  }
</script>

<section class="workspace" aria-label="Deck builder">
  <header class="page-header">
    <div>
      <h1 class="page-title">Deck builder</h1>
      <p class="page-description">
        Build and compare personal card lists. Your workspace stays in this browser.
      </p>
    </div>
    <div class="header-actions">
      <Button variant="outline" onclick={exportJson}>Export JSON</Button><Button
        onclick={createDeck}>New deck</Button
      >
    </div>
  </header>
  <p class="status" role="status" aria-live="polite">{status}</p>
  {#if writeFailed}<Button variant="outline" onclick={() => save()}
      >Retry saving to this browser</Button
    >{/if}
  <div class="workspace-grid">
    <aside class="deck-rail" aria-label="Your decks">
      <h2>Your decks</h2>
      {#each decks as deck (deck.id)}
        <button
          class:chosen={deck.id === activeId}
          class="deck-choice"
          onclick={() => (activeId = deck.id)}
          aria-current={deck.id === activeId ? 'true' : undefined}
        >
          <span>{deck.name}</span><small>{deck.cardIds.length} cards</small>
        </button>
      {/each}
      <div class="import-box">
        <label for="deck-import">Import deck JSON</label>
        <textarea
          id="deck-import"
          bind:value={importText}
          placeholder="Paste a Rose Codex deck export"
          rows="5"></textarea>
        <Button variant="outline" onclick={importJson}>Import and replace</Button>
      </div>
    </aside>
    {#if active}
      <div class="deck-main">
        <section class="deck-heading surface">
          <label class="name-field"
            >Deck name<input
              aria-label="Deck name"
              value={active.name}
              onchange={(event) => renameDeck(active.id, event.currentTarget.value)}
            /></label
          >
          <div class="deck-actions">
            <Button variant="outline" onclick={duplicateDeck}>Duplicate</Button><Button
              variant="outline"
              onclick={deleteDeck}>Delete</Button
            >
          </div>
          <div class="summary" aria-label="Deck summary">
            <span><strong>{active.cardIds.length}</strong> cards</span>
            <span><strong>{stats.known}</strong> known total cost</span>
            {#if stats.unknown}<span class="unknown"
                ><strong>{stats.unknown}</strong> unknown cost</span
              >{/if}
            <span
              >{#each kinds as [kind, count], i}{i ? ' · ' : ''}{kind}: {count}{/each}</span
            >
          </div>
          {#if monsterTypes.length}
            <p class="m-0 text-xs text-muted-foreground" aria-label="Monster type composition">
              Monster types: {#each monsterTypes as [type, count], i}{i ? ' · ' : ''}{type}: {count}{/each}
            </p>
          {/if}
        </section>
        <section class="picker surface" aria-label="Add a card">
          <div>
            <h2>Add a card</h2>
            <p>Choose a card to add another individual copy.</p>
          </div>
          <CardPicker {cards} label="Choose from card library" onselect={addCard} />
        </section>
        <section class="cards-section" aria-label="Cards in this deck">
          <div class="section-heading">
            <h2>Deck cards</h2>
            <span>{active.cardIds.length} occurrences</span>
          </div>
          {#if active.cardIds.length}
            <div class="card-grid">
              {#each active.cardIds as cardId, index ((occurrenceIds[active.id] ?? [])[index]!)}
                {@const card = cardById.get(cardId)}
                {@const instanceId = (occurrenceIds[active.id] ?? [])[index]!}
                {#if card}
                  <article class="occurrence">
                    <span class="copy-label"
                      >Copy {index + 1} · #{String(cardId).padStart(3, '0')}</span
                    >
                    <CardFlipTile {card} id={`deck-${active.id}-${instanceId}`} />
                    <Button
                      variant="outline"
                      class="remove"
                      aria-label={`Remove copy ${index + 1} of ${card.name}`}
                      onclick={() => removeCard(instanceId)}>Remove copy</Button
                    >
                  </article>
                {/if}
              {/each}
            </div>
          {:else}
            <div class="empty surface">
              <h3>This deck is empty</h3>
              <p>Use the visual card picker to add the first card.</p>
            </div>
          {/if}
        </section>
        <aside class="rules-note">
          <strong>Construction guidance</strong>
          <p>
            The manual specifies 40 main-deck cards and up to three copies of a card; leader and
            opponent details also affect legality. This workspace does not model a leader or
            opponent, so it cannot confirm a deck is legal. Campaign entry requires lower deck cost
            than the opponent, excluding the leader's cost.
          </p>
          {#if constructionNotes.length}<ul>
              {#each constructionNotes as note}<li>{note}</li>{/each}
            </ul>{:else}<p>The card count and copy limit match the manual.</p>{/if}<a
            href="https://www.videogamemanual.com/PS2/Yu-Gi-Oh%21%20The%20Duelists%20of%20the%20Roses%20%28USA%29.pdf"
            >US PS2 instruction manual</a
          >
        </aside>
      </div>
    {/if}
  </div>
</section>

<style>
  .workspace {
    min-width: 0;
  }
  .header-actions,
  .deck-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .status {
    min-height: 1.5rem;
    margin: -0.75rem 0 1rem;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
  .workspace-grid {
    display: grid;
    grid-template-columns: minmax(190px, 240px) minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }
  .surface,
  .deck-rail {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .deck-rail {
    padding: 1rem;
    position: sticky;
    top: 1rem;
  }
  .deck-rail h2,
  .picker h2,
  .section-heading h2 {
    margin: 0;
    font-size: 1rem;
  }
  .deck-choice {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
    margin-top: 0.5rem;
    padding: 0.6rem 0.7rem;
    border: 1px solid transparent;
    border-radius: var(--radius);
    color: var(--foreground);
    background: transparent;
    text-align: left;
  }
  .deck-choice:hover {
    background: var(--hover);
  }
  .deck-choice.chosen {
    border-color: var(--primary);
    background: var(--selected);
  }
  .deck-choice small,
  .section-heading span {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .import-box {
    display: grid;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
  .import-box label,
  .name-field {
    display: grid;
    gap: 0.35rem;
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .import-box textarea,
  .name-field input {
    width: 100%;
    min-width: 0;
    padding: 0.55rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--elevated);
    color: var(--foreground);
    font-size: 0.8125rem;
  }
  .deck-main {
    display: grid;
    gap: 1rem;
    min-width: 0;
  }
  .deck-heading {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) auto;
    gap: 0.75rem 1rem;
    padding: 1rem;
  }
  .name-field input {
    font-size: 1rem;
  }
  .deck-actions {
    justify-content: flex-end;
  }
  .summary {
    grid-column: 1/-1;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
    align-items: center;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
  .summary strong {
    color: var(--foreground);
    font-variant-numeric: tabular-nums;
  }
  .summary .unknown {
    color: var(--warning);
  }
  .picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
  }
  .picker p,
  .rules-note p,
  .empty p {
    margin: 0.25rem 0 0;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
  .cards-section {
    min-width: 0;
  }
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.65rem;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
  }
  .occurrence {
    min-width: 0;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .copy-label {
    display: block;
    margin: 0 0 0.4rem;
    color: var(--muted-foreground);
    font-size: 0.7rem;
    font-weight: 650;
  }
  :global(.remove) {
    width: 100%;
    margin-top: 0.45rem;
  }
  .empty {
    padding: 2rem;
    text-align: center;
  }
  .empty h3 {
    margin: 0;
    font-size: 1rem;
  }
  .rules-note {
    padding: 0.8rem 1rem;
    border-radius: var(--radius);
    background: var(--warning-background);
    color: var(--warning);
    font-size: 0.8125rem;
  }
  .rules-note p {
    color: var(--foreground);
  }
  .rules-note a {
    display: inline-block;
    margin-top: 0.45rem;
    color: var(--primary);
  }
  @media (max-width: 760px) {
    .workspace-grid {
      grid-template-columns: 1fr;
    }
    .deck-rail {
      position: static;
    }
    .picker {
      align-items: flex-start;
      flex-direction: column;
    }
    .picker :global(button) {
      max-width: 100%;
    }
  }
  @media (max-width: 520px) {
    .deck-heading {
      grid-template-columns: 1fr;
    }
    .summary {
      grid-column: 1;
    }
    .deck-actions {
      justify-content: flex-start;
    }
    .card-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
  }
</style>
