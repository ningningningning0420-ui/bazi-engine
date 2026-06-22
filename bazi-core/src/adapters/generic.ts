import { computeChartFacts } from '../analyze-chart';
import { buildScripturePrompt } from '../persona/prompt';
import { validatePersonaAnchors } from '../persona/validate';
import { PersonaAnchorsSchema, MINGLI_FORBIDDEN } from '../persona/anchors';
import { eventModifier } from '../forecast/event';
import { rollWithCoeff } from '../forecast/roll';
import type { BirthInput, PersonaAnchors, Tendency, AtDate, EventKind, RollResult, Chart } from '../types';
import type { PersistencePort, LlmInvokePort, PersistedNpc } from '../ports';

export const MAX_RETRY = 3;

// ★台前护栏：本串自身须命理-free（不列举命理术语·否则会把命理词带进台前正文）。
const RUNTIME_GUARD =
  '【台前护栏】以下为人物当前画像与行为暗示，仅供你演绎；正文中不得出现任何命理推导或术语，命理只是你的内部依据。';

function birthInputEqual(a: BirthInput, b: BirthInput): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
    && a.hour === b.hour && a.hourUnknown === b.hourUnknown && a.gender === b.gender;
}

export interface PersonaPorts { persistence: PersistencePort; llm: LlmInvokePort; }

/** 圣经-writing 编排：load 命中(校验 birthInput 一致)→否则 prompt→llmInvoke→safeParse→validate→retry→persist。 */
export async function ensurePersona(npcId: string, birthInput: BirthInput, ports: PersonaPorts): Promise<PersistedNpc> {
  const existing = ports.persistence.load(npcId);
  if (existing) {
    if (!birthInputEqual(existing.birthInput, birthInput)) {
      throw new Error(`npcId「${npcId}」持久化 birthInput 与传入不符（改生辰=换 key·拒静默用旧圣经）`);
    }
    return existing; // 一次性写定·此后只读·可复现
  }
  const facts = computeChartFacts(birthInput);
  let priorViolations: string[] = [];
  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    const prompt = buildScripturePrompt(facts, priorViolations);
    const r = await ports.llm.writeScripture(prompt);
    const parsed = PersonaAnchorsSchema.safeParse(r.anchors);
    if (!parsed.success) {
      priorViolations = parsed.error.issues.map((e) => `字段 ${e.path.join('.')}: ${e.message}`);
      continue;
    }
    const anchors = parsed.data as PersonaAnchors;
    const v = validatePersonaAnchors(anchors, facts);
    if (v.ok) {
      const npc: PersistedNpc = { npcId, birthInput, personaAnchors: anchors, scriptureText: r.scriptureText };
      ports.persistence.save(npc);
      return npc;
    }
    priorViolations = v.violations.map((x) => x.reason); // 只述客观缺失·不投喂答案
  }
  throw new Error(`npcId「${npcId}」圣经校验 retry(${MAX_RETRY}) 耗尽`);
}

/** ★台前寄存器注入：命理-free 行为画像 + tendency 隐藏暗示 + 护栏（供宿主注入实时上下文）。 */
export function buildRuntimeContext(persona: PersonaAnchors, tendency?: Pick<Tendency, '隐藏暗示'>): string {
  const lines = [
    `主导驱力：${persona.主导驱力}`,
    `对人基调：${persona.对人基调}`,
    `命门：${persona.命门}`,
    persona.行为倾向标签.length ? `行为倾向：${persona.行为倾向标签.join('、')}` : '',
    tendency?.隐藏暗示 ? `当下：${tendency.隐藏暗示}` : '',
    // ★台前纯净唯一出口执法：剔除任何含命理词的行（防上游回归把命理泄漏进台前正文·红线②）
  ].filter((l) => l && !MINGLI_FORBIDDEN.test(l));
  return [RUNTIME_GUARD, ...lines].join('\n');
}

/** generic 掷骰路径（大奥等有裁决引擎的消费方不调此函数·只读 EventCoeff）。 */
export function rollEvent(chart: Chart, atDate: AtDate, eventKind: EventKind, prng: () => number): RollResult {
  return rollWithCoeff(eventModifier(chart, atDate, eventKind), prng);
}
