<script lang="ts">
  import { onMount } from 'svelte';
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import { filterCards, type BrowserCard } from '../../lib/dotr/browser';
  import {
    buildFusionEncyclopedia,
    missingOwnedCopies,
    type EncyclopediaRecipe,
  } from '../../lib/dotr/fusion-encyclopedia';
  import type { FusionData } from '../../lib/dotr/model';
  import { handLink } from '../../lib/dotr/deck-simulation';
  import { COLLECTION_STORAGE_KEY, validateCollection } from '../decks/collection';

  let { cards, fusionData }: { cards: BrowserCard[]; fusionData: FusionData } = $props();

  const byId = $derived(new Map(cards.map((card) => [card.id, card])));
  const encyclopedia = $derived(buildFusionEncyclopedia(fusionData));
  const resultCards = $derived(
    encyclopedia.resultIds.flatMap((id) => {
      const card = byId.get(id);
      return card ? [card] : [];
    }),
  );

  let selectedId = $state<number | null>(24);
  let search = $state('');
  let materialSearch = $state('');
  let filter = $state('all');
  let displayed = $state(20);
  let owned = $state<Record<string, number> | null>(null);
  let collectionInfo = $state('Loading collection…');
  let collectionWarning = $state('');

  const resultMatches = $derived(
    search.trim()
      ? filterCards(resultCards, { query: search, kind: '', monsterType: '', attribute: '' })
      : [],
  );
  const selected = $derived(selectedId === null ? undefined : byId.get(selectedId));
  const ordinary = $derived(encyclopedia.ordinary.get(selectedId ?? -1) ?? []);
  const special = $derived(encyclopedia.special.get(selectedId ?? -1) ?? []);
  const readyCount = $derived(
    owned === null
      ? null
      : ordinary.filter((recipe) => missingOwnedCopies(recipe.materials, owned)?.length === 0).length,
  );
  const matchingMaterials = $derived(
    materialSearch.trim()
      ? new Set(
          filterCards(cards, {
            query: materialSearch,
            kind: '',
            monsterType: '',
            attribute: '',
          }).map((card) => card.id),
        )
      : null,
  );
  const filtered = $derived.by(() => {
    const rows = ordinary
      .map((recipe) => ({ recipe, missing: missingOwnedCopies(recipe.materials, owned) }))
      .filter(({ recipe, missing }) => {
        if (matchingMaterials !== null && !recipe.materials.some((id) => matchingMaterials.has(id)))
          return false;
        if (missing === null) return true;
        if (filter === 'ready') return missing.length === 0;
        if (filter === 'missing') return missing.length > 0;
        return true;
      });
    if (filter === 'all' && owned !== null)
      rows.sort((a, b) => Number(b.missing?.length === 0) - Number(a.missing?.length === 0));
    return rows;
  });
  const visible = $derived(filtered.slice(0, displayed));

  function selectResult(id: number) {
    selectedId = id;
    search = '';
    materialSearch = '';
    filter = 'all';
    displayed = 20;
  }

  function refreshCollection() {
    try {
      const raw = localStorage.getItem(COLLECTION_STORAGE_KEY);
      if (raw === null) {
        owned = null;
        collectionInfo = 'No recorded collection in this browser yet.';
      } else {
        owned = validateCollection(JSON.parse(raw), new Set(byId.keys())).owned;
        collectionInfo = 'Availability reflects your saved Collection copy counts.';
      }
      collectionWarning = '';
    } catch (error) {
      owned = null;
      collectionWarning =
        'Collection cannot be read safely; availability will stay unknown. ' +
        (error instanceof Error ? error.message : 'Unknown storage error.');
      collectionInfo = '';
    }
    filter = 'all';
    displayed = 20;
  }

  onMount(() => {
    refreshCollection();
    const requested = new URLSearchParams(window.location.search).get('card');
    if (requested && /^[0-9]{1,3}$/.test(requested)) {
      const id = Number(requested);
      if (encyclopedia.resultIds.includes(id)) selectResult(id);
    }
  });
</script>

