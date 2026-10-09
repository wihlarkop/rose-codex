<script lang="ts">
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import CardPicker from '../../components/cards/CardPicker.svelte';
  import {
    DUEL_TERRAINS,
    suggestDuelPlays,
    type DuelTerrain,
    type OpponentPosition,
  } from '../../lib/dotr/duel-advisor';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import type { FusionDiscovery, FusionOccurrence } from '../../lib/dotr/fusion-discovery';

  let {
    cards,
    discovery,
    occurrences,
    onviewfusion,
  }: {
    cards: BrowserCard[];
    discovery: FusionDiscovery;
    occurrences: FusionOccurrence[];
    onviewfusion: (id: number) => void;
  } = $props();

  const byId = $derived(new Map(cards.map((card) => [card.id, card])));
  const monsters = $derived(cards.filter((card) => card.kind === 'monster'));
  let opponentId = $state<number | null>(null);
  let position = $state<OpponentPosition>('unknown');
  let terrain = $state<DuelTerrain>('Normal');
  const opponent = $derived(opponentId === null ? null : byId.get(opponentId) ?? null);
  const comparison = $derived(
    suggestDuelPlays(occurrences, discovery, byId, {
      opponentCardId: opponentId,
      opponentPosition: position,
      terrain,
    }),
  );
  const knownOpponent = $derived(opponent !== null && position !== 'unknown');
  const specialTerrain = $derived(['Toon', 'Labyrinth', 'Crush'].includes(terrain));

  function selectOpponent(cardId: number) {
    opponentId = cardId;
    position = 'attack';
  }
  function clearOpponent() {
    opponentId = null;
    position = 'unknown';
  }
</script>

