<script lang="ts">
  import {
    inspectPs2MemoryCard,
    MAX_MEMCARD_BYTES,
    PS2_MEMCARD_RESEARCH,
    type Ps2ImageInspection,
  } from '../lib/dotr/ps2-memcard';

  let selectedFilename = $state('');
  let loading = $state(false);
  let inspection = $state<Ps2ImageInspection | null>(null);
  let error = $state('');
  let fileInput = $state<HTMLInputElement | null>(null);
  let request = 0;

  async function inspectFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    const sequence = ++request;
    inspection = null;
    error = '';
    selectedFilename = file?.name ?? '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.ps2')) {
      error = 'Choose a PCSX2 File Memory Card with the .ps2 extension.';
      return;
    }
    if (file.size > MAX_MEMCARD_BYTES) {
      error = 'File is over 70 MiB; this inspector does not load oversized images.';
      return;
    }
    loading = true;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (sequence === request) inspection = inspectPs2MemoryCard(bytes);
    } catch (cause) {
      if (sequence === request) error =
        cause instanceof Error ? cause.message : 'Could not read the selected file.';
    } finally {
      if (sequence === request) loading = false;
    }
  }

  function clear() {
    ++request;
    loading = false;
    inspection = null;
    error = '';
    selectedFilename = '';
    if (fileInput) fileInput.value = '';
  }

  const mib = (bytes: number): string => (bytes / 1024 / 1024).toFixed(2) + ' MiB';
  const dotrEntries = $derived(inspection?.entries.filter(entry => entry.possibleDotr) ?? []);
  const otherEntries = $derived(inspection?.entries.filter(entry => !entry.possibleDotr) ?? []);
</script>

