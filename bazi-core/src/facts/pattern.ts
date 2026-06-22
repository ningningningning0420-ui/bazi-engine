import { GAN_YINYANG, HIDDEN_STEMS } from '../constants/gan-zhi';
import { tenGod, category } from '../ten-gods';
import { SLOT_ORDER, type FourPillars, type DayMaster, type PatternResult, type GeName, type TenGod, type PillarSlot } from '../types';

const GE_NAME_BY_GOD: Partial<Record<TenGod, GeName>> = {
  食神: '食神格', 伤官: '伤官格', 偏财: '偏财格', 正财: '正财格',
  七杀: '七杀格', 正官: '正官格', 偏印: '偏印格', 正印: '正印格',
};

/** 月令本气透干机械立格 + 备选格；不 judge 成格破格高低清浊（留 LLM）。 */
export function buildPattern(dm: DayMaster, four: FourPillars): PatternResult {
  const monthZhi = four.月!.zhi;
  const monthBenQi = HIDDEN_STEMS[monthZhi][0]!.gan;
  const monthGod = tenGod(dm.gan, monthBenQi);
  const cat = category(monthGod);

  // 禄刃（月令本气=比劫）
  if (cat === '比劫') {
    if (monthGod === '比肩') {
      return { 格: '建禄格', 立格依据: '建禄', 透干: false, 月令本气十神: monthGod, 备选格: [], 说明: `月令${monthZhi}本气${monthBenQi}为日主同类(建禄)` };
    }
    const isYang = GAN_YINYANG[dm.gan] === '阳';
    const 格: GeName = isYang ? '羊刃格' : '月劫格';
    return { 格, 立格依据: isYang ? '羊刃' : '月劫', 透干: false, 月令本气十神: monthGod, 备选格: [], 说明: `月令${monthZhi}本气${monthBenQi}为劫财(${isYang ? '羊刃' : '月劫'})` };
  }

  // 透干集（年/月/时，排除日）
  const revealedGods = (SLOT_ORDER.filter((s) => s !== '日') as PillarSlot[])
    .filter((s) => four[s] !== null).map((s) => four[s]!.ganGod);
  const isShown = (g: TenGod): boolean => revealedGods.includes(g);

  let 格: GeName; let 立格依据: PatternResult['立格依据']; let 透干: boolean;
  if (isShown(monthGod) && GE_NAME_BY_GOD[monthGod]) {
    格 = GE_NAME_BY_GOD[monthGod]!; 立格依据 = '本气透干'; 透干 = true;
  } else {
    const zaShown = HIDDEN_STEMS[monthZhi].slice(1)
      .map((h) => tenGod(dm.gan, h.gan)).find((g) => isShown(g) && GE_NAME_BY_GOD[g]);
    if (zaShown) { 格 = GE_NAME_BY_GOD[zaShown]!; 立格依据 = '杂气透干'; 透干 = true; }
    else { 格 = GE_NAME_BY_GOD[monthGod]!; 立格依据 = '月令本气暗藏未透'; 透干 = false; }
  }

  // 备选格：月支藏干中透出且非主格者
  const 备选格 = [...new Set(
    HIDDEN_STEMS[monthZhi].map((h) => tenGod(dm.gan, h.gan))
      .filter((g) => isShown(g) && GE_NAME_BY_GOD[g] && GE_NAME_BY_GOD[g] !== 格)
      .map((g) => GE_NAME_BY_GOD[g]!),
  )];

  return { 格, 立格依据, 透干, 月令本气十神: monthGod, 备选格, 说明: `月令${monthZhi}(本气${monthBenQi}=${monthGod})·${立格依据}` };
}
