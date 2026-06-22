import { extractCitableStructures } from './structures';
import { MINGLI_FORBIDDEN } from './anchors';
import type { ChartFacts, PersonaAnchors, ValidationResult, ValidationViolation } from '../types';

export const CITE_MIN_N = 3;

/**
 * 三道半校验（★只定下限不锁人格）。①子集 ②cite ③优缺同源(贫盘降级) ④台前纯净。
 * 三道只验"用了真实结构 + 无廉价矛盾 + 台前命理-free"，绝不验"是不是某一种人"——
 * 同一伤官见官读成叛逆艺术家/腐败改革者/笑面权臣 全过。
 */
export function validatePersonaAnchors(anchors: PersonaAnchors, facts: ChartFacts): ValidationResult {
  const violations: ValidationViolation[] = [];
  let degraded = false;
  const cit = extractCitableStructures(facts);
  const validSet = new Set(cit.all);
  const favorSign = facts.分析.用神.favorSign;

  // ① 子集（滋养向 favorSign≥1·只读不回写 favorSign）。
  //    注：「身弱用印≠枭雄」属语义层·故意不机器化（机器化=干支→性格词查表=踩红线⑤），语义自洽由 LLM 侧软约束。
  for (const w of anchors.滋养向) {
    if ((favorSign[w] ?? 0) < 1) violations.push({ check: '子集', reason: `滋养向 ${w} 非正向用神/喜(favorSign<1)` });
  }

  // ② cite（≥min(N,|valid|)·全∈valid·不要求覆盖全部张力轴=不锁人格）
  const effN = Math.min(CITE_MIN_N, validSet.size);
  if (anchors.citedStructures.length < effN) violations.push({ check: 'cite', reason: `citedStructures 少于 ${effN} 条(空洞)` });
  for (const s of anchors.citedStructures) {
    if (!validSet.has(s)) violations.push({ check: 'cite', reason: `cite 了盘上不存在的结构「${s}」` });
  }

  // ③ 优缺同源（须命中引擎识别的优缺同源点·同一锚·贫盘无同源点→降级豁免）
  const 同源池 = new Set(cit.优缺同源点);
  if (同源池.size === 0) {
    degraded = true;
  } else {
    const { 优点cite, 弱点cite } = anchors.优缺同源锚;
    if (优点cite !== 弱点cite) violations.push({ check: '优缺同源', reason: '优点/弱点 cite 不同源(廉价矛盾)' });
    else if (!同源池.has(优点cite)) violations.push({ check: '优缺同源', reason: `同源锚「${优点cite}」非引擎识别的优缺同源点` });
  }

  // ④ 台前纯净（行为倾向标签命理-free·红线② 机器执法）
  for (const tag of anchors.行为倾向标签) {
    if (MINGLI_FORBIDDEN.test(tag)) violations.push({ check: '台前纯净', reason: `行为倾向标签「${tag}」含命理词` });
  }

  return { ok: violations.length === 0, violations, degraded };
}
