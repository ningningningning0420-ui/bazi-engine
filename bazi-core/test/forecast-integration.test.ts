import { describe, expect, test } from 'vitest';
import { computeChart, deriveTendency, eventModifier, selectGrain, selectLuckPillars, perturbField, crossRelations, rollWithCoeff } from '../src/index';
import { computeChartFacts } from '../src/index';
import type { AtDate } from '../src/types';

const chart = computeChart({ year: 1985, month: 8, day: 20, hour: 14, hourUnknown: false, gender: '坤' });
const D: AtDate = { year: 2025, month: 5, day: 10 };
const 命理词 = /[木火土金水]|官杀|正官|七杀|财|印|食伤|比劫|劫财|伤官|食神|流年|大运|旺衰|用神|喜神|忌神|冲|刑|合|化/;

describe('forecast 集成', () => {
  test('导出齐 + L3/L4 不进 computeChartFacts(可选层)', () => {
    expect(typeof deriveTendency).toBe('function');
    expect(typeof eventModifier).toBe('function');
    expect(typeof selectLuckPillars).toBe('function');
    expect(typeof perturbField).toBe('function');
    expect(typeof crossRelations).toBe('function');
    expect(typeof rollWithCoeff).toBe('function');
    expect(selectGrain(100)).toContain('流年');
    // L3/L4 不进 computeChartFacts：分析里没有 forecast 字段
    const facts = computeChartFacts(chart.birthInput);
    expect('当运干支' in facts.分析).toBe(false);
  });
  test('确定性：同(chart,atDate)两次 L3/L4 深相等', () => {
    expect(deriveTendency(chart, D, selectGrain(100))).toEqual(deriveTendency(chart, D, selectGrain(100)));
    expect(eventModifier(chart, D, '求财')).toEqual(eventModifier(chart, D, '求财'));
  });
  test('隐藏暗示命理-free(集成层再验)', () => {
    expect(deriveTendency(chart, D, selectGrain(100)).隐藏暗示).not.toMatch(命理词);
  });
});
