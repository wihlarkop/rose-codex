<script lang="ts">
  import CardArtwork from './cards/CardArtwork.svelte';
  import CardPicker from './cards/CardPicker.svelte';
  import type { BrowserCard } from '../lib/dotr/browser';
  import {
    REINCARNATION_RANK_OPTIONS,
    REINCARNATION_RESEARCH,
    REINCARNATION_EXCLUDED_REWARDS,
    estimateReincarnation,
  } from '../lib/dotr/reincarnation-odds';

  let { cards, input }: { cards: BrowserCard[]; input: BrowserCard | null } = $props();
  const byId = $derived(new Map(cards.map(card => [card.id, card])));
  let rankA = $state('');
  let rankB = $state('');
  let targetId = $state<number | null>(null);
  const targetCard = $derived(targetId === null ? null : byId.get(targetId) ?? null);
  const result = $derived(
    input && rankA !== '' && rankB !== ''
      ? estimateReincarnation(input.id, Number(rankA), Number(rankB), cards)
      : null,
  );
  const selectedTargetChance = $derived(
    result?.results.find(row => row.cardId === targetId)?.probability ?? 0,
  );

  function percent(value: number): string {
    if (value <= 0) return '0%';
    const percentage = value * 100;
    return percentage < 0.01 ? '<0.01%' : percentage.toFixed(2) + '%';
  }
</script>

