import { describe, expect, test } from 'vitest';
import { computeChartFacts } from '../src/analyze-chart';
import { buildScripturePrompt } from '../src/persona/prompt';
import { extractCitableStructures } from '../src/persona/structures';

const facts = computeChartFacts({ year: 1990, month: 6, day: 15, hour: 10, hourUnknown: false, gender: '乾' });

describe('buildScripturePrompt', () => {
  test('可cite白名单 === extractCitableStructures.all（单一真相源）', () => {
    const p = buildScripturePrompt(facts);
    expect(p.可cite白名单).toEqual(extractCitableStructures(facts).all);
    expect(p.优缺同源候选).toEqual(extractCitableStructures(facts).优缺同源点);
  });
  test('含命局结构(命理) + 硬护栏 + 双寄存器/一盘多解指令', () => {
    const p = buildScripturePrompt(facts);
    expect(p.命局结构).toMatch(/用神|十神组合|矛盾张力|涌现拓扑|格局/);
    expect(p.硬护栏.length).toBeGreaterThan(0);
    expect(p.双寄存器指令).toMatch(/后台|台前/);
    expect(p.一盘多解).toMatch(/多解|不锁/);
    expect(p.cite要求).toMatch(/白名单/);
  });
  test('命局结构渲染神煞段（白名单可 cite 的神煞必须带料：名+极性+落柱+gist）', () => {
    const p = buildScripturePrompt(facts);
    const hits = facts.分析.神煞.hits;
    expect(hits.length).toBeGreaterThan(0); // 前提：此盘确有神煞（几乎所有盘都有）
    expect(p.命局结构).toContain('神煞：');
    const h = hits[0]!;
    expect(p.命局结构).toContain(h.name);
    expect(p.命局结构).toContain(h.gist);
    expect(p.命局结构).toContain(h.positions.join(''));
  });
  test('priorViolations 透传(retry 用) + 确定性', () => {
    const p = buildScripturePrompt(facts, ['cite了不存在的结构X']);
    expect(p.priorViolations).toEqual(['cite了不存在的结构X']);
    expect(buildScripturePrompt(facts)).toEqual(buildScripturePrompt(facts));
  });
});
