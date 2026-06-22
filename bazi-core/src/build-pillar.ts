import { GAN_WUXING, GAN_YINYANG, ZHI_WUXING, HIDDEN_STEMS, type Gan, type Zhi } from './constants/gan-zhi';
import { tenGod } from './ten-gods';
import type { Pillar } from './types';

/** 用日主 dm 把一组（天干 gan、地支 zhi）组装成带藏干/五行/十神的 Pillar。 */
export function buildPillar(dm: Gan, gan: Gan, zhi: Zhi): Pillar {
  return {
    gan, zhi,
    ganWuXing: GAN_WUXING[gan],
    ganYinYang: GAN_YINYANG[gan],
    zhiWuXing: ZHI_WUXING[zhi],
    ganGod: tenGod(dm, gan),
    hiddenStems: HIDDEN_STEMS[zhi].map((h) => ({ ...h, god: tenGod(dm, h.gan) })),
  };
}
