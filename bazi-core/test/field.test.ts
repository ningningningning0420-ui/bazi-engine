import { describe, expect, test } from 'vitest';
import { computeChartFacts } from '../src/analyze-chart';
import { buildPillar } from '../src/build-pillar';
import { perturbField } from '../src/forecast/field';
import type { LuckPillars, Gan, Zhi } from '../src/types';

// 1990-06-15 10:00 = 庚午 壬午 辛亥 癸巳（日主辛·月柱壬午）
const facts = computeChartFacts({ year: 1990, month: 6, day: 15, hour: 10, hourUnknown: false, gender: '乾' });
const onlyYear = (g: Gan, z: Zhi): LuckPillars =>
  ({ 大运: null, 流年: buildPillar(facts.日主.gan, g, z), 流月: null, 流日: null, caveats: [] });
const WX = ['木', '火', '土', '金', '水'] as const;

describe('perturbField', () => {
  test('流年注入力量 → 净吉凶=favorSign内积(输出Δfield重建)、确定性', () => {
    const r = perturbField(facts, onlyYear('丙', '寅'));
    const sum = WX.reduce((a, w) => a + r.Δfield[w] * facts.分析.用神.favorSign[w], 0);
    expect(r.净吉凶).toBeCloseTo(Math.round(sum * 100) / 100, 5);
    expect(perturbField(facts, onlyYear('丙', '寅'))).toEqual(r);
  });
  test('冲：流年子冲原局午(月支/日支午) → 作用含刑冲', () => {
    const r = perturbField(facts, onlyYear('壬', '子'));
    expect(r.作用.some((a) => a.类型 === '刑冲')).toBe(true);
  });
  test('伏吟：流年壬午 = 原局月柱壬午 → rawFlags.伏吟', () => {
    const r = perturbField(facts, onlyYear('壬', '午'));
    expect(r.rawFlags.伏吟).toBe(true);
  });
  test('净吉凶有限 + Δfield 全有限', () => {
    const r = perturbField(facts, onlyYear('丙', '寅'));
    expect(Number.isFinite(r.净吉凶)).toBe(true);
    expect(WX.every((w) => Number.isFinite(r.Δfield[w]))).toBe(true);
  });
});
