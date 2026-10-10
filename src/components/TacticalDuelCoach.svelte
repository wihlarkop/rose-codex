<script lang="ts">
  import { onMount } from 'svelte';
  import CardArtwork from './cards/CardArtwork.svelte';
  import BattleDecisionPanel from './BattleDecisionPanel.svelte';
  import ScreenshotAssistant from './ScreenshotAssistant.svelte';
  import CardPicker from './cards/CardPicker.svelte';
  import type { BrowserCard } from '../lib/dotr/browser';
  import { DUEL_TERRAINS, type DuelTerrain, type OpponentPosition } from '../lib/dotr/duel-advisor';
  import { parseHandLink } from '../lib/dotr/deck-simulation';
  import { createFusionDiscovery, type FusionOccurrence, type FusionZone } from '../lib/dotr/fusion-discovery';
  import type { Card, FusionData } from '../lib/dotr/model';
  import { OPPONENTS, opponentById } from '../lib/dotr/opponents';
  import { evaluateTacticalDuel } from '../lib/dotr/tactical-duel';

  let { cards, canonicalCards, fusions }: {
    cards: BrowserCard[]; canonicalCards: Card[]; fusions: FusionData;
  } = $props();
  const byId = $derived(new Map(cards.map(card => [card.id, card])));
  const monsters = $derived(cards.filter(card => card.kind === 'monster'));
  const discover = $derived(createFusionDiscovery(canonicalCards, fusions));
  let occurrences = $state<FusionOccurrence[]>([]);
  let knownEnemyId = $state<number | null>(null);
  let position = $state<OpponentPosition>('unknown');
  let terrain = $state<DuelTerrain>('Normal');
  let profileId = $state('');
  let notice = $state('');
  const hand = $derived(occurrences.filter(item => item.zone === 'hand'));
  const field = $derived(occurrences.filter(item => item.zone === 'summoning'));
  const profile = $derived(opponentById(profileId));
  const discovery = $derived(discover(occurrences));
  const report = $derived(evaluateTacticalDuel(occurrences, discovery, byId, {
    opponentCardId: knownEnemyId, opponentPosition: position, terrain,
  }));
  const enemy = $derived(knownEnemyId === null ? null : byId.get(knownEnemyId));
  const specialTerrain = $derived(['Crush', 'Labyrinth', 'Toon'].includes(terrain));

  function add(id: number, zone: FusionZone) {
    if (zone === 'hand' && hand.length >= 5) {
      notice = 'Hand planning is limited to five cards; remove one to add another.';
      return;
    }
    if (zone === 'summoning' && field.length >= 8) {
      notice = 'This manual planning UI accepts up to eight field cards. It does not model the full board.';
      return;
    }
    if (!byId.has(id)) return;
    occurrences = [...occurrences, { instanceId: crypto.randomUUID(), cardId: id, zone }];
    notice = '';
  }
  function remove(instanceId: string) {
    occurrences = occurrences.filter(item => item.instanceId !== instanceId);
    notice = '';
  }
  function clearState() {
    occurrences = [];
    knownEnemyId = null;
    position = 'unknown';
    terrain = 'Normal';
    profileId = '';
    notice = 'Manual duel state cleared. No saved deck or PCSX2 file was changed.';
  }
  function selectEnemy(cardId: number) {
    knownEnemyId = cardId;
    position = 'attack';
  }
  onMount(() => {
    const query = new URLSearchParams(window.location.search);
    const linkedHand = parseHandLink(query.toString(), new Set(cards.map(card => card.id)));
    if (linkedHand?.length) {
      occurrences = linkedHand.map(cardId => ({
        instanceId: crypto.randomUUID(), cardId, zone: 'hand' as const,
      }));
      notice = 'Hand copied from a local planning link. Nothing was imported into saved decks.';
    } else if (linkedHand?.length === 0) {
      notice = 'Invalid hand link ignored. Choose your cards manually.';
    }
    const incoming = query.get('opponent');
    if (incoming && opponentById(incoming)) profileId = incoming;
  });
</script>

