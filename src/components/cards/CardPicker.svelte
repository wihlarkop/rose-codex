<script lang="ts">
  import { tick } from 'svelte';
  import SearchIcon from '@lucide/svelte/icons/search';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../ui/button';
  import * as Command from '../ui/command';
  import * as Popover from '../ui/popover';
  import CardPickerOption from './CardPickerOption.svelte';
  import { filterCards, type BrowserCard } from '../../lib/dotr/browser';
  let { cards, onselect, label = 'Select a card', selectedCardId = null }: {
    cards: BrowserCard[]; onselect: (cardId: number) => void; label?: string; selectedCardId?: number | null;
  } = $props();
  let open = $state(false);
  let query = $state('');
  let triggerRef = $state<HTMLButtonElement | null>(null);
  let inputRef = $state<HTMLInputElement | null>(null);
  const matches = $derived(filterCards(cards, { query, kind: '', monsterType: '', attribute: '' }));
  const shown = $derived(matches.slice(0, 20));
  const selected = $derived(cards.find(card => card.id === selectedCardId));
  async function select(id: number) { open = false; query = ''; await tick(); triggerRef?.focus(); onselect(id); }
  function resetQuery() { query = ''; inputRef?.focus(); }
</script>
<Popover.Root bind:open>
  <Popover.Trigger bind:ref={triggerRef}>
    {#snippet child({ props })}
      <Button {...props} variant="outline" class="h-10 gap-2 rounded-md px-3" aria-label={selected ? label + ': ' + selected.name : label}>
        <SearchIcon class="size-4 text-primary" aria-hidden="true" />{selected?.name ?? label}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content align="end" class="w-[420px] max-w-[calc(100vw-2rem)] p-0 rounded-md"
    onOpenAutoFocus={(event) => { event.preventDefault(); tick().then(() => inputRef?.focus()); }}>
    <Command.Root shouldFilter={false} label={label}>
      <div class="relative">
        <Command.Input bind:value={query} bind:ref={inputRef} aria-label="Find a card" placeholder="Card name or ID…" class="pr-10" />
        {#if query}<Button variant="ghost" size="icon" class="absolute right-2 top-2 size-8" aria-label="Clear card search" onclick={resetQuery}><XIcon class="size-4" aria-hidden="true" /></Button>{/if}
      </div>
      <Command.List aria-label="Card suggestions">
        <Command.Empty>No cards found. Try a name or ID from 000 to 853.</Command.Empty>
        {#each shown as card (card.id)}
          <Command.Item value={String(card.id)} data-checked={selectedCardId === card.id}
            onSelect={() => select(card.id)} class="cursor-pointer gap-3 px-2 py-2 data-selected:bg-selected data-selected:text-foreground">
            <CardPickerOption {card} />
          </Command.Item>
        {/each}
      </Command.List>
      <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span role="status">{matches.length > 20 ? 'First 20 of ' + matches.length + ' matches · Keep typing' : matches.length + (matches.length === 1 ? ' match' : ' matches')}</span>
        <span>↑ ↓ to move · Enter to select · Esc to close</span>
      </div>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
