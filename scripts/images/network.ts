const userAgent = 'RoseCodex/0.1 (DotR image research; https://github.com/wihlarkop/rose-codex)';
export const pause = (milliseconds = 400) => Bun.sleep(milliseconds);

// Sequential caller, bounded retry, explicit failure. Never work around access
// challenges or issue unbounded requests. Redirects are ordinary public API ones.
export async function publicFetch(url: string): Promise<Response> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !['yugipedia.com', 'ms.yugipedia.com'].includes(parsed.hostname)) throw new Error(`Unapproved source host: ${url}`);
  for (let attempt = 0; attempt < 3; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      if (attempt === 2) throw error;
      await pause(1000 * 2 ** attempt);
      continue;
    }
    if (response.ok) return response;
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      const retry = response.headers.get('retry-after');
      const seconds = retry && /^\d+$/.test(retry) ? Math.min(Number(retry), 30) : 2 ** (attempt + 1);
      await response.body?.cancel();
      await pause(seconds * 1000);
    } else throw new Error(`Source returned HTTP ${response.status}: ${url}`);
  }
  throw new Error(`Source attempts exhausted: ${url}`);
}

export function wikiUrl(parameters: Record<string, string>): string {
  return `https://yugipedia.com/api.php?${new URLSearchParams({ ...parameters, format: 'json' })}`;
}
export const digest = (bytes: Uint8Array | string) => new Bun.CryptoHasher('sha256').update(bytes).digest('hex');
