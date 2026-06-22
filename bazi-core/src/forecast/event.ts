import { sheng, ke, shengMe, keMe, WU_XING, type WuXing } from '../constants/gan-zhi';
import { computeChartFacts } from '../analyze-chart';
import { selectLuckPillars } from './luck-pillars';
import { perturbField } from './field';
import type { Chart, AtDate, EventKind, EventCoeff, TenGodCategory, GrainSet } from '../types';

export const DELTA_SCALE = 0.25;
export const AMP: Record<'反吟' | '伏吟' | '岁运并临', number> = { 反吟: 1.5, 伏吟: 1.5, 岁运并临: 1.8 };
export const AMP_CLAMP = 2.0;
const DIR_EPS = 0.05;
const FINEST: GrainSet = ['大运', '流年', '流月', '流日'];

const round2 = (x: number): number => Math.round(x * 100) / 100;
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/** 通用 v1 EventKind → 关注十神类别（可扩展·宫位 v2）。 */
const EVENT_FOCUS_TABLE: Record<EventKind, TenGodCategory[]> = {
  事业晋升: ['官杀', '印'], 求财: ['财', '食伤'], 婚恋: ['财', '官杀'],
  健康: ['比劫', '印'], 诉讼口舌: ['官杀', '食伤'], 学业考试: ['印', '官杀'],
};

/** 类别 → 五行（相对日主五行 dmW）。 */
function catToWuXing(cat: TenGodCategory, dmW: WuXing): WuXing {
  switch (cat) {
    case '比劫': return dmW;
    case '印': return shengMe(dmW);
    case '食伤': return sheng(dmW);
    case '财': return ke(dmW);
    case '官杀': return keMe(dmW);
  }
}

/** L4 成功率系数（纯几何·不掷骰·favorSign 唯一标度·directionBias 仅 hint 不翻向）。 */
export function eventModifier(chart: Chart, atDate: AtDate, eventKind: EventKind): EventCoeff {
  const facts = computeChartFacts(chart.birthInput);
  const dmW = chart.日主.wuXing;
  const favorSign = facts.分析.用神.favorSign;
  const S = facts.分析.旺衰.五行得分;
  const luck = selectLuckPillars(chart, atDate, FINEST); // L4 恒用最细 grain
  const field = perturbField(facts, luck);

  const focusCats = EVENT_FOCUS_TABLE[eventKind];
  const focusW = [...new Set(focusCats.map((c) => catToWuXing(c, dmW)))];

  // aptitude（命局禀赋·share 口径 × favorSign 本值）
  const total = WU_XING.reduce((a, w) => a + S[w], 0);
  let aptitude = 0;
  if (total > 0 && focusW.length > 0) {
    const acc = focusW.reduce((a, w) => a + (S[w] / total) * favorSign[w], 0);
    aptitude = clamp(acc / (2 * focusW.length), -1, 1);
  }

  // timing（当期引动·focus 子内积 / 总扰动幅度）
  const D = WU_XING.reduce((a, w) => a + Math.abs(field.Δfield[w] * favorSign[w]), 0);
  let timing = 0;
  if (D > 0) {
    const acc = focusW.reduce((a, w) => a + field.Δfield[w] * favorSign[w], 0);
    timing = clamp(acc / D, -1, 1);
  }

  const net = clamp(0.4 * aptitude + 0.6 * timing, -1, 1);

  // amp（取 max 不连乘·clamp≤2.0）
  const cands: { flag: string; v: number }[] = [];
  if (field.rawFlags.岁运并临) cands.push({ flag: '岁运并临', v: AMP.岁运并临 });
  if (field.rawFlags.反吟) cands.push({ flag: '反吟', v: AMP.反吟 });
  if (field.rawFlags.伏吟) cands.push({ flag: '伏吟', v: AMP.伏吟 });
  let amp = 1.0;
  let 主导amp: string | null = null;
  for (const c of cands) if (c.v > amp) { amp = c.v; 主导amp = c.flag; }
  amp = clamp(amp, 1.0, AMP_CLAMP);

  return {
    successDelta: round2(net * DELTA_SCALE),
    severityScale: round2(amp),
    directionBias: net > DIR_EPS ? '↑' : net < -DIR_EPS ? '↓' : '中',
    rationale: { focus: focusCats, aptitude: round2(aptitude), timing: round2(timing), amp: round2(amp), 主导amp },
  };
}
