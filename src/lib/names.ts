export type NameContext = 'list' | 'detail' | 'card';

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
