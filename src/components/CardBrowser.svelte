<script lang="ts">
  import { ATTRIBUTES, MONSTER_TYPES } from '../lib/dotr/model';
  import { filterCards, type BrowserCard } from '../lib/dotr/browser';
  let { cards }: { cards: BrowserCard[] } = $props();
  let query = $state('');
  let kind = $state('');
  let monsterType = $state('');
  let attribute = $state('');
  let failedImages = $state<Set<number>>(new Set());
  const results = $derived(filterCards(cards, { query, kind, monsterType, attribute }));
  const monstersAllowed = $derived(!kind || kind === 'monster');
  function clear() { query = ''; kind = ''; monsterType = ''; attribute = ''; }
  function changeKind() { if (kind && kind !== 'monster') { monsterType = ''; attribute = ''; } }
  function imageFailed(id: number) { failedImages = new Set([...failedImages, id]); }
</script>

<div class="browser-controls" role="search" aria-label="Find a DotR card">
  <label class="search-label">Search cards<input type="search" bind:value={query} placeholder="Name or ID — blue eyes, 021…" autocomplete="off" /></label>
  <label>Card kind<select bind:value={kind} onchange={changeKind}>
    <option value="">All kinds</option><option value="monster">Monster</option><option value="magic">Magic</option><option value="trap">Trap</option><option value="ritual">Ritual</option>
  </select></label>
  <label>Monster type<select bind:value={monsterType} disabled={!monstersAllowed}>
    <option value="">All types</option>{#each MONSTER_TYPES as type}<option value={type}>{type}</option>{/each}
  </select></label>
  <label>Attribute<select bind:value={attribute} disabled={!monstersAllowed}>
    <option value="">All attributes</option>{#each ATTRIBUTES as attr}<option value={attr}>{attr}</option>{/each}
  </select></label>
  <button type="button" onclick={clear}>Clear</button>
</div>
<div class="result-summary">
  <p class="number" role="status" aria-live="polite">{results.length} of {cards.length} cards</p>
  <p class="muted">DotR ID order · Select a card for its game screen and details</p>
</div>
<noscript><p>Search and filters need JavaScript. You can still browse every card below.</p></noscript>
{#if results.length === 0}
  <div class="empty-results"><h2>No cards found</h2><p class="muted">Try part of a name, an ID from 000 to 853, or clear the filters.</p><button type="button" onclick={clear}>Clear search and filters</button></div>
{:else}
  <ul class="card-grid">
    {#each results as card (card.id)}
      <li><a class="card-tile" href={`/cards/${String(card.id).padStart(3, '0')}/`}>
        <div class="artwork" class:compact-screen={card.image?.compactScreen}>
          {#if card.image && !failedImages.has(card.id)}
            <img src={card.image.url} alt={card.name} width={card.image.width} height={card.image.height} loading="lazy" decoding="async" onerror={() => imageFailed(card.id)} />
          {:else}
            <div class="image-missing"><span class="number">{String(card.id).padStart(3, '0')}</span><span>Image unavailable</span></div>
          {/if}
        </div>
        <div class="tile-info">
          <div class="tile-heading"><span class="card-id number">{String(card.id).padStart(3, '0')}</span><h2>{card.name}</h2></div>
          <p class="classification">{card.monsterType ?? (card.kind === 'magic' ? 'Magic' : card.kind === 'trap' ? 'Trap' : 'Ritual')}{card.attribute ? ` · ${card.attribute}` : ''}</p>
          <p class="stats number">{card.atk !== null ? `${card.atk} / ${card.def}` : '—'}<span>DC {card.deckCost ?? '—'}</span></p>
        </div>
      </a></li>
    {/each}
  </ul>
{/if}

<style>
  .browser-controls { display: grid; grid-template-columns: minmax(260px, 2fr) repeat(3, minmax(140px, 1fr)) auto; gap: .8rem; align-items: end; margin-top: 1.5rem; }
  label { display: flex; flex-direction: column; gap: .35rem; font-size: .85rem; color: var(--muted); }
  input, select, button { min-height: 42px; padding: .55rem .75rem; }
  input, select { width: 100%; }
  .result-summary { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; margin-block: 1rem; font-size: .85rem; }
  .result-summary p { margin: 0; }
  .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 1rem; padding: 0; margin: 0; list-style: none; }
  .card-tile { display: block; height: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; overflow: hidden; text-decoration: none; }
  .card-tile:hover { border-color: var(--accent); }
  .artwork { position: relative; overflow: hidden; aspect-ratio: 4 / 3; background: #0b1114; }
  /* Viewport into the shared library artwork frame; details retain the full numbered screen. */
  .artwork img { position: absolute; width: 207.5%; max-width: none; height: auto; left: -101.2%; top: -53.5%; }
  /* Reviewed #065 NA screen has a taller artwork window; preserve it with side space. */
  .artwork.compact-screen img { width: 155%; left: -58%; top: -53%; clip-path: inset(23.18% 9.52% 33.1% 49.08%); }
  .image-missing { display: flex; height: 100%; flex-direction: column; align-items: center; justify-content: center; gap: .4rem; color: var(--muted); font-size: .8rem; }
  .image-missing .number { font-size: 1.7rem; color: var(--text); }
  .tile-info { padding: .65rem .7rem; }
  .tile-heading { display: flex; align-items: baseline; gap: .5rem; }
  .card-id { color: var(--accent); font-size: .75rem; flex-shrink: 0; }
  .tile-heading h2 { font-size: .9rem; line-height: 1.35; margin: 0; min-height: 2.7em; font-weight: 600; }
  .classification { font-size: .72rem; color: var(--muted); margin-block: .45rem .3rem; }
  .stats { display: flex; justify-content: space-between; gap: .4rem; margin: 0; font-size: .8rem; }
  .stats span { color: var(--muted); }
  .empty-results { text-align: center; padding: 4rem 1rem; border-top: 1px solid var(--line); }
  @media (max-width: 1050px) { .browser-controls { grid-template-columns: repeat(3, minmax(0, 1fr)) auto; } .search-label { grid-column: 1 / -1; } }
  @media (max-width: 600px) { .browser-controls { grid-template-columns: 1fr 1fr; } .card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; } .tile-info { padding: .55rem; } .tile-heading { gap: .35rem; } }
</style>
