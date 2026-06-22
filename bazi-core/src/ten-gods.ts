import { GAN_WUXING, GAN_YINYANG, sheng, ke, type Gan } from './constants/gan-zhi';
import type { TenGod, TenGodCategory } from './types';

/** 以日主 dm 为参照，求另一天干 t 的十神。 */
export function tenGod(dm: Gan, t: Gan): TenGod {
  const dw = GAN_WUXING[dm], tw = GAN_WUXING[t];
  const same = GAN_YINYANG[dm] === GAN_YINYANG[t];
  if (tw === dw) return same ? '比肩' : '劫财';        // 同我（比劫）
  if (sheng(dw) === tw) return same ? '食神' : '伤官';  // 我生（食伤）
  if (sheng(tw) === dw) return same ? '偏印' : '正印';  // 生我（印）
  if (ke(dw) === tw) return same ? '偏财' : '正财';      // 我克（财）
  return same ? '七杀' : '正官';                         // 克我（官杀）
}

const CATEGORY: Record<TenGod, TenGodCategory> = {
  比肩: '比劫', 劫财: '比劫',
  食神: '食伤', 伤官: '食伤',
  偏财: '财', 正财: '财',
  七杀: '官杀', 正官: '官杀',
  偏印: '印', 正印: '印',
};
export const category = (g: TenGod): TenGodCategory => CATEGORY[g];
