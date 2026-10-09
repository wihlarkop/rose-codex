import { expect, test } from 'bun:test';
import { inspectPs2MemoryCard } from '../src/lib/dotr/ps2-memcard';
import { compareDotrMemoryCards } from '../src/lib/dotr/ps2-save-diff';

function createCard(ecc = false, cycle = false, corruptChild = false): Uint8Array {
  const stride = ecc ? 528 : 512;
  const image = new Uint8Array(16384 * stride);
  const at = (cluster: number, offset: number) =>
    (cluster * 2 + Math.floor(offset / 512)) * stride + (offset % 512);
  const u16 = (cluster: number, offset: number, n: number) => {
    new DataView(image.buffer).setUint16(at(cluster, offset), n, true);
  };
  const u32 = (cluster: number, offset: number, n: number) => {
    new DataView(image.buffer).setUint32(at(cluster, offset), n, true);
  };
  const ascii = (cluster: number, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) image[at(cluster, offset + i)] = str.charCodeAt(i);
  };
  ascii(0, 0, 'Sony PS2 Memory Card Format ');
  ascii(0, 0x1c, '1.2.0.0');
  u16(0, 0x28, 512);
  u16(0, 0x2a, 2);
  u16(0, 0x2c, 16);
  u32(0, 0x30, 8192);
  u32(0, 0x34, 41);
  u32(0, 0x38, 8135);
  u32(0, 0x3c, 0);
  image[at(0, 0x150)] = 2;
  u32(0, 0x50, 8);
  u32(8, 0, 9);
  u32(9, 0, cycle ? 0x80000000 : 0x80000001);
  u32(9, 4, 0xffffffff);
  u32(9, 8, corruptChild ? 0x80000002 : 0x80000003);
  u32(9, 12, 0xffffffff);
  u32(9, 16, 0xffffffff);
  u16(41, 0, 0x8020);
  u32(41, 4, 3);
  ascii(41, 0x40, '.');
  u16(41, 512, 0x8020);
  ascii(41, 512 + 0x40, '..');
  u16(42, 0, 0x8020);
  u32(42, 4, 4);
  ascii(42, 0x40, 'BASLUS-20515');
  u32(42, 0x10, 2);
  u16(43, 0, 0x8020);
  u32(43, 4, 4);
  ascii(43, 0x40, '.');
  u16(43, 512, 0x8020);
  ascii(43, 512 + 0x40, '..');
  u16(44, 0, 0x8010);
  u32(44, 4, 12);
  u32(44, 0x10, 4);
  ascii(44, 0x40, 'SAVE.DAT');
  u16(44, 512, 0x8010);
  u32(44, 512 + 4, 0);
  u32(44, 512 + 0x10, 0xffffffff);
  ascii(44, 512 + 0x40, 'icon.sys');
  ascii(45, 0, 'DOTRHEADER01');
  return image;
}

test('inspects a valid 8 MiB card and its root folder without mutating the bytes', () => {
  const bytes = createCard();
  const first = bytes.slice(0, 1024);
  const result = inspectPs2MemoryCard(bytes);
  expect(result.warning).toBeNull();
  expect(result.logicalSize).toBe(8388608);
  expect(result.rootDirectoryEntries).toBe(3);
  expect(result.entries).toEqual([{
    name: 'BASLUS-20515', type: 'directory', length: 4, possibleDotr: true,
  }]);
  expect(result.saveFolders[0]?.name).toBe('BASLUS-20515');
  expect(result.saveFolders[0]?.warning).toBeNull();
  expect(result.saveFolders[0]?.entries).toHaveLength(2);
  expect(result.saveFolders[0]?.entries[0]).toEqual({
    name: 'SAVE.DAT', type: 'file', length: 12,
    prefixHex: '44 4F 54 52 48 45 41 44 45 52 30 31', warning: null,
  });
  expect(result.saveFolders[0]?.entries[1]?.prefixHex).toBeNull();
  expect(bytes.subarray(0, 1024)).toEqual(first);
});

