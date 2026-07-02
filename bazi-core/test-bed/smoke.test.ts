// H2 圣经实弹冒烟（设计文档 §13 H2 · 卡工程动工 gate）
//
// 用法（在 bazi-core 目录）：
//   SMOKE=1 ANTHROPIC_API_KEY=sk-... npx vitest run --config test-bed/vitest.config.ts
// 可选环境变量：
//   SMOKE_MODEL     模型 id（默认 claude-opus-4-8）
//   SMOKE_N         普通 seed 数（默认 6·另加双胞胎 2 个）
//   ANTHROPIC_BASE_URL  中转地址（须兼容 Anthropic messages 协议）
//
// 产出（test-bed/out/）：
//   盲评.md        ON/OFF 混洗无标签 → 作者盲评「厚度/不重样」
//   answerkey.json 答案钥（盲评后再看）
//   twins.md       结构双胞胎对照（身强弱相反·主用神不同）→ 验可分辨性
//   metrics.json   retry 率 / 违规原因分布（含 MINGLI 单字误伤计数）/ token 用量
//
// 无 SMOKE=1 时整套跳过（不误触计费）。

import { describe, test, expect } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { computeChartFacts } from '../src/analyze-chart';
import { seedToBirth } from '../src/seed-to-birth';
import { ensurePersona } from '../src/adapters/generic';
import type { PersistencePort, LlmInvokePort, PersistedNpc } from '../src/ports';
import type { ScripturePrompt } from '../src/types';
import { renderScripturePromptText, parseScriptureReply, buildBarePrompt, pickTwins, buildBlindPack, type BlindEntry } from './lib';

const RUN = process.env.SMOKE === '1';
const MODEL = process.env.SMOKE_MODEL ?? 'claude-opus-4-8';
const N = Number(process.env.SMOKE_N ?? 6);
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out');

interface SeedMetrics {
  seed: number; ok: boolean; attempts: number;
  violations: string[]; ms: number;
  inputTokens: number; outputTokens: number;
  error?: string;
}

