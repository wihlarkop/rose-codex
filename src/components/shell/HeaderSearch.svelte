<script lang="ts">
  import { onMount } from 'svelte';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  let dialog = $state<HTMLDialogElement | null>(null);
  let input = $state<HTMLInputElement | null>(null);
  let query = $state('');

  function openSearch() {
    if (!dialog || dialog.open) return;
    query = '';
    dialog.showModal();
    input?.focus();
  }
  function closeSearch() { dialog?.close(); }
  function submit(event: SubmitEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    window.location.assign('/cards/?q=' + encodeURIComponent(value.slice(0, 80)));
  }
  onMount(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
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
  <form onsubmit={submit}>
    <div class="modal-heading">
      <div><h2 id="quick-search-heading">Search cards</h2><p>Find a DotR card by name or ID in the Card Library.</p></div>
      <button type="button" aria-label="Close search" class="modal-close" onclick={closeSearch}>
        <X size={18} aria-hidden="true" />
      </button>
    </div>
    <label for="quick-card-query" class="sr-only">Card name or ID</label>
    <input id="quick-card-query" bind:this={input} type="search" bind:value={query}
      placeholder="e.g. Blue-Eyes, Dark Magician or 007" maxlength="80"
      autocomplete="off" class="modal-input" />
    <div class="modal-actions">
      <span>Enter to search · Esc to close</span>
      <button type="submit" disabled={!query.trim()}>Open library →</button>
    </div>
  </form>
</dialog>
<style>
  .search-trigger { display:flex; align-items:center; gap:.55rem; min-height:36px;
    padding:.35rem .65rem; border:1px solid var(--border);
    border-radius:var(--radius); color:var(--muted-foreground);
    background:var(--elevated); font-size:.8rem; }
  .search-trigger:hover { color:var(--foreground); background:var(--hover); }
  kbd { font-family:inherit; font-size:.7rem; border:1px solid var(--border);
    border-radius:4px; padding:.1rem .35rem; }
  .quick-search { position:fixed; margin:15vh auto auto; inset:0;
    width:min(520px, calc(100% - 2rem)); max-height:70vh; border:1px solid var(--border);
    border-radius:12px; padding:1.1rem; background:var(--surface); color:var(--foreground);
    box-shadow:0 24px 70px #0007; }
  .quick-search::backdrop { background:#0009; }
  .modal-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
  h2 { margin:0; font-size:1.15rem; }
  p { margin:.2rem 0 1rem; font-size:.8rem; color:var(--muted-foreground); }
  .modal-close { border:0; color:var(--muted-foreground); background:transparent; padding:.25rem; }
  .modal-input { display:block; width:100%; background:var(--elevated); color:var(--foreground);
    border:1px solid var(--border); border-radius:var(--radius); height:44px; padding:0 .8rem; }
  .modal-actions { margin-top:1rem; display:flex; align-items:center; justify-content:space-between;
    gap:.8rem; font-size:.75rem; color:var(--muted-foreground); }
  .modal-actions button { border:0; border-radius:var(--radius); min-height:36px;
    padding:.4rem .8rem; background:var(--primary); color:var(--primary-foreground); font-weight:600; }
  .modal-actions button:disabled { opacity:.45; cursor:not-allowed; }
  @media (max-width:600px) { .search-caption,kbd { display:none; } }
</style>
