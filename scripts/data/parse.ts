// Parse reference literals as data. Never import, eval, or execute fetched JS.
export function extractJsonLiteral(source: string, name: string): unknown {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) throw new Error('Invalid literal name');
  const declaration = new RegExp(`^const ${name}\\s*=\\s*`, 'm').exec(source);
  if (!declaration) throw new Error(`Missing source literal: ${name}`);
  const start = declaration.index + declaration[0].length;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  let literal = '';
  for (let i = start; i < source.length; i++) {
    const char = source[i]!;
    if (!quoted && char === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      literal += '\n';
      continue;
    }
    literal += char;
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else {
      if (char === '"') quoted = true;
      else if (char === '[' || char === '{') depth++;
      else if (char === ']' || char === '}') depth--;
      if (depth === 0) return JSON.parse(literal) as unknown;
    }
  }
  throw new Error(`Unterminated source literal: ${name}`);
}
