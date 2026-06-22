import { describe, expect, test } from 'vitest';
import { buildPillar } from '../src/build-pillar';
import { crossRelations } from '../src/forecast/field-relations';
import type { FourPillars, LuckPillars, Zhi } from '../src/types';

const four: FourPillars = {
  年: buildPillar('甲', '甲', '子'), 月: buildPillar('甲', '丙', '寅'),
  日: buildPillar('甲', '甲', '午'), 时: buildPillar('甲', '庚', '申'),
};
const luck = (流年支: Zhi): LuckPillars => ({
  大运: null, 流年: buildPillar('甲', '乙', 流年支), 流月: null, 流日: null, caveats: [],
});

describe('crossRelations', () => {
  test('流年丑 与 原局子 → 六合(化土)', () => {
    const rs = crossRelations(four, luck('丑'));
    expect(rs.some((r) => r.类型 === '六合' && r.流运支 === '丑' && r.化五行 === '土')).toBe(true);
  });
  test('流年子 与 原局午 → 六冲', () => {
    const rs = crossRelations(four, luck('子'));
    expect(rs.some((r) => r.类型 === '六冲' && r.流运支 === '子')).toBe(true);
  });
  test('三合：原局申子(半)+流年辰 → 三合水', () => {
    const rs = crossRelations(four, luck('辰')); // 申子辰三合水，原局有申、子
    expect(rs.some((r) => r.类型 === '三合' && r.化五行 === '水')).toBe(true);
  });
  test('确定性 + 仅流运 vs 原局', () => {
    expect(crossRelations(four, luck('丑'))).toEqual(crossRelations(four, luck('丑')));
  });
});
