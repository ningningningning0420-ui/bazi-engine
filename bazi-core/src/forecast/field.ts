import { GAN_WUXING, HIDDEN_STEMS, ZHI_WUXING, WU_XING, ke, type WuXing, type Zhi } from '../constants/gan-zhi';
import { STEM_WEIGHT, HIDDEN_WEIGHT } from '../constants/weights';
import {
  SLOT_ORDER, type ChartFacts, type LuckPillars, type FieldResult, type FieldAction,
  type Pillar, type Grain, type Intensity,
} from '../types';
import { crossRelations } from './field-relations';

export const GRAIN_WEIGHT: Record<Grain, number> = { 大运: 0.5, 流年: 1.0, 流月: 0.5, 流日: 0.3 };
export const HUA_TRANSFER = 0.3;
export const CHONG_LOSS = 0.4;
export const INTENSITY_MID = 0.5;
export const INTENSITY_HIGH = 1.5;

const round2 = (x: number): number => Math.round(x * 100) / 100;
const GRAIN_KEYS: [Grain, keyof LuckPillars][] = [['大运', '大运'], ['流年', '流年'], ['流月', '流月'], ['流日', '流日']];
const intensityOf = (mag: number): Intensity => (mag < INTENSITY_MID ? '微' : mag < INTENSITY_HIGH ? '中' : '显');

const CHONG_PAIRS: [Zhi, Zhi][] = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
const isChong = (a: Zhi, b: Zhi): boolean => CHONG_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

/** 力量场 + 关系算子 reducer（合化/冲·贪合忘冲）+ 净吉凶=Σ(Δfield×favorSign) + rawFlags（两通道）。 */
export function perturbField(facts: ChartFacts, luck: LuckPillars): FieldResult {
  const favorSign = facts.分析.用神.favorSign;
  const monthBenQi = ZHI_WUXING[facts.四柱.月.zhi]; // 化神当令判据=原局月令本气五行
  const Δfield: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const 作用: FieldAction[] = [];

  // base 注入（记录每流运支注入的本气力量·供合化转移）
  const benQiInject: { grain: Grain; zhi: Zhi; w: WuXing; force: number }[] = [];
  for (const [grain, key] of GRAIN_KEYS) {
    const p = luck[key] as Pillar | null;
    if (!p) continue;
    const w = GRAIN_WEIGHT[grain];
    Δfield[GAN_WUXING[p.gan]] += STEM_WEIGHT * w;
    for (const h of HIDDEN_STEMS[p.zhi]) Δfield[GAN_WUXING[h.gan]] += HIDDEN_WEIGHT[h.role] * w;
    benQiInject.push({ grain, zhi: p.zhi, w: ZHI_WUXING[p.zhi], force: HIDDEN_WEIGHT['本气'] * w });
  }

  // 算子 reducer（贪合忘冲：合优先于冲·合消费即绊）
  const rels = crossRelations(facts.四柱, luck);
  for (const inj of benQiInject) {
    const myRels = rels.filter((r) => r.流运 === inj.grain && r.流运支 === inj.zhi);
    const he = myRels.find((r) => r.类型 === '六合' || r.类型 === '三合' || r.类型 === '三会');
    if (he) {
      if (he.化五行 !== null && he.化五行 === monthBenQi) {
        const t = inj.force * HUA_TRANSFER;
        Δfield[inj.w] -= t; Δfield[he.化五行] += t;
        作用.push({ 类型: '合化', 对象: `${inj.zhi}化${he.化五行}`, 强度: intensityOf(t) });
      } else {
        作用.push({ 类型: '合化', 对象: `${inj.zhi}合绊`, 强度: '微' });
      }
      continue; // 合绊 → 不再冲
    }
    const chong = myRels.find((r) => r.类型 === '六冲');
    if (chong) {
      const loss = Δfield[inj.w] * CHONG_LOSS;
      Δfield[inj.w] -= loss;
      作用.push({ 类型: '刑冲', 对象: `${inj.zhi}冲`, 强度: intensityOf(loss) });
    }
    const xinghai = myRels.find((r) => r.类型 === '六害' || r.类型 === '三刑');
    if (xinghai) 作用.push({ 类型: '刑冲', 对象: `${inj.zhi}${xinghai.类型}`, 强度: '微' });
  }

  // 输出前 round Δfield，净吉凶从输出 Δfield 派生（保持一致+可复现）
  for (const w of WU_XING) Δfield[w] = round2(Δfield[w]);
  // 引动用神/忌神/生扶（读输出 Δfield）
  for (const w of WU_XING) {
    if (Δfield[w] > INTENSITY_MID) {
      const k = favorSign[w] > 0 ? '引动用神' : favorSign[w] < 0 ? '引动忌神' : '生扶';
      作用.push({ 类型: k, 对象: w, 强度: intensityOf(Δfield[w]) });
    }
  }
  const 净吉凶 = round2(WU_XING.reduce((a, w) => a + Δfield[w] * favorSign[w], 0));

  // rawFlags（基准集=原局四柱+大运·查流年·只缩放烈度不改 Δfield）
  const rawFlags = { 反吟: false, 伏吟: false, 岁运并临: false };
  const ly = luck.流年;
  const basis: Pillar[] = SLOT_ORDER.filter((s) => facts.四柱[s] !== null).map((s) => facts.四柱[s] as Pillar);
  if (luck.大运) basis.push(luck.大运);
  for (const p of basis) {
    if (p.gan === ly.gan && p.zhi === ly.zhi) rawFlags.伏吟 = true;
    if (ke(GAN_WUXING[ly.gan]) === GAN_WUXING[p.gan] && isChong(ly.zhi, p.zhi)) rawFlags.反吟 = true;
  }
  if (luck.大运 && luck.大运.gan === ly.gan && luck.大运.zhi === ly.zhi) rawFlags.岁运并临 = true;

  return { Δfield, 净吉凶, 作用, rawFlags };
}