<section class="rounded-lg border border-border bg-surface p-4" aria-label="Reincarnation research odds">
  <header>
    <h2 class="text-base font-semibold">Research Probability Calculator</h2>
    <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
      Optional <strong>NTSC-U community-research estimate</strong> for a single random reward,
      not verified game drop rates. The original card is sacrificed in-game;
      this page never consumes it.
    </p>
  </header>

  {#if input === null}
    <p class="mt-3 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
      Select a card above to explore its community-modeled possible rewards.
    </p>
  {:else if input.deckCost === null}
    <p class="warning-note mt-3">
      This card has no known Deck Cost in the canonical dataset. A probability
      estimate cannot be calculated.
    </p>
  {:else}
    <div class="mt-3 grid gap-3 sm:grid-cols-2">
      <label class="grid gap-1 text-xs font-semibold text-muted-foreground" for="reincarnation-rank-a">
        Deck Leader rank · Slot A
        <select id="reincarnation-rank-a" class="native-filter w-full" bind:value={rankA}>
          <option value="">Unknown / not checked</option>
          {#each REINCARNATION_RANK_OPTIONS as rank (rank.value)}
            <option value={String(rank.value)}>{rank.label}</option>
          {/each}
        </select>
      </label>
      <label class="grid gap-1 text-xs font-semibold text-muted-foreground" for="reincarnation-rank-b">
        Deck Leader rank · Slot B
        <select id="reincarnation-rank-b" class="native-filter w-full" bind:value={rankB}>
          <option value="">Unknown / not checked</option>
          {#each REINCARNATION_RANK_OPTIONS as rank (rank.value)}
            <option value={String(rank.value)}>{rank.label}</option>
          {/each}
        </select>
      </label>
    </div>
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      Enter both ranks as they appear in the game. An absent or unpromoted leader
      is treated as rank NCO/0 only when you select it explicitly. This model
      follows the <strong>higher of A/B</strong>; Slot C is ignored.
    </p>
    {#if result}
      <div class="mt-3 grid gap-2 sm:grid-cols-3" aria-label="Model parameters">
        <div class="rounded-md bg-elevated p-3">
          <span class="block text-xs text-muted-foreground">Higher-cost range</span>
          <strong class="text-lg tabular-nums">{percent(result.highRangeChance)}</strong>
          <span class="block text-xs text-muted-foreground">DC +1 to +10</span>
        </div>
        <div class="rounded-md bg-elevated p-3">
          <span class="block text-xs text-muted-foreground">Lower-cost range</span>
          <strong class="text-lg tabular-nums">{percent(result.lowRangeChance)}</strong>
          <span class="block text-xs text-muted-foreground">DC -10 to +1</span>
        </div>
        <div class="rounded-md bg-elevated p-3">
          <span class="block text-xs text-muted-foreground">Modeled unique rewards</span>
          <strong class="text-lg tabular-nums">{result.results.length}</strong>
          <span class="block text-xs text-muted-foreground">One reward position</span>
        </div>
      </div>

      <div class="mt-4 rounded-md border border-border p-3">
        <h3 class="text-sm font-semibold">Check a particular reward</h3>
        <p class="mb-2 mt-1 text-xs text-muted-foreground">
          Search any card. Excluded or out-of-range cards have 0% in this research model,
          not a game-tested impossibility claim.
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <CardPicker {cards} label="Choose reward to check" selectedCardId={targetId}
            onselect={(id) => targetId = id} />
          {#if targetId !== null}
            <button type="button" class="rounded-md border border-border px-3 py-2 text-xs hover:bg-hover"
              onclick={() => targetId = null}>Clear</button>
          {/if}
        </div>
        {#if targetCard}
          <div class="mt-3 flex items-center gap-3 rounded-md bg-elevated p-2">
            <div class="w-16 shrink-0 overflow-hidden rounded-sm">
              <CardArtwork image={targetCard.image} name={targetCard.name} cardId={targetCard.id} decorative />
            </div>
            <div class="min-w-0">
              <strong class="block text-sm">{targetCard.name}</strong>
              <span class="block text-lg font-semibold tabular-nums text-primary">
                {percent(selectedTargetChance)}
              </span>
              <span class="block text-xs text-muted-foreground">
                Estimated for one result slot · no three-card odds inferred
              </span>
              {#if REINCARNATION_EXCLUDED_REWARDS.has(targetCard.id)}
                <span class="mt-1 block text-xs text-warning">
                  Excluded from rewards in the published NTSC-U research list.
                </span>
              {:else if input.id === targetCard.id}
                <span class="mt-1 block text-xs text-muted-foreground">
                  The sacrificed ID is excluded by the published research rule.
                </span>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <div class="mt-4">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="text-sm font-semibold">Top modeled rewards</h3>
          <span class="text-xs text-muted-foreground">
            First {Math.min(12, result.results.length)} by one-slot probability
          </span>
        </div>
        <ol class="mt-2 grid gap-1.5">
          {#each result.results.slice(0, 12) as entry, index (entry.cardId)}
            {@const card = byId.get(entry.cardId)}
            {#if card}
              <li class="flex items-center gap-2 rounded-md bg-elevated p-2">
                <span class="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div class="w-14 shrink-0 overflow-hidden rounded-sm">
                  <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
                </div>
                <div class="min-w-0 flex-1">
                  <strong class="block text-xs">{card.name}</strong>
                  <span class="block text-xs text-muted-foreground">
                    #{String(card.id).padStart(3, '0')} · DC {card.deckCost ?? 'unknown'}
                  </span>
                </div>
                <strong class="shrink-0 text-sm tabular-nums text-primary">
                  {percent(entry.probability)}
                </strong>
              </li>
            {/if}
          {/each}
        </ol>
      </div>
    {:else}
      <p class="mt-3 rounded-md bg-elevated p-3 text-sm text-muted-foreground">
        Select both Deck Leader ranks to calculate an estimate. No rank is inferred
        from your browser decks or PCSX2 save.
      </p>
    {/if}
  {/if}

  <details class="mt-4 rounded-md border border-border p-3">
    <summary class="cursor-pointer text-sm font-semibold text-primary">
      Model limitations and research sources
    </summary>
    <div class="mt-2 grid gap-2 text-xs leading-relaxed text-muted-foreground">
      <p>
        This model uses the published 80%/20% or 60%/40% monster/non-monster split,
        the higher rank of Slots A/B, evenly weighted costs within the stated two
        ranges, and a lower-cost fallback when a candidate pool is empty. The
        167 reward exclusions are sourced as factual Card IDs from GenericMadScientist.
        Another community calculator agrees on the eligible ID set but differs
        in rank aggregation and high-range boundaries/weights.
      </p>
      <p>
        Trap/Ritual/Magic cards are grouped as non-monsters. The result represents
        a <strong>community model for a single reward</strong>, not an actual roll,
        a three-card bundle prediction, independently measured RNG, or proof that
        the three awards are independent or allow duplicates. Region differences
        and effects of unknown save state are not modeled.
      </p>
      <div class="flex flex-wrap gap-3">
        <a class="text-link" href={REINCARNATION_RESEARCH.rules} target="_blank" rel="noreferrer">
          Reverse-engineering notes ↗
        </a>
        <a class="text-link" href={REINCARNATION_RESEARCH.exclusions} target="_blank" rel="noreferrer">
          Reward exclusions ↗
        </a>
        <a class="text-link" href={REINCARNATION_RESEARCH.alternate} target="_blank" rel="noreferrer">
          Disagreeing reference ↗
        </a>
      </div>
    </div>
  </details>
</section>
