<script lang="ts">
  import { onMount } from 'svelte';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Layers from '@lucide/svelte/icons/layers';
  import DeckBuilder from './DeckBuilder.svelte';
  import CollectionWorkspace from './CollectionWorkspace.svelte';
  import DeckSimulator from './DeckSimulator.svelte';
  import SmartDeckCoach from '../../components/SmartDeckCoach.svelte';
  import { parseSmartDeckLink, smartDeckLink, type PendingCoachDeck } from '../../lib/dotr/smart-deck-link';
  import type { SmartDeck } from '../../lib/dotr/smart-deck';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import type { Card, FusionData } from '../../lib/dotr/model';
  import { parseDeckWorkshopMode, deckWorkshopPath, type DeckWorkshopMode } from './workshop-navigation';

  let { cards, canonicalCards, fusionData }: {
    cards: BrowserCard[];
    canonicalCards: Card[];
    fusionData: FusionData;
  } = $props();

  let mode = $state<DeckWorkshopMode>('build');
  let generatorOpen = $state(false);
  let proposal = $state<PendingCoachDeck | null>(null);
  let practiceVisited = $state(false);
  let feedback = $state('');

  onMount(() => {
    mode = parseDeckWorkshopMode(window.location.search);
    practiceVisited = mode === 'practice';
    function onHistoryChange() {
      mode = parseDeckWorkshopMode(window.location.search);
      if (mode === 'practice') practiceVisited = true;
      generatorOpen = false;
    }
    window.addEventListener('popstate', onHistoryChange);
    return () => window.removeEventListener('popstate', onHistoryChange);
  });

  function changeMode(next: DeckWorkshopMode) {
    if (next !== mode) {
      mode = next;
      if (next === 'practice') practiceVisited = true;
      window.history.pushState(null, '', deckWorkshopPath(next, window.location.search));
    }
    generatorOpen = false;
    feedback = '';
  }

  function reviewProposal(suggestion: SmartDeck) {
    // Reuse the exact same validation as the historic coach-to-builder handoff.
    const parsed = parseSmartDeckLink(smartDeckLink(suggestion).split('?')[1] ?? '', canonicalCards);
    if (!parsed) {
      feedback = 'This deck proposal did not pass the existing Deck Builder validation. Nothing was saved.';
      return;
    }
    proposal = parsed;
    changeMode('build');
  }
</script>

<section class="deck-workshop" aria-label="Deck Workshop">
  <header class="workshop-heading">
    <div class="workshop-identity">
      <span class="workshop-mark" aria-hidden="true"><Layers size={22} /></span>
      <div>
        <h1>Deck Workshop</h1>
        <p>Build, improve, practice and manage your Duelists of the Roses decks.</p>
      </div>
    </div>
    {#if mode === 'build'}
      {#if generatorOpen}
        <button class="generator-action secondary" onclick={() => (generatorOpen = false)}>
          Back to Build
        </button>
      {:else}
        <button class="generator-action" onclick={() => (generatorOpen = true)}>
          <Sparkles size={16} aria-hidden="true" /> Generate Deck
        </button>
      {/if}
    {/if}
  </header>

  <nav class="workshop-modes" aria-label="Deck Workshop modes">
    <button type="button" aria-pressed={mode === 'build'} class:current={mode === 'build'} onclick={() => changeMode('build')}>Build</button>
    <button type="button" aria-pressed={mode === 'practice'} class:current={mode === 'practice'} onclick={() => changeMode('practice')}>Practice</button>
    <button type="button" aria-pressed={mode === 'inventory'} class:current={mode === 'inventory'} onclick={() => changeMode('inventory')}>Inventory</button>
  </nav>

  {#if feedback}<p class="workshop-feedback" role="alert">{feedback}</p>{/if}
  {#if mode === 'build'}
    {#if generatorOpen}
      <SmartDeckCoach cards={canonicalCards} images={cards} fusions={fusionData} onpropose={reviewProposal} />
    {:else}
      <DeckBuilder {cards} embedded proposedDeck={proposal} onproposalhandled={() => (proposal = null)} />
    {/if}
  {/if}
  {#if practiceVisited}
    <div hidden={mode !== 'practice'} class="practice-region">
      <DeckSimulator {cards} {canonicalCards} {fusionData} embedded />
    </div>
  {/if}
  {#if mode === 'inventory'}
    <CollectionWorkspace {cards} embedded />
  {/if}
</section>
<style>
  .deck-workshop { min-width:0; }
  .workshop-heading { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center;
    gap:1rem; margin-bottom:1rem; }
  .workshop-identity { display:flex; align-items:center; gap:.9rem; min-width:0; }
  .workshop-mark { display:grid; place-items:center; width:42px; height:42px; flex-shrink:0;
    background:var(--selected); color:var(--primary); border-radius:10px; }
  .workshop-heading h1 { margin:0; font-size:1.55rem; letter-spacing:-.025em; line-height:1.3; }
  .workshop-heading p { margin:.3rem 0 0; color:var(--muted-foreground); font-size:.83rem; line-height:1.45; }
  .generator-action { display:inline-flex; gap:.55rem; align-items:center; justify-content:center;
    min-height:40px; border:1px solid var(--primary); border-radius:7px; background:var(--primary);
    color:var(--primary-foreground); padding:.55rem .9rem; font-size:.83rem; font-weight:700; }
  .generator-action.secondary { border-color:var(--border); background:var(--surface); color:var(--foreground); }
  .generator-action:hover { filter:brightness(.95); }
  .workshop-modes { display:flex; gap:.45rem; flex-wrap:wrap; border-bottom:1px solid var(--border);
    padding-bottom:.55rem; margin-bottom:1.25rem; }
  .workshop-modes button { padding:.55rem 1.05rem; font-size:.875rem; border:1px solid transparent;
    border-radius:7px; color:var(--muted-foreground); background:transparent; font-weight:650; }
  .workshop-modes button.current { border-color:var(--border); background:var(--selected); color:var(--primary); }
  .workshop-modes button:hover:not(.current) { color:var(--foreground); background:var(--hover); }
  .workshop-feedback { border:1px solid var(--border); border-radius:7px; padding:.75rem;
    color:var(--destructive); font-size:.8rem; }
  .practice-region[hidden] { display:none; }
  @media (max-width:520px) { .workshop-heading { align-items:stretch; } .generator-action { width:100%; } }
</style>
