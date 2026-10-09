import { inspectPs2MemoryCard } from './ps2-memcard';

/** Filesystem-only snapshot comparisons. No claim that any offset represents
 * DotR inventory, deck, rank or story progress.
 * Based on the PS2 filesystem structure documented by Ross Ridge:
 * https://github.com/PCSX2/pcsx2/blob/master/pcsx2/Reference/PS2-MemoryCardFileSystem.htm
 */
export const MAX_COMPARE_FILE_BYTES = 2 * 1024 * 1024;
const MAX_COMPARE_TOTAL_BYTES = 6 * 1024 * 1024;
const MAX_COMPARE_DIRECTORY_ENTRIES = 96;
const MAX_COMPARE_ROOT_ENTRIES = 256;
const MAX_HUNKS = 16;

type DirectoryEntry = {
  name: string;
  type: 'file' | 'directory';
  size: number;
  cluster: number;
};

type Snapshot = {
  files: Map<string, Uint8Array>;
  skipped: Map<string, string>;
};

export interface ByteChangeRange {
  /** Byte offsets within the actual save *file*, not within the .ps2 card. */
  start: number;
  endExclusive: number;
}
export interface SaveFileComparison {
  path: string;
  status: 'changed' | 'unchanged' | 'added' | 'removed' | 'unreadable';
  beforeBytes: number | null;
  afterBytes: number | null;
  changedBytes: number | null;
  changedRanges: ByteChangeRange[];
  totalRanges: number;
  warning: string | null;
}
export interface SaveComparison {
  files: SaveFileComparison[];
  changedFiles: number;
  unchangedFiles: number;
  warnings: string[];
}

function word(data: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > data.length) throw new Error('Truncated directory or FAT data.');
  return new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
}

/** Reopen only the bounded, NTSC-U folder candidates already recognized by
 * the accepted v2 inspector; do not enumerate unrelated game payloads. */
function readSnapshot(image: Uint8Array): Snapshot {
  const overview = inspectPs2MemoryCard(image);
  if (overview.warning || overview.truncated)
    throw new Error('Incomplete memory-card root listing; comparison is unsafe.');
  if (overview.saveFolders.some(folder => folder.warning || folder.truncated))
    throw new Error('Incomplete DotR candidate directory; comparison is unsafe.');

  const pageSize = overview.pageSize;
  const clusterSize = overview.clusterSize;
  const pagesPerCluster = clusterSize / pageSize;
  const stride = pageSize + overview.spareBytesPerPage;
  const capacity = overview.clusterCount;
  const allocationOffset = word(image, 0x34);
  const allocationEnd = word(image, 0x38);
  const rootCluster = word(image, 0x3c);

  const readCluster = (absolute: number): Uint8Array => {
    if (!Number.isSafeInteger(absolute) || absolute < 0 || absolute >= capacity)
      throw new Error('Cluster is outside the image geometry.');
    const block = new Uint8Array(clusterSize);
    for (let page = 0; page < pagesPerCluster; page++) {
      const position = (absolute * pagesPerCluster + page) * stride;
      const data = image.subarray(position, position + pageSize);
      if (data.length !== pageSize) throw new Error('Truncated memory-card page.');
      block.set(data, page * pageSize);
    }
    return block;
  };
  const fatEntriesPerCluster = clusterSize / 4;
  const fat = (relative: number): number => {
    if (!Number.isSafeInteger(relative) || relative < 0 || relative >= allocationEnd)
      throw new Error('Invalid allocation index.');
    const index = Math.floor(relative / fatEntriesPerCluster);
    const indirectIndex = Math.floor(index / fatEntriesPerCluster);
    if (indirectIndex >= 32) throw new Error('Unsupported indirect FAT index.');
    const indirect = readCluster(word(image, 0x50 + indirectIndex * 4));
    const fatCluster = word(indirect, (index % fatEntriesPerCluster) * 4);
    const table = readCluster(fatCluster);
    return word(table, (relative % fatEntriesPerCluster) * 4);
  };

  const readDirectory = (start: number, length: number, limit: number): DirectoryEntry[] => {
    if (!Number.isSafeInteger(length) || length < 2 || length > limit)
      throw new Error('Directory size is invalid or exceeds safe comparison limits.');
    const found: DirectoryEntry[] = [];
    const visited = new Set<number>();
    let current = start;
    let seen = 0;
    while (seen < length) {
      if (!Number.isSafeInteger(current) || current < 0 || current >= allocationEnd)
        throw new Error('Directory cluster is outside the allocatable range.');
      if (visited.has(current)) throw new Error('Directory FAT cycle detected.');
      visited.add(current);
      const block = readCluster(allocationOffset + current);
      for (let i = 0; i < clusterSize / 512 && seen < length; i++, seen++) {
        const pos = i * 512;
        const mode = block[pos]! | block[pos + 1]! << 8;
        const fileType = (mode & 0x20) !== 0 ? 'directory' : 'file';
        const name = new TextDecoder('ascii')
          .decode(block.subarray(pos + 0x40, pos + 0x60)).replace(/\0.*$/s, '').trim();
        if (seen >= 2 && (mode & 0x8000) && (mode & 0x30) && name && name !== '.' && name !== '..')
          found.push({ name, type: fileType, size: word(block, pos + 4),
            cluster: word(block, pos + 0x10) });
      }
      if (seen < length) {
        const next = fat(current);
        if (next === 0xffffffff || (next & 0x80000000) === 0)
          throw new Error('Directory FAT chain ended early.');
        current = next & 0x7fffffff;
      }
    }
    return found;
  };

  const readFile = (entry: DirectoryEntry): Uint8Array => {
    if (entry.size > MAX_COMPARE_FILE_BYTES)
      throw new Error('File exceeds the 2 MiB per-file research limit.');
    if (!entry.size) return new Uint8Array(0);
    const content = new Uint8Array(entry.size);
    const seen = new Set<number>();
    let current = entry.cluster;
    let offset = 0;
    while (offset < entry.size) {
      if (!Number.isSafeInteger(current) || current < 0 || current >= allocationEnd)
        throw new Error('File cluster is outside the allocatable range.');
      if (seen.has(current)) throw new Error('File FAT cycle detected.');
      seen.add(current);
      const block = readCluster(allocationOffset + current);
      const length = Math.min(block.length, entry.size - offset);
      content.set(block.subarray(0, length), offset);
      offset += length;
      if (offset < entry.size) {
        const next = fat(current);
        if (next === 0xffffffff || (next & 0x80000000) === 0)
          throw new Error('File FAT chain ended before declared size.');
        current = next & 0x7fffffff;
      }
    }
    return content;
  };

  const files = new Map<string, Uint8Array>();
  const skipped = new Map<string, string>();
  const rootEntries = readDirectory(rootCluster, overview.rootDirectoryEntries, MAX_COMPARE_ROOT_ENTRIES);
  let total = 0;
  for (const root of rootEntries) {
    if (root.type !== 'directory' || !/SLUS[-_]?20515/i.test(root.name)) continue;
    const subEntries = readDirectory(root.cluster, root.size, MAX_COMPARE_DIRECTORY_ENTRIES);
    for (const entry of subEntries) {
      if (entry.type !== 'file') continue;
      const path = root.name + '/' + entry.name;
      if (files.has(path) || skipped.has(path))
        throw new Error('Duplicate save file name; refusing ambiguous comparison.');
      if (entry.size > MAX_COMPARE_FILE_BYTES || total + entry.size > MAX_COMPARE_TOTAL_BYTES) {
        skipped.set(path, 'Research size limit exceeded (2 MiB per file, 6 MiB total).');
        continue;
      }
      try {
        const data = readFile(entry);
        total += data.length;
        files.set(path, data);
      } catch (error) {
        skipped.set(path, error instanceof Error ? error.message : 'File is unreadable.');
      }
    }
  }
  return { files, skipped };
}

