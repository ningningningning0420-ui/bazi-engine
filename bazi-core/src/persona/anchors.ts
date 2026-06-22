import { z } from 'zod';
import { 主导驱力池, 对人基调池, 命门池 } from '../types';
export { 主导驱力池, 对人基调池, 命门池 } from '../types';

/** 台前禁词：命理术语黑名单（行为倾向标签/隐藏暗示 须命理-free·红线② 机器执法）。 */
export const MINGLI_FORBIDDEN =
  /[木火土金水]|官杀|正官|七杀|偏财|正财|财星|偏印|正印|印星|食神|伤官|食伤|比肩|劫财|比劫|旺衰|身强|身弱|用神|喜神|忌神|流年|大运|流月|刑冲|合化|通关|调候|格局|favorSign/;

export const PersonaAnchorsSchema = z.object({
  主导驱力: z.enum(主导驱力池),
  对人基调: z.enum(对人基调池),
  命门: z.enum(命门池),
  行为倾向标签: z.array(z.string()),
  滋养向: z.array(z.enum(['木', '火', '土', '金', '水'])),
  citedStructures: z.array(z.string()),
  优缺同源锚: z.object({ 优点cite: z.string(), 弱点cite: z.string() }),
});
