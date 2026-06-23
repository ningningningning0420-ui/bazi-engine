import type { FourPillars, DayMaster, PillarSlot, ShenshaHit, ShenshaResult, ShenshaName, ShenshaCategory, ShenshaPolarity } from '../types';
import type { Gan, Zhi } from '../constants/gan-zhi';
import * as T from '../constants/shensha-tables';

const SLOTS: PillarSlot[] = ['年', '月', '日', '时'];

// 元信息:每个神煞的 category/polarity/gist(描述·非性格断言)
const META: Record<ShenshaName, { c: ShenshaCategory; p: ShenshaPolarity; g: string }> = {
  天乙贵人: { c: '贵人', p: '吉', g: '最尊贵人·逢凶化吉得扶助' },
  文昌贵人: { c: '贵人', p: '吉', g: '聪明好学·文笔功名' },
  国印贵人: { c: '贵人', p: '吉', g: '掌印权·诚实可靠' },
  福星贵人: { c: '贵人', p: '吉', g: '福禄衣食丰足' },
  太极贵人: { c: '玄学', p: '吉', g: '好玄学·悟性高' },
  天德贵人: { c: '贵人', p: '吉', g: '福德·化煞清显' },
  月德贵人: { c: '贵人', p: '吉', g: '慈善·福寿护身' },
  天德合: { c: '贵人', p: '吉', g: '天德之合·助福' },
  月德合: { c: '贵人', p: '吉', g: '月德之合·助福' },
  桃花: { c: '情欲', p: '中', g: '美貌风情·酒色之缘' },
  驿马: { c: '驿动', p: '中', g: '奔波变动·迁移远行' },
  华盖: { c: '玄学', p: '中', g: '孤高聪慧·宗教艺术缘' },
  将星: { c: '权势', p: '吉', g: '掌权领导·显达' },
  红艳: { c: '情欲', p: '中', g: '多情多欲·风流魅力' },
  红鸾: { c: '情欲', p: '吉', g: '婚恋姻缘喜' },
  天喜: { c: '情欲', p: '吉', g: '喜庆·姻缘' },
  羊刃: { c: '刑煞', p: '凶', g: '刚暴过旺·易血光刑伤' },
  飞刃: { c: '刑煞', p: '凶', g: '羊刃对冲·冲动招祸' },
  禄神: { c: '特殊', p: '吉', g: '日主临官得气·食禄' },
  金舆: { c: '特殊', p: '吉', g: '贵气扶助·安舒姻缘' },
  暗禄: { c: '特殊', p: '吉', g: '暗财暗助' },
  魁罡: { c: '刑煞', p: '中', g: '刚烈极端·聪明掌权或极端' },
  阴差阳错: { c: '刑煞', p: '凶', g: '婚姻阴阳错位' },
  十恶大败: { c: '刑煞', p: '凶', g: '破败无禄' },
  金神: { c: '特殊', p: '中', g: '才高·需火制成格' },
  六秀日: { c: '特殊', p: '吉', g: '才貌秀气' },
  孤辰: { c: '孤克', p: '凶', g: '孤独·克亲' },
  寡宿: { c: '孤克', p: '凶', g: '孤寡·婚姻不顺' },
  劫煞: { c: '刑煞', p: '凶', g: '劫夺·破财灾' },
  灾煞: { c: '刑煞', p: '凶', g: '血光疾病灾' },
  亡神: { c: '孤克', p: '凶', g: '丧亡·内耗·心机深' },
  天医: { c: '特殊', p: '吉', g: '医药·健康疗愈' },
  流霞: { c: '刑煞', p: '凶', g: '血光·男车祸女产厄' },
  元辰: { c: '刑煞', p: '凶', g: '耗散·暗损' },
  天罗: { c: '孤克', p: '凶', g: '束缚·灵异困局(男忌)' },
  地网: { c: '孤克', p: '凶', g: '束缚·灵异困局(女忌)' },
  学堂: { c: '贵人', p: '吉', g: '文贵·读书向学' },
  词馆: { c: '贵人', p: '吉', g: '文采词章' },
};

// 工具:目标地支出现在哪几柱
function branchesAt(four: FourPillars, targets: Zhi[]): PillarSlot[] {
  const out: PillarSlot[] = [];
  for (const s of SLOTS) {
    const p = four[s];
    if (p && targets.includes(p.zhi)) out.push(s);
  }
  return out;
}
// 工具:目标天干出现在哪几柱
function stemsAt(four: FourPillars, targets: Gan[]): PillarSlot[] {
  const out: PillarSlot[] = [];
  for (const s of SLOTS) {
    const p = four[s];
    if (p && targets.includes(p.gan)) out.push(s);
  }
  return out;
}
function mk(name: ShenshaName, basis: ShenshaHit['basis'], positions: PillarSlot[]): ShenshaHit {
  const m = META[name];
  return { name, category: m.c, polarity: m.p, basis, positions, gist: m.g };
}

// ===== byStem 组 =====
function byStem(four: FourPillars, dm: DayMaster): ShenshaHit[] {
  const g = dm.gan;
  const hits: ShenshaHit[] = [];
  const pushBranch = (name: ShenshaName, targets: Zhi[]) => {
    const pos = branchesAt(four, targets);
    if (pos.length) hits.push(mk(name, '日干', pos));
  };
  pushBranch('天乙贵人', T.天乙[g]);
  pushBranch('文昌贵人', [T.文昌[g]]);
  pushBranch('国印贵人', [T.国印[g]]);
  pushBranch('福星贵人', [T.福星[g]]);
  pushBranch('太极贵人', T.太极[g]);
  pushBranch('红艳', [T.红艳[g]]);
  pushBranch('流霞', [T.流霞[g]]);
  pushBranch('禄神', [T.禄神[g]]);
  pushBranch('金舆', [T.金舆[g]]);
  pushBranch('暗禄', [T.暗禄[g]]);
  if (T.羊刃[g]) pushBranch('羊刃', [T.羊刃[g]!]);
  if (T.飞刃[g]) pushBranch('飞刃', [T.飞刃[g]!]);
  return hits;
}

function byYearBranch(four: FourPillars): ShenshaHit[] {
  const yz = four.年?.zhi;
  if (!yz) return [];
  const hits: ShenshaHit[] = [];
  const pushBranch = (name: ShenshaName, target: Zhi) => {
    const pos = branchesAt(four, [target]);
    if (pos.length) hits.push(mk(name, '年支', pos));
  };
  const row = T.三合局类[yz];
  pushBranch('桃花', row.桃花);
  pushBranch('驿马', row.驿马);
  pushBranch('华盖', row.华盖);
  pushBranch('将星', row.将星);
  const jzw = T.劫灾亡[yz];
  pushBranch('劫煞', jzw.劫煞);
  pushBranch('灾煞', jzw.灾煞);
  pushBranch('亡神', jzw.亡神);
  pushBranch('红鸾', T.红鸾[yz]);
  pushBranch('天喜', T.天喜[yz]);
  const gg = T.孤辰寡宿[yz];
  pushBranch('孤辰', gg.孤辰);
  pushBranch('寡宿', gg.寡宿);
  return hits;
}

export function detectShensha(four: FourPillars, dm: DayMaster): ShenshaResult {
  const hits = [...byStem(four, dm), ...byYearBranch(four)];
  return { hits, caveats: [] };
}
