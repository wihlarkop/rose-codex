<script lang="ts">
  import type { BrowserCard } from '../lib/dotr/browser';
  import type { FusionOccurrence } from '../lib/dotr/fusion-discovery';
  import type { TacticalReport } from '../lib/dotr/tactical-duel';
  import {
    MAX_SP, nextTurnSP, rankTacticalDecisions, sourceFieldDistance,
    type BattleSnapshot, type GridSquare, type PlayedCard,
  } from '../lib/dotr/battle-state';

  let { cards, hand, field, report }: {
    cards: BrowserCard[];
    hand: FusionOccurrence[];
    field: FusionOccurrence[];
    report: TacticalReport;
  } = $props();
  const byId = $derived(new Map(cards.map(card => [card.id, card])));
  const axis = [0, 1, 2, 3, 4, 5, 6];
  let spText = $state('');
  let played = $state<PlayedCard>('unknown');
  let leaderRow = $state('');
  let leaderCol = $state('');
  let enemyRow = $state('');
  let enemyCol = $state('');
  let positions = $state<Record<string, { row: string; col: string }>>({});
  const square = (r: string, c: string): GridSquare | null =>
    r !== '' && c !== '' ? { row: Number(r), col: Number(c) } : null;
  const snapshot = $derived<BattleSnapshot>({
    summoningPoints: spText === '' ? null : Number(spText),
    alreadyPlayedCard: played,
    leaderSquare: square(leaderRow, leaderCol),
    enemySquare: square(enemyRow, enemyCol),
    fieldSquares: Object.fromEntries(field.map(item => [
      item.instanceId, square(positions[item.instanceId]?.row ?? '',
        positions[item.instanceId]?.col ?? ''),
    ])),
  });
  const decisions = $derived(rankTacticalDecisions(hand, report, byId, snapshot));
  const blocked = $derived(decisions.filter(item => item.status === 'blocked'));
  const viable = $derived(decisions.filter(item => item.status !== 'blocked').slice(0, 8));
  function editSquare(id: string, axis: 'row' | 'col', value: string) {
    const previous = positions[id] ?? { row: '', col: '' };
    positions = { ...positions, [id]: { ...previous, [axis]: value } };
  }
  function reset() {
    spText = ''; played = 'unknown'; leaderRow = ''; leaderCol = '';
    enemyRow = ''; enemyCol = ''; positions = {};
  }
</script>

