import { describe, expect, test } from 'vitest';
import { computeChartFacts } from '../src/analyze-chart';
import { validatePersonaAnchors } from '../src/persona/validate';
import { extractCitableStructures } from '../src/persona/structures';
import type { PersonaAnchors, WuXing } from '../src/types';

const facts = computeChartFacts({ year: 1990, month: 6, day: 15, hour: 10, hourUnknown: false, gender: '乾' });
const cit = extractCitableStructures(facts);
const 同源 = cit.优缺同源点[0];
const anchorCite = 同源 ?? (cit.all[0] ?? '');

function base(): PersonaAnchors {
  return {
    主导驱力: '求成就', 对人基调: '亲和', 命门: '偏执', 行为倾向标签: ['谨慎'],
    滋养向: facts.分析.用神.喜.slice(0, 1),
    citedStructures: cit.all.slice(0, Math.min(3, cit.all.length)),
    优缺同源锚: { 优点cite: anchorCite, 弱点cite: anchorCite },
  };
}

describe('validatePersonaAnchors', () => {
  test('合法 anchors → ok', () => {
    expect(validatePersonaAnchors(base(), facts).ok).toBe(true);
  });
  test('★不锁人格：同白名单两套不同 anchors(不同驱力/命门/标签) 都过', () => {
    const a1 = base();
    const a2: PersonaAnchors = { ...base(), 主导驱力: '求自由', 命门: '孤傲', 行为倾向标签: ['叛逆'] };
    expect(validatePersonaAnchors(a1, facts).ok).toBe(true);
    expect(validatePersonaAnchors(a2, facts).ok).toBe(true);
  });
  test('cite 盘上不存在的结构 → 违规', () => {
    const a = base(); a.citedStructures = ['根本不存在的结构xyz'];
    const r = validatePersonaAnchors(a, facts);
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.check === 'cite')).toBe(true);
  });
  test('滋养向含忌神(favorSign<1) → 违规', () => {
    const 忌 = (['木', '火', '土', '金', '水'] as WuXing[]).find((w) => facts.分析.用神.favorSign[w] < 1);
    if (忌) {
      const a = base(); a.滋养向 = [忌];
      expect(validatePersonaAnchors(a, facts).violations.some((v) => v.check === '子集')).toBe(true);
    }
  });
  test('优缺同源锚不同源 → 违规(有同源点时)', () => {
    if (cit.优缺同源点.length > 0) {
      const other = cit.all.find((s) => s !== 同源) ?? '别的';
      const a = base(); a.优缺同源锚 = { 优点cite: 同源!, 弱点cite: other };
      expect(validatePersonaAnchors(a, facts).violations.some((v) => v.check === '优缺同源')).toBe(true);
    }
  });
  test('贫盘无同源点 → degraded 豁免校验3', () => {
    if (cit.优缺同源点.length === 0) {
      expect(validatePersonaAnchors(base(), facts).degraded).toBe(true);
    }
  });
  test('台前纯净：行为倾向标签含命理词 → 违规', () => {
    const a = base(); a.行为倾向标签 = ['食伤旺'];
    expect(validatePersonaAnchors(a, facts).violations.some((v) => v.check === '台前纯净')).toBe(true);
  });
  test('确定性', () => {
    expect(validatePersonaAnchors(base(), facts)).toEqual(validatePersonaAnchors(base(), facts));
  });
});
