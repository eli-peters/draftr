import { describe, expect, it } from 'vitest';
import { formatName, normalizeName, splitName } from './names';

describe('splitName', () => {
  it('returns empty parts for null/empty input', () => {
    expect(splitName(null)).toEqual({ first: '', last: '', initial: '' });
    expect(splitName('   ')).toEqual({ first: '', last: '', initial: '' });
  });

  it('handles a single token', () => {
    expect(splitName('Madonna')).toEqual({ first: 'Madonna', last: '', initial: '' });
  });

  it('handles two tokens', () => {
    expect(splitName('Sarah Miller')).toEqual({ first: 'Sarah', last: 'Miller', initial: 'M' });
  });

  it('uses the final token for the initial in three-token names', () => {
    expect(splitName('Mary Anne Smith')).toEqual({
      first: 'Mary',
      last: 'Anne Smith',
      initial: 'S',
    });
  });

  it('handles hyphenated last names', () => {
    expect(splitName('Sarah Miller-Jones')).toEqual({
      first: 'Sarah',
      last: 'Miller-Jones',
      initial: 'M',
    });
  });

  it('collapses extra whitespace', () => {
    expect(splitName('  Sarah   Miller  ')).toEqual({
      first: 'Sarah',
      last: 'Miller',
      initial: 'M',
    });
  });
});

describe('formatName', () => {
  it('returns empty string for missing input', () => {
    expect(formatName(null)).toBe('');
    expect(formatName('')).toBe('');
  });

  it('returns full name for detail context', () => {
    expect(formatName('Sarah Miller', { context: 'detail' })).toBe('Sarah Miller');
  });

  it('returns "First L." for list context by default', () => {
    expect(formatName('Sarah Miller')).toBe('Sarah M.');
    expect(formatName('Sarah Miller', { context: 'card' })).toBe('Sarah M.');
  });

  it('returns first name alone when no last name exists', () => {
    expect(formatName('Madonna')).toBe('Madonna');
  });

  it('disambiguates when siblings share first name + initial', () => {
    const siblings = ['Sarah Miller', 'Sarah Mitchell', 'Tom Brown'];
    expect(formatName('Sarah Miller', { siblings })).toBe('Sarah Miller');
    expect(formatName('Sarah Mitchell', { siblings })).toBe('Sarah Mitchell');
    expect(formatName('Tom Brown', { siblings })).toBe('Tom B.');
  });

  it('does not disambiguate when first initials differ', () => {
    const siblings = ['Sarah Miller', 'Sarah Brown'];
    expect(formatName('Sarah Miller', { siblings })).toBe('Sarah M.');
    expect(formatName('Sarah Brown', { siblings })).toBe('Sarah B.');
  });

  it('treats identical full names as the same person, no disambiguation', () => {
    const siblings = ['Sarah Miller', 'Sarah Miller'];
    expect(formatName('Sarah Miller', { siblings })).toBe('Sarah M.');
  });
});

describe('normalizeName', () => {
  it('returns empty string for nullish or whitespace-only input', () => {
    expect(normalizeName(null)).toBe('');
    expect(normalizeName(undefined)).toBe('');
    expect(normalizeName('')).toBe('');
    expect(normalizeName('   ')).toBe('');
  });

  it('title-cases plain lowercase tokens', () => {
    expect(normalizeName('john')).toBe('John');
    expect(normalizeName('john smith')).toBe('John Smith');
  });

  it('normalizes ALL CAPS and mixed case', () => {
    expect(normalizeName('JOHN')).toBe('John');
    expect(normalizeName('jOhN sMiTh')).toBe('John Smith');
  });

  it('capitalizes after Mc prefix', () => {
    expect(normalizeName('mcdonald')).toBe('McDonald');
    expect(normalizeName('MCDONALD')).toBe('McDonald');
  });

  it('does not over-apply Mc to short tokens', () => {
    expect(normalizeName('mc')).toBe('Mc');
  });

  it('capitalizes after Mac prefix for true Mac surnames', () => {
    expect(normalizeName('macdonald')).toBe('MacDonald');
    expect(normalizeName('MACDONALD')).toBe('MacDonald');
  });

  it('does not mangle short Mac-prefixed words', () => {
    expect(normalizeName('mac')).toBe('Mac');
    expect(normalizeName('mack')).toBe('Mack');
  });

  it('capitalizes after apostrophes', () => {
    expect(normalizeName("o'brien")).toBe("O'Brien");
    expect(normalizeName("d'arcy")).toBe("D'Arcy");
    expect(normalizeName("O'BRIEN")).toBe("O'Brien");
  });

  it('capitalizes after hyphens', () => {
    expect(normalizeName('smith-jones')).toBe('Smith-Jones');
    expect(normalizeName('SMITH-JONES')).toBe('Smith-Jones');
  });

  it('keeps particles lowercase when they are not the first token', () => {
    expect(normalizeName('ludwig van beethoven')).toBe('Ludwig van Beethoven');
    expect(normalizeName('johann von goethe')).toBe('Johann von Goethe');
  });

  it('capitalizes a particle when it is the first token (start of surname)', () => {
    expect(normalizeName('van dyke')).toBe('Van Dyke');
    expect(normalizeName('de souza')).toBe('De Souza');
  });

  it('handles compound names with multiple rules at once', () => {
    expect(normalizeName("O'BRIEN-MACDONALD")).toBe("O'Brien-Macdonald");
    expect(normalizeName("mary-jane o'connor")).toBe("Mary-Jane O'Connor");
  });

  it('collapses internal whitespace and trims edges', () => {
    expect(normalizeName('  john   smith  ')).toBe('John Smith');
  });
});
