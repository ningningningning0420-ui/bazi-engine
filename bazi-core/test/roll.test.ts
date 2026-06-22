import { describe, expect, test } from 'vitest';
import { rollWithCoeff } from '../src/forecast/roll';
import type { EventCoeff } from '../src/types';

const coeff = (successDelta: number): EventCoeff =>
  ({ successDelta, severityScale: 1, directionBias: successDelta >= 0 ? '↑' : '↓', rationale: { focus: [], aptitude: 0, timing: 0, amp: 1, 主导amp: null } });

describe('rollWithCoeff', () => {
  test('阈值=clamp(0.5+successDelta) + prng 外置 + 确定性', () => {
    const seq = [0.1, 0.9];
    let i = 0; const prng = () => seq[i++ % seq.length]!;
    const r1 = rollWithCoeff(coeff(0.2), prng);
    expect(r1.threshold).toBeCloseTo(0.7, 5);
    expect(r1.success).toBe(true);  // roll 0.1 < 0.7
    const r2 = rollWithCoeff(coeff(0.2), prng);
    expect(r2.success).toBe(false); // roll 0.9 ≥ 0.7
  });
  test('successDelta 极端 clamp 到 [0.05,0.95]', () => {
    expect(rollWithCoeff(coeff(-1), () => 0.04).threshold).toBeCloseTo(0.05, 5);
    expect(rollWithCoeff(coeff(1), () => 0.99).threshold).toBeCloseTo(0.95, 5);
  });
});
