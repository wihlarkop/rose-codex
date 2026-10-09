/** Read-only PS2 memory-card image inspector.
 * Filesystem geometry / FAT / directory entries are based on Ross Ridge's
 * public-domain PS2 Memory Card File System notes (linked below). This is an
 * independent implementation; it does not decode individual game-save bytes.
 *
 * https://github.com/PCSX2/pcsx2/blob/master/pcsx2/Reference/PS2-MemoryCardFileSystem.htm
 */
export const PS2_MEMCARD_RESEARCH = {
  pcsx2: 'https://pcsx2.net/docs/configuration/memcards/',
  format: 'https://github.com/PCSX2/pcsx2/blob/master/pcsx2/Reference/PS2-MemoryCardFileSystem.htm',
  dotrSave: 'https://www.speedrun.com/yugiohdotr/resources/46vto',
} as const;

export const MAX_MEMCARD_BYTES = 70 * 1024 * 1024;
const MAGIC = 'Sony PS2 Memory Card Format ';
const MAX_DIRECTORY_ENTRIES = 256;
const MAX_DOTR_DIRECTORIES = 4;
const MAX_DOTR_CHILDREN = 96;
const MAX_PREFIX_BYTES = 24;

export interface Ps2SaveEntry {
  name: string;
  type: 'directory' | 'file';
  length: number;
  possibleDotr: boolean;
}
/** Bounded, unmodified PS2 filesystem metadata. No DotR field is decoded. */
export interface Ps2NestedEntry {
  name: string;
  type: 'directory' | 'file';
  length: number;
  /** First 24 unmodified bytes, from the file's first data cluster only. */
  prefixHex: string | null;
  warning: string | null;
}
export interface Ps2SaveFolder {
  name: string;
  declaredEntries: number;
  scannedEntries: number;
  truncated: boolean;
  entries: Ps2NestedEntry[];
  warning: string | null;
}
export interface Ps2ImageInspection {
  version: string;
  rawSize: number;
  logicalSize: number;
  pageSize: number;
  clusterSize: number;
  clusterCount: number;
  spareBytesPerPage: number;
  rootDirectoryEntries: number;
  scannedEntries: number;
  truncated: boolean;
  entries: Ps2SaveEntry[];
  /** Only root directories matching the NTSC-U name pattern are inspected. */
  saveFolders: Ps2SaveFolder[];
  warning: string | null;
}

function uint32(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.length) throw new Error('Truncated memory-card structure.');
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
}

function textBytes(bytes: Uint8Array): string {
  return new TextDecoder('ascii').decode(bytes).replace(/\0.*$/s, '').trim();
}

/** Memory-card content is supplied by the caller, never modified or uploaded.
 * The parser supports standard PCSX2 raw .ps2 images with or without per-page
 * 16-byte spare/ECC areas. Unsupported containers are rejected explicitly.
 * Root listing is bounded; corrupt FAT data produces a warning, not guessed files.
 */
