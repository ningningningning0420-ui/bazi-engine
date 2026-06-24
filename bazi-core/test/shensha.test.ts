import { describe, test, expect } from 'vitest';
import {
  天乙, 文昌, 国印, 福星, 太极, 红艳, 流霞, 羊刃, 飞刃, 禄神, 金舆, 暗禄,
  三合局类, 劫灾亡, 红鸾, 天喜, 孤辰寡宿,
  天德, 月德, 月德合, 天医MAP,
  魁罡, 阴差阳错, 十恶大败, 金神, 六秀日,
  天德合, NAYIN60, 学堂, 词馆, 天罗地网,
} from '../src/constants/shensha-tables';
import { detectShensha } from '../src/facts/shensha';
import { buildPillar } from '../src/build-pillar';
import { computeChartFacts } from '../src/analyze-chart';
import { extractCitableStructures } from '../src/persona/structures';
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

describe('神煞进 cite 白名单', () => {
  test('present 神煞名进 citable.all', () => {
    const birth = BirthInputSchema.parse({ year: 1990, month: 5, day: 20, hour: 10, hourUnknown: false, gender: '乾' });
    const facts = computeChartFacts(birth);
    const cit = extractCitableStructures(facts);
    const names = facts.分析.神煞.hits.map((h) => h.name);
    if (names.length) expect(cit.all.some((s) => names.includes(s as any))).toBe(true);
  });
});

describe('神煞 · 性质', () => {
  test('present 天然稀疏:随机抽 30 个生辰,平均命中 < 神煞总数一半', () => {
    let total = 0; const N = 30;
    for (let i = 0; i < N; i++) {
      const birth = BirthInputSchema.parse({ year: 1950 + i, month: (i % 12) + 1, day: (i % 27) + 1, hour: i % 24, hourUnknown: false, gender: i % 2 ? '乾' : '坤' });
      total += computeChartFacts(birth).分析.神煞.hits.length;
    }
    expect(total / N).toBeLessThan(19);  // 38 个名目的一半;稀疏性 sanity
  });
  test('确定性:同生辰两次 computeChartFacts 的神煞深相等', () => {
    const b = BirthInputSchema.parse({ year: 1985, month: 8, day: 8, hour: 8, hourUnknown: false, gender: '坤' });
    expect(computeChartFacts(b).分析.神煞).toEqual(computeChartFacts(b).分析.神煞);
  });
});

describe('shensha-tables deferred 5 起例表自洽 + 必写死断言', () => {
  test('天德合 卯=巳(支)·子=申(支)·寅=壬(干)·丑=乙(干)', () => {
    expect(天德合['卯'].支).toBe('巳');
    expect(天德合['子'].支).toBe('申');
    expect(天德合['寅'].干).toBe('壬');
    expect(天德合['丑'].干).toBe('乙');
  });
  test('天德合 12 月齐·每月恰一个 干 xor 支', () => {
    const keys = Object.keys(天德合);
    expect(keys).toHaveLength(12);
    for (const k of keys) {
      const v = 天德合[k as keyof typeof 天德合];
      expect(Boolean(v.干) !== Boolean(v.支)).toBe(true);
    }
  });
  test('NAYIN60 60 项齐·每五行恰 12', () => {
    expect(Object.keys(NAYIN60)).toHaveLength(60);
    const cnt: Record<string, number> = {};
    for (const v of Object.values(NAYIN60)) cnt[v] = (cnt[v] || 0) + 1;
    expect(cnt['金']).toBe(12); expect(cnt['木']).toBe(12); expect(cnt['水']).toBe(12);
    expect(cnt['火']).toBe(12); expect(cnt['土']).toBe(12);
  });
  test('NAYIN60 必写死:甲子金·戊戌木(非土)·丙寅火·庚午土·甲申水·壬申金·辛巳金', () => {
    expect(NAYIN60['甲子']).toBe('金');
    expect(NAYIN60['戊戌']).toBe('木');
    expect(NAYIN60['丙寅']).toBe('火');
    expect(NAYIN60['庚午']).toBe('土');
    expect(NAYIN60['甲申']).toBe('水');
    expect(NAYIN60['壬申']).toBe('金');
    expect(NAYIN60['辛巳']).toBe('金');
  });
  test('学堂 金巳木亥水申火寅·土申(水土同宫·拍板A)', () => {
    expect(学堂['金']).toBe('巳'); expect(学堂['木']).toBe('亥'); expect(学堂['水']).toBe('申');
    expect(学堂['火']).toBe('寅'); expect(学堂['土']).toBe('申');
  });
  test('词馆 金申木寅水亥火巳·土亥(水土同宫·拍板A)', () => {
    expect(词馆['金']).toBe('申'); expect(词馆['木']).toBe('寅'); expect(词馆['水']).toBe('亥');
    expect(词馆['火']).toBe('巳'); expect(词馆['土']).toBe('亥');
  });
  test('天罗地网 火=天罗{戌,亥}·水/土=地网{辰,巳}·金木无', () => {
    expect(天罗地网['火']).toEqual({ 煞: '天罗', 支: ['戌', '亥'] });
    expect(天罗地网['水']).toEqual({ 煞: '地网', 支: ['辰', '巳'] });
    expect(天罗地网['土']).toEqual({ 煞: '地网', 支: ['辰', '巳'] });
    expect(天罗地网['金']).toBeUndefined();
    expect(天罗地网['木']).toBeUndefined();
  });
});

