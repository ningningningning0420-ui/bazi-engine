import { describe, expect, test } from 'vitest';
import { buildPillar } from '../src/build-pillar';

describe('buildPillar（日主=甲）', () => {
  test('甲寅：天干甲=比肩，藏干甲丙戊带十神', () => {
    const p = buildPillar('甲', '甲', '寅');
    expect(p.ganWuXing).toBe('木');
    expect(p.ganYinYang).toBe('阳');
    expect(p.zhiWuXing).toBe('木');
    expect(p.ganGod).toBe('比肩');
    expect(p.hiddenStems).toEqual([
      { gan: '甲', role: '本气', god: '比肩' },
      { gan: '丙', role: '中气', god: '食神' },
      { gan: '戊', role: '余气', god: '偏财' },
    ]);
  });
  test('辛酉：天干辛对日主甲=正官，藏干辛=正官', () => {
    const p = buildPillar('甲', '辛', '酉');
    expect(p.ganGod).toBe('正官');
    expect(p.hiddenStems).toEqual([{ gan: '辛', role: '本气', god: '正官' }]);
  });
});
