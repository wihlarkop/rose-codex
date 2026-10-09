<script lang="ts">
  import { compareDotrMemoryCards, type SaveComparison } from '../lib/dotr/ps2-save-diff';
  import { MAX_MEMCARD_BYTES } from '../lib/dotr/ps2-memcard';

  let before = $state<File | null>(null);
  let after = $state<File | null>(null);
  let report = $state<SaveComparison | null>(null);
  let error = $state('');
  let running = $state(false);
  let serial = 0;

  function selectBefore(event: Event) {
    before = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
    serial++;
    report = null;
    error = '';
  }
  function selectAfter(event: Event) {
    after = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
    serial++;
    report = null;
    error = '';
  }
  async function compare() {
    if (!before || !after) return;
    const current = ++serial;
    report = null;
    error = '';
    if (![before, after].every(file => file.name.toLowerCase().endsWith('.ps2')
      && file.size <= MAX_MEMCARD_BYTES)) {
      error = 'Choose two .ps2 File Memory Cards, each under 70 MiB.';
      return;
    }
    running = true;
    try {
      const [oldBytes, newBytes] = await Promise.all([
        before.arrayBuffer(), after.arrayBuffer(),
      ]);
      const result = compareDotrMemoryCards(
        new Uint8Array(oldBytes), new Uint8Array(newBytes),
      );
      if (serial === current) report = result;
    } catch (cause) {
      if (serial === current)
        error = cause instanceof Error ? cause.message : 'Unable to compare these memory cards.';
    } finally {
      if (serial === current) running = false;
    }
  }
  const offset = (value: number): string => '0x' + value.toString(16).toUpperCase().padStart(4, '0');
</script>

<section class="mt-5 rounded-lg border border-border bg-surface p-4"
  aria-label="Research comparison of two DotR save snapshots">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="text-base font-semibold">Compare Two Save Snapshots</h2>
      <p class="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Find which <strong>raw file byte offsets</strong> changed between two
        PCSX2 memory card copies. This is a research tool, not an inventory or
        deck decoder.
      </p>
    </div>
    <span class="rounded-md bg-elevated px-2 py-1 text-xs text-muted-foreground">
      Local · read-only
    </span>
  </div>

  <div class="mt-4 grid gap-3 sm:grid-cols-2">
    <label class="grid min-w-0 gap-2 text-xs font-semibold text-muted-foreground">
      Before · snapshot A
      <input type="file" accept=".ps2" onchange={selectBefore}
        class="block w-full min-w-0 text-sm font-normal text-foreground file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-2 file:text-sm" />
    </label>
    <label class="grid min-w-0 gap-2 text-xs font-semibold text-muted-foreground">
      After · snapshot B
      <input type="file" accept=".ps2" onchange={selectAfter}
        class="block w-full min-w-0 text-sm font-normal text-foreground file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-2 file:text-sm" />
    </label>
  </div>

  <div class="mt-3 flex flex-wrap items-center gap-3">
    <button type="button" onclick={compare} disabled={!before || !after || running}
      class="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
      {running ? 'Comparing locally…' : 'Compare save files'}
    </button>
    <p class="text-xs text-muted-foreground">
      Only candidate SLUS-20515 folder files are compared, by exact path.
      Each file is bounded to 2 MiB, with a 6 MiB per-card total.
    </p>
  </div>

  <details class="mt-3 rounded-md border border-border p-3">
    <summary class="cursor-pointer text-xs font-semibold text-primary">
      How to make a useful controlled comparison
    </summary>
    <ol class="mt-2 grid list-decimal gap-2 pl-5 text-xs leading-relaxed text-muted-foreground">
      <li>Save in-game, close PCSX2, and copy the .ps2 memory card as snapshot A.</li>
      <li>Reopen PCSX2, make exactly one known in-game change (for example, alter a deck card), then save again.</li>
      <li>Close PCSX2 and copy the memory card as snapshot B. Keep both backups safely outside the live memcards directory.</li>
      <li>Choose A and B here. Note the changed filenames and offsets. Repeat with different isolated changes to build evidence.</li>
    </ol>
    <p class="mt-2 text-xs text-muted-foreground">
      The game may update timestamps, counters, checksums or other fields when saving.
      Changed offsets do not prove which game field they represent. Results show
      offsets and counts only—not raw save bytes.
    </p>
  </details>

  {#if error}
    <p class="warning-note mt-3" role="alert">{error}</p>
  {/if}
  {#if report}
    <div class="mt-4" aria-label="Save comparison results">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-sm font-semibold">Filesystem payload differences</h3>
        <p class="text-xs text-muted-foreground" role="status">
          {report.changedFiles} non-identical/unreadable · {report.unchangedFiles} identical
        </p>
      </div>
      {#each report.warnings as warning (warning)}
        <p class="warning-note mt-2">{warning}</p>
      {/each}
      {#if report.files.length}
        <ul class="mt-3 grid gap-2">
          {#each report.files as file (file.path)}
            <li class="rounded-md border border-border bg-elevated p-3">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <strong class="min-w-0 break-all text-sm">{file.path}</strong>
                <span class="text-xs font-semibold"
                  class:text-primary={file.status === 'changed'}
                  class:text-warning={file.status === 'unreadable'}>
                  {file.status}
                </span>
              </div>
              <p class="mt-1 text-xs text-muted-foreground">
                A: {file.beforeBytes === null ? 'unavailable' : file.beforeBytes.toLocaleString('en-US') + ' bytes'}
                · B: {file.afterBytes === null ? 'unavailable' : file.afterBytes.toLocaleString('en-US') + ' bytes'}
                {#if file.changedBytes !== null}
                  · {file.changedBytes.toLocaleString('en-US')} changed/added/removed bytes
                {/if}
              </p>
              {#if file.warning}
                <p class="warning-note mt-2">{file.warning}</p>
              {/if}
              {#if file.status === 'changed' && file.changedRanges.length}
                <details class="mt-2 text-xs text-muted-foreground">
                  <summary class="cursor-pointer text-primary">
                    View changed byte offset ranges
                    ({file.totalRanges} total, first {file.changedRanges.length} shown)
                  </summary>
                  <ul class="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
                    {#each file.changedRanges as span (span.start)}
                      <li class="rounded-sm bg-surface px-2 py-1 font-mono tabular-nums">
                        {offset(span.start)}–{offset(span.endExclusive - 1)}
                      </li>
                    {/each}
                  </ul>
                  <p class="mt-2">
                    Offsets are within the individual save file, not the memory
                    card image. Inclusive end offsets are shown.
                  </p>
                </details>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-3 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          No candidate DotR files could be compared.
        </p>
      {/if}
    </div>
  {/if}

  <p class="mt-4 text-xs leading-relaxed text-muted-foreground">
    The two .ps2 images remain in browser memory only for this operation. No
    upload, file write, export, analytics or browser storage is performed.
    Source-file geometry or FAT errors stop the comparison or mark affected
    files unreadable, rather than inventing a gameplay difference.
  </p>
</section>
