<script lang="ts">
  import { Command as CommandPrimitive } from 'bits-ui';
  import SearchIcon from '@lucide/svelte/icons/search';
  import { cn } from '$lib/utils.js';
  let { ref = $bindable(null), value = $bindable(''), class: className, ...props }: CommandPrimitive.InputProps = $props();
</script>
<div class="flex items-center gap-3 border-b border-border px-3">
  <SearchIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  <CommandPrimitive.Input bind:ref bind:value data-slot="command-input"
    class={cn('h-12 w-full bg-transparent text-sm placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-sm', className)} {...props} />
</div>
