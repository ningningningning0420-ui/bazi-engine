import { GAN_WUXING, sheng, ke, shengMe, keMe, type WuXing } from '../constants/gan-zhi';
import { computeChartFacts } from '../analyze-chart';
import { selectLuckPillars } from './luck-pillars';
import { perturbField } from './field';
import type {
  Chart, AtDate, GrainSet, Tendency, DomainTendency, DomainKind, Direction, Intensity, LuckTrend,
} from '../types';

const DIR_EPS = 0.15;
const round2 = (x: number): number => Math.round(x * 100) / 100;
const intensityOf = (m: number): Intensity => (m < 0.5 ? '微' : m < 1.5 ? '中' : '显');
const DOMAIN_ORDER: DomainKind[] = ['事业权位', '财', '关系情感', '健康', '心性波动', '名声口舌'];

/** 域 → 关注五行（相对日主五行 dmW·标准命理域语义·非干支→性格表）。 */
function domainFocus(域: DomainKind, dmW: WuXing, gender: '乾' | '坤'): WuXing[] {
  switch (域) {
    case '事业权位': return [keMe(dmW), shengMe(dmW)];
    case '财': return [ke(dmW), sheng(dmW)];
    case '关系情感': return [gender === '乾' ? ke(dmW) : keMe(dmW)];
    case '健康': return [dmW, shengMe(dmW)];
    case '心性波动': return [sheng(dmW), shengMe(dmW)];
    case '名声口舌': return [keMe(dmW), shengMe(dmW)];
  }
}

// ★命理-free 行为短语池（域日常词避开五行/十神字·纯渲染层·真值=结构化域倾向）
const DOMAIN_WORD: Record<DomainKind, string> = {
  事业权位: '事业', 财: '经济', 关系情感: '人际', 健康: '状态', 心性波动: '心绪', 名声口舌: '风评',
};
function phrase(d: DomainTendency): string {
  const w = DOMAIN_WORD[d.域];
  const deg = d.强度 === '显' ? '明显' : d.强度 === '中' ? '较' : '略';
  if (d.方向 === '↑') return `近期在${w}上${deg}有起色`;
  if (d.方向 === '↓') return `近期在${w}上${deg}承压`;
  if (d.方向 === '动荡') return `近期${w}起伏不定`;
  return `近期${w}大致平稳`;
}

/** L3 流年推手：结构化域倾向(权威真值) + 命理-free 隐藏暗示(薄渲染)。 */
export function deriveTendency(chart: Chart, atDate: AtDate, grain: GrainSet): Tendency {
  const facts = computeChartFacts(chart.birthInput);
  const dmW = chart.日主.wuXing;
  const favorSign = facts.分析.用神.favorSign;
  const luck = selectLuckPillars(chart, atDate, grain);
  const field = perturbField(facts, luck);

  // 大运以天干为先导（计划 line606）：用大运天干五行的 favorSign 定吉凶倾向
  const 大运W = luck.大运 ? GAN_WUXING[luck.大运.gan] : null;
  const 大运吉凶倾向: LuckTrend = 大运W == null ? '未起运'
    : favorSign[大运W] > 0 ? '用神运' : favorSign[大运W] < 0 ? '忌神运' : '中性';

  const 动荡冲 = field.作用.some((a) => a.类型 === '刑冲');
  const 域倾向: DomainTendency[] = DOMAIN_ORDER.map((域) => {
    const focus = domainFocus(域, dmW, chart.birthInput.gender);
    const net = focus.reduce((a, w) => a + field.Δfield[w] * favorSign[w], 0);
    const 软域 = 域 === '关系情感' || 域 === '健康' || 域 === '心性波动' || 域 === '名声口舌';
    // 方向以 net(favorSign内积)为主；仅当 net 落'平'带且软域有刑冲时升格'动荡'(不washout强方向)
    const 方向: Direction = net > DIR_EPS ? '↑' : net < -DIR_EPS ? '↓' : (软域 && 动荡冲 ? '动荡' : '平');
    return {
      域, 方向, 强度: intensityOf(Math.abs(net)), net: round2(net),
      依据: `${域}关注五行[${focus.join('')}]·net=${round2(net)}(Δfield×favorSign)`,
    };
  }).sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || DOMAIN_ORDER.indexOf(a.域) - DOMAIN_ORDER.indexOf(b.域));

  const 隐藏暗示 = 域倾向.slice(0, 2).map(phrase).join('；');
  return {
    当运干支: {
      大运: luck.大运 ? luck.大运.gan + luck.大运.zhi : null,
      流年: luck.流年.gan + luck.流年.zhi,
      流月: luck.流月 ? luck.流月.gan + luck.流月.zhi : null,
      流日: luck.流日 ? luck.流日.gan + luck.流日.zhi : null,
    },
    大运吉凶倾向, 作用: field.作用, 域倾向, Δfield_blend: field.Δfield, 净吉凶: field.净吉凶,
    隐藏暗示, rawFlags: field.rawFlags, caveats: luck.caveats,
  };
}
