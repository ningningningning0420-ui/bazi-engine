import {
  DIZHI_LIUHE, DIZHI_SANHE, DIZHI_SANHUI, DIZHI_LIUCHONG, DIZHI_LIUHAI,
  DIZHI_SANXING_TRIPLE, DIZHI_XING_PAIR,
} from '../facts/relations';
import { SLOT_ORDER, type FourPillars, type LuckPillars, type Grain, type Pillar } from '../types';
import type { Zhi, WuXing } from '../constants/gan-zhi';

export type CrossKind = '六合' | '三合' | '三会' | '六冲' | '六害' | '三刑';
export interface CrossRelation { 类型: CrossKind; 流运: Grain; 流运支: Zhi; 化五行: WuXing | null; }

const GRAIN_KEYS: [Grain, keyof LuckPillars][] = [['大运', '大运'], ['流年', '流年'], ['流月', '流月'], ['流日', '流日']];

/** 跨柱关系检测：流运支 vs 原局支（复用 relations.ts 表·非 detectRelations[硬绑4柱]）。 */
export function crossRelations(four: FourPillars, luck: LuckPillars): CrossRelation[] {
  const natalZhi = SLOT_ORDER.filter((s) => four[s] !== null).map((s) => (four[s] as Pillar).zhi);
  const out: CrossRelation[] = [];
  for (const [grain, key] of GRAIN_KEYS) {
    const p = luck[key] as Pillar | null;
    if (!p) continue;
    const lz = p.zhi;
    for (const [a, b, hua] of DIZHI_LIUHE) {
      if ((lz === a && natalZhi.includes(b)) || (lz === b && natalZhi.includes(a)))
        out.push({ 类型: '六合', 流运: grain, 流运支: lz, 化五行: hua });
    }
    for (const [a, b] of DIZHI_LIUCHONG) {
      if ((lz === a && natalZhi.includes(b)) || (lz === b && natalZhi.includes(a)))
        out.push({ 类型: '六冲', 流运: grain, 流运支: lz, 化五行: null });
    }
    for (const [a, b] of DIZHI_LIUHAI) {
      if ((lz === a && natalZhi.includes(b)) || (lz === b && natalZhi.includes(a)))
        out.push({ 类型: '六害', 流运: grain, 流运支: lz, 化五行: null });
    }
    for (const tri of DIZHI_SANXING_TRIPLE) {
      if (tri.includes(lz) && tri.filter((z) => z !== lz).every((z) => natalZhi.includes(z)))
        out.push({ 类型: '三刑', 流运: grain, 流运支: lz, 化五行: null });
    }
    for (const [a, b] of DIZHI_XING_PAIR) {
      if ((lz === a && natalZhi.includes(b)) || (lz === b && natalZhi.includes(a)))
        out.push({ 类型: '三刑', 流运: grain, 流运支: lz, 化五行: null });
    }
    for (const [k, table] of [['三合', DIZHI_SANHE], ['三会', DIZHI_SANHUI]] as const) {
      for (const row of table) {
        const trip = [row[0], row[1], row[2]] as Zhi[];
        if (trip.includes(lz) && trip.filter((z) => z !== lz).every((z) => natalZhi.includes(z)))
          out.push({ 类型: k, 流运: grain, 流运支: lz, 化五行: row[3] });
      }
    }
  }
  return out;
}
