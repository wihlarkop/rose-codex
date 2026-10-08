<script lang="ts">
  import CardPicker from '../../components/cards/CardPicker.svelte';
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import CardFlipTile from '../../components/cards/CardFlipTile.svelte';
  import { createFusionEngine } from '../../lib/dotr/fusion';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import type { Card, FusionData } from '../../lib/dotr/model';

  type Zone = 'hand' | 'summoning';
  type Occurrence = { instanceId: string; cardId: number; zone: Zone };
  let {
    cards,
    canonicalCards,
    fusionData,
  }: { cards: BrowserCard[]; canonicalCards: Card[]; fusionData: FusionData } = $props();

  // Capture the static route payload once for this island.
  function createIslandData() {
    return {
      engine: createFusionEngine(canonicalCards, fusionData),
      cardById: new Map(cards.map((card) => [card.id, card])),
    };
  }
  const { engine, cardById } = createIslandData();
  let occurrences = $state<Occurrence[]>([]);
  let chainIds = $state<string[]>([]);
  let directLeftId = $state('');
  let directRightId = $state('');

  const allOptions = $derived(
    occurrences.flatMap((occurrence) => {
      const card = cardById.get(occurrence.cardId);
      return card ? [{ ...occurrence, card }] : [];
    }),
  );
  const unknownOccurrences = $derived(
    occurrences.filter((occurrence) => !cardById.has(occurrence.cardId)),
  );
  const hand = $derived(allOptions.filter((entry) => entry.zone === 'hand'));
  const summoning = $derived(allOptions.filter((entry) => entry.zone === 'summoning'));
  const directLeft = $derived(
    allOptions.find((entry) => entry.instanceId === directLeftId) ?? allOptions[0],
  );
  const directRight = $derived(
    allOptions.find((entry) => entry.instanceId === directRightId) ?? allOptions[1],
  );
  const directResult = $derived(
    directLeft && directRight && directLeft.instanceId !== directRight.instanceId
      ? engine.fuse(directLeft.cardId, directRight.cardId)
      : null,
  );
  const orderedChain = $derived(
    chainIds
      .map((instanceId) => allOptions.find((entry) => entry.instanceId === instanceId))
      .filter((entry) => entry !== undefined),
  );
  const chainResult = $derived(
    orderedChain.length >= 2 ? engine.chain(orderedChain.map((entry) => entry.cardId)) : null,
  );

  function optionLabel(entry: (typeof allOptions)[number]) {
    const zoneEntries = entry.zone === 'hand' ? hand : summoning;
    const zoneName = entry.zone === 'hand' ? 'Hand' : 'Summoning Area';
    const position =
      zoneEntries.findIndex((candidate) => candidate.instanceId === entry.instanceId) + 1;
    return `${entry.card.name} · ${zoneName} occurrence ${position} · #${String(entry.cardId).padStart(3, '0')}`;
  }

  function add(cardId: number, zone: Zone) {
    const instanceId = crypto.randomUUID();
    occurrences = [...occurrences, { instanceId, cardId, zone }];
    if (!directLeftId) directLeftId = instanceId;
    else if (!directRightId && directLeftId !== instanceId) directRightId = instanceId;
  }

  function remove(instanceId: string) {
    occurrences = occurrences.filter((entry) => entry.instanceId !== instanceId);
    chainIds = chainIds.filter((id) => id !== instanceId);
    if (directLeftId === instanceId) directLeftId = '';
    if (directRightId === instanceId) directRightId = '';
  }

  function move(instanceId: string, zone: Zone) {
    occurrences = occurrences.map((entry) =>
      entry.instanceId === instanceId ? { ...entry, zone } : entry,
    );
  }

  function reorderZone(zone: Zone, instanceId: string, delta: number) {
    const ids = occurrences.filter((entry) => entry.zone === zone).map((entry) => entry.instanceId);
    const from = ids.indexOf(instanceId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to]!, ids[from]!];
    let index = 0;
    occurrences = occurrences.map((entry) =>
      entry.zone === zone
        ? occurrences.find((candidate) => candidate.instanceId === ids[index++])!
        : entry,
    );
  }

  function addToChain(instanceId: string) {
    if (!chainIds.includes(instanceId)) chainIds = [...chainIds, instanceId];
  }

  function removeFromChain(instanceId: string) {
    chainIds = chainIds.filter((id) => id !== instanceId);
  }

  function reorderChain(instanceId: string, delta: number) {
    const from = chainIds.indexOf(instanceId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= chainIds.length) return;
    const next = [...chainIds];
    [next[from], next[to]] = [next[to]!, next[from]!];
    chainIds = next;
  }

  function cardFor(id: number) {
    return cardById.get(id);
  }
</script>

