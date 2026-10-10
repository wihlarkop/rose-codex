<script lang="ts">
  import CardArtwork from './cards/CardArtwork.svelte';
  import type { BrowserCard } from '../lib/dotr/browser';
  import type { StrategyPlaybook } from '../lib/dotr/deck-strategy';

  let { playbook, images }: { playbook: StrategyPlaybook; images: BrowserCard[] } = $props();
  const cardById = $derived(new Map(images.map(card => [card.id, card])));
  const name = (id: number): string =>
    cardById.get(id)?.name ?? '#' + id.toString().padStart(3, '0');
</script>

<section class="mt-4 rounded-lg border border-border bg-surface p-4"
  aria-label="Deterministic strategy playbook for the suggested deck">
  <div class="flex flex-wrap items-baseline justify-between gap-2">
    <h3 class="text-base font-semibold">How to play this deck</h3>
    <span class="text-xs text-muted-foreground">M5-03 · Read-only playbook</span>
  </div>
  <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
    This plan uses your recommended 40-card list, recorded matchup highlights and
    supported ordinary terrain. It cannot see your hand or live PCSX2 board.
    Every suggested move is conditional on the actual game state.
  </p>

  <div class="mt-3 grid gap-2 sm:grid-cols-3">
    <article class="rounded-md border border-border bg-elevated p-3">
      <h4 class="text-xs font-semibold text-primary">1. Setup priority</h4>
      <p class="mt-2 text-xs leading-relaxed">{playbook.setup}</p>
    </article>
    <article class="rounded-md border border-border bg-elevated p-3">
      <h4 class="text-xs font-semibold text-primary">2. Terrain positioning</h4>
      <p class="mt-2 text-xs leading-relaxed">{playbook.positioning}</p>
    </article>
    <article class="rounded-md border border-border bg-elevated p-3">
      <h4 class="text-xs font-semibold text-primary">3. Threat response</h4>
      <p class="mt-2 text-xs leading-relaxed">{playbook.threatResponse}</p>
    </article>
  </div>

  <div class="mt-4 grid gap-4 lg:grid-cols-2">
    <section aria-label="Stat-only reported threat matchups">
      <h4 class="text-sm font-semibold">Against reported monsters</h4>
      <p class="mt-1 text-xs text-muted-foreground">
        Best available ATK-to-ATK comparisons on named ordinary terrain,
        not verified attack outcomes.
      </p>
      {#if playbook.threats.length}
        <ul class="mt-2 grid gap-2">
          {#each playbook.threats as threat (threat.cardId)}
            {@const enemy = cardById.get(threat.cardId)}
            <li class="flex min-w-0 gap-2 rounded-md border border-border bg-elevated p-2">
              {#if enemy}
                <div class="w-11 shrink-0 overflow-hidden rounded-sm">
                  <CardArtwork image={enemy.image} name={enemy.name} cardId={enemy.id} decorative />
                </div>
              {/if}
              <div class="min-w-0 text-xs leading-relaxed">
                <strong class="block">{name(threat.cardId)}</strong>
                {#if threat.bestCardId !== null && threat.attackEdge !== null}
                  <p class="mt-1 text-muted-foreground">
                    {name(threat.bestCardId)} · {threat.terrain}
                    · {threat.attackEdge > 0 ? '+' : ''}{threat.attackEdge} ATK difference.
                    {threat.attackEdge > 0 ? 'Stat edge only.' : 'No positive stat edge found.'}
                  </p>
                {:else}
                  <p class="mt-1 text-muted-foreground">
                    No supported ordinary terrain comparison.
                  </p>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-2 text-xs text-muted-foreground">
          No reported monster ATK values are available to compare.
        </p>
      {/if}
    </section>

    <section aria-label="Ordinary terrain suggestions">
      <h4 class="text-sm font-semibold">Terrain positioning reference</h4>
      <p class="mt-1 text-xs text-muted-foreground">
        The highest adjusted-ATK candidate in the suggested deck on each
        known ordinary terrain. Placement and movement are unverified.
      </p>
      {#if playbook.terrainPicks.length}
        <ul class="mt-2 grid gap-2">
          {#each playbook.terrainPicks as choice (choice.terrain)}
            <li class="flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-elevated px-3 py-2 text-xs">
              <span><strong>{choice.terrain}</strong> · {name(choice.cardId)}</span>
              <span class="tabular-nums text-muted-foreground">
                ATK {choice.adjustedAttack} ({choice.modifier >= 0 ? '+' : ''}{choice.modifier})
              </span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-2 text-xs text-muted-foreground">
          No supported ordinary terrain is identified for this opponent.
          Special terrain and unclear layouts are intentionally omitted.
        </p>
      {/if}
    </section>

    <section aria-label="Known compatible power-up pairs">
      <h4 class="text-sm font-semibold">Potential power-up pairs</h4>
      {#if playbook.equipPairs.length}
        <ul class="mt-2 grid gap-1.5">
          {#each playbook.equipPairs as pair (pair.equipCardId)}
            <li class="rounded-md bg-elevated px-3 py-2 text-xs">
              <strong>{name(pair.equipCardId)}</strong>
              <span class="text-muted-foreground"> → {name(pair.monsterCardId)}</span>
            </li>
          {/each}
        </ul>
        <p class="mt-2 text-xs text-muted-foreground">
          Canonical compatibility only; the actual boost and activation
          conditions are not simulated.
        </p>
      {:else}
        <p class="mt-2 text-xs text-muted-foreground">
          No compatible power-up pairs in this particular 40-card list.
        </p>
      {/if}
    </section>

    <section aria-label="Known ordinary fusion possibilities">
      <h4 class="text-sm font-semibold">Potential fusion combinations</h4>
      {#if playbook.fusionPairs.length}
        <ul class="mt-2 grid gap-1.5">
          {#each playbook.fusionPairs as fusion (fusion.leftId + ':' + fusion.rightId)}
            <li class="rounded-md bg-elevated px-3 py-2 text-xs leading-relaxed">
              <strong>{name(fusion.leftId)} + {name(fusion.rightId)}</strong>
              <span class="text-muted-foreground">
                → {name(fusion.resultCardId)} · +{fusion.attackGain} printed ATK
                over the stronger material
              </span>
            </li>
          {/each}
        </ul>
        <p class="mt-2 text-xs text-muted-foreground">
          Known ordinary recipes, not confirmed playable sequences for your current field.
        </p>
      {:else}
        <p class="mt-2 text-xs text-muted-foreground">
          No ATK-increasing ordinary pair among the suggested monster types;
          that does not rule out other fusion or transformation mechanics.
        </p>
      {/if}
    </section>
  </div>

  <details class="mt-4 rounded-md border border-border p-3">
    <summary class="cursor-pointer text-xs font-semibold text-primary">
      Important uncertainties
    </summary>
    <ul class="mt-2 grid list-disc gap-1 pl-4 text-xs leading-relaxed text-muted-foreground">
      {#each playbook.warnings as warning (warning)}
        <li>{warning}</li>
      {/each}
    </ul>
  </details>
</section>
