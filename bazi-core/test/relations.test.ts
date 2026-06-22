import { describe, expect, test } from 'vitest';
import { WU_XING, shengMe } from '../src/constants/gan-zhi';
import {
  TIANGAN_WUHE, DIZHI_LIUHE, DIZHI_SANHE, DIZHI_SANHUI,
  DIZHI_LIUCHONG, DIZHI_LIUHAI, DIZHI_SANXING_TRIPLE, DIZHI_XING_PAIR, DIZHI_ZIXING,
} from '../src/facts/relations';

describe('gan-zhi 扩展', () => {
  test('WU_XING 五行齐全', () => {
    expect([...WU_XING].sort()).toEqual(['土', '木', '水', '火', '金'].sort());
  });
  test('shengMe = 生我者(印)', () => {
    expect(shengMe('火')).toBe('木'); // 木生火
    expect(shengMe('木')).toBe('水'); // 水生木
    expect(shengMe('土')).toBe('火'); // 火生土
  });
});

describe('关系固定表', () => {
  test('天干五合 5 组，含化神', () => {
    expect(TIANGAN_WUHE).toHaveLength(5);
    expect(TIANGAN_WUHE).toContainEqual(['甲', '己', '土']);
    expect(TIANGAN_WUHE).toContainEqual(['戊', '癸', '火']);
  });
  test('六合 6 组（午未化神为 null）', () => {
    expect(DIZHI_LIUHE).toHaveLength(6);
    expect(DIZHI_LIUHE).toContainEqual(['子', '丑', '土']);
    expect(DIZHI_LIUHE).toContainEqual(['午', '未', null]);
  });
  test('三合局 4 组', () => {
    expect(DIZHI_SANHE).toContainEqual(['申', '子', '辰', '水']);
    expect(DIZHI_SANHE).toContainEqual(['寅', '午', '戌', '火']);
  });
  test('三会方 4 组', () => {
    expect(DIZHI_SANHUI).toContainEqual(['寅', '卯', '辰', '木']);
  });
  test('六冲 6 / 六害 6', () => {
    expect(DIZHI_LIUCHONG).toHaveLength(6);
    expect(DIZHI_LIUCHONG).toContainEqual(['子', '午']);
    expect(DIZHI_LIUHAI).toHaveLength(6);
    expect(DIZHI_LIUHAI).toContainEqual(['子', '未']);
  });
  test('三刑三组 + 子卯刑 + 自刑', () => {
    expect(DIZHI_SANXING_TRIPLE).toContainEqual(['寅', '巳', '申']);
    expect(DIZHI_SANXING_TRIPLE).toContainEqual(['丑', '戌', '未']);
    expect(DIZHI_XING_PAIR).toContainEqual(['子', '卯']);
    expect([...DIZHI_ZIXING].sort()).toEqual(['亥', '午', '辰', '酉'].sort());
  });
});
