import type { ChartFacts, CitableStructures } from '../types';

/** ★cite 单一真相源：buildScripturePrompt 当白名单逐字喂 LLM·validatePersonaAnchors 据此校验（杜绝两侧拼串漂移）。 */
export function extractCitableStructures(facts: ChartFacts): CitableStructures {
  const an = facts.分析;
  const 组合 = an.十神组合.map((c) => c.类型);
  const 张力轴 = an.矛盾张力.矛盾张力轴.map((a) => a.轴名);
  const 相战 = an.涌现拓扑.clashes.map((c) => `${c.克}${c.受}相战`);
  const 通关 = an.涌现拓扑.tongGuanReport.filter((n) => n.status === '调和中').map((n) => `${n.node}通关`);
  const 通关缺 = an.涌现拓扑.tongGuanReport.filter((n) => n.status === '缺位待补').map((n) => `${n.node}通关缺位`);
  const 格局 = [an.格局.格];
  const all = [...new Set([...组合, ...张力轴, ...相战, ...通关, ...通关缺, ...格局])];
  return { all, 优缺同源点: [...new Set(an.矛盾张力.优缺同源点.map((p) => p.结构cite))], 张力轴 };
}
