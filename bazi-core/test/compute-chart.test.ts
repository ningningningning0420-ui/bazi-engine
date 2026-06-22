import { describe, expect, test } from 'vitest';
import { Solar } from 'lunar-typescript';
import { computeChart } from '../src/compute-chart';
import { GAN, ZHI } from '../src/constants/gan-zhi';
import type { BirthInput } from '../src/types';

const SAMPLE: BirthInput = { year: 2000, month: 6, day: 15, hour: 12, hourUnknown: false, gender: '乾' };

describe('computeChart L0', () => {
  test('四柱干支与 lunar-typescript oracle 一致（忠实映射）', () => {
    const ec = Solar.fromYmdHms(2000, 6, 15, 12, 0, 0).getLunar().getEightChar();
    const c = computeChart(SAMPLE);
    expect(c.四柱.年.gan + c.四柱.年.zhi).toBe(ec.getYearGan() + ec.getYearZhi());
    expect(c.四柱.月.gan + c.四柱.月.zhi).toBe(ec.getMonthGan() + ec.getMonthZhi());
    expect(c.四柱.日.gan + c.四柱.日.zhi).toBe(ec.getDayGan() + ec.getDayZhi());
    expect(c.四柱.时!.gan + c.四柱.时!.zhi).toBe(ec.getTimeGan() + ec.getTimeZhi());
  });

  test('日主取日柱天干', () => {
    const c = computeChart(SAMPLE);
    expect(c.日主.gan).toBe(c.四柱.日.gan);
    expect(c.日主.wuXing).toBe(c.四柱.日.ganWuXing);
  });

  test('确定性：同输入两次结果深相等', () => {
    expect(computeChart(SAMPLE)).toEqual(computeChart(SAMPLE));
  });

  test('结构不变量：所有干∈天干、支∈地支', () => {
    const c = computeChart(SAMPLE);
    for (const p of [c.四柱.年, c.四柱.月, c.四柱.日, c.四柱.时!]) {
      expect(GAN).toContain(p.gan);
      expect(ZHI).toContain(p.zhi);
    }
  });

  test('hourUnknown：时柱为 null，并产出 caveat，时柱十神不计入', () => {
    const noHour: BirthInput = { year: 2000, month: 6, day: 15, hour: null, hourUnknown: true, gender: '坤' };
    const c = computeChart(noHour);
    expect(c.四柱.时).toBeNull();
    expect(c.caveats.some((s) => s.includes('时柱'))).toBe(true);
    // 与带时辰版相比，十神计数应不同（少了时柱那一柱的贡献）
    const withHour = computeChart({ ...noHour, hour: 12, hourUnknown: false });
    const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
    expect(sum(c.十神计数)).toBeLessThan(sum(withHour.十神计数));
  });

  test('十神计数不含日主自身（日柱天干不计）', () => {
    const c = computeChart(SAMPLE);
    const hiddenCount = [c.四柱.年, c.四柱.月, c.四柱.日, c.四柱.时!]
      .reduce((n, p) => n + p.hiddenStems.length, 0);
    const sum = Object.values(c.十神计数).reduce((a, b) => a + b, 0);
    expect(sum).toBe(3 + hiddenCount);
  });
});
