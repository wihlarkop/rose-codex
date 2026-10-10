<script lang="ts">
  import { onMount } from 'svelte';
  import CardArtwork from './cards/CardArtwork.svelte';
  import DeckStrategyPlaybook from './DeckStrategyPlaybook.svelte';
  import type { BrowserCard } from '../lib/dotr/browser';
  import type { Card, FusionData } from '../lib/dotr/model';
  import { OPPONENTS, opponentById, type RosePath } from '../lib/dotr/opponents';
  import { generateSmartDeck, assessCardMatchup, type DeckStyle, type SmartDeck } from '../lib/dotr/smart-deck';
  import { smartDeckLink } from '../lib/dotr/smart-deck-link';
  import { buildStrategyPlaybook } from '../lib/dotr/deck-strategy';

  let { cards, images, fusions }: {
    cards: Card[]; images: BrowserCard[]; fusions: FusionData;
  } = $props();
  const byId = $derived(new Map(cards.map(card => [card.id, card])));
  const imageById = $derived(new Map(images.map(card => [card.id, card])));
  let rosePath = $state<RosePath | 'all'>('all');
  let opponentId = $state('weevil');
  let style = $state<DeckStyle>('balanced');
  let suggestion = $state<SmartDeck | null>(null);
  let error = $state('');
  const filteredOpponents = $derived(OPPONENTS.filter(entry =>
    rosePath === 'all' || entry.path === rosePath));
  const opponent = $derived(opponentById(opponentId));
  const threats = $derived(opponent
    ? opponent.notableCardIds.map(id => imageById.get(id)).filter((item): item is BrowserCard => !!item)
    : []);
  const rows = $derived(suggestion?.groups.map(row => ({
    ...row, card: imageById.get(row.cardId),
    metric: opponent && byId.get(row.cardId)?.kind === 'monster'
      ? assessCardMatchup(byId.get(row.cardId)!, opponent, byId, style) : null,
  })) ?? []);
  const monsterRows = $derived(rows.filter(row => row.card?.kind === 'monster'));
  const powerUps = $derived(rows.filter(row => row.card?.kind === 'magic'));
  const playbook = $derived(suggestion && opponent
    ? buildStrategyPlaybook(suggestion, opponent, cards, fusions) : null);

  function choosePath(event: Event) {
    rosePath = (event.currentTarget as HTMLSelectElement).value as RosePath | 'all';
    if (!filteredOpponents.some(item => item.id === opponentId)) {
      const first = OPPONENTS.find(item => rosePath === 'all' || item.path === rosePath);
      opponentId = first?.id ?? 'weevil';
    }
    suggestion = null;
  }
  function generate() {
    const profile = opponentById(opponentId);
    suggestion = null;
    error = '';
    if (!profile) {
      error = 'Choose a supported opponent first.';
      return;
    }
    const result = generateSmartDeck(cards, profile, style, fusions);
    if (!result) {
      error = 'Could not construct a 40-card deck below this opponent’s Deck Cost from known canonical card values.';
      return;
    }
    suggestion = result;
  }
  onMount(() => {
    const requested = new URLSearchParams(window.location.search).get('opponent');
    const match = requested ? opponentById(requested) : undefined;
    if (match) {
      opponentId = match.id;
      rosePath = match.path;
    }
  });
  const formatId = (n: number) => '#' + n.toString().padStart(3, '0');
</script>

