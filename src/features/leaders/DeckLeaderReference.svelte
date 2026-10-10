<script lang="ts">
  import { onMount } from 'svelte';
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import { filterCards, type BrowserCard } from '../../lib/dotr/browser';
  import {
    DECK_LEADER_RANKS,
    DECK_LEADER_SOURCES,
    leaderTypeReport,
    reportedAbilitiesAtRank,
    type DeckLeaderRank,
  } from '../../lib/dotr/deck-leader';
  import starterData from '../../../data/canonical/starters.json';

  let { cards }: { cards: BrowserCard[] } = $props();
  const monsterCards = $derived(cards.filter((card) => card.kind === 'monster'));
  const byId = $derived(new Map(monsterCards.map((card) => [card.id, card])));
  const starterIds = new Set(starterData.decks.map((deck) => deck.leaderCardId));
  const starterChoices = $derived(
    [...starterIds]
      .map((id) => byId.get(id))
      .filter((card): card is BrowserCard => card !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  let selectedId = $state(34);
  let query = $state('');
  let exampleRank = $state('');
  const selected = $derived(byId.get(selectedId));
  const report = $derived(leaderTypeReport(selected?.monsterType ?? null));
  const hypotheticalAbilities = $derived(
    reportedAbilitiesAtRank(
      selected?.monsterType ?? null,
      exampleRank ? (exampleRank as DeckLeaderRank) : null,
    ),
  );
  const results = $derived(
    query.trim()
      ? filterCards(monsterCards, {
          query,
          kind: '',
          monsterType: '',
          attribute: '',
        })
      : [],
  );

  function choose(id: number) {
    selectedId = id;
    query = '';
    exampleRank = '';
  }

  onMount(() => {
    const queryId = new URLSearchParams(window.location.search).get('card');
    if (queryId && /^[0-9]{1,3}$/.test(queryId)) {
      const id = Number(queryId);
      if (byId.has(id)) choose(id);
    }
  });
</script>

<section aria-label="Deck Leader Reference">
  <header class="page-header">
    <div>
      <h1 class="page-title">Deck Leader Reference</h1>
      <p class="page-description">
        Look up a monster, learn Deck Leader ranks, and review reported type abilities. This guide
        does not read rank or unlocked abilities from your PCSX2 save.
      </p>
    </div>
    <a href="/decks/" class="text-link text-sm">Back to Deck Builder →</a>
  </header>

  <div class="reference-layout">
    <aside class="reference-sidebar surface" aria-label="Find a potential Deck Leader">
      <label for="leader-search" class="field-label">Find a monster</label>
      <input
        id="leader-search"
        class="native-filter w-full"
        type="search"
        placeholder="Name or ID, e.g. Behemoth"
        autocomplete="off"
        bind:value={query}
      />
      <p class="small-copy">
        Every canonical Monster card can be looked up. Being listed here does
        <strong>not</strong> mean it is promoted or eligible in your save.
      </p>
      {#if query.trim()}
        <p class="small-copy" role="status">
          {results.length} matching {results.length === 1 ? 'monster' : 'monsters'}
          {#if results.length > 12}
            · Showing first 12{/if}
        </p>
        <ul class="card-options" aria-label="Matching monster cards">
          {#each results.slice(0, 12) as card (card.id)}
            <li>
              <button
                class="card-option"
                type="button"
                aria-label={'View Deck Leader reference for ' + card.name}
                onclick={() => choose(card.id)}
              >
                <span class="option-art"
                  ><CardArtwork
                    image={card.image}
                    name={card.name}
                    cardId={card.id}
                    decorative
                  /></span
                >
                <span class="option-description">
                  <strong>{card.name}</strong>
                  <small>#{String(card.id).padStart(3, '0')} · {card.monsterType}</small>
                </span>
              </button>
            </li>
          {/each}
        </ul>
        {#if !results.length}<p class="small-copy">
            No matching monster. Try another name or ID.
          </p>{/if}
      {/if}
      <div class="starter-selector">
        <label for="starter-leader" class="field-label">Original starter Deck Leaders</label>
        <select
          id="starter-leader"
          class="native-filter w-full"
          value={starterIds.has(selectedId) ? String(selectedId) : ''}
          onchange={(event) => {
            const id = Number(event.currentTarget.value);
            if (starterIds.has(id)) choose(id);
          }}
        >
          <option value="">Choose from 17 recorded starters…</option>
          {#each starterChoices as card (card.id)}
            <option value={String(card.id)}
              >{card.name} · #{String(card.id).padStart(3, '0')}</option
            >
          {/each}
        </select>
        <p class="small-copy">
          These 17 are recorded starting choices, not the only possible Deck Leaders.
        </p>
        <a href="/decks/" class="text-link text-xs">Try player-name starter choices →</a>
      </div>
    </aside>

    <div class="reference-content">
      {#if selected}
        <section class="surface selected-card" aria-label="Selected monster reference">
          <div class="selected-artwork">
            <CardArtwork image={selected.image} name={selected.name} cardId={selected.id} />
          </div>
          <div class="selected-description">
            <span class="eyebrow">Deck Leader candidate · Reference only</span>
            <h2>
              {selected.name}
              <span class="card-number">#{String(selected.id).padStart(3, '0')}</span>
            </h2>
            <p class="small-copy">
              {selected.monsterType} · Level {selected.level ?? 'unknown'}
              · ATK {selected.atk ?? 'unknown'} · DEF {selected.def ?? 'unknown'}
            </p>
            {#if starterIds.has(selected.id)}
              <p class="starter-label">Recorded initial Deck Leader choice</p>
            {/if}
            <p class="small-copy">
              Its current rank, promotion progress, and unlocked abilities are <strong
                >unknown</strong
              >. Card ATK/DEF shown here are ordinary card stats—not the Deck Leader's combat stats.
              A Deck Leader acts as your movable base on the board.
            </p>
            <a
              class="text-link text-xs"
              href={'/cards/?q=' + String(selected.id).padStart(3, '0')}
            >
              View this monster in Card Library →
            </a>
          </div>
        </section>

        <section class="surface info-section" aria-label="Reported Deck Leader type abilities">
          <h2>Reported abilities · {selected.monsterType}</h2>
          <p class="small-copy">
            Community-observed unlocks for a monster <em>type</em>, not verified properties of this
            individual card. Card level and other exceptions may change eligibility. The community
            source is incomplete; an absent ability is not proof it cannot be learned.
          </p>
          {#if report && report.reports.length}
            <div class="ability-list">
              {#each report.reports as entry (entry.name)}
                <div class="ability-row">
                  <div>
                    <strong>{entry.name}</strong>
                    {#if entry.detail}<p class="small-copy">{entry.detail}</p>{/if}
                  </div>
                  <span class="rank-code">Reported at {entry.rank}</span>
                </div>
              {/each}
            </div>
            {#if report.caveat}<p class="caveat">{report.caveat}</p>{/if}
            <div class="example-box">
              <label for="example-rank" class="field-label">Explore a hypothetical rank</label>
              <select id="example-rank" class="native-filter" bind:value={exampleRank}>
                <option value="">Rank unknown — do not infer unlocks</option>
                {#each DECK_LEADER_RANKS as rank}
                  <option value={rank.code}>{rank.code} · {rank.name}</option>
                {/each}
              </select>
              {#if exampleRank}
                <p class="small-copy">
                  At {exampleRank}, this FAQ reports
                  <strong>{hypotheticalAbilities.length}</strong>
                  possible type-family {hypotheticalAbilities.length === 1 ? 'unlock' : 'unlocks'}
                  at or below the chosen rank. This is <strong>not</strong> a claim about your save or
                  a fully verified unlock schedule.
                </p>
              {:else}
                <p class="small-copy">
                  Select a rank to review when reported type abilities may appear; no rank is
                  assigned to your actual card.
                </p>
              {/if}
            </div>
          {:else}
            <p class="caveat">
              Exact rank milestones for {selected.monsterType} have not been transcribed into this reference.
              This does not mean the type has no abilities.
            </p>
          {/if}
          <a
            class="text-link text-xs"
            href={DECK_LEADER_SOURCES.faq.url}
            target="_blank"
            rel="noreferrer"
          >
            Open the community Deck Leader FAQ ↗
          </a>
        </section>
      {/if}

      <section class="surface info-section" aria-label="How Deck Leaders work">
        <h2>How Deck Leaders work</h2>
        <ul class="rules-list">
          <li>
            <strong>Moving base:</strong> The Deck Leader represents your Life Points, can normally move
            one square per turn, and can play a card in its adjacent Summoning Areas. Damage from a direct
            attack against it affects your Life Points.
          </li>
          <li>
            <strong>Forty-card deck:</strong> The Leader is designated separately from the 40 regular
            deck cards. It is not an extra copy inside your normal Hand.
          </li>
          <li>
            <strong>Promotion:</strong> The starter Leader is already ranked. Other monster cards need
            in-game promotion before they can be selected as Leaders. Experience is hidden; Rose Codex
            cannot read it.
          </li>
          <li>
            <strong>Ability unlocks:</strong> Some capabilities vary by rank, type, level, and particular
            card. This page is a research guide, not a legality checker.
          </li>
          <li>
            <strong>Safety:</strong> The reference does not change Deck Builder, your Collection, or the
            PCSX2 memory card.
          </li>
        </ul>
      </section>

      <section class="surface info-section" aria-label="Rank progression">
        <h2>Rank progression</h2>
        <p class="small-copy">
          Twelve promoted ranks, lowest to highest. These are rank labels, not visible XP thresholds
          or a prediction of how many duels a monster needs to rank up.
        </p>
        <ol class="rank-grid">
          {#each DECK_LEADER_RANKS as rank, i (rank.code)}
            <li>
              <span class="rank-number">{i + 1}</span>
              <strong>{rank.code}</strong>
              <span>{rank.name}</span>
            </li>
          {/each}
        </ol>
      </section>

      <section class="surface info-section" aria-label="Ability concepts and evidence">
        <h2>Ability concepts & sources</h2>
        <div class="concept-list">
          <div>
            <strong>Increased movement</strong>
            <p>
              Some Deck Leaders can move two squares instead of one after an ability is unlocked.
            </p>
          </div>
          <div>
            <strong>Extended support range</strong>
            <p>Some support effects extend from the normal 3×3 area to a 5×5 area.</p>
          </div>
          <div>
            <strong>Same-type support</strong>
            <p>Some abilities can boost or protect nearby friendly monsters of a matching type.</p>
          </div>
          <div>
            <strong>Special effects</strong>
            <p>
              Other reported abilities include terrain changes, LP recovery, extra Graveyard Slot
              arrows, and hidden-card discovery. Their availability is not universal.
            </p>
          </div>
        </div>
        <p class="small-copy">
          Rules derive from the US instruction manual and community walkthrough. Specific type/rank
          examples above are reported by an incomplete GameFAQs FAQ, not verified independently for
          all 854 cards.
        </p>
        <ul class="sources">
          {#each Object.values(DECK_LEADER_SOURCES) as source (source.url)}
            <li><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>
          {/each}
        </ul>
      </section>
    </div>
  </div>
</section>

<style>
  .surface {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .reference-layout {
    display: grid;
    grid-template-columns: minmax(15rem, 19rem) minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }
  .reference-sidebar {
    min-width: 0;
    padding: 1rem;
  }
  .field-label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.8125rem;
    font-weight: 650;
  }
  .small-copy {
    margin: 0.4rem 0;
    font-size: 0.8125rem;
    color: var(--muted-foreground);
    line-height: 1.5;
  }
  .card-options {
    display: grid;
    gap: 0.35rem;
    margin: 0.7rem 0;
    padding: 0;
    list-style: none;
    max-height: 22rem;
    overflow-y: auto;
  }
  .card-option {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 0.55rem;
    border: 1px solid var(--border);
    padding: 0.4rem;
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--foreground);
    text-align: left;
  }
  .card-option:hover {
    background: var(--selected);
    border-color: var(--primary);
  }
  .option-art {
    width: 3.3rem;
    flex: 0 0 3.3rem;
  }
  .option-description {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 0.8125rem;
  }
  .option-description small {
    color: var(--muted-foreground);
  }
  .starter-selector {
    display: grid;
    gap: 0.35rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
  .reference-content {
    display: grid;
    gap: 1rem;
    min-width: 0;
  }
  .selected-card {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
  }
  .selected-artwork {
    width: 9rem;
    flex: 0 0 9rem;
    border-radius: var(--radius);
    overflow: hidden;
  }
  .selected-description {
    flex: 1;
    min-width: 12rem;
  }
  .selected-description h2 {
    margin: 0.2rem 0;
    font-size: 1.25rem;
  }
  .card-number {
    font-weight: 400;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
  .eyebrow {
    font-size: 0.6875rem;
    font-weight: 650;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted-foreground);
  }
  .starter-label {
    margin: 0.45rem 0;
    font-size: 0.75rem;
    font-weight: 650;
    color: var(--primary);
  }
  .info-section {
    padding: 1rem;
    min-width: 0;
  }
  .info-section h2 {
    font-size: 1rem;
    margin: 0 0 0.35rem;
  }
  .ability-list {
    display: grid;
    margin-top: 0.8rem;
  }
  .ability-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    border-top: 1px solid var(--border);
    padding: 0.55rem 0;
    font-size: 0.8125rem;
  }
  .rank-code {
    font-variant-numeric: tabular-nums;
    color: var(--primary);
    font-size: 0.75rem;
    white-space: nowrap;
  }
  .caveat {
    padding: 0.65rem 0.75rem;
    background: var(--elevated);
    font-size: 0.8125rem;
    border-radius: var(--radius);
    color: var(--muted-foreground);
    line-height: 1.5;
  }
  .example-box {
    display: grid;
    gap: 0.3rem;
    background: var(--elevated);
    border-radius: var(--radius);
    padding: 0.75rem;
    margin: 0.6rem 0;
  }
  .example-box select {
    max-width: 25rem;
  }
  .rules-list {
    display: grid;
    gap: 0.5rem;
    margin: 0.65rem 0 0;
    padding-left: 1.2rem;
    font-size: 0.8125rem;
    line-height: 1.6;
  }
  .rank-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.4rem;
    list-style: none;
    margin: 0.75rem 0 0;
    padding: 0;
  }
  .rank-grid li {
    display: grid;
    grid-template-columns: 1.5rem 3.1rem minmax(0, 1fr);
    align-items: center;
    gap: 0.35rem;
    padding: 0.55rem;
    background: var(--elevated);
    border-radius: var(--radius);
    font-size: 0.75rem;
  }
  .rank-number {
    color: var(--muted-foreground);
    font-variant-numeric: tabular-nums;
  }
  .concept-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    margin: 0.65rem 0;
  }
  .concept-list div {
    background: var(--elevated);
    border-radius: var(--radius);
    padding: 0.65rem;
    font-size: 0.8125rem;
  }
  .concept-list p {
    margin: 0.25rem 0 0;
    color: var(--muted-foreground);
    line-height: 1.5;
  }
  .sources {
    margin: 0.55rem 0 0;
    padding-left: 1.2rem;
    font-size: 0.75rem;
    line-height: 1.8;
  }
  .sources a {
    color: var(--primary);
  }
  @media (max-width: 1020px) {
    .rank-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 780px) {
    .reference-layout {
      grid-template-columns: minmax(0, 1fr);
    }
    .rank-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 480px) {
    .rank-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .concept-list {
      grid-template-columns: minmax(0, 1fr);
    }
    .selected-artwork {
      width: 6.5rem;
      flex-basis: 6.5rem;
    }
  }
</style>
