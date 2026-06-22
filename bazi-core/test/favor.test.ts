import { describe, expect, test } from 'vitest';
import { buildPillar } from '../src/build-pillar';
import { analyzeFavor } from '../src/facts/favor';
import { analyzeStrength } from '../src/facts/strength';
import { buildEmergentTopology } from '../src/facts/topology';
import { climateNeed } from '../src/facts/climate';
import type { FourPillars, DayMaster, TenGodCategory, WuXing } from '../src/types';

const DM_JIA: DayMaster = { gan: '甲', wuXing: '木', yinYang: '阳' };
const cats = (p: Partial<Record<TenGodCategory, number>>): Record<TenGodCategory, number> =>
  ({ 比劫: 0, 食伤: 0, 财: 0, 官杀: 0, 印: 0, ...p });
const FIVE: WuXing[] = ['木', '火', '土', '金', '水'];

function favorOf(four: FourPillars, c: Record<TenGodCategory, number>) {
  const st = analyzeStrength(four, DM_JIA, c);
  const topo = buildEmergentTopology(st.五行得分, DM_JIA.wuXing, []);
  const cl = climateNeed(four, st.五行得分);
  return analyzeFavor(four, DM_JIA, st, [], topo, cl);
}

describe('analyzeFavor 用神 favorSign', () => {
  test('身弱盘：喜印比(水木为正)，恰一个 +2', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '庚', '申'), 月: buildPillar('甲', '庚', '申'),
      日: buildPillar('甲', '戊', '戌'), 时: buildPillar('甲', '庚', '午'),
    };
    const f = favorOf(four, cats({ 官杀: 4, 财: 4 }));
    expect(f.favorSign['木']).toBeGreaterThan(0); // 比劫(木)喜
    expect(f.favorSign['水']).toBeGreaterThan(0); // 印(水)喜
    expect(FIVE.filter((w) => f.favorSign[w] === 2)).toHaveLength(1);
  });

  test('身强盘：比劫(木)忌，恰一个 +2', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '甲', '寅'), 月: buildPillar('甲', '甲', '寅'),
      日: buildPillar('甲', '甲', '寅'), 时: buildPillar('甲', '癸', '亥'),
    };
    const f = favorOf(four, cats({ 比劫: 6, 印: 2 }));
    expect(f.favorSign['木']).toBeLessThan(0); // 比劫(木)忌
    expect(FIVE.filter((w) => f.favorSign[w] === 2)).toHaveLength(1);
  });

  test('不变量：恰一个+2、至多一个-2、无矛盾号、确定性', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '甲', '寅'), 月: buildPillar('甲', '丙', '午'),
      日: buildPillar('甲', '戊', '辰'), 时: buildPillar('甲', '壬', '子'),
    };
    const c = cats({ 比劫: 2, 食伤: 2, 财: 2, 印: 1 });
    const f1 = favorOf(four, c);
    const f2 = favorOf(four, c);
    expect(f1).toEqual(f2); // 确定性
    const vals = FIVE.map((w) => f1.favorSign[w]);
    expect(vals.filter((v) => v === 2)).toHaveLength(1);
    expect(vals.filter((v) => v === -2).length).toBeLessThanOrEqual(1);
    expect(f1.用神十神).toHaveLength(1);
  });
});