describe('detectShensha · 天德合 + byNayin(学堂/词馆/天罗地网)', () => {
  const DM_丙: DayMaster = { gan: '丙', wuXing: '火', yinYang: '阳' };
  // 天德合 干形态:月支寅→天德合=壬(干)
  function four天德合干(): FourPillars {
    return {
      年: buildPillar('甲', '甲', '子'),
      月: buildPillar('丁', '丁', '寅'),  // 月支寅 → 天德合=壬(干)
      日: buildPillar('甲', '甲', '辰'),
      时: buildPillar('壬', '壬', '申'),  // 壬干 → 命中天德合(时)
    };
  }
  test('月支寅:天德合壬(命中时干)', () => {
    const r = detectShensha(four天德合干(), DM_甲);
    expect(r.hits.find((h) => h.name === '天德合')!.positions).toContain('时');
  });
  // 天德合 支形态:月支卯→天德合=巳(支)
  function four天德合支(): FourPillars {
    return {
      年: buildPillar('甲', '甲', '子'),
      月: buildPillar('丁', '丁', '卯'),  // 月支卯 → 天德合=巳(支)
      日: buildPillar('甲', '甲', '巳'),  // 巳支 → 命中天德合(日)
      时: buildPillar('甲', '甲', '戌'),
    };
  }
  test('月支卯:天德合巳(命中日支)', () => {
    const r = detectShensha(four天德合支(), DM_甲);
    expect(r.hits.find((h) => h.name === '天德合')!.positions).toContain('日');
  });
  // 学堂/词馆:年甲子=海中金→金命;学堂巳/词馆申
  function fourNayin金(): FourPillars {
    return {
      年: buildPillar('甲', '甲', '子'),  // 甲子=金命
      月: buildPillar('丁', '丁', '巳'),  // 巳 → 学堂(金)
      日: buildPillar('甲', '甲', '申'),  // 申 → 词馆(金)
      时: buildPillar('甲', '甲', '戌'),  // 戌(金命无天罗地网)
    };
  }
  test('年甲子(金命):学堂巳(月)·词馆申(日)', () => {
    const r = detectShensha(fourNayin金(), DM_甲);
    expect(r.hits.find((h) => h.name === '学堂')!.positions).toContain('月');
    expect(r.hits.find((h) => h.name === '词馆')!.positions).toContain('日');
  });
  test('金命无天罗地网(纵有戌)', () => {
    const r = detectShensha(fourNayin金(), DM_甲);
    expect(r.hits.find((h) => h.name === '天罗' || h.name === '地网')).toBeUndefined();
  });
  // 天罗:年丙寅=炉中火→火命;见戌→天罗
  function four天罗(): FourPillars {
    return {
      年: buildPillar('丙', '丙', '寅'),  // 丙寅=火命
      月: buildPillar('丁', '丁', '戌'),  // 戌 → 天罗
      日: buildPillar('甲', '甲', '子'),
      时: buildPillar('甲', '甲', '卯'),
    };
  }
  test('年丙寅(火命)见戌:天罗(月)·无地网', () => {
    const r = detectShensha(four天罗(), DM_丙);
    expect(r.hits.find((h) => h.name === '天罗')!.positions).toContain('月');
    expect(r.hits.find((h) => h.name === '地网')).toBeUndefined();
  });
  // 地网:年丙子=涧下水→水命;见辰→地网
  function four地网(): FourPillars {
    return {
      年: buildPillar('丙', '丙', '子'),  // 丙子=水命
      月: buildPillar('丁', '丁', '辰'),  // 辰 → 地网
      日: buildPillar('甲', '甲', '午'),
      时: buildPillar('甲', '甲', '卯'),
    };
  }
  test('年丙子(水命)见辰:地网(月)·无天罗', () => {
    const r = detectShensha(four地网(), DM_丙);
    expect(r.hits.find((h) => h.name === '地网')!.positions).toContain('月');
    expect(r.hits.find((h) => h.name === '天罗')).toBeUndefined();
  });
});
