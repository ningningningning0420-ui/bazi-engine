import { describe, test, expect } from 'vitest';
import {
  天乙, 文昌, 国印, 福星, 太极, 红艳, 流霞, 羊刃, 飞刃, 禄神, 金舆, 暗禄,
  三合局类, 劫灾亡, 红鸾, 天喜, 孤辰寡宿,
  天德, 月德, 月德合, 天医MAP,
  魁罡, 阴差阳错, 十恶大败, 金神, 六秀日,
} from '../src/constants/shensha-tables';
import { detectShensha } from '../src/facts/shensha';
import { buildPillar } from '../src/build-pillar';
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