<section aria-label="Fusion Encyclopedia">
  <header class="page-header">
    <div>
      <h1 class="page-title">Fusion Encyclopedia</h1>
      <p class="page-description">
        Pick a result card to see every recorded ordinary two-card fusion pair.
        Compare materials against the copies you own, then try a pair in Fusion Workspace.
      </p>
    </div>
    <a class="text-link text-sm" href="/fusion/">Open Fusion Workspace →</a>
  </header>

  <div class="lookup-layout">
    <section class="surface lookup" aria-label="Choose a fusion result">
      <label for="target-search" class="field-label">Find a result card</label>
      <input
        id="target-search"
        class="search-input"
        type="search"
        placeholder="Card name or ID, e.g. 024…"
        autocomplete="off"
        bind:value={search}
      />
      {#if search.trim()}
        <p class="helper" role="status">
          {resultMatches.length
            ? `${resultMatches.length} matching result ${resultMatches.length === 1 ? 'card' : 'cards'}`
            : 'No recorded fusion result matches that search.'}
          {#if resultMatches.length > 12} · Showing first 12; refine your search{/if}
        </p>
        <ul class="result-choices" aria-label="Matching fusion results">
          {#each resultMatches.slice(0, 12) as card (card.id)}
            <li>
              <button
                type="button"
                class="result-choice"
                aria-label={'View recipes for ' + card.name}
                onclick={() => selectResult(card.id)}
              >
                <span class="artwork"><CardArtwork image={card.image} name={card.name} cardId={card.id} decorative /></span>
                <span class="choice-name">{card.name}<small>#{String(card.id).padStart(3, '0')}</small></span>
                <span class="choice-count">{(encyclopedia.ordinary.get(card.id) ?? []).length} pairs</span>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="helper">
          Search {encyclopedia.resultIds.length} recorded result cards. Showing Thousand Dragon
          as a starting example.
        </p>
      {/if}
      <div class="collection-status">
        <strong>My Collection</strong>
        {#if collectionWarning}
          <p class="collection-warning" role="alert">{collectionWarning}</p>
        {:else}
          <p>{collectionInfo}</p>
        {/if}
        {#if owned === null}
          <a class="text-link" href="/collection/">Open Collection</a>
        {/if}
        <button type="button" class="small-button" onclick={refreshCollection}>
          Refresh collection
        </button>
      </div>
    </section>

    <div class="results-area">
      {#if selected}
        <section class="surface result-summary" aria-label="Selected result card">
          <div class="selected-artwork">
            <CardArtwork image={selected.image} name={selected.name} cardId={selected.id} decorative />
          </div>
          <div class="selected-info">
            <span class="eyebrow">Selected fusion result</span>
            <h2>{selected.name}</h2>
            <p class="helper">
              #{String(selected.id).padStart(3, '0')} · {selected.monsterType ?? selected.kind}
              · ATK {selected.atk ?? 'unknown'} / DEF {selected.def ?? 'unknown'}
            </p>
            <p class="recipe-count">
              <strong>{ordinary.length}</strong> ordinary two-card recipes
              {#if readyCount !== null}
                · <strong>{readyCount}</strong> have enough copies in Collection
              {/if}
              {#if special.length} · <strong>{special.length}</strong> special transformation{/if}
            </p>
          </div>
        </section>

        <section class="recipe-section" aria-label="Ordinary fusion recipes">
          <div class="section-heading">
            <div>
              <h2>Ordinary fusion pairs</h2>
              <p class="helper">
                Both materials are original card IDs. Each pair is a direct lookup from the
                recorded DotR fusion table, not an inferred type-based rule.
              </p>
            </div>
          </div>
          {#if ordinary.length}
            <div class="recipe-filters surface">
              <label>
                Find a material
                <input
                  class="search-input"
                  type="search"
                  placeholder="Material name or ID"
                  bind:value={materialSearch}
                  oninput={() => (displayed = 20)}
                />
              </label>
              {#if owned !== null}
                <label>
                  Collection status
                  <select class="search-input" bind:value={filter} onchange={() => (displayed = 20)}>
                    <option value="all">All recipes (ready first)</option>
                    <option value="ready">Have both materials</option>
                    <option value="missing">Missing materials</option>
                  </select>
                </label>
              {/if}
              <p class="helper" role="status">
                Showing {visible.length} of {filtered.length} matching recipes.
              </p>
            </div>
            {#if filtered.length}
              <ol class="recipe-list">
                {#each visible as row (row.recipe.materials.join('-'))}
                  {@const left = byId.get(row.recipe.materials[0])!}
                  {@const right = byId.get(row.recipe.materials[1])!}
                  <li class="surface recipe-row">
                    <div class="pair">
                      {#each [left, right] as card, index}
                        {#if index === 1}<span class="plus" aria-hidden="true">+</span>{/if}
                        <div class="ingredient">
                          <span class="artwork">
                            <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
                          </span>
                          <div class="ingredient-text">
                            <strong>{card.name}</strong>
                            <span>#{String(card.id).padStart(3, '0')}</span>
                            {#if owned !== null}
                              <span>{owned[String(card.id)] ?? 0} owned</span>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                    <div class="pair-actions">
                      {#if row.missing === null}
                        <span class="ownership">Ownership not tracked</span>
                      {:else if row.missing.length === 0}
                        <span class="ownership ready">Enough owned copies</span>
                      {:else}
                        <span class="ownership">
                          Missing {row.missing.map((part) => `${part.needed - part.owned} × ${byId.get(part.cardId)?.name ?? '#' + part.cardId}`).join(', ')}
                        </span>
                      {/if}
                      <a class="try-link" href={handLink(row.recipe.materials)}>Try in Fusion →</a>
                    </div>
                  </li>
                {/each}
              </ol>
              {#if displayed < filtered.length}
                <button type="button" class="show-more" onclick={() => (displayed += 20)}>
                  Show 20 more recipes ({filtered.length - displayed} remaining)
                </button>
              {/if}
            {:else}
              <p class="empty-message">
                No recipes match these filters. Try a different material or show all recipes.
              </p>
            {/if}
          {:else}
            <p class="empty-message">
              This card has no recorded ordinary two-card fusion recipe.
            </p>
          {/if}
        </section>

        {#if special.length}
          <section class="recipe-section" aria-label="Special transformations">
            <h2>Special transformations</h2>
            <p class="helper">
              Deterministic card changes from the separate transformation data.
              These are not ordinary fusion recipes or part of ordinary chains.
            </p>
            <ul class="recipe-list">
              {#each special as recipe (recipe.materials.join('-'))}
                <li class="surface special-row">
                  <span class="special-pair">
                    {byId.get(recipe.materials[0])?.name ?? '#' + recipe.materials[0]}
                    +
                    {byId.get(recipe.materials[1])?.name ?? '#' + recipe.materials[1]}
                  </span>
                  <span class="ownership">
                    {#if missingOwnedCopies(recipe.materials, owned) === null}
                      Ownership not tracked
                    {:else if missingOwnedCopies(recipe.materials, owned)?.length === 0}
                      Enough owned copies
                    {:else}
                      Missing materials
                    {/if}
                  </span>
                  <a class="try-link" href={handLink(recipe.materials)}>Check in Fusion →</a>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
        <p class="scope-note">
          Scope: all recorded **direct, ordinary two-card pairs** for this result;
          chains that first create an intermediate monster are not enumerated here.
          Use Fusion Workspace to explore chains from your actual Hand.
          Unresolved random transformations cannot be mapped to a specific target.
        </p>
      {:else}
        <div class="surface empty-message">Choose a result card to view its recipes.</div>
      {/if}
    </div>
  </div>
</section>

<style>
  .surface {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .lookup-layout {
    display: grid;
    grid-template-columns: minmax(15rem, 18rem) minmax(0, 1fr);
    align-items: start;
    gap: 1rem;
  }
  .lookup {
    min-width: 0;
    padding: 1rem;
  }
  .field-label {
    display: block;
    font-size: .8125rem;
    font-weight: 650;
    margin-bottom: .4rem;
  }
  .search-input {
    width: 100%;
    min-width: 0;
    padding: .6rem .7rem;
    background: var(--elevated);
    color: var(--foreground);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: .8125rem;
  }
  .helper {
    margin: .45rem 0;
    color: var(--muted-foreground);
    font-size: .75rem;
    line-height: 1.5;
  }
  .result-choices, .recipe-list {
    list-style: none;
    margin: .65rem 0 0;
    padding: 0;
  }
  .result-choices {
    display: grid;
    gap: .3rem;
    max-height: 26rem;
    overflow-y: auto;
  }
  .result-choice {
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .45rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--foreground);
    text-align: left;
  }
  .result-choice:hover {
    background: var(--selected);
    border-color: var(--primary);
  }
  .artwork {
    display: block;
    width: 3rem;
    flex: 0 0 3rem;
    border-radius: 4px;
    overflow: hidden;
  }
  .artwork :global(.card-artwork) {
    width: 100%;
  }
  .choice-name, .ingredient-text {
    display: grid;
    min-width: 0;
    gap: .1rem;
    font-size: .75rem;
  }
  .choice-name small, .ingredient-text span, .choice-count {
    color: var(--muted-foreground);
    font-size: .6875rem;
  }
  .choice-count {
    margin-left: auto;
    white-space: nowrap;
  }
  .collection-status {
    margin-top: 1rem;
    padding-top: .75rem;
    border-top: 1px solid var(--border);
    font-size: .8125rem;
  }
  .collection-status p {
    color: var(--muted-foreground);
    margin: .4rem 0;
    line-height: 1.5;
  }
  .collection-status .collection-warning {
    color: var(--warning);
  }
  .small-button {
    display: block;
    margin-top: .6rem;
    padding: .35rem .55rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--foreground);
    font-size: .75rem;
  }
  .small-button:hover {
    border-color: var(--primary);
  }
  .results-area {
    display: grid;
    gap: 1rem;
    min-width: 0;
  }
  .result-summary {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
    padding: 1rem;
  }
  .selected-artwork {
    flex: 0 0 8rem;
    width: 8rem;
    overflow: hidden;
    border-radius: var(--radius);
  }
  .selected-info {
    min-width: 0;
  }
  .selected-info h2 {
    font-size: 1.25rem;
    margin: .1rem 0;
  }
  .eyebrow {
    font-size: .6875rem;
    color: var(--muted-foreground);
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .recipe-count {
    font-size: .8125rem;
    margin: .65rem 0 0;
  }
  .recipe-section {
    min-width: 0;
  }
  .recipe-section h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 650;
  }
  .recipe-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: .6rem;
    margin-top: .75rem;
    padding: .7rem;
  }
  .recipe-filters label {
    display: grid;
    gap: .3rem;
    flex: 1;
    min-width: 10rem;
    font-size: .75rem;
    font-weight: 600;
  }
  .recipe-filters .helper {
    flex-basis: 100%;
    margin: 0;
  }
  .recipe-list {
    display: grid;
    gap: .45rem;
  }
  .recipe-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
    min-width: 0;
    padding: .6rem .7rem;
  }
  .pair {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    flex: 1;
    gap: .5rem;
    min-width: 0;
  }
  .ingredient {
    display: flex;
    align-items: center;
    gap: .45rem;
    flex: 1 1 11rem;
    min-width: 0;
  }
  .ingredient-text strong {
    overflow-wrap: anywhere;
    font-size: .8125rem;
  }
  .plus {
    color: var(--muted-foreground);
    font-weight: 700;
  }
  .pair-actions {
    display: grid;
    justify-items: end;
    gap: .4rem;
    margin-left: auto;
    min-width: 9rem;
  }
  .ownership {
    font-size: .75rem;
    color: var(--muted-foreground);
    text-align: right;
  }
  .ownership.ready {
    color: var(--primary);
    font-weight: 650;
  }
  .try-link, .show-more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: .45rem .65rem;
    border: 1px solid var(--primary);
    border-radius: var(--radius);
    color: var(--primary-foreground);
    background: var(--primary);
    text-decoration: none;
    font-size: .75rem;
    font-weight: 650;
    text-align: center;
    cursor: pointer;
  }
  .try-link:hover, .show-more:hover {
    filter: brightness(.94);
  }
  .show-more {
    margin-top: .75rem;
    width: 100%;
  }
  .empty-message {
    padding: 1rem;
    color: var(--muted-foreground);
    font-size: .875rem;
  }
  .special-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: .6rem;
    justify-content: space-between;
    padding: .6rem .75rem;
  }
  .special-pair {
    flex: 1;
    font-size: .8125rem;
    min-width: 12rem;
  }
  .scope-note {
    margin: 0;
    color: var(--muted-foreground);
    font-size: .75rem;
    line-height: 1.6;
  }
  @media (max-width: 830px) {
    .lookup-layout {
      grid-template-columns: minmax(0, 1fr);
    }
    .result-choices {
      max-height: 16rem;
    }
  }
  @media (max-width: 520px) {
    .result-summary {
      align-items: flex-start;
    }
    .selected-artwork {
      width: 5.5rem;
      flex-basis: 5.5rem;
    }
    .ingredient {
      flex-basis: 100%;
    }
    .plus {
      margin-left: 1rem;
    }
    .pair-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      min-width: 0;
    }
    .ownership {
      text-align: left;
    }
  }
</style>
