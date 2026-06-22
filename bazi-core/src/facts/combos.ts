import { STEM_WEIGHT, HIDDEN_WEIGHT, MONTH_BRANCH_MULT, STRONG_CUT, WEAK_CUT } from '../constants/weights';
import { category } from '../ten-gods';
import {
  SLOT_ORDER, type FourPillars, type DayMaster, type StrengthAnalysis, type StemRoots,
  type TenGod, type TenGodCategory, type PillarSlot, TEN_GODS,
  type ComboHit, type ComboMember, type ComboPolarity, type GodComboKind,
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

const round2 = (x: number): number => Math.round(x * 100) / 100;

const COMBO_ORDER: GodComboKind[] = [
  '伤官见官', '伤官配印', '食神制杀', '财滋弱杀', '财多身弱', '印重身旺',
  '杀重无制', '杀印相生', '食伤生财', '比劫夺财', '官印相生', '伤官生财',
];
const NEI_HAN_MAODUN = new Set<GodComboKind>(['伤官见官', '财多身弱', '杀重无制', '印重身旺']);
const POLARITY: Record<GodComboKind, ComboPolarity> = {
  伤官见官: '凶向', 财滋弱杀: '凶向', 财多身弱: '凶向', 印重身旺: '凶向', 杀重无制: '凶向', 比劫夺财: '凶向',
  伤官配印: '吉向', 食神制杀: '吉向', 杀印相生: '吉向', 食伤生财: '吉向', 官印相生: '吉向', 伤官生财: '吉向',
};

/** 十神成立组合：连续成立度 = gate×Π(透藏×旺衰×相邻×制化)，制化引入第三方（抗查表）。 */
export function detectGodCombos(
  four: FourPillars, dm: DayMaster, strength: StrengthAnalysis, roots: StemRoots[],
): ComboHit[] {
  const H = __combosHelpers(four, dm, strength, roots);
  const { force, categoryForce: cf, fn, cp, t, catT, adj, bodyStrong01, bodyWeak01 } = H;
  const r = strength.强弱比;
  const bw = bodyWeak01(r), bs = bodyStrong01(r);
  const gate = (b: boolean): number => (b ? 1 : 0);

  const raw: Partial<Record<GodComboKind, number>> = {};
  const zh: Partial<Record<GodComboKind, number>> = {};
  const snap: Partial<Record<GodComboKind, Record<string, number>>> = {};
  const mem: Partial<Record<GodComboKind, ComboMember[]>> = {};

  const put = (k: GodComboKind, gateB: boolean, 透藏: number, 旺衰: number, 相邻: number, 制化: number,
               members: ComboMember[], extraSnap: Record<string, number> = {}): void => {
    const d = gate(gateB) * 透藏 * 旺衰 * 相邻 * 制化;
    raw[k] = d; zh[k] = 制化; mem[k] = members;
    snap[k] = { 制化系数: 制化, 原始成立度: d, ...extraSnap };
  };
  const M = (十神: TenGod | TenGodCategory, f: number, tr: number): ComboMember => ({ 十神, force: f, transparency: tr });

  // #1 伤官见官（必先算，缓存 raw 供 #11）
  put('伤官见官', force('伤官') > 0 && force('正官') > 0,
    Math.min(t('伤官'), t('正官')), Math.min(fn(force('伤官')), fn(force('正官'))), adj('伤官', '正官'),
    1 - cp('印'),
    [M('伤官', force('伤官'), t('伤官')), M('正官', force('正官'), t('正官'))]);
  // #2 伤官配印
  put('伤官配印', force('伤官') > 0 && cf('印') > 0,
    Math.min(t('伤官'), catT('印')), Math.min(fn(force('伤官')), fn(cf('印'))), adj('伤官', '印'),
    1 - cp('财'),
    [M('伤官', force('伤官'), t('伤官')), M('印', cf('印'), catT('印'))]);
  // #3 食神制杀
  put('食神制杀', force('食神') > 0 && force('七杀') > 0,
    Math.min(t('食神'), t('七杀')), Math.min(fn(force('食神')), fn(force('七杀'))), adj('食神', '七杀'),
    1 - cp('偏印') * (1 - cp('财')),
    [M('食神', force('食神'), t('食神')), M('七杀', force('七杀'), t('七杀'))]);
  // #4 财滋弱杀
  put('财滋弱杀', cf('财') > 0 && force('七杀') > 0,
    Math.min(catT('财'), t('七杀')), Math.min(fn(cf('财')), fn(force('七杀'))) * bw, adj('财', '七杀'),
    1 - cp('印'),
    [M('财', cf('财'), catT('财')), M('七杀', force('七杀'), t('七杀'))], { bodyWeak01: bw });
  // #5 财多身弱
  put('财多身弱', cf('财') > 0,
    catT('财'), fn(cf('财')) * bw, adj('财', '日'),
    1 - cp('印') * (1 - cp('财')),
    [M('财', cf('财'), catT('财'))], { bodyWeak01: bw });
  // #6 印重身旺
  put('印重身旺', cf('印') > 0,
    catT('印'), fn(cf('印')) * bs, adj('印', '日'),
    1 - Math.max(cp('财'), cp('食伤') * (1 - cp('印'))),
    [M('印', cf('印'), catT('印'))], { bodyStrong01: bs });
  // #7 杀重无制
  put('杀重无制', force('七杀') > 0,
    t('七杀'), ramp(force('七杀'), SHA_LIGHT, SHA_HEAVY), adj('七杀', '日'),
    (1 - cp('食伤')) * (1 - cp('印')),
    [M('七杀', force('七杀'), t('七杀'))]);
  // #8 杀印相生
  put('杀印相生', force('七杀') > 0 && cf('印') > 0,
    Math.min(t('七杀'), catT('印')), Math.min(fn(force('七杀')), fn(cf('印'))), adj('七杀', '印'),
    1 - Math.max(cp('财'), cp('食伤') * (1 - cp('印'))),
    [M('七杀', force('七杀'), t('七杀')), M('印', cf('印'), catT('印'))]);
  // #9 食伤生财
  put('食伤生财', cf('食伤') > 0 && cf('财') > 0,
    Math.min(catT('食伤'), catT('财')), Math.min(fn(cf('食伤')), fn(cf('财'))), adj('食伤', '财'),
    1 - cp('印'),
    [M('食伤', cf('食伤'), catT('食伤')), M('财', cf('财'), catT('财'))]);
  // #10 比劫夺财
  put('比劫夺财', cf('比劫') > 0 && cf('财') > 0,
    Math.min(catT('比劫'), catT('财')), Math.min(fn(cf('比劫')), fn(cf('财'))) * bs, adj('比劫', '财'),
    1 - Math.max(cp('官杀'), SECONDARY_RELIEF * cp('食伤')),
    [M('比劫', cf('比劫'), catT('比劫')), M('财', cf('财'), catT('财'))], { bodyStrong01: bs });
  // #11 官印相生（读 #1 raw degree 抑制）
  put('官印相生', force('正官') > 0 && cf('印') > 0,
    Math.min(t('正官'), catT('印')), Math.min(fn(force('正官')), fn(cf('印'))), adj('正官', '印'),
    1 - (raw['伤官见官'] ?? 0),
    [M('正官', force('正官'), t('正官')), M('印', cf('印'), catT('印'))]);
  // #12 伤官生财
  put('伤官生财', force('伤官') > 0 && cf('财') > 0,
    Math.min(t('伤官'), catT('财')), Math.min(fn(force('伤官')), fn(cf('财'))), adj('伤官', '财'),
    1 - cp('印'),
    [M('伤官', force('伤官'), t('伤官')), M('财', cf('财'), catT('财'))]);

  return COMBO_ORDER
    .filter((k) => (raw[k] ?? 0) >= MIN_DEGREE)
    .map((k): ComboHit => ({
      类型: k, 成立程度: round2(raw[k]!), 极性: POLARITY[k], 内含矛盾: NEI_HAN_MAODUN.has(k),
      members: mem[k]!, 力量快照: snap[k]!,
      说明键: `${k}·${mem[k]!.map((m) => `${m.十神}${round2(m.force)}`).join('·')}·制化${round2(zh[k]!)}`,
    }))
    .sort((a, b) => b.成立程度 - a.成立程度 || COMBO_ORDER.indexOf(a.类型) - COMBO_ORDER.indexOf(b.类型));
}
