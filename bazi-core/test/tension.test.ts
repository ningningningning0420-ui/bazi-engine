import { describe, expect, test } from 'vitest';
import { buildTension } from '../src/facts/tension';
import type { ComboHit, EmergentTopology } from '../src/types';

const emptyTopo = (clashes: EmergentTopology['clashes'] = []): EmergentTopology => ({
  flow: 0, flowLevel: '阻', coverage: 0, chainStrength: 0, breaks: [],
  isFullCycle: false, cyclePresent: [], longestChain: { path: [], len: 0 },
  clashes, tongGuanReport: [], dominant: [], missing: [], presentRows: [], caveats: [],
});
const combo = (类型: ComboHit['类型'], 成立程度: number, 内含矛盾: boolean, 制化系数 = 1): ComboHit => ({
  类型, 成立程度, 极性: 内含矛盾 ? '凶向' : '吉向', 内含矛盾, members: [],
  力量快照: { 制化系数, 原始成立度: 成立程度 }, 说明键: '',
});

describe('buildTension', () => {
  test('X1 相战对 → 查轴（甲日木土相战=占有vs分享）', () => {
    const topo = emptyTopo([{ pair: ['木', '土'], 克: '木', 受: '土', scores: [3, 3], tongGuanShen: '火', tongGuanPresent: false, tongGuanScore: 0, intensity: 0.8, detail: '' }]);
    const r = buildTension(topo, [], '木');
    const ax = r.矛盾张力轴.find((a) => a.轴名 === '占有vs分享');
    expect(ax).toBeDefined();
    expect(ax!.张力强度).toBeCloseTo(0.8, 5);
    expect(ax!.优缺同源).toBe(false);
  });
  test('X2 内含矛盾派生 + 优缺同源点（伤官见官，有制化打折）', () => {
    const r = buildTension(emptyTopo(), [combo('伤官见官', 0.8, true, 0.5)], '木');
    const ax = r.矛盾张力轴.find((a) => a.轴名 === '才华锋芒vs规则权威');
    expect(ax).toBeDefined();
    expect(ax!.优缺同源).toBe(true);
    expect(ax!.张力强度).toBeCloseTo(0.48, 5); // 0.8×0.6（制化系数0.5<=0.7=有制化）
    expect(r.优缺同源点.some((p) => p.正面表述 === '恃才放旷')).toBe(true);
  });
  test('X2 无制化不打折', () => {
    const r = buildTension(emptyTopo(), [combo('杀重无制', 0.5, true, 0.9)], '木');
    const ax = r.矛盾张力轴.find((a) => a.轴名 === '压力/野心vs失控');
    expect(ax!.张力强度).toBeCloseTo(0.5, 5); // 制化系数0.9>0.7 → 无制化 → ×1
  });
  test('X4 内含矛盾入轴阈值 AXIS_MIN_DEGREE(0.3)', () => {
    const r = buildTension(emptyTopo(), [combo('财多身弱', 0.35, true, 1)], '木');
    expect(r.矛盾张力轴.find((a) => a.轴名 === '欲望vs承载力')).toBeDefined();
    const r2 = buildTension(emptyTopo(), [combo('财多身弱', 0.25, true, 1)], '木');
    expect(r2.矛盾张力轴.find((a) => a.轴名 === '欲望vs承载力')).toBeUndefined(); // 0.25<0.3 不进 X2
  });
  test('反向共存元张力', () => {
    const r = buildTension(emptyTopo(), [combo('杀印相生', 0.6, false), combo('伤官见官', 0.5, true, 0.9)], '木');
    expect(r.矛盾张力轴.find((a) => a.轴名 === '化解vs冲突')).toBeDefined();
  });
  test('确定性', () => {
    const cs = [combo('伤官见官', 0.8, true, 0.5)];
    expect(buildTension(emptyTopo(), cs, '木')).toEqual(buildTension(emptyTopo(), cs, '木'));
  });
});
