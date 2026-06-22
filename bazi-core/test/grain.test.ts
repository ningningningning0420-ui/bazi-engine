import { describe, expect, test } from 'vitest';
import { selectGrain } from '../src/forecast/grain';

describe('selectGrain', () => {
  test('≥365天 → 大运+流年', () => {
    expect(selectGrain(400)).toEqual(['大运', '流年']);
    expect(selectGrain(365)).toEqual(['大运', '流年']);
  });
  test('30..365 → +流月', () => {
    expect(selectGrain(90)).toEqual(['大运', '流年', '流月']);
    expect(selectGrain(30)).toEqual(['大运', '流年', '流月']);
  });
  test('<30 → +流日', () => {
    expect(selectGrain(10)).toEqual(['大运', '流年', '流月', '流日']);
    expect(selectGrain(0)).toEqual(['大运', '流年', '流月', '流日']);
  });
  test('大运恒含 + 确定性', () => {
    for (const d of [5, 100, 1000]) expect(selectGrain(d)[0]).toBe('大运');
  });
});
