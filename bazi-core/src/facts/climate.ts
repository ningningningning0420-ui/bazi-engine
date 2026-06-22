import type { WuXing, Zhi } from '../constants/gan-zhi';
import type { FourPillars, ClimateResult, ClimateTag, MoistTag } from '../types';

// 季节（辰戌丑未 → 土月，覆盖其所属四时）
const SEASON_BY_ZHI: Record<Zhi, ClimateResult['季节']> = {
  寅: '春', 卯: '春', 辰: '土月',
  巳: '夏', 午: '夏', 未: '土月',
  申: '秋', 酉: '秋', 戌: '土月',
  亥: '冬', 子: '冬', 丑: '土月',
};

const CLIMATE_T_GAP = 0;
const CLIMATE_T_STRONG = 2.0;
const CLIMATE_FIRE_MIN = 1.0;
const CLIMATE_WATER_MIN = 1.0;
const CLIMATE_URGENT = 0.6;

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round2 = (x: number): number => Math.round(x * 100) / 100;

function warmColdTag(t: number): ClimateTag {
  if (t <= -CLIMATE_T_STRONG) return '寒甚';
  if (t < -CLIMATE_T_GAP) return '偏寒';
  if (t >= CLIMATE_T_STRONG) return '暖甚';
  if (t > CLIMATE_T_GAP) return '偏暖';
  return '平';
}
function dryWetTag(h: number): MoistTag {
  if (h >= CLIMATE_T_STRONG) return '湿甚';
  if (h > CLIMATE_T_GAP) return '偏湿';
  if (h <= -CLIMATE_T_STRONG) return '燥甚';
  if (h < -CLIMATE_T_GAP) return '偏燥';
  return '平';
}

/** 调候：favor + pattern 共用单一出口（级别只此处产）。 */
export function climateNeed(four: FourPillars, S: Record<WuXing, number>): ClimateResult {
  const 季节 = SEASON_BY_ZHI[four.月!.zhi];

  const 暖力 = S.火;
  const 寒力 = S.水;
  const 燥力 = S.火 + S.土 * 0.5;
  const 湿力 = S.水 + S.金 * 0.3 + S.土 * 0.5;
  const 温度指数 = 暖力 - 寒力;
  const 湿度指数 = 湿力 - 燥力;

  const 寒暖标签 = warmColdTag(温度指数);
  const 燥湿标签 = dryWetTag(湿度指数);

  // 调候提示（寒暖优先于燥湿）
  let 调候提示: WuXing[] = [];
  if (寒暖标签 === '寒甚' || (季节 === '冬' && S.火 < CLIMATE_FIRE_MIN)) {
    调候提示 = 寒暖标签 === '寒甚' ? ['火', '木'] : ['火'];
  } else if (寒暖标签 === '暖甚' || (季节 === '夏' && S.水 < CLIMATE_WATER_MIN)) {
    调候提示 = 寒暖标签 === '暖甚' ? ['水', '金'] : ['水'];
  } else if (燥湿标签 === '燥甚') {
    调候提示 = ['水'];
  } else if (燥湿标签 === '湿甚') {
    调候提示 = ['火', '土'];
  }

  const 急迫度 = round2(clamp01(Math.max(Math.abs(温度指数), Math.abs(湿度指数)) / CLIMATE_T_STRONG));
  const 级别: ClimateResult['级别'] =
    急迫度 >= CLIMATE_URGENT ? 'critical' : 调候提示.length > 0 ? 'adjust' : null;

  return { 季节, 寒暖标签, 燥湿标签, 温度指数: round2(温度指数), 湿度指数: round2(湿度指数), 调候提示, 急迫度, 级别 };
}
