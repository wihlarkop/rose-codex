<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import cards from '../../../data/canonical/cards.json';
  import images from '../../../data/canonical/images.json';
  import { browserCards, filterCards } from '../../lib/dotr/browser';
  import type { Card, ImageRecord } from '../../lib/dotr/model';
  import CardPickerOption from '../cards/CardPickerOption.svelte';
  import { cardSearchAllPath, cardSearchCardPath } from './card-search-navigation';

  const library = browserCards(cards as Card[], images as ImageRecord[]);
  let dialog = $state<HTMLDialogElement | null>(null);
  let input = $state<HTMLInputElement | null>(null);
  let query = $state('');
  let activeIndex = $state(0);
  const matches = $derived(query.trim()
    ? filterCards(library, { query, kind: '', monsterType: '', attribute: '' })
    : []);
  const suggestions = $derived(matches.slice(0, 6));

  async function openSearch() {
    if (!dialog || dialog.open) return;
    query = '';
    activeIndex = 0;
    dialog.showModal();
    await tick();
    input?.focus();
  }
  function closeSearch() { dialog?.close(); }
  function openAllResults() {
    if (query.trim()) window.location.assign(cardSearchAllPath(query));
  }
  function openCard(cardId: number) {
    window.location.assign(cardSearchCardPath(cardId));
  }
  function openSelected() {
    if (!query.trim()) return;
    const selected = suggestions[activeIndex];
    if (selected) openCard(selected.id);
    else openAllResults();
  }
  function handleInputKeydown(event: KeyboardEvent) {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length) {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      activeIndex = (activeIndex + direction + suggestions.length) % suggestions.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      openSelected();
    }
  }
  onMount(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        void openSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
</script>

<button type="button" class="search-trigger" onclick={openSearch} aria-label="Search cards (Ctrl+K)">
  <Search size={16} aria-hidden="true" />
  <span class="search-caption">Search</span>
  <kbd>Ctrl K</kbd>
</button>
<dialog bind:this={dialog} class="quick-search" aria-labelledby="quick-search-heading">
  <div class="modal-heading">
    <div><h2 id="quick-search-heading">Search cards</h2><p>Find a DotR card by name or ID.</p></div>
    <button type="button" aria-label="Close search" class="modal-close" onclick={closeSearch}>
      <X size={18} aria-hidden="true" />
    </button>
  </div>
  <label for="quick-card-query" class="sr-only">Card name or ID</label>
  <input id="quick-card-query" bind:this={input} type="search" bind:value={query}
    oninput={() => (activeIndex = 0)} onkeydown={handleInputKeydown}
    role="combobox" aria-autocomplete="list" aria-controls="quick-card-suggestions"
    aria-expanded={suggestions.length > 0}
    aria-activedescendant={suggestions.length ? 'quick-card-option-' + suggestions[activeIndex]?.id : undefined}
    placeholder="e.g. Blue-Eyes, Dark Magician or 007" maxlength="80"
    autocomplete="off" class="modal-input" />
  <div id="quick-card-suggestions" class="suggestions" role="listbox" aria-label="Matching cards">
    {#each suggestions as card, index (card.id)}
      <button type="button" role="option" id={'quick-card-option-' + card.id}
        class="suggestion" class:active={index === activeIndex}
        aria-selected={index === activeIndex}
        onpointerenter={() => (activeIndex = index)}
        onclick={() => openCard(card.id)}>
        <CardPickerOption {card} />
      </button>
    {/each}
  </div>
  {#if query.trim()}
    {#if matches.length === 0}
      <p class="empty-message">No matching cards. Try a name or ID from 000 to 853.</p>
    {:else}
      <p class="match-count" role="status" aria-live="polite">
        {matches.length > suggestions.length
          ? 'Showing ' + suggestions.length + ' of ' + matches.length + ' matches'
          : matches.length + (matches.length === 1 ? ' match' : ' matches')}
      </p>
    {/if}
  {/if}
  <div class="modal-actions">
    <span>↑ ↓ Navigate · Enter select · Esc close</span>
    <button type="button" disabled={!query.trim()} onclick={openAllResults}>View all results →</button>
  </div>
</dialog>
<style>
  .search-trigger { display:flex; align-items:center; gap:.55rem; min-height:36px;
    padding:.35rem .65rem; border:1px solid var(--border);
    border-radius:var(--radius); color:var(--muted-foreground);
    background:var(--elevated); font-size:.8rem; }
  .search-trigger:hover { color:var(--foreground); background:var(--hover); }
  kbd { font-family:inherit; font-size:.7rem; border:1px solid var(--border);
    border-radius:4px; padding:.1rem .35rem; }
  .quick-search { position:fixed; margin:8vh auto auto; inset:0;
    width:min(520px, calc(100% - 2rem)); max-height:80vh; overflow-y:auto;
    border:1px solid var(--border);
    border-radius:12px; padding:1.1rem; background:var(--surface); color:var(--foreground);
    box-shadow:0 24px 70px #0007; }
  .quick-search::backdrop { background:#0009; }
  .modal-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
  h2 { margin:0; font-size:1.15rem; }
  .modal-heading p { margin:.2rem 0 1rem; font-size:.8rem; color:var(--muted-foreground); }
  .modal-close { border:0; color:var(--muted-foreground); background:transparent; padding:.25rem; cursor:pointer; }
  .modal-input { display:block; width:100%; background:var(--elevated); color:var(--foreground);
    border:1px solid var(--border); border-radius:var(--radius); height:44px; padding:0 .8rem; }
  .suggestions { display:grid; gap:.2rem; margin-top:.5rem; max-height:min(43vh,380px); overflow-y:auto; }
  .suggestion { display:flex; align-items:center; gap:.65rem; min-width:0; width:100%;
    border:1px solid transparent; border-radius:var(--radius); padding:.3rem .5rem;
    background:transparent; color:var(--foreground); text-align:left; cursor:pointer; }
  .suggestion:hover, .suggestion.active, .suggestion:focus-visible {
    background:var(--selected); border-color:var(--border); }
  .empty-message, .match-count { margin:.6rem 0 0; color:var(--muted-foreground); font-size:.75rem; }
  .modal-actions { margin-top:1rem; display:flex; align-items:center; justify-content:space-between;
    gap:.8rem; font-size:.75rem; color:var(--muted-foreground); }
  .modal-actions button { border:0; border-radius:var(--radius); min-height:36px;
    padding:.4rem .8rem; background:var(--primary); color:var(--primary-foreground);
    font-weight:600; cursor:pointer; }
  .modal-actions button:disabled { opacity:.45; cursor:not-allowed; }
  @media (max-width:600px) {
    .search-caption,kbd { display:none; }
    .modal-actions { align-items:flex-start; flex-direction:column; }
    .modal-actions button { align-self:flex-end; }
  }
</style>
