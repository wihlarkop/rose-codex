import discovery from '../../data/manifests/image-discovery.json';
import overrides from '../../data/manifests/image-overrides.json';

type Entry = typeof discovery.entries[number];
export function imageSources(): Entry[] {
  const entries = discovery.entries.map(entry => ({ ...entry }));
  const seen = new Set<number>();
  for (const override of overrides) {
    const entry = entries[override.cardId];
    const url = new URL(override.source);
    const page = new URL(override.sourcePage);
    if (!entry || seen.has(override.cardId) || override.sourcePageNumber !== override.cardId ||
        override.canonicalName !== entry.canonicalName || !override.note.trim() ||
        url.protocol !== 'https:' || url.hostname !== 'ms.yugipedia.com' ||
        page.protocol !== 'https:' || page.hostname !== 'yugipedia.com' ||
        decodeURIComponent(url.pathname.split('/').at(-1)!) !== override.filename ||
        !/-DOR-(EN|NA)-VG\.png$/.test(override.filename) ||
        ![override.width, override.height, override.sourceBytes].every(value => Number.isInteger(value) && value > 0)) {
      throw new Error(`Invalid reviewed image override ${override.cardId}`);
    }
    seen.add(override.cardId);
    entries[override.cardId] = { ...entry, ...override, mapping: 'manual-review', sourceKind: 'dotr-game-render' };
  }
  return entries;
}