<section aria-label="PCSX2 save tools">
  <header class="page-header">
    <div>
      <h1 class="page-title">PCSX2 Save Inspector</h1>
      <p class="page-description">
        Inspect a copy of your PS2 File Memory Card safely in your browser.
        Read-only structure and game folder discovery; no game-save editing.
      </p>
    </div>
    <a class="text-link text-sm" href="/collection/">My Collection →</a>
  </header>

  <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
    <div class="grid min-w-0 gap-4">
      <section class="rounded-lg border border-border bg-surface p-4" aria-label="Open memory card">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold">Open a memory card</h2>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              Only PCSX2 file-based <strong>.ps2</strong> cards are supported in v1.
              Folder Memory Cards and exported .psu / .max / .cbs saves are not parsed.
            </p>
          </div>
          <span class="rounded-md bg-elevated px-2 py-1 text-xs text-muted-foreground">
            Local only
          </span>
        </div>
        <label class="mt-4 block text-xs font-semibold text-muted-foreground" for="memcard-file">
          Choose a .ps2 memory card image
        </label>
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <input
            id="memcard-file"
            type="file"
            accept=".ps2"
            bind:this={fileInput}
            onchange={inspectFile}
            class="block max-w-full min-w-0 flex-1 text-sm text-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
          />
          {#if selectedFilename}
            <button class="rounded-md border border-border px-3 py-2 text-xs hover:bg-hover"
              type="button" onclick={clear}>Clear</button>
          {/if}
        </div>
        <p class="mt-3 text-xs text-muted-foreground">
          Recommended: make a backup or copy first, especially if PCSX2 is running.
          This page only reads the selected file into browser memory.
          No upload, backend request, write-back, download, or browser storage.
        </p>
        {#if loading}
          <p class="mt-3 text-sm text-muted-foreground" role="status">Reading memory card locally…</p>
        {/if}
        {#if error}
          <p class="warning-note mt-3" role="alert">{error}</p>
        {/if}
      </section>

      {#if inspection}
        <section class="rounded-lg border border-border bg-surface p-4" aria-label="Memory card summary">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold">Memory card summary</h2>
              <p class="mt-1 break-all text-xs text-muted-foreground">{selectedFilename}</p>
            </div>
            <span class="rounded-md bg-selected px-2 py-1 text-xs font-semibold text-primary">
              PS2 signature recognized
            </span>
          </div>
          <dl class="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-xs text-muted-foreground">Card logical capacity</dt>
              <dd class="font-semibold tabular-nums">{mib(inspection.logicalSize)}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">File size on disk</dt>
              <dd class="font-semibold tabular-nums">{mib(inspection.rawSize)}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Filesystem version</dt>
              <dd class="font-semibold">{inspection.version}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Page size</dt>
              <dd class="font-semibold tabular-nums">{inspection.pageSize} bytes</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Cluster size</dt>
              <dd class="font-semibold tabular-nums">{inspection.clusterSize} bytes</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Per-page spare data</dt>
              <dd class="font-semibold">{inspection.spareBytesPerPage ? '16 bytes (ECC/spare)' : 'Not stored'}</dd>
            </div>
          </dl>
          {#if inspection.warning}
            <p class="warning-note mt-3" role="alert">
              The filesystem header was recognized, but the root directory could
              not be read completely: {inspection.warning}
              Entries below may be incomplete.
            </p>
          {/if}
          {#if inspection.truncated}
            <p class="warning-note mt-3" role="status">
              This inspector only scans the first 256 directory records.
              Additional records are not shown.
            </p>
          {/if}
        </section>

        <section class="rounded-lg border border-border bg-surface p-4" aria-label="Detected save folders">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-base font-semibold">Root save folders</h2>
            <span class="text-xs text-muted-foreground">
              {inspection.entries.length} live entries
            </span>
          </div>
          <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
            These are top-level filesystem entry names. Identifying a directory
            is <strong>not</strong> the same as decoding a game's inventory, decks,
            ranks, or completion progress.
          </p>

          {#if dotrEntries.length}
            <div class="mt-3 rounded-md border border-border bg-selected p-3">
              <h3 class="text-sm font-semibold text-primary">Possible Duelists of the Roses save</h3>
              <p class="mt-1 text-xs text-muted-foreground">
                Folder name contains North American game ID SLUS-20515,
                according to an NTSC-U save resource. Other regions or names
                might not match; this is a filename hint, not content verification.
              </p>
              <ul class="mt-2 grid gap-1.5">
                {#each dotrEntries as entry (entry.name)}
                  <li class="min-w-0 break-all rounded-sm bg-surface p-2 text-sm">
                    <strong>{entry.name}</strong>
                    <span class="ml-2 text-xs text-muted-foreground">{entry.type}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {:else}
            <p class="mt-3 text-xs text-muted-foreground">
              No SLUS-20515 folder-name match in the scanned entries. This does
              not prove the card has no DotR save.
            </p>
          {/if}
          {#if otherEntries.length}
            <h3 class="mt-4 text-sm font-semibold">Other entries</h3>
            <ul class="mt-2 grid gap-1">
              {#each otherEntries as entry (entry.name + ':' + entry.type)}
                <li class="flex flex-wrap items-baseline justify-between gap-2 rounded-sm bg-elevated p-2 text-xs">
                  <span class="min-w-0 break-all font-medium">{entry.name}</span>
                  <span class="text-muted-foreground">{entry.type}</span>
                </li>
              {/each}
            </ul>
          {/if}
          {#if inspection.entries.length === 0}
            <p class="mt-4 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              No live top-level save entries were found
              {inspection.warning ? ' in the readable portion.' : '.'}
            </p>
          {/if}
        </section>
      {/if}
    </div>

    <aside class="grid min-w-0 gap-4" aria-label="Save inspector guidance">
      <section class="rounded-lg border border-border bg-surface p-4">
        <h2 class="text-base font-semibold">Where is my PCSX2 memory card?</h2>
        <ol class="mt-3 grid list-decimal gap-2 pl-5 text-sm leading-relaxed">
          <li>In PCSX2, open <strong>Settings → Memory Cards</strong>.</li>
          <li>Use <strong>Browse</strong> (or Tools → Open Data Directory), then open <code>memcards</code>.</li>
          <li>Make a copy of the chosen <code>.ps2</code> card, then select that copy above.</li>
        </ol>
        <p class="mt-3 text-xs text-muted-foreground">
          Some users configure folder-based cards instead. They are not supported
          by this v1 file inspector. Avoid modifying the live memory card while playing.
        </p>
        <a class="mt-3 inline-block text-xs text-link" href={PS2_MEMCARD_RESEARCH.pcsx2}
          rel="noreferrer" target="_blank">PCSX2 Memory Cards documentation ↗</a>
      </section>

      <section class="rounded-lg border border-border bg-surface p-4">
        <h2 class="text-base font-semibold">What this tool can verify</h2>
        <div class="mt-3 grid gap-3 text-xs">
          <div>
            <strong class="text-primary">Available in v1</strong>
            <p class="mt-1 text-muted-foreground">
              Raw .ps2 signature, filesystem geometry, ECC/spare layout, and
              bounded root-directory listing. A matching SLUS-20515 name
              is only a candidate DotR save indicator.
            </p>
          </div>
          <div>
            <strong class="text-foreground">Not decoded yet</strong>
            <p class="mt-1 text-muted-foreground">
              DotR card copies, Chest, active duel deck, Deck Leader rank,
              completed story path, or reincarnation counter. Those require
              a separately verified DotR-specific save payload parser.
            </p>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-border bg-surface p-4">
        <h2 class="text-sm font-semibold">Format references</h2>
        <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
          The filesystem structure follows public-domain reverse engineering
          by Ross Ridge. The emulator supports file and folder memory cards.
          A community NTSC-U save resource identifies game ID SLUS-20515.
        </p>
        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <a class="text-link" target="_blank" rel="noreferrer"
            href={PS2_MEMCARD_RESEARCH.format}>Filesystem specification ↗</a>
          <a class="text-link" target="_blank" rel="noreferrer"
            href={PS2_MEMCARD_RESEARCH.dotrSave}>DotR NTSC-U save reference ↗</a>
        </div>
      </section>
    </aside>
  </div>
</section>