<section aria-label="Fusion workspace">
  <header class="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="m-0 text-2xl font-semibold tracking-tight">Fusion Workspace</h1>
      <p class="mb-0 mt-1 max-w-3xl text-sm text-muted-foreground">
        Organize card occurrences and preview ordinary fusions from the canonical DotR table.
      </p>
    </div>
    <p
      class="m-0 max-w-xl rounded-md border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-muted-foreground"
    >
      Hand and Summoning Area are planning labels. The workspace does not model game capacity,
      failed-fusion discards, equips, rituals, or random outcomes. Previews never consume cards.
    </p>
  </header>

  {#if unknownOccurrences.length}
    <p
      class="mb-4 rounded-md border border-warning bg-surface p-3 text-sm text-warning"
      role="alert"
    >
      Some workspace occurrences reference unknown canonical card IDs and are excluded from
      previews.
    </p>
  {/if}

  <div class="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(25rem,.8fr)]">
    <section aria-labelledby="zones-heading" class="min-w-0">
      <h2 id="zones-heading" class="mb-3 text-lg font-semibold">Planning zones</h2>
      <div class="grid gap-4 md:grid-cols-2">
        {#each [{ zone: 'hand' as Zone, title: 'Hand', entries: hand }, { zone: 'summoning' as Zone, title: 'Summoning Area', entries: summoning }] as group (group.zone)}
          <section
            class="rounded-lg border border-border bg-surface p-3"
            aria-labelledby={'zone-' + group.zone}
          >
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 id={'zone-' + group.zone} class="m-0 text-base font-semibold">{group.title}</h3>
                <p class="mb-0 mt-0.5 text-xs text-muted-foreground">
                  {group.entries.length}
                  {group.entries.length === 1 ? 'occurrence' : 'occurrences'}
                </p>
              </div>
              <CardPicker
                {cards}
                label={'Add to ' + group.title}
                onselect={(cardId) => add(cardId, group.zone)}
              />
            </div>
            {#if group.entries.length}
              <ol class="m-0 grid list-none gap-2 p-0">
                {#each group.entries as entry, index (entry.instanceId)}
                  <li
                    class="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-border bg-background p-2"
                  >
                    <div class="w-14 shrink-0 overflow-hidden rounded-sm">
                      <CardArtwork
                        image={entry.card.image}
                        name={entry.card.name}
                        cardId={entry.cardId}
                        decorative
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="m-0 truncate text-sm font-medium">{entry.card.name}</p>
                      <p class="m-0 text-xs text-muted-foreground">
                        #{String(entry.cardId).padStart(3, '0')} · {entry.card.kind === 'monster'
                          ? entry.card.monsterType
                          : entry.card.kind}
                        · {group.title}
                        {index + 1}/{group.entries.length}
                      </p>
                    </div>
                    <div
                      class="ml-auto flex w-full min-w-0 flex-wrap justify-end gap-1 sm:w-auto sm:shrink-0"
                    >
                      <button
                        class="control-button"
                        aria-label={'Move ' +
                          entry.card.name +
                          ' to ' +
                          (group.zone === 'hand' ? 'Summoning Area' : 'Hand')}
                        onclick={() =>
                          move(entry.instanceId, group.zone === 'hand' ? 'summoning' : 'hand')}
                        >Move</button
                      >
                      <button
                        class="control-button"
                        aria-label={'Move ' + entry.card.name + ' earlier in ' + group.title}
                        disabled={index === 0}
                        onclick={() => reorderZone(group.zone, entry.instanceId, -1)}>↑</button
                      >
                      <button
                        class="control-button"
                        aria-label={'Move ' + entry.card.name + ' later in ' + group.title}
                        disabled={index === group.entries.length - 1}
                        onclick={() => reorderZone(group.zone, entry.instanceId, 1)}>↓</button
                      >
                      {#if !chainIds.includes(entry.instanceId)}<button
                          class="control-button"
                          aria-label={'Add ' + entry.card.name + ' to fusion chain'}
                          onclick={() => addToChain(entry.instanceId)}>Chain +</button
                        >{/if}
                      <button
                        class="control-button danger"
                        aria-label={'Remove ' + entry.card.name + ' occurrence'}
                        onclick={() => remove(entry.instanceId)}>Remove</button
                      >
                    </div>
                  </li>
                {/each}
              </ol>
            {:else}
              <p class="empty-state">
                No cards here yet. Use the picker to add an occurrence; the same card can be added
                more than once.
              </p>
            {/if}
          </section>
        {/each}
      </div>
    </section>

    <section aria-labelledby="preview-heading" class="min-w-0">
      <h2 id="preview-heading" class="mb-3 text-lg font-semibold">Ordinary fusion previews</h2>
      <section
        class="mb-4 rounded-lg border border-border bg-surface p-3"
        aria-labelledby="direct-heading"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id="direct-heading" class="m-0 text-base font-semibold">Two-card preview</h3>
          <span class="text-xs text-muted-foreground"
            >Order does not affect ordinary fusion lookup</span
          >
        </div>
        {#if allOptions.length < 2}
          <p class="empty-state">Add at least two card occurrences to preview a pair.</p>
        {:else}
          <div class="mb-3 grid gap-2 sm:grid-cols-2">
            <label class="field-label"
              >First occurrence<select
                class="native-select"
                value={directLeft?.instanceId ?? ''}
                onchange={(event) => (directLeftId = event.currentTarget.value)}
                aria-label="First occurrence for two-card preview"
                >{#each allOptions as entry (entry.instanceId)}<option value={entry.instanceId}
                    >{optionLabel(entry)}</option
                  >{/each}</select
              ></label
            >
            <label class="field-label"
              >Second occurrence<select
                class="native-select"
                value={directRight?.instanceId ?? ''}
                onchange={(event) => (directRightId = event.currentTarget.value)}
                aria-label="Second occurrence for two-card preview"
                >{#each allOptions as entry (entry.instanceId)}<option value={entry.instanceId}
                    >{optionLabel(entry)}</option
                  >{/each}</select
              ></label
            >
          </div>
          {#if directLeft && directRight && directLeft.instanceId === directRight.instanceId}
            <p class="empty-state" role="status">
              Choose two separate occurrences, including two copies of the same card if available.
            </p>
          {:else if directLeft && directRight}
            <div class="preview-row">
              <div class="preview-material">
                <CardFlipTile
                  card={directLeft.card}
                  id={'fusion-direct-left-' + directLeft.instanceId}
                />
              </div>
              <span class="operator" aria-hidden="true">+</span>
              <div class="preview-material">
                <CardFlipTile
                  card={directRight.card}
                  id={'fusion-direct-right-' + directRight.instanceId}
                />
              </div>
              <span class="operator" aria-hidden="true">→</span>
              {#if directResult !== null && cardFor(directResult)}
                <div class="preview-material result">
                  <p class="result-label">Fusion result</p>
                  <CardFlipTile card={cardFor(directResult)!} id="fusion-direct-result" />
                </div>
              {:else}
                <p class="no-result" role="status">No ordinary fusion is recorded for this pair.</p>
              {/if}
            </div>
          {/if}
        {/if}
        <p class="mb-0 mt-3 text-xs text-muted-foreground">
          Special power-ups, Insect Imitation, and their outcomes are not evaluated here.
        </p>
      </section>

      <section
        class="rounded-lg border border-border bg-surface p-3"
        aria-labelledby="chain-heading"
      >
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 id="chain-heading" class="m-0 text-base font-semibold">Ordered fusion chain</h3>
            <p class="mb-0 mt-0.5 text-xs text-muted-foreground">
              Add occurrences from either zone, then adjust this order.
            </p>
          </div>
          <button class="control-button" disabled={!chainIds.length} onclick={() => (chainIds = [])}
            >Clear chain</button
          >
        </div>
        {#if orderedChain.length}
          <ol class="m-0 mb-3 grid list-none gap-1.5 p-0">
            {#each orderedChain as entry, index (entry.instanceId)}
              <li
                class="flex min-w-0 items-center gap-2 rounded-md border border-border bg-background p-2"
              >
                <span class="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground"
                  >{index + 1}</span
                >
                <div class="w-9 shrink-0 overflow-hidden rounded-sm">
                  <CardArtwork
                    image={entry.card.image}
                    name={entry.card.name}
                    cardId={entry.cardId}
                    decorative
                  />
                </div>
                <span class="min-w-0 flex-1 truncate text-sm">{entry.card.name}</span>
                <button
                  class="control-button"
                  aria-label={'Move ' + entry.card.name + ' earlier in fusion chain'}
                  disabled={index === 0}
                  onclick={() => reorderChain(entry.instanceId, -1)}>↑</button
                ><button
                  class="control-button"
                  aria-label={'Move ' + entry.card.name + ' later in fusion chain'}
                  disabled={index === orderedChain.length - 1}
                  onclick={() => reorderChain(entry.instanceId, 1)}>↓</button
                ><button
                  class="control-button"
                  aria-label={'Remove ' + entry.card.name + ' from fusion chain'}
                  onclick={() => removeFromChain(entry.instanceId)}>Remove</button
                >
              </li>
            {/each}
          </ol>
        {:else}
          <p class="empty-state mb-3">
            Your chain is empty. Add an occurrence with “Chain +” from either planning zone.
          </p>
        {/if}
        {#if orderedChain.length === 1}
          <p class="empty-state mb-3">Add another occurrence to preview a chain.</p>
        {/if}
        {#if chainResult}
          {#if chainResult.steps.length}
            <ol
              class="m-0 grid list-none gap-3 p-0"
              aria-label="Successful intermediate fusion results"
            >
              {#each chainResult.steps as step, index (`${index}-${step.resultCardId}`)}
                {@const resultCard = cardFor(step.resultCardId)}
                {#if resultCard}<li class="chain-result">
                    <p class="result-label">
                      Step {index + 1} · {cardFor(step.materials[0])?.name} + {cardFor(
                        step.materials[1],
                      )?.name}
                    </p>
                    <div class="chain-card">
                      <CardFlipTile
                        card={resultCard}
                        id={'fusion-chain-step-' + index + '-' + step.resultCardId}
                      />
                    </div>
                  </li>{/if}
              {/each}
            </ol>
          {/if}
          {#if chainResult.status === 'no-fusion'}
            {@const next = orderedChain[chainResult.at]}
            {@const current = cardFor(chainResult.resultCardId)}
            <div class="failure-panel" role="status">
              <strong>Chain stopped at step {chainResult.at}.</strong><span
                >No ordinary fusion for the current result and next occurrence. This preview does
                not decide what the game discards.</span
              >
              {#if current && next}<div class="failure-pair">
                  <div class="chain-card">
                    <p class="result-label">Current result</p>
                    <CardFlipTile
                      card={current}
                      id={'fusion-chain-failed-current-' + next.instanceId}
                    />
                  </div>
                  <span class="operator" aria-hidden="true">+</span>
                  <div class="chain-card">
                    <p class="result-label">Next occurrence</p>
                    <CardFlipTile
                      card={next.card}
                      id={'fusion-chain-failed-next-' + next.instanceId}
                    />
                  </div>
                </div>{/if}
            </div>
          {:else if chainResult.status === 'complete' && cardFor(chainResult.resultCardId)}
            {@const finalCard = cardFor(chainResult.resultCardId)!}
            <div class="mt-3 border-t border-border pt-3">
              <p class="result-label">Final chain result</p>
              <div class="chain-card">
                <CardFlipTile card={finalCard} id={'fusion-chain-final-' + finalCard.id} />
              </div>
            </div>
          {/if}
        {/if}
        <p class="mb-0 mt-3 text-xs text-muted-foreground">
          Successful steps use the canonical ordinary-fusion table. A preview does not remove
          materials or determine failed-chain consumption.
        </p>
      </section>
    </section>
  </div>
</section>

<style>
  .control-button {
    min-height: 2rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    padding: 0.35rem 0.55rem;
    color: var(--foreground);
    font: inherit;
    font-size: 0.7rem;
    cursor: pointer;
  }
  .control-button:hover:not(:disabled) {
    border-color: var(--primary);
    color: var(--primary);
  }
  .control-button:focus-visible,
  .native-select:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  .control-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .control-button.danger {
    color: var(--warning);
  }
  .empty-state {
    margin: 0;
    border-radius: var(--radius);
    background: var(--background);
    padding: 0.75rem;
    color: var(--muted-foreground);
    font-size: 0.8rem;
    line-height: 1.45;
  }
  .field-label {
    display: grid;
    gap: 0.35rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .native-select {
    min-height: 2.5rem;
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--background);
    padding: 0.4rem 0.55rem;
    color: var(--foreground);
    font: inherit;
    font-size: 0.8rem;
  }
  .preview-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
  }
  .preview-material {
    width: min(100%, 10rem);
  }
  .preview-material :global(.card-tile) {
    height: 13rem;
  }
  .preview-material.result {
    border-left: 1px solid var(--border);
    padding-left: 0.6rem;
  }
  .operator {
    color: var(--muted-foreground);
    font-size: 1.2rem;
    font-weight: 600;
  }
  .no-result {
    margin: 0;
    max-width: 12rem;
    color: var(--warning);
    font-size: 0.8rem;
  }
  .result-label {
    margin: 0 0 0.4rem;
    color: var(--muted-foreground);
    font-size: 0.7rem;
    font-weight: 600;
  }
  .chain-result {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-top: 1px solid var(--border);
    padding-top: 0.7rem;
  }
  .chain-result .chain-card {
    width: 8rem;
  }
  .chain-card :global(.card-tile) {
    height: 12rem;
  }
  .failure-panel {
    display: grid;
    gap: 0.4rem;
    border: 1px solid var(--warning);
    border-radius: var(--radius);
    background: var(--background);
    padding: 0.75rem;
    font-size: 0.8rem;
  }
  .failure-pair {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.35rem;
  }
  .failure-pair .chain-card {
    width: 8rem;
  }
  @media (max-width: 640px) {
    .preview-row {
      align-items: flex-start;
    }
    .preview-material {
      width: calc(50% - 1.2rem);
    }
    .preview-material.result {
      border-left: 0;
      padding-left: 0;
    }
  }
</style>
