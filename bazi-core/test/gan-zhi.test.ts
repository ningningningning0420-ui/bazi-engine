import { describe, expect, test } from 'vitest';
import {
  GAN, ZHI, GAN_WUXING, GAN_YINYANG, ZHI_WUXING, HIDDEN_STEMS,
  sheng, ke,
} from '../src/constants/gan-zhi';

describe('天干地支常量', () => {
  test('十天干、十二地支齐全', () => {
    expect(GAN).toHaveLength(10);
    expect(ZHI).toHaveLength(12);
  });
  test('天干五行/阴阳', () => {
    expect(GAN_WUXING['甲']).toBe('木');
    expect(GAN_WUXING['癸']).toBe('水');
    expect(GAN_YINYANG['甲']).toBe('阳');
    expect(GAN_YINYANG['乙']).toBe('阴');
  });
  test('地支本气五行', () => {
    expect(ZHI_WUXING['子']).toBe('水');
    expect(ZHI_WUXING['午']).toBe('火');
    expect(ZHI_WUXING['辰']).toBe('土');
  });
  test('藏干表：本气/中气/余气', () => {
    expect(HIDDEN_STEMS['子']).toEqual([{ gan: '癸', role: '本气' }]);
    expect(HIDDEN_STEMS['寅']).toEqual([
      { gan: '甲', role: '本气' }, { gan: '丙', role: '中气' }, { gan: '戊', role: '余气' },
    ]);
    expect(HIDDEN_STEMS['丑']).toEqual([
      { gan: '己', role: '本气' }, { gan: '癸', role: '中气' }, { gan: '辛', role: '余气' },
    ]);
  });
});

describe('五行生克', () => {
  test('生：木→火，水→木', () => {
    expect(sheng('木')).toBe('火');
    expect(sheng('水')).toBe('木');
  });
  test('克：木→土，金→木', () => {
    expect(ke('木')).toBe('土');
    expect(ke('金')).toBe('木');
  });
});
