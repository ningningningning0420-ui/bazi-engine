import { extractCitableStructures } from './structures';
import type { ChartFacts, ScripturePrompt } from '../types';

const HARDGUARD =
  '【八字引擎硬护栏·命理零泄漏】正文严禁把命理推导当作叙事的解释/因果——天干地支、五行、十神、流年、命格、旺衰、用神等术语不得出现在台前正文。命理只是你写圣经的内部依据。唯一例外=角色在剧情里主动算命/谈命理（diegetic）。';

/** 提 L1 锚点喂命师 LLM 写圣经（含命理=后台 prompt·非正文）。cite 白名单逐字喂·LLM 只能从白名单原样复制。 */
export function buildScripturePrompt(facts: ChartFacts, priorViolations: string[] = []): ScripturePrompt {
  const an = facts.分析;
  const cit = extractCitableStructures(facts);

  const 用神 = `用神：主用神=${an.用神.主用神}（来源 ${an.用神.来源}）·喜=[${an.用神.喜.join('')}]·忌=[${an.用神.忌.join('')}]`;
  const 组合 = `十神组合：${an.十神组合.map((c) => `${c.类型}(成立${c.成立程度}·${c.极性})`).join('；') || '（无显著组合）'}`;
  const 张力 = `矛盾张力轴：${an.矛盾张力.矛盾张力轴.map((a) => `${a.轴名}[${a.两极.join('↔')}]`).join('；') || '（无）'}`;
  const 拓扑 = `涌现拓扑：流通${an.涌现拓扑.flowLevel}·相战[${an.涌现拓扑.clashes.map((c) => `${c.克}${c.受}`).join('/') || '无'}]·独旺[${an.涌现拓扑.dominant.map((d) => d.wuXing).join('') || '无'}]·独缺[${an.涌现拓扑.missing.map((m) => m.wuXing).join('') || '无'}]`;
  const 旺衰 = `旺衰：${an.旺衰.身强弱}${an.旺衰.borderline ? '(borderline)' : ''}·月令${an.旺衰.月令旺衰}`;
  const 调候 = `调候：${an.调候.寒暖标签}/${an.调候.燥湿标签}·级别${an.调候.级别 ?? '无'}`;
  const 格局 = `格局：${an.格局.格}（${an.格局.立格依据}）`;
  const 命局结构 = [用神, 组合, 张力, 拓扑, 旺衰, 调候, 格局].join('\n');

  const 写作任务 =
    '把这堆关系性结论"断成一个人"：性格地基/动机/说话方式/关系模式/弱点/成长弧/阿喀琉斯之踵。一次性写定存档。';
  const 双寄存器指令 =
    '圣经写两层：①后台（cite 命理结构·过引擎校验·永不外露）②台前人物画像（纯行为/心理语言·零命理词·供实时注入）。行为倾向标签只能用台前语言。';
  const cite要求 =
    `填 PersonaAnchors：citedStructures 只能从下方【可cite白名单】原样复制字符串（不得改写/翻译/自造），至少 ${Math.min(3, cit.all.length)} 条；每条矛盾张力轴须在成长弧或弱点段落具体展开；优缺同源锚（优点cite/弱点cite）须同为下方【优缺同源候选】中的同一个结构；滋养向须取自命局喜用五行。`;
  const 一盘多解 =
    '同一结构可有多种自洽读法（如同一伤官见官可读成叛逆艺术家/腐败改革者/笑面权臣）——只定下限不锁人格，选一条自洽读法即可，不求标准答案。borderline 命理修辞可在叙事文本随意说，但绝不回写 favorSign/喜忌符号。';

  return {
    命局结构, 可cite白名单: cit.all, 优缺同源候选: cit.优缺同源点,
    写作任务, 双寄存器指令, cite要求, 一盘多解, 硬护栏: HARDGUARD, priorViolations,
  };
}
