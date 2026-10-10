<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { DECK_STORAGE_KEY, validateDeckEnvelope, type DeckRecord } from '../decks/model';
  import { OPPONENTS, opponentById } from '../../lib/dotr/opponents';
  import {
    BATTLE_LOG_KEY,
    MAX_BATTLE_LOGS,
    summarizeBattles,
    validateBattleLogs,
    type BattleLog,
    type BattleOutcome,
    type BattleLogStore,
  } from './model';

  let { allowedCardIds, embedded = false }: { allowedCardIds: number[]; embedded?: boolean } =
    $props();
  let matches = $state<BattleLog[]>([]);
  let decks = $state<DeckRecord[]>([]);
  let chosenDeckId = $state('');
  let opponentId = $state(OPPONENTS[0]!.id);
  let outcome = $state<BattleOutcome>('win');
  let turnsInput = $state('8');
  let note = $state('');
  let notice = $state('');
  let unsafeStorage = $state(false);
  let storageError = $state('');
  let ready = $state(false);
  let pendingRemoveId = $state<string | null>(null);
  let removeDialog = $state<HTMLDialogElement | null>(null);
  let cancelRemoveButton = $state<HTMLButtonElement | null>(null);
  const removingMatch = $derived(matches.find((row) => row.id === pendingRemoveId));
  const summary = $derived(summarizeBattles(matches));
  const selectedDeck = $derived(decks.find((deck) => deck.id === chosenDeckId));
  const byOpponent = $derived(
    OPPONENTS.map((profile) => ({
      ...profile,
      summary: summarizeBattles(matches.filter((match) => match.opponentId === profile.id)),
    })).filter((item) => item.summary.battles > 0),
  );

  onMount(() => {
    try {
      const allowed = new Set(allowedCardIds);
      const rawDecks = localStorage.getItem(DECK_STORAGE_KEY);
      decks = rawDecks ? validateDeckEnvelope(JSON.parse(rawDecks), allowed).decks : [];
      chosenDeckId = decks[0]?.id ?? '';
    } catch (error) {
      storageError =
        'Saved decks could not be loaded: ' +
        (error instanceof Error ? error.message : 'Unknown error');
    }
    try {
      const saved = localStorage.getItem(BATTLE_LOG_KEY);
      matches = saved ? validateBattleLogs(JSON.parse(saved)).matches : [];
    } catch (error) {
      unsafeStorage = true;
      storageError +=
        (storageError ? ' ' : '') +
        'Battle logs were not overwritten because the stored data is invalid: ' +
        (error instanceof Error ? error.message : 'Unknown error');
    }
    ready = true;
  });

  function store(next: BattleLog[]): boolean {
    if (!ready || unsafeStorage) {
      notice =
        'Protected existing invalid data; no changes were written. Export or repair the stored data manually.';
      return false;
    }
    try {
      const payload: BattleLogStore = { schemaVersion: 1, matches: next };
      validateBattleLogs(payload);
      localStorage.setItem(BATTLE_LOG_KEY, JSON.stringify(payload));
      matches = next;
      notice = 'Battle Lab saved locally in this browser.';
      return true;
    } catch (error) {
      notice =
        'Could not save Battle Lab: ' +
        (error instanceof Error ? error.message : 'Browser storage unavailable');
      return false;
    }
  }
  function addResult() {
    if (!selectedDeck) {
      notice = 'Select a saved Deck Builder deck first.';
      return;
    }
    const turns = Number(turnsInput);
    if (!/^[0-9]{1,3}$/.test(turnsInput) || turns < 1 || turns > 999) {
      notice = 'Turn count must be a whole number from 1 to 999.';
      return;
    }
    if (matches.length >= MAX_BATTLE_LOGS) {
      notice =
        'Battle Lab holds at most 200 matches. Export a backup and remove older entries first.';
      return;
    }
    const next: BattleLog = {
      id: crypto.randomUUID(),
      playedAt: new Date().toISOString(),
      opponentId,
      deckId: selectedDeck.id,
      deckName: selectedDeck.name,
      outcome,
      turns,
      note: note.trim().slice(0, 400),
    };
    if (store([...matches, next])) note = '';
  }
  async function requestRemoveResult(id: string) {
    if (!matches.some((row) => row.id === id)) return;
    pendingRemoveId = id;
    await tick();
    removeDialog?.showModal();
    cancelRemoveButton?.focus();
  }
  function cancelRemoveResult() {
    removeDialog?.close();
  }
  function confirmRemoveResult() {
    const id = pendingRemoveId;
    if (!id) return;
    removeDialog?.close();
    store(matches.filter((row) => row.id !== id));
  }
  function exportLogs() {
    const payload: BattleLogStore = { schemaVersion: 1, matches };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rose-codex-battle-lab.json';
    a.click();
    URL.revokeObjectURL(url);
    notice = 'Battle Lab backup exported; this is not model training.';
  }
  const percent = (value: number | null) => (value === null ? '—' : (100 * value).toFixed(1) + '%');
