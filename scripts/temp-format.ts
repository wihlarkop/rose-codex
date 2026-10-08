const paths = [
  'src/features/decks/CollectionWorkspace.svelte',
  'src/features/fusion/FusionWorkspace.svelte',
];
for (const path of paths) {
  const content = await Bun.file(path).text();
  console.log('FORMATTED_FILE:' + path);
  for (let offset = 0; offset < content.length; offset += 1100)
    console.log(JSON.stringify(content.slice(offset, offset + 1100)));
  console.log('END_FORMATTED_FILE');
}
