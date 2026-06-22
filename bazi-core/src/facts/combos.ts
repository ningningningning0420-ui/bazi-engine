import { STEM_WEIGHT, HIDDEN_WEIGHT, MONTH_BRANCH_MULT, STRONG_CUT, WEAK_CUT } from '../constants/weights';
import { category } from '../ten-gods';
import {
  SLOT_ORDER, type FourPillars, type DayMaster, type StrengthAnalysis, type StemRoots,
  type TenGod, type TenGodCategory, type PillarSlot, TEN_GODS,
} from '../types';

export const FORCE_REF = 2.0;
export const CTRL_REF = 2.0;
export const MIN_DEGREE = 0.1;
export const SHA_LIGHT = 1.5;
export const SHA_HEAVY = 3.0;
export const SECONDARY_RELIEF = 0.6;

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const ramp = (x: number, lo: number, hi: number): number => clamp01((x - lo) / (hi - lo));
const slotIdx = (s: PillarSlot): number => SLOT_ORDER.indexOf(s);
const isCategory = (t: TenGod | TenGodCategory): t is TenGodCategory =>
  !(TEN_GODS as readonly string[]).includes(t);

type GodsByCat = Record<TenGodCategory, TenGod[]>;
const GODS_BY_CAT: GodsByCat = (() => {
  const m: GodsByCat = { 比劫: [], 食伤: [], 财: [], 官杀: [], 印: [] };
  for (const g of TEN_GODS) m[category(g)].push(g);
  return m;
})();

export interface CombosHelpers {
  force: (g: TenGod) => number;
  categoryForce: (c: TenGodCategory) => number;
  fn: (x: number) => number;
  cp: (t: TenGod | TenGodCategory) => number;
  t: (g: TenGod) => number;
  catT: (c: TenGodCategory) => number;
  adj: (a: TenGod | TenGodCategory | '日', b: TenGod | TenGodCategory | '日') => number;
  bodyStrong01: (r: number) => number;
  bodyWeak01: (r: number) => number;
  isRevealed: (t: TenGod | TenGodCategory) => boolean;
  representativeSlot: (t: TenGod | TenGodCategory) => PillarSlot | null;
}

export function __combosHelpers(
  four: FourPillars, _dm: DayMaster, _strength: StrengthAnalysis, roots: StemRoots[],
): CombosHelpers {
  const present = SLOT_ORDER.filter((s) => four[s] !== null) as PillarSlot[];

  // ---- force / categoryForce（一次性算）+ 主位候选 ----
  const forceByGod = Object.fromEntries(TEN_GODS.map((g) => [g, 0])) as Record<TenGod, number>;
  const revealedSlots = Object.fromEntries(TEN_GODS.map((g) => [g, [] as PillarSlot[]])) as Record<TenGod, PillarSlot[]>;
  const hiddenContrib = Object.fromEntries(TEN_GODS.map((g) => [g, [] as { slot: PillarSlot; w: number }[]])) as Record<TenGod, { slot: PillarSlot; w: number }[]>;
  for (const slot of present) {
    const p = four[slot]!;
    if (slot !== '日') { forceByGod[p.ganGod] += STEM_WEIGHT; revealedSlots[p.ganGod].push(slot); }
    const mult = slot === '月' ? MONTH_BRANCH_MULT : 1.0;
    for (const h of p.hiddenStems) {
      const w = HIDDEN_WEIGHT[h.role] * mult;
      forceByGod[h.god] += w;
      hiddenContrib[h.god].push({ slot, w });
    }
  }
  const force = (g: TenGod): number => forceByGod[g];
  const categoryForce = (c: TenGodCategory): number => GODS_BY_CAT[c].reduce((a, g) => a + forceByGod[g], 0);
  const fn = (x: number): number => clamp01(x / FORCE_REF);
  const cp = (t: TenGod | TenGodCategory): number =>
    clamp01((isCategory(t) ? categoryForce(t) : force(t)) / CTRL_REF);

  // ---- transparencyFactor（纯离散梯度，不受月支倍率影响）----
  const transparencyByGod = Object.fromEntries(TEN_GODS.map((g) => [g, 0])) as Record<TenGod, number>;
  for (const g of TEN_GODS) {
    const rs = revealedSlots[g];
    if (rs.length > 0) {
      const rooted = rs.some((slot) => {
        const stem = four[slot]!.gan;
        const sr = roots.find((r) => r.slot === slot && r.stem === stem);
        return sr ? sr.hasRoot : false;
      });
      transparencyByGod[g] = rooted ? 1.0 : 0.7;
    } else {
      let benqi = false, zhongyu = false;
      for (const slot of present) {
        for (const h of four[slot]!.hiddenStems) {
          if (h.god === g) { if (h.role === '本气') benqi = true; else zhongyu = true; }
        }
      }
      transparencyByGod[g] = benqi ? 0.5 : zhongyu ? 0.3 : 0;
    }
  }
  const t = (g: TenGod): number => transparencyByGod[g];
  const catT = (c: TenGodCategory): number => Math.max(0, ...GODS_BY_CAT[c].map((g) => transparencyByGod[g]));

  const isRevealedGod = (g: TenGod): boolean => revealedSlots[g].length > 0;
  const isRevealed = (tg: TenGod | TenGodCategory): boolean =>
    isCategory(tg) ? GODS_BY_CAT[tg].some(isRevealedGod) : isRevealedGod(tg);

  const repSlotGod = (g: TenGod): PillarSlot | null => {
    if (revealedSlots[g].length > 0) {
      return [...revealedSlots[g]].sort((a, b) => slotIdx(a) - slotIdx(b))[0]!;
    }
    const hc = hiddenContrib[g];
    if (hc.length === 0) return null;
    let best = hc[0]!;
    for (const c of hc) if (c.w > best.w || (c.w === best.w && slotIdx(c.slot) < slotIdx(best.slot))) best = c;
    return best.slot;
  };
  const representativeSlot = (tg: TenGod | TenGodCategory): PillarSlot | null => {
    if (!isCategory(tg)) return repSlotGod(tg);
    const gods = GODS_BY_CAT[tg].filter((g) => repSlotGod(g) !== null);
    if (gods.length === 0) return null;
    gods.sort((a, b) => transparencyByGod[b] - transparencyByGod[a] || slotIdx(repSlotGod(a)!) - slotIdx(repSlotGod(b)!));
    return repSlotGod(gods[0]!);
  };

  const adj = (a: TenGod | TenGodCategory | '日', b: TenGod | TenGodCategory | '日'): number => {
    const slotOf = (x: TenGod | TenGodCategory | '日'): PillarSlot | null => (x === '日' ? '日' : representativeSlot(x));
    const sa = slotOf(a), sb = slotOf(b);
    if (sa === null || sb === null) return 0;
    const aHidden = a !== '日' && !isRevealed(a);
    const bHidden = b !== '日' && !isRevealed(b);
    if (aHidden && bHidden) return 0.4;
    const d = Math.abs(slotIdx(sa) - slotIdx(sb));
    return d === 0 ? 0.8 : d === 1 ? 1.0 : 0.5;
  };

  const bodyStrong01 = (r: number): number => clamp01((r - WEAK_CUT) / (STRONG_CUT - WEAK_CUT));
  const bodyWeak01 = (r: number): number => 1 - bodyStrong01(r);

  return { force, categoryForce, fn, cp, t, catT, adj, bodyStrong01, bodyWeak01, isRevealed, representativeSlot };
}
