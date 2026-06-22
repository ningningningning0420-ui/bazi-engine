import { keMe, sheng, ke, type WuXing } from '../constants/gan-zhi';
import { categoryOf } from '../ten-gods';
import type { StrengthAnalysis, EmergentTopology, CongSignal, TenGodCategory } from '../types';

const CONG_WEAK_RATIO = 0.10;
const CONG_STRONG_RATIO = 0.90;
const CONG_GUANSHA_MIN = 0.5;
const WUXING_TIE: WuXing[] = ['木', '火', '土', '金', '水'];
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round2 = (x: number): number => Math.round(x * 100) / 100;
const ZHUANWANG: Record<WuXing, string> = { 木: '曲直格', 火: '炎上格', 土: '稼穑格', 金: '从革格', 水: '润下格' };
const CONG_ER: Partial<Record<TenGodCategory, string>> = { 食伤: '从儿', 财: '从财', 官杀: '从杀' };

/** 从强/从弱信号（只信号不定论，最终是否从格交 LLM）。 */
export function buildCongSignal(strength: StrengthAnalysis, _topology: EmergentTopology, dmW: WuXing): CongSignal {
  const r = strength.强弱比;
  const S = strength.五行得分;
  const 触发项: string[] = [];
  const 反例: string[] = [];
  let 候选: CongSignal['候选'] = null;

  const congWeakRaw = r <= CONG_WEAK_RATIO && !strength.得令;
  const congStrongRaw = r >= CONG_STRONG_RATIO && strength.得令;

  if (congWeakRaw) {
    if (strength.得地.hasRoot) {
      反例.push('日主有根(得地)，假从');
    } else {
      候选 = '从弱';
      // 异党 dominant 类别（食伤/财/官杀 五行得分最高；并列按 WUXING_TIE 定序）
      const drainW: WuXing[] = [sheng(dmW), ke(dmW), keMe(dmW)]; // 食伤/财/官杀 五行
      let best = drainW[0]!;
      for (const w of drainW) {
        if (S[w] > S[best] || (S[w] === S[best] && WUXING_TIE.indexOf(w) < WUXING_TIE.indexOf(best))) best = w;
      }
      const label = CONG_ER[categoryOf(best, dmW)];
      if (label) 触发项.push(label);
    }
  } else if (congStrongRaw) {
    if (S[keMe(dmW)] >= CONG_GUANSHA_MIN) {
      反例.push('盘中官杀克身，非真专旺');
    } else {
      候选 = '从强';
      触发项.push(ZHUANWANG[dmW]);
    }
  }

  const 强度 = 候选 ? round2(clamp01(Math.abs(r - 0.5) * 2)) : 0;
  return { 候选, 强度, 触发项, 反例 };
}
