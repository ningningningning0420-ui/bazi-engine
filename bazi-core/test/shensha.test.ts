import { describe, test, expect } from 'vitest';
import {
  天乙, 文昌, 国印, 福星, 太极, 红艳, 流霞, 羊刃, 飞刃, 禄神, 金舆, 暗禄,
  三合局类, 劫灾亡, 红鸾, 天喜, 孤辰寡宿,
  天德, 月德, 月德合, 天医MAP,
  魁罡, 阴差阳错, 十恶大败, 金神, 六秀日,
} from '../src/constants/shensha-tables';

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
