import { WU_XING, sheng, ke, shengMe, keMe, type WuXing } from '../constants/gan-zhi';
import { categoryOf } from '../ten-gods';
import type {
  FourPillars, DayMaster, StrengthAnalysis, RelationHit,
  EmergentTopology, ClimateResult, FavorResult, Pentad,
} from '../types';

const WUXING_TIE_ORDER: readonly WuXing[] = ['木', '火', '土', '金', '水'];
const tieIdx = (w: WuXing): number => WUXING_TIE_ORDER.indexOf(w);

/** 在 cands 中按得分取最高，并列按 tieOrder 先后。 */
function pickMaxByScore(cands: WuXing[], S: Record<WuXing, number>, tieOrder: readonly WuXing[]): WuXing {
  const ord = (w: WuXing): number => { const i = tieOrder.indexOf(w); return i < 0 ? 99 : i; };
  let best = cands[0]!;
  for (const w of cands) {
    if (S[w] > S[best] || (S[w] === S[best] && ord(w) < ord(best))) best = w;
  }
  return best;
}

/**
 * 用神 favorSign —— L3/L4 一切吉凶的唯一真相源。100% 确定性，borderline 也唯一。
 * topology / climate 必传（焊死单一真相源，favor 不持任何相战/调候阈值）。
 */
export function analyzeFavor(
  _four: FourPillars,
  dm: DayMaster,
  strength: StrengthAnalysis,
  _relations: RelationHit[],
  topology: EmergentTopology,
  climate: ClimateResult,
): FavorResult {
  const S = strength.五行得分;
  const dmW = dm.wuXing;
  const yinW = shengMe(dmW);      // 印
  const bijieW = dmW;             // 比劫
  const shishangW = sheng(dmW);   // 食伤
  const caiW = ke(dmW);           // 财
  const guanshaW = keMe(dmW);     // 官杀
  const same: WuXing[] = [yinW, bijieW];
  const drain: WuXing[] = [shishangW, caiW, guanshaW];

  // §1 扶抑层（基线喜忌 + 扶抑主用神候选）
  const 喜 = new Set<WuXing>();
  const 忌 = new Set<WuXing>();
  let fuyiMain: WuXing | null = null;
  if (strength.身强弱 === '身弱') {
    same.forEach((w) => 喜.add(w)); drain.forEach((w) => 忌.add(w));
    fuyiMain = same.every((w) => S[w] === 0) ? yinW : pickMaxByScore(same, S, [yinW, bijieW]);
  } else if (strength.身强弱 === '身强') {
    drain.forEach((w) => 喜.add(w)); same.forEach((w) => 忌.add(w));
    fuyiMain = drain.every((w) => S[w] === 0) ? guanshaW : pickMaxByScore(drain, S, [guanshaW, caiW, shishangW]);
  }

  // §2 调候层（只读 climate）
  const tiaohou = { 需: climate.调候提示[0] ?? null, 级别: climate.级别 };
  // §3 通关层（只读 topology.clashes）
  const 战对 = topology.clashes;
  const tongguanNeeds = 战对.map((c) => c.tongGuanShen);

  // §4 汇总 + 冲突化解
  if (tiaohou.需) 喜.add(tiaohou.需);
  tongguanNeeds.forEach((m) => 喜.add(m));
  if (tiaohou.需 && 忌.has(tiaohou.需)) {
    if (tiaohou.级别 === 'critical') { 忌.delete(tiaohou.需); }
    else if (tiaohou.级别 === 'adjust') { 忌.delete(tiaohou.需); 喜.delete(tiaohou.需); } // 降为闲
  }
  tongguanNeeds.forEach((m) => { if (忌.has(m)) 忌.delete(m); }); // 通关 mid 保留进喜

  // §5 主用神唯一决策树
  let 主用神: WuXing;
  let 来源: FavorResult['来源'];
  if (tiaohou.级别 === 'critical' && tiaohou.需) {
    主用神 = tiaohou.需; 来源 = '调候';
  } else if (战对.length > 0) {
    let best = 战对[0]!;
    for (const c of 战对) {
      if (S[c.受] > S[best.受] || (S[c.受] === S[best.受] && tieIdx(c.受) < tieIdx(best.受))) best = c;
    }
    主用神 = best.tongGuanShen; 来源 = '通关';
  } else if (tiaohou.级别 === 'adjust' && tiaohou.需) {
    主用神 = tiaohou.需; 来源 = '调候';
  } else if (strength.身强弱 !== '均衡' && fuyiMain) {
    主用神 = fuyiMain; 来源 = '扶抑';
  } else {
    // balancedFallback：克最旺行
    const maxW = pickMaxByScore([...WU_XING], S, WUXING_TIE_ORDER);
    主用神 = keMe(maxW);
    喜.add(shengMe(主用神));
    忌.add(maxW); 忌.add(shengMe(maxW));
    来源 = '均衡兜底';
  }
  喜.add(主用神); 忌.delete(主用神);

  // §6 favorSign 赋值
  const favorSign: Record<WuXing, Pentad> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  喜.forEach((w) => { favorSign[w] = 1; });
  favorSign[主用神] = 2;
  忌.forEach((w) => { if (favorSign[w] === 0) favorSign[w] = -1; });
  // pickChou（仇神）
  const chouCand = [...忌].filter((w) => favorSign[w] <= 0);
  let chou: WuXing | null = null;
  const km = keMe(主用神);
  if (chouCand.includes(km)) chou = km;
  else if (chouCand.length > 0) chou = pickMaxByScore(chouCand, S, WUXING_TIE_ORDER);
  if (chou && favorSign[chou] <= 0) favorSign[chou] = -2;

  // §7 输出
  const 喜Out = WU_XING.filter((w) => favorSign[w] > 0).sort((a, b) => favorSign[b] - favorSign[a] || tieIdx(a) - tieIdx(b));
  const 忌Out = WU_XING.filter((w) => favorSign[w] < 0).sort((a, b) => favorSign[a] - favorSign[b] || tieIdx(a) - tieIdx(b));

  return {
    流派: '扶抑为主+调候补',
    主用神, 来源,
    喜: 喜Out, 忌: 忌Out,
    用神十神: [categoryOf(主用神, dmW)],
    favorSign,
    调候: { 需: tiaohou.需, 级别: tiaohou.级别 },
    通关: { 需: tongguanNeeds, 战对: 战对.map((c) => ({ 克: c.克, 受: c.受, 通关神: c.tongGuanShen })) },
  };
}
