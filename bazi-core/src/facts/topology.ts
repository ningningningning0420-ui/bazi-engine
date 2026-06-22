import { WU_XING, ZHI_WUXING, sheng, ke, shengMe, type WuXing, type Zhi } from '../constants/gan-zhi';
import { categoryOf } from '../ten-gods';
import type { RelationHit, EmergentTopology, ClashPair, TongGuanNode, FlowLevel } from '../types';

const PRESENT_SHARE = 0.05;
const ABSENT_ABS = 0.30;
const WEAK_SHARE = 0.08;
const FLOW_W_COV = 0.5;
const FLOW_W_CHAIN = 0.5;
const FLOW_LEVEL_CUTS: [number, number, number] = [0.75, 0.45, 0.2];
const CLASH_MIN_SHARE = 0.18;
const CLASH_BALANCE_RATIO = 0.5;
const DOMINANT_SHARE = 0.40;
const DOMINANT_RATIO = 2.2;
const ANNOTATE_RELATION_CROSS = true;

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round2 = (x: number): number => Math.round(x * 100) / 100;

export function buildEmergentTopology(
  S: Record<WuXing, number>,
  dmW: WuXing,
  relations: RelationHit[],
): EmergentTopology {
  const total = WU_XING.reduce((a, w) => a + S[w], 0);
  const share = (w: WuXing): number => (total === 0 ? 0 : S[w] / total);
  const mean = total / 5;
  const isPresent = (w: WuXing): boolean => share(w) >= PRESENT_SHARE;
  const isAbsent = (w: WuXing): boolean => S[w] < ABSENT_ABS;
  const isWeak = (w: WuXing): boolean => share(w) < WEAK_SHARE;

  const active = WU_XING.filter(isPresent);
  const presentRows = active;
  const n = active.length;
  const inActive = (w: WuXing): boolean => active.includes(w);

  // 流通度
  const flowEdges = active.filter((w) => inActive(sheng(w)));
  const linked = active.filter((w) => inActive(sheng(w)) || inActive(shengMe(w)));
  const coverage = n === 0 ? 0 : linked.length / n;
  const chainStrength = n <= 1 ? 0 : flowEdges.length / n;
  const flow = round2(FLOW_W_COV * coverage + FLOW_W_CHAIN * chainStrength);
  const flowLevel: FlowLevel =
    flow >= FLOW_LEVEL_CUTS[0] ? '畅' : flow >= FLOW_LEVEL_CUTS[1] ? '通' : flow >= FLOW_LEVEL_CUTS[2] ? '滞' : '阻';
  const breaks = active
    .filter((w) => !isPresent(sheng(w)))
    .map((w) => ({ at: w, type: '无泄' as const, detail: `${w}生${sheng(w)}，但${sheng(w)}不在场（能量无处宣泄）` }));

  // 成环
  const isFullCycle = WU_XING.every(isPresent);
  let longestChain: { path: WuXing[]; len: number };
  if (isFullCycle) {
    longestChain = { path: ['木', '火', '土', '金', '水'], len: 5 };
  } else {
    let best: { path: WuXing[]; len: number } = { path: [], len: 0 };
    for (const head of active.filter((w) => !inActive(shengMe(w)))) {
      const path: WuXing[] = [head];
      let cur = head;
      while (inActive(sheng(cur)) && !path.includes(sheng(cur))) {
        cur = sheng(cur);
        path.push(cur);
      }
      if (path.length > best.len) best = { path, len: path.length };
    }
    longestChain = best;
  }

  // 相战对 + 通关清点（5 固定克对 ke(A)===B）
  const clashes: ClashPair[] = [];
  const tongGuanReport: TongGuanNode[] = [];
  for (const A of WU_XING) {
    const B = ke(A);
    const X = sheng(A); // 通关神：A生X、X生B
    const bothStrong = share(A) >= CLASH_MIN_SHARE && share(B) >= CLASH_MIN_SHARE;
    const mn = Math.min(S[A], S[B]);
    const mx = Math.max(S[A], S[B]);
    const balanced = mx > 0 && mn / mx >= CLASH_BALANCE_RATIO;
    const 势均 = bothStrong && balanced;
    const hasTongGuan = isPresent(X) && !isWeak(X);

    const relevant = 势均;
    const status: TongGuanNode['status'] = isPresent(X) && relevant ? '调和中' : !isPresent(X) && relevant ? '缺位待补' : '无关';
    tongGuanReport.push({
      forClash: [A, B], node: X, present: isPresent(X), score: round2(S[X]), relevant, status,
      detail: `${A}克${B}的通关神=${X}（${status}）`,
    });

    if (势均 && !hasTongGuan) {
      const 势均度 = mx === 0 ? 0 : mn / mx;
      const 弱方 = S[A] <= S[B] ? A : B;
      const relief = isPresent(X) ? clamp01(share(弱方) === 0 ? 0 : share(X) / share(弱方)) : 0;
      const intensity = round2(势均度 * (1 - relief));
      let detail = `${A}${B}相战（各占 ${round2(share(A))}/${round2(share(B))}），通关神${X}${isPresent(X) ? '过弱' : '缺位'}`;
      if (ANNOTATE_RELATION_CROSS) {
        const crossed = relations.some(
          (r) => (r.类型 === '六冲' || r.类型 === '三刑') &&
            (() => {
              const ws = r.members.map((m) => ZHI_WUXING[m.value as Zhi]).filter(Boolean);
              return ws.includes(A) && ws.includes(B);
            })(),
        );
        if (crossed) detail += '（地支亦冲）';
      }
      clashes.push({
        pair: [A, B], 克: A, 受: B, scores: [round2(S[A]), round2(S[B])],
        tongGuanShen: X, tongGuanPresent: isPresent(X), tongGuanScore: round2(S[X]), intensity, detail,
      });
    }
  }

  // 独旺 / 独缺
  const dominant = WU_XING.filter((w) => {
    const meanOthers = (total - S[w]) / 4;
    return share(w) >= DOMINANT_SHARE || (meanOthers > 0 && S[w] >= DOMINANT_RATIO * meanOthers);
  }).map((w) => ({
    wuXing: w, score: round2(S[w]), share: round2(share(w)),
    multipleOfMean: round2(mean === 0 ? 0 : S[w] / mean), detail: `${w}独旺（占 ${round2(share(w))}）`,
  }));
  const missing = WU_XING.filter(isAbsent).map((w) => ({
    wuXing: w, score: round2(S[w]), 类别: categoryOf(w, dmW), detail: `${w}（${categoryOf(w, dmW)}）缺位`,
  }));

  const caveats: string[] = [];
  if (total === 0) caveats.push('五行得分全零（异常输入）。');

  return {
    flow, flowLevel, coverage: round2(coverage), chainStrength: round2(chainStrength), breaks,
    isFullCycle, cyclePresent: active, longestChain, clashes, tongGuanReport, dominant, missing, presentRows, caveats,
  };
}