<section class="mt-4 rounded-lg border border-border bg-surface p-4"
  aria-label="Battle state and tactical decision planning">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="text-base font-semibold">Battle State & Decision Planner</h2>
      <p class="mt-1 text-xs text-muted-foreground">
        M5-05 / M5-06 · Enter only information you can confirm on the current turn.
      </p>
    </div>
    <button type="button" class="rounded-md border border-border px-3 py-2 text-xs hover:bg-hover"
      onclick={reset}>Reset battle inputs</button>
  </div>
  <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <label class="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">
      Current Summoning Points
      <select class="native-filter w-full" bind:value={spText}>
        <option value="">Unknown</option>
        {#each Array.from({ length: MAX_SP + 1 }, (_, n) => n) as n (n)}
          <option value={String(n)}>{n}</option>
        {/each}
      </select>
    </label>
    <label class="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">
      Already played a card this turn?
      <select class="native-filter w-full" bind:value={played}>
        <option value="unknown">Not sure</option>
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </select>
    </label>
    <label class="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">
      Deck Leader row (1–7)
      <select class="native-filter w-full" bind:value={leaderRow}>
        <option value="">Unknown</option>
        {#each axis as row (row)}<option value={String(row)}>{row + 1}</option>{/each}
      </select>
    </label>
    <label class="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">
      Deck Leader column (1–7)
      <select class="native-filter w-full" bind:value={leaderCol}>
        <option value="">Unknown</option>
        {#each axis as col (col)}<option value={String(col)}>{col + 1}</option>{/each}
      </select>
    </label>
  </div>
  <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
    Normal battle begins with 4 SP. Each new turn adds 3, capped at 12.
    {#if snapshot.summoningPoints !== null}
      With {snapshot.summoningPoints} SP now, a hypothetical next turn starts
      at at most {nextTurnSP(snapshot.summoningPoints)} SP before other costs or effects.
    {/if}
    Placing a card also requires an unoccupied square near the Deck Leader; this
    form cannot verify square occupancy.
  </p>

  <details class="mt-4 rounded-md border border-border p-3">
    <summary class="cursor-pointer text-sm font-semibold text-primary">
      Optional 7×7 position observations
    </summary>
    <p class="mt-2 text-xs text-muted-foreground">
      Row and column are your manual reference coordinates, not a
      verified representation of the PCSX2 camera orientation.
      Adjacency does not prove legal movement, attack range, or open paths.
    </p>
    <div class="mt-3 grid gap-2 sm:grid-cols-2">
      <label class="grid gap-1 text-xs text-muted-foreground">
        Enemy monster row
        <select class="native-filter w-full" bind:value={enemyRow}>
          <option value="">Unknown</option>
          {#each axis as row (row)}<option value={String(row)}>{row + 1}</option>{/each}
        </select>
      </label>
      <label class="grid gap-1 text-xs text-muted-foreground">
        Enemy monster column
        <select class="native-filter w-full" bind:value={enemyCol}>
          <option value="">Unknown</option>
          {#each axis as col (col)}<option value={String(col)}>{col + 1}</option>{/each}
        </select>
      </label>
    </div>
    {#if field.length}
      <div class="mt-3 grid gap-3">
        {#each field as item, index (item.instanceId)}
          <div class="grid items-end gap-2 rounded-md bg-elevated p-2 sm:grid-cols-[minmax(0,1fr)_90px_90px]">
            <strong class="text-xs">{index + 1}. {byId.get(item.cardId)?.name ?? '#' + item.cardId}</strong>
            <label class="grid gap-1 text-xs text-muted-foreground">
              Row
              <select class="native-filter w-full"
                value={positions[item.instanceId]?.row ?? ''}
                onchange={(event) => editSquare(item.instanceId, 'row', event.currentTarget.value)}>
                <option value="">?</option>
                {#each axis as row (row)}<option value={String(row)}>{row + 1}</option>{/each}
              </select>
            </label>
            <label class="grid gap-1 text-xs text-muted-foreground">
              Column
              <select class="native-filter w-full"
                value={positions[item.instanceId]?.col ?? ''}
                onchange={(event) => editSquare(item.instanceId, 'col', event.currentTarget.value)}>
                <option value="">?</option>
                {#each axis as col (col)}<option value={String(col)}>{col + 1}</option>{/each}
              </select>
            </label>
          </div>
        {/each}
      </div>
    {/if}
  </details>
  <div class="mt-4">
    <h3 class="text-sm font-semibold">Ranked considerations</h3>
    <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
      Only confirmed one-play/SP failures are marked blocked. All other actions
      still require in-game checks, including terrain, effects, movement,
      reachability, summon squares and turn state. Not a win probability.
    </p>
    {#if viable.length}
      <ol class="mt-2 grid gap-2 sm:grid-cols-2">
        {#each viable as decision (decision.id)}
          <li class="rounded-md border border-border bg-elevated p-3">
            <div class="flex flex-wrap items-baseline gap-2">
              <strong class="text-sm">{decision.title}</strong>
              <span class="text-xs text-muted-foreground">
                {decision.status === 'information-needed' ? 'More evidence needed' : 'Conditional'}
              </span>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-muted-foreground">{decision.detail}</p>
            {#if decision.type === 'attack-check' && decision.cardId !== null}
              {@const matching = report.options.find(option =>
                option.kind === 'field-comparison' && option.cardId === decision.cardId)}
              {#if matching}
                {@const relation = sourceFieldDistance(matching, field, snapshot)}
                <p class="mt-1 text-xs text-muted-foreground">
                  Manual coordinate relationship: {relation === 'neighbor'
                    ? 'Adjacent squares (attack legality unverified)'
                    : relation === 'same' ? 'Same square entered — recheck input'
                      : relation === 'separated' ? 'Separated squares — movement/path must be checked'
                        : 'Unknown'}
                </p>
              {/if}
            {/if}
          </li>
        {/each}
      </ol>
    {:else}
      <p class="mt-3 rounded-md bg-elevated p-3 text-xs text-muted-foreground">
        Enter Hand or Field monsters above to see conditional choices.
      </p>
    {/if}
    {#if blocked.length}
      <details class="mt-3 rounded-md border border-border p-3">
        <summary class="cursor-pointer text-xs font-semibold">
          {blocked.length} blocked card-play option(s) · verified basic constraints
        </summary>
        <ul class="mt-2 grid gap-2">
          {#each blocked as item (item.id)}
            <li class="text-xs"><strong>{item.title}:</strong> {item.detail}</li>
          {/each}
        </ul>
      </details>
    {/if}
  </div>
</section>
