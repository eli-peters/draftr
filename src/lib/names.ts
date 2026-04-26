export type NameContext = 'list' | 'detail' | 'card';

const NAME_PARTICLES = new Set([
  'van',
  'de',
  'der',
  'den',
  'von',
  'del',
  'della',
  'di',
  'du',
  'la',
  'le',
]);

function capitalizeAt(value: string, index: number): string {
  if (index < 0 || index >= value.length) return value;
  return value.slice(0, index) + value.charAt(index).toUpperCase() + value.slice(index + 1);
}

function normalizeToken(token: string, isFirst: boolean): string {
  if (!token) return token;

  const lower = token.toLowerCase();

  if (!isFirst && NAME_PARTICLES.has(lower)) {
    return lower;
  }

  let result = lower.charAt(0).toUpperCase() + lower.slice(1);

  if (result.length >= 5 && result.slice(0, 3).toLowerCase() === 'mac') {
    result = capitalizeAt(result, 3);
  } else if (result.length >= 3 && result.slice(0, 2).toLowerCase() === 'mc') {
    result = capitalizeAt(result, 2);
  }

  for (let i = 0; i < result.length - 1; i++) {
    const ch = result.charAt(i);
    if (ch === "'" || ch === '-') {
      result = capitalizeAt(result, i + 1);
    }
  }

  return result;
}

export function normalizeName(input: string | null | undefined): string {
  const collapsed = (input ?? '').replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';

  const tokens = collapsed.split(' ');
  return tokens.map((token, index) => normalizeToken(token, index === 0)).join(' ');
}

export interface SplitName {
  first: string;
  last: string;
  initial: string;
}

export function splitName(full: string | null | undefined): SplitName {
  const normalized = (full ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return { first: '', last: '', initial: '' };

  const tokens = normalized.split(' ');
  if (tokens.length === 1) {
    return { first: tokens[0], last: '', initial: '' };
  }

  const first = tokens[0];
  const last = tokens.slice(1).join(' ');
  const lastToken = tokens[tokens.length - 1];
  const initial = lastToken.charAt(0).toUpperCase();
  return { first, last, initial };
}

export interface FormatNameOptions {
  context?: NameContext;
  siblings?: readonly (string | null | undefined)[];
}

export function formatName(full: string | null | undefined, opts: FormatNameOptions = {}): string {
  const { context = 'list', siblings } = opts;
  const parts = splitName(full);
  if (!parts.first) return '';

  if (context === 'detail') {
    return [parts.first, parts.last].filter(Boolean).join(' ');
  }

  if (!parts.last) return parts.first;

  if (siblings && siblings.length > 0) {
    const shortForm = `${parts.first} ${parts.initial}.`;
    const collision = siblings.some((sibling) => {
      const other = splitName(sibling);
      if (!other.first || !other.last) return false;
      if (other.first === parts.first && other.last === parts.last) return false;
      return `${other.first} ${other.initial}.` === shortForm;
    });
    if (collision) return `${parts.first} ${parts.last}`;
  }

  return `${parts.first} ${parts.initial}.`;
}
