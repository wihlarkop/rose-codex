<script lang="ts">
  import CardFlipTile from '../../components/cards/CardFlipTile.svelte';
  import FusionRecipeView from './FusionRecipeView.svelte';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import type { FusionRecipe, FusionResult } from '../../lib/dotr/fusion-discovery';
  let {
    result,
    cardById,
    labels,
    special = false,
    recommended = false,
    onlyResult = false,
    partial = false,
    onapply,
  }: {
    result: FusionResult;
    cardById: Map<number, BrowserCard>;
    labels: Map<string, string>;
    special?: boolean;
    recommended?: boolean;
    onlyResult?: boolean;
    partial?: boolean;
    onapply?: (recipe: FusionRecipe) => void;
  } = $props();
  let expanded = $state(false);
  let visibleAlternatives = $state(10);
  const card = $derived(cardById.get(result.resultCardId)!);
  const preferred = $derived(result.recipes[0]!);
</script>

<article
  id={(special ? 'special-result-' : 'fusion-result-') + card.id}
  tabindex="-1"
  class="min-w-0 border-b border-border py-5 first:pt-0"
  aria-label={card.name + (special ? ' special combination' : ' fusion result')}
>
  <div class="grid min-w-0 gap-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
    <div class="w-44 max-w-full">
      <CardFlipTile {card} id={(special ? 'special-result-' : 'fusion-result-') + card.id} />
    </div>
    <div class="min-w-0">
      {#if recommended && !special}
        <p class="mb-1 mt-0 text-xs font-semibold text-primary">Recommended fusion</p>
      {/if}
      <h3 class="mb-1 mt-0 text-base font-semibold">
        {card.name}
        <span class="number text-sm font-normal text-muted-foreground"
          >#{String(card.id).padStart(3, '0')}</span
        >
      </h3>
      <p class="mb-3 mt-0 text-xs text-muted-foreground">
        {#if card.atk !== null}ATK <span class="number font-semibold text-foreground"
            >{card.atk}</span
          >{/if}
        {#if card.def !== null}
          · DEF <span class="number font-semibold text-foreground">{card.def}</span>{/if}
        · {result.recipes.length}
        {result.recipes.length === 1 ? 'recipe' : 'recipes'}
      </p>
      {#if recommended && !special}
        <p
          class="mb-3 mt-0 rounded-md bg-elevated px-3 py-2 text-xs leading-relaxed text-muted-foreground"
        >
          <strong class="text-foreground">Why this result?</strong>
          {onlyResult
            ? partial
              ? 'The only ordinary fusion confirmed so far; search is partial.'
              : 'The only available ordinary fusion with these inputs.'
            : 'Highest known result ATK among currently discovered ordinary fusions.'}
          This guidance does not consider the opponent or terrain.
        </p>
      {/if}
      <FusionRecipeView
        recipe={preferred}
        {cardById}
        {labels}
        {special}
        {onapply}
        prominent={recommended && !special}
      />
      {#if result.recipes.length > 1}
        <details class="mt-3" ontoggle={(event) => (expanded = event.currentTarget.open)}>
          <summary class="cursor-pointer py-1 text-xs font-semibold text-primary">
            {result.recipes.length - 1} alternative {result.recipes.length === 2
              ? 'recipe'
              : 'recipes'}
          </summary>
          {#if expanded}
            <div class="mt-2 grid gap-4">
              {#each result.recipes.slice(1, visibleAlternatives + 1) as recipe}
                <FusionRecipeView {recipe} {cardById} {labels} {special} {onapply} />
              {/each}
              {#if result.recipes.length > visibleAlternatives + 1}
                <button
                  class="control-button justify-self-start"
                  onclick={() => (visibleAlternatives += 10)}>Show more recipes</button
                >
              {/if}
            </div>
          {/if}
        </details>
      {/if}
    </div>
  </div>
</article>
