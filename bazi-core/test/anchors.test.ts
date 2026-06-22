import { describe, expect, test } from 'vitest';
import { PersonaAnchorsSchema, MINGLI_FORBIDDEN, 主导驱力池 } from '../src/persona/anchors';

describe('PersonaAnchors schema + 禁词', () => {
  test('合法 anchors 通过 zod', () => {
    const ok = PersonaAnchorsSchema.safeParse({
      主导驱力: '求成就', 对人基调: '亲和', 命门: '偏执', 行为倾向标签: ['谨慎', '念旧'],
      滋养向: ['水', '木'], citedStructures: ['伤官见官'], 优缺同源锚: { 优点cite: '伤官见官', 弱点cite: '伤官见官' },
    });
    expect(ok.success).toBe(true);
  });
  test('非法枚举拒收', () => {
    expect(PersonaAnchorsSchema.safeParse({
      主导驱力: '乱填', 对人基调: '亲和', 命门: '偏执', 行为倾向标签: [], 滋养向: [],
      citedStructures: [], 优缺同源锚: { 优点cite: '', 弱点cite: '' },
    }).success).toBe(false);
  });
  test('滋养向非五行拒收', () => {
    expect(PersonaAnchorsSchema.safeParse({
      主导驱力: '求成就', 对人基调: '亲和', 命门: '偏执', 行为倾向标签: [], 滋养向: ['乱'],
      citedStructures: [], 优缺同源锚: { 优点cite: '', 弱点cite: '' },
    }).success).toBe(false);
  });
  test('MINGLI_FORBIDDEN 命中命理词·放过行为词', () => {
    expect(MINGLI_FORBIDDEN.test('食伤旺')).toBe(true);
    expect(MINGLI_FORBIDDEN.test('身弱')).toBe(true);
    expect(MINGLI_FORBIDDEN.test('谨慎念旧')).toBe(false);
    expect(主导驱力池.length).toBe(7);
  });
});
