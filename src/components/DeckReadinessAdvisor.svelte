<script lang="ts">
  import CardPicker from './cards/CardPicker.svelte';
  import type { BrowserCard } from '../lib/dotr/browser';
  import { analyzeDeckReadiness, type LeaderRankEvidence } from '../lib/dotr/deck-readiness';
  import { OPPONENTS } from '../lib/dotr/opponents';

  let { cards, cardIds }: { cards: BrowserCard[]; cardIds: number[] } = $props();
  const cardById = $derived(new Map(cards.map((card) => [card.id, card])));
  const leaders = $derived(
    cards.filter((card) => card.kind === 'monster' && card.level !== null),
  );
  let leaderId = $state<number | null>(null);
  let leaderRank = $state<LeaderRankEvidence>('unknown');
  let opponentId = $state('');
  const opponent = $derived(OPPONENTS.find((entry) => entry.id === opponentId) ?? null);
  const report = $derived(
    analyzeDeckReadiness(cardIds, cardById, leaderId, leaderRank, opponent),
  );

  function chooseLeader(id: number) {
    leaderId = id;
    leaderRank = 'unknown';
  }
</script>

<details class="rounded-lg border border-border bg-surface p-4" open>
  <summary class="cursor-pointer text-sm font-semibold text-primary">
    Deck Readiness · Campaign Budget
    <span class="ml-2 text-xs font-normal text-muted-foreground">
      Manual, read-only checks
    </span>
  </summary>
  <p class="mb-3 mt-2 text-xs leading-relaxed text-muted-foreground">
    Check the game's 40-card, three-copy and Deck Cost rules against a reported
    campaign opponent. Select your actual Deck Leader and confirm its rank yourself;
    Rose Codex cannot inspect your PCSX2 save.
  </p>

  <div class="grid gap-3 sm:grid-cols-2">
    <div class="min-w-0">
      <span class="mb-1 block text-xs font-semibold text-muted-foreground">Your Deck Leader</span>
      <div class="flex flex-wrap items-center gap-2">
        <CardPicker
          cards={leaders}
          label="Choose a Monster Deck Leader"
          selectedCardId={leaderId}
          onselect={chooseLeader}
        />
        {#if leaderId !== null}
          <button type="button"
            class="rounded-md border border-border px-2 py-2 text-xs hover:bg-hover"
            onclick={() => { leaderId = null; leaderRank = 'unknown'; }}>
            Clear
          </button>
        {/if}
      </div>
      <label class="mt-2 block text-xs text-muted-foreground" for="readiness-rank">
        Rank of this card in your current game save
      </label>
      <select id="readiness-rank" class="native-filter mt-1 w-full"
        disabled={leaderId === null} bind:value={leaderRank}>
        <option value="unknown">Unknown / not checked in game</option>
        <option value="confirmed-eligible">I verified rank 2LT or higher</option>
        <option value="confirmed-ineligible">Rank below 2LT in my save</option>
      </select>
      {#if leaderId !== null}
        <a class="mt-1 inline-block text-xs text-link"
          href={'/leaders/?card=' + leaderId}>Look up the Deck Leader reference →</a>
      {/if}
    </div>
    <div class="min-w-0">
      <label class="mb-1 block text-xs font-semibold text-muted-foreground"
        for="readiness-opponent">Campaign opponent</label>
      <select id="readiness-opponent" class="native-filter w-full" bind:value={opponentId}>
        <option value="">Choose an opponent to compare DC…</option>
        <optgroup label="Joined Red Rose · fight the Yorkists">
          {#each OPPONENTS.filter((entry) => entry.path === 'red') as entry (entry.id)}
            <option value={entry.id}>{entry.name} · {entry.location} · DC {entry.deckCost}</option>
          {/each}
        </optgroup>
        <optgroup label="Joined White Rose · fight the Lancastrians">
          {#each OPPONENTS.filter((entry) => entry.path === 'white') as entry (entry.id)}
            <option value={entry.id}>{entry.name} · {entry.location} · DC {entry.deckCost}</option>
          {/each}
        </optgroup>
      </select>
      {#if opponent}
        <p class="mt-2 text-xs text-muted-foreground">
          Reported opponent DC <strong class="text-foreground">{opponent.deckCost}</strong>
          · Required: your main-deck DC must be strictly below this value.
        </p>
        <a class="mt-1 inline-block text-xs text-link"
          href={'/opponents/?opponent=' + opponent.id}>View this opponent →</a>
      {:else}
        <p class="mt-2 text-xs text-muted-foreground">
          Uses community-reported Deck Costs from Opponent Encyclopedia.
        </p>
      {/if}
    </div>
  </div>

  <div class="mt-4 rounded-md border border-border bg-elevated p-3">
    <p class="text-sm font-semibold" role="status">
      {#if report.summary === 'needs-changes'}
        Changes needed for the checked rules
      {:else if report.summary === 'needs-confirmation'}
        More information needed
      {:else}
        Checked rules match · conditional only
      {/if}
    </p>
    <div class="mt-2 grid gap-1.5">
      {#each report.checks as check (check.id)}
        <div class="flex items-start gap-2 text-xs leading-relaxed">
          <span class="w-4 shrink-0 font-bold"
            class:text-primary={check.status === 'pass'}
            class:text-warning={check.status === 'fail'}
            aria-label={check.status}>
            {check.status === 'pass' ? '✓' : check.status === 'fail' ? '!' : '?'}
          </span>
          <span>{check.detail}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
    <div class="rounded-md border border-border p-3">
      <p class="text-xs text-muted-foreground">Your main-deck cost</p>
      <strong class="text-lg tabular-nums">{report.knownCost}</strong>
      {#if report.unknownCosts}
        <span class="text-xs text-warning"> + {report.unknownCosts} unknown cost(s)</span>
      {/if}
      {#if opponent}
        <p class="mt-2 text-xs text-muted-foreground">
          {#if report.minimumReduction !== null && report.minimumReduction > 0}
            Reduce known DC by at least
            <strong class="text-foreground">{report.minimumReduction}</strong>
            {report.unknownCosts ? ' (lower bound; unknown costs could add more).' : ' to be strictly below this opponent.'}
          {:else if report.remainingBudget !== null}
            <strong class="text-foreground">{report.remainingBudget}</strong>
            DC of headroom below the opponent's limit.
          {:else}
            Cannot confirm headroom until all card costs are known.
          {/if}
        </p>
      {/if}
    </div>
    <div class="rounded-md border border-border p-3">
      <p class="text-xs font-semibold text-muted-foreground">Over the 3-copy limit</p>
      {#if report.overCopyLimits.length}
        <ul class="mt-2 list-disc pl-4 text-xs">
          {#each report.overCopyLimits as item (item.cardId)}
            <li>{item.name}: {item.count} copies · remove {item.excess}</li>
          {/each}
        </ul>
      {:else}
        <p class="mt-2 text-xs">No copy-limit violations in the current main deck.</p>
      {/if}
    </div>
  </div>

  {#if report.costPressure.length}
    <div class="mt-3 border-t border-border pt-3">
      <h3 class="text-sm font-semibold">High-DC cards to review</h3>
      <p class="mt-1 text-xs text-muted-foreground">
        The five highest-cost card types currently in this deck, based on known
        individual DC. Consider cheaper replacements <strong>only if</strong> they
        still support your strategy. This is cost-pressure guidance, not an automatic deck optimizer.
      </p>
      <ul class="mt-2 grid gap-1 sm:grid-cols-2">
        {#each report.costPressure as item (item.cardId)}
          <li class="flex min-w-0 items-baseline justify-between gap-2 rounded-sm bg-elevated px-2 py-1.5 text-xs">
            <span class="min-w-0 truncate">{item.name} <span class="text-muted-foreground">×{item.copies}</span></span>
            <span class="shrink-0 tabular-nums text-muted-foreground">
              {item.eachCost} each · {item.combinedCost} total
            </span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  <p class="mb-0 mt-3 text-xs leading-relaxed text-muted-foreground">
    Manual reference, not a guaranteed in-game legality verdict. Deck Leader
    rank, actual owned cards, campaign state and some special card eligibility
    cannot be verified without inspecting the game. Your leader is separate from
    the 40 main-deck cards and its DC is excluded. No selections here are saved,
    no cards are added or removed, and the original deck JSON format is unchanged.
    <a class="text-link" target="_blank" rel="noreferrer"
      href="https://www.videogamemanual.com/PS2/Yu-Gi-Oh%21%20The%20Duelists%20of%20the%20Roses%20%28USA%29.pdf">
      US PS2 manual ↗
    </a>
  </p>
</details>
