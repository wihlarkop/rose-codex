import { describe, expect, test } from 'bun:test';
import { parseGallery, auditMappings } from '../scripts/images/mapping';

const row = (id: string, name = 'Baby Dragon', file = 'BabyDragon-DOR-EN-VG.png') =>
  `${file} | {{pound}}${id}<br />"[[${name} (DOR)|${name}]]"`;

describe('explicit DotR gallery mapping', () => {
  test('reads row-local IDs and labels rather than gallery order', () => {
    const entries = parseGallery(`<gallery>\n${row('021')}\n${row('000', 'Blue-Eyes White Dragon', 'BlueEyesWhiteDragon-DOR-EN-VG.png')}\n</gallery>`);
    expect(entries.map(e => e.cardId)).toEqual([0, 21]);
    expect(entries[1]!.galleryName).toBe('Baby Dragon');
  });
  test('handles unlinked exceptional card and punctuation', () => {
    const entries = parseGallery(`<gallery>\nSummonedLordExodia-DOR-EN-VG.png | {{pound}}671<br />"Summoned Lord Exodia"\n${row('042', "Harpie's Pet Dragon", 'HarpiesPetDragon-DOR-EN-VG.png')}\n</gallery>`);
    expect(entries.map(e => e.galleryName)).toEqual(["Harpie's Pet Dragon", 'Summoned Lord Exodia']);
  });
  test.each([
    `<gallery>\n${row('021')}\n${row('021')}\n</gallery>`,
    `<gallery>\n${row('854')}\n</gallery>`,
    '<gallery>\nBabyDragon-DOR-EN-VG.png | "Baby Dragon"\n</gallery>',
    `<gallery>\n${row('021', 'Baby Dragon', 'BabyDragon-TCG.jpg')}\n</gallery>`,
  ])('rejects ambiguous, missing-ID or non-DotR mappings', text => {
    expect(() => parseGallery(text)).toThrow();
  });
  test('reports omissions and name discrepancies without remapping by name', () => {
    const entries = parseGallery(`<gallery>\n${row('021', 'Wrong Name')}\n</gallery>`);
    const audit = auditMappings(entries, [{ id: 0, name: 'Blue-Eyes White Dragon' }, { id: 21, name: 'Baby Dragon' }]);
    expect(audit.missingIds).toEqual([0]);
    expect(audit.nameMismatches.map(e => e.cardId)).toEqual([21]);
    expect(entries[0]!.cardId).toBe(21);
  });
});
