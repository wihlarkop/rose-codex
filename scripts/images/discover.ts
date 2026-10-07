import cards from '../../data/canonical/cards.json';
import { parseGallery, auditMappings } from './mapping';
import { digest, pause, publicFetch, wikiUrl } from './network';

const title = 'Gallery_of_Yu-Gi-Oh!_The_Duelists_of_the_Roses_cards';
const gallery = `https://yugipedia.com/wiki/${title}`;
const args = process.argv.slice(2);
if (args.length > 1 || args[0] && !/^\d+$/.test(args[0])) throw new Error('Usage: bun run images:discover [gallery revision ID]');
const revisionQuery = await (await publicFetch(wikiUrl({ action: 'query', prop: 'revisions', rvprop: 'ids|timestamp', titles: title }))).json() as any;
const latest = Object.values(revisionQuery.query?.pages ?? {}).map((page: any) => page.revisions?.[0])[0] as any;
const revision = args[0] ? Number(args[0]) : latest?.revid;
if (!revision) throw new Error('Gallery revision unavailable');
if (args[0] && revision !== latest?.revid) throw new Error('Requested revision is not current; use its saved discovery capture rather than silently reading a changed gallery');
await pause();
const capture = await (await publicFetch(wikiUrl({ action: 'parse', page: title, prop: 'wikitext|images' }))).text();
const parsed = JSON.parse(capture);
const wikitext = parsed.parse?.wikitext?.['*'];
if (typeof wikitext !== 'string') throw new Error('Missing gallery wikitext');
const entries = parseGallery(wikitext);
const audit = auditMappings(entries, cards);
await Bun.write(new URL('../../data/raw/image-gallery.json', import.meta.url), capture);

type Info = { url: string; width: number; height: number; size: number; extmetadata?: Record<string, { value: string }> };
const infoByFile = new Map<string, Info>();
const unavailableFiles: string[] = [];
for (let start = 0; start < entries.length; start += 50) {
  await pause();
  const filenames = entries.slice(start, start + 50).map(entry => `File:${entry.filename}`);
  const response = await (await publicFetch(wikiUrl({ action: 'query', prop: 'imageinfo', iiprop: 'url|size|extmetadata', titles: filenames.join('|') }))).json() as any;
  if (!response.query?.pages) throw new Error('Missing file metadata response');
  for (const page of Object.values(response.query.pages) as any[]) {
    const filename = String(page.title).replace(/^File:/, '');
    const info = page.imageinfo?.[0] as Info | undefined;
    if (!info) unavailableFiles.push(filename);
    else {
      const source = new URL(info.url);
      if (source.hostname !== 'ms.yugipedia.com' || source.protocol !== 'https:' || decodeURIComponent(source.pathname.split('/').at(-1)!) !== filename) throw new Error(`Unexpected original URL for ${filename}`);
      if (!Number.isInteger(info.width) || !Number.isInteger(info.height) || info.width < 200 || info.height < 200) throw new Error(`Invalid source dimensions for ${filename}`);
      infoByFile.set(filename, info);
    }
  }
  console.log(`Resolved file metadata ${Math.min(start + 50, entries.length)}/${entries.length}`);
}
const result = {
  schemaVersion: 1,
  gallery,
  revision,
  captureSha256: digest(capture),
  rights: 'unresolved-game-screenshot-rights',
  missingIds: audit.missingIds,
  nameMismatches: audit.nameMismatches,
  unavailableFiles,
  entries: entries.map(entry => {
    const info = infoByFile.get(entry.filename);
    const discrepancy = audit.nameMismatches.find(item => item.cardId === entry.cardId);
    const terms = info?.extmetadata;
    return {
      ...entry,
      canonicalName: cards[entry.cardId]!.name,
      source: info?.url ?? null,
      sourceKind: 'dotr-game-render',
      width: info?.width ?? null,
      height: info?.height ?? null,
      sourceBytes: info?.size ?? null,
      mapping: discrepancy && discrepancy.canonicalName.toLowerCase() !== discrepancy.galleryName.toLowerCase() ? 'manual-review' : 'explicit-id',
      license: terms?.['License']?.value ?? null,
      usageTerms: terms?.['UsageTerms']?.value ?? null,
    };
  }),
};
await Bun.write(new URL('../../data/manifests/image-discovery.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
const report = `# M1 image discovery audit\n\nGallery revision **${revision}**; capture SHA-256 \`${result.captureSha256}\`.\nSource: [Yugipedia numbered DotR gallery](${gallery}). Discovery uses explicit row-local IDs, never gallery order or name keys. Original URLs come from file API metadata, never guessed filenames.\n\n- Discovered: ${entries.length}; unique mapped IDs: ${entries.length}/854.\n- Missing gallery IDs: ${audit.missingIds.join(', ') || 'none'}.\n- Missing source file metadata: ${unavailableFiles.join(', ') || 'none'}.\n- Duplicate IDs/files: none (parser rejects them).\n- Non-DotR/alternate filenames: none (parser rejects them).\n- Exact label differences: ${audit.nameMismatches.length}.\n\n| ID | Canonical name | Gallery name | Decision |\n| --- | --- | --- | --- |\n${audit.nameMismatches.map(item => `| ${String(item.cardId).padStart(3, '0')} | ${item.canonicalName} | ${item.galleryName} | ${item.canonicalName.toLowerCase() === item.galleryName.toLowerCase() ? 'Case only; same ID' : 'Manual identity review before use'} |`).join('\n')}\n\nEvery mapping and source dimension is in data/manifests/image-discovery.json. API metadata does not establish permission to redistribute game imagery; public availability, successful downloads, mapped identity and legal rights are separate. Download/decode failures and actual asset coverage are reported after acquisition. This report is a discovery audit, not a claim that every screenshot has been visually reviewed.\n`;
await Bun.write(new URL('../../docs/image-discovery-report.md', import.meta.url), report);
console.log(`Discovery complete: ${entries.length} entries, ${infoByFile.size} source files, ${audit.nameMismatches.length} name differences. No bulk image acquisition performed by discovery.`);
