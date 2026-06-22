import { describe, expect, test } from 'vitest';
import { computeChart } from '../src/compute-chart';
import { selectLuckPillars } from '../src/forecast/luck-pillars';
import type { BirthInput, AtDate } from '../src/types';

const BI: BirthInput = { year: 1990, month: 6, day: 15, hour: 10, hourUnknown: false, gender: '乾' };
const chart = computeChart(BI);
const D = (year: number, month = 6, day = 15): AtDate => ({ year, month, day });

describe('selectLuckPillars', () => {
  test('流年=排 atDate 自己的八字(立春换年)：2025=乙巳', () => {
    const lp = selectLuckPillars(chart, D(2025), ['大运', '流年']);
    expect(lp.流年.gan + lp.流年.zhi).toBe('乙巳');
  });
  test('大运：2025 落乙酉大运(getYun 起运/顺逆)', () => {
    const lp = selectLuckPillars(chart, D(2025), ['大运', '流年']);
    expect(lp.大运 && lp.大运.gan + lp.大运.zhi).toBe('乙酉');
  });
  test('流月/流日 按 grain 出/缺', () => {
    const full = selectLuckPillars(chart, D(2025, 3, 20), ['大运', '流年', '流月', '流日']);
    expect(full.流月).not.toBeNull();
    expect(full.流日).not.toBeNull();
    const yearly = selectLuckPillars(chart, D(2025), ['大运', '流年']);
    expect(yearly.流月).toBeNull();
    expect(yearly.流日).toBeNull();
  });
  test('童限：起运(1997)前 → 大运 null + caveat', () => {
    const lp = selectLuckPillars(chart, D(1993), ['大运', '流年']);
    expect(lp.大运).toBeNull();
    expect(lp.caveats.some((c) => c.includes('未起运'))).toBe(true);
  });
  test('立春边界：2025立春(~2/3)前一天属甲辰年、当天属乙巳年', () => {
    const before = selectLuckPillars(chart, D(2025, 2, 2), ['大运', '流年']);
    const after = selectLuckPillars(chart, D(2025, 2, 4), ['大运', '流年']);
    expect(before.流年.gan + before.流年.zhi).toBe('甲辰');
    expect(after.流年.gan + after.流年.zhi).toBe('乙巳');
  });
  test('顺逆 golden：阳年女逆排(乾→1/坤→0 映射锁定)', () => {
    const female = computeChart({ ...BI, gender: '坤' });
    const lpF = selectLuckPillars(female, D(2025), ['大运', '流年']);
    const lpM = selectLuckPillars(chart, D(2025), ['大运', '流年']);
    expect(lpF.大运!.gan + lpF.大运!.zhi).not.toBe(lpM.大运!.gan + lpM.大运!.zhi);
  });
  test('确定性：同输入两次深相等', () => {
    const a = selectLuckPillars(chart, D(2025, 3, 20), ['大运', '流年', '流月', '流日']);
    const b = selectLuckPillars(chart, D(2025, 3, 20), ['大运', '流年', '流月', '流日']);
    expect(a).toEqual(b);
  });
});