export function inspectPs2MemoryCard(bytes: Uint8Array): Ps2ImageInspection {
  if (bytes.byteLength < 0x200 || bytes.byteLength > MAX_MEMCARD_BYTES)
    throw new Error('Unsupported file size (maximum 70 MiB). Select a PCSX2 .ps2 file memory card.');
  for (let index = 0; index < MAGIC.length; index++) {
    if (bytes[index] !== MAGIC.charCodeAt(index))
      throw new Error('PS2 memory-card signature not found. Select a PCSX2 .ps2 file memory card.');
  }
  const pageSize = bytes[0x28]! | bytes[0x29]! << 8;
  const pagesPerCluster = bytes[0x2a]! | bytes[0x2b]! << 8;
  const pagesPerBlock = bytes[0x2c]! | bytes[0x2d]! << 8;
  const clusterCount = uint32(bytes, 0x30);
  const allocationOffset = uint32(bytes, 0x34);
  const allocationEnd = uint32(bytes, 0x38);
  const rootCluster = uint32(bytes, 0x3c);
  const cardType = bytes[0x150];
  if (cardType !== 2 || ![512, 1024].includes(pageSize)
    || (pageSize === 1024 ? pagesPerCluster !== 1 : ![1, 2].includes(pagesPerCluster))
    || pagesPerBlock < 1 || pagesPerBlock > 16 || clusterCount < 1
    || allocationEnd < 1 || allocationOffset >= clusterCount
    || allocationOffset + allocationEnd > clusterCount || rootCluster !== 0)
    throw new Error('Unsupported or invalid PS2 memory-card filesystem geometry.');

  const totalPages = clusterCount * pagesPerCluster;
  const logicalSize = totalPages * pageSize;
  const spareBytesPerPage = bytes.byteLength === logicalSize
    ? 0 : bytes.byteLength === totalPages * (pageSize + 16) ? 16 : -1;
  if (spareBytesPerPage < 0)
    throw new Error('File size disagrees with its PS2 memory-card geometry. Unsupported image/container.');

  const version = textBytes(bytes.subarray(0x1c, 0x28)) || 'Unknown';
  const clusterSize = pageSize * pagesPerCluster;
  const pageStride = pageSize + spareBytesPerPage;
  const readCluster = (absoluteCluster: number): Uint8Array => {
    if (!Number.isSafeInteger(absoluteCluster) || absoluteCluster < 0 || absoluteCluster >= clusterCount)
      throw new Error('Filesystem points outside the memory-card image.');
    const result = new Uint8Array(clusterSize);
    for (let page = 0; page < pagesPerCluster; page++) {
      const start = (absoluteCluster * pagesPerCluster + page) * pageStride;
      const chunk = bytes.subarray(start, start + pageSize);
      if (chunk.byteLength !== pageSize) throw new Error('Truncated memory-card page.');
      result.set(chunk, page * pageSize);
    }
    return result;
  };
  const entriesPerFatCluster = clusterSize / 4;
  const readFat = (relativeCluster: number): number => {
    if (!Number.isSafeInteger(relativeCluster) || relativeCluster < 0 || relativeCluster >= allocationEnd)
      throw new Error('Invalid FAT allocation index.');
    const fatClusterIndex = Math.floor(relativeCluster / entriesPerFatCluster);
    const ifcIndex = Math.floor(fatClusterIndex / entriesPerFatCluster);
    if (ifcIndex >= 32) throw new Error('Unsupported FAT size.');
    const indirectCluster = uint32(bytes, 0x50 + 4 * ifcIndex);
    const indirect = readCluster(indirectCluster);
    const fatCluster = uint32(indirect, (fatClusterIndex % entriesPerFatCluster) * 4);
    const fatData = readCluster(fatCluster);
    return uint32(fatData, (relativeCluster % entriesPerFatCluster) * 4);
  };

  const entries: Ps2SaveEntry[] = [];
  const matchingDirectories: Array<{ name: string; cluster: number; length: number }> = [];
  let rootDirectoryEntries = 0;
  let scannedEntries = 0;
  let truncated = false;
  let warning: string | null = null;
  try {
    const root = readCluster(allocationOffset + rootCluster);
    rootDirectoryEntries = uint32(root, 4);
    if (rootDirectoryEntries < 2) throw new Error('Root directory has an invalid entry count.');
    const scanLimit = Math.min(rootDirectoryEntries, MAX_DIRECTORY_ENTRIES);
    truncated = rootDirectoryEntries > scanLimit;
    const visited = new Set<number>();
    let relativeCluster = rootCluster;
    const entriesPerCluster = clusterSize / 512;

    while (scannedEntries < scanLimit) {
      if (visited.has(relativeCluster)) throw new Error('Circular directory FAT chain detected.');
      visited.add(relativeCluster);
      const cluster = readCluster(allocationOffset + relativeCluster);
      for (let i = 0; i < entriesPerCluster && scannedEntries < scanLimit; i++) {
        const start = i * 512;
        const mode = cluster[start]! | cluster[start + 1]! << 8;
        const length = uint32(cluster, start + 4);
        const name = textBytes(cluster.subarray(start + 0x40, start + 0x60));
        if (scannedEntries >= 2 && (mode & 0x8000) !== 0 && name && name !== '.' && name !== '..') {
          const isDir = (mode & 0x20) !== 0;
          const possibleDotr = /SLUS[-_]?20515/i.test(name);
          entries.push({
            name,
            type: isDir ? 'directory' : 'file',
            length,
            possibleDotr,
          });
          if (isDir && possibleDotr && matchingDirectories.length < MAX_DOTR_DIRECTORIES) {
            matchingDirectories.push({ name, cluster: uint32(cluster, start + 0x10), length });
          }
        }
        scannedEntries++;
      }
      if (scannedEntries < scanLimit) {
        const next = readFat(relativeCluster);
        if (next === 0xffffffff || (next & 0x80000000) === 0)
          throw new Error('Directory FAT chain ends before the reported entry count.');
        relativeCluster = next & 0x7fffffff;
      }
    }
  } catch (error) {
    warning = error instanceof Error ? error.message : 'Could not inspect root directory.';
  }
  // Inspect only identified DotR directories. All traversals have local limits,
  // checked relative allocation indices and cycle guards; other save folders
  // and their file bytes are never opened.
  const saveFolders: Ps2SaveFolder[] = matchingDirectories.map(folder => {
    const result: Ps2SaveFolder = {
      name: folder.name,
      declaredEntries: folder.length,
      scannedEntries: 0,
      truncated: folder.length > MAX_DOTR_CHILDREN,
      entries: [],
      warning: null,
    };
    try {
      if (folder.length < 2) throw new Error('Directory has an invalid entry count.');
      let relative = folder.cluster;
      const seen = new Set<number>();
      const limit = Math.min(folder.length, MAX_DOTR_CHILDREN);
      while (result.scannedEntries < limit) {
        if (!Number.isSafeInteger(relative) || relative < 0 || relative >= allocationEnd)
          throw new Error('Directory points outside allocated memory-card space.');
        if (seen.has(relative)) throw new Error('Circular directory FAT chain detected.');
        seen.add(relative);
        const block = readCluster(allocationOffset + relative);
        for (let index = 0; index < clusterSize / 512 && result.scannedEntries < limit; index++) {
          const offset = index * 512;
          const mode = block[offset]! | block[offset + 1]! << 8;
          const length = uint32(block, offset + 4);
          const name = textBytes(block.subarray(offset + 0x40, offset + 0x60));
          const active = (mode & 0x8000) !== 0;
          const isDir = (mode & 0x20) !== 0;
          const isFile = (mode & 0x10) !== 0;
          if (result.scannedEntries >= 2 && active && name && name !== '.' && name !== '..'
              && (isDir || isFile)) {
            let prefixHex: string | null = null;
            let childWarning: string | null = null;
            if (isFile && length > 0) {
              try {
                const firstCluster = uint32(block, offset + 0x10);
                if (firstCluster >= allocationEnd) throw new Error('File start cluster is outside allocatable space.');
                const data = readCluster(allocationOffset + firstCluster);
                prefixHex = Array.from(data.subarray(0, Math.min(length, MAX_PREFIX_BYTES)),
                  byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
              } catch (problem) {
                childWarning = problem instanceof Error ? problem.message : 'File preview not readable.';
              }
            }
            result.entries.push({ name, type: isDir ? 'directory' : 'file',
              length, prefixHex, warning: childWarning });
          }
          result.scannedEntries++;
        }
        if (result.scannedEntries < limit) {
          const next = readFat(relative);
          if (next === 0xffffffff || (next & 0x80000000) === 0)
            throw new Error('Directory FAT chain ends before the reported entry count.');
          relative = next & 0x7fffffff;
        }
      }
    } catch (problem) {
      result.warning = problem instanceof Error ? problem.message : 'Unable to inspect save directory.';
    }
    return result;
  });

  return {
    version, rawSize: bytes.byteLength, logicalSize, pageSize, clusterSize,
    clusterCount, spareBytesPerPage, rootDirectoryEntries, scannedEntries,
    truncated, entries, saveFolders, warning,
  };
}
