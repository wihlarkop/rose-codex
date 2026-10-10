<script lang="ts">
  import { onMount } from 'svelte';
  type Theme = 'system' | 'dark' | 'light';
  const KEY = 'rose-codex.theme.v1';
  let theme = $state<Theme>('system');
  let notice = $state('');

  function setPreference(next: Theme) {
    theme = next;
    document.documentElement.removeAttribute('data-theme');
    if (next !== 'system') document.documentElement.dataset.theme = next;
    try {
      if (next === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
      notice = '';
    } catch {
      notice = 'Theme applied for this page only; browser storage is unavailable.';
    }
  }
  onMount(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored === 'dark' || stored === 'light') theme = stored;
    } catch {
      notice = 'System appearance is active; browser storage is unavailable.';
    }
  });
</script>
<label class="theme-choice">
  <span class="sr-only">Appearance</span>
  <select aria-label="Appearance" bind:value={theme}
    onchange={() => setPreference(theme)} title="Appearance: System, Dark or Light">
    <option value="system">System</option>
    <option value="dark">Dark</option>
    <option value="light">Light</option>
  </select>
</label>
{#if notice}<span class="sr-only" role="status">{notice}</span>{/if}
<style>
  .theme-choice select {
    height: 36px; border: 1px solid var(--border); background: var(--elevated);
    border-radius: var(--radius); color: var(--foreground); padding: 0 .5rem;
    font: inherit; font-size: .75rem;
  }
</style>
