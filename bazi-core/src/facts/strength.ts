import { GAN_WUXING, ZHI_WUXING, HIDDEN_STEMS, WU_XING, sheng, ke, shengMe, type WuXing } from '../constants/gan-zhi';
import { STEM_WEIGHT, HIDDEN_WEIGHT, MONTH_BRANCH_MULT, STRONG_CUT, WEAK_CUT } from '../constants/weights';
import { SLOT_ORDER, type FourPillars, type DayMaster, type StrengthAnalysis, type WangShuai, type TenGodCategory, type PillarSlot } from '../types';
import { analyzeRoots } from './roots';

/** 日主五行在月令五行下的旺相休囚死。 */
export function wangShuai(dmW: WuXing, monthW: WuXing): WangShuai {
  if (dmW === monthW) return '旺';
  if (sheng(monthW) === dmW) return '相'; // 月令生我
  if (sheng(dmW) === monthW) return '休'; // 我生月令
  if (ke(dmW) === monthW) return '囚';    // 我克月令
  return '死';                            // 月令克我
}

function scoreWuXing(four: FourPillars): Record<WuXing, number> {
  const score: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const slot of SLOT_ORDER) {
    const p = four[slot];
    if (!p) continue;
    score[p.ganWuXing] += STEM_WEIGHT;
    const mult = slot === '月' ? MONTH_BRANCH_MULT : 1.0;
    for (const h of HIDDEN_STEMS[p.zhi]) {
      score[GAN_WUXING[h.gan]] += HIDDEN_WEIGHT[h.role] * mult;
    }
  }
  return score;
}

export function analyzeStrength(
  four: FourPillars,
  dm: DayMaster,
  cats: Record<TenGodCategory, number>,
): StrengthAnalysis {
  const monthW = ZHI_WUXING[four.月!.zhi];
  const 月令旺衰 = wangShuai(dm.wuXing, monthW);
  const 得令 = 月令旺衰 === '旺' || 月令旺衰 === '相';

  const dmRoots = analyzeRoots(four, dm).find((r) => r.slot === '日')!;
  const positions = [...new Set(dmRoots.roots.map((r) => r.slot))] as PillarSlot[];
  const 得地 = { hasRoot: dmRoots.hasRoot, positions };

  const 得势 = { 印比数: cats.印 + cats.比劫 };

  const 五行得分 = scoreWuXing(four);
  const yin = shengMe(dm.wuXing);
  const support = 五行得分[dm.wuXing] + 五行得分[yin];
  const total = WU_XING.reduce((a, w) => a + 五行得分[w], 0);
  const drain = total - support;
  const 强弱比 = total === 0 ? 0.5 : support / total;

  let 身强弱: '身强' | '身弱' | '均衡';
  if (强弱比 >= STRONG_CUT) 身强弱 = '身强';
  else if (强弱比 <= WEAK_CUT) 身强弱 = '身弱';
  else 身强弱 = '均衡';
  const borderline = 强弱比 > WEAK_CUT && 强弱比 < STRONG_CUT;

  return { 月令旺衰, 得令, 得地, 得势, 五行得分, 同党: support, 异党: drain, 强弱比, 身强弱, borderline };
}
