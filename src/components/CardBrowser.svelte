<script lang="ts">
  import { onMount, tick } from 'svelte';
  import SearchIcon from '@lucide/svelte/icons/search';
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from './ui/button';
  import { Input } from './ui/input';
  import CardFlipTile from './cards/CardFlipTile.svelte';
  import CardQuickLookup from './cards/CardQuickLookup.svelte';
  import { ATTRIBUTES, MONSTER_TYPES } from '../lib/dotr/model';
  import { filterCards, type BrowserCard } from '../lib/dotr/browser';
  import { COLLECTION_STORAGE_KEY, validateCollection } from '../features/decks/collection';

  let { cards }: { cards: BrowserCard[] } = $props();
  let query = $state('');
  let kind = $state('');
  let monsterType = $state('');
  let attribute = $state('');
  let flippedIds = $state(new Set<number>());
  let quickLookupCardId = $state<number | null>(null);
  let compact = $state(false);
  let filtersOpen = $state(false);
  let ownedCopies = $state<Record<string, number> | null>(null);
  let collectionWarning = $state(false);
  let toolbarSentinel: HTMLDivElement;
  let toolbarElement: HTMLDivElement;
  let filterToggle = $state<HTMLButtonElement | undefined>(undefined);

  const results = $derived(filterCards(cards, { query, kind, monsterType, attribute }));
  const monstersAllowed = $derived(!kind || kind === 'monster');
  const active = $derived(Boolean(query || kind || monsterType || attribute));
  const filterCount = $derived([kind, monsterType, attribute].filter(Boolean).length);

  function refreshCollection() {
    try {
      const raw = localStorage.getItem(COLLECTION_STORAGE_KEY);
      ownedCopies = raw === null ? null : validateCollection(JSON.parse(raw), new Set(cards.map(card => card.id))).owned;
      collectionWarning = false;
    } catch {
      // An absent or corrupt inventory must not be represented as zero owned copies.
      ownedCopies = null;
      collectionWarning = true;
    }
  }

  onMount(() => {
    const incoming = new URLSearchParams(window.location.search).get('q');
    if (incoming && incoming.trim() && incoming.length <= 80) query = incoming.trim();
    refreshCollection();

    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          if (!entry) return;
          const next = entry.boundingClientRect.bottom < 0;
          if (next !== compact) {
            compact = next;
            if (!next) filtersOpen = false;
          }
        }, { threshold: 0 })
      : null;
    if (observer && toolbarSentinel) observer.observe(toolbarSentinel);

    function onOutside(event: PointerEvent) {
      if (filtersOpen && toolbarElement && !toolbarElement.contains(event.target as Node))
        filtersOpen = false;
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && filtersOpen) {
        filtersOpen = false;
        filterToggle?.focus();
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === COLLECTION_STORAGE_KEY || event.key === null) refreshCollection();
    }
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onEscape);
    window.addEventListener('storage', onStorage);
    return () => {
      observer?.disconnect();
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('storage', onStorage);
    };
  });

  function clear() { query = ''; kind = ''; monsterType = ''; attribute = ''; }
  function changeKind() { if (kind && kind !== 'monster') { monsterType = ''; attribute = ''; } }
  function setFlipped(cardId: number, next: boolean) {
    const updated = new Set(flippedIds);
    if (next) updated.add(cardId); else updated.delete(cardId);
    flippedIds = updated;
  }
  async function locateCard(cardId: number) {
    query = String(cardId).padStart(3, '0');
    kind = ''; monsterType = ''; attribute = '';
    quickLookupCardId = cardId;
    flippedIds = new Set([cardId]);
    await tick();
    const target = document.getElementById('library-card-' + String(cardId).padStart(3, '0'));
    target?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    target?.focus({ preventScroll: true });
  }
</script>