<section aria-label="Manual tactical duel coach">
  <header class="page-header">
    <div>
      <h1 class="page-title">Tactical Duel Coach</h1>
      <p class="page-description">
        Describe the cards you can see in PCSX2, then compare conditional
        field options, fusion possibilities, and Hand preparation using known DotR data.
      </p>
    </div>
    <a href="/coach/" class="text-link text-sm">Smart Deck Coach →</a>
  </header>

  <div class="rounded-md border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-muted-foreground">
    <strong class="text-foreground">Manual, read-only tactical planner.</strong>
    This is not an automatic screen reader or a complete DotR battle simulator.
    Battle State inputs can rule out certain SP/card-play options, but the coach
    cannot confirm reachability, hidden traps, effects or Deck Leader abilities. A positive ATK
    comparison is never proof of a legal attack or victory.
  </div>

  <ScreenshotAssistant {cards} onconfirm={(id, destination) => {
    if (destination === 'enemy') {
      if (byId.get(id)?.kind === 'monster') selectEnemy(id);
    } else add(id, destination === 'hand' ? 'hand' : 'summoning');
  }} />

  <div class="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.4fr)]">
    <div class="grid min-w-0 gap-4">
      <section class="rounded-lg border border-border bg-surface p-4" aria-label="Manual player cards">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-base font-semibold">Your cards</h2>
          <button type="button" onclick={clearState}
            class="rounded-md border border-border px-2 py-1 text-xs hover:bg-hover">
            Clear all
          </button>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          You can add identical cards as separate occurrences. Hand is limited
          to five entries; Field is limited to eight entries in this planner.
        </p>
        <div class="mt-3 grid gap-4">
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-sm font-semibold">Hand · {hand.length}/5</h3>
              <CardPicker {cards} label="Add card to Hand" onselect={(id) => add(id, 'hand')} />
            </div>
            {#if hand.length}
              <ul class="mt-2 grid gap-2">
                {#each hand as item, index (item.instanceId)}
                  {@const card = byId.get(item.cardId)!}
                  <li class="flex min-w-0 items-center gap-2 rounded-md bg-elevated p-2">
                    <div class="w-10 shrink-0 overflow-hidden rounded-sm">
                      <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
                    </div>
                    <div class="min-w-0 flex-1 text-xs">
                      <strong class="block">{card.name}</strong>
                      <span class="text-muted-foreground">Hand {index + 1} · #{String(card.id).padStart(3, '0')}</span>
                    </div>
                    <button type="button" onclick={() => remove(item.instanceId)}
                      class="rounded-md border border-border px-2 py-1 text-xs hover:bg-hover"
                      aria-label={'Remove ' + card.name + ' from Hand'}>Remove</button>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="mt-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                Add cards currently visible in your PCSX2 Hand.
              </p>
            {/if}
          </div>
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-sm font-semibold">Your field · {field.length}/8 planning entries</h3>
              <CardPicker {cards} label="Add card on Field" onselect={(id) => add(id, 'summoning')} />
            </div>
            {#if field.length}
              <ul class="mt-2 grid gap-2">
                {#each field as item, index (item.instanceId)}
                  {@const card = byId.get(item.cardId)!}
                  <li class="flex min-w-0 items-center gap-2 rounded-md bg-elevated p-2">
                    <div class="w-10 shrink-0 overflow-hidden rounded-sm">
                      <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
                    </div>
                    <div class="min-w-0 flex-1 text-xs">
                      <strong class="block">{card.name}</strong>
                      <span class="text-muted-foreground">Field {index + 1} · #{String(card.id).padStart(3, '0')}</span>
                    </div>
                    <button type="button" onclick={() => remove(item.instanceId)}
                      class="rounded-md border border-border px-2 py-1 text-xs hover:bg-hover"
                      aria-label={'Remove ' + card.name + ' from Field'}>Remove</button>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="mt-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                Add your visible field cards; their positions are not modeled.
              </p>
            {/if}
          </div>
        </div>
        {#if notice}<p class="mt-3 text-xs text-muted-foreground" role="status">{notice}</p>{/if}
      </section>

      <section class="rounded-lg border border-border bg-surface p-4" aria-label="Manual enemy and terrain">
        <h2 class="text-base font-semibold">Visible opponent and battle context</h2>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-xs font-semibold text-muted-foreground">
            Campaign opponent (optional context)
            <select class="native-filter w-full" bind:value={profileId}>
              <option value="">Not specified</option>
              {#each OPPONENTS as option (option.id)}
                <option value={option.id}>{option.name} · {option.path} path</option>
              {/each}
            </select>
          </label>
          <label class="grid gap-1 text-xs font-semibold text-muted-foreground">
            Terrain at hypothetical contact square
            <select class="native-filter w-full" bind:value={terrain}>
              {#each DUEL_TERRAINS as option (option)}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>
          <div class="min-w-0">
            <span class="mb-1 block text-xs font-semibold text-muted-foreground">Enemy's face-up monster</span>
            <div class="flex flex-wrap items-center gap-2">
              <CardPicker cards={monsters} label="Select visible enemy monster"
                selectedCardId={knownEnemyId} onselect={selectEnemy} />
              {#if knownEnemyId !== null}
                <button type="button" onclick={() => { knownEnemyId = null; position = 'unknown'; }}
                  class="rounded-md border border-border px-2 py-1 text-xs hover:bg-hover">Clear</button>
              {/if}
            </div>
            {#if enemy}
              <p class="mt-1 text-xs text-muted-foreground">{enemy.name} · ATK {enemy.atk ?? '?'} / DEF {enemy.def ?? '?'}</p>
            {/if}
          </div>
          <label class="grid gap-1 text-xs font-semibold text-muted-foreground">
            Enemy position as observed
            <select class="native-filter w-full" bind:value={position}>
              <option value="unknown">Hidden / not confirmed</option>
              <option value="attack">Face-up Attack</option>
              <option value="defense">Face-up Defense</option>
            </select>
          </label>
        </div>
        {#if profile}
          <p class="mt-3 text-xs leading-relaxed text-muted-foreground">
            Reported encounter: {profile.strategy}
            The enemy card must still be entered separately; it is not
            inferred from the opponent's partial deck highlights.
          </p>
        {/if}
        {#if specialTerrain}
          <p class="warning-note mt-3" role="status">
            {terrain} has special mechanics. No normal +500/−500 attack comparison
            is inferred for this square.
          </p>
        {/if}
      </section>
    </div>

    <section class="min-w-0 rounded-lg border border-border bg-surface p-4"
      aria-label="Conditional tactical recommendations">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-base font-semibold">Possible next considerations</h2>
        <span class="text-xs text-muted-foreground">
          {report.options.length} ranked · Read-only
        </span>
      </div>
      <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
        Field comparisons come first, followed by potential fusions and
        Hand preparation. This is an evidence ranking, not an automatic
        move executor. The actual board determines what is playable.
      </p>
      {#if !report.discoveryComplete}
        <p class="warning-note mt-3" role="status">
          Fusion search reached a known limit. Other legal combinations may exist.
        </p>
      {/if}
      {#if !report.contextKnown}
        <p class="mt-3 rounded-md bg-elevated p-3 text-xs text-muted-foreground">
          An enemy face-up Monster and ordinary contact-square terrain are
          required for a meaningful ATK comparison. Uncertain outcomes remain unknown.
        </p>
      {/if}
      {#if report.options.length}
        <ol class="mt-3 grid gap-2">
          {#each report.options as option, index (option.kind + '-' + option.sourceLabel + '-' + option.cardId + '-' + index)}
            {@const card = byId.get(option.cardId)!}
            <li class="rounded-md border border-border bg-elevated p-3">
              <div class="flex min-w-0 gap-3">
                <div class="w-14 shrink-0 overflow-hidden rounded-sm">
                  <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-baseline gap-2">
                    <span class="text-xs font-semibold text-primary">#{index + 1}</span>
                    <strong class="text-sm">{card.name}</strong>
                  </div>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {option.kind === 'field-comparison'
                      ? 'Field combat comparison'
                      : option.kind === 'fusion-possibility'
                        ? 'Possible ordinary fusion'
                        : 'Hand preparation'}
                    · {option.sourceLabel}
                  </p>
                  {#if option.materialIds.length}
                    <p class="mt-1 text-xs text-muted-foreground">
                      Materials: {option.materialIds.map(id => byId.get(id)?.name ?? '#' + id).join(' + ')}
                    </p>
                  {/if}
                  <p class="mt-2 text-xs">
                    {option.attack === null ? 'Adjusted ATK unknown' : 'Adjusted ATK ' + option.attack}
                    {#if option.enemyStat !== null}
                      · Enemy {position === 'defense' ? 'DEF' : 'ATK'} {option.enemyStat}
                    {/if}
                    {#if option.statDifference !== null}
                      · Difference {option.statDifference > 0 ? '+' : ''}{option.statDifference}
                    {/if}
                  </p>
                  <p class="mt-1 text-xs leading-relaxed text-muted-foreground">{option.note}</p>
                </div>
              </div>
            </li>
          {/each}
        </ol>
      {:else}
        <div class="mt-4 rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
          Add at least one Monster to your Hand or Field to see stat-driven options.
          Magic and Trap effects are not evaluated in this version.
        </div>
      {/if}
      <details class="mt-4 rounded-md border border-border p-3">
        <summary class="cursor-pointer text-xs font-semibold text-primary">
          What this coach cannot determine
        </summary>
        <ul class="mt-2 grid list-disc gap-1 pl-4 text-xs leading-relaxed text-muted-foreground">
          {#each report.notes as note (note)}
            <li>{note}</li>
          {/each}
        </ul>
      </details>
      <p class="mt-4 text-xs leading-relaxed text-muted-foreground">
        For full recipes and more complex multi-card fusion chains, use the
        <a class="text-link" href="/fusion/">Fusion Workspace →</a>.
        Nothing on this page writes your saved decks, Collection, or PCSX2 files.
      </p>
    </section>
  </div>
  <BattleDecisionPanel {cards} {hand} {field} {report} />
</section>
