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
