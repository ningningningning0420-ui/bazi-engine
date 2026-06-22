import { describe, expect, test } from 'vitest';
import {
  computeChart, computeChartFacts, deriveTendency, selectGrain,
  ensurePersona, buildRuntimeContext, rollEvent, extractCitableStructures, MINGLI_FORBIDDEN,
} from '../src/index';
import type { BirthInput, PersonaAnchors, AtDate, PersistedNpc } from '../src/index';
import type { PersistencePort, LlmInvokePort, PersonaPorts } from '../src/index';

const BI: BirthInput = { year: 1985, month: 8, day: 20, hour: 14, hourUnknown: false, gender: '坤' };
const facts = computeChartFacts(BI);
const cit = extractCitableStructures(facts);
const 同源 = cit.优缺同源点[0];
function goodAnchors(): PersonaAnchors {
  const cited = cit.all.slice(0, Math.min(3, cit.all.length));
  if (同源 && !cited.includes(同源)) cited.push(同源);
  const a = 同源 ?? (cited[0] ?? '');
  return {
    主导驱力: '求安稳', 对人基调: '坦荡', 命门: '优柔', 行为倾向标签: ['细腻', '克己'],
    滋养向: facts.分析.用神.喜.slice(0, 1), citedStructures: cited, 优缺同源锚: { 优点cite: a, 弱点cite: a },
  };
}
const memPersist = (): PersistencePort => {
  const m = new Map<string, PersistedNpc>();
  return { load: (id) => m.get(id) ?? null, save: (n) => void m.set(n.npcId, n) };
};

describe('persona 集成（L0–L4 + L2 全链·小卡可跑通）', () => {
  test('端到端：computeChart→ensurePersona→buildRuntimeContext(命理-free)→rollEvent', async () => {
    const chart = computeChart(BI);
    const llm: LlmInvokePort = { writeScripture: async () => ({ anchors: goodAnchors(), scriptureText: '一段命师写的圣经长文…' }) };
    const ports: PersonaPorts = { persistence: memPersist(), llm };

    const npc = await ensurePersona('liu', BI, ports);                       // L2 圣经-writing + 校验 + 持久化
    const at: AtDate = { year: 2025, month: 5, day: 10 };
    const tend = deriveTendency(chart, at, selectGrain(100));                // L3 流年推手
    const ctx = buildRuntimeContext(npc.personaAnchors, tend);              // 台前注入

    expect(npc.personaAnchors.主导驱力).toBe('求安稳');
    expect(ctx).not.toMatch(MINGLI_FORBIDDEN);                              // ★台前命理-free
    expect(ctx).toMatch(/求安稳/);                                          // 含画像
    const roll = rollEvent(chart, at, '求财', () => 0.1);                    // L4 + generic 掷骰
    expect(typeof roll.success).toBe('boolean');
  });
  test('确定性：ensurePersona 命中持久化二次返回同一对象', async () => {
    const llm: LlmInvokePort = { writeScripture: async () => ({ anchors: goodAnchors(), scriptureText: 's' }) };
    const ports: PersonaPorts = { persistence: memPersist(), llm };
    const a = await ensurePersona('liu', BI, ports);
    const b = await ensurePersona('liu', BI, ports);                        // 第二次走 load 命中
    expect(b).toEqual(a);
  });
});
