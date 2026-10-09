import { expect, test } from 'bun:test';
import { inspectPs2MemoryCard } from '../src/lib/dotr/ps2-memcard';

function createCard(ecc = false, cycle = false): Uint8Array {
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
  u16(41, 0, 0x8020);
  u32(41, 4, 3);
  ascii(41, 0x40, '.');
  u16(41, 512, 0x8020);
  ascii(41, 512 + 0x40, '..');
  u16(42, 0, 0x8020);
  u32(42, 4, 4);
  ascii(42, 0x40, 'BASLUS-20515');
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
  expect(bytes.subarray(0, 1024)).toEqual(first);
});

test('handles per-page spare areas', () => {
  const result = inspectPs2MemoryCard(createCard(true));
  expect(result.spareBytesPerPage).toBe(16);
  expect(result.entries[0]?.possibleDotr).toBe(true);
});

test('rejects wrong signatures and detects a circular FAT rather than inventing files', () => {
  expect(() => inspectPs2MemoryCard(new Uint8Array(1024))).toThrow(/signature/);
  const result = inspectPs2MemoryCard(createCard(false, true));
  expect(result.warning).toMatch(/Circular/);
  expect(result.entries).toHaveLength(0);
});
