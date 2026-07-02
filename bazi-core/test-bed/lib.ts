// H2 圣经实弹冒烟台 · 纯逻辑层（无 IO·可 TDD）
// 职责：prompt 渲染 / 回复解析 / 等努力裸 LLM 对照 / 双胞胎挑选 / 确定性盲评打包。
// 真 API 调用在 smoke.test.ts（SMOKE=1 闸门）。

import type { ChartFacts, ScripturePrompt } from '../src/types';
import { 主导驱力池, 对人基调池, 命门池 } from '../src/types';

const OUTPUT_CONTRACT = `【输出格式·严格遵守】先输出锚点 JSON，再输出圣经全文，用如下标签包裹（标签逐字照抄）：
<anchors>
{"主导驱力":"…","对人基调":"…","命门":"…","行为倾向标签":["…"],"滋养向":["…"],"citedStructures":["…"],"优缺同源锚":{"优点cite":"…","弱点cite":"…"}}
</anchors>
<scripture>
（圣经全文：性格地基/动机/说话方式/关系模式/弱点/成长弧/阿喀琉斯之踵，800-1500字）
</scripture>`;

const ENUM_POOLS = `【锚点取值池·只能从中选】
主导驱力 ∈ [${主导驱力池.join('、')}]
对人基调 ∈ [${对人基调池.join('、')}]
命门 ∈ [${命门池.join('、')}]`;

/** ScripturePrompt（结构化契约）→ 单条文本 prompt。
 *  引擎的 ScripturePrompt 不携带 enum 池与输出格式契约——那是适配层的活，此处补上。 */
export function renderScripturePromptText(sp: ScripturePrompt): string {
  const parts = [
    '你是一位深谙命理的命师，任务：' + sp.写作任务,
    '【命局结构（后台依据·勿抄进正文）】\n' + sp.命局结构,
    '【可cite白名单（citedStructures 只能原样复制其中的字符串）】\n' + sp.可cite白名单.map((s) => `- ${s}`).join('\n'),
    '【优缺同源候选】\n' + (sp.优缺同源候选.length ? sp.优缺同源候选.map((s) => `- ${s}`).join('\n') : '（无·此项豁免）'),
    sp.双寄存器指令,
    sp.cite要求,
    sp.一盘多解,
    sp.硬护栏,
    ENUM_POOLS,
    OUTPUT_CONTRACT,
  ];
  if (sp.priorViolations.length) {
    parts.push('【上一次产出被拒·原因如下·请修正后重写】\n' + sp.priorViolations.map((v) => `- ${v}`).join('\n'));
  }
  return parts.join('\n\n');
}

/** 解析 LLM 回复：<anchors>JSON</anchors> + <scripture>正文</scripture>。
 *  容错：anchors 内允许 ```json 围栏；缺失/坏 JSON → anchors=null（交 core safeParse 触发 retry）。 */
export function parseScriptureReply(text: string): { anchors: unknown; scriptureText: string } {
  const am = text.match(/<anchors>([\s\S]*?)<\/anchors>/);
  const sm = text.match(/<scripture>([\s\S]*?)<\/scripture>/);
  let anchors: unknown = null;
  if (am) {
    const raw = am[1]!.replace(/```(?:json)?/g, '').trim();
    try { anchors = JSON.parse(raw); } catch { anchors = null; }
  }
  const scriptureText = (sm ? sm[1]! : text).trim();
  return { anchors, scriptureText };
}

/** 等努力裸 LLM 对照 prompt（engine-OFF 侧）：同任务/同输出规格/同字数期望，唯独没有命盘骨架。 */
export function buildBarePrompt(seedLabel: string): string {
  return [
    `你是一位人物设计师，任务：为都市怪谈事务所的一位来客（编号 ${seedLabel}）创作深度人物圣经——把这个人"立起来"：性格地基/动机/说话方式/关系模式/弱点/成长弧/阿喀琉斯之踵。要求人物内在自洽、优缺点有同一来源、避免廉价矛盾。一次性写定。`,
    '写两层：①深层人物分析（内在结构与因果）②台前人物画像（纯行为/心理语言，供实时扮演注入）。',
    `【输出格式·严格遵守】\n<scripture>\n（圣经全文：800-1500字）\n</scripture>`,
  ].join('\n\n');
}

/** 结构对照双胞胎：挑「身强弱相反且主用神不同」的一对，返回索引。
 *  确定性：固定顺序扫描取第一对；找不到则退而求主用神不同的第一对；再不行返回 null。 */
export function pickTwins(factsList: ChartFacts[]): [number, number] | null {
  const opposed = (a: string, b: string): boolean =>
    (a === '身强' && b === '身弱') || (a === '身弱' && b === '身强');
  let fallback: [number, number] | null = null;
  for (let i = 0; i < factsList.length; i++) {
    for (let j = i + 1; j < factsList.length; j++) {
      const A = factsList[i]!.分析, B = factsList[j]!.分析;
      const diffFavor = A.用神.主用神 !== B.用神.主用神;
      if (opposed(A.旺衰.身强弱, B.旺衰.身强弱) && diffFavor) return [i, j];
      if (!fallback && A.旺衰.身强弱 !== B.旺衰.身强弱 && diffFavor) fallback = [i, j];
    }
  }
  return fallback;
}

export interface BlindEntry { id: string; source: 'ON' | 'OFF'; seed: number; text: string; }
export interface BlindPack { blindMarkdown: string; answerKey: { blindId: string; source: string; seed: number }[]; }

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 确定性盲评打包：mulberry32(shuffleSeed) Fisher-Yates 洗牌，产出无来源标签 markdown + 答案钥。 */
export function buildBlindPack(entries: BlindEntry[], shuffleSeed: number): BlindPack {
  const rng = mulberry32(shuffleSeed);
  const order = entries.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  const shuffled = order.map((i) => entries[i]!);
  const blindMarkdown = shuffled
    .map((e, idx) => `## 样本 ${String.fromCharCode(65 + idx)}\n\n${e.text}`)
    .join('\n\n---\n\n');
  const answerKey = shuffled.map((e, idx) => ({
    blindId: `样本 ${String.fromCharCode(65 + idx)}`, source: e.source, seed: e.seed,
  }));
  return { blindMarkdown, answerKey };
}
