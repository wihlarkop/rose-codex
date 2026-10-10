<script lang="ts">
  import { onMount, tick } from 'svelte';
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import CardFlipTile from '../../components/cards/CardFlipTile.svelte';
  import StarterDeckExplorer from './StarterDeckExplorer.svelte';
  import DeckReadinessAdvisor from '../../components/DeckReadinessAdvisor.svelte';
  import { parseSmartDeckLink, type PendingCoachDeck } from '../../lib/dotr/smart-deck-link';
  import { Button } from '../../components/ui/button';
  import { filterCards, type BrowserCard } from '../../lib/dotr/browser';
  import {
    DECK_STORAGE_KEY,
    knownDeckCost,
    validateDeckEnvelope,
    type DeckEnvelope,
    type DeckRecord,
  } from './model';

  type CardCopy = { index: number; instanceId: string };
  type CardGroup = { card: BrowserCard; copies: CardCopy[] };
  type PendingConfirmation =
    | { type: 'delete'; deckId: string; deckName: string; cardCount: number }
    | { type: 'import'; decks: DeckEnvelope };

  let {
    cards,
    embedded = false,
    proposedDeck = null,
    onproposalhandled,
  }: {
    cards: BrowserCard[];
    embedded?: boolean;
    proposedDeck?: PendingCoachDeck | null;
    onproposalhandled?: () => void;
  } = $props();
  const cardById = $derived(new Map(cards.map((card) => [card.id, card])));
  const allowedIds = $derived(new Set(cardById.keys()));
  const costs = $derived(new Map(cards.map((card) => [card.id, card.deckCost])));
  const emptyDeck = (): DeckRecord => ({ id: crypto.randomUUID(), name: 'New deck', cardIds: [] });
  const initialDeck = emptyDeck();
  let decks = $state<DeckRecord[]>([initialDeck]);
  let occurrenceIds = $state<Record<string, string[]>>({ [initialDeck.id]: [] });
  let activeId = $state(initialDeck.id);
  let saveStatus = $state('Not saved yet · changes save automatically.');
  let nameEditing = $state(false);
  let notice = $state('');
  let storageWarning = $state('');
  let storageBlocked = $state(false);
  let writeFailed = $state(false);
  let importText = $state('');
  let pendingCoachDeck = $state<PendingCoachDeck | null>(null);
  let invalidCoachLink = $state(false);
  let cardSearch = $state('');
  let selectedSearchIndex = $state(0);
  let inspectedCardId = $state<number | null>(null);
  let confirmationDialog = $state<HTMLDialogElement | null>(null);
  let cancelConfirmationButton = $state<HTMLButtonElement | null>(null);
  let pendingConfirmation = $state<PendingConfirmation | null>(null);
  let returnFocusTarget = $state<HTMLElement | null>(null);
  let ready = false;
  const active = $derived(decks.find((deck) => deck.id === activeId) ?? decks[0]);
  const stats = $derived(active ? knownDeckCost(active.cardIds, costs) : { known: 0, unknown: 0 });
  const cardGroups = $derived.by(() => {
    const groups = new Map<number, CardGroup>();
    const ids = occurrenceIds[active?.id ?? ''] ?? [];
    for (const [index, cardId] of (active?.cardIds ?? []).entries()) {
      const card = cardById.get(cardId);
      if (!card) continue;
      const group = groups.get(cardId) ?? { card, copies: [] };
      group.copies.push({ index, instanceId: ids[index] ?? `missing-${index}` });
      groups.set(cardId, group);
    }
    return [...groups.values()].sort((a, b) => a.card.name.localeCompare(b.card.name));
  });
  const copyCounts = $derived.by(() => {
    const counts = new Map<number, number>();
    for (const id of active?.cardIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
    return counts;
  });
  const matchingCards = $derived(
    cardSearch.trim()
      ? filterCards(cards, { query: cardSearch, kind: '', monsterType: '', attribute: '' })
      : [],
  );
  const visibleMatches = $derived(matchingCards.slice(0, 12));
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
      const type = cardById.get(id)?.monsterType;
      if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return [...counts.entries()];
  });
  const constructionNotes = $derived.by(() => {
    const notes: string[] = [];
    const count = active?.cardIds.length ?? 0;
    if (count < 40)
      notes.push(`${40 - count} more ${40 - count === 1 ? 'card' : 'cards'} to reach 40.`);
    if (count > 40)
      notes.push(`${count - 40} card${count - 40 === 1 ? '' : 's'} over the 40-card target.`);
    const overLimit = cardGroups.filter((group) => group.copies.length > 3);
    if (overLimit.length)
      notes.push(
        `${overLimit.length} card${overLimit.length === 1 ? '' : 's'} over the three-copy limit.`,
      );
    if (stats.unknown)
      notes.push(`${stats.unknown} card cost${stats.unknown === 1 ? ' is' : 's are'} unknown.`);
    return notes;
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
            saveStatus = 'Saved in this browser.';
          } else notice = 'Saved data has no decks. Create a deck to begin.';
        } catch (error) {
          storageBlocked = true;
          writeFailed = false;
          saveStatus = 'Not saved · existing saved data is protected.';
          storageWarning = `Saved deck data could not be loaded: ${message(error)} The stored value was left untouched. Export this workspace or import a valid backup.`;
        }
      }
    } catch {
      storageBlocked = true;
      writeFailed = false;
      saveStatus = 'Not saved · browser storage unavailable.';
      storageWarning = 'Editing works in this tab. Export JSON to keep a copy of your changes.';
    }
    activeId = decks[0]?.id ?? '';
    ready = true;
    if (proposedDeck) {
      pendingCoachDeck = proposedDeck;
    } else if (new URLSearchParams(window.location.search).has('suggest')) {
      const proposed = parseSmartDeckLink(window.location.search, cards);
      if (proposed) pendingCoachDeck = proposed;
      else invalidCoachLink = true;
    }
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
      saveStatus = 'Saved in this browser.';
      storageWarning = '';
      notice = '';
      return true;
    } catch {
      storageBlocked = true;
      writeFailed = true;
      saveStatus = 'Not saved · changes are only in this tab.';
      storageWarning = 'Browser storage is unavailable or full. Export JSON to keep your changes.';
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
    inspectedCardId = null;
    save();
  }
  function acceptCoachDeck() {
    if (!pendingCoachDeck) return;
    const proposed = pendingCoachDeck;
    // Add a new record rather than replacing previous decks.
    createStarterDeck({ name: proposed.name, cardIds: proposed.cardIds });
    pendingCoachDeck = null;
    onproposalhandled?.();
    if (new URLSearchParams(window.location.search).has('suggest'))
      history.replaceState(null, '', '/decks/');
  }
  function dismissCoachDeck() {
    pendingCoachDeck = null;
    invalidCoachLink = false;
    onproposalhandled?.();
    if (new URLSearchParams(window.location.search).has('suggest'))
      history.replaceState(null, '', '/decks/');
  }
  function createStarterDeck(starter: { name: string; cardIds: number[] }) {
    if (starter.cardIds.length !== 40 || !starter.cardIds.every((id) => allowedIds.has(id))) {
      notice = 'This starter list is incomplete or contains unknown cards. No deck was created.';
      return;
    }
    const deck: DeckRecord = {
      id: crypto.randomUUID(),
      name: starter.name,
      cardIds: [...starter.cardIds],
    };
    decks = [...decks, deck];
    occurrenceIds = {
      ...occurrenceIds,
      [deck.id]: deck.cardIds.map(() => crypto.randomUUID()),
    };
    activeId = deck.id;
    inspectedCardId = null;
    const saved = save();
    notice = saved
      ? 'Starter deck created. You can now edit all 40 cards.'
      : 'Starter deck is available in this tab, but was not saved. Export JSON to keep a copy.';
  }
  function renameDeck(id: string, name: string, input: HTMLInputElement) {
    if (!name.trim()) {
      input.value = active?.name ?? '';
      nameEditing = false;
      notice = 'Deck name cannot be blank.';
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
    inspectedCardId = null;
    save();
  }
  async function requestDeleteDeck(event: MouseEvent) {
    if (!active) return;
    pendingConfirmation = {
      type: 'delete',
      deckId: active.id,
      deckName: active.name,
      cardCount: active.cardIds.length,
    };
    returnFocusTarget = event.currentTarget as HTMLElement;
    await openConfirmation();
  }
  function applyDeleteDeck(deckId: string) {
    const target = decks.find((deck) => deck.id === deckId);
    if (!target) return;
    const remaining = decks.filter((deck) => deck.id !== deckId);
    if (!remaining.length) remaining.push(emptyDeck());
    const nextIds = { ...occurrenceIds };
    delete nextIds[deckId];
    if (!nextIds[remaining[0]!.id]) nextIds[remaining[0]!.id] = [];
    occurrenceIds = nextIds;
    decks = remaining;
    if (activeId === deckId) {
      activeId = remaining[0]!.id;
      inspectedCardId = null;
    }
    save();
  }
  function addCard(cardId: number) {
    if (!active || !allowedIds.has(cardId)) return;
    const id = active.id;
    occurrenceIds = { ...occurrenceIds, [id]: [...(occurrenceIds[id] ?? []), crypto.randomUUID()] };
    updateDeck(id, (deck) => ({ ...deck, cardIds: [...deck.cardIds, cardId] }));
  }
  function searchKeydown(event: KeyboardEvent) {
    if (!visibleMatches.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedSearchIndex = Math.min(selectedSearchIndex + 1, visibleMatches.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedSearchIndex = Math.max(selectedSearchIndex - 1, 0);
    } else if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      const match = visibleMatches[selectedSearchIndex];
      if (match) addCard(match.id);
    }
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
  function removeOne(group: CardGroup) {
    const copy = group.copies.at(-1);
    if (copy) removeCard(copy.instanceId);
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rose-codex-decks.json';
    link.click();
    URL.revokeObjectURL(url);
    notice = 'Deck JSON exported.';
  }
  async function requestImport(event: MouseEvent) {
    try {
      const parsed = validateDeckEnvelope(JSON.parse(importText), allowedIds);
      if (!parsed.decks.length) throw new Error('Import must contain at least one deck.');
      pendingConfirmation = {
        type: 'import',
        decks: {
          schemaVersion: 1,
          decks: parsed.decks.map((deck) => ({ ...deck, cardIds: [...deck.cardIds] })),
        },
      };
      returnFocusTarget = event.currentTarget as HTMLElement;
      await openConfirmation();
    } catch (error) {
      notice = `Import not applied: ${message(error)}`;
    }
  }
  async function openConfirmation() {
    await tick();
    if (!confirmationDialog?.open) confirmationDialog?.showModal();
    cancelConfirmationButton?.focus();
  }
  function closeConfirmation() {
    confirmationDialog?.close();
  }
  function onConfirmationClosed() {
    pendingConfirmation = null;
    returnFocusTarget?.focus();
    returnFocusTarget = null;
  }
  function confirmPendingAction() {
    const action = pendingConfirmation;
    if (!action) return;
    if (action.type === 'delete') {
      applyDeleteDeck(action.deckId);
    } else {
      decks = action.decks.decks.map((deck) => ({ ...deck, cardIds: [...deck.cardIds] }));
      activeId = decks[0]!.id;
      occurrenceIds = Object.fromEntries(
        decks.map((deck) => [deck.id, deck.cardIds.map(() => crypto.randomUUID())]),
      );
      inspectedCardId = null;
      storageBlocked = false;
      writeFailed = false;
      ready = true;
      const saved = save();
      if (saved) notice = 'Decks imported and saved.';
    }
    closeConfirmation();
  }
  function selectDeck(id: string) {
    activeId = id;
    inspectedCardId = null;
    notice = '';
  }
</script>

<section class="workspace" aria-label="Deck builder">
  <header class="page-header">
    <div>
      <h1 class="page-title">{embedded ? 'Build your deck' : 'Deck builder'}</h1>
      <p class="page-description">Build and manage your Duelists of the Roses decks.</p>
    </div>
    <div class="deck-selector">
      <label for="deck-select">Your decks</label>
      <select
        id="deck-select"
        value={active?.id ?? ''}
        onchange={(event) => selectDeck(event.currentTarget.value)}
      >
        {#each decks as deck (deck.id)}
          <option value={deck.id}>{deck.name} · {deck.cardIds.length}/40</option>
        {/each}
      </select>
      <Button onclick={createDeck}>New deck</Button>
    </div>
  </header>

  <div class="save-line" aria-live="polite">
    <span class="save-indicator" class:protected={storageBlocked || writeFailed}>{saveStatus}</span>
    {#if nameEditing}<span class="pending-name"
        >Deck name change pending · leave the field to save.</span
      >{/if}
    {#if writeFailed}<Button variant="outline" onclick={() => save()}>Retry saving</Button>{/if}
  </div>
  {#if storageWarning}<p class="storage-warning" role="status">{storageWarning}</p>{/if}
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  {#if pendingCoachDeck}
    <section
      class="mb-4 rounded-lg border border-border bg-selected p-4"
      aria-label="Review proposed Smart Deck"
    >
      <h2 class="text-base font-semibold">Smart Deck Coach proposal</h2>
      <p class="mt-1 text-sm">
        {pendingCoachDeck.name} · {pendingCoachDeck.cardIds.length} main cards
      </p>
      <p class="mt-2 text-xs text-muted-foreground">
        This proposal came from Smart Deck Coach. It has been validated against canonical card IDs,
        the three-copy limit and the opponent's reported Deck Cost. No changes have been saved yet.
        Deck Leader rank and your actual number of unlocked copies still require verification in
        PCSX2.
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <Button onclick={acceptCoachDeck}>Add as a new deck</Button>
        <Button variant="outline" onclick={dismissCoachDeck}>Dismiss</Button>
      </div>
    </section>
  {:else if invalidCoachLink}
    <section class="mb-4 rounded-lg border border-border bg-surface p-4" role="alert">
      <p class="text-sm">Invalid or unverified Smart Deck link. No deck was added or changed.</p>
      <Button variant="outline" onclick={dismissCoachDeck}>Dismiss</Button>
    </section>
  {/if}

  {#if active}
    <div class="deck-main">
      <section class="deck-heading surface" aria-label="Active deck summary">
        <label class="name-field"
          >Deck name
          <input
            aria-label="Deck name"
            value={active.name}
            oninput={() => (nameEditing = true)}
            onchange={(event) =>
              renameDeck(active.id, event.currentTarget.value, event.currentTarget)}
            onblur={() => (nameEditing = false)}
            onkeydown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
        </label>
        <div class="progress-block">
          <div class="progress-label">
            <strong>{active.cardIds.length} / 40 cards</strong><span
              >{active.cardIds.length === 40
                ? 'Target reached'
                : active.cardIds.length > 40
                  ? `${active.cardIds.length - 40} over target`
                  : `${40 - active.cardIds.length} to go`}</span
            >
          </div>
          <div
            class="progress-track"
            role="progressbar"
            aria-label="Cards in deck"
            aria-valuemin="0"
            aria-valuemax="40"
            aria-valuenow={Math.min(active.cardIds.length, 40)}
            aria-valuetext={`${active.cardIds.length} of 40 cards`}
          >
            <span style={`width: ${Math.min((active.cardIds.length / 40) * 100, 100)}%`}></span>
          </div>
        </div>
        <div class="cost-block">
          <span>Known Deck Cost</span><strong>{stats.known}</strong>
          {#if stats.unknown}<small class="unknown">{stats.unknown} unknown</small>{/if}
        </div>
        <div class="deck-actions">
          <details class="options">
            <summary>Deck options</summary>
            <div class="options-panel">
              <Button variant="outline" onclick={duplicateDeck}>Duplicate this deck</Button>
              <Button variant="outline" onclick={exportJson}>Export all decks (JSON)</Button>
              <Button variant="outline" onclick={requestDeleteDeck}>Delete this deck</Button>
              <div class="import-box">
                <label for="deck-import">Import decks from JSON</label>
                <p>Import replaces every saved deck in this browser.</p>
                <textarea
                  id="deck-import"
                  bind:value={importText}
                  placeholder="Paste a Rose Codex deck export"
                  rows="4"></textarea>
                <Button variant="outline" onclick={requestImport}
                  >Import and replace all decks</Button
                >
              </div>
            </div>
          </details>
        </div>
        <div class="summary" aria-label="Deck composition">
          {#if kinds.length}{#each kinds as [kind, count], i}{i ? ' · ' : ''}{kind}: {count}{/each}{:else}<span
              >No cards added yet.</span
            >{/if}
        </div>
        {#if monsterTypes.length}
          <details class="type-composition">
            <summary>Monster types</summary>
            <p>
              {#each monsterTypes as [type, count], i}{i ? ' · ' : ''}{type}: {count}{/each}
            </p>
          </details>
        {/if}
        {#if constructionNotes.length}
          <p class="guidance">{constructionNotes.join(' ')}</p>
        {/if}
      </section>

      {#key active.id}
        <DeckReadinessAdvisor {cards} cardIds={active.cardIds} />
      {/key}

      <p class="m-0 text-xs text-muted-foreground">
        Want to test draws and fusion sequences?
        <a class="text-link" href={embedded ? '/decks/?mode=practice&deck=' + encodeURIComponent(active.id) : '/simulate/?deck=' + encodeURIComponent(active.id)}>
          Try this deck in Simulator
        </a>
        (practice only; your saved cards will not change).
      </p>

      <details class="starter-tool surface">
        <summary>
          Try starter decks by player name
          <span>Find the three choices offered by DotR and preview their 40 cards</span>
        </summary>
        <StarterDeckExplorer {cards} oncreate={createStarterDeck} />
      </details>

      <p class="m-0 text-xs text-muted-foreground">
        Won a new card after a duel?
        <a class="text-link" href={embedded ? '/decks/?mode=inventory' : '/collection/'}>Add it to My Collection</a>
        first, then move it from reserve into your 40-card deck.
      </p>

      <section class="picker surface" aria-label="Add cards">
        <div>
          <h2>Add cards</h2>
          <p id="deck-search-help">
            Search by name or card number. Use ↑/↓ and Enter to add from your keyboard.
          </p>
        </div>
        <input
          id="deck-card-search"
          type="search"
          aria-label="Search cards to add"
          aria-describedby="deck-search-help"
          aria-controls="deck-card-results"
          placeholder="Search cards, e.g. Baby Dragon or 021…"
          autocomplete="off"
          bind:value={cardSearch}
          oninput={() => (selectedSearchIndex = 0)}
          onkeydown={searchKeydown}
        />
        {#if cardSearch.trim()}
          <p class="search-feedback" role="status">
            {matchingCards.length === 0
              ? 'No matching cards. Try a different name or ID.'
              : matchingCards.length > visibleMatches.length
                ? `Showing ${visibleMatches.length} of ${matchingCards.length} matches · Keep typing to narrow results.`
                : `${matchingCards.length} matching ${matchingCards.length === 1 ? 'card' : 'cards'}.`}
          </p>
        {/if}
        <ul id="deck-card-results" class="search-results" aria-label="Card search results">
          {#each visibleMatches as card, index (card.id)}
            <li class="search-result" class:active={index === selectedSearchIndex}>
              <div class="search-match">
                <div class="search-artwork">
                  <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
                </div>
                <div class="search-text">
                  <strong>{card.name}</strong>
                  <span>
                    #{String(card.id).padStart(3, '0')}
                    · {card.monsterType ?? (card.kind === 'monster' ? 'Monster' : card.kind)}
                  </span>
                </div>
              </div>
              <div class="search-actions">
                <span class="search-copies">{copyCounts.get(card.id) ?? 0} in deck</span>
                <Button
                  size="sm"
                  aria-label={`Add ${card.name} to deck`}
                  onclick={() => addCard(card.id)}>+ Add</Button
                >
              </div>
            </li>
          {/each}
        </ul>
      </section>

      <section class="cards-section" aria-label="Cards in this deck">
        <div class="section-heading">
          <h2>Deck contents</h2>
          <span>{cardGroups.length} unique {cardGroups.length === 1 ? 'card' : 'cards'}</span>
        </div>
        {#if cardGroups.length}
          <div class="card-list">
            {#each cardGroups as group (group.card.id)}
              <article class="card-row">
                <CardArtwork
                  image={group.card.image}
                  name={group.card.name}
                  cardId={group.card.id}
                  decorative
                />
                <div class="card-info">
                  <strong>{group.card.name}</strong><span
                    >#{String(group.card.id).padStart(3, '0')}</span
                  >
                </div>
                <span
                  class="copy-count"
                  aria-label={`${group.copies.length} ${group.copies.length === 1 ? 'copy' : 'copies'}`}
                  >{group.copies.length}x</span
                >
                <div class="row-actions">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Remove one ${group.card.name}`}
                    disabled={!group.copies.length}
                    onclick={() => removeOne(group)}>-</Button
                  >
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Add one ${group.card.name}`}
                    onclick={() => addCard(group.card.id)}>+</Button
                  >
                  <Button
                    variant="ghost"
                    class="inspect-button"
                    aria-expanded={inspectedCardId === group.card.id}
                    onclick={() =>
                      (inspectedCardId = inspectedCardId === group.card.id ? null : group.card.id)}
                    >{inspectedCardId === group.card.id ? 'Close details' : 'Inspect'}</Button
                  >
                </div>
                {#if group.copies.length > 1}
                  <details class="copy-details">
                    <summary>Manage individual copies</summary>
                    <ul>
                      {#each group.copies as copy, copyIndex (copy.instanceId)}
                        <li>
                          <span>Copy {copyIndex + 1}</span><Button
                            variant="ghost"
                            class="remove-copy"
                            aria-label={`Remove copy ${copyIndex + 1} of ${group.card.name}`}
                            onclick={() => removeCard(copy.instanceId)}>Remove copy</Button
                          >
                        </li>
                      {/each}
                    </ul>
                  </details>
                {/if}
                {#if inspectedCardId === group.card.id}
                  <div class="inspection">
                    <p>
                      Select the card image to see its metadata. · #{String(group.card.id).padStart(
                        3,
                        '0',
                      )}
                    </p>
                    <CardFlipTile card={group.card} id={`deck-inspect-${group.card.id}`} />
                  </div>
                {/if}
              </article>
            {/each}
          </div>
        {:else}
          <div class="empty surface">
            <h3>Start with a card</h3>
            <p>Use the search above to find a card and add your first copy.</p>
          </div>
        {/if}
      </section>
      <details class="construction-note">
        <summary>About deck requirements</summary>
        <p>
          Deck Readiness now checks card count, copy limits, a manually confirmed Deck Leader rank,
          and a community-reported campaign opponent's Deck Cost. It cannot inspect your actual
          PCSX2 save, ownership, or card effects, so the result remains conditional.
        </p>
      </details>
    </div>
  {/if}
</section>

<dialog
  bind:this={confirmationDialog}
  class="confirmation-dialog"
  aria-labelledby="confirmation-title"
  aria-describedby="confirmation-message"
  onclose={onConfirmationClosed}
>
  {#if pendingConfirmation}
    <h2 id="confirmation-title">
      {pendingConfirmation.type === 'delete'
        ? `Delete “${pendingConfirmation.deckName}”?`
        : 'Replace all saved decks?'}
    </h2>
    <p id="confirmation-message">
      {#if pendingConfirmation.type === 'delete'}
        This removes the deck and its {pendingConfirmation.cardCount}
        {pendingConfirmation.cardCount === 1 ? 'card' : 'cards'} from this browser.
      {:else}
        This replaces all {decks.length} saved {decks.length === 1 ? 'deck' : 'decks'} with
        {pendingConfirmation.decks.decks.length}
        {pendingConfirmation.decks.decks.length === 1 ? 'deck' : 'decks'} from this JSON. Export a backup
        first if needed.
      {/if}
    </p>
    <div class="confirmation-actions">
      <Button bind:ref={cancelConfirmationButton} variant="outline" onclick={closeConfirmation}>
        Cancel
      </Button>
      <Button
        variant={pendingConfirmation.type === 'delete' ? 'destructive' : 'default'}
        onclick={confirmPendingAction}
      >
        {pendingConfirmation.type === 'delete' ? 'Delete deck' : 'Replace all decks'}
      </Button>
    </div>
  {/if}
</dialog>

<style>
  .workspace {
    min-width: 0;
  }
  .deck-selector {
    display: flex;
    align-items: end;
    gap: 0.5rem;
  }
  .deck-selector label,
  .name-field,
  .import-box label {
    display: grid;
    gap: 0.3rem;
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .deck-selector select,
  .name-field input,
  .import-box textarea {
    min-width: 0;
    padding: 0.55rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--elevated);
    color: var(--foreground);
    font-size: 0.875rem;
  }
  .deck-selector select {
    width: min(18rem, 34vw);
  }
  .save-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    min-height: 2.2rem;
    margin: -0.5rem 0 0.5rem;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
  .save-indicator::before {
    content: '';
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    margin-right: 0.45rem;
    border-radius: 50%;
    background: var(--primary);
  }
  .save-indicator.protected::before {
    background: var(--warning);
  }
  .notice {
    margin: 0 0 0.75rem;
    color: var(--warning);
    font-size: 0.8125rem;
  }
  .storage-warning {
    margin: 0 0 0.75rem;
    padding: 0.55rem 0.7rem;
    border-radius: var(--radius);
    background: var(--warning-background);
    color: var(--warning);
    font-size: 0.8125rem;
  }
  .surface {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .deck-main {
    display: grid;
    gap: 0.85rem;
    min-width: 0;
  }
  .deck-heading {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) minmax(180px, 1.3fr) auto auto;
    align-items: center;
    gap: 0.65rem 1rem;
    padding: 0.8rem 1rem;
  }
  .name-field input {
    width: 100%;
    font-size: 1rem;
  }
  .progress-label {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
    font-size: 0.8125rem;
  }
  .progress-label span,
  .cost-block > span,
  .cost-block small {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .progress-track {
    height: 0.55rem;
    overflow: hidden;
    border-radius: 999px;
    background: var(--elevated);
  }
  .progress-track span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--primary);
    transition: width 160ms ease;
  }
  .cost-block {
    display: grid;
    grid-template-columns: auto auto;
    align-items: baseline;
    gap: 0.1rem 0.5rem;
    white-space: nowrap;
  }
  .cost-block > span {
    grid-column: 1 / -1;
  }
  .cost-block strong {
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
  }
  .cost-block .unknown {
    color: var(--warning);
  }
  .deck-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.4rem;
  }
  .options {
    position: relative;
  }
  .options > summary,
  .copy-details > summary,
  .construction-note > summary {
    cursor: pointer;
    color: var(--primary);
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .options-panel {
    position: absolute;
    z-index: 5;
    top: calc(100% + 0.5rem);
    right: 0;
    display: grid;
    gap: 0.55rem;
    width: min(22rem, calc(100vw - 2rem));
    padding: 0.8rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: 0 8px 24px rgb(41 39 42 / 12%);
  }
  .import-box {
    display: grid;
    gap: 0.45rem;
    padding-top: 0.65rem;
    border-top: 1px solid var(--border);
  }
  .import-box p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .import-box textarea {
    width: 100%;
    resize: vertical;
  }
  .summary {
    grid-column: 1 / -1;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .guidance {
    grid-column: 1 / -1;
    margin: -0.35rem 0 0;
    color: var(--warning);
    font-size: 0.75rem;
  }
  .type-composition {
    grid-column: 1 / -1;
    font-size: 0.75rem;
  }
  .type-composition summary {
    cursor: pointer;
    color: var(--primary);
  }
  .type-composition p {
    margin: 0.25rem 0 0;
    color: var(--muted-foreground);
  }
  .starter-tool {
    min-width: 0;
  }
  .starter-tool > summary {
    padding: 0.85rem 1rem;
    cursor: pointer;
    color: var(--primary);
    font-size: 0.875rem;
    font-weight: 650;
  }
  .starter-tool > summary span {
    margin-left: 0.5rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
    font-weight: 400;
  }
  .picker {
    display: grid;
    gap: 0.65rem;
    padding: 0.8rem 1rem;
    min-width: 0;
  }
  .picker h2,
  .section-heading h2 {
    margin: 0;
    font-size: 1rem;
  }
  .picker p {
    margin: 0.2rem 0 0;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
  #deck-card-search {
    width: 100%;
    min-width: 0;
    padding: 0.7rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--elevated);
    color: var(--foreground);
    font-size: 0.875rem;
  }
  #deck-card-search:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  .search-feedback {
    margin: 0;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  .search-results {
    display: grid;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .search-result {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem 0.75rem;
    min-width: 0;
    padding: 0.4rem 0.55rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .search-result.active {
    border-color: var(--primary);
    background: var(--selected);
  }
  .search-match {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.6rem;
    min-width: 10rem;
  }
  .search-artwork {
    width: 3rem;
    flex-shrink: 0;
  }
  .search-artwork :global(.card-artwork) {
    width: 3rem;
    height: 2.4rem;
    border-radius: 4px;
  }
  .search-text {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }
  .search-text strong {
    overflow: hidden;
    font-size: 0.875rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .search-text span,
  .search-copies {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .search-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
    white-space: nowrap;
  }
  .cards-section {
    min-width: 0;
  }
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  .section-heading span {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .card-list {
    display: grid;
    gap: 0.4rem;
  }
  .card-row {
    display: grid;
    grid-template-columns: 3.5rem minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.55rem 0.75rem;
    min-width: 0;
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .card-row > :global(.card-artwork) {
    width: 3.5rem;
    height: 2.8rem;
    border-radius: 4px;
  }
  .card-info {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }
  .card-info strong {
    overflow: hidden;
    font-size: 0.875rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card-info span {
    color: var(--muted-foreground);
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
  }
  .copy-count {
    min-width: 2.4rem;
    padding: 0.25rem 0.4rem;
    border-radius: 999px;
    background: var(--selected);
    color: var(--primary);
    text-align: center;
    font-size: 0.8125rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .row-actions {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .row-actions :global(button[size='icon']) {
    width: 2rem;
    height: 2rem;
  }
  .row-actions :global(.inspect-button) {
    padding-inline: 0.45rem;
  }
  .copy-details,
  .inspection {
    grid-column: 2 / -1;
  }
  .copy-details > summary {
    font-size: 0.75rem;
  }
  .copy-details ul {
    display: grid;
    gap: 0.25rem;
    margin: 0.35rem 0 0;
    padding: 0;
    list-style: none;
  }
  .copy-details li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .copy-details :global(.remove-copy) {
    min-height: 1.8rem;
    padding-inline: 0.4rem;
    font-size: 0.75rem;
  }
  .inspection {
    display: flex;
    align-items: start;
    gap: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border);
  }
  .inspection p {
    margin: 0.25rem 0;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .inspection :global(.card-tile) {
    width: 10rem;
    height: 15.5rem;
  }
  .empty {
    padding: 1.5rem;
    text-align: center;
  }
  .empty h3 {
    margin: 0;
    font-size: 1rem;
  }
  .empty p,
  .construction-note p {
    margin: 0.3rem 0 0;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
  .confirmation-dialog {
    width: min(28rem, calc(100vw - 2rem));
    margin: auto;
    padding: 1.1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--foreground);
    box-shadow: 0 1rem 3rem color-mix(in srgb, var(--foreground) 20%, transparent);
  }
  .confirmation-dialog::backdrop {
    background: color-mix(in srgb, var(--foreground) 42%, transparent);
  }
  .confirmation-dialog h2 {
    margin: 0;
    font-size: 1.1rem;
  }
  .confirmation-dialog p {
    margin: 0.55rem 0 1rem;
    color: var(--muted-foreground);
    font-size: 0.875rem;
    line-height: 1.5;
  }
  .confirmation-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  .construction-note {
    color: var(--foreground);
    font-size: 0.8125rem;
  }
  @media (max-width: 850px) {
    .deck-heading {
      grid-template-columns: minmax(160px, 1fr) minmax(160px, 1.2fr) auto;
    }
    .deck-actions {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }
    .options {
      width: 100%;
    }
    .options-panel {
      position: static;
      width: 100%;
      margin-top: 0.5rem;
      box-shadow: none;
    }
    .summary,
    .guidance {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 600px) {
    .deck-selector {
      align-items: stretch;
      width: 100%;
    }
    .deck-selector label {
      flex: 1;
    }
    .deck-selector select {
      width: 100%;
    }
    .deck-selector :global(button) {
      align-self: end;
    }
    .deck-heading {
      grid-template-columns: 1fr 1fr;
    }
    .progress-block {
      grid-column: 1 / -1;
      grid-row: 2;
    }
    .deck-actions {
      grid-column: 1 / -1;
      grid-row: 4;
    }
    .summary,
    .guidance {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 420px) {
    .card-row {
      grid-template-columns: 2.8rem minmax(0, 1fr) auto;
      gap: 0.45rem;
    }
    .card-row > :global(.card-artwork) {
      width: 2.8rem;
      height: 2.3rem;
    }
    .row-actions {
      grid-column: 2 / -1;
      justify-self: end;
    }
    .copy-details,
    .inspection {
      grid-column: 1 / -1;
    }
  }
</style>
