import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = Array.from(new Bun.Glob('src/**/*.svelte').scanSync({ cwd: root }));
if (files.length === 0) {
  console.log('Svelte integration configured; no interactive islands in M0.');
} else {
  const process = Bun.spawn(
    ['bun', '--bun', 'svelte-check', '--tsconfig', './tsconfig.json', '--fail-on-warnings'],
    { cwd: root, stdout: 'inherit', stderr: 'inherit' },
  );
  const result = await process.exited;
  if (result !== 0) throw new Error(`Svelte check failed (${result})`);
}