test('handles per-page spare areas', () => {
  const result = inspectPs2MemoryCard(createCard(true));
  expect(result.spareBytesPerPage).toBe(16);
  expect(result.entries[0]?.possibleDotr).toBe(true);
  expect(result.saveFolders[0]?.entries[0]?.prefixHex?.startsWith('44 4F 54 52')).toBe(true);
});

test('rejects wrong signatures and detects a circular FAT rather than inventing files', () => {
  expect(() => inspectPs2MemoryCard(new Uint8Array(1024))).toThrow(/signature/);
  const result = inspectPs2MemoryCard(createCard(false, true));
  expect(result.warning).toMatch(/Circular/);
  expect(result.entries).toHaveLength(0);
  expect(result.saveFolders).toHaveLength(0);
});

test('nested directory FAT cycles are bounded and produce a scoped warning', () => {
  const result = inspectPs2MemoryCard(createCard(false, false, true));
  expect(result.warning).toBeNull();
  expect(result.saveFolders).toHaveLength(1);
  expect(result.saveFolders[0]?.warning).toMatch(/Circular/);
  expect(result.saveFolders[0]?.entries).toHaveLength(0);
});

test('controlled copies compare equal and report a single changed byte offset', () => {
  const before = createCard();
  const after = before.slice();
  expect(compareDotrMemoryCards(before, after).files).toEqual([{
    path: 'BASLUS-20515/SAVE.DAT',
    status: 'unchanged',
    beforeBytes: 12, afterBytes: 12,
    changedBytes: 0, changedRanges: [], totalRanges: 0, warning: null,
  }, {
    path: 'BASLUS-20515/icon.sys',
    status: 'unchanged',
    beforeBytes: 0, afterBytes: 0,
    changedBytes: 0, changedRanges: [], totalRanges: 0, warning: null,
  }]);
  after[45 * 1024 + 3] = 0x23;
  const result = compareDotrMemoryCards(before, after);
  expect(result.changedFiles).toBe(1);
  const entry = result.files.find(file => file.path.endsWith('SAVE.DAT'));
  expect(entry?.status).toBe('changed');
  expect(entry?.changedBytes).toBe(1);
  expect(entry?.changedRanges).toEqual([{ start: 3, endExclusive: 4 }]);
  expect(before[45 * 1024 + 3]).toBe(0x52);
});

test('byte differences are computed across file FAT clusters, not raw card offsets', () => {
  const before = createCard();
  const view = new DataView(before.buffer);
  view.setUint32(44 * 1024 + 4, 1500, true); // declared file length
  view.setUint32(9 * 1024 + 16, 0x80000005, true); // file cluster 4 -> 5
  view.setUint32(9 * 1024 + 20, 0xffffffff, true);
  const after = before.slice();
  after[46 * 1024 + 100] = 0xab; // file offset 1024 + 100
  const result = compareDotrMemoryCards(before, after);
  const entry = result.files.find(file => file.path.endsWith('SAVE.DAT'));
  expect(entry?.status).toBe('changed');
  expect(entry?.changedBytes).toBe(1);
  expect(entry?.changedRanges).toEqual([{ start: 1124, endExclusive: 1125 }]);
});

test('invalid file FAT chains are not presented as verified changes', () => {
  const before = createCard();
  const view = new DataView(before.buffer);
  view.setUint32(44 * 1024 + 4, 1500, true);
  view.setUint32(9 * 1024 + 16, 0x80000004, true); // self loop
  const after = before.slice();
  after[45 * 1024 + 10] ^= 1;
  const diff = compareDotrMemoryCards(before, after);
  expect(diff.files.find(file => file.path.endsWith('SAVE.DAT'))?.status).toBe('unreadable');
  expect(diff.files.find(file => file.path.endsWith('SAVE.DAT'))?.warning).toMatch(/cycle/i);
});
