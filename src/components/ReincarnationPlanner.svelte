<script lang="ts">
  import { onMount } from 'svelte';
  import CardArtwork from './cards/CardArtwork.svelte';
  import CardPicker from './cards/CardPicker.svelte';
  import ReincarnationOdds from './ReincarnationOdds.svelte';
  import type { BrowserCard } from '../lib/dotr/browser';
  import {
    REINCARNATION_DUELS,
    REINCARNATION_STORAGE_KEY,
    adjustReincarnationProgress,
    emptyReincarnationProgress,
    validateReincarnationProgress,
    type ReincarnationProgress,
  } from '../lib/dotr/reincarnation';

  let { cards }: { cards: BrowserCard[] } = $props();

  let selectedId = $state<number | null>(null);
  const selected = $derived(cards.find((card) => card.id === selectedId) ?? null);
  let progress = $state<ReincarnationProgress>(emptyReincarnationProgress());
  let ready = $state(false);
  let blocked = $state(false);
  let warning = $state('');
  let notice = $state('');
  let savedSnapshot: string | null = null;

  const readyForUse = $derived(progress.duelsCompleted === REINCARNATION_DUELS);
  const remaining = $derived(REINCARNATION_DUELS - progress.duelsCompleted);
  const progressPercent = $derived((progress.duelsCompleted / REINCARNATION_DUELS) * 100);

  onMount(() => {
    try {
      savedSnapshot = localStorage.getItem(REINCARNATION_STORAGE_KEY);
      if (savedSnapshot !== null)
        progress = validateReincarnationProgress(JSON.parse(savedSnapshot));
    } catch (error) {
      blocked = true;
      warning =
        'Saved reincarnation progress could not be read safely. It has not been overwritten. ' +
        (error instanceof Error ? error.message : 'Browser storage may be unavailable.');
    }
    ready = true;
  });

  function persist(next: ReincarnationProgress, message: string) {
    if (!ready || blocked) return;
    try {
      if (localStorage.getItem(REINCARNATION_STORAGE_KEY) !== savedSnapshot) {
        warning = 'Progress changed in another tab. Refresh this page before recording more duels.';
        return;
      }
      const raw = JSON.stringify(next);
      localStorage.setItem(REINCARNATION_STORAGE_KEY, raw);
      savedSnapshot = raw;
      progress = next;
      warning = '';
      notice = message;
    } catch {
      warning = 'Could not save duel progress in this browser. No progress was changed.';
    }
  }

  function recordDuel() {
    if (readyForUse) return;
    persist(adjustReincarnationProgress(progress, 1), 'One completed 1-player CPU duel recorded.');
  }

  function undoDuel() {
    if (progress.duelsCompleted === 0) return;
    persist(adjustReincarnationProgress(progress, -1), 'Last manually recorded duel removed.');
  }

  function recordUse() {
    if (progress.duelsCompleted === 0) return;
    persist(emptyReincarnationProgress(), 'Reincarnation recorded as used. Manual duel count reset.');
  }
</script>