<section aria-label="Opponent smart deck coach">
  <header class="page-header">
    <div>
      <h1 class="page-title">Smart Deck Coach</h1>
      <p class="page-description">
        Generate a deterministic, opponent-aware 40-card list from the canonical
        Duelists of the Roses cards. No model API or game-memory access needed.
      </p>
    </div>
    <a class="text-link text-sm" href="/opponents/">Opponent Encyclopedia →</a>
  </header>

  <div class="rounded-md border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-muted-foreground">
    <strong class="text-foreground">Research-grade recommendation, not a guaranteed winning deck.</strong>
    We assume every card is unlocked, but cannot verify the number of copies in
    your PCSX2 save or your separate Deck Leader's earned rank. Known stats,
    ordinary terrain, notable opponent monsters, fusion potential and compatible
    power-up cards are evaluated. Untranscribed effects, traps, rituals and
    special terrain interactions are not modeled.
  </div>

  <div class="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.65fr)]">
    <section class="rounded-lg border border-border bg-surface p-4" aria-label="Generate a deck">
      <h2 class="text-base font-semibold">Choose matchup</h2>
      <div class="mt-3 grid gap-3">
        <label class="grid gap-1 text-xs font-semibold text-muted-foreground" for="coach-path">
          Rose campaign
          <select id="coach-path" class="native-filter w-full" value={rosePath} onchange={choosePath}>
            <option value="all">Both paths</option>
            <option value="red">Red Rose · Joined Yugi</option>
            <option value="white">White Rose · Joined Seto</option>
          </select>
        </label>
        <label class="grid gap-1 text-xs font-semibold text-muted-foreground" for="coach-opponent">
          Opponent
          <select id="coach-opponent" class="native-filter w-full"
            bind:value={opponentId} onchange={() => { suggestion = null; error = ''; }}>
            {#each filteredOpponents as profile (profile.id)}
              <option value={profile.id}>{profile.name} · DC {profile.deckCost}</option>
            {/each}
          </select>
        </label>
        <label class="grid gap-1 text-xs font-semibold text-muted-foreground" for="coach-style">
          Build style
          <select id="coach-style" class="native-filter w-full" bind:value={style}
            onchange={() => { suggestion = null; error = ''; }}>
            <option value="balanced">Balanced · ATK + DEF</option>
            <option value="aggressive">Aggressive · Higher ATK</option>
            <option value="defensive">Defensive · Higher DEF</option>
          </select>
        </label>
        <button type="button" onclick={generate}
          class="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Generate 40-card deck
        </button>
      </div>
      {#if error}<p class="warning-note mt-3" role="alert">{error}</p>{/if}
      {#if opponent}
        <div class="mt-4 rounded-md border border-border bg-elevated p-3">
          <h3 class="text-sm font-semibold">{opponent.name}</h3>
          <p class="mt-1 text-xs text-muted-foreground">
            {opponent.path === 'red' ? 'Red Rose' : 'White Rose'} · {opponent.location}
          </p>
          <div class="mt-3 text-xs text-muted-foreground">
            Reported opponent Deck Cost <strong class="text-foreground">{opponent.deckCost}</strong>
            · You must remain below <strong class="text-foreground">{opponent.deckCost}</strong>.
          </div>
          <p class="mt-3 text-xs leading-relaxed">{opponent.strategy}</p>
          <p class="mt-2 text-xs text-muted-foreground">
            Reported terrain: {opponent.terrains.join(', ')}
          </p>
        </div>
        {#if threats.length}
          <h3 class="mt-4 text-sm font-semibold">Reported cards to watch</h3>
          <ul class="mt-2 grid gap-2">
            {#each threats as card (card.id)}
              <li class="flex items-center gap-2 rounded-md bg-elevated p-2">
                <div class="w-12 shrink-0 overflow-hidden rounded-sm">
                  <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
                </div>
                <div class="min-w-0 text-xs">
                  <strong class="block">{card.name}</strong>
                  <span class="text-muted-foreground">{formatId(card.id)}
                    · {card.kind === 'monster' ? 'ATK ' + (card.atk ?? '?') : card.kind}</span>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </section>

    <section class="min-w-0 rounded-lg border border-border bg-surface p-4"
      aria-label="Generated deck result">
      {#if suggestion && opponent}
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold">{opponent.name} · {style} build</h2>
            <p class="mt-1 text-xs text-muted-foreground">
              Reproducible rule-based suggestion · Generated for reported campaign matchup
            </p>
          </div>
          <a class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            href={smartDeckLink(suggestion)}>
            Review in Deck Builder →
          </a>
        </div>
        <dl class="mt-4 grid grid-cols-3 gap-3 rounded-md bg-elevated p-3 text-sm">
          <div>
            <dt class="text-xs text-muted-foreground">Main cards</dt>
            <dd class="font-semibold">{suggestion.cardIds.length} / 40</dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Deck Cost</dt>
            <dd class="font-semibold">{suggestion.deckCost} / {suggestion.costLimit}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Power-ups</dt>
            <dd class="font-semibold">{suggestion.equipCount}</dd>
          </div>
        </dl>
        <div class="mt-3 rounded-md border border-border bg-elevated p-3 text-xs leading-relaxed">
          <strong>Deck Leader is separate.</strong>
          Select a legal Monster leader in PCSX2 and verify at least 2LT rank
          yourself. The generator does not claim to know your earned rank;
          your leader is not included in these 40 cards or their Deck Cost.
        </div>
        <div class="mt-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="text-sm font-semibold">Monster picks</h3>
          <span class="text-xs text-muted-foreground">{monsterRows.reduce((n, row) => n + row.copies, 0)} copies</span>
        </div>
        <ul class="mt-2 grid gap-2 md:grid-cols-2">
          {#each monsterRows as row (row.cardId)}
            {#if row.card}
              <li class="flex min-w-0 gap-2 rounded-md border border-border bg-elevated p-2">
                <div class="w-14 shrink-0 overflow-hidden rounded-sm">
                  <CardArtwork image={row.card.image} name={row.card.name} cardId={row.cardId} decorative />
                </div>
                <div class="min-w-0">
                  <strong class="block text-sm">{row.card.name} ×{row.copies}</strong>
                  <p class="text-xs text-muted-foreground">{formatId(row.cardId)} · DC {row.card.deckCost}
                    · ATK {row.card.atk ?? '?'} / DEF {row.card.def ?? '?'}</p>
                  <p class="mt-1 text-xs leading-relaxed text-muted-foreground">{row.reason}</p>
                </div>
              </li>
            {/if}
          {/each}
        </ul>
        {#if powerUps.length}
          <h3 class="mt-4 text-sm font-semibold">Compatible power-ups</h3>
          <ul class="mt-2 grid gap-2 md:grid-cols-2">
            {#each powerUps as row (row.cardId)}
              {#if row.card}
                <li class="flex gap-2 rounded-md border border-border bg-elevated p-2">
                  <div class="w-14 shrink-0 overflow-hidden rounded-sm">
                    <CardArtwork image={row.card.image} name={row.card.name} cardId={row.cardId} decorative />
                  </div>
                  <div class="min-w-0">
                    <strong class="block text-sm">{row.card.name} ×{row.copies}</strong>
                    <p class="text-xs text-muted-foreground">{formatId(row.cardId)} · DC {row.card.deckCost}</p>
                    <p class="mt-1 text-xs text-muted-foreground">{row.reason}</p>
                  </div>
                </li>
              {/if}
            {/each}
          </ul>
        {/if}
        {#if playbook}
          <DeckStrategyPlaybook {playbook} {images} />
        {/if}
        <div class="mt-4 rounded-md border border-border p-3">
          <h3 class="text-xs font-semibold">How to interpret this build</h3>
          <ul class="mt-2 grid list-disc gap-1 pl-4 text-xs leading-relaxed text-muted-foreground">
            {#each suggestion.notes as note (note)}<li>{note}</li>{/each}
          </ul>
          <p class="mt-2 text-xs text-muted-foreground">
            The one-click link only proposes a new deck. Existing decks are untouched
            unless you explicitly choose Add in Deck Builder.
          </p>
        </div>
      {:else}
        <div class="grid min-h-60 place-content-center rounded-md border border-dashed border-border p-6 text-center">
          <h2 class="text-base font-semibold">Your custom matchup deck will appear here</h2>
          <p class="mt-2 max-w-sm text-sm text-muted-foreground">
            Choose an opponent and playstyle, then generate a 40-card list.
            You can review it before adding it to your saved Deck Builder workspace.
          </p>
        </div>
      {/if}
    </section>
  </div>
</section>
