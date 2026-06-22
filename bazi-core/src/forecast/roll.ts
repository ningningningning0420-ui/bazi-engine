import type { EventCoeff, RollResult } from '../types';

const BASE_RATE = 0.5;
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/**
 * standalone 兜底掷骰：把 EventCoeff.successDelta 修正 baseRate 当阈值掷骰。
 * 契约：prng 外置注入（核不内置 RNG·决策4）；通用卡兜底用。
 * ★大奥等有裁决/真蝴蝶 gate 的消费方禁止 import 本函数，只读 EventCoeff 喂自己的裁决。
 */
export function rollWithCoeff(coeff: EventCoeff, prng: () => number): RollResult {
  const threshold = clamp(BASE_RATE + coeff.successDelta, 0.05, 0.95);
  const roll = prng();
  return { success: roll < threshold, roll, threshold };
}
