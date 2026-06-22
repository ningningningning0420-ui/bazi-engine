import { describe, expect, test } from 'vitest';
import { buildPillar } from '../src/build-pillar';
import { analyzeStrength } from '../src/facts/strength';
import { analyzeRoots } from '../src/facts/roots';
import { __combosHelpers, detectGodCombos } from '../src/facts/combos';
import type { FourPillars, DayMaster, TenGodCategory } from '../src/types';

const DM_JIA: DayMaster = { gan: '甲', wuXing: '木', yinYang: '阳' };
const cats = (p: Partial<Record<TenGodCategory, number>>): Record<TenGodCategory, number> =>
  ({ 比劫: 0, 食伤: 0, 财: 0, 官杀: 0, 印: 0, ...p });

function H(four: FourPillars, dm = DM_JIA, c = cats({})) {
  const st = analyzeStrength(four, dm, c);
  const rt = analyzeRoots(four, dm);
  return __combosHelpers(four, dm, st, rt);
}

describe('combos helper', () => {
  test('force 排除日柱天干（日主自身不计比肩），日支藏干计入', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '甲', '子'), 月: buildPillar('甲', '乙', '丑'),
      日: buildPillar('甲', '甲', '寅'), 时: buildPillar('甲', '甲', '辰'),
    };
    const h = H(four);
    // 年干甲(比肩)+时干甲(比肩)=2.0；日干甲排除；日支寅本气甲(日支×1)=1.0 → 3.0
    expect(h.force('比肩')).toBeCloseTo(3.0, 5);
  });
  test('force 月支藏干 ×MONTH_BRANCH_MULT(3)', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '戊', '辰'), 月: buildPillar('甲', '戊', '午'), // 午本气丁(伤官)
      日: buildPillar('甲', '甲', '寅'), 时: null,
    };
    const h = H(four);
    expect(h.force('伤官')).toBeCloseTo(3.0, 5); // 午本气丁=伤官 1.0×3
  });
  test('transparencyFactor：透根1.0 / 透无根0.7 / 藏本气0.5 / 无0', () => {
    const rooted: FourPillars = {
      年: buildPillar('甲', '庚', '申'), 月: buildPillar('甲', '甲', '寅'),
      日: buildPillar('甲', '甲', '寅'), 时: null,
    };
    expect(H(rooted).t('七杀')).toBeCloseTo(1.0, 5);
    const floating: FourPillars = {
      年: buildPillar('甲', '庚', '寅'), 月: buildPillar('甲', '甲', '卯'),
      日: buildPillar('甲', '甲', '寅'), 时: null,
    };
    expect(H(floating).t('七杀')).toBeCloseTo(0.7, 5);
    const hidden: FourPillars = {
      年: buildPillar('甲', '甲', '辰'), 月: buildPillar('甲', '甲', '卯'),
      日: buildPillar('甲', '甲', '寅'), 时: null,
    };
    expect(H(hidden).t('偏财')).toBeCloseTo(0.5, 5); // 辰本气戊=偏财，仅藏本气
    expect(H(hidden).t('正官')).toBe(0); // 辛(正官)全缺
  });
  test('adjacencyFactor：贴邻1.0/同柱0.8/隔位0.5 + 确定性', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '辛', '酉'), 月: buildPillar('甲', '丁', '巳'),
      日: buildPillar('甲', '甲', '寅'), 时: buildPillar('甲', '己', '未'),
    };
    const h = H(four);
    expect(h.adj('正官', '伤官')).toBeCloseTo(1.0, 5); // 年↔月 贴邻
    expect(h.adj('伤官', '正财')).toBeCloseTo(0.5, 5); // 月(idx1)↔时(idx3) 隔位
    expect(h.adj('正官', '正官')).toBeCloseTo(0.8, 5); // 同位 → 同柱
  });
  test('cp 类别走 categoryForce（不漏同类另一十神，未饱和）', () => {
    // 甲日印=水：偏印壬(藏申中气0.6)、正印癸(藏子本气1.0+辰余气0.3=1.3)；cf(印)=1.9 都 <2 不饱和
    const four: FourPillars = {
      年: buildPillar('甲', '甲', '申'), 月: buildPillar('甲', '甲', '寅'),
      日: buildPillar('甲', '甲', '子'), 时: buildPillar('甲', '甲', '辰'),
    };
    const h = H(four);
    expect(h.cp('偏印')).toBeCloseTo(0.3, 5);   // 壬 0.6 / 2
    expect(h.cp('印')).toBeGreaterThan(h.cp('偏印')); // 类别含正+偏 > 单偏印
    expect(h.cp('印')).toBeLessThan(1);         // 1.9/2=0.95 未饱和
  });
  test('bodyStrong01 连续：强弱比0.45→0, 0.50→0.5, 0.55→1, 带外饱和', () => {
    const h = H({ 年: buildPillar('甲','甲','寅'), 月: buildPillar('甲','甲','寅'), 日: buildPillar('甲','甲','寅'), 时: null });
    expect(h.bodyStrong01(0.45)).toBeCloseTo(0, 5);
    expect(h.bodyStrong01(0.50)).toBeCloseTo(0.5, 5);
    expect(h.bodyStrong01(0.55)).toBeCloseTo(1, 5);
    expect(h.bodyStrong01(0.60)).toBeCloseTo(1, 5);
  });
});

function combos(four: FourPillars, dm = DM_JIA, c = cats({})) {
  const st = analyzeStrength(four, dm, c);
  const rt = analyzeRoots(four, dm);
  return detectGodCombos(four, dm, st, rt);
}
const find = (cs: ReturnType<typeof combos>, k: string) => cs.find((x) => x.类型 === k);

