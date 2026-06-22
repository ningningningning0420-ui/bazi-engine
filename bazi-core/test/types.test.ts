import { describe, expect, test } from 'vitest';
import { BirthInputSchema, type BirthInput } from '../src/types';

describe('BirthInput schema', () => {
  test('合法输入通过', () => {
    const ok: BirthInput = { year: 1990, month: 3, day: 15, hour: 8, hourUnknown: false, gender: '乾' };
    expect(BirthInputSchema.parse(ok)).toEqual(ok);
  });
  test('hour=null + hourUnknown=true 合法', () => {
    const ok: BirthInput = { year: 1990, month: 3, day: 15, hour: null, hourUnknown: true, gender: '坤' };
    expect(() => BirthInputSchema.parse(ok)).not.toThrow();
  });
  test('月份越界被拒', () => {
    expect(() => BirthInputSchema.parse({ year: 1990, month: 13, day: 1, hour: 0, hourUnknown: false, gender: '乾' })).toThrow();
  });
  test('hourUnknown=false 但 hour=null 被拒', () => {
    expect(() => BirthInputSchema.parse({ year: 1990, month: 3, day: 15, hour: null, hourUnknown: false, gender: '乾' })).toThrow();
  });
});
