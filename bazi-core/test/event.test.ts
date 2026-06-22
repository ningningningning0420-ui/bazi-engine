import { describe, expect, test } from 'vitest';
import { computeChart } from '../src/compute-chart';
import { eventModifier } from '../src/forecast/event';
import type { AtDate } from '../src/types';

const chart = computeChart({ year: 1990, month: 6, day: 15, hour: 10, hourUnknown: false, gender: '乾' });
const D = (y: number): AtDate => ({ year: y, month: 6, day: 15 });

describe('eventModifier L4', () => {
  test('结构完整 + 区间 + 确定性', () => {
    const c = eventModifier(chart, D(2025), '事业晋升');
    expect(c.successDelta).toBeGreaterThanOrEqual(-0.25);
    expect(c.successDelta).toBeLessThanOrEqual(0.25);
    expect(c.severityScale).toBeGreaterThanOrEqual(1.0);
    expect(c.severityScale).toBeLessThanOrEqual(2.0);
    expect(['↑', '↓', '中']).toContain(c.directionBias);
    expect(eventModifier(chart, D(2025), '事业晋升')).toEqual(c);
  });
  test('aptitude/timing ∈ [-1,1]', () => {
    const c = eventModifier(chart, D(2025), '求财');
    expect(c.rationale.aptitude).toBeGreaterThanOrEqual(-1);
    expect(c.rationale.aptitude).toBeLessThanOrEqual(1);
    expect(c.rationale.timing).toBeGreaterThanOrEqual(-1);
    expect(c.rationale.timing).toBeLessThanOrEqual(1);
  });
  test('directionBias 与 successDelta 同号(同源 net)', () => {
    const c = eventModifier(chart, D(2025), '健康');
    if (c.successDelta > 0.0125) expect(c.directionBias).toBe('↑');
    if (c.successDelta < -0.0125) expect(c.directionBias).toBe('↓');
  });
  test('L4 恒用最细 grain(同 atDate 同结果)', () => {
    expect(eventModifier(chart, D(2025), '婚恋')).toEqual(eventModifier(chart, D(2025), '婚恋'));
  });
  test('全 EventKind 不崩 + rationale.focus 非空', () => {
    for (const ek of ['事业晋升', '求财', '婚恋', '健康', '诉讼口舌', '学业考试'] as const) {
      const c = eventModifier(chart, D(2025), ek);
      expect(c.rationale.focus.length).toBeGreaterThan(0);
    }
  });
});
