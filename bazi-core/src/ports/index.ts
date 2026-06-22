import type { AtDate, BirthInput, PersonaAnchors, ScripturePrompt } from '../types';

/** 只持久化这些（birthInput + 圣经/锚点）·ChartFacts 载入重算（§6.2）。 */
export interface PersistedNpc { npcId: string; birthInput: BirthInput; personaAnchors: PersonaAnchors; scriptureText: string; }

// ===== ports（host 经参数注入·core 不实现·依赖方向单向 adapter→core·§4.3）=====

/** 架空整年映射 / worldEpoch 用（消费 v2·接口先定）。 */
export interface SeedPort { hash(input: string): number; }
/** 当前剧情日期（可选·不提供 = L3/L4 关闭，只剩 L0–L2 性格地基）。 */
export interface ClockPort { now(): AtDate; }
/** 读写 {birthInput, 圣经/锚点}（可选·core 只定形状不假设存储介质）。 */
export interface PersistencePort { load(npcId: string): PersistedNpc | null; save(npc: PersistedNpc): void; }
/** host 提供"写圣经"的 LLM 调用（core 提供 prompt 契约 + validatePersonaAnchors·不自己调 LLM）。
 *  anchors 为 unknown——adapter 先 PersonaAnchorsSchema.safeParse 再 validate（LLM 可能产非法 enum）。 */
export interface LlmInvokePort { writeScripture(prompt: ScripturePrompt): Promise<{ anchors: unknown; scriptureText: string }>; }
