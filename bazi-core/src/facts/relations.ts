import type { Gan, Zhi, WuXing } from '../constants/gan-zhi';

// 天干五合（化神）
export const TIANGAN_WUHE: readonly [Gan, Gan, WuXing][] = [
  ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'], ['丁', '壬', '木'], ['戊', '癸', '火'],
];
// 地支六合（化神；午未化神有分歧，置 null）
export const DIZHI_LIUHE: readonly [Zhi, Zhi, WuXing | null][] = [
  ['子', '丑', '土'], ['寅', '亥', '木'], ['卯', '戌', '火'],
  ['辰', '酉', '金'], ['巳', '申', '水'], ['午', '未', null],
];
// 地支三合局
export const DIZHI_SANHE: readonly [Zhi, Zhi, Zhi, WuXing][] = [
  ['申', '子', '辰', '水'], ['亥', '卯', '未', '木'], ['寅', '午', '戌', '火'], ['巳', '酉', '丑', '金'],
];
// 地支三会方
export const DIZHI_SANHUI: readonly [Zhi, Zhi, Zhi, WuXing][] = [
  ['寅', '卯', '辰', '木'], ['巳', '午', '未', '火'], ['申', '酉', '戌', '金'], ['亥', '子', '丑', '水'],
];
// 地支六冲
export const DIZHI_LIUCHONG: readonly [Zhi, Zhi][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];
// 地支六害
export const DIZHI_LIUHAI: readonly [Zhi, Zhi][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];
// 地支三刑（三字刑）
export const DIZHI_SANXING_TRIPLE: readonly [Zhi, Zhi, Zhi][] = [
  ['寅', '巳', '申'], ['丑', '戌', '未'],
];
// 子卯相刑（无礼之刑）
export const DIZHI_XING_PAIR: readonly [Zhi, Zhi][] = [['子', '卯']];
// 自刑
export const DIZHI_ZIXING: readonly Zhi[] = ['辰', '午', '酉', '亥'];
