# 实施计划 08 · seedToBirth(种子 → 合法生辰)

> 状态:**设计锁定·TDD 实现中(2026-06-24)**。
> 缘起:走阴手札卡需要「seed → BirthInput」派生(NPC hash 定盘 + chargen「替我定」兜底都依赖)。归引擎(通用先行),不是卡的活。

## 1. 目标 · 红线

`seedToBirth(seed) → BirthInput`:从一个数字 seed **确定性派生一个合法公历生辰**,供 `computeChart` 排盘。

**红线(踩了就退化成"随机参数换皮"):**
- **L0 红线:派生合法公历日期,绝不对四柱/干支/favorSign 直接 hash。** 只产 `{年,月,日,时,性别}`,四柱由 `computeChart`(lunar-typescript)算。
- **无偏置:严禁朝某类命盘 / 人格 / 吉凶偏置。** 对公历日期做**均匀采样** → 诱导出的 favorSign / 身强弱 分布 = 自然分布(无人为峰)。
- **确定性可复现:** 同 seed → 字节级同一 BirthInput(纯函数·无外部 RNG / 无 Date.now / 无温度)。

## 2. 签名

```ts
seedToBirth(seed: number, opts?: { yearRange?: [number, number] }): BirthInput
```
- `seed`:单个 number(对接卡 `SeedPort.hash(npcId + worldSeed)`)。内部规范化为 uint32 喂 PRNG。
- `opts.yearRange`:默认 **[1900, 2020]**(lunar-typescript 节气表精准区·通用安全)。卡按 NPC 类型(生人/亡魂)可传更窄/更宽。

## 3. 算法(均匀无偏)

1. **内部确定性 PRNG = mulberry32(seed)**(无外部依赖·avalanche 良好)。从中顺序抽独立子值。
2. **日期 = 对全体公历天数均匀抽:** `totalDays = 天数([min-01-01, max-12-31])`;`offset = floor(r1 * totalDays)`;`{年,月,日} = startDate + offset 天`(用 `Date.UTC` 做偏移→ymd·确定性·Gregorian 正确·含闰年/世纪闰)。**比「年 uniform→月 uniform→日 uniform」干净**:无月长伪峰、每个真实日历日等概率。
3. **hour = floor(r2 * 24)**(0–23·`hourUnknown=false`·产完整盘)。
4. **gender = r3 < 0.5 ? '乾' : '坤'**(50/50)。
5. 输出 `BirthInputSchema.parse(...)` 自校验(违反即 throw·防御性)。

**无偏论证:** 命盘分布完全由日期分布决定(`computeChartFacts` 是日期的确定性函数)。日期各维**可证均匀** ⟹ 诱导命盘分布 = 自然分布,无独立偏置空间。

## 4. 测试矩阵(性质测试·`test/seed-to-birth.test.ts`)

| # | 性质 | 断言 |
|---|---|---|
| 确定性 | 同 seed 两次 | `toEqual` |
| 合法性 | 200 seeds | `BirthInputSchema.parse` 不抛 · `computeChart` 不抛 · hourUnknown=false · gender∈乾坤 · 真日历日 |
| 范围默认 | 6000 seeds | 年全 ∈ [1900,2020] · 覆盖到端点(min≤1903 / max≥2017) |
| 范围 opt | `{yearRange:[1980,1990]}` | 年全 ∈ [1980,1990] |
| 均匀性 | 6000 seeds | 月 / hour / gender / 年代 各桶在统计容差内(catch 聚簇偏置) |
| **无偏(红线)** | 2000 seeds → computeChartFacts | 身强弱三档齐 + 无单档退化(>75%);主用神五行齐 + 无单峰(>55%) |
| 黄金锁 | seed=0 / 1 | 深相等固定值(字节稳定回归锁·GREEN 后补) |

## 5. 不做(v1 · YAGNI)

- **极端贫盘过滤**:设计文档「可滤极端贫盘」留 v2;v1 **纯均匀 = 最无偏最简**。要滤以后加 `accept?: (b)=>boolean` 谓词钩子让调用方自定义,引擎不预设「贫盘」语义(守通用先行 + 无偏)。
- **时辰未知派生**:v1 恒产完整盘(hourUnknown=false);玩家手动留空时辰是 chargen widget 的事、不经 seedToBirth。
- worldEpoch / 架空整年映射:`SeedPort` 接口已留,消费 v2。
