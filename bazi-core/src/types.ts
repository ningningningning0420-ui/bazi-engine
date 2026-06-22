import { z } from 'zod';
import type { Gan, Zhi, WuXing, YinYang, HiddenRole } from './constants/gan-zhi';

export const TEN_GODS = [
  '比肩','劫财','食神','伤官','偏财','正财','七杀','正官','偏印','正印',
] as const;
export type TenGod = (typeof TEN_GODS)[number];
export type TenGodCategory = '比劫' | '食伤' | '财' | '官杀' | '印';

export const BirthInputSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23).nullable(),
  hourUnknown: z.boolean(),
  gender: z.enum(['乾', '坤']),
}).refine(
  (b) => b.hourUnknown === (b.hour === null),
  { message: 'hourUnknown 必须与 hour===null 一致' },
);
export type BirthInput = z.infer<typeof BirthInputSchema>;

export interface HiddenStem { gan: Gan; role: HiddenRole; god: TenGod; }

export interface Pillar {
  gan: Gan;
  zhi: Zhi;
  ganWuXing: WuXing;
  ganYinYang: YinYang;
  zhiWuXing: WuXing;       // 地支本气五行
  ganGod: TenGod;          // 该柱天干对日主的十神（日柱天干=日主，记为 '比肩' 占位）
  hiddenStems: HiddenStem[]; // 藏干（含各自十神）
}

export interface DayMaster { gan: Gan; wuXing: WuXing; yinYang: YinYang; }

export type PillarSlot = '年' | '月' | '日' | '时';

export interface Chart {
  birthInput: BirthInput;
  日主: DayMaster;
  四柱: { 年: Pillar; 月: Pillar; 日: Pillar; 时: Pillar | null };
  十神计数: Record<TenGod, number>;       // 含天干 + 藏干 全部十神出现次数（日主自身不计）
  十神类别: Record<TenGodCategory, number>;
  conventions: {
    换年: '立春';
    子时换日: true;
    时辰口径: '钟表时';
    历法库: 'lunar-typescript';
  };
  caveats: string[];
}

// ===== 计划 2：L1-A 结构事实层类型 =====

export type FourPillars = Chart['四柱'];
export const SLOT_ORDER: readonly PillarSlot[] = ['年', '月', '日', '时'];

export type RootType = '本气根' | '中气根' | '余气根';
export interface RootHit { slot: PillarSlot; branch: Zhi; rootType: RootType; }
export interface StemRoots {
  slot: PillarSlot;
  stem: Gan;
  wuXing: WuXing;
  roots: RootHit[];
  hasRoot: boolean;
}

export type WangShuai = '旺' | '相' | '休' | '囚' | '死';
export interface StrengthAnalysis {
  月令旺衰: WangShuai;
  得令: boolean;
  得地: { hasRoot: boolean; positions: PillarSlot[] };
  得势: { 印比数: number };
  五行得分: Record<WuXing, number>;
  同党: number;   // 日主五行 + 印五行 的得分和
  异党: number;   // 其余三五行 的得分和
  强弱比: number; // 同党 / (同党 + 异党)
  身强弱: '身强' | '身弱' | '均衡';
  borderline: boolean;
}

export type RelationKind = '天干五合' | '六合' | '三合' | '三会' | '六冲' | '三刑' | '自刑' | '六害';
export interface RelationHit {
  类型: RelationKind;
  members: { slot: PillarSlot; value: Gan | Zhi }[];
  化五行: WuXing | null;  // 合化类才有，其余 null
  贴邻: boolean;          // 涉及柱位是否占据连续槽位
}

export interface ChartAnalysis {
  通根: StemRoots[];
  旺衰: StrengthAnalysis;
  刑冲合害: RelationHit[];
  // 计划 3 将扩充：涌现拓扑 / 十神成立组合 / 矛盾张力轴 / 格局 / 调候 / 用神
}
export interface ChartFacts extends Chart {
  分析: ChartAnalysis;
}
