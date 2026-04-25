import { describe, expect, it } from 'vitest';
import { formatName, splitName } from './names';

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
