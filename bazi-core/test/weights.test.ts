import { expect, test } from 'vitest';
import { STEM_WEIGHT, HIDDEN_WEIGHT, MONTH_BRANCH_MULT, STRONG_CUT, WEAK_CUT } from '../src/constants/weights';
import { keMe, ke } from '../src/constants/gan-zhi';
import type { WuXing } from '../src/constants/gan-zhi';

test('共享权重值', () => {
  expect(STEM_WEIGHT).toBe(1.0);
  expect(HIDDEN_WEIGHT).toEqual({ 本气: 1.0, 中气: 0.6, 余气: 0.3 });
  expect(MONTH_BRANCH_MULT).toBe(3.0);
  expect(STRONG_CUT).toBe(0.55);
  expect(WEAK_CUT).toBe(0.45);
});

test('keMe = 克我者，且与 ke 互逆', () => {
  expect(keMe('木')).toBe('金'); // 金克木
  expect(keMe('土')).toBe('木'); // 木克土
  (['木', '火', '土', '金', '水'] as WuXing[]).forEach((w) => expect(ke(keMe(w))).toBe(w));
});
