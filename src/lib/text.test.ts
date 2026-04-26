import { describe, expect, it } from 'vitest';
import { capitalizeFirst } from './text';

describe('capitalizeFirst', () => {
  it('returns empty string for nullish or empty input', () => {
    expect(capitalizeFirst(null)).toBe('');
    expect(capitalizeFirst(undefined)).toBe('');
    expect(capitalizeFirst('')).toBe('');
  });

  it('capitalizes the first letter of a plain string', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
  });

  it('preserves the rest of the original casing', () => {
    expect(capitalizeFirst('hello WORLD')).toBe('Hello WORLD');
  });

  it('is idempotent on already-capitalized text', () => {
    expect(capitalizeFirst('Hello')).toBe('Hello');
  });

  it('skips leading whitespace', () => {
    expect(capitalizeFirst('  hello')).toBe('  Hello');
    expect(capitalizeFirst('\nhello')).toBe('\nHello');
  });

  it('skips leading punctuation', () => {
    expect(capitalizeFirst('!!hello')).toBe('!!Hello');
    expect(capitalizeFirst('"hello"')).toBe('"Hello"');
  });

  it('skips leading digits and capitalizes the first letter found', () => {
    expect(capitalizeFirst('42 things')).toBe('42 Things');
  });

  it('returns the input unchanged when no letter is present', () => {
    expect(capitalizeFirst('123 !!!')).toBe('123 !!!');
    expect(capitalizeFirst('   ')).toBe('   ');
  });

  it('handles unicode letters', () => {
    expect(capitalizeFirst('élise')).toBe('Élise');
  });
});
