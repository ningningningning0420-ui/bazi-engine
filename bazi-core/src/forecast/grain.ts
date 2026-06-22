import type { GrainSet } from '../types';

export const GRAIN_DAY_CUT = 30;
export const GRAIN_MONTH_CUT = 365;

/** 按 in-fiction 日跨自动选颗粒度（纯函数·只认日跨·大运恒含底色）。 */
export function selectGrain(timeSpanInFictionDays: number): GrainSet {
  if (timeSpanInFictionDays < GRAIN_DAY_CUT) return ['大运', '流年', '流月', '流日'];
  if (timeSpanInFictionDays < GRAIN_MONTH_CUT) return ['大运', '流年', '流月'];
  return ['大运', '流年'];
}