describe.skipIf(!RUN)('H2 圣经实弹冒烟（SMOKE=1 才跑·真 API·计费）', () => {
  test('ON/OFF 生成 + 盲评包 + 双胞胎 + metrics', async () => {
    const client = new Anthropic();
    const usage = { input: 0, output: 0 };

    async function callModel(promptText: string): Promise<string> {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        messages: [{ role: 'user', content: promptText }],
      });
      usage.input += resp.usage.input_tokens;
      usage.output += resp.usage.output_tokens;
      if (resp.stop_reason === 'refusal') throw new Error('模型拒答(refusal)');
      return resp.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n');
    }

    // 双胞胎：扫 60 个 seed 挑身强弱相反且主用神不同的一对
    const scanFacts = Array.from({ length: 60 }, (_, i) => computeChartFacts(seedToBirth(i)));
    const twinPair = pickTwins(scanFacts);
    const twinSeeds = twinPair ? twinPair : [];
    const normalSeeds = Array.from({ length: N }, (_, i) => 1000 + i);
    const onSeeds = [...new Set([...normalSeeds, ...twinSeeds])];

    const metrics: SeedMetrics[] = [];
    const onResults = new Map<number, PersistedNpc>();

    async function runOn(seed: number): Promise<void> {
      const t0 = Date.now();
      const m: SeedMetrics = { seed, ok: false, attempts: 0, violations: [], ms: 0, inputTokens: 0, outputTokens: 0 };
      const store = new Map<string, PersistedNpc>();
      const persistence: PersistencePort = { load: (id) => store.get(id) ?? null, save: (n) => void store.set(n.npcId, n) };
      const llm: LlmInvokePort = {
        writeScripture: async (prompt: ScripturePrompt) => {
          m.attempts++;
          m.violations.push(...prompt.priorViolations); // 上一轮被拒的原因（首轮为空）
          const reply = await callModel(renderScripturePromptText(prompt));
          return parseScriptureReply(reply);
        },
      };
      try {
        const npc = await ensurePersona(`smoke-on-${seed}`, seedToBirth(seed), { persistence, llm });
        onResults.set(seed, npc);
        m.ok = true;
      } catch (e) {
        m.error = e instanceof Error ? e.message : String(e);
      }
      m.ms = Date.now() - t0;
      metrics.push(m);
    }

    const offResults = new Map<number, string>();
    async function runOff(seed: number): Promise<void> {
      const reply = await callModel(buildBarePrompt(`seed-${seed}`));
      offResults.set(seed, parseScriptureReply(reply).scriptureText);
    }

    // 并发上限 3 的分批执行（对速率限制友好）
    const jobs: (() => Promise<void>)[] = [
      ...onSeeds.map((s) => () => runOn(s)),
      ...normalSeeds.map((s) => () => runOff(s)),
    ];
    for (let i = 0; i < jobs.length; i += 3) {
      await Promise.all(jobs.slice(i, i + 3).map((j) => j()));
    }

    // ===== 产出 =====
    mkdirSync(OUT, { recursive: true });

    const entries: BlindEntry[] = [];
    for (const s of normalSeeds) {
      const on = onResults.get(s);
      if (on) entries.push({ id: `on-${s}`, source: 'ON', seed: s, text: on.scriptureText });
      const off = offResults.get(s);
      if (off) entries.push({ id: `off-${s}`, source: 'OFF', seed: s, text: off });
    }
    const pack = buildBlindPack(entries, 20260702);
    writeFileSync(join(OUT, '盲评.md'), `# 圣经盲评（勿先看 answerkey）\n\n评什么：①厚度（人物是否立得住·矛盾是否有因果）②不重样（跨样本人格是否雷同）\n\n${pack.blindMarkdown}\n`);
    writeFileSync(join(OUT, 'answerkey.json'), JSON.stringify(pack.answerKey, null, 2));

    if (twinPair) {
      const [a, b] = twinPair;
      const lines = [`# 结构双胞胎对照（引擎可分辨性）`, ''];
      for (const [label, idx] of [['甲', a], ['乙', b]] as const) {
        const f = scanFacts[idx]!;
        const on = onResults.get(idx);
        lines.push(`## 双胞胎${label}（seed=${idx}）`,
          `- 结构：${f.分析.旺衰.身强弱} · 主用神=${f.分析.用神.主用神}（${f.分析.用神.来源}） · 组合=[${f.分析.十神组合.slice(0, 3).map((c) => c.类型).join('/')}]`,
          '', on ? on.scriptureText : '（圣经生成失败·见 metrics）', '', '---', '');
      }
      lines.push('> 判据：两份圣经读起来是不是「两种人」；若结构相反却人格趋同 = 引擎在装潢（§0.1）。');
      writeFileSync(join(OUT, 'twins.md'), lines.join('\n'));
    }

    const mingliFalsePositive = metrics.flatMap((m) => m.violations).filter((v) => v.includes('台前纯净')).length;
    const summary = {
      model: MODEL,
      seeds: { normal: normalSeeds, twins: twinSeeds },
      ok率: `${metrics.filter((m) => m.ok).length}/${metrics.length}`,
      平均attempts: metrics.length ? (metrics.reduce((a, m) => a + m.attempts, 0) / metrics.length).toFixed(2) : '0',
      违规原因分布: countBy(metrics.flatMap((m) => m.violations)),
      台前纯净拦截次数_含MINGLI误伤观测: mingliFalsePositive,
      token用量: usage,
      perSeed: metrics,
    };
    writeFileSync(join(OUT, 'metrics.json'), JSON.stringify(summary, null, 2));

    // 冒烟成功判据（硬）：至少 80% 的 ON 圣经在 retry 预算内通过校验
    const okRate = metrics.filter((m) => m.ok).length / metrics.length;
    expect(okRate).toBeGreaterThanOrEqual(0.8);
  });
});

function countBy(items: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const key = it.slice(0, 40);
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}
