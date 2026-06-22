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

  test('analyzeChart 产出 计划2三件套 + 计划3三件套(共6字段)', () => {
    const a = analyzeChart(computeChart(SAMPLE));
    expect(Object.keys(a).sort()).toEqual(['刑冲合害', '调候', '旺衰', '涌现拓扑', '用神', '通根'].sort());
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
});
