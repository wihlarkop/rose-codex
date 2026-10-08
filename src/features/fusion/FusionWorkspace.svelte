<script lang="ts">
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import GitBranch from '@lucide/svelte/icons/git-branch';
  import CircleMinus from '@lucide/svelte/icons/circle-minus';
  import CircleHelp from '@lucide/svelte/icons/circle-help';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import CardPicker from '../../components/cards/CardPicker.svelte';
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import FusionResultCard from './FusionResultCard.svelte';
  import {
    createFusionDiscovery,
    type FusionOccurrence,
    type FusionResult,
    type FusionRecipe,
    type FusionZone,
  } from '../../lib/dotr/fusion-discovery';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import type { Card, FusionData } from '../../lib/dotr/model';

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
  let sort = $state('atk');
  let filter = $state('');
  const discovery = $derived(discover(occurrences));
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
  <header class="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 class="m-0 text-2xl font-semibold tracking-tight">Fusion Workspace</h1>
      <p class="mb-0 mt-1 text-sm text-muted-foreground">
        Enter your available cards. Fusions and compatibility update automatically.
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      {#if previousFusionInputs}
        <button type="button" class="control-button" onclick={undoFusion}>Undo last fusion</button>
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
              <CardPicker
                {cards}
                label={'Add to ' + group.title}
                onselect={(cardId) => add(cardId, group.zone)}
              />
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
                      <div class="w-16 shrink-0 overflow-hidden rounded-sm">
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
                        aria-label={'Duplicate ' + labels.get(entry.instanceId) + ', ' + card.name}
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
      <p class="mb-2 mt-4 text-xs leading-relaxed text-muted-foreground">
        Unlimited inputs for planning; this is not an in-game five-card hand simulation. Copies are
        separate. Fusion previews do not consume cards; choosing "Summon result" applies a recipe
        to this planner, removes only its source occurrences, and adds its result to Summoning Area.
        This does not perform an action in the game.
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
          {occurrences.length} input cards · {discovery.complete ? '' : 'at least '}{usable} usable in
          ordinary fusions · {discovery.complete
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
</section>

<style>
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
