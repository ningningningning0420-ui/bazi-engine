import { describe, expect, test } from 'vitest';
import { tenGod, category } from '../src/ten-gods';

describe('十神推导（日主=甲）', () => {
  const cases: [string, string][] = [
    ['甲', '比肩'], ['乙', '劫财'],   // 同木：阳=比肩，阴=劫财
    ['丙', '食神'], ['丁', '伤官'],   // 木生火（食伤）：阳=食神，阴=伤官
    ['戊', '偏财'], ['己', '正财'],   // 木克土（财）：阳=偏财，阴=正财
    ['庚', '七杀'], ['辛', '正官'],   // 金克木（官杀）：阳=七杀，阴=正官
    ['壬', '偏印'], ['癸', '正印'],   // 水生木（印）：阳=偏印，阴=正印
  ];
  test.each(cases)('甲 见 %s → %s', (target, expected) => {
    expect(tenGod('甲', target as any)).toBe(expected);
  });
});

describe('十神归类', () => {
  test('七杀/正官 → 官杀', () => {
    expect(category('七杀')).toBe('官杀');
    expect(category('正官')).toBe('官杀');
  });
  test('食神/伤官 → 食伤；正印/偏印 → 印', () => {
    expect(category('伤官')).toBe('食伤');
    expect(category('偏印')).toBe('印');
  });
});
