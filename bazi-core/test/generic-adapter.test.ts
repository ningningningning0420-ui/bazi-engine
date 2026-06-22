import { describe, expect, test } from 'vitest';
import { computeChart } from '../src/compute-chart';
import { computeChartFacts } from '../src/analyze-chart';
import { ensurePersona, buildRuntimeContext, rollEvent } from '../src/adapters/generic';
import type { PersonaPorts } from '../src/adapters/generic';
import { extractCitableStructures } from '../src/persona/structures';
import { MINGLI_FORBIDDEN } from '../src/persona/anchors';
import type { BirthInput, PersonaAnchors, AtDate, Tendency } from '../src/types';
import type { PersistencePort, LlmInvokePort, PersistedNpc } from '../src/ports';

const BI: BirthInput = { year: 1990, month: 6, day: 15, hour: 10, hourUnknown: false, gender: '乾' };
const facts = computeChartFacts(BI);
const cit = extractCitableStructures(facts);
const 同源 = cit.优缺同源点[0];

function goodAnchors(): PersonaAnchors {
  const cited = cit.all.slice(0, Math.min(3, cit.all.length));
  if (同源 && !cited.includes(同源)) cited.push(同源);
  const anchorCite = 同源 ?? (cited[0] ?? '');
  return {
    主导驱力: '求成就', 对人基调: '亲和', 命门: '偏执', 行为倾向标签: ['谨慎'],
    滋养向: facts.分析.用神.喜.slice(0, 1), citedStructures: cited,
    优缺同源锚: { 优点cite: anchorCite, 弱点cite: anchorCite },
  };
}
const memPersist = (): PersistencePort => {
  const m = new Map<string, PersistedNpc>();
  return { load: (id) => m.get(id) ?? null, save: (n) => void m.set(n.npcId, n) };
};

describe('generic-adapter', () => {
  test('ensurePersona：LLM 产合法 anchors → save + 返回', async () => {
    const persistence = memPersist();
    const llm: LlmInvokePort = { writeScripture: async () => ({ anchors: goodAnchors(), scriptureText: '圣经全文…' }) };
    const ports: PersonaPorts = { persistence, llm };
    const npc = await ensurePersona('npc1', BI, ports);
    expect(npc.personaAnchors.主导驱力).toBe('求成就');
    expect(persistence.load('npc1')).not.toBeNull();
  });
  test('ensurePersona：命中持久化但 birthInput 不符 → fail-closed throw', async () => {
    const persistence = memPersist();
    const llm: LlmInvokePort = { writeScripture: async () => ({ anchors: goodAnchors(), scriptureText: 'x' }) };
    const ports: PersonaPorts = { persistence, llm };
    await ensurePersona('npc1', BI, ports);
    await expect(ensurePersona('npc1', { ...BI, year: 1991 }, ports)).rejects.toThrow();
  });
  test('ensurePersona：LLM 持续产非法 anchors → retry 耗尽 throw', async () => {
    const persistence = memPersist();
    const llm: LlmInvokePort = { writeScripture: async () => ({ anchors: { 主导驱力: '乱填' }, scriptureText: 'x' }) };
    await expect(ensurePersona('npc2', BI, { persistence, llm })).rejects.toThrow();
  });
  test('★buildRuntimeContext 命理-free(禁词) + 含护栏', () => {
    const tend = { 隐藏暗示: '近期在事业上较有起色' } as Pick<Tendency, '隐藏暗示'>;
    const ctx = buildRuntimeContext(goodAnchors(), tend);
    expect(ctx).not.toMatch(MINGLI_FORBIDDEN);
    expect(ctx).toMatch(/护栏|命理|内部依据/);
  });
  test('rollEvent = eventModifier→rollWithCoeff(prng外置·确定性)', () => {
    const chart = computeChart(BI);
    const at: AtDate = { year: 2025, month: 6, day: 15 };
    const r = rollEvent(chart, at, '求财', () => 0.1);
    expect(typeof r.success).toBe('boolean');
    expect(r).toEqual(rollEvent(chart, at, '求财', () => 0.1));
  });
});
