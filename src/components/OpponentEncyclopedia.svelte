<script lang="ts">
  import { onMount } from 'svelte';
  import CardArtwork from './cards/CardArtwork.svelte';
  import type { BrowserCard } from '../lib/dotr/browser';
  import {
    findOpponents,
    opponentById,
    OPPONENTS,
    OPPONENT_GUIDE,
    type RosePath,
  } from '../lib/dotr/opponents';

  let { cards }: { cards: BrowserCard[] } = $props();
  const byId = $derived(new Map(cards.map((card) => [card.id, card])));
  let query = $state('');
  let path = $state<RosePath | 'all'>('all');
  let selectedId = $state('weevil');

  const matches = $derived(findOpponents(query, path));
  const selected = $derived(
    matches.find((item) => item.id === selectedId) ?? matches[0],
  );
  const selectedLeader = $derived(
    selected ? byId.get(selected.leaderCardId) : undefined,
  );

  function selectOpponent(id: string) {
    if (!OPPONENTS.some((item) => item.id === id)) return;
    selectedId = id;
    history.replaceState(null, '', '/opponents/?opponent=' + encodeURIComponent(id));
  }

  onMount(() => {
    const requested = new URLSearchParams(window.location.search).get('opponent');
    const profile = requested ? opponentById(requested) : undefined;
    if (profile) selectedId = profile.id;
  });
</script>

