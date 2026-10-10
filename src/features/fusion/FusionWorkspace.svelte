<script lang="ts">
  import { onMount, tick } from 'svelte';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import GitBranch from '@lucide/svelte/icons/git-branch';
  import CircleMinus from '@lucide/svelte/icons/circle-minus';
  import CircleHelp from '@lucide/svelte/icons/circle-help';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import CardPicker from '../../components/cards/CardPicker.svelte';
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import FusionResultCard from './FusionResultCard.svelte';
  import FusionEncyclopedia from './FusionEncyclopedia.svelte';
  import { createRecipeHand } from './recipe-handoff';
  import DuelStrategyAdvisor from './DuelStrategyAdvisor.svelte';
  import { suggestFusionPlays } from '../../lib/dotr/fusion-advisor';
  import { parseHandLink } from '../../lib/dotr/deck-simulation';
  import {
    createFusionDiscovery,
    type FusionOccurrence,
    type FusionResult,
    type FusionRecipe,
    type FusionZone,
  } from '../../lib/dotr/fusion-discovery';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import type { Card, FusionData } from '../../lib/dotr/model';
  import { filterCards } from '../../lib/dotr/browser';
  import { DECK_STORAGE_KEY, validateDeckEnvelope, type DeckRecord } from '../decks/model';

  let {
    cards,
    canonicalCards,
    fusionData,
  }: { cards: BrowserCard[]; canonicalCards: Card[]; fusionData: FusionData } = $props();
  function createIslandData() {
    return {
      discover: createFusionDiscovery(canonicalCards, fusionData),
      cardById: new Map(cards.map((card) => [card.id, card])),
    };
  }
  const { discover, cardById } = createIslandData();
  let occurrences = $state<FusionOccurrence[]>([]);
  let previousFusionInputs = $state<FusionOccurrence[] | null>(null);
  let actionNotice = $state('');
  let replacementDialog = $state<HTMLDialogElement | null>(null);
  let cancelReplacementButton = $state<HTMLButtonElement | null>(null);
  let pendingRecipe = $state<FusionOccurrence[] | null>(null);
  let savedDecks = $state<DeckRecord[]>([]);
  let selectedDeckId = $state('');
  let deckSearch = $state('');
  let deckStorageWarning = $state('');
  const selectedDeck = $derived(savedDecks.find((deck) => deck.id === selectedDeckId));
  const deckCardCounts = $derived.by(() => {
    const counts = new Map<number, number>();
    for (const id of selectedDeck?.cardIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
    return counts;
  });
  const deckCards = $derived.by(() => {
    const matching = filterCards(cards, {
      query: deckSearch,
      kind: '',
      monsterType: '',
      attribute: '',
    });
    const allowed = new Set(matching.map((card) => card.id));
    return [...deckCardCounts.entries()]
      .filter(([id]) => allowed.has(id))
      .map(([id, count]) => ({ id, count, card: cardById.get(id)! }))
      .sort((a, b) => a.card.name.localeCompare(b.card.name));
  });
  function loadSavedDecks() {
    try {
      const raw = localStorage.getItem(DECK_STORAGE_KEY);
      savedDecks = raw
        ? validateDeckEnvelope(JSON.parse(raw), new Set(cards.map((card) => card.id))).decks
        : [];
      if (!savedDecks.some((deck) => deck.id === selectedDeckId))
        selectedDeckId = savedDecks.at(-1)?.id ?? '';
      deckStorageWarning = '';
    } catch (error) {
      savedDecks = [];
      selectedDeckId = '';
      deckStorageWarning =
        'Saved decks cannot be read. Your Fusion Hand remains unchanged: ' +
        (error instanceof Error ? error.message : 'Unknown storage error.');
    }
  }
  onMount(() => {
    if (new URLSearchParams(window.location.search).get('mode') === 'recipes') {
      mode = 'recipes';
      recipesActivated = true;
    }
    loadSavedDecks();
    const linkedHand = parseHandLink(window.location.search, new Set(cardById.keys()));
    if (linkedHand === null) return;
    if (!linkedHand.length) {
      actionNotice = 'Invalid Hand link. Choose cards manually or return to Deck Simulator.';
      return;
    }
    occurrences = linkedHand.map((cardId) => ({
      instanceId: crypto.randomUUID(),
      cardId,
      zone: 'hand' as const,
    }));
    const source = new URLSearchParams(window.location.search).get('from');
    const origin =
      source === 'simulator'
        ? 'Deck Simulator'
        : source === 'recipes'
          ? 'Fusion Encyclopedia'
          : 'a shared Hand link';
    actionNotice =
      linkedHand.length +
      ' cards loaded from ' +
      origin +
      '. Your saved decks and Collection remain unchanged.';
  });
  function chooseMode(next: 'workbench' | 'recipes') {
    mode = next;
    if (next === 'recipes') recipesActivated = true;
  }
  function applyRecipeMaterials(next: FusionOccurrence[]) {
    resetUndo();
    occurrences = next;
    actionNotice =
      next.length +
      ' recipe material cards loaded into Hand. Planner only; no saved deck or Collection changes.';
    mode = 'workbench';
  }
  async function loadRecipeMaterials(materials: readonly number[]) {
    const next = createRecipeHand(materials, cardById, () => crypto.randomUUID());
    if (!next) {
      actionNotice = 'Recipe materials could not be validated; your planner remains unchanged.';
      mode = 'workbench';
      return;
    }
    if (!occurrences.length) {
      applyRecipeMaterials(next);
      return;
    }
    pendingRecipe = next;
    await tick();
    replacementDialog?.showModal();
    cancelReplacementButton?.focus();
  }
  function confirmRecipeReplacement() {
    const next = pendingRecipe;
    if (!next) return;
    replacementDialog?.close();
    applyRecipeMaterials(next);
  }
  function cancelRecipeReplacement() {
    replacementDialog?.close();
  }
  function addDeckOccurrence(cardId: number, zone: FusionZone) {
    const allowed = deckCardCounts.get(cardId) ?? 0;
    const alreadyUsed = occurrences.filter((entry) => entry.cardId === cardId).length;
    if (alreadyUsed >= allowed) return;
    if (zone === 'hand' && hand.length >= 5) {
      actionNotice =
        'Five cards already in Hand. Remove a card before selecting another from this deck.';
      return;
    }
    add(cardId, zone);
  }
  let mode = $state<'workbench' | 'recipes'>('workbench');
  let recipesActivated = $state(false);
  let insertZone = $state<FusionZone>('hand');
  let sort = $state('atk');
  let filter = $state('');
  const discovery = $derived(discover(occurrences));
  const suggestedPlays = $derived(suggestFusionPlays(discovery, cardById));
  const topResultId = $derived(suggestedPlays[0]?.resultCardId ?? null);
  const compatibility = $derived(
    new Map(discovery.compatibility.map((entry) => [entry.instanceId, entry])),
  );
  const hand = $derived(occurrences.filter((entry) => entry.zone === 'hand'));
  const summoning = $derived(occurrences.filter((entry) => entry.zone === 'summoning'));
  const labels = $derived(
    new Map([
      ...hand.map((entry, index) => [entry.instanceId, 'Hand ' + (index + 1)] as const),
      ...summoning.map(
        (entry, index) => [entry.instanceId, 'Summoning Area ' + (index + 1)] as const,
      ),
    ]),
  );
  const usable = $derived(
    discovery.compatibility.filter(
      (entry) => entry.ordinary === 'direct' || entry.ordinary === 'chain',
    ).length,
  );
  const unevaluated = $derived(
    discovery.compatibility.filter((entry) => entry.ordinary === 'undetermined').length,
  );
  const status = {
    direct: { icon: CircleCheck, label: 'Direct fusion available', class: 'text-primary' },
    chain: { icon: GitBranch, label: 'Available in fusion chain', class: 'text-primary' },
    none: {
      icon: CircleMinus,
      label: 'No ordinary fusion with current cards',
      class: 'text-muted-foreground',
    },
    undetermined: { icon: CircleHelp, label: 'Not fully evaluated', class: 'text-warning' },
  };
  const sortedResults = $derived.by(() => {
    const query = filter.trim().toLowerCase();
    return discovery.results
      .filter((group) => {
        const card = cardById.get(group.resultCardId)!;
        return (
          !query ||
          card.name.toLowerCase().includes(query) ||
          String(card.id).padStart(3, '0').includes(query)
        );
      })
      .toSorted((a, b) => {
        const left = cardById.get(a.resultCardId)!;
        const right = cardById.get(b.resultCardId)!;
        if (sort === 'atk') return (right.atk ?? -1) - (left.atk ?? -1) || left.id - right.id;
        if (sort === 'materials')
          return (
            a.recipes[0]!.instanceIds.length - b.recipes[0]!.instanceIds.length ||
            left.id - right.id
          );
        if (sort === 'name') return left.name.localeCompare(right.name) || left.id - right.id;
        return left.id - right.id;
      });
  });
  const specialResults = $derived.by(() => {
    const groups = new Map<number, FusionResult>();
    for (const recipe of discovery.specials) {
      const group = groups.get(recipe.resultCardId) ?? {
        resultCardId: recipe.resultCardId,
        recipes: [],
      };
      group.recipes.push({
        ...recipe,
        mode: 'hand',
        steps: [
          {
            materials: recipe.materials,
            resultCardId: recipe.resultCardId,
            sourceInstanceIds: [recipe.instanceIds[0]],
            addedInstanceId: recipe.instanceIds[1],
            inputInstanceIds: recipe.instanceIds,
          },
        ],
      });
      groups.set(recipe.resultCardId, group);
    }
    return [...groups.values()];
  });
  async function viewSuggestedResult(resultCardId: number) {
    // Restore the card when the user's current name filter hides the suggestion.
    filter = '';
    await tick();
    const target = document.getElementById('fusion-result-' + resultCardId);
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    target?.focus({ preventScroll: true });
  }
  function resetUndo() {
    previousFusionInputs = null;
    actionNotice = '';
  }
  function add(cardId: number, zone: FusionZone) {
    resetUndo();
    occurrences = [...occurrences, { instanceId: crypto.randomUUID(), cardId, zone }];
  }
  function remove(instanceId: string) {
    resetUndo();
    occurrences = occurrences.filter((entry) => entry.instanceId !== instanceId);
  }
  function move(instanceId: string, zone: FusionZone) {
    resetUndo();
    occurrences = occurrences.map((entry) =>
      entry.instanceId === instanceId ? { ...entry, zone } : entry,
    );
  }
  function clearInputs() {
    resetUndo();
    occurrences = [];
    filter = '';
  }
  function applyFusion(recipe: FusionRecipe) {
    // Only apply a recipe still present in the live ordinary discovery output.
    const available = discovery.results.some(
      (group) =>
        group.resultCardId === recipe.resultCardId &&
        group.recipes.some((candidate) => candidate === recipe),
    );
    const materials = new Set(recipe.instanceIds);
    const current = new Set(occurrences.map((entry) => entry.instanceId));
    if (
      !available ||
      materials.size !== recipe.instanceIds.length ||
      !recipe.instanceIds.every((id) => current.has(id))
    ) {
      actionNotice = 'This recipe is no longer available. Check the updated fusion results.';
      return;
    }
    previousFusionInputs = occurrences.map((entry) => ({ ...entry }));
    occurrences = [
      ...occurrences.filter((entry) => !materials.has(entry.instanceId)),
      { instanceId: crypto.randomUUID(), cardId: recipe.resultCardId, zone: 'summoning' },
    ];
    const resultName = cardById.get(recipe.resultCardId)?.name ?? 'Fusion result';
    actionNotice =
      resultName +
      ' added to Summoning Area. ' +
      recipe.instanceIds.length +
      ' source cards removed from this planner. You can undo this fusion.';
  }
  function undoFusion() {
    if (!previousFusionInputs) return;
    occurrences = previousFusionInputs;
    previousFusionInputs = null;
    actionNotice = 'Last fusion undone. Your previous cards have been restored.';
  }
</script>

<section aria-label="Fusion workspace">
  <nav class="fusion-modes" aria-label="Fusion workspace views">
    <button
      type="button"
      class:active={mode === 'workbench'}
      aria-pressed={mode === 'workbench'}
      onclick={() => chooseMode('workbench')}>Workbench</button
    >
    <button
      type="button"
      class:active={mode === 'recipes'}
      aria-pressed={mode === 'recipes'}
      onclick={() => chooseMode('recipes')}>Find Recipes</button
    >
  </nav>
  <div hidden={mode !== 'workbench'} class="fusion-workbench-view">
    <header class="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="m-0 text-2xl font-semibold tracking-tight">Fusion Workbench</h1>
        <p class="mb-0 mt-1 text-sm text-muted-foreground">
          Enter your available cards. Fusions and compatibility update automatically.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        {#if hand.length}
          <a
            href={'/duel/?hand=' + hand.map((item) => item.cardId).join(',')}
            class="control-button">Plan duel with this Hand →</a
          >
        {/if}
        {#if previousFusionInputs}
          <button type="button" class="control-button" onclick={undoFusion}>Undo last fusion</button
          >
        {/if}
        <button
          type="button"
          class="control-button"
          disabled={!occurrences.length}
          onclick={clearInputs}>Clear inputs</button
        >
      </div>
    </header>

    {#if actionNotice}
      <p class="mb-4 text-sm text-muted-foreground" role="status" aria-live="polite">
        {actionNotice}
      </p>
    {/if}

    <div class="grid items-start gap-6 xl:grid-cols-[minmax(20rem,.8fr)_minmax(0,1.2fr)]">
      <section aria-label="Available cards" class="min-w-0">
        <div
          class="mb-4 rounded-lg border border-border bg-surface p-3"
          aria-label="Add cards to fusion planner"
        >
          <h2 class="m-0 mb-2 text-sm font-semibold">Add a card</h2>
          <div class="flex flex-wrap items-end gap-2">
            <label class="min-w-32 flex-1 text-xs text-muted-foreground">
              Destination
              <select class="native-filter mt-1 block w-full" bind:value={insertZone}>
                <option value="hand">Hand</option>
                <option value="summoning">Summoning Area</option>
              </select>
            </label>
            <CardPicker
              {cards}
              label="Find and add a card"
              onselect={(cardId) => add(cardId, insertZone)}
            />
          </div>
        </div>
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
          {#each [{ zone: 'hand' as FusionZone, title: 'Hand', entries: hand }, { zone: 'summoning' as FusionZone, title: 'Summoning Area', entries: summoning }] as group (group.zone)}
            <section
              class="min-w-0 rounded-lg border border-border bg-surface p-3"
              aria-labelledby={'zone-' + group.zone}
            >
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 id={'zone-' + group.zone} class="m-0 text-base font-semibold">
                  {group.title}
                  <span class="number ml-1 text-sm font-normal text-muted-foreground"
                    >{group.entries.length}</span
                  >
                </h2>
              </div>
              {#if group.entries.length}
                <ol class="m-0 grid list-none gap-3 p-0">
                  {#each group.entries as entry (entry.instanceId)}
                    {@const card = cardById.get(entry.cardId)!}
                    {@const match = compatibility.get(entry.instanceId)!}
                    {@const indicator = status[match.ordinary]}
                    {@const StatusIcon = indicator.icon}
                    <li
                      class="min-w-0 border-t border-border pt-3"
                      aria-label={labels.get(entry.instanceId) + ': ' + card.name}
                    >
                      <div class="flex min-w-0 items-start gap-3">
                        <div class="w-12 shrink-0 overflow-hidden rounded-sm">
                          <CardArtwork
                            image={card.image}
                            name={card.name}
                            cardId={card.id}
                            decorative
                          />
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="m-0 break-words text-sm font-semibold">{card.name}</p>
                          <p class="mb-1 mt-0 text-xs text-muted-foreground">
                            #{String(card.id).padStart(3, '0')} · {labels.get(entry.instanceId)}
                          </p>
                          <p
                            class={'m-0 flex items-start gap-1.5 text-xs leading-relaxed ' +
                              indicator.class}
                          >
                            <StatusIcon
                              class="mt-0.5 size-3.5 shrink-0"
                              aria-hidden="true"
                            />{indicator.label}
                          </p>
                          {#if match.special}<p
                              class="mb-0 mt-1 flex items-start gap-1.5 text-xs text-warning"
                            >
                              <Sparkles class="size-3.5 shrink-0" aria-hidden="true" />Special
                              combination available
                            </p>{/if}
                        </div>
                      </div>
                      <div class="mt-2 flex flex-wrap justify-end gap-2">
                        <button
                          class="control-button"
                          aria-label={'Move ' +
                            labels.get(entry.instanceId) +
                            ', ' +
                            card.name +
                            ' to ' +
                            (group.zone === 'hand' ? 'Summoning Area' : 'Hand')}
                          onclick={() =>
                            move(entry.instanceId, group.zone === 'hand' ? 'summoning' : 'hand')}
                          >{group.zone === 'hand' ? 'To Summoning Area' : 'To Hand'}</button
                        >
                        <button
                          class="control-button"
                          aria-label={'Duplicate ' +
                            labels.get(entry.instanceId) +
                            ', ' +
                            card.name}
                          onclick={() => add(card.id, group.zone)}>Copy</button
                        >
                        <button
                          class="control-button"
                          aria-label={'Remove ' + labels.get(entry.instanceId) + ', ' + card.name}
                          onclick={() => remove(entry.instanceId)}>Remove</button
                        >
                      </div>
                    </li>
                  {/each}
                </ol>
              {:else}
                <p class="my-4 text-sm text-muted-foreground">
                  {group.zone === 'hand'
                    ? 'Add the cards in your hand to find what they can produce.'
                    : 'Add cards already on your field to explore field-assisted combinations.'}
                </p>
              {/if}
            </section>
          {/each}
        </div>
        <details class="mb-5 min-w-0 rounded-lg border border-border bg-surface p-3">
          <summary class="cursor-pointer text-sm font-semibold text-primary"
            >Choose cards from a saved deck</summary
          >
          <p class="my-2 text-xs text-muted-foreground">
            Choose the cards actually in your Hand or Field; loading a deck never adds all 40 to
            Hand and does not change the saved deck or your collection.
          </p>
          {#if deckStorageWarning}
            <p class="warning-note" role="alert">{deckStorageWarning}</p>
          {/if}
          <div class="my-3 flex flex-wrap items-center gap-2">
            <label class="min-w-0 flex-1 text-xs text-muted-foreground">
              Saved deck
              <select class="native-filter mt-1 block w-full" bind:value={selectedDeckId}>
                {#each savedDecks as deck (deck.id)}
                  <option value={deck.id}>{deck.name} · {deck.cardIds.length}/40</option>
                {/each}
              </select>
            </label>
            <button class="control-button mt-4" type="button" onclick={loadSavedDecks}
              >Refresh decks</button
            >
          </div>
          {#if selectedDeck}
            {#if selectedDeck.cardIds.length !== 40}
              <p class="mb-2 text-xs text-warning">
                This preset contains {selectedDeck.cardIds.length} cards, not 40.
                <a class="text-link" href="/collection/">Manage deck and reserve</a>.
              </p>
            {/if}
            <input
              class="native-filter mb-2 w-full"
              aria-label="Search cards in selected deck"
              placeholder="Find a card in this deck…"
              type="search"
              bind:value={deckSearch}
            />
            <div class="max-h-80 overflow-y-auto">
              <ul class="m-0 grid list-none gap-2 p-0">
                {#each deckCards as entry (entry.id)}
                  {@const entered = occurrences.filter((card) => card.cardId === entry.id).length}
                  <li class="flex min-w-0 flex-wrap items-center gap-2 border-b border-border py-2">
                    <div class="w-12 shrink-0 overflow-hidden rounded-sm">
                      <CardArtwork
                        image={entry.card.image}
                        name={entry.card.name}
                        cardId={entry.id}
                        decorative
                      />
                    </div>
                    <div class="min-w-0 flex-1 text-xs">
                      <strong class="block break-words">{entry.card.name}</strong>
                      <span class="text-muted-foreground">
                        #{String(entry.id).padStart(3, '0')} · {entered}/{entry.count} selected
                      </span>
                    </div>
                    <button
                      class="control-button"
                      disabled={entered >= entry.count || hand.length >= 5}
                      aria-label={'Add ' + entry.card.name + ' from deck to Hand'}
                      onclick={() => addDeckOccurrence(entry.id, 'hand')}>+ Hand</button
                    >
                    <button
                      class="control-button"
                      disabled={entered >= entry.count}
                      aria-label={'Add ' + entry.card.name + ' from deck to Summoning Area'}
                      onclick={() => addDeckOccurrence(entry.id, 'summoning')}>+ Field</button
                    >
                  </li>
                {/each}
              </ul>
              {#if !deckCards.length}
                <p class="text-xs text-muted-foreground">No matching cards in this deck.</p>
              {/if}
            </div>
          {:else}
            <p class="text-xs text-muted-foreground">
              No saved deck available. <a class="text-link" href="/decks/"
                >Create or import a deck</a
              >.
            </p>
          {/if}
        </details>
        <p class="mb-2 mt-4 text-xs leading-relaxed text-muted-foreground">
          Unlimited inputs for planning; this is not an in-game five-card hand simulation. Copies
          are separate. Fusion previews do not consume cards; choosing "Summon result" applies a
          recipe to this planner, removes only its source occurrences, and adds its result to
          Summoning Area. This does not perform an action in the game.
        </p>
        <details class="text-xs leading-relaxed text-muted-foreground">
          <summary class="cursor-pointer py-1 font-medium">Gameplay scope</summary>
          <p>
            Hand chains combine two cards, then the result with each next card in order.
            Field-assisted chains start with a field monster and add Hand cards. Field pairs need
            legal movement. Summoning Area entries are candidate field cards, not a modeled board or
            occupied square.
          </p>
          <p>
            Board positions, movement, capacity, failed-fusion discards, rituals, ordinary equip
            bonuses, and random transformation results are not simulated. Hand-chain-to-field timing
            and longer sequences involving multiple field cards are not evaluated.
          </p>
          <p>
            “No ordinary fusion” only describes this input set. The card may still have power-up,
            ritual, or other uses.
          </p>
          <a
            class="text-link"
            href="https://www.videogamemanual.com/PS2/Yu-Gi-Oh%21%20The%20Duelists%20of%20the%20Roses%20%28USA%29.pdf"
            target="_blank"
            rel="noreferrer">US PS2 manual · Combos, p. 34</a
          >
        </details>
      </section>

      <section aria-labelledby="results-heading" class="min-w-0">
        <div class="mb-4 border-b border-border pb-4">
          <h2 id="results-heading" class="mb-1 mt-0 text-lg font-semibold">
            Fusion results <span class="number text-sm font-normal text-muted-foreground"
              >{discovery.results.length}</span
            >
          </h2>
          <p class="m-0 text-sm text-muted-foreground" role="status" aria-live="polite">
            {occurrences.length} input cards · {discovery.complete ? '' : 'at least '}{usable} usable
            in ordinary fusions · {discovery.complete
              ? occurrences.length - usable + ' without ordinary combinations'
              : unevaluated + ' not fully evaluated'}
          </p>
          {#if !discovery.complete}
            <div class="warning-note mt-3" role="status">
              <p class="m-0 font-semibold">Partial results · Not fully evaluated</p>
              {#if discovery.limits.includes('budget')}<p class="mb-0 mt-1">
                  The {discovery.maxChecks.toLocaleString()}-check search budget was reached. Found
                  recipes remain available; more may exist. Try fewer inputs for a complete search.
                </p>{/if}
              {#if discovery.limits.includes('field-sequences')}<p class="mb-0 mt-1">
                  Hand-chain-to-field and longer sequences involving multiple field cards are not
                  evaluated. Unproven cards remain undetermined.
                </p>{/if}
              {#if discovery.limits.includes('random')}<p class="mb-0 mt-1">
                  An available Insect Imitation pair has a random, unresolved outcome. No result or
                  subsequent fusion is inferred.
                </p>{/if}
            </div>
          {/if}
        </div>
        <DuelStrategyAdvisor {cards} {discovery} {occurrences} onviewfusion={viewSuggestedResult} />
        {#if discovery.results.length > 1 && suggestedPlays.length}
          <section
            class="mb-5 rounded-lg border border-border bg-surface p-3"
            aria-label="Suggested fusion plays"
          >
            <h3 class="m-0 text-base font-semibold">Suggested Plays</h3>
            <p class="mb-3 mt-1 text-xs leading-relaxed text-muted-foreground">
              Top confirmed results by known ATK, then fewer materials. Select a result to see its
              steps and Summon action below. This does not account for the opponent or terrain.
            </p>
            {#if !discovery.complete}
              <p class="mb-3 text-xs text-warning">
                Partial search: undiscovered fusion options may exist.
              </p>
            {/if}
            <ol class="m-0 grid list-none gap-2 p-0">
              {#each suggestedPlays as play, index (play.resultCardId)}
                {@const card = cardById.get(play.resultCardId)!}
                <li>
                  <button
                    type="button"
                    class="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface p-2 text-left hover:border-primary hover:bg-selected"
                    aria-label={'View ' + card.name + ' fusion result and its recipe'}
                    onclick={() => viewSuggestedResult(play.resultCardId)}
                  >
                    <span class="min-w-0 text-sm">
                      <span class="mr-2 text-xs font-semibold text-primary">#{index + 1}</span>
                      <strong>{card.name}</strong>
                      <span class="text-xs text-muted-foreground">
                        · #{String(card.id).padStart(3, '0')}
                      </span>
                    </span>
                    <span class="text-xs text-muted-foreground">
                      ATK {play.atk ?? 'unknown'} · {play.recipe.instanceIds.length} materials ·
                      {occurrences.length - play.recipe.instanceIds.length} unused
                      <span class="ml-1 font-semibold text-primary">View →</span>
                    </span>
                  </button>
                </li>
              {/each}
            </ol>
          </section>
        {/if}
        {#if discovery.results.length}
          <div class="mb-5 flex flex-wrap items-end gap-3">
            <label class="min-w-0 flex-1 text-xs text-muted-foreground"
              >Find a result
              <input
                class="native-filter mt-1 w-full"
                type="search"
                bind:value={filter}
                placeholder="Name or card ID"
              />
            </label>
            <label class="text-xs text-muted-foreground"
              >Sort results
              <select class="native-filter mt-1 block max-w-full" bind:value={sort}>
                <option value="atk">Highest ATK</option><option value="materials"
                  >Fewest materials</option
                ><option value="name">Card name</option><option value="id">Card ID</option>
              </select>
            </label>
          </div>
          {#if !sortedResults.length}<p class="text-sm text-muted-foreground">
              No results match this search. <button class="text-link" onclick={() => (filter = '')}
                >Clear result search</button
              >
            </p>{/if}
          {#each sortedResults as result (result.resultCardId)}<FusionResultCard
              {result}
              {cardById}
              {labels}
              onapply={applyFusion}
              recommended={result.resultCardId === topResultId}
              onlyResult={discovery.results.length === 1}
              partial={!discovery.complete}
            />{/each}
        {:else}
          <div class="py-8">
            <h3 class="mb-2 mt-0 text-base font-semibold">
              {occurrences.length < 2
                ? 'What can your cards become?'
                : discovery.complete
                  ? 'No ordinary fusions with these cards'
                  : 'No ordinary fusions found yet'}
            </h3>
            <p class="m-0 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {occurrences.length < 2
                ? 'Add at least two cards. Direct fusions, longer chains, and each card’s compatibility will appear here automatically.'
                : discovery.complete
                  ? 'Every supported ordinary sequence has been checked. Try adding another available card; these cards may still be useful for power-ups, rituals, or other game actions.'
                  : 'The search is incomplete within the displayed limits. These cards cannot be declared incompatible.'}
            </p>
          </div>
        {/if}
        {#if specialResults.length}
          <section class="mt-6" aria-labelledby="special-heading">
            <h2 id="special-heading" class="mb-1 text-lg font-semibold">Special combinations</h2>
            <p class="mb-4 mt-0 text-xs leading-relaxed text-muted-foreground">
              Known deterministic power-up transformations for exact available pairs. Separate from
              ordinary fusion; equip bonuses and subsequent chains are not evaluated.
            </p>
            {#each specialResults as result (result.resultCardId)}<FusionResultCard
                {result}
                {cardById}
                {labels}
                special
              />{/each}
          </section>
        {/if}
      </section>
    </div>
  </div>
  {#if recipesActivated}
    <div hidden={mode !== 'recipes'} class="fusion-recipe-view">
      <FusionEncyclopedia {cards} {fusionData} ontrymaterials={loadRecipeMaterials} />
    </div>
  {/if}
  <dialog
    bind:this={replacementDialog}
    class="recipe-replace-dialog"
    aria-labelledby="recipe-replace-title"
    aria-describedby="recipe-replace-description"
    onclose={() => (pendingRecipe = null)}
  >
    <div class="replace-dialog-inner">
      <div class="replace-dialog-head">
        <div class="replace-dialog-icon"><Sparkles class="size-5" aria-hidden="true" /></div>
        <div>
          <h2 id="recipe-replace-title">Replace your current cards?</h2>
          <p id="recipe-replace-description">
            Load this fusion recipe into Workbench and replace the current Hand and Summoning Area.
          </p>
        </div>
      </div>
      <div class="replace-dialog-preview">
        <div class="replace-preview-row">
          <span>Current planner</span>
          <strong>{hand.length} Hand · {summoning.length} Field</strong>
        </div>
        <div class="replace-preview-divider" aria-hidden="true">↓</div>
        <div class="replace-preview-row">
          <span>Selected recipe</span>
          <strong>{pendingRecipe?.length ?? 0} cards → Hand</strong>
        </div>
        {#if pendingRecipe}
          <ul class="replace-materials" aria-label="Recipe materials">
            {#each pendingRecipe as entry (entry.instanceId)}
              <li>{cardById.get(entry.cardId)?.name ?? 'Unknown card'}</li>
            {/each}
          </ul>
        {/if}
      </div>
      <p class="replace-dialog-note">
        Only this temporary planner changes. Saved decks and Collection remain untouched.
      </p>
      <div class="replace-dialog-actions">
        <button type="button" class="replace-cancel" bind:this={cancelReplacementButton}
          onclick={cancelRecipeReplacement}>Cancel</button>
        <button type="button" class="replace-confirm" onclick={confirmRecipeReplacement}
          disabled={!pendingRecipe}>Replace Cards</button>
      </div>
    </div>
  </dialog>
</section>

<style>
  .recipe-replace-dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    width: min(460px, calc(100% - 2rem));
    max-height: min(85vh, 640px);
    overflow: auto;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    color: var(--foreground);
    box-shadow: 0 24px 70px #0008;
  }
  .recipe-replace-dialog::backdrop {
    background: rgb(10 9 15 / 64%);
  }
  .replace-dialog-inner {
    display: grid;
    gap: 1.15rem;
    padding: clamp(1.15rem, 3vw, 1.65rem);
  }
  .replace-dialog-head {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
  }
  .replace-dialog-icon {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    flex-shrink: 0;
    border-radius: 10px;
    background: var(--selected);
    color: var(--primary);
  }
  .replace-dialog-head h2 {
    margin: 0;
    font-size: 1.12rem;
    line-height: 1.35;
    font-weight: 700;
  }
  .replace-dialog-head p {
    margin: 0.4rem 0 0;
    color: var(--muted-foreground);
    font-size: 0.84rem;
    line-height: 1.55;
  }
  .replace-dialog-preview {
    display: grid;
    gap: 0.65rem;
    padding: 0.9rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--elevated);
  }
  .replace-preview-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.79rem;
  }
  .replace-preview-row span {
    color: var(--muted-foreground);
  }
  .replace-preview-row strong {
    font-weight: 700;
  }
  .replace-preview-divider {
    color: var(--primary);
    font-size: 0.85rem;
    line-height: 1;
    text-align: center;
  }
  .replace-materials {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .replace-materials li {
    max-width: 100%;
    overflow-wrap: anywhere;
    border: 1px solid var(--border);
    border-radius: 5px;
    background: var(--surface);
    padding: 0.25rem 0.55rem;
    font-size: 0.72rem;
    font-weight: 600;
  }
  .replace-dialog-note {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.77rem;
    line-height: 1.5;
  }
  .replace-dialog-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.6rem;
  }
  .replace-dialog-actions button {
    min-height: 42px;
    border-radius: 7px;
    padding: 0.5rem 1rem;
    font-size: 0.84rem;
    font-weight: 650;
  }
  .replace-cancel {
    border: 1px solid var(--border);
    background: var(--elevated);
    color: var(--foreground);
  }
  .replace-cancel:hover {
    background: var(--hover);
  }
  .replace-confirm {
    border: 1px solid var(--primary);
    background: var(--primary);
    color: var(--primary-foreground);
  }
  .replace-confirm:hover:not(:disabled) {
    filter: brightness(0.94);
  }
  .replace-confirm:disabled {
    opacity: 0.5;
  }
  @media (max-width: 430px) {
    .replace-dialog-actions button {
      flex: 1;
    }
  }
  .fusion-modes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.4rem;
  }
  .fusion-modes button {
    padding: 0.65rem 1rem;
    border-radius: 7px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--muted-foreground);
    font-size: 0.875rem;
    font-weight: 650;
  }
  .fusion-modes button.active {
    background: var(--selected);
    border-color: var(--border);
    color: var(--primary);
  }
  .fusion-modes button:hover:not(.active) {
    background: var(--hover);
    color: var(--foreground);
  }
  .fusion-workbench-view[hidden],
  .fusion-recipe-view[hidden] {
    display: none;
  }

  :global(.control-button) {
    min-height: 32px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    padding: 0.25rem 0.5rem;
    color: var(--foreground);
    font-size: 0.75rem;
  }
  :global(.control-button:hover:not(:disabled)) {
    background: var(--hover);
    border-color: var(--primary);
  }
  :global(.control-button:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
