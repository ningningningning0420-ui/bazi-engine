import { GAN_WUXING, HIDDEN_STEMS } from '../constants/gan-zhi';
import { SLOT_ORDER, type FourPillars, type DayMaster, type StemRoots, type RootHit, type RootType } from '../types';

const ROLE_TO_ROOT: Record<'本气' | '中气' | '余气', RootType> = {
  本气: '本气根', 中气: '中气根', 余气: '余气根',
};

/** 通根：每个天干在全盘各地支藏干中找同五行的根，按藏干 role 定根性。 */
export function analyzeRoots(four: FourPillars, _dm: DayMaster): StemRoots[] {
  const present = SLOT_ORDER.filter((s) => four[s] !== null).map((s) => ({ slot: s, p: four[s]! }));
  return present.map(({ slot, p }) => {
    const w = GAN_WUXING[p.gan];
    const roots: RootHit[] = [];
    for (const { p: bp, slot: bslot } of present) {
      for (const h of HIDDEN_STEMS[bp.zhi]) {
        if (GAN_WUXING[h.gan] === w) {
          roots.push({ slot: bslot, branch: bp.zhi, rootType: ROLE_TO_ROOT[h.role] });
        }
      }
    }
    return { slot, stem: p.gan, wuXing: w, roots, hasRoot: roots.length > 0 };
  });
}
