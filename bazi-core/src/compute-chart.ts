import { Solar } from 'lunar-typescript';
import { BirthInputSchema, TEN_GODS, type BirthInput, type Chart, type Pillar, type TenGod, type TenGodCategory } from './types';
import { buildPillar } from './build-pillar';
import { category } from './ten-gods';
import type { Gan, Zhi } from './constants/gan-zhi';

function emptyCount(): Record<TenGod, number> {
  return Object.fromEntries(TEN_GODS.map((g) => [g, 0])) as Record<TenGod, number>;
}
function emptyCat(): Record<TenGodCategory, number> {
  return { 比劫: 0, 食伤: 0, 财: 0, 官杀: 0, 印: 0 };
}

/** L0：公历生辰 → 带类型的八字盘（四柱 + 藏干 + 十神标注）。纯函数、可复现。 */
export function computeChart(input: BirthInput): Chart {
  const birthInput = BirthInputSchema.parse(input);
  const hour = birthInput.hourUnknown ? 12 : birthInput.hour!; // 占位钟点仅用于构造库对象
  const ec = Solar.fromYmdHms(birthInput.year, birthInput.month, birthInput.day, hour, 0, 0)
    .getLunar().getEightChar();

  const dmGan = ec.getDayGan() as Gan;

  const 年 = buildPillar(dmGan, ec.getYearGan() as Gan, ec.getYearZhi() as Zhi);
  const 月 = buildPillar(dmGan, ec.getMonthGan() as Gan, ec.getMonthZhi() as Zhi);
  const 日 = buildPillar(dmGan, ec.getDayGan() as Gan, ec.getDayZhi() as Zhi);
  const 时: Pillar | null = birthInput.hourUnknown
    ? null
    : buildPillar(dmGan, ec.getTimeGan() as Gan, ec.getTimeZhi() as Zhi);

  // 十神计数：年/月/时三柱天干 + 全部柱的藏干（日柱天干=日主自身，不计）
  const counts = emptyCount();
  const cats = emptyCat();
  const pillars = [年, 月, 日, 时].filter((p): p is Pillar => p !== null);
  for (const p of pillars) {
    if (p !== 日) { counts[p.ganGod]++; cats[category(p.ganGod)]++; }
    for (const h of p.hiddenStems) { counts[h.god]++; cats[category(h.god)]++; }
  }

  const caveats: string[] = [];
  if (birthInput.hourUnknown) caveats.push('时辰未知：时柱缺，凡涉及子女/晚景/时柱宫位的断语不可靠。');

  return {
    birthInput,
    日主: { gan: dmGan, wuXing: 日.ganWuXing, yinYang: 日.ganYinYang },
    四柱: { 年, 月, 日, 时 },
    十神计数: counts,
    十神类别: cats,
    conventions: { 换年: '立春', 子时换日: '晚子时不换日(日柱当天·时干次日)', 时辰口径: '钟表时', 历法库: 'lunar-typescript' },
    caveats,
  };
}
