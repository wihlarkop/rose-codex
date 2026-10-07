export interface GalleryEntry {
  cardId: number;
  galleryName: string;
  filename: string;
}

export function parseGallery(wikitext: string): GalleryEntry[] {
  const galleries = [...wikitext.matchAll(/<gallery\b[^>]*>([\s\S]*?)<\/gallery>/gi)];
  if (!galleries.length) throw new Error('No gallery in source');
  const ids = new Set<number>();
  const filenames = new Set<string>();
  const entries: GalleryEntry[] = [];
  for (const gallery of galleries) for (const line of gallery[1]!.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = /^\s*(?:File:)?([^|]+?)\s*\|\s*\{\{pound\}\}(\d{3})\s*<br\s*\/?\s*>\s*"(.+)"\s*$/.exec(line);
    if (!row) throw new Error(`Unrecognized gallery row: ${line}`);
    const filename = row[1]!.trim();
    const cardId = Number(row[2]);
    if (cardId > 853 || ids.has(cardId)) throw new Error(`Duplicate or unexpected DotR ID ${cardId}`);
    if (!/^[^/\\]+-DOR-EN-VG\.png$/.test(filename) || filenames.has(filename)) throw new Error(`Duplicate or non-English-DotR source ${filename}`);
    const caption = row[3]!;
    const link = /^\[\[([^\]]+)\]\]$/.exec(caption);
    const galleryName = (link ? link[1]!.split('|').at(-1)! : caption).trim();
    if (!galleryName || /[\[\]{}<>]/.test(galleryName)) throw new Error(`Unrecognized card label ${caption}`);
    ids.add(cardId); filenames.add(filename);
    entries.push({ cardId, galleryName, filename });
  }
  return entries.sort((a, b) => a.cardId - b.cardId);
}

export function auditMappings(entries: GalleryEntry[], cards: { id: number; name: string }[]) {
  const byId = new Map(entries.map(entry => [entry.cardId, entry]));
  return {
    missingIds: cards.filter(card => !byId.has(card.id)).map(card => card.id),
    nameMismatches: cards.flatMap(card => {
      const entry = byId.get(card.id);
      return entry && entry.galleryName !== card.name
        ? [{ cardId: card.id, canonicalName: card.name, galleryName: entry.galleryName }] : [];
    }),
  };
}