<section aria-label="Opponent Encyclopedia">
  <header class="page-header">
    <div>
      <h1 class="page-title">Opponent Encyclopedia</h1>
      <p class="page-description">
        Explore story-mode opponents by the Rose path you joined. View reported Deck Leaders,
        battlefield terrain and selected cards to prepare for your next duel.
      </p>
    </div>
    <a href="/fusion/" class="text-link text-sm">Fusion Workspace →</a>
  </header>

  <div class="mb-4 rounded-md border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-muted-foreground">
    <strong class="text-foreground">Research reference, not extracted game data.</strong>
    These 20 encounters (including two final-boss variants) come from a community
    walkthrough. Card highlights are <strong>selected reported deck cards</strong>, not a complete
    deck list or verified rewards. Exact drops, Deck Leader abilities, card effects and
    difficulty scores are not established here.
  </div>

  <div class="grid items-start gap-4 lg:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.7fr)]">
    <aside class="min-w-0 rounded-lg border border-border bg-surface p-3" aria-label="Find an opponent">
      <div class="grid gap-2 sm:grid-cols-[1fr_auto] lg:grid-cols-1 xl:grid-cols-[1fr_auto]">
        <label class="min-w-0">
          <span class="mb-1 block text-xs font-semibold text-muted-foreground">Search opponents</span>
          <input
            class="native-filter w-full"
            type="search"
            placeholder="Name or battle location…"
            autocomplete="off"
            bind:value={query}
          />
        </label>
        <label class="min-w-0">
          <span class="mb-1 block text-xs font-semibold text-muted-foreground">Rose path you joined</span>
          <select class="native-filter w-full" bind:value={path}>
            <option value="all">Both paths</option>
            <option value="red">Red Rose · with Yugi</option>
            <option value="white">White Rose · with Seto</option>
          </select>
        </label>
      </div>
      <p class="my-3 text-xs text-muted-foreground" role="status">
        {matches.length} {matches.length === 1 ? 'encounter' : 'encounters'}
        {path === 'all' ? ' · Both campaigns' : path === 'red' ? ' · Red Rose campaign' : ' · White Rose campaign'}
      </p>
      {#if matches.length}
        <ul class="grid max-h-[480px] gap-1.5 overflow-y-auto pr-1 lg:max-h-[690px]" aria-label="Matching opponents">
          {#each matches as profile (profile.id)}
            {@const leader = byId.get(profile.leaderCardId)}
            <li>
              <button
                type="button"
                aria-pressed={selected?.id === profile.id}
                aria-label={'View ' + profile.name + (profile.finalBoss ? ' (' + profile.path + ' path)' : '')}
                onclick={() => selectOpponent(profile.id)}
                class="flex w-full items-center gap-3 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:bg-hover aria-pressed:border-border aria-pressed:bg-selected"
              >
                {#if leader}
                  <span class="w-14 shrink-0 overflow-hidden rounded-sm bg-elevated">
                    <CardArtwork image={leader.image} name={leader.name} cardId={leader.id} decorative />
                  </span>
                {/if}
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-semibold">{profile.name}</span>
                  <span class="block text-xs text-muted-foreground">
                    {profile.location} · DC {profile.deckCost.toLocaleString('en-US')}
                  </span>
                  <span class="block text-[11px] text-muted-foreground">
                    {profile.path === 'red' ? 'Red Rose path' : 'White Rose path'}
                    {profile.finalBoss ? ' · Final encounter' : ''}
                  </span>
                </span>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No matching opponent. Try a different name, location, or Rose path.
        </p>
      {/if}
    </aside>

    {#if selected}
      <div class="grid min-w-0 gap-4" aria-label="Selected opponent profile">
        <section class="rounded-lg border border-border bg-surface p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-primary">
              {selected.path === 'red' ? 'Joined Yugi · Fight the Yorkists' : 'Joined Seto · Fight the Lancastrians'}
            </span>
            {#if selected.finalBoss}
              <span class="text-xs text-muted-foreground">Final boss variant</span>
            {/if}
          </div>
          <div class="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
            {#if selectedLeader}
              <div class="overflow-hidden rounded-md bg-elevated">
                <CardArtwork
                  image={selectedLeader.image}
                  name={selectedLeader.name}
                  cardId={selectedLeader.id}
                />
                <div class="px-3 py-2 text-xs text-muted-foreground">
                  Reported Deck Leader card artwork · #{String(selectedLeader.id).padStart(3, '0')}
                </div>
              </div>
            {/if}
            <div class="min-w-0">
              <h2 class="text-xl font-semibold tracking-tight">{selected.name}</h2>
              <p class="mt-1 text-xs text-muted-foreground">
                {selected.finalBoss ? 'Story finale' : 'Story encounter'} · {selected.location}
              </p>
              <dl class="mt-4 grid gap-3 text-sm">
                <div>
                  <dt class="text-xs text-muted-foreground">Reported Deck Leader</dt>
                  <dd class="font-semibold">{selectedLeader?.name ?? 'Unknown card'}</dd>
                  {#if selectedLeader?.kind === 'monster'}
                    <dd class="text-xs text-muted-foreground">
                      ATK {selectedLeader.atk ?? 'unknown'} · DEF {selectedLeader.def ?? 'unknown'}
                      · {selectedLeader.monsterType}
                    </dd>
                  {/if}
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">Reported Deck Cost</dt>
                  <dd class="font-semibold tabular-nums">{selected.deckCost.toLocaleString('en-US')}</dd>
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">Reported board terrains</dt>
                  <dd class="mt-1 flex flex-wrap gap-1.5">
                    {#each selected.terrains as terrain (terrain)}
                      <span class="rounded-sm bg-elevated px-2 py-1 text-xs">{terrain}</span>
                    {/each}
                  </dd>
                </div>
              </dl>
              <a class="mt-4 inline-block text-xs text-link"
                href={'/leaders/?card=' + selected.leaderCardId}>
                View Deck Leader card reference →
              </a>
            </div>
          </div>
        </section>

        <section class="rounded-lg border border-border bg-surface p-4" aria-label="Selected notable cards">
          <div class="mb-3">
            <h2 class="text-base font-semibold">Cards to watch</h2>
            <p class="mt-1 text-xs text-muted-foreground">
              A few cards listed in the walkthrough's opponent deck, matched by canonical DotR ID.
              These are not necessarily every threat or reward.
            </p>
          </div>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {#each selected.notableCardIds as id (id)}
              {@const card = byId.get(id)}
              {#if card}
                <div class="min-w-0 overflow-hidden rounded-md border border-border bg-elevated">
                  <CardArtwork image={card.image} name={card.name} cardId={card.id} />
                  <div class="p-2">
                    <p class="text-sm font-semibold leading-tight">{card.name}</p>
                    <p class="mt-1 text-xs text-muted-foreground">
                      #{String(card.id).padStart(3, '0')} ·
                      {card.kind === 'monster' ? 'ATK ' + (card.atk ?? '?') + ' / DEF ' + (card.def ?? '?') : card.kind}
                    </p>
                  </div>
                </div>
              {:else}
                <p class="warning-note text-sm">Canonical card #{id} unavailable.</p>
              {/if}
            {/each}
          </div>
        </section>

        <section class="rounded-lg border border-border bg-surface p-4" aria-label="Strategy notes">
          <h2 class="text-base font-semibold">Preparation notes</h2>
          <p class="mt-2 text-sm leading-relaxed">{selected.strategy}</p>
          <p class="mt-3 text-xs leading-relaxed text-muted-foreground">
            These are cautious suggestions based on the reported opponent deck and board.
            Actual moves, hand draws, hidden cards and individual effects are not simulated.
            Use Duel Strategy in <a href="/fusion/" class="text-link">Fusion</a> for conditional stat comparisons.
          </p>
        </section>

        <section class="rounded-lg border border-border bg-surface p-4" aria-label="Evidence and rewards">
          <h2 class="text-sm font-semibold">Evidence and card rewards</h2>
          <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
            Single community walkthrough; not verified against a game binary or PCSX2 save.
            Reported deck cards are <strong>not</strong> a card-drop table. Specific slot rewards
            and probabilities are unknown here.
          </p>
          <div class="mt-3 flex flex-wrap gap-3 text-xs">
            <a class="text-link" href={OPPONENT_GUIDE.url} target="_blank" rel="noreferrer">
              Walkthrough source ↗
            </a>
            <a class="text-link" href={'/opponents/?opponent=' + encodeURIComponent(selected.id)}>
              Link to this encounter →
            </a>
          </div>
        </section>
      </div>
    {:else}
      <div class="rounded-lg border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">
        Choose an opponent from the list to view reported cards and preparation notes.
      </div>
    {/if}
  </div>
</section>
