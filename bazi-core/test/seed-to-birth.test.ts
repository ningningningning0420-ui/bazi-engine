import { describe, expect, test } from 'vitest';
import { seedToBirth } from '../src/seed-to-birth';
import { computeChart } from '../src/compute-chart';
import { computeChartFacts } from '../src/analyze-chart';
import { BirthInputSchema } from '../src/types';
import type { WuXing } from '../src/constants/gan-zhi';

/** 真日历日校验:UTC 构造回环不滚动 = 该 ymd 真实存在。 */
function isRealDate(y: number, m: number, d: number): boolean {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

describe('seedToBirth · 确定性', () => {
  test('同 seed 两次结果深相等', () => {
    expect(seedToBirth(12345)).toEqual(seedToBirth(12345));
    expect(seedToBirth(0)).toEqual(seedToBirth(0));
    expect(seedToBirth(987654321)).toEqual(seedToBirth(987654321));
  });

  test('不同 seed 给不同生辰(抽样不退化为常量)', () => {
    const set = new Set<string>();
    for (let s = 0; s < 200; s++) set.add(JSON.stringify(seedToBirth(s)));
    // 200 个 seed 不该全挤在极少数生辰上
    expect(set.size).toBeGreaterThan(150);
  });

  test('黄金锁:seed 0/1/42 字节稳定(改算法即触警)', () => {
    expect(seedToBirth(0)).toEqual({ year: 1932, month: 3, day: 28, hour: 0, hourUnknown: false, gender: '乾' });
    expect(seedToBirth(1)).toEqual({ year: 1975, month: 11, day: 17, hour: 0, hourUnknown: false, gender: '坤' });
    expect(seedToBirth(42)).toEqual({ year: 1972, month: 9, day: 25, hour: 10, hourUnknown: false, gender: '坤' });
  });
});

describe('seedToBirth · 合法性', () => {
  test('200 seeds 全产合法 BirthInput · computeChart 不抛 · 完整盘', () => {
    for (let s = 0; s < 200; s++) {
      const b = seedToBirth(s);
      expect(() => BirthInputSchema.parse(b)).not.toThrow();
      expect(b.hourUnknown).toBe(false);
      expect(b.hour).not.toBeNull();
      expect(['乾', '坤']).toContain(b.gender);
      expect(isRealDate(b.year, b.month, b.day)).toBe(true);
      expect(() => computeChart(b)).not.toThrow();
    }
  });
});

describe('seedToBirth · 年份范围', () => {
  test('默认 [1900, 2020] · 全在范围内且覆盖到端点', () => {
    let lo = 9999, hi = 0;
    for (let s = 0; s < 6000; s++) {
      const y = seedToBirth(s).year;
      expect(y).toBeGreaterThanOrEqual(1900);
      expect(y).toBeLessThanOrEqual(2020);
      lo = Math.min(lo, y); hi = Math.max(hi, y);
    }
    expect(lo).toBeLessThanOrEqual(1903);
    expect(hi).toBeGreaterThanOrEqual(2017);
  });

  test('opts.yearRange 生效', () => {
    for (let s = 0; s < 3000; s++) {
      const y = seedToBirth(s, { yearRange: [1980, 1990] }).year;
      expect(y).toBeGreaterThanOrEqual(1980);
      expect(y).toBeLessThanOrEqual(1990);
    }
  });
});

describe('seedToBirth · 均匀性(无聚簇偏置)', () => {
  const N = 6000;

  test('月份近均匀(每桶在统计容差内)', () => {
    const cnt = new Array(13).fill(0);
    for (let s = 0; s < N; s++) cnt[seedToBirth(s).month]++;
    // 均匀 ≈ N/12 ≈ 500;容差 [0.6, 1.4]× 足以放过真随机、抓住「全挤一月」式偏置
    for (let m = 1; m <= 12; m++) {
      expect(cnt[m]).toBeGreaterThan((N / 12) * 0.6);
      expect(cnt[m]).toBeLessThan((N / 12) * 1.4);
    }
  });

  test('hour 近均匀', () => {
    const cnt = new Array(24).fill(0);
    for (let s = 0; s < N; s++) cnt[seedToBirth(s).hour!]++;
    for (let h = 0; h < 24; h++) {
      expect(cnt[h]).toBeGreaterThan((N / 24) * 0.6);
      expect(cnt[h]).toBeLessThan((N / 24) * 1.4);
    }
  });

  test('gender 近 50/50', () => {
    let qian = 0;
    for (let s = 0; s < N; s++) if (seedToBirth(s).gender === '乾') qian++;
    expect(qian).toBeGreaterThan(N * 0.46);
    expect(qian).toBeLessThan(N * 0.54);
  });

  test('年份三段(早/中/晚)各占合理份额', () => {
    let early = 0, mid = 0, late = 0; // [1900,1940) [1940,1980) [1980,2020]
    for (let s = 0; s < N; s++) {
      const y = seedToBirth(s).year;
      if (y < 1940) early++; else if (y < 1980) mid++; else late++;
    }
    for (const c of [early, mid, late]) expect(c).toBeGreaterThan(N * 0.25);
  });
});

describe('seedToBirth · 无偏(红线:命盘分布近自然、无人为峰)', () => {
  const N = 2000;

  test('身强弱三档齐全且无单档退化', () => {
    const cnt: Record<'身强' | '身弱' | '均衡', number> = { 身强: 0, 身弱: 0, 均衡: 0 };
    for (let s = 0; s < N; s++) cnt[computeChartFacts(seedToBirth(s)).分析.旺衰.身强弱]++;
    expect(cnt.身强).toBeGreaterThan(N * 0.2);
    expect(cnt.身弱).toBeGreaterThan(N * 0.2);
    expect(cnt.身强 + cnt.身弱 + cnt.均衡).toBe(N);
    for (const k of ['身强', '身弱', '均衡'] as const) expect(cnt[k]).toBeLessThan(N * 0.75);
  });

  test('主用神五行齐全且无单峰(>55%)', () => {
    const cnt: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    for (let s = 0; s < N; s++) cnt[computeChartFacts(seedToBirth(s)).分析.用神.主用神]++;
    for (const w of ['木', '火', '土', '金', '水'] as WuXing[]) {
      expect(cnt[w]).toBeGreaterThan(N * 0.02); // 五行皆可为主用神
      expect(cnt[w]).toBeLessThan(N * 0.55);     // 无人为单峰
    }
  });
});
