import { BirthInputSchema, type BirthInput } from './types';

/** mulberry32:确定性 32-bit PRNG（avalanche 良好），返回 [0,1)。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MS_PER_DAY = 86400000;

export interface SeedToBirthOpts {
  /** 默认 [1900, 2020]（lunar-typescript 节气表精准区·通用安全）。 */
  yearRange?: [number, number];
}

/**
 * 种子 → 合法公历生辰。守 L0 红线:**只产日期,绝不对四柱/favorSign 直接 hash**——
 * 四柱由 `computeChart`（lunar-typescript）算。对全体公历天数**均匀采样** →
 * 诱导出的 favorSign / 身强弱 分布 = 自然分布（无人为峰）。纯函数·确定性·同 seed 字节级同一。
 */
export function seedToBirth(seed: number, opts?: SeedToBirthOpts): BirthInput {
  const [minYear, maxYear] = opts?.yearRange ?? [1900, 2020];
  const rng = mulberry32(Math.floor(seed));

  // 对 [minYear-01-01, maxYear-12-31] 全体日历日均匀抽（每个真实日期等概率·无月长伪峰）。
  const startMs = Date.UTC(minYear, 0, 1);
  const endMs = Date.UTC(maxYear, 11, 31);
  const totalDays = Math.round((endMs - startMs) / MS_PER_DAY) + 1; // inclusive
  const offset = Math.floor(rng() * totalDays);
  const dt = new Date(startMs + offset * MS_PER_DAY); // UTC 整日步进·无 TZ/DST 漂移
  const year = dt.getUTCFullYear();
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();

  const hour = Math.floor(rng() * 24); // 0–23·完整盘
  const gender: '乾' | '坤' = rng() < 0.5 ? '乾' : '坤';

  return BirthInputSchema.parse({ year, month, day, hour, hourUnknown: false, gender });
}
