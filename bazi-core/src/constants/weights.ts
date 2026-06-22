// 共享量化权重与阈值（strength / combos / favor 单一来源·禁本地重声明）

export const STEM_WEIGHT = 1.0;
export const HIDDEN_WEIGHT: Record<'本气' | '中气' | '余气', number> = { 本气: 1.0, 中气: 0.6, 余气: 0.3 };
export const MONTH_BRANCH_MULT = 3.0; // 月支藏干当令加权
export const STRONG_CUT = 0.55;
export const WEAK_CUT = 0.45;
