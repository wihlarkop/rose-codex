<script lang="ts">
  import { onDestroy } from 'svelte';
  import CardArtwork from './cards/CardArtwork.svelte';
  import { filterCards, type BrowserCard } from '../lib/dotr/browser';
  import {
    describePixels, bestVisualCandidates, FEATURE_WIDTH, FEATURE_HEIGHT,
    type VisualCandidate, type VisualSignature,
  } from '../lib/dotr/screenshot-match';

  let { cards, onconfirm }: {
    cards: BrowserCard[];
    onconfirm: (cardId: number, destination: 'hand' | 'summoning' | 'enemy') => void;
  } = $props();
  interface Crop { left: number; top: number; width: number; height: number }
  const initialCrop = (): Crop => ({ left: 25, top: 20, width: 50, height: 60 });
  const byId = $derived(new Map(cards.map(card => [card.id, card])));
  let preview = $state('');
  let crop = $state<Crop>(initialCrop());
  let filter = $state('');
  let destination = $state<'hand' | 'summoning' | 'enemy'>('hand');
  let progress = $state(0);
  let total = $state(0);
  let active = $state(false);
  let status = $state('');
  let results = $state<VisualCandidate[]>([]);
  const known = $derived(results.map(row => ({
    ...row, card: byId.get(row.cardId),
  })).filter((row): row is VisualCandidate & { card: BrowserCard } => !!row.card));
  let decoded: ImageBitmap | null = null;
  let currentUrl = '';
  let aborter: AbortController | null = null;
  let serial = 0;
  let dragStart: { x: number; y: number } | null = null;

  function cancelSearch() {
    serial++;
    aborter?.abort();
    aborter = null;
    active = false;
  }
  function clearScreenshot() {
    cancelSearch();
    decoded?.close();
    decoded = null;
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = '';
    preview = '';
    progress = 0;
    total = 0;
    results = [];
    crop = initialCrop();
  }
  onDestroy(() => clearScreenshot());

  async function loadScreenshot(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    clearScreenshot();
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
      || file.size < 1 || file.size > 15 * 1024 * 1024) {
      status = 'Choose a PNG, JPG, or WebP screenshot up to 15 MiB.';
      return;
    }
    try {
      const img = await createImageBitmap(file);
      if (img.width > 4096 || img.height > 4096 || img.width * img.height > 16_777_216) {
        img.close();
        status = 'Screenshot dimensions exceed the 4096×4096 pixel limit.';
        return;
      }
      decoded = img;
      currentUrl = URL.createObjectURL(file);
      preview = currentUrl;
      status = 'Screenshot stays in this browser. Drag across the displayed image to select one visible card, then rank candidates.';
    } catch {
      status = 'This image could not be decoded. Try a regular PCSX2 PNG screenshot.';
    }
  }
  function point(e: PointerEvent): { x: number; y: number } {
    const rect = e.currentTarget instanceof Element
      ? e.currentTarget.getBoundingClientRect() : null;
    if (!rect || rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
    return {
      x: Math.min(100, Math.max(0, 100 * (e.clientX - rect.left) / rect.width)),
      y: Math.min(100, Math.max(0, 100 * (e.clientY - rect.top) / rect.height)),
    };
  }
  function startCrop(event: PointerEvent) {
    if (!decoded || event.button !== 0) return;
    cancelSearch();
    results = [];
    dragStart = point(event);
    (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
  }
  function updateCrop(event: PointerEvent) {
    if (!dragStart) return;
    const end = point(event);
    const left = Math.min(dragStart.x, end.x), top = Math.min(dragStart.y, end.y);
    crop = {
      left, top, width: Math.abs(end.x - dragStart.x), height: Math.abs(end.y - dragStart.y),
    };
  }
  function endCrop(event: PointerEvent) {
    if (dragStart) updateCrop(event);
    dragStart = null;
  }
  function numericCrop(key: keyof Crop, raw: string) {
    const num = Number(raw);
    if (!Number.isFinite(num)) return;
    cancelSearch();
    results = [];
    crop = { ...crop, [key]: Math.min(100, Math.max(0, num)) };
  }

  function signature(bitmap: ImageBitmap, region?: Crop): VisualSignature {
    const canvas = document.createElement('canvas');
    canvas.width = FEATURE_WIDTH;
    canvas.height = FEATURE_HEIGHT;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D is unavailable.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (region) {
      const x = Math.floor(bitmap.width * region.left / 100);
      const y = Math.floor(bitmap.height * region.top / 100);
      const w = Math.min(bitmap.width - x, Math.max(1, Math.round(bitmap.width * region.width / 100)));
      const h = Math.min(bitmap.height - y, Math.max(1, Math.round(bitmap.height * region.height / 100)));
      ctx.drawImage(bitmap, x, y, w, h, 0, 0, canvas.width, canvas.height);
    } else ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return describePixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data,
      canvas.width, canvas.height);
  }

  async function matchScreenshot() {
    const bitmap = decoded;
    if (!bitmap) return;
    if (crop.width < 2 || crop.height < 2 || crop.left + crop.width > 100.01
      || crop.top + crop.height > 100.01) {
      status = 'Select a crop at least 2% wide/high and fully inside the screenshot.';
      return;
    }
    cancelSearch();
    const task = serial;
    let query: VisualSignature;
    try { query = signature(bitmap, crop); }
    catch { status = 'Cannot extract image features from the selected crop.'; return; }
    const choices = filterCards(cards, {
      query: filter, kind: '', monsterType: '', attribute: '',
    }).filter(card => card.image !== null);
    if (!choices.length) {
      status = 'No available reference artwork matches this name or ID filter.';
      return;
    }
    if (choices.length > 854) {
      status = 'The reference candidate limit was exceeded.';
      return;
    }
    const controller = new AbortController();
    aborter = controller;
    active = true;
    progress = 0;
    total = choices.length;
    results = [];
    status = 'Comparing with same-origin Rose Codex reference artwork. This does not upload your screenshot.';
    const matched: { cardId: number; signature: VisualSignature }[] = [];
    let cursor = 0;
    let complete = 0;
    const workers = Array.from({ length: Math.min(5, choices.length) }, async () => {
      while (!controller.signal.aborted && cursor < choices.length) {
        const card = choices[cursor++]!;
        try {
          const response = await fetch(card.image!.url, { signal: controller.signal });
          if (!response.ok) continue;
          const image = await createImageBitmap(await response.blob());
          try {
            const features = signature(image);
            matched.push({ cardId: card.id, signature: features });
          } finally {
            image.close();
          }
        } catch {
          // Missing artwork or an interrupted scan is not evidence of a match.
        } finally {
          complete++;
          if (task === serial && (complete % 12 === 0 || complete === choices.length))
            progress = complete;
        }
      }
    });
    await Promise.all(workers);
    if (task !== serial) return;
    aborter = null;
    active = false;
    if (!matched.length) {
      status = 'No reference images could be compared. Try again or use the manual card picker.';
      return;
    }
    results = bestVisualCandidates(query, matched, 12);
    status = 'Ranked ' + matched.length + '/' + choices.length
      + ' images by approximate visual similarity. Scores are NOT identification confidence. Confirm by looking at the artwork and name.';
  }

  function confirm(id: number) {
    const card = byId.get(id);
    if (!card || (destination === 'enemy' && card.kind !== 'monster')) return;
    onconfirm(id, destination);
    status = card.name + ' sent to '
      + (destination === 'enemy' ? 'visible enemy' : destination === 'hand' ? 'Hand' : 'your Field')
      + ' after your confirmation. The screenshot itself was not saved.';
  }
</script>

<details class="mt-4 rounded-lg border border-border bg-surface p-4"
  aria-label="Screenshot card candidate matcher">
  <summary class="cursor-pointer text-base font-semibold text-primary">
    Screenshot Assistant · Local candidate matching (M5-09)
  </summary>
  <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
    Upload a PCSX2 screenshot locally, select exactly one visible card,
    and compare its appearance with Rose Codex artwork. This experimental
    pixel matcher cannot read a full board, recognize face-down cards, infer
    turns or understand text. Similarity scores are NOT calibrated confidence.
    No AI API or external upload is used.
  </p>
  <div class="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
    <div class="min-w-0">
      <label class="grid gap-1 text-xs font-semibold text-muted-foreground">
        Local screenshot · PNG/JPG/WebP, max 15 MiB
        <input class="native-filter w-full" type="file"
          accept="image/png,image/jpeg,image/webp" onchange={loadScreenshot} />
      </label>
      {#if preview}
        <div class="mt-3">
          <p class="mb-2 text-xs text-muted-foreground">
            Drag on the preview to select a card. Keyboard alternative:
            edit crop percentages below.
          </p>
          <button type="button" class="relative block w-full overflow-hidden rounded-md border border-border"
            aria-label="Select card area by dragging on screenshot. Press Enter to reset the crop."
            onpointerdown={startCrop} onpointermove={updateCrop}
            onpointerup={endCrop} onpointercancel={endCrop}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                crop = initialCrop(); results = []; cancelSearch();
              }
            }}>
            <img src={preview} alt="Selected local PCSX2 screenshot" class="block h-auto w-full" />
            <span class="pointer-events-none absolute border-2 border-primary bg-primary/10"
              style:left={crop.left + '%'} style:top={crop.top + '%'}
              style:width={crop.width + '%'} style:height={crop.height + '%'}></span>
          </button>
          <div class="mt-2 grid grid-cols-4 gap-2">
            {#each ['left', 'top', 'width', 'height'] as key (key)}
              <label class="grid min-w-0 gap-1 text-xs text-muted-foreground">
                {key} %
                <input class="native-filter w-full" type="number" min="0" max="100" step="0.5"
                  value={crop[key as keyof Crop]}
                  oninput={(e) => numericCrop(key as keyof Crop, e.currentTarget.value)} />
              </label>
            {/each}
          </div>
        </div>
      {/if}
    </div>
    <div class="min-w-0">
      <label class="grid gap-1 text-xs font-semibold text-muted-foreground">
        Optional name/ID filter (faster than scanning the whole library)
        <input class="native-filter w-full" type="search" bind:value={filter}
          placeholder="Blank = compare all 853 images" />
      </label>
      <label class="mt-3 grid gap-1 text-xs font-semibold text-muted-foreground">
        Where should a confirmed card go?
        <select class="native-filter w-full" bind:value={destination}>
          <option value="hand">My Hand</option>
          <option value="summoning">My Field</option>
          <option value="enemy">Visible enemy Monster</option>
        </select>
      </label>
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!preview || active}
          class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          onclick={matchScreenshot}>Find candidate cards</button>
        {#if active}
          <button type="button" class="rounded-md border border-border px-3 py-2 text-xs"
            onclick={() => { cancelSearch(); status = 'Matching cancelled. No card selected.'; }}>
            Cancel scan
          </button>
        {/if}
        {#if preview && !active}
          <button type="button" class="rounded-md border border-border px-3 py-2 text-xs"
            onclick={() => { clearScreenshot(); status = 'Screenshot cleared.'; }}>Clear image</button>
        {/if}
      </div>
      {#if active}
        <p class="mt-2 text-xs tabular-nums text-muted-foreground" role="status">
          Scanning {progress}/{total} same-origin card images. A full library
          scan may use roughly 35 MiB of image transfers.
        </p>
      {/if}
      {#if status}
        <p class="mt-3 text-xs leading-relaxed text-muted-foreground" role="status">{status}</p>
      {/if}
      {#if known.length}
        <h3 class="mt-4 text-sm font-semibold">Visual candidates · Confirm manually</h3>
        <ul class="mt-2 grid max-h-[600px] gap-2 overflow-auto">
          {#each known as row (row.cardId)}
            <li class="flex min-w-0 items-center gap-2 rounded-md border border-border bg-elevated p-2">
              <div class="w-14 shrink-0 overflow-hidden rounded-sm">
                <CardArtwork image={row.card.image} name={row.card.name}
                  cardId={row.cardId} decorative />
              </div>
              <div class="min-w-0 flex-1 text-xs">
                <strong class="block">{row.card.name}</strong>
                <span class="text-muted-foreground">
                  #{String(row.cardId).padStart(3, '0')} · relative visual score {row.similarity.toFixed(1)}
                </span>
              </div>
              <button type="button" class="shrink-0 rounded-md border border-border px-2 py-1 text-xs hover:bg-hover"
                disabled={destination === 'enemy' && row.card.kind !== 'monster'}
                onclick={() => confirm(row.cardId)}>Confirm</button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</details>
