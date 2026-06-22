import { Solar } from 'lunar-typescript';
import { buildPillar } from '../build-pillar';
import type { Chart, AtDate, GrainSet, LuckPillars, Pillar } from '../types';
import type { Gan, Zhi } from '../constants/gan-zhi';

const SECT = 1;
const splitGZ = (gz: string): [Gan, Zhi] => [gz[0] as Gan, gz[1] as Zhi];

/**
 * 大运/流年/流月/流日（★唯一碰 lunar 处·历法 oracle）。
 * 流年/月/日 = 排 atDate 自身八字（立春换年 / 节气定月 自动正确）；大运 = getYun（起运/顺逆）。
 */
export function selectLuckPillars(chart: Chart, atDate: AtDate, grain: GrainSet): LuckPillars {
  const dm = chart.日主.gan;
  const caveats: string[] = [];

  // 流年/流月/流日 = 排 atDate 自己的八字（立春换年 / 节气定月 自动）
  const atEc = Solar.fromYmdHms(atDate.year, atDate.month, atDate.day, 12, 0, 0).getLunar().getEightChar();
  const [ny, nz] = splitGZ(atEc.getYear());
  const 流年 = buildPillar(dm, ny, nz);
  let 流月: Pillar | null = null;
  let 流日: Pillar | null = null;
  if (grain.includes('流月')) { const [g, z] = splitGZ(atEc.getMonth()); 流月 = buildPillar(dm, g, z); }
  if (grain.includes('流日')) { const [g, z] = splitGZ(atEc.getDay()); 流日 = buildPillar(dm, g, z); }

  // 大运：从 birthInput 重排盘 → getYun（乾→1男 / 坤→0女·hourUnknown→12·sect=1），按 atDate 公历年定位
  const bi = chart.birthInput;
  const bh = bi.hourUnknown ? 12 : bi.hour!;
  const birthEc = Solar.fromYmdHms(bi.year, bi.month, bi.day, bh, 0, 0).getLunar().getEightChar();
  const yun = birthEc.getYun(bi.gender === '乾' ? 1 : 0, SECT);
  const dys = yun.getDaYun(12);
  const dy = dys.find((d) => d.getGanZhi() !== '' && atDate.year >= d.getStartYear() && atDate.year <= d.getEndYear());
  let 大运: Pillar | null = null;
  if (dy) { const [g, z] = splitGZ(dy.getGanZhi()); 大运 = buildPillar(dm, g, z); }
  else caveats.push('未起运·童限（无大运底色，L3 信号弱化）');

  if (bi.hourUnknown) caveats.push('时辰未知：时柱/宫位相关断语降级');
  return { 大运, 流年, 流月, 流日, caveats };
}
