import { describe, expect, test } from 'vitest';
import { computeChartFacts } from '../src/analyze-chart';
import { buildScripturePrompt } from '../src/persona/prompt';
import { seedToBirth } from '../src/seed-to-birth';
import { 主导驱力池 } from '../src/types';
import {
  renderScripturePromptText, parseScriptureReply, buildBarePrompt, pickTwins, buildBlindPack,
  type BlindEntry,
} from '../test-bed/lib';

const facts = computeChartFacts({ year: 1990, month: 6, day: 15, hour: 10, hourUnknown: false, gender: '乾' });
const sp = buildScripturePrompt(facts);

describe('冒烟台 · renderScripturePromptText', () => {
  test('含命局结构/白名单逐条/硬护栏/enum池/输出契约标签', () => {
    const text = renderScripturePromptText(sp);
    expect(text).toContain(sp.命局结构.split('\n')[0]!);
    for (const s of sp.可cite白名单) expect(text).toContain(s);
    expect(text).toContain(sp.硬护栏);
    for (const v of 主导驱力池) expect(text).toContain(v);   // enum 池必须喂给模型
    expect(text).toContain('<anchors>');
    expect(text).toContain('<scripture>');
  });
  test('priorViolations 渲染 + 确定性', () => {
    const spV = buildScripturePrompt(facts, ['cite了不存在的结构X']);
    expect(renderScripturePromptText(spV)).toContain('cite了不存在的结构X');
    expect(renderScripturePromptText(sp)).toBe(renderScripturePromptText(sp));
  });
});

describe('冒烟台 · parseScriptureReply', () => {
  test('标准标签 → anchors 对象 + 正文', () => {
    const r = parseScriptureReply('前言\n<anchors>\n{"主导驱力":"求成就"}\n</anchors>\n<scripture>\n他是一个…\n</scripture>');
    expect(r.anchors).toEqual({ 主导驱力: '求成就' });
    expect(r.scriptureText).toBe('他是一个…');
  });
  test('anchors 缺失/坏 JSON → anchors=null·全文当正文（交 core 触发 retry）', () => {
    expect(parseScriptureReply('没有标签的纯文本').anchors).toBeNull();
    expect(parseScriptureReply('没有标签的纯文本').scriptureText).toBe('没有标签的纯文本');
    expect(parseScriptureReply('<anchors>{坏json</anchors><scripture>x</scripture>').anchors).toBeNull();
  });
  test('容错：json 围栏包裹的 anchors 也认', () => {
    const r = parseScriptureReply('<anchors>\n```json\n{"a":1}\n```\n</anchors>\n<scripture>s</scripture>');
    expect(r.anchors).toEqual({ a: 1 });
  });
});

describe('冒烟台 · buildBarePrompt（等努力 OFF 对照）', () => {
  test('同任务同输出规格·零命理注入', () => {
    const bare = buildBarePrompt('客人7号');
    expect(bare).toContain('客人7号');
    expect(bare).toContain('<scripture>');           // 同输出契约
    expect(bare).toMatch(/性格地基|动机|弱点/);       // 同写作任务规格
    expect(bare).not.toMatch(/用神|十神|命局|白名单|favorSign/); // 无命盘骨架
  });
});

describe('冒烟台 · pickTwins', () => {
  test('从 seed 派生盘里挑出身强弱相反的一对·确定性', () => {
    const list = Array.from({ length: 40 }, (_, i) => computeChartFacts(seedToBirth(i)));
    const pair = pickTwins(list);
    expect(pair).not.toBeNull();
    const [a, b] = pair!;
    const sa = list[a]!.分析.旺衰.身强弱, sb = list[b]!.分析.旺衰.身强弱;
    expect(sa).not.toBe(sb);
    expect(pickTwins(list)).toEqual(pair);
  });
});

describe('冒烟台 · buildBlindPack', () => {
  const entries: BlindEntry[] = [
    { id: 'on-1', source: 'ON', seed: 1, text: 'AAA' },
    { id: 'off-1', source: 'OFF', seed: 1, text: 'BBB' },
    { id: 'on-2', source: 'ON', seed: 2, text: 'CCC' },
  ];
  test('盲文档无来源标签·答案钥全覆盖·同 seed 同顺序', () => {
    const p = buildBlindPack(entries, 42);
    expect(p.blindMarkdown).not.toContain('ON');
    expect(p.blindMarkdown).not.toContain('OFF');
    expect(p.blindMarkdown).toContain('AAA');
    expect(p.answerKey).toHaveLength(3);
    expect(new Set(p.answerKey.map((k) => k.blindId)).size).toBe(3);
    expect(buildBlindPack(entries, 42)).toEqual(p);
  });
  test('不同 seed 大概率不同顺序（洗牌真的在洗）', () => {
    const many: BlindEntry[] = Array.from({ length: 8 }, (_, i) => ({ id: `e${i}`, source: 'ON', seed: i, text: `t${i}` }));
    const a = buildBlindPack(many, 1).answerKey.map((k) => k.seed).join(',');
    const b = buildBlindPack(many, 2).answerKey.map((k) => k.seed).join(',');
    expect(a).not.toBe(b);
  });
});
