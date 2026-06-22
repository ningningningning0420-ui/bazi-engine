import { describe, expect, test } from 'vitest';
import { buildEmergentTopology } from '../src/facts/topology';
import type { WuXing, RelationHit } from '../src/types';

const S = (p: Partial<Record<WuXing, number>>): Record<WuXing, number> => ({ 木: 0, 火: 0, 土: 0, 金: 0, 水: 0, ...p });
const noRel: RelationHit[] = [];

describe('buildEmergentTopology', () => {
  test('水火相战无木通关 → clashes 含[水,火]，通关神木缺', () => {
    const t = buildEmergentTopology(S({ 水: 5, 火: 5, 木: 0 }), '木', noRel);
    const wc = t.clashes.find((c) => c.克 === '水' && c.受 === '火');
    expect(wc).toBeDefined();
    expect(wc!.tongGuanShen).toBe('木');
    expect(wc!.tongGuanPresent).toBe(false);
    expect(wc!.intensity).toBeGreaterThan(0);
  });
  test('水火相战但有木通关 → 不入 clashes', () => {
    const t = buildEmergentTopology(S({ 水: 5, 火: 5, 木: 4 }), '木', noRel);
    expect(t.clashes.find((c) => c.克 === '水' && c.受 === '火')).toBeUndefined();
  });
  test('五行俱全 → isFullCycle，flowLevel 畅/通', () => {
    const t = buildEmergentTopology(S({ 木: 2, 火: 2, 土: 2, 金: 2, 水: 2 }), '木', noRel);
    expect(t.isFullCycle).toBe(true);
    expect(['畅', '通']).toContain(t.flowLevel);
  });
  test('独旺独缺：土极旺、金缺', () => {
    const t = buildEmergentTopology(S({ 土: 10, 火: 1 }), '土', noRel);
    expect(t.dominant.some((d) => d.wuXing === '土')).toBe(true);
    expect(t.missing.some((m) => m.wuXing === '金')).toBe(true);
  });
  test('确定性：同输入两次深相等', () => {
    const a = S({ 水: 5, 火: 5 });
    expect(buildEmergentTopology(a, '木', noRel)).toEqual(buildEmergentTopology(a, '木', noRel));
  });
});