<section class="library-content" aria-label="Card library">
  <header class="page-header">
    <div>
      <h1 class="page-title">Card library</h1>
      <p class="page-description">Find the card in front of you. All 854 cards from The Duelists of the Roses.</p>
    </div>
    <CardQuickLookup {cards} selectedCardId={quickLookupCardId} onselect={locateCard} />
  </header>

  <div class="toolbar-sentinel" bind:this={toolbarSentinel} aria-hidden="true"></div>
  <div class="toolbar" class:compact class:filters-open={filtersOpen} bind:this={toolbarElement}
    role="search" aria-label="Find a DotR card">
    <div class="relative search-field">
      <label class="sr-only" for="library-search">Search cards</label>
      <SearchIcon class="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
      <Input id="library-search" type="search" bind:value={query} placeholder="Search name or ID…"
        autocomplete="off" class="h-10 rounded-md bg-elevated pl-10 pr-10" />
      {#if query}
        <Button variant="ghost" size="icon" class="absolute right-1 top-1 size-8"
          aria-label="Clear search" onclick={() => query = ''}>
          <XIcon class="size-4" aria-hidden="true" />
        </Button>
      {/if}
    </div>
    <div class="filter-fields" id="library-filter-fields">
      <select class="native-filter" aria-label="Card kind" bind:value={kind} onchange={changeKind}>
        <option value="">All kinds</option>
        <option value="monster">Monster</option>
        <option value="magic">Magic</option>
        <option value="trap">Trap</option>
        <option value="ritual">Ritual</option>
      </select>
      <select class="native-filter" aria-label="Monster type" bind:value={monsterType} disabled={!monstersAllowed}>
        <option value="">All types</option>
        {#each MONSTER_TYPES as type}<option value={type}>{type}</option>{/each}
      </select>
      <select class="native-filter" aria-label="Attribute" bind:value={attribute} disabled={!monstersAllowed}>
        <option value="">All attributes</option>
        {#each ATTRIBUTES as attr}<option value={attr}>{attr}</option>{/each}
      </select>
      <Button variant="ghost" class="h-10" disabled={!active} onclick={clear}>Reset</Button>
    </div>
    {#if compact}
      <button type="button" class="compact-filter-toggle" bind:this={filterToggle}
        aria-controls="library-filter-fields" aria-expanded={filtersOpen}
        onclick={() => filtersOpen = !filtersOpen}>
        <SlidersHorizontal size={16} aria-hidden="true" />
        Filters
        {#if filterCount > 0}<span class="filter-count" aria-label={filterCount + ' filters active'}>{filterCount}</span>{/if}
      </button>
    {/if}
  </div>

  {#if active}
    <div class="active-filters" aria-label="Active filters">
      {#each [
        { label: query ? 'Search: ' + query : '', clear: () => query = '' },
        { label: kind, clear: () => kind = '' },
        { label: monsterType, clear: () => monsterType = '' },
        { label: attribute, clear: () => attribute = '' },
      ] as filter}
        {#if filter.label}
          <button class="filter-chip" onclick={filter.clear} aria-label={'Remove ' + filter.label}>
            {filter.label}<XIcon class="size-3" aria-hidden="true" />
          </button>
        {/if}
      {/each}
    </div>
  {/if}
  <div class="result-summary">
    <p role="status" aria-live="polite"><strong class="text-foreground number">{results.length}</strong> of {cards.length} cards <span class="order">· DotR ID order</span></p>
    {#if ownedCopies !== null}
      <p class="collection-context">Owned badges use your saved <a href="/collection/">Collection</a>.</p>
    {:else if collectionWarning}
      <p class="collection-context">Collection data unavailable; ownership not shown.</p>
    {/if}
  </div>
  <noscript><p>Search and filters need JavaScript. You can still browse every card below.</p></noscript>
  {#if results.length === 0}
    <div class="empty-results">
      <h2 class="text-xl font-semibold">No cards found</h2>
      <p class="mt-2 mb-5 text-sm text-muted-foreground">Try part of a name, an ID from 000 to 853, or reset your filters.</p>
      <Button variant="outline" onclick={clear}>Clear search and filters</Button>
    </div>
  {:else}
    <ul class="card-grid">
      {#each results as card (card.id)}
        <li><CardFlipTile {card} ownedCopies={ownedCopies === null ? null : (ownedCopies[String(card.id)] ?? 0)}
          flipped={flippedIds.has(card.id)} onflip={setFlipped} /></li>
      {/each}
    </ul>
  {/if}
</section>
<style>
  .library-content { min-width: 0; container-type: inline-size; }
  .toolbar-sentinel { height: 1px; }
  .toolbar {
    position: sticky; top: 0; z-index: 30; display: grid; align-items: center;
    grid-template-columns: minmax(220px, 2.5fr) repeat(3, minmax(0, 1fr)) auto;
    gap: var(--space-3); border: 1px solid var(--border); border-radius: 10px;
    background: var(--surface); padding: .65rem;
  }
  .filter-fields { display: contents; }
  .search-field { min-width: 0; }
  .toolbar.compact { grid-template-columns: minmax(0, 1fr) auto; padding: .4rem .65rem;
    box-shadow: 0 5px 18px #0002; }
  .toolbar.compact .filter-fields { display: none; }
  .toolbar.compact.filters-open .filter-fields {
    display: grid; position: absolute; top: calc(100% + .35rem); right: 0;
    width: min(560px, 100%); grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: center; gap: var(--space-3); padding: .85rem;
    border: 1px solid var(--border); border-radius: 10px; background: var(--surface);
    box-shadow: 0 12px 28px #0004;
  }
  .compact-filter-toggle {
    display: inline-flex; align-items: center; justify-content: center; gap: .45rem;
    min-height: 40px; padding: .35rem .7rem; border: 1px solid var(--border);
    border-radius: var(--radius); background: var(--elevated); color: var(--foreground);
    font-size: .78rem; font-weight: 650;
  }
  .compact-filter-toggle:hover, .compact-filter-toggle[aria-expanded="true"] {
    border-color: var(--primary); background: var(--selected);
  }
  .filter-count { min-width: 1.35rem; padding: 0 .2rem; border-radius: 100px; text-align: center;
    background: var(--primary); color: var(--primary-foreground); font-variant-numeric: tabular-nums; }
  .active-filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
  .filter-chip { display: inline-flex; align-items: center; gap: var(--space-2); background: var(--selected);
    color: var(--primary); padding: var(--space-1) var(--space-2); border-radius: var(--radius); font-size: .75rem; }
  .result-summary { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
    gap: var(--space-3); margin-block: var(--space-4); color: var(--muted-foreground); font-size: .875rem; }
  .collection-context { margin: 0; font-size: .75rem; }
  .collection-context a { color: var(--primary); text-decoration: underline; }
  .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--space-4); padding: 0; margin: 0; list-style: none; }
  .empty-results { text-align: center; padding: 4rem var(--space-4); background: var(--surface); border-radius: var(--radius); }
  @container (max-width: 1100px) {
    .toolbar:not(.compact) { grid-template-columns: repeat(3, minmax(0, 1fr)) auto; }
    .toolbar:not(.compact) .search-field { grid-column: 1 / -1; }
  }
  @container (max-width: 700px) {
    .toolbar:not(.compact) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .toolbar:not(.compact) .search-field { grid-column: 1 / -1; }
    .order { display: none; }
    .card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
  }
  @container (max-width: 390px) {
    .compact-filter-toggle { font-size: 0; gap: .25rem; }
    .filter-count { font-size: .7rem; }
  }
</style>
