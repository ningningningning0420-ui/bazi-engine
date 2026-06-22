import { describe, expect, test } from 'vitest';
import { buildPillar } from '../src/build-pillar';
import { climateNeed } from '../src/facts/climate';
import type { FourPillars, WuXing } from '../src/types';

function fourMonth(zhi: '子' | '午'): FourPillars {
  return {
    年: buildPillar('甲', '甲', '寅'), 月: buildPillar('甲', '甲', zhi),
    日: buildPillar('甲', '甲', '寅'), 时: buildPillar('甲', '甲', '寅'),
  };
}
const S = (p: Partial<Record<WuXing, number>>): Record<WuXing, number> => ({ 木: 0, 火: 0, 土: 0, 金: 0, 水: 0, ...p });

describe('climateNeed 调候', () => {
  test('冬月水旺无火 → 寒甚，调候提示含火，级别 critical', () => {
    const c = climateNeed(fourMonth('子'), S({ 水: 6, 木: 1, 火: 0 }));
    expect(c.季节).toBe('冬');
    expect(c.寒暖标签).toBe('寒甚');
    expect(c.调候提示[0]).toBe('火');
    expect(c.级别).toBe('critical');
  });
  test('五行均衡 → 无调候压力，级别 null', () => {
    const c = climateNeed(fourMonth('午'), S({ 木: 2, 火: 2, 土: 2, 金: 2, 水: 2 }));
    expect(c.调候提示).toEqual([]);
    expect(c.级别).toBeNull();
  });
});