function differences(path: string, before: Uint8Array, after: Uint8Array): SaveFileComparison {
  const overlap = Math.min(before.length, after.length);
  const ranges: ByteChangeRange[] = [];
  let totalRanges = 0;
  let changedBytes = Math.abs(before.length - after.length);
  let open = false;
  for (let i = 0; i < overlap; i++) {
    const changed = before[i] !== after[i];
    if (changed) {
      changedBytes++;
      if (!open) {
        totalRanges++;
        if (ranges.length < MAX_HUNKS) ranges.push({ start: i, endExclusive: i + 1 });
      } else if (totalRanges <= MAX_HUNKS) {
        ranges[ranges.length - 1]!.endExclusive = i + 1;
      }
    }
    open = changed;
  }
  if (before.length !== after.length) {
    if (!open) totalRanges++;
    if (totalRanges <= MAX_HUNKS) {
      if (open) ranges[ranges.length - 1]!.endExclusive = Math.max(before.length, after.length);
      else ranges.push({ start: overlap, endExclusive: Math.max(before.length, after.length) });
    }
  }
  return {
    path, status: changedBytes ? 'changed' : 'unchanged',
    beforeBytes: before.length, afterBytes: after.length, changedBytes,
    changedRanges: ranges, totalRanges, warning: null,
  };
}

export function compareDotrMemoryCards(before: Uint8Array, after: Uint8Array): SaveComparison {
  const old = readSnapshot(before);
  const next = readSnapshot(after);
  const paths = [...new Set([
    ...old.files.keys(), ...old.skipped.keys(),
    ...next.files.keys(), ...next.skipped.keys(),
  ])].sort();
  const files: SaveFileComparison[] = [];
  for (const path of paths) {
    const oldBytes = old.files.get(path);
    const newBytes = next.files.get(path);
    const problem = old.skipped.get(path) ?? next.skipped.get(path);
    if (problem) {
      files.push({ path, status: 'unreadable',
        beforeBytes: oldBytes?.length ?? null, afterBytes: newBytes?.length ?? null,
        changedBytes: null, changedRanges: [], totalRanges: 0, warning: problem });
    } else if (!oldBytes || !newBytes) {
      files.push({ path, status: oldBytes ? 'removed' : 'added',
        beforeBytes: oldBytes?.length ?? null, afterBytes: newBytes?.length ?? null,
        changedBytes: null, changedRanges: [], totalRanges: 0, warning: null });
    } else {
      files.push(differences(path, oldBytes, newBytes));
    }
  }
  return {
    files,
    changedFiles: files.filter(row => row.status !== 'unchanged').length,
    unchangedFiles: files.filter(row => row.status === 'unchanged').length,
    warnings: paths.length ? [] : ['No matching SLUS-20515 save files found in either image.'],
  };
}
