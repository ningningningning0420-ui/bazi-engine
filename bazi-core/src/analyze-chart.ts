import { computeChart } from './compute-chart';
import { analyzeRoots } from './facts/roots';
import { analyzeStrength } from './facts/strength';
import { detectRelations } from './facts/relations-detect';
import type { BirthInput, Chart, ChartAnalysis, ChartFacts } from './types';

/** 在 Chart 之上算出结构事实三件套（通根 / 旺衰 / 刑冲合害）。 */
export function analyzeChart(chart: Chart): ChartAnalysis {
  return {
    通根: analyzeRoots(chart.四柱, chart.日主),
    旺衰: analyzeStrength(chart.四柱, chart.日主, chart.十神类别),
    刑冲合害: detectRelations(chart.四柱),
  };
}

/** L0 + L1-A：生辰 → 带结构事实分析的盘。 */
export function computeChartFacts(input: BirthInput): ChartFacts {
  const chart = computeChart(input);
  return { ...chart, 分析: analyzeChart(chart) };
}
