import { expect, test } from 'bun:test';
import { extractJsonLiteral } from '../scripts/data/parse';
import { normalizeCards } from '../scripts/data/normalize';

test('reads only a named JSON literal and respects brackets inside strings', () => {
  expect(extractJsonLiteral('const list = [{"name":"[x] \\\""}];\nthrow new Error();', 'list')).toEqual([{name:'[x] "'}]);
});
test('preserves DotR Power Up classification separately from monster attribute', () => {
  expect(normalizeCards([{id:752,name:'Legendary Sword',type:'Magic',attribute:'Power Up',dc:10}])[0]).toMatchObject({kind:'magic',magicClass:'power-up',attribute:null});
});
test('normalizes the documented repeated power-up relation for card 208', () => {
  const card = {id:208,name:'Battle Ox',type:'Beast-Warrior',attribute:'EARTH',lv:4,dc:25,atk:1700,def:1000,powerUp:'780, 780'};
  expect(normalizeCards([card])[0]?.powerUpCardIds).toEqual([780]);
  expect(()=>normalizeCards([{...card,id:0}])).toThrow();
});
test.each(['const list = [1,];', 'const list = [fetch("https://example.com")];', 'const list = [1;', 'const other = [1];'])('rejects non-JSON and incomplete sources without execution', source => {
  expect(() => extractJsonLiteral(source, 'list')).toThrow();
});
