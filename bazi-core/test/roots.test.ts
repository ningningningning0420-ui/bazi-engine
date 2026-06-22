import { describe, expect, test } from 'vitest';
import { buildPillar } from '../src/build-pillar';
import { analyzeRoots } from '../src/facts/roots';
import type { FourPillars, DayMaster } from '../src/types';

// 日主甲：年甲寅 月丙寅 日甲子 时辛酉
function four(): FourPillars {
  return {
    年: buildPillar('甲', '甲', '寅'),
    月: buildPillar('甲', '丙', '寅'),
    日: buildPillar('甲', '甲', '子'),
    时: buildPillar('甲', '辛', '酉'),
  };
}
const DM: DayMaster = { gan: '甲', wuXing: '木', yinYang: '阳' };

describe('analyzeRoots 通根', () => {
  test('日主甲在寅(本气甲)有本气根，hasRoot=true；子/酉不算', () => {
    const rs = analyzeRoots(four(), DM);
    const day = rs.find((r) => r.slot === '日')!;
    expect(day.hasRoot).toBe(true);
    expect(day.roots.some((r) => r.branch === '寅' && r.rootType === '本气根')).toBe(true);
    expect(day.roots.every((r) => r.branch !== '子' && r.branch !== '酉')).toBe(true);
  });

  test('辛(时干,金)在酉(本气辛)有本气根', () => {
    const rs = analyzeRoots(four(), DM);
    const shi = rs.find((r) => r.slot === '时')!;
    expect(shi.stem).toBe('辛');
    expect(shi.hasRoot).toBe(true);
    expect(shi.roots.some((r) => r.branch === '酉' && r.rootType === '本气根')).toBe(true);
  });

  test('丙(月干,火)在寅(中气丙)有中气根', () => {
    const rs = analyzeRoots(four(), DM);
    const yue = rs.find((r) => r.slot === '月')!;
    expect(yue.stem).toBe('丙');
    expect(yue.hasRoot).toBe(true);
    expect(yue.roots.some((r) => r.branch === '寅' && r.rootType === '中气根')).toBe(true);
  });

  test('时柱为 null 时只分析三柱', () => {
    const f = four(); f.时 = null;
    const rs = analyzeRoots(f, DM);
    expect(rs).toHaveLength(3);
    expect(rs.every((r) => r.slot !== '时')).toBe(true);
  });
});
