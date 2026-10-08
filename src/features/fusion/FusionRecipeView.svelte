<script lang="ts">
  import CardArtwork from '../../components/cards/CardArtwork.svelte';
  import type { BrowserCard } from '../../lib/dotr/browser';
  import type { FusionRecipe } from '../../lib/dotr/fusion-discovery';
  let {
    recipe,
    cardById,
    labels,
    special = false,
  }: {
    recipe: FusionRecipe;
    cardById: Map<number, BrowserCard>;
    labels: Map<string, string>;
    special?: boolean;
  } = $props();
  const number = (id: number) => '#' + String(id).padStart(3, '0');
</script>

<div class="text-xs leading-relaxed">
  <p class="mb-2 mt-0 font-medium text-muted-foreground">
    {recipe.instanceIds.length} materials · {special
      ? 'Special power-up'
      : recipe.steps.length === 1
        ? 'Direct fusion'
        : 'Fusion chain'}
    {#if !special}
      · {recipe.mode === 'hand'
        ? 'Hand'
        : recipe.mode === 'summon'
          ? 'Field start + Hand'
          : 'Field + Field'}
    {/if}
  </p>
  <ol class="m-0 grid list-none gap-2 p-0" aria-label="Ordered combination steps">
    {#each recipe.steps as step, index}
      {@const result = cardById.get(step.resultCardId)!}
      <li class="flex min-w-0 items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="m-0 break-words">
            <span class="font-medium"
              >{number(step.materials[0])} {cardById.get(step.materials[0])?.name}</span
            >
            <span class="text-muted-foreground">
              ({index === 0
                ? labels.get(step.sourceInstanceIds[0]!)
                : 'step ' + index + ' result'})</span
            >
            +
            <span class="font-medium"
              >{number(step.materials[1])} {cardById.get(step.materials[1])?.name}</span
            >
            <span class="text-muted-foreground"> ({labels.get(step.addedInstanceId)})</span>
          </p>
          <p class="mb-0 mt-0.5 font-semibold text-primary">→ {number(result.id)} {result.name}</p>
        </div>
        <div class="w-16 shrink-0 overflow-hidden rounded-sm">
          <CardArtwork image={result.image} name={result.name} cardId={result.id} />
        </div>
      </li>
    {/each}
  </ol>
  {#if !special && recipe.mode !== 'hand'}
    <p class="mb-0 mt-2 text-muted-foreground">
      {recipe.mode === 'summon'
        ? 'Start with this field monster in the Summon Square; add the Hand cards in the shown order.'
        : 'Requires a legal move of one monster onto the other’s square.'}
      Board legality is not evaluated.
    </p>
  {/if}
</div>
