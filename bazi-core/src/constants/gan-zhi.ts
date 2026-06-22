export type Gan = '甲'|'乙'|'丙'|'丁'|'戊'|'己'|'庚'|'辛'|'壬'|'癸';
export type Zhi = '子'|'丑'|'寅'|'卯'|'辰'|'巳'|'午'|'未'|'申'|'酉'|'戌'|'亥';
export type WuXing = '木'|'火'|'土'|'金'|'水';
export type YinYang = '阳'|'阴';
export type HiddenRole = '本气'|'中气'|'余气';

export const GAN: readonly Gan[] = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const ZHI: readonly Zhi[] = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

export const GAN_WUXING: Record<Gan, WuXing> = {
  甲:'木', 乙:'木', 丙:'火', 丁:'火', 戊:'土', 己:'土', 庚:'金', 辛:'金', 壬:'水', 癸:'水',
};
export const GAN_YINYANG: Record<Gan, YinYang> = {
  甲:'阳', 乙:'阴', 丙:'阳', 丁:'阴', 戊:'阳', 己:'阴', 庚:'阳', 辛:'阴', 壬:'阳', 癸:'阴',
};
export const ZHI_WUXING: Record<Zhi, WuXing> = {
  子:'水', 丑:'土', 寅:'木', 卯:'木', 辰:'土', 巳:'火',
  午:'火', 未:'土', 申:'金', 酉:'金', 戌:'土', 亥:'水',
};

export const HIDDEN_STEMS: Record<Zhi, { gan: Gan; role: HiddenRole }[]> = {
  子: [{ gan:'癸', role:'本气' }],
  丑: [{ gan:'己', role:'本气' }, { gan:'癸', role:'中气' }, { gan:'辛', role:'余气' }],
  寅: [{ gan:'甲', role:'本气' }, { gan:'丙', role:'中气' }, { gan:'戊', role:'余气' }],
  卯: [{ gan:'乙', role:'本气' }],
  辰: [{ gan:'戊', role:'本气' }, { gan:'乙', role:'中气' }, { gan:'癸', role:'余气' }],
  巳: [{ gan:'丙', role:'本气' }, { gan:'庚', role:'中气' }, { gan:'戊', role:'余气' }],
  午: [{ gan:'丁', role:'本气' }, { gan:'己', role:'中气' }],
  未: [{ gan:'己', role:'本气' }, { gan:'丁', role:'中气' }, { gan:'乙', role:'余气' }],
  申: [{ gan:'庚', role:'本气' }, { gan:'壬', role:'中气' }, { gan:'戊', role:'余气' }],
  酉: [{ gan:'辛', role:'本气' }],
  戌: [{ gan:'戊', role:'本气' }, { gan:'辛', role:'中气' }, { gan:'丁', role:'余气' }],
  亥: [{ gan:'壬', role:'本气' }, { gan:'甲', role:'中气' }],
};

// 我生（木→火→土→金→水→木）
const SHENG: Record<WuXing, WuXing> = { 木:'火', 火:'土', 土:'金', 金:'水', 水:'木' };
// 我克（木克土、土克水、水克火、火克金、金克木）
const KE: Record<WuXing, WuXing> = { 木:'土', 土:'水', 水:'火', 火:'金', 金:'木' };

export const sheng = (w: WuXing): WuXing => SHENG[w];
export const ke = (w: WuXing): WuXing => KE[w];

export const WU_XING: readonly WuXing[] = ['木', '火', '土', '金', '水'];

// 生我者（印）：木生火→火的印是木；火生土→土的印是火……
const GENERATES_ME: Record<WuXing, WuXing> = { 火:'木', 土:'火', 金:'土', 水:'金', 木:'水' };
export const shengMe = (w: WuXing): WuXing => GENERATES_ME[w];

// 克我者（官杀）：金克木→木的克我者是金……（与 KE 互逆：ke(keMe(w))===w）
const KE_ME: Record<WuXing, WuXing> = { 土:'木', 水:'土', 火:'水', 金:'火', 木:'金' };
export const keMe = (w: WuXing): WuXing => KE_ME[w];
