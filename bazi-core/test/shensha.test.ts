import { describe, test, expect } from 'vitest';
import {
  天乙, 文昌, 国印, 福星, 太极, 红艳, 流霞, 羊刃, 飞刃, 禄神, 金舆, 暗禄,
  三合局类, 劫灾亡, 红鸾, 天喜, 孤辰寡宿,
  天德, 月德, 月德合, 天医MAP,
  魁罡, 阴差阳错, 十恶大败, 金神, 六秀日,
} from '../src/constants/shensha-tables';
import { detectShensha } from '../src/facts/shensha';
import { buildPillar } from '../src/build-pillar';
import { computeChartFacts } from '../src/analyze-chart';
import { BirthInputSchema } from '../src/types';
import type { FourPillars, DayMaster } from '../src/types';

describe('shensha-tables 起例表自洽 + 必写死断言', () => {
  // 必写死断言 1：天乙(庚)=丑未,非寅午
  test('天乙(庚) = [丑,未]', () => {
    expect(天乙['庚']).toEqual(['丑', '未']);
    expect(天乙['庚']).not.toContain('寅');
  });
  // 必写死断言 2：禄(丙)=禄(戊)=巳(地支,非"己")
  test('禄神(丙)=禄神(戊)=巳', () => {
    expect(禄神['丙']).toBe('巳');
    expect(禄神['戊']).toBe('巳');
  });
  // 必写死断言 3：魁罡 含戊戌、不含壬戌
  test('魁罡含戊戌不含壬戌', () => {
    expect(魁罡.has('戊戌')).toBe(true);
    expect(魁罡.has('壬戌')).toBe(false);
    expect(魁罡.has('庚辰')).toBe(true);
    expect(魁罡.has('壬辰')).toBe(true);
    expect(魁罡.has('庚戌')).toBe(true);
  });
  test('羊刃只五阳干(A派)·阴干无', () => {
    expect(羊刃['甲']).toBe('卯');
    expect(羊刃['丙']).toBe('午');
    expect(羊刃['戊']).toBe('午');
    expect(羊刃['庚']).toBe('酉');
    expect(羊刃['壬']).toBe('子');
    expect(羊刃['乙']).toBeUndefined();
  });
  test('三合局类(寅午戌)桃花卯·驿马申·华盖戌·将星午', () => {
    expect(三合局类['寅'].桃花).toBe('卯');
    expect(三合局类['寅'].驿马).toBe('申');
    expect(三合局类['寅'].华盖).toBe('戌');
    expect(三合局类['寅'].将星).toBe('午');
  });
  test('十天干表齐全', () => {
    for (const t of [天乙, 文昌, 国印, 福星, 太极, 红艳, 流霞, 禄神, 金舆, 暗禄]) {
      expect(Object.keys(t)).toHaveLength(10);
    }
  });
});

// 测试盘:日干 甲;布置 卯(羊刃/天乙之一)、巳(文昌/禄?甲禄寅)、亥(暗禄甲)
function fourGapyin(): FourPillars {
  return {
    年: buildPillar('甲', '甲', '寅'),  // 甲禄在寅 → 日干甲 命中禄神(位置年)
    月: buildPillar('丁', '丁', '卯'),  // 甲羊刃在卯 → 命中羊刃(位置月)
    日: buildPillar('甲', '甲', '子'),
    时: buildPillar('甲', '甲', '亥'),  // 甲暗禄在亥(时)
  };
}
const DM_甲: DayMaster = { gan: '甲', wuXing: '木', yinYang: '阳' };

describe('detectShensha · byStem', () => {
  test('日干甲:禄神在寅(年柱命中)', () => {
    const r = detectShensha(fourGapyin(), DM_甲);
    const lu = r.hits.find((h) => h.name === '禄神');
    expect(lu).toBeDefined();
    expect(lu!.positions).toContain('年');
  });
  test('日干甲:羊刃在卯(月柱命中)', () => {
    const r = detectShensha(fourGapyin(), DM_甲);
    const yj = r.hits.find((h) => h.name === '羊刃');
    expect(yj!.positions).toEqual(['月']);
  });
  test('阴干日主无羊刃', () => {
    const f = fourGapyin();
    const r = detectShensha(f, { gan: '乙', wuXing: '木', yinYang: '阴' });
    expect(r.hits.find((h) => h.name === '羊刃')).toBeUndefined();
  });
  test('确定性:同盘两次深相等', () => {
    expect(detectShensha(fourGapyin(), DM_甲)).toEqual(detectShensha(fourGapyin(), DM_甲));
  });
});

