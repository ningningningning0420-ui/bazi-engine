import { describe, expect, test } from 'vitest';
import { computeChartFacts } from '../src/analyze-chart';
import { extractCitableStructures } from '../src/persona/structures';

const facts = computeChartFacts({ year: 1990, month: 6, day: 15, hour: 10, hourUnknown: false, gender: '乾' });

describe('extractCitableStructures', () => {
  test('all 含 十神组合/格局·去重·确定性', () => {
    const c = extractCitableStructures(facts);
    expect(c.all.length).toBeGreaterThan(0);
    expect(c.all).toContain(facts.分析.格局.格);
    for (const combo of facts.分析.十神组合) expect(c.all).toContain(combo.类型);
    expect(new Set(c.all).size).toBe(c.all.length);
    expect(extractCitableStructures(facts)).toEqual(c);
  });
  test('优缺同源点 = 引擎 矛盾张力.优缺同源点的 结构cite·且 ∈ all', () => {
    const c = extractCitableStructures(facts);
    expect(c.优缺同源点).toEqual([...new Set(facts.分析.矛盾张力.优缺同源点.map((p) => p.结构cite))]);
    for (const cite of c.优缺同源点) expect(c.all).toContain(cite);
  });
});
