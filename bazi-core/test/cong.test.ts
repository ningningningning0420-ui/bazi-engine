import { describe, expect, test } from 'vitest';
import { buildCongSignal } from '../src/facts/cong';
import type { StrengthAnalysis, EmergentTopology, WuXing } from '../src/types';

const S = (p: Partial<Record<WuXing, number>>): Record<WuXing, number> => ({ 木: 0, 火: 0, 土: 0, 金: 0, 水: 0, ...p });
const strength = (o: Partial<StrengthAnalysis>): StrengthAnalysis => ({
  月令旺衰: '死', 得令: false, 得地: { hasRoot: false, positions: [] }, 得势: { 印比数: 0 },
  五行得分: S({}), 同党: 0, 异党: 0, 强弱比: 0.5, 身强弱: '均衡', borderline: false, ...o,
});
const topo = {} as EmergentTopology;

describe('buildCongSignal', () => {
  test('从弱：r<=0.10 无根不得令 → 候选从弱，触发项按异党 dominant', () => {
    const st = strength({ 强弱比: 0.05, 得令: false, 得地: { hasRoot: false, positions: [] }, 五行得分: S({ 金: 8, 木: 0.3 }) });
    const c = buildCongSignal(st, topo, '木'); // 金=官杀
    expect(c.候选).toBe('从弱');
    expect(c.触发项).toContain('从杀');
    expect(c.强度).toBeGreaterThan(0.8);
  });
  test('从弱假从：极弱却有根 → 候选 null + 反例', () => {
    const st = strength({ 强弱比: 0.08, 得令: false, 得地: { hasRoot: true, positions: ['日'] }, 五行得分: S({ 金: 8, 木: 1 }) });
    const c = buildCongSignal(st, topo, '木');
    expect(c.候选).toBeNull();
    expect(c.反例.some((x) => x.includes('假从'))).toBe(true);
  });
  test('从强：r>=0.90 得令无显著官杀 → 候选从强 + 专旺', () => {
    const st = strength({ 强弱比: 0.95, 得令: true, 五行得分: S({ 木: 10, 金: 0.2 }) });
    const c = buildCongSignal(st, topo, '木');
    expect(c.候选).toBe('从强');
    expect(c.触发项).toContain('曲直格');
  });
  test('从强破格：得令身旺但官杀显著克身 → 候选 null + 反例', () => {
    const st = strength({ 强弱比: 0.92, 得令: true, 五行得分: S({ 木: 10, 金: 1.5 }) });
    const c = buildCongSignal(st, topo, '木');
    expect(c.候选).toBeNull();
    expect(c.反例.some((x) => x.includes('官杀'))).toBe(true);
  });
  test('均衡 → 无候选 强度0', () => {
    const c = buildCongSignal(strength({ 强弱比: 0.5 }), topo, '木');
    expect(c.候选).toBeNull(); expect(c.强度).toBe(0);
  });
});