describe('detectShensha · byYearBranch', () => {
  // 年支 寅(火局):桃花卯·驿马申·华盖戌·将星午;劫煞亥·灾煞子·亡神巳
  function fourYin寅(): FourPillars {
    return {
      年: buildPillar('甲', '甲', '寅'),
      月: buildPillar('丁', '丁', '卯'),  // 桃花卯
      日: buildPillar('甲', '甲', '申'),  // 驿马申
      时: buildPillar('甲', '甲', '戌'),  // 华盖戌
    };
  }
  test('年支寅:桃花卯(月)·驿马申(日)·华盖戌(时)', () => {
    const r = detectShensha(fourYin寅(), DM_甲);
    expect(r.hits.find((h) => h.name === '桃花')!.positions).toEqual(['月']);
    expect(r.hits.find((h) => h.name === '驿马')!.positions).toEqual(['日']);
    expect(r.hits.find((h) => h.name === '华盖')!.positions).toEqual(['时']);
  });
  test('年支寅:亡神在巳→无巳则不命中', () => {
    const r = detectShensha(fourYin寅(), DM_甲);
    expect(r.hits.find((h) => h.name === '亡神')).toBeUndefined();
  });
});

describe('detectShensha · byMonthBranch', () => {
  // 月支 寅:天德=丁(干)·月德=丙(干)·天医=丑(支·寅退一位)
  function four月寅(): FourPillars {
    return {
      年: buildPillar('甲', '甲', '子'),
      月: buildPillar('丁', '丁', '寅'),  // 天德丁(此柱天干丁→命中)
      日: buildPillar('甲', '甲', '丑'),  // 天医丑
      时: buildPillar('丙', '丙', '辰'),  // 月德丙(此柱天干丙→命中)
    };
  }
  test('月支寅:天德丁(命中月干)·月德丙(命中时干)·天医丑(命中日支)', () => {
    const r = detectShensha(four月寅(), DM_甲);
    expect(r.hits.find((h) => h.name === '天德贵人')!.positions).toContain('月');
    expect(r.hits.find((h) => h.name === '月德贵人')!.positions).toContain('时');
    expect(r.hits.find((h) => h.name === '天医')!.positions).toContain('日');
  });
});

describe('detectShensha · byPillar', () => {
  function four魁罡庚辰(): FourPillars {
    return {
      年: buildPillar('甲', '甲', '子'),
      月: buildPillar('丁', '丁', '卯'),
      日: buildPillar('庚', '庚', '辰'),  // 庚辰=魁罡+金舆? 庚金舆戌;此处测魁罡
      时: buildPillar('乙', '乙', '丑'),  // 乙丑=金神(时柱)
    };
  }
  const DM_庚: DayMaster = { gan: '庚', wuXing: '金', yinYang: '阳' };
  test('日柱庚辰=魁罡(位置日)', () => {
    const r = detectShensha(four魁罡庚辰(), DM_庚);
    expect(r.hits.find((h) => h.name === '魁罡')!.positions).toEqual(['日']);
  });
  test('时柱乙丑=金神(位置时)', () => {
    const r = detectShensha(four魁罡庚辰(), DM_庚);
    expect(r.hits.find((h) => h.name === '金神')!.positions).toContain('时');
  });
});

describe('detectShensha · special 元辰', () => {
  // 阳男·年支子 → 元辰未
  function four年子(): FourPillars {
    return {
      年: buildPillar('甲', '甲', '子'),
      月: buildPillar('丁', '丁', '未'),  // 未=阳男元辰
      日: buildPillar('甲', '甲', '寅'),
      时: buildPillar('甲', '甲', '亥'),
    };
  }
  test('阳男年支子:元辰未(命中月)', () => {
    const r = detectShensha(four年子(), DM_甲, { gender: '乾' });
    expect(r.hits.find((h) => h.name === '元辰')!.positions).toContain('月');
  });
  test('不传性别:元辰不算 + caveat', () => {
    const r = detectShensha(four年子(), DM_甲);
    expect(r.hits.find((h) => h.name === '元辰')).toBeUndefined();
    expect(r.caveats.some((c) => c.includes('元辰'))).toBe(true);
  });
});

describe('神煞装配进 ChartAnalysis', () => {
  test('computeChartFacts 输出含 分析.神煞.hits', () => {
    const birth = BirthInputSchema.parse({ year: 1990, month: 5, day: 20, hour: 10, hourUnknown: false, gender: '乾' });
    const facts = computeChartFacts(birth);
    expect(facts.分析.神煞).toBeDefined();
    expect(Array.isArray(facts.分析.神煞.hits)).toBe(true);
  });
});
