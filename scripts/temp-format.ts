const path = 'src/features/fusion/FusionEncyclopedia.svelte';
const content = await Bun.file(path).text();
console.log('FORMATTED_FILE:' + path);
for (let offset = 0; offset < content.length; offset += 1000)
  console.log(JSON.stringify(content.slice(offset, offset + 1000)));
console.log('END_FORMATTED_FILE');