</script>

<section aria-label="Battle Lab feedback">
  {#if !embedded}
    <header class="page-header">
      <div>
        <h1 class="page-title">Battle Lab · Real duel feedback</h1>
        <p class="page-description">
          Record outcomes after playing in PCSX2. Compare observed match results against your deck
          recommendations without inventing simulated victories.
        </p>
      </div>
      <a href="/coach/" class="text-link text-sm">Smart Deck Coach →</a>
    </header>
  {:else}
    <h2 class="mb-3 text-lg font-semibold">Battle History</h2>
  {/if}
  <p
    class="rounded-md border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground"
  >
    Saved only in this browser. Deck names are a snapshot at the time of recording; editing/deleting
    a deck does not erase its historical results. Observed win rates describe your recorded matches,
    not the true win probability, model accuracy, or causal strength of a deck.
  </p>
  {#if storageError}
    <p class="warning-note mt-3" role="alert">{storageError}</p>
  {/if}
  <div class="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.3fr)]">
    <section class="rounded-lg border border-border bg-surface p-4">
      <h2 class="text-base font-semibold">Record a completed duel</h2>
      <div class="mt-3 grid gap-3">
        <label class="grid gap-1 text-xs font-semibold text-muted-foreground">
          Deck used (from Deck Builder)
          <select class="native-filter w-full" bind:value={chosenDeckId}>
            <option value="">Choose a saved deck</option>
            {#each decks as deck (deck.id)}
              <option value={deck.id}>{deck.name} · {deck.cardIds.length}/40</option>
            {/each}
          </select>
        </label>
        {#if decks.length === 0}
          <p class="text-xs text-muted-foreground">
            No local decks found. Create a deck in
            <a class="text-link" href="/decks/">Deck Builder</a> first.
          </p>
        {/if}
        <label class="grid gap-1 text-xs font-semibold text-muted-foreground">
          Campaign opponent
          <select class="native-filter w-full" bind:value={opponentId}>
            {#each OPPONENTS as profile (profile.id)}
              <option value={profile.id}>{profile.name} · {profile.path} path</option>
            {/each}
          </select>
        </label>
        <label class="grid gap-1 text-xs font-semibold text-muted-foreground">
          Result
          <select class="native-filter w-full" bind:value={outcome}>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
          </select>
        </label>
        <label class="grid gap-1 text-xs font-semibold text-muted-foreground">
          Number of turns (1–999)
          <input
            class="native-filter w-full"
            type="number"
            min="1"
            max="999"
            value={turnsInput}
            oninput={(event) => (turnsInput = event.currentTarget.value)}
          />
        </label>
        <label class="grid gap-1 text-xs font-semibold text-muted-foreground">
          Notes (optional, max 400 characters)
          <textarea
            class="native-filter w-full"
            rows="3"
            maxlength="400"
            bind:value={note}
            placeholder="Key fusion, problem cards, unusual terrain…"></textarea>
        </label>
        <button
          type="button"
          disabled={!selectedDeck || unsafeStorage || !ready}
          class="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          onclick={addResult}>Save battle result</button
        >
      </div>
      {#if notice}<p class="mt-3 text-xs text-muted-foreground" role="status">{notice}</p>{/if}
    </section>
    <div class="grid min-w-0 gap-4">
      <section class="rounded-lg border border-border bg-surface p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-base font-semibold">Observed results</h2>
          <button
            type="button"
            class="rounded-md border border-border px-3 py-2 text-xs hover:bg-hover"
            onclick={exportLogs}>Export JSON</button
          >
        </div>
        <dl class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-md bg-elevated p-3">
            <dt class="text-xs text-muted-foreground">Matches</dt>
            <dd class="text-lg font-semibold">{summary.battles}</dd>
          </div>
          <div class="rounded-md bg-elevated p-3">
            <dt class="text-xs text-muted-foreground">Wins</dt>
            <dd class="text-lg font-semibold">{summary.wins}</dd>
          </div>
          <div class="rounded-md bg-elevated p-3">
            <dt class="text-xs text-muted-foreground">Observed rate</dt>
            <dd class="text-lg font-semibold">{percent(summary.observedWinRate)}</dd>
          </div>
          <div class="rounded-md bg-elevated p-3">
            <dt class="text-xs text-muted-foreground">Avg. turns</dt>
            <dd class="text-lg font-semibold">{summary.averageTurns?.toFixed(1) ?? '—'}</dd>
          </div>
        </dl>
        {#if byOpponent.length}
          <h3 class="mt-4 text-sm font-semibold">By opponent</h3>
          <ul class="mt-2 grid gap-1.5">
            {#each byOpponent as profile (profile.id)}
              <li
                class="flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-elevated px-3 py-2 text-xs"
              >
                <strong>{profile.name}</strong>
                <span class="tabular-nums text-muted-foreground">
                  {profile.summary.wins}/{profile.summary.battles} wins ·
                  {percent(profile.summary.observedWinRate)} observed
                </span>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="mt-4 text-xs text-muted-foreground">No completed duels recorded yet.</p>
        {/if}
      </section>
      <section class="rounded-lg border border-border bg-surface p-4">
        <h2 class="text-base font-semibold">Recent matches</h2>
        {#if matches.length}
          <ul class="mt-2 grid max-h-[550px] gap-2 overflow-auto">
            {#each [...matches].reverse().slice(0, 30) as match (match.id)}
              <li class="rounded-md border border-border p-3">
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                  <strong class="text-sm">
                    {opponentById(match.opponentId)?.name ?? match.opponentId}
                    · {match.outcome === 'win' ? 'Win' : 'Loss'}
                  </strong>
                  <button
                    type="button"
                    class="text-xs text-link"
                    onclick={() => requestRemoveResult(match.id)}
                  >
                    Remove
                  </button>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  {match.deckName} · {match.turns} turns · {match.playedAt.slice(0, 10)}
                </p>
                {#if match.note}
                  <p class="mt-1 text-xs">{match.note}</p>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="mt-2 text-xs text-muted-foreground">
            Add a completed real PCSX2 duel to begin tracking.
          </p>
        {/if}
      </section>
    </div>
  </div>
  <dialog
    bind:this={removeDialog}
    class="battle-remove-dialog"
    aria-labelledby="battle-remove-heading"
    aria-describedby="battle-remove-description"
    onclose={() => (pendingRemoveId = null)}
  >
    <div class="battle-modal-content">
      <h2 id="battle-remove-heading">Remove this battle result?</h2>
      <p id="battle-remove-description">
        {removingMatch
          ? (opponentById(removingMatch.opponentId)?.name ?? removingMatch.opponentId)
          : 'Selected result'}
        · {removingMatch?.outcome === 'win' ? 'Win' : 'Loss'}
        · {removingMatch?.deckName ?? 'Unknown deck'}
      </p>
      <p>
        Only this local Battle History entry will be deleted. Your saved decks and Collection will
        not change.
      </p>
      <div class="battle-modal-actions">
        <button
          type="button"
          class="battle-cancel"
          bind:this={cancelRemoveButton}
          onclick={cancelRemoveResult}>Cancel</button
        >
        <button
          type="button"
          class="battle-confirm"
          disabled={!removingMatch}
          onclick={confirmRemoveResult}>Remove Result</button
        >
      </div>
    </div>
  </dialog>
</section>
<style>
  .battle-remove-dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    padding: 0;
    width: min(450px, calc(100% - 2rem));
    max-height: 85vh;
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: 13px;
    background: var(--surface);
    color: var(--foreground);
    box-shadow: 0 24px 65px #0007;
  }
  .battle-remove-dialog::backdrop {
    background: rgb(10 9 15 / 64%);
  }
  .battle-modal-content {
    display: grid;
    gap: 0.9rem;
    padding: 1.4rem;
  }
  .battle-modal-content h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
  }
  .battle-modal-content p {
    margin: 0;
    font-size: 0.82rem;
    color: var(--muted-foreground);
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
  .battle-modal-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.35rem;
  }
  .battle-modal-actions button {
    border-radius: 7px;
    min-height: 42px;
    padding: 0.5rem 1rem;
    font-size: 0.84rem;
    font-weight: 650;
  }
  .battle-cancel {
    background: var(--elevated);
    color: var(--foreground);
    border: 1px solid var(--border);
  }
  .battle-cancel:hover {
    background: var(--hover);
  }
  .battle-confirm {
    background: var(--destructive);
    color: var(--background);
    border: 1px solid var(--destructive);
  }
  .battle-confirm:disabled {
    opacity: 0.5;
  }
</style>
