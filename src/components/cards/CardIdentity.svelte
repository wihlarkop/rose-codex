<script lang="ts">
  let { name, cardId }: { name: string; cardId: number } = $props();
  const number = $derived(String(cardId).padStart(3, '0'));
</script>

<div class="card-identity" title={name} aria-label={name + ' · card ' + number}>
  <span class="identity-number">#{number}</span>
  <span class="identity-name">{name}</span>
</div>

<style>
  .card-identity {
    container-type: inline-size;
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 2.5rem;
    aspect-ratio: 5 / 4;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .3rem;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 5px;
    background: var(--elevated);
    padding: .2rem;
    text-align: center;
    color: var(--foreground);
  }
  .identity-number {
    font-size: clamp(.55rem, 6cqw, .85rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--primary);
  }
  .identity-name {
    display: none;
    max-width: 100%;
    overflow-wrap: anywhere;
    font-size: .75rem;
    line-height: 1.3;
    font-weight: 650;
  }
  @container (min-width: 140px) {
    .identity-name { display: block; }
  }
</style>
