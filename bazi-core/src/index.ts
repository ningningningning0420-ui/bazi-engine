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

// ===== 计划 4：L1-B 锚点结构 =====
export { detectGodCombos } from './facts/combos';
export { buildTension } from './facts/tension';
export { buildPattern } from './facts/pattern';
export { buildCongSignal } from './facts/cong';
export { categoryOf } from './ten-gods';
export type {
  GodComboKind, ComboPolarity, ComboMember, ComboHit,
  GeName, LiGeBasis, PatternResult, CongSignal,
  TensionAxis, SameSourcePoint, TensionResult,
} from './types';

// ===== 计划 5：L3 流年推手 + L4 成功率系数（可选层·需 atDate·不进 computeChartFacts）=====
export { selectGrain } from './forecast/grain';
export { selectLuckPillars } from './forecast/luck-pillars';
export { crossRelations } from './forecast/field-relations';
export { perturbField } from './forecast/field';
export { deriveTendency } from './forecast/tendency';
export { eventModifier } from './forecast/event';
export { rollWithCoeff } from './forecast/roll';
export type {
  AtDate, Grain, GrainSet, LuckPillars,
  Intensity, ActionKind, FieldAction, RawFlags, FieldResult,
  DomainKind, Direction, DomainTendency, LuckTrend, Tendency,
  EventKind, EventCoeff, RollResult,
} from './types';
export type { CrossKind, CrossRelation } from './forecast/field-relations';

// ===== 计划 6：L2 性格地基 + ports + generic-adapter（通用先行·v1 闭合）=====
export { extractCitableStructures } from './persona/structures';
export { buildScripturePrompt } from './persona/prompt';
export { validatePersonaAnchors, CITE_MIN_N } from './persona/validate';
export { PersonaAnchorsSchema, MINGLI_FORBIDDEN, 主导驱力池, 对人基调池, 命门池 } from './persona/anchors';
export { ensurePersona, buildRuntimeContext, rollEvent, MAX_RETRY } from './adapters/generic';
export type { PersonaPorts } from './adapters/generic';
export type { SeedPort, ClockPort, PersistencePort, LlmInvokePort, PersistedNpc } from './ports';
export type {
  主导驱力, 对人基调, 命门, PersonaAnchors, CitableStructures,
  ValidationViolation, ValidationResult, ScripturePrompt,
} from './types';

// ===== 计划 7：本命神煞 =====
export { detectShensha } from './facts/shensha';
export type { DetectShenshaOpts } from './facts/shensha';
export type { ShenshaName, ShenshaHit, ShenshaResult, ShenshaCategory, ShenshaPolarity, ShenshaBasis } from './types';

// ===== 计划 8：seedToBirth（种子 → 合法生辰·均匀无偏·守 L0 红线）=====
export { seedToBirth } from './seed-to-birth';
export type { SeedToBirthOpts } from './seed-to-birth';
