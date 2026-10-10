<script lang="ts">
  import { onMount } from 'svelte';
  import Swords from '@lucide/svelte/icons/swords';
  import TacticalDuelCoach from '../../components/TacticalDuelCoach.svelte';
  import BattleLab from '../battle-lab/BattleLab.svelte';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import type { Card, FusionData } from '../../lib/dotr/model';
  import { parseDuelView, duelViewPath, type DuelView } from './duel-navigation';

  let {
    cards,
    canonicalCards,
    fusions,
    allowedCardIds,
  }: {
    cards: BrowserCard[];
    canonicalCards: Card[];
    fusions: FusionData;
    allowedCardIds: number[];
  } = $props();

  let view = $state<DuelView>('plan');
  let historyVisited = $state(false);

  onMount(() => {
    view = parseDuelView(window.location.search);
    historyVisited = view === 'history';
    const onHistory = () => {
      view = parseDuelView(window.location.search);
      if (view === 'history') historyVisited = true;
    };
    window.addEventListener('popstate', onHistory);
    return () => window.removeEventListener('popstate', onHistory);
  });

  function selectView(next: DuelView) {
    if (view === next) return;
    view = next;
    if (next === 'history') historyVisited = true;
    history.pushState(null, '', duelViewPath(next, window.location.search));
  }
</script>

<section class="duel-companion" aria-label="Duel Companion">
  <div class="duel-heading">
    <div class="duel-identity">
      <div class="duel-symbol" aria-hidden="true"><Swords size={22} /></div>
      <div>
        <h1>Duel Companion</h1>
        <p>Plan your next move, then record what actually happened in PCSX2.</p>
      </div>
    </div>
    <a class="deck-link" href="/decks/">Deck Workshop →</a>
  </div>

  <nav class="duel-modes" aria-label="Duel Companion modes">
    <button
      type="button"
      class:current={view === 'plan'}
      aria-pressed={view === 'plan'}
      onclick={() => selectView('plan')}>Plan Duel</button
    >
    <button
      type="button"
      class:current={view === 'history'}
      aria-pressed={view === 'history'}
      onclick={() => selectView('history')}>Battle History</button
    >
  </nav>

  <!-- Keep the planner mounted: switching to history must not discard a live duel. -->
  <div class="duel-planner" hidden={view !== 'plan'}>
    <TacticalDuelCoach {cards} {canonicalCards} {fusions} embedded />
  </div>
  {#if historyVisited}
    <div class="duel-history" hidden={view !== 'history'}>
      <BattleLab {allowedCardIds} embedded />
    </div>
  {/if}
</section>

<style>
  .duel-companion {
    min-width: 0;
  }
  .duel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .duel-identity {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-width: 0;
  }
  .duel-symbol {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    height: 42px;
    width: 42px;
    border-radius: 10px;
    background: var(--selected);
    color: var(--primary);
  }
  .duel-heading h1 {
    margin: 0;
    font-size: 1.55rem;
    letter-spacing: -0.025em;
    line-height: 1.3;
  }
  .duel-heading p {
    margin: 0.25rem 0 0;
    color: var(--muted-foreground);
    font-size: 0.84rem;
  }
  .deck-link {
    color: var(--primary);
    font-weight: 650;
    font-size: 0.82rem;
    text-decoration: none;
  }
  .deck-link:hover {
    text-decoration: underline;
  }
  .duel-modes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.55rem;
    margin-bottom: 1.25rem;
  }
  .duel-modes button {
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: var(--muted-foreground);
    font-size: 0.875rem;
    font-weight: 650;
    padding: 0.55rem 1.05rem;
  }
  .duel-modes button.current {
    border-color: var(--border);
    background: var(--selected);
    color: var(--primary);
  }
  .duel-modes button:hover:not(.current) {
    color: var(--foreground);
    background: var(--hover);
  }
  .duel-planner[hidden],
  .duel-history[hidden] {
    display: none;
  }
</style>
