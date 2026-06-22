import { describe, expect, test } from 'vitest';
import { computeChart } from '../src/compute-chart';
import { deriveTendency } from '../src/forecast/tendency';
import type { AtDate } from '../src/types';

const chart = computeChart({ year: 1990, month: 6, day: 15, hour: 10, hourUnknown: false, gender: '乾' });
const D = (year: number, month = 6, day = 15): AtDate => ({ year, month, day });
const 命理词 = /[木火土金水]|官杀|正官|七杀|财|印|食伤|比劫|劫财|伤官|食神|流年|大运|旺衰|用神|喜神|忌神|冲|刑|合|化/;

describe('deriveTendency', () => {
  test('产出 6 域倾向 + |net|降序 + 确定性', () => {
    const t = deriveTendency(chart, D(2025), ['大运', '流年']);
    expect(t.域倾向).toHaveLength(6);
    for (let i = 1; i < t.域倾向.length; i++) {
      expect(Math.abs(t.域倾向[i - 1]!.net)).toBeGreaterThanOrEqual(Math.abs(t.域倾向[i]!.net) - 1e-9);
    }
    expect(deriveTendency(chart, D(2025), ['大运', '流年'])).toEqual(deriveTendency(chart, D(2025), ['大运', '流年']));
  });
  test('★隐藏暗示命理-free(禁词扫描)', () => {
    for (const y of [2024, 2025, 2026]) {
      const t = deriveTendency(chart, D(y), ['大运', '流年', '流月']);
      expect(t.隐藏暗示).not.toMatch(命理词);
      expect(t.隐藏暗示.length).toBeGreaterThan(0);
    }
  });
  test('域倾向.依据(后台)可含命理·与隐藏暗示分寄存器', () => {
    const t = deriveTendency(chart, D(2025), ['大运', '流年']);
    expect(t.域倾向.some((d) => 命理词.test(d.依据))).toBe(true);
  });
  test('童限：大运吉凶倾向=未起运', () => {
    expect(deriveTendency(chart, D(1993), ['大运', '流年']).大运吉凶倾向).toBe('未起运');
  });
  test('起运边界净吉凶有限(前后年无 NaN)', () => {
    expect(Number.isFinite(deriveTendency(chart, D(1997), ['大运', '流年']).净吉凶)).toBe(true);
    expect(Number.isFinite(deriveTendency(chart, D(1996), ['大运', '流年']).净吉凶)).toBe(true);
  });
});
