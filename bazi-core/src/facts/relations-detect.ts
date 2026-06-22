import {
  TIANGAN_WUHE, DIZHI_LIUHE, DIZHI_SANHE, DIZHI_SANHUI,
  DIZHI_LIUCHONG, DIZHI_LIUHAI, DIZHI_SANXING_TRIPLE, DIZHI_XING_PAIR, DIZHI_ZIXING,
} from './relations';
import { SLOT_ORDER, type FourPillars, type RelationHit, type RelationKind, type PillarSlot } from '../types';
import type { Gan, Zhi } from '../constants/gan-zhi';

interface GanSite { slot: PillarSlot; value: Gan; }
interface ZhiSite { slot: PillarSlot; value: Zhi; }

function adjacency(slots: PillarSlot[]): boolean {
  const idxs = slots.map((s) => SLOT_ORDER.indexOf(s)).sort((a, b) => a - b);
  return idxs[idxs.length - 1]! - idxs[0]! === idxs.length - 1;
}

export function detectRelations(four: FourPillars): RelationHit[] {
  const hits: RelationHit[] = [];
  const gans: GanSite[] = [];
  const zhis: ZhiSite[] = [];
  for (const slot of SLOT_ORDER) {
    const p = four[slot];
    if (!p) continue;
    gans.push({ slot, value: p.gan });
    zhis.push({ slot, value: p.zhi });
  }

  const mk = (
    类型: RelationKind,
    sites: { slot: PillarSlot; value: Gan | Zhi }[],
    化五行: RelationHit['化五行'],
  ): RelationHit => ({
    类型,
    members: sites.map((s) => ({ slot: s.slot, value: s.value })),
    化五行,
    贴邻: adjacency(sites.map((s) => s.slot)),
  });

  // 天干五合（两两）
  for (let i = 0; i < gans.length; i++) {
    for (let j = i + 1; j < gans.length; j++) {
      for (const [a, b, hua] of TIANGAN_WUHE) {
        if ((gans[i]!.value === a && gans[j]!.value === b) || (gans[i]!.value === b && gans[j]!.value === a)) {
          hits.push(mk('天干五合', [gans[i]!, gans[j]!], hua));
        }
      }
    }
  }

  // 地支两字关系：六合 / 六冲 / 六害 / 子卯刑
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i + 1; j < zhis.length; j++) {
      const vi = zhis[i]!.value, vj = zhis[j]!.value;
      for (const [a, b, hua] of DIZHI_LIUHE) {
        if ((vi === a && vj === b) || (vi === b && vj === a)) hits.push(mk('六合', [zhis[i]!, zhis[j]!], hua));
      }
      for (const [a, b] of DIZHI_LIUCHONG) {
        if ((vi === a && vj === b) || (vi === b && vj === a)) hits.push(mk('六冲', [zhis[i]!, zhis[j]!], null));
      }
      for (const [a, b] of DIZHI_LIUHAI) {
        if ((vi === a && vj === b) || (vi === b && vj === a)) hits.push(mk('六害', [zhis[i]!, zhis[j]!], null));
      }
      for (const [a, b] of DIZHI_XING_PAIR) {
        if ((vi === a && vj === b) || (vi === b && vj === a)) hits.push(mk('三刑', [zhis[i]!, zhis[j]!], null));
      }
    }
  }

  // 三字关系：三合 / 三会（全三字到齐）
  const tripleTables: [RelationKind, readonly (readonly [Zhi, Zhi, Zhi, WuXingCell])[]][] = [
    ['三合', DIZHI_SANHE], ['三会', DIZHI_SANHUI],
  ];
  for (const [kind, table] of tripleTables) {
    for (const row of table) {
      const need: Zhi[] = [row[0], row[1], row[2]];
      const sites = need.map((z) => zhis.find((s) => s.value === z)).filter((s): s is ZhiSite => !!s);
      if (sites.length === 3) hits.push(mk(kind, sites, row[3]));
    }
  }

  // 三字刑（寅巳申 / 丑戌未）
  for (const row of DIZHI_SANXING_TRIPLE) {
    const sites = row.map((z) => zhis.find((s) => s.value === z)).filter((s): s is ZhiSite => !!s);
    if (sites.length === 3) hits.push(mk('三刑', sites, null));
  }

  // 自刑（同一自刑支出现 ≥2 次）
  for (const z of DIZHI_ZIXING) {
    const sites = zhis.filter((s) => s.value === z);
    if (sites.length >= 2) hits.push(mk('自刑', sites.slice(0, 2), null));
  }

  return hits;
}

type WuXingCell = RelationHit['化五行'];
