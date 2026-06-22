import { describe, expect, test } from 'vitest';
import { buildPillar } from '../src/build-pillar';
import { analyzeStrength, wangShuai } from '../src/facts/strength';
import type { FourPillars, DayMaster, TenGodCategory } from '../src/types';

const DM_JIA: DayMaster = { gan: '甲', wuXing: '木', yinYang: '阳' };
function cats(p: Partial<Record<TenGodCategory, number>>): Record<TenGodCategory, number> {
  return { 比劫: 0, 食伤: 0, 财: 0, 官杀: 0, 印: 0, ...p };
}

describe('wangShuai 月令旺相休囚死（日主五行 vs 月令五行）', () => {
  test('木日生木月=旺；火日=相；水日=休；金日=囚；土日=死', () => {
    expect(wangShuai('木', '木')).toBe('旺');
    expect(wangShuai('火', '木')).toBe('相');
    expect(wangShuai('水', '木')).toBe('休');
    expect(wangShuai('金', '木')).toBe('囚');
    expect(wangShuai('土', '木')).toBe('死');
  });
});

describe('analyzeStrength 身强弱方向', () => {
  test('身强盘：甲日 + 寅月得令 + 满盘木水 → 身强', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '甲', '寅'),
      月: buildPillar('甲', '甲', '寅'),
      日: buildPillar('甲', '甲', '寅'),
      时: buildPillar('甲', '癸', '亥'),
    };
    const s = analyzeStrength(four, DM_JIA, cats({ 比劫: 6, 印: 2 }));
    expect(s.月令旺衰).toBe('旺');
    expect(s.得令).toBe(true);
    expect(s.身强弱).toBe('身强');
    expect(s.强弱比).toBeGreaterThan(0.55);
  });

  test('身弱盘：甲日 + 申月失令 + 满盘金土 → 身弱', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '庚', '申'),
      月: buildPillar('甲', '庚', '申'),
      日: buildPillar('甲', '戊', '戌'),
      时: buildPillar('甲', '庚', '午'),
    };
    const s = analyzeStrength(four, DM_JIA, cats({ 官杀: 4, 财: 4 }));
    expect(s.月令旺衰).toBe('死'); // 金月克木日
    expect(s.得令).toBe(false);
    expect(s.身强弱).toBe('身弱');
    expect(s.强弱比).toBeLessThan(0.45);
  });

  test('得地：日主有通根则 得地.hasRoot=true 且含日支', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '甲', '寅'),
      月: buildPillar('甲', '甲', '寅'),
      日: buildPillar('甲', '甲', '寅'),
      时: buildPillar('甲', '癸', '亥'),
    };
    const s = analyzeStrength(four, DM_JIA, cats({ 比劫: 6 }));
    expect(s.得地.hasRoot).toBe(true);
    expect(s.得地.positions).toContain('日');
  });
});
