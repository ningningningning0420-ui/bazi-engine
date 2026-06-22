import { describe, expect, test } from 'vitest';
import { computeChartFacts, analyzeChart } from '../src/analyze-chart';
import { computeChart } from '../src/compute-chart';
import type { BirthInput } from '../src/types';

const SAMPLE: BirthInput = { year: 2000, month: 6, day: 15, hour: 12, hourUnknown: false, gender: '乾' };

describe('analyzeChart / computeChartFacts', () => {
  test('computeChartFacts = Chart + 分析三件套', () => {
    const f = computeChartFacts(SAMPLE);
    expect(f.四柱).toBeDefined();          // 继承自 Chart
    expect(f.分析.通根).toBeInstanceOf(Array);
    expect(f.分析.旺衰.身强弱).toMatch(/身强|身弱|均衡/);
    expect(f.分析.刑冲合害).toBeInstanceOf(Array);
  });

  test('确定性：同输入两次深相等', () => {
    expect(computeChartFacts(SAMPLE)).toEqual(computeChartFacts(SAMPLE));
  });

  test('analyzeChart 产出 计划2/3/4 共10字段', () => {
    const a = analyzeChart(computeChart(SAMPLE));
    expect(Object.keys(a).sort()).toEqual(
      ['刑冲合害', '调候', '旺衰', '涌现拓扑', '用神', '通根', '十神组合', '矛盾张力', '格局', '从格信号'].sort(),
    );
  });

  test('hourUnknown：通根只三柱、旺衰仍可算', () => {
    const f = computeChartFacts({ ...SAMPLE, hour: null, hourUnknown: true });
    expect(f.分析.通根).toHaveLength(3);
    expect(f.分析.旺衰.月令旺衰).toBeDefined();
  });

  test('计划3：分析 含 调候/涌现拓扑/用神，favorSign 恰一个+2', () => {
    const f = computeChartFacts(SAMPLE);
    expect(f.分析.调候.级别 === null || ['critical', 'adjust'].includes(f.分析.调候.级别!)).toBe(true);
    expect(f.分析.涌现拓扑.flowLevel).toMatch(/畅|通|滞|阻/);
    const fs = f.分析.用神.favorSign;
    const plus2 = (['木', '火', '土', '金', '水'] as const).filter((w) => fs[w] === 2);
    expect(plus2).toHaveLength(1);
    expect(f.分析.用神.主用神).toBeDefined();
  });

  test('计划4：分析 含 十神组合/矛盾张力/格局/从格信号', () => {
    const f = computeChartFacts({ year: 1990, month: 3, day: 15, hour: 10, hourUnknown: false, gender: '乾' });
    expect(Array.isArray(f.分析.十神组合)).toBe(true);
    for (const c of f.分析.十神组合) {
      expect(c.成立程度).toBeGreaterThanOrEqual(0.1);
      expect(c.成立程度).toBeLessThanOrEqual(1);
      expect(['吉向', '凶向', '中性']).toContain(c.极性);
    }
    expect(f.分析.矛盾张力.矛盾张力轴).toBeDefined();
    expect(f.分析.格局.格).toBeDefined();
    expect(['从强', '从弱', null]).toContain(f.分析.从格信号.候选);
  });

  test('计划4：确定性——同生辰两次 computeChartFacts 分析深相等', () => {
    const i = { year: 1985, month: 8, day: 20, hour: 14, hourUnknown: false, gender: '坤' } as const;
    expect(computeChartFacts(i).分析).toEqual(computeChartFacts(i).分析);
  });
});
