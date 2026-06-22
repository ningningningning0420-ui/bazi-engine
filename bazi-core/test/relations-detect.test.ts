import { describe, expect, test } from 'vitest';
import { buildPillar } from '../src/build-pillar';
import { detectRelations } from '../src/facts/relations-detect';
import type { FourPillars } from '../src/types';

describe('detectRelations 刑冲合害', () => {
  test('六冲：日支子 时支午 相邻 → 六冲 贴邻', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '甲', '寅'),
      月: buildPillar('甲', '甲', '寅'),
      日: buildPillar('甲', '甲', '子'),
      时: buildPillar('甲', '甲', '午'),
    };
    const rels = detectRelations(four);
    const chong = rels.find((r) => r.类型 === '六冲');
    expect(chong).toBeDefined();
    expect(chong!.贴邻).toBe(true);
    expect(chong!.化五行).toBeNull();
  });

  test('三合水局：申子辰齐 → 三合 化水', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '甲', '申'),
      月: buildPillar('甲', '甲', '子'),
      日: buildPillar('甲', '甲', '辰'),
      时: buildPillar('甲', '甲', '寅'),
    };
    const rels = detectRelations(four);
    const he = rels.find((r) => r.类型 === '三合');
    expect(he).toBeDefined();
    expect(he!.化五行).toBe('水');
    expect(he!.members.map((m) => m.value).sort()).toEqual(['申', '子', '辰'].sort());
  });

  test('天干五合：甲己 → 天干五合 化土', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '己', '丑'),
      月: buildPillar('甲', '甲', '寅'),
      日: buildPillar('甲', '甲', '寅'),
      时: buildPillar('甲', '甲', '寅'),
    };
    const rels = detectRelations(four);
    const he = rels.find((r) => r.类型 === '天干五合');
    expect(he).toBeDefined();
    expect(he!.化五行).toBe('土');
  });

  test('自刑：两辰 → 自刑', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '甲', '辰'),
      月: buildPillar('甲', '甲', '辰'),
      日: buildPillar('甲', '甲', '寅'),
      时: buildPillar('甲', '甲', '卯'),
    };
    const rels = detectRelations(four);
    expect(rels.some((r) => r.类型 === '自刑')).toBe(true);
  });

  test('无六冲六合盘：寅寅寅寅', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '甲', '寅'),
      月: buildPillar('甲', '甲', '寅'),
      日: buildPillar('甲', '甲', '寅'),
      时: buildPillar('甲', '甲', '寅'),
    };
    const rels = detectRelations(four);
    expect(rels.every((r) => r.类型 !== '六冲' && r.类型 !== '六合')).toBe(true);
  });
});
