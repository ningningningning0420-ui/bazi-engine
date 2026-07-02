import { describe, expect, test } from 'vitest';
import { computeChart, type BirthInput } from '../src/index';

const FIXTURES: BirthInput[] = [
  { year: 1984, month: 2, day: 4, hour: 0, hourUnknown: false, gender: '乾' },   // 立春换年边界附近
  { year: 1990, month: 8, day: 8, hour: 14, hourUnknown: false, gender: '坤' },
  { year: 2008, month: 12, day: 31, hour: 23, hourUnknown: false, gender: '乾' }, // 晚子时边界（日柱不换·时干次日）
];

describe('黄金样例：可复现快照', () => {
  test.each(FIXTURES)('同输入两次深相等 %#', (fx) => {
    expect(computeChart(fx)).toEqual(computeChart(fx));
  });

  test('四柱八字字符串快照（回归锁）', () => {
    const fourPillarStr = (fx: BirthInput) => {
      const c = computeChart(fx);
      const s = (p: ReturnType<typeof computeChart>['四柱']['年'] | null) => (p ? p.gan + p.zhi : '—');
      return [s(c.四柱.年), s(c.四柱.月), s(c.四柱.日), s(c.四柱.时)].join(' ');
    };
    expect(FIXTURES.map(fourPillarStr)).toMatchInlineSnapshot(`
      [
        "癸亥 乙丑 戊辰 壬子",
        "庚午 甲申 乙巳 癸未",
        "戊子 甲子 乙巳 戊子",
      ]
    `);
  });
});
