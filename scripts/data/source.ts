import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import manifest from '../../data/manifests/sources.json';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
export const sources = manifest.files;

export function verifySource(bytes: Uint8Array, sha256: string, file: string): void {
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== sha256) throw new Error(`Source hash mismatch: ${file}; expected ${sha256}, received ${digest}`);
}

export async function readSource(file: string): Promise<string> {
  const entry = sources.find(item => item.file === file);
  if (!entry) throw new Error(`Undeclared source: ${file}`);
  const path = new URL(`../../data/raw/${file}`, import.meta.url);
  if (!await Bun.file(path).exists()) throw new Error(`Missing ${file}. Run bun run data:fetch first.`);
  const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
  verifySource(bytes, entry.sha256, file);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function sourceUrl(path: string): string {
  return `https://raw.githubusercontent.com/Eenkin/dotr-fusion-simulator/${manifest.reference.commit}/${path}`;
}