describe('detectGodCombos 12 组合', () => {
  test('伤官见官：伤官+正官同透贴邻无印 → 凶向命中、内含矛盾', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '辛', '酉'), 月: buildPillar('甲', '丁', '巳'),
      日: buildPillar('甲', '甲', '午'), 时: buildPillar('甲', '丁', '未'),
    };
    const h = find(combos(four), '伤官见官');
    expect(h).toBeDefined();
    expect(h!.极性).toBe('凶向');
    expect(h!.内含矛盾).toBe(true);
    expect(h!.成立程度).toBeGreaterThan(0.1);
  });
  test('印化伤：同盘加重水印 → 伤官见官被压低、伤官配印抬升', () => {
    const noYin: FourPillars = {
      年: buildPillar('甲', '辛', '酉'), 月: buildPillar('甲', '丁', '巳'),
      日: buildPillar('甲', '甲', '午'), 时: buildPillar('甲', '丁', '未'),
    };
    const withYin: FourPillars = {
      年: buildPillar('甲', '辛', '酉'), 月: buildPillar('甲', '丁', '巳'),
      日: buildPillar('甲', '甲', '子'), 时: buildPillar('甲', '癸', '亥'),
    };
    const d0 = find(combos(noYin), '伤官见官')!.成立程度;
    const d1 = find(combos(withYin), '伤官见官')?.成立程度 ?? 0;
    expect(d1).toBeLessThan(d0);
    expect(find(combos(withYin), '伤官配印')).toBeDefined();
  });
  test('同一七杀因制化神不同 degree 不同（抗查表卖点）', () => {
    const zhiSha: FourPillars = {
      年: buildPillar('甲', '庚', '申'), 月: buildPillar('甲', '丙', '寅'),
      日: buildPillar('甲', '甲', '寅'), 时: buildPillar('甲', '丙', '午'),
    };
    expect(find(combos(zhiSha), '食神制杀')).toBeDefined();
    // 杀重无制需纯金(酉)无印(壬癸)无食伤(丙丁)：申藏壬印会变杀印相生，故用酉
    const wuZhi: FourPillars = {
      年: buildPillar('甲', '庚', '酉'), 月: buildPillar('甲', '庚', '酉'),
      日: buildPillar('甲', '甲', '卯'), 时: buildPillar('甲', '庚', '酉'),
    };
    expect(find(combos(wuZhi), '杀重无制')).toBeDefined();
    expect(find(combos(wuZhi), '食神制杀')).toBeUndefined();
  });
  test('杀重无制：force(七杀)≈SHA_LIGHT 附近 degree≈0（ramp 连续门，抗踩线）', () => {
    const light: FourPillars = {
      年: buildPillar('甲', '甲', '寅'), 月: buildPillar('甲', '甲', '寅'),
      日: buildPillar('甲', '甲', '寅'), 时: buildPillar('甲', '庚', '午'),
    };
    expect(find(combos(light), '杀重无制')).toBeUndefined();
  });
  test('官印相生：制化系数 = 1 − 伤官见官 raw degree（#11 读 #1 缓存）', () => {
    // 中度水印(癸月干)：伤官见官 raw=0.25(存在)，官印相生 degree>0.1(存在)，制化系数=1−0.25=0.75
    const four: FourPillars = {
      年: buildPillar('甲', '辛', '酉'), 月: buildPillar('甲', '癸', '卯'),
      日: buildPillar('甲', '甲', '午'), 时: buildPillar('甲', '丁', '巳'),
    };
    const cs = combos(four);
    const gy = find(cs, '官印相生');
    const sg = find(cs, '伤官见官');
    expect(gy).toBeDefined();
    expect(sg).toBeDefined();
    expect(gy!.力量快照['制化系数']).toBeLessThan(1);
    expect(gy!.力量快照['制化系数']).toBeCloseTo(1 - sg!.成立程度, 2);
  });
  test('确定性：同输入两次深相等', () => {
    const four: FourPillars = {
      年: buildPillar('甲', '庚', '申'), 月: buildPillar('甲', '丙', '寅'),
      日: buildPillar('甲', '甲', '辰'), 时: buildPillar('甲', '己', '丑'),
    };
    expect(combos(four)).toEqual(combos(four));
  });
  test('抗查表回归：仅位置改变(贴邻→隔位) → degree 随关系位置变化(非二元常数)', () => {
    // 同样的伤官丁+正官辛+同力量，仅把正官从年(贴邻月伤官)挪到时(隔位) → 相邻 1.0→0.5
    const adjPos: FourPillars = {
      年: buildPillar('甲', '辛', '酉'), 月: buildPillar('甲', '丁', '巳'),
      日: buildPillar('甲', '甲', '午'), 时: buildPillar('甲', '甲', '寅'),
    };
    const farPos: FourPillars = {
      年: buildPillar('甲', '甲', '寅'), 月: buildPillar('甲', '丁', '巳'),
      日: buildPillar('甲', '甲', '午'), 时: buildPillar('甲', '辛', '酉'),
    };
    const d0 = find(combos(adjPos), '伤官见官')!.成立程度;
    const d1 = find(combos(farPos), '伤官见官')!.成立程度;
    expect(d1).toBeLessThan(d0);
  });
  test('空时柱不崩 + 全比劫盘无财类组合', () => {
    const noHour: FourPillars = {
      年: buildPillar('甲', '甲', '寅'), 月: buildPillar('甲', '甲', '寅'),
      日: buildPillar('甲', '甲', '寅'), 时: null,
    };
    expect(() => combos(noHour)).not.toThrow();
    expect(find(combos(noHour), '比劫夺财')).toBeUndefined();
  });
});
