<script lang="ts">
  import type { BrowserCard } from '../../lib/dotr/browser';
  import { suggestFusionPlays } from '../../lib/dotr/fusion-advisor';
  import type { FusionDiscovery, FusionRecipe } from '../../lib/dotr/fusion-discovery';
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import FusionRecipeView from './FusionRecipeView.svelte';

  let {
    discovery,
    cardById,
    labels,
    inputCount,
    onapply,
  }: {
    discovery: FusionDiscovery;
    cardById: Map<number, BrowserCard>;
    labels: Map<string, string>;
    inputCount: number;
    onapply?: ((recipe: FusionRecipe) => void) | undefined;
  } = $props();

  const plays = $derived(suggestFusionPlays(discovery, cardById));
</script>

<section class="rounded-lg border border-border bg-surface p-3" aria-label="Suggested fusion plays">
  <h2 class="m-0 text-base font-semibold">Suggested Plays</h2>
  <p class="mb-3 mt-1 text-xs leading-relaxed text-muted-foreground">
    Ranked by highest known result ATK, with fewer materials as a tiebreaker.
    Follow the recipe in order. This is fusion guidance, not a guaranteed best move
    against an opponent or terrain.
  </p>
  {#if !discovery.complete}
    <p class="mb-3 text-xs text-warning">
      Search is partial: additional combinations may exist. Suggestions use confirmed recipes only.
    </p>
  {/if}
  {#if plays.length}
    <ol class="m-0 grid list-none gap-3 p-0">
      {#each plays as play, index (play.resultCardId)}
        {@const card = cardById.get(play.resultCardId)!}
        <li class="min-w-0 rounded-md border border-border p-3">
          <div class="mb-2 flex min-w-0 items-start gap-3">
            <div class="w-16 shrink-0 overflow-hidden rounded-sm">
              <CardArtwork image={card.image} name={card.name} cardId={card.id} decorative />
            </div>
            <div class="min-w-0 flex-1">
              <p class="m-0 text-xs font-semibold text-primary">
                {index === 0 ? 'Strongest known fusion by ATK' : 'Alternative ' + index}
              </p>
              <p class="m-0 break-words text-sm font-semibold">
                {card.name} · #{String(card.id).padStart(3, '0')}
              </p>
              <p class="mb-0 mt-1 text-xs text-muted-foreground">
                ATK {play.atk ?? 'unknown'} · {play.recipe.instanceIds.length}
                source cards · {inputCount - play.recipe.instanceIds.length} unused inputs
              </p>
            </div>
          </div>
          <FusionRecipeView recipe={play.recipe} {cardById} {labels} {onapply} />
        </li>
      {/each}
    </ol>
  {:else if inputCount < 2}
    <p class="m-0 text-sm text-muted-foreground">Add at least two cards to see possible fusion plays.</p>
  {:else}
    <p class="m-0 text-sm text-muted-foreground">
      No supported ordinary fusion recipe was found with these inputs.
      Keeping cards separate may be useful, but choosing a summon needs board and opponent information.
    </p>
  {/if}
</section>
