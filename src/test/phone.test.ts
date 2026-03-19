import { describe, it, expect } from 'vitest';
import {
  stripToDigits,
  toE164,
  isValidNAPhone,
  formatPhoneDisplay,
  formatPhoneLive,
} from '@/lib/phone';

describe('stripToDigits', () => {
  it('removes non-digit characters', () => {
    expect(stripToDigits('+1 (416) 555-1234')).toBe('14165551234');
    expect(stripToDigits('abc')).toBe('');
    expect(stripToDigits('')).toBe('');
  });
});

describe('toE164', () => {
  it('normalizes 10-digit input', () => {
    expect(toE164('4165551234')).toBe('+14165551234');
  });

  it('normalizes 11-digit input with leading 1', () => {
    expect(toE164('14165551234')).toBe('+14165551234');
  });

  it('normalizes formatted input', () => {
    expect(toE164('+1 (416) 555-1234')).toBe('+14165551234');
    expect(toE164('(416) 555-1234')).toBe('+14165551234');
    expect(toE164('416-555-1234')).toBe('+14165551234');
  });

  it('returns null for too few digits', () => {
    expect(toE164('416555')).toBeNull();
    expect(toE164('')).toBeNull();
  });

  it('returns null for too many digits', () => {
    expect(toE164('141655512345')).toBeNull();
  });

  it('returns null for 11 digits not starting with 1', () => {
    expect(toE164('24165551234')).toBeNull();
  });
});

describe('isValidNAPhone', () => {
  it('returns true for valid numbers', () => {
    expect(isValidNAPhone('4165551234')).toBe(true);
    expect(isValidNAPhone('+1 (416) 555-1234')).toBe(true);
  });

  it('returns false for invalid numbers', () => {
    expect(isValidNAPhone('123')).toBe(false);
    expect(isValidNAPhone('call my mom')).toBe(false);
  });
});

describe('formatPhoneDisplay', () => {
  it('formats E.164 for display', () => {
    expect(formatPhoneDisplay('+14165551234')).toBe('+1 416-555-1234');
  });

  it('formats 10-digit string', () => {
    expect(formatPhoneDisplay('4165551234')).toBe('+1 416-555-1234');
  });

  it('returns raw input if unparseable', () => {
    expect(formatPhoneDisplay('123')).toBe('123');
    expect(formatPhoneDisplay('call my mom')).toBe('call my mom');
  });
});

describe('formatPhoneLive', () => {
  it('returns empty for no digits', () => {
    expect(formatPhoneLive('')).toBe('');
  });

  it('formats 1-3 digits without separator', () => {
    expect(formatPhoneLive('4')).toBe('4');
    expect(formatPhoneLive('41')).toBe('41');
    expect(formatPhoneLive('416')).toBe('416');
  });

  it('formats 4-6 digits with first dash', () => {
    expect(formatPhoneLive('4165')).toBe('416-5');
    expect(formatPhoneLive('416555')).toBe('416-555');
  });

  it('formats 7-10 digits with second dash', () => {
    expect(formatPhoneLive('4165551')).toBe('416-555-1');
    expect(formatPhoneLive('4165551234')).toBe('416-555-1234');
  });

  it('caps at 10 digits', () => {
    expect(formatPhoneLive('41655512345')).toBe('416-555-1234');
  });
});
