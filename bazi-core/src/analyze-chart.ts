import { computeChart } from './compute-chart';
import { analyzeRoots } from './facts/roots';
import { analyzeStrength } from './facts/strength';
import { detectRelations } from './facts/relations-detect';
import { climateNeed } from './facts/climate';
import { buildEmergentTopology } from './facts/topology';
import { analyzeFavor } from './facts/favor';
import type { BirthInput, Chart, ChartAnalysis, ChartFacts } from './types';

/**
 * 在 Chart 之上算出结构事实分析。
 * 计划2：通根 / 旺衰 / 刑冲合害；计划3：调候 / 涌现拓扑 / 用神。
 * 装配顺序：旺衰 → 刑冲合害 → climate → topology → favor（favor 依赖 topology+climate）。
 */
export function analyzeChart(chart: Chart): ChartAnalysis {
  const 通根 = analyzeRoots(chart.四柱, chart.日主);
  const 旺衰 = analyzeStrength(chart.四柱, chart.日主, chart.十神类别);
  const 刑冲合害 = detectRelations(chart.四柱);
  const 调候 = climateNeed(chart.四柱, 旺衰.五行得分);
  const 涌现拓扑 = buildEmergentTopology(旺衰.五行得分, chart.日主.wuXing, 刑冲合害);
  const 用神 = analyzeFavor(chart.四柱, chart.日主, 旺衰, 刑冲合害, 涌现拓扑, 调候);
  return { 通根, 旺衰, 刑冲合害, 调候, 涌现拓扑, 用神 };
}

/** L0 + L1-A：生辰 → 带结构事实分析的盘。 */
export function computeChartFacts(input: BirthInput): ChartFacts {
  const chart = computeChart(input);
  return { ...chart, 分析: analyzeChart(chart) };
}
