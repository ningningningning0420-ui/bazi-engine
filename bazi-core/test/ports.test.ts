import { describe, expect, test } from 'vitest';
import type { SeedPort, ClockPort, PersistencePort, LlmInvokePort, PersistedNpc } from '../src/ports';

describe('ports 形状（编译即验·烟雾）', () => {
  test('端口可实现', () => {
    const mem = new Map<string, PersistedNpc>();
    const persistence: PersistencePort = { load: (id) => mem.get(id) ?? null, save: (n) => void mem.set(n.npcId, n) };
    const clock: ClockPort = { now: () => ({ year: 2025, month: 1, day: 1 }) };
    const seed: SeedPort = { hash: (s) => s.length };
    const llm: LlmInvokePort = { writeScripture: async () => ({ anchors: {}, scriptureText: '' }) };
    expect(persistence.load('x')).toBeNull();
    expect(clock.now().year).toBe(2025);
    expect(seed.hash('ab')).toBe(2);
    expect(typeof llm.writeScripture).toBe('function');
  });
});