<details class="duel-advisor mb-5 rounded-lg border border-border bg-surface p-3">
  <summary class="cursor-pointer text-sm font-semibold text-primary">
    Duel Strategy · Compare your cards against an opponent
  </summary>
  <p class="mb-3 mt-2 text-xs leading-relaxed text-muted-foreground">
    Optional battle planning using the cards already entered in Hand/Summoning Area.
    Check the opponent and the terrain at the intended battle square. Rankings show
    <strong>stat comparisons, not guaranteed legal or winning plays</strong>.
  </p>

  <div class="context-grid">
    <div class="context-control">
      <span class="field-label">Opponent's visible monster</span>
      <div class="flex flex-wrap items-center gap-2">
        <CardPicker
          cards={monsters}
          label="Choose opponent monster"
          selectedCardId={opponentId}
          onselect={selectOpponent}
        />
        {#if opponent}
          <button class="control-button" type="button" onclick={clearOpponent}>Clear</button>
        {/if}
      </div>
      {#if opponent}
        <div class="opponent-card mt-2">
          <div class="w-12 shrink-0 overflow-hidden rounded-sm">
            <CardArtwork image={opponent.image} name={opponent.name} cardId={opponent.id} decorative />
          </div>
          <div class="min-w-0">
            <strong>{opponent.name}</strong>
            <span>ATK {opponent.atk ?? 'unknown'} · DEF {opponent.def ?? 'unknown'}</span>
          </div>
        </div>
      {/if}
    </div>
    <label class="context-control">
      <span class="field-label">Opponent's position</span>
      <select class="native-filter w-full" bind:value={position}>
        <option value="unknown">Face-down / Unknown</option>
        <option value="attack">Face-up · Attack</option>
        <option value="defense">Face-up · Defense</option>
      </select>
    </label>
    <label class="context-control">
      <span class="field-label">Expected battle-square terrain</span>
      <select class="native-filter w-full" bind:value={terrain}>
        {#each DUEL_TERRAINS as field (field)}
          <option value={field}>{field}</option>
        {/each}
      </select>
    </label>
  </div>

  {#if specialTerrain}
    <p class="warning-note my-3">
      {terrain} has special mechanics. This advisor does not simplify it to a
      +500/−500 modifier; battle outcomes are unknown.
    </p>
  {:else if !knownOpponent}
    <p class="note my-3">
      {position === 'unknown'
        ? 'Enemy card or position is hidden/unknown. Ranked cards below show potential ATK only; no battle outcome is predicted.'
        : 'Select the face-up enemy monster to enable a conditional ATK-versus-ATK/DEF comparison.'}
    </p>
  {/if}

  <div class="mt-3 flex items-center justify-between gap-2">
    <h3 class="m-0 text-sm font-semibold">Possible plays · by known stats</h3>
    <span class="text-xs text-muted-foreground">Top {comparison.length}</span>
  </div>
  {#if !discovery.complete}
    <p class="mt-2 text-xs text-warning">
      Fusion discovery is partial. Additional recipes may exist, so this is not an exhaustive strategy ranking.
    </p>
  {/if}
  {#if comparison.length}
    <ol class="mt-2 grid list-none gap-2 p-0">
      {#each comparison as play, index (play.source + '-' + (play.recipe?.instanceIds.join('-') ?? play.sourceLabel))}
        {@const card = byId.get(play.cardId)!}
        <li class="play-row">
          <div class="w-12 shrink-0 overflow-hidden rounded-sm">
            <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-2">
              <span class="text-xs font-semibold text-primary">#{index + 1}</span>
              <strong class="text-sm">{card.name}</strong>
              <span class="text-xs text-muted-foreground">{play.sourceLabel}</span>
            </div>
            <p class="mb-0 mt-1 text-xs text-muted-foreground">
              {play.attack === null ? 'Adjusted ATK unknown' : 'Adjusted ATK ' + play.attack}
              {#if play.targetStat !== null}
                · Enemy {position === 'defense' ? 'DEF' : 'ATK'} {play.targetStat}
              {/if}
            </p>
            <p class="mb-0 mt-1 text-xs" class:text-primary={play.outcome === 'stat-edge'}>
              {#if play.outcome === 'stat-edge'}
                Stat edge +{play.advantage} · if battle is legal and no effects intervene
              {:else if play.outcome === 'stat-tie'}
                Equal stats · no clear advantage
              {:else if play.outcome === 'stat-trail'}
                Below enemy stat by {Math.abs(play.advantage ?? 0)} · consider avoiding contact
              {:else}
                Battle result not determined from available data
              {/if}
            </p>
            {#if play.source === 'fusion' && play.recipe?.mode !== 'hand'}
              <p class="mb-0 mt-1 text-xs text-warning">
                Field-assisted recipe: board movement and timing are unverified.
              </p>
            {/if}
          </div>
          {#if play.source === 'fusion'}
            <button class="control-button" type="button"
              aria-label={'View fusion recipe for ' + card.name}
              onclick={() => onviewfusion(play.cardId)}>View recipe →</button>
          {/if}
        </li>
      {/each}
    </ol>
  {:else}
    <p class="my-3 text-sm text-muted-foreground">
      Add Monster cards to Hand or Summoning Area to compare ordinary summons and
      available fusion results.
    </p>
  {/if}
  <p class="mb-0 mt-3 text-xs leading-relaxed text-muted-foreground">
    The board is not modeled: a card in Hand cannot attack immediately just because
    its ATK is high. Range, summoning points, card movement, traps, equips, individual
    monster effects, attributes, opponent hidden cards, and Deck Leader abilities may
    change the outcome. A favorable stat difference is not a command to attack.
    <a class="text-link" href="/leaders/">Deck Leader reference →</a>
  </p>
</details>

<style>
  .context-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: .65rem; }
  .context-control { display: grid; align-content: start; gap: .35rem; min-width: 0; }
  .context-control:first-child { grid-row: span 2; }
  .field-label { color: var(--muted-foreground); font-size: .75rem; font-weight: 650; }
  .opponent-card { display: flex; gap: .5rem; align-items: center; }
  .opponent-card div:last-child { display: grid; font-size: .75rem; }
  .opponent-card span { color: var(--muted-foreground); }
  .note { background: var(--elevated); border-radius: var(--radius); padding: .65rem; font-size: .75rem; color: var(--muted-foreground); }
  .play-row { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; border: 1px solid var(--border); border-radius: var(--radius); padding: .65rem; min-width: 0; }
  @media (max-width: 800px) {
    .context-grid { grid-template-columns: minmax(0,1fr); }
    .context-control:first-child { grid-row: auto; }
  }
</style>
