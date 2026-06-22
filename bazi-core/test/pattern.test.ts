import { describe, expect, test } from 'vitest';
import { buildPillar } from '../src/build-pillar';
import { buildPattern } from '../src/facts/pattern';
import type { FourPillars, DayMaster, Gan, Zhi } from '../src/types';

const DM = (gan: Gan, w: '木' | '火', yy: '阳' | '阴'): DayMaster => ({ gan, wuXing: w, yinYang: yy });
const four = (yg: Gan, mg: Gan, mz: Zhi, dz: Zhi = '寅'): FourPillars => ({
  年: buildPillar('甲', yg, '子'), 月: buildPillar('甲', mg, mz),
  日: buildPillar('甲', '甲', dz), 时: null,
});

describe('buildPattern 机械立格', () => {
  test('羊刃：甲日卯月(本气乙=劫财,阳日)→羊刃格', () => {
    const p = buildPattern(DM('甲', '木', '阳'), four('甲', '甲', '卯'));
    expect(p.格).toBe('羊刃格'); expect(p.立格依据).toBe('羊刃');
  });
  test('建禄：乙日卯月(本气乙=比肩)→建禄格', () => {
    const f: FourPillars = { 年: buildPillar('乙', '乙', '子'), 月: buildPillar('乙', '乙', '卯'), 日: buildPillar('乙', '乙', '卯'), 时: null };
    const p = buildPattern({ gan: '乙', wuXing: '木', yinYang: '阴' }, f);
    expect(p.格).toBe('建禄格'); expect(p.立格依据).toBe('建禄');
  });
  test('本气透干：甲日酉月(本气辛=正官)且辛透年干→正官格,本气透干', () => {
    const p = buildPattern(DM('甲', '木', '阳'), four('辛', '甲', '酉'));
    expect(p.格).toBe('正官格'); expect(p.立格依据).toBe('本气透干'); expect(p.透干).toBe(true);
  });
  test('本气暗藏未透：甲日酉月(辛)无辛透→正官格,暗藏未透,透干 false', () => {
    const p = buildPattern(DM('甲', '木', '阳'), four('甲', '甲', '酉'));
    expect(p.格).toBe('正官格'); expect(p.立格依据).toBe('月令本气暗藏未透'); expect(p.透干).toBe(false);
  });
  test('杂气透干：甲日辰月(本气戊不透)、余气癸=正印透时干→正印格,杂气透干', () => {
    const f: FourPillars = { 年: buildPillar('甲', '甲', '子'), 月: buildPillar('甲', '甲', '辰'), 日: buildPillar('甲', '甲', '寅'), 时: buildPillar('甲', '癸', '亥') };
    const p = buildPattern(DM('甲', '木', '阳'), f);
    expect(p.立格依据).toBe('杂气透干'); expect(p.透干).toBe(true);
  });
});
