const paths = [
  'src/features/decks/DeckSimulator.svelte',
  'src/features/fusion/FusionAdvisor.svelte',
  'src/features/fusion/FusionWorkspace.svelte',
];
for (const path of paths) {
  const content = await Bun.file(path).text();
  console.log('FORMATTED_FILE:' + path);
  for (let offset = 0; offset < content.length; offset += 1000)
    console.log(JSON.stringify(content.slice(offset, offset + 1000)));
  console.log('END_FORMATTED_FILE');
}