<section aria-label="Reincarnation Guide and Planner">
  <header class="page-header">
    <div>
      <h1 class="page-title">Reincarnation Guide</h1>
      <p class="page-description">
        Plan which Chest card to sacrifice, track the next opportunity manually, and
        explore clearly labeled community-research probabilities. No PCSX2 save connection.
      </p>
    </div>
    <a href="/collection/" class="text-link text-sm">My Collection →</a>
  </header>

  <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(310px,1fr)]">
    <div class="grid min-w-0 gap-4">
      <section class="rounded-lg border border-border bg-surface p-4" aria-label="Candidate card lookup">
        <div class="mb-3">
          <h2 class="text-base font-semibold">Card to reincarnate</h2>
          <p class="mt-1 text-xs text-muted-foreground">
            Look up any DotR card. This is a reference, not proof that the card is in your
            Chest or eligible for reincarnation.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <CardPicker {cards} label="Find a card by name or ID" selectedCardId={selectedId}
            onselect={(id) => selectedId = id} />
          {#if selected}
            <button type="button" onclick={() => selectedId = null}
              class="rounded-md border border-border px-3 py-2 text-sm hover:bg-hover">Clear</button>
          {/if}
        </div>

        {#if selected}
          <div class="mt-4 flex flex-col gap-4 rounded-md bg-elevated p-3 sm:flex-row">
            <div class="w-full shrink-0 overflow-hidden rounded-md sm:w-44">
              <CardArtwork image={selected.image} name={selected.name} cardId={selected.id} />
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-xs font-semibold uppercase tracking-wide text-primary">Candidate · Preview only</span>
              <h3 class="mt-1 text-lg font-semibold">{selected.name}</h3>
              <p class="mt-1 text-sm text-muted-foreground">
                #{String(selected.id).padStart(3, '0')} · {selected.kind === 'monster'
                  ? selected.monsterType + ' Monster'
                  : selected.kind === 'magic' ? 'Magic' : selected.kind === 'trap' ? 'Trap' : 'Ritual'}
              </p>
              <p class="mt-3 text-sm">
                <span class="text-muted-foreground">Deck Cost</span>
                <strong class="ml-2">{selected.deckCost ?? 'Unknown'}</strong>
              </p>
              <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
                Reward cards are random, generally with similar Deck Costs. A particular
                result cannot be guaranteed, and this guide does not verify card eligibility.
              </p>
              {#if selected.deckCost === null}
                <p class="warning-note mt-3">
                  This library entry has no ordinary Deck Cost. No reward estimate is possible.
                </p>
              {/if}
              <a class="mt-3 inline-block text-xs text-link"
                href={'/cards/?q=' + String(selected.id).padStart(3, '0')}>
                View this card in Card Library →
              </a>
            </div>
          </div>
        {:else}
          <div class="mt-4 rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            Select a card to inspect its Deck Cost and artwork. No cards are consumed here.
          </div>
        {/if}
      </section>

      <ReincarnationOdds {cards} input={selected} />

      <section class="rounded-lg border border-border bg-surface p-4" aria-label="How to reincarnate in-game">
        <h2 class="text-base font-semibold">How to reincarnate in-game</h2>
        <ol class="mt-3 grid list-decimal gap-2 pl-5 text-sm leading-relaxed">
          <li>Complete five 1-player duels against the CPU after your last reincarnation.</li>
          <li>Open <strong>Build Deck</strong> and move into the <strong>Chest</strong>.</li>
          <li>When <strong>Reincarnation</strong> flashes, highlight a spare Chest card.</li>
          <li>Press <strong>L3</strong> (click the left analog stick), choose <strong>Yes</strong>, then press <strong>×</strong>.</li>
          <li>That card is exchanged for three random cards. Check the results in the game.</li>
        </ol>
        <p class="mt-3 text-xs text-muted-foreground">
          Only one opportunity is available at a time; completing ten duels without using it
          does not bank two uses. On PCSX2, L3 means the controller input mapped to L3.
        </p>
        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <a class="text-link" target="_blank" rel="noreferrer"
            href="https://www.videogamemanual.com/PS2/Yu-Gi-Oh%21%20The%20Duelists%20of%20the%20Roses%20%28USA%29.pdf">
            PS2 game manual ↗
          </a>
          <a class="text-link" href="https://gamefaqs.gamespot.com/ps2/589455-yu-gi-oh-the-duelists-of-the-roses/faqs/31810"
            target="_blank" rel="noreferrer">Community gameplay guide ↗</a>
        </div>
      </section>
    </div>

    <div class="grid min-w-0 gap-4">
      <section class="rounded-lg border border-border bg-surface p-4" aria-label="Manual duel progress">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">Duel progress</h2>
          <span class="rounded-md bg-elevated px-2 py-1 text-xs text-muted-foreground">Manual tracker</span>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          Only record finished 1-player CPU duels. This is stored separately in your browser,
          not synchronized with PCSX2, decks, or Collection.
        </p>

        {#if !ready}
          <p class="mt-3 text-sm text-muted-foreground">Loading saved progress…</p>
        {:else}
          {#if warning}<p class="warning-note mt-3" role="alert">{warning}</p>{/if}
          {#if notice}<p class="mt-3 text-xs text-muted-foreground" role="status">{notice}</p>{/if}
          <div class="mt-4 flex items-end justify-between gap-2">
            <p class="text-3xl font-semibold tabular-nums">{progress.duelsCompleted}<span
              class="text-base font-normal text-muted-foreground"> / {REINCARNATION_DUELS}</span></p>
            <p class="text-xs font-medium" class:text-primary={readyForUse}>
              {readyForUse ? 'Check availability in-game' : remaining + ' more duels'}
            </p>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-elevated" role="progressbar"
            aria-label="Completed 1-player CPU duels since last reincarnation"
            aria-valuemin={0} aria-valuemax={REINCARNATION_DUELS}
            aria-valuenow={progress.duelsCompleted}>
            <div class="h-full rounded-full bg-primary transition-[width]" style={'width: ' + progressPercent + '%'}></div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" onclick={recordDuel} disabled={blocked || readyForUse}
              class="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              + Completed duel
            </button>
            <button type="button" onclick={undoDuel} disabled={blocked || progress.duelsCompleted === 0}
              class="rounded-md border border-border px-3 py-2 text-sm hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50">
              Undo
            </button>
          </div>
          {#if readyForUse}
            <p class="mt-3 rounded-md bg-selected p-3 text-sm text-foreground">
              Your manual count is 5/5. Confirm the flashing Reincarnation prompt
              in your game's Chest before proceeding.
            </p>
          {/if}
          <div class="mt-4 border-t border-border pt-3">
            <button type="button" onclick={recordUse} disabled={blocked || progress.duelsCompleted === 0}
              class="text-sm font-medium text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50">
              I used reincarnation · reset count to 0
            </button>
            <p class="mt-1 text-xs text-muted-foreground">
              Reset only after using the opportunity in-game, or to correct your manually entered count.
            </p>
          </div>
        {/if}
      </section>

      <section class="rounded-lg border border-border bg-surface p-4" aria-label="Reward uncertainty">
        <h2 class="text-base font-semibold">What can I get?</h2>
        <p class="mt-2 text-sm leading-relaxed">
          The game generates <strong>three random cards</strong> from the sacrificed card.
          Deck Cost matters. The optional calculator shows only a qualified
          single-result estimate from published NTSC-U community research.
        </p>
        <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
          The original game code and actual three-card RNG have not been
          verified by this project. Different references disagree about some
          probability details; the estimates above are not guaranteed drops.
        </p>
        <a class="mt-3 inline-block text-xs text-link" target="_blank" rel="noreferrer"
          href="https://www.speedrun.com/yugiohdotr/forums/ch2hb">
          Reincarnation reverse-engineering research ↗
        </a>
      </section>
    </div>
  </div>
</section>
