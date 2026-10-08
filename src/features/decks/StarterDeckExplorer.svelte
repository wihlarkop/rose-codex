<script lang="ts">
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import { starterDecksForName } from '../../lib/dotr/naming';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import starterData from '../../../data/canonical/starters.json';
  import { knownDeckCost } from './model';

  type StarterImport = { name: string; cardIds: number[] };
  type NameResult = {
    choice: ReturnType<typeof starterDecksForName> | null;
    error: string | null;
  };

  let {
    cards,
    oncreate,
  }: {
    cards: BrowserCard[];
    oncreate: (deck: StarterImport) => void;
  } = $props();

  const cardById = new Map(cards.map((card) => [card.id, card]));
  const deckByLeader = new Map(starterData.decks.map((deck) => [deck.leaderCardId, deck]));
  const costs = new Map(cards.map((card) => [card.id, card.deckCost]));

  let playerName = $state('');
  let selectedLeaderId = $state<number | null>(null);

  const result = $derived.by((): NameResult => {
    if (!playerName) return { choice: null, error: null };
    try {
      return { choice: starterDecksForName(playerName), error: null };
    } catch (error) {
      return {
        choice: null,
        error: error instanceof Error ? error.message : 'Unsupported player name.',
      };
    }
  });

  const choices = $derived(
    result.choice?.leaderCardIds.map((leaderId) => ({
      leaderId,
      leader: cardById.get(leaderId),
      deck: deckByLeader.get(leaderId),
    })) ?? [],
  );
  const selected = $derived(choices.find((choice) => choice.leaderId === selectedLeaderId));
  const selectedCost = $derived(
    selected?.deck ? knownDeckCost(selected.deck.cardIds, costs) : null,
  );
  const previewRows = $derived.by(() => {
    if (!selected?.deck) return [];
    const counts = new Map<number, number>();
    for (const id of selected.deck.cardIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    return [...counts.entries()]
      .map(([id, count]) => ({ id, count, card: cardById.get(id) }))
      .sort((a, b) => (a.card?.name ?? '').localeCompare(b.card?.name ?? ''));
  });

  function createFromSelection() {
    if (!selected?.deck || !selected.leader || !result.choice) return;
    oncreate({
      name: `Starter: ${playerName} · ${selected.leader.name}`,
      cardIds: [...selected.deck.cardIds],
    });
  }
</script>

<div class="starter-explorer">
  <div class="name-entry">
    <label for="dotr-player-name">Player name in DotR</label>
    <input
      id="dotr-player-name"
      type="text"
      autocomplete="off"
      spellcheck="false"
      placeholder="Enter your in-game name"
      bind:value={playerName}
      oninput={() => (selectedLeaderId = null)}
      aria-describedby="dotr-name-help"
      aria-invalid={Boolean(result.error)}
    />
    <p id="dotr-name-help">
      1–12 characters. Uppercase, lowercase and spaces change the result. Enter your name exactly as
      it appears in the English-language game.
    </p>
  </div>

  {#if result.error}
    <p class="name-error" role="status">{result.error}</p>
  {:else if result.choice}
    <p class="group-note" role="status">
      Starter group {result.choice.groupId + 1} of 16 · Choose one of the three Deck Leaders.
    </p>
    <div class="starter-choices" aria-label="Starter Deck Leader choices">
      {#each choices as choice (choice.leaderId)}
        <button
          class="starter-choice"
          class:chosen={selectedLeaderId === choice.leaderId}
          type="button"
          aria-pressed={selectedLeaderId === choice.leaderId}
          onclick={() => (selectedLeaderId = choice.leaderId)}
        >
          {#if choice.leader}
            <div class="leader-artwork">
              <CardArtwork
                image={choice.leader.image}
                name={choice.leader.name}
                cardId={choice.leaderId}
                decorative
              />
            </div>
            <span class="leader-description">
              <strong>{choice.leader.name}</strong>
              <span>Deck Leader · #{String(choice.leaderId).padStart(3, '0')}</span>
              <span>{choice.deck ? '40-card starter list available' : 'Deck list unavailable'}</span
              >
            </span>
          {:else}
            <span>Unknown Deck Leader #{String(choice.leaderId).padStart(3, '0')}</span>
          {/if}
        </button>
      {/each}
    </div>

    {#if selected?.deck && selected.leader}
      <section class="starter-preview" aria-label="Selected starter deck preview">
        <div class="preview-heading">
          <div>
            <h3>{selected.leader.name} starter deck</h3>
            <p>
              {selected.deck.cardIds.length} main-deck cards ·
              {previewRows.length} unique · Known Deck Cost {selectedCost?.known ?? 0}
              {#if selectedCost?.unknown}
                · {selectedCost.unknown} unknown costs{/if}
            </p>
          </div>
          <button type="button" class="create-starter" onclick={createFromSelection}>
            Create as new deck
          </button>
        </div>
        {#if selected.deck.status === 'manual-review'}
          <p class="evidence-note">
            This starter list is flagged for manual review in Rose Codex's canonical data. Compare
            its contents against your game before relying on it.
          </p>
        {:else}
          <p class="evidence-note">
            Recorded from a single source, not independently verified against the game.
          </p>
        {/if}
        <p class="leader-caveat">
          Creates a separate editable 40-card deck. The chosen Deck Leader is recorded in the new
          deck's name; leader selection and rank are not yet part of the saved deck format.
        </p>
        <div
          class="preview-scroll"
          role="region"
          tabindex="0"
          aria-label="Forty-card starter contents"
        >
          <ul>
            {#each previewRows as row (row.id)}
              <li>
                {#if row.card}
                  <div class="preview-artwork">
                    <CardArtwork
                      image={row.card.image}
                      name={row.card.name}
                      cardId={row.id}
                      decorative
                    />
                  </div>
                  <span class="preview-card-name">{row.card.name}</span>
                {:else}
                  <span class="preview-card-name">Unknown card</span>
                {/if}
                <span class="preview-card-id">#{String(row.id).padStart(3, '0')}</span>
                <strong class="preview-count">×{row.count}</strong>
              </li>
            {/each}
          </ul>
        </div>
      </section>
    {:else}
      <p class="selection-help">Select a Deck Leader above to preview its 40-card starter list.</p>
    {/if}
  {:else}
    <p class="selection-help">
      Enter a player name to discover the three starter deck choices offered by DotR.
    </p>
  {/if}
</div>

<style>
  .starter-explorer {
    display: grid;
    gap: 0.8rem;
    padding: 0 1rem 1rem;
    min-width: 0;
  }
  .name-entry {
    display: grid;
    gap: 0.35rem;
  }
  .name-entry label {
    font-size: 0.875rem;
    font-weight: 650;
  }
  .name-entry input {
    width: 100%;
    max-width: 28rem;
    min-width: 0;
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--foreground);
    background: var(--elevated);
    font-size: 0.875rem;
  }
  .name-entry input:focus-visible,
  .starter-choice:focus-visible,
  .create-starter:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  .name-entry p,
  .group-note,
  .selection-help,
  .leader-caveat,
  .evidence-note {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
    line-height: 1.5;
  }
  .name-error {
    margin: 0;
    color: var(--warning);
    font-size: 0.8125rem;
  }
  .starter-choices {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.65rem;
  }
  .starter-choice {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
    padding: 0.6rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--foreground);
    text-align: left;
    cursor: pointer;
  }
  .starter-choice:hover,
  .starter-choice.chosen {
    border-color: var(--primary);
    background: var(--selected);
  }
  .leader-artwork {
    width: 4rem;
    flex-shrink: 0;
  }
  .leader-artwork :global(.card-artwork) {
    width: 4rem;
    height: 3.2rem;
    border-radius: 4px;
  }
  .leader-description {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .leader-description strong {
    font-size: 0.875rem;
  }
  .leader-description span {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .starter-preview {
    display: grid;
    gap: 0.6rem;
    padding-top: 0.8rem;
    border-top: 1px solid var(--border);
  }
  .preview-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .preview-heading h3 {
    margin: 0;
    font-size: 1rem;
  }
  .preview-heading p {
    margin: 0.25rem 0 0;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
  .create-starter {
    padding: 0.65rem 0.85rem;
    border: 1px solid var(--primary);
    border-radius: var(--radius);
    background: var(--primary);
    color: var(--surface);
    font-size: 0.8125rem;
    font-weight: 650;
    cursor: pointer;
  }
  .create-starter:hover {
    filter: brightness(0.94);
  }
  .evidence-note {
    color: var(--warning);
  }
  .preview-scroll {
    max-height: 20rem;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .preview-scroll:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  .preview-scroll ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .preview-scroll li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 0.65rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.8125rem;
  }
  .preview-scroll li:last-child {
    border-bottom: none;
  }
  .preview-artwork {
    width: 2.8rem;
    flex-shrink: 0;
  }
  .preview-artwork :global(.card-artwork) {
    width: 2.8rem;
    height: 2.2rem;
    border-radius: 4px;
  }
  .preview-card-name {
    min-width: 0;
    flex: 1;
  }
  .preview-card-id {
    color: var(--muted-foreground);
    font-variant-numeric: tabular-nums;
  }
  .preview-count {
    min-width: 2rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  @media (max-width: 750px) {
    .starter-choices {
      grid-template-columns: 1fr;
    }
    .create-starter {
      width: 100%;
    }
  }
</style>
