import { categoryOf } from '../ten-gods';
import type {
  EmergentTopology, ComboHit, TensionResult, TensionAxis, SameSourcePoint,
  TenGodCategory, GodComboKind, WuXing,
} from '../types';

const AXIS_MIN_DEGREE = 0.3;
const AXIS_RELIEF = 0.6;
const AXIS_KEEP_MIN = 0.2;
const RELIEF_GATE = 0.7;
const round2 = (x: number): number => Math.round(x * 100) / 100;

const CAT_ORDER: TenGodCategory[] = ['比劫', '食伤', '财', '官杀', '印'];
const pairKey = (a: TenGodCategory, b: TenGodCategory): string =>
  [a, b].sort((x, y) => CAT_ORDER.indexOf(x) - CAT_ORDER.indexOf(y)).join('×');
const PAIR_AXIS: Record<string, { 轴名: string; 两极: [string, string] }> = {
  [pairKey('财', '比劫')]: { 轴名: '占有vs分享', 两极: ['占有', '分享'] },
  [pairKey('官杀', '食伤')]: { 轴名: '权威vs才华', 两极: ['权威', '才华'] },
  [pairKey('印', '财')]: { 轴名: '守成vs进取', 两极: ['守成', '进取'] },
  [pairKey('比劫', '官杀')]: { 轴名: '自主vs受制', 两极: ['自主', '受制'] },
  [pairKey('食伤', '印')]: { 轴名: '表达vs内省', 两极: ['表达', '内省'] },
};
const MAODUN_AXIS: Partial<Record<GodComboKind, { 轴名: string; 两极: [string, string] }>> = {
  伤官见官: { 轴名: '才华锋芒vs规则权威', 两极: ['恃才放旷', '守序服从'] },
  财多身弱: { 轴名: '欲望vs承载力', 两极: ['贪取扩张', '力不能及'] },
  杀重无制: { 轴名: '压力/野心vs失控', 两极: ['进取担当', '被压垮'] },
  印重身旺: { 轴名: '庇护vs依赖', 两极: ['厚学多受', '迟滞被动'] },
};

/** 矛盾张力轴：从相战对 + 内含矛盾组合派生，读 combos/clashes 不重算成立度。 */
export function buildTension(topology: EmergentTopology, combos: ComboHit[], dmW: WuXing): TensionResult {
  const axes: TensionAxis[] = [];
  const 优缺同源点: SameSourcePoint[] = [];

  // X1 相战对
  for (const c of topology.clashes) {
    const a = categoryOf(c.克, dmW), b = categoryOf(c.受, dmW);
    const def = PAIR_AXIS[pairKey(a, b)];
    if (def) axes.push({ 轴名: def.轴名, 来源类型: '相战', 来源cite: `${c.克}${c.受}相战`, 两极: def.两极, 张力强度: c.intensity, 优缺同源: false });
  }
  // X2 内含矛盾派生
  for (const c of combos) {
    if (!c.内含矛盾 || c.成立程度 <= AXIS_MIN_DEGREE) continue;
    const def = MAODUN_AXIS[c.类型];
    if (!def) continue;
    const 有制化 = (c.力量快照['制化系数'] ?? 1) <= RELIEF_GATE;
    const 张力强度 = c.成立程度 * (有制化 ? AXIS_RELIEF : 1.0);
    axes.push({ 轴名: def.轴名, 来源类型: '内含矛盾', 来源cite: c.类型, 两极: def.两极, 张力强度, 优缺同源: true });
    优缺同源点.push({ 结构cite: c.类型, 同一来源: c.类型, 正面表述: def.两极[0], 负面表述: def.两极[1] });
  }
  // X2 反向共存（杀印相生 + 伤官见官 → 元张力）
  const sps = combos.find((c) => c.类型 === '杀印相生');
  const sgjg = combos.find((c) => c.类型 === '伤官见官');
  if (sps && sgjg) {
    axes.push({ 轴名: '化解vs冲突', 来源类型: '元张力', 来源cite: '杀印相生+伤官见官', 两极: ['疏导整合', '内在冲突'], 张力强度: Math.min(sps.成立程度, sgjg.成立程度), 优缺同源: false });
  }
  // X4 去重(同名取 max) + 排序 + 丢弱
  const byName = new Map<string, TensionAxis>();
  for (const ax of axes) {
    const cur = byName.get(ax.轴名);
    if (!cur || ax.张力强度 > cur.张力强度) byName.set(ax.轴名, ax);
  }
  const 矛盾张力轴 = [...byName.values()]
    .filter((ax) => ax.张力强度 >= AXIS_KEEP_MIN)
    .sort((a, b) => b.张力强度 - a.张力强度 || a.轴名.localeCompare(b.轴名))
    .map((ax) => ({ ...ax, 张力强度: round2(ax.张力强度) }));
  return { 矛盾张力轴, 优缺同源点 };
}
