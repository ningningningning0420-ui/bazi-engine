export { computeChart } from './compute-chart';
export { tenGod, category } from './ten-gods';
export { buildPillar } from './build-pillar';
export { BirthInputSchema } from './types';
export type {
  BirthInput, Chart, Pillar, DayMaster, HiddenStem, TenGod, TenGodCategory, PillarSlot,
} from './types';
export type { Gan, Zhi, WuXing, YinYang, HiddenRole } from './constants/gan-zhi';

// ===== 计划 2：L1-A 结构事实层 =====
export { analyzeChart, computeChartFacts } from './analyze-chart';
export { analyzeRoots } from './facts/roots';
export { analyzeStrength, wangShuai } from './facts/strength';
export { detectRelations } from './facts/relations-detect';
export type {
  FourPillars, RootType, RootHit, StemRoots,
  WangShuai, StrengthAnalysis,
  RelationKind, RelationHit,
  ChartAnalysis, ChartFacts,
} from './types';

// ===== 计划 3：L1-B 用神真相源链 =====
export { climateNeed } from './facts/climate';
export { buildEmergentTopology } from './facts/topology';
export { analyzeFavor } from './facts/favor';
export type {
  Pentad, FlowLevel, ClimateTag, MoistTag, ClimateResult,
  ClashPair, TongGuanNode, EmergentTopology, FavorResult,
} from './types';
