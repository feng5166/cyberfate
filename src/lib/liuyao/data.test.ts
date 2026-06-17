import { describe, it, expect } from 'vitest';
import {
  TRIGRAMS,
  getTrigramByLines,
  getTrigramByKey,
  HEXAGRAM_MAP,
  HEXAGRAM_JUDGMENTS,
  HEXAGRAM_LINE_TEXTS,
  getHexagramName,
  getLineTexts,
  getGenericLineText,
  getLineTitle,
  identifyTrigrams,
} from './data';

describe('liuyao/data — 八卦 trigram identification', () => {
  it('maps each line-pattern to the correct 八卦 (bottom, mid, top)', () => {
    // 卦象 lines are [底爻, 中爻, 顶爻] from bottom to top
    expect(getTrigramByLines(1, 1, 1)?.name).toBe('乾'); // ☰ 天
    expect(getTrigramByLines(1, 1, 0)?.name).toBe('兑'); // ☱ 泽
    expect(getTrigramByLines(1, 0, 1)?.name).toBe('离'); // ☲ 火
    expect(getTrigramByLines(1, 0, 0)?.name).toBe('震'); // ☳ 雷
    expect(getTrigramByLines(0, 1, 1)?.name).toBe('巽'); // ☴ 风
    expect(getTrigramByLines(0, 1, 0)?.name).toBe('坎'); // ☵ 水
    expect(getTrigramByLines(0, 0, 1)?.name).toBe('艮'); // ☶ 山
    expect(getTrigramByLines(0, 0, 0)?.name).toBe('坤'); // ☷ 地
  });

  it('returns undefined for an impossible line value', () => {
    expect(getTrigramByLines(2, 2, 2)).toBeUndefined();
  });

  it('getTrigramByKey returns the trigram for a valid key and undefined otherwise', () => {
    expect(getTrigramByKey('qian')).toBe(TRIGRAMS.qian);
    expect(getTrigramByKey('kun')?.name).toBe('坤');
    expect(getTrigramByKey('nope')).toBeUndefined();
  });

  it('identifyTrigrams splits 6 lines into lower (0-2) and upper (3-5) keys', () => {
    // 乾为天: all yang → upper qian, lower qian
    const all = identifyTrigrams([1, 1, 1, 1, 1, 1]);
    expect(all.upperKey).toBe('qian');
    expect(all.lowerKey).toBe('qian');
    expect(all.upper.name).toBe('乾');
    expect(all.lower.name).toBe('乾');

    // 坤为地: all yin
    const kun = identifyTrigrams([0, 0, 0, 0, 0, 0]);
    expect(kun.upperKey).toBe('kun');
    expect(kun.lowerKey).toBe('kun');

    // 天地否: lower 坤 (0,0,0), upper 乾 (1,1,1)
    const pi = identifyTrigrams([0, 0, 0, 1, 1, 1]);
    expect(pi.lowerKey).toBe('kun');
    expect(pi.upperKey).toBe('qian');
  });
});

describe('liuyao/data — hexagram name lookup', () => {
  it('getHexagramName returns canonical names for known upper/lower combos', () => {
    expect(getHexagramName('qian', 'qian')).toBe('乾为天');
    expect(getHexagramName('kun', 'kun')).toBe('坤为地');
    expect(getHexagramName('qian', 'kun')).toBe('天地否'); // 上乾下坤
    expect(getHexagramName('kun', 'qian')).toBe('地天泰'); // 上坤下乾
  });

  it('returns 未知卦 fallback for an unknown key (not undefined)', () => {
    expect(getHexagramName('bogus', 'qian')).toBe('未知卦');
    expect(getHexagramName('qian', 'bogus')).toBe('未知卦');
  });

  it('HEXAGRAM_MAP is a full 8×8 grid of 64 hexagrams', () => {
    const upperKeys = Object.keys(HEXAGRAM_MAP);
    expect(upperKeys).toHaveLength(8);
    const total = upperKeys.reduce(
      (sum, k) => sum + Object.keys(HEXAGRAM_MAP[k]).length,
      0,
    );
    expect(total).toBe(64);
  });

  it('end-to-end: lines → identifyTrigrams → getHexagramName', () => {
    const { upperKey, lowerKey } = identifyTrigrams([0, 0, 0, 1, 1, 1]);
    expect(getHexagramName(upperKey, lowerKey)).toBe('天地否');
  });
});

describe('liuyao/data — 卦辞 (judgments)', () => {
  it('has known judgments for famous hexagrams', () => {
    expect(HEXAGRAM_JUDGMENTS['乾为天']).toBe('元亨利贞。');
    expect(HEXAGRAM_JUDGMENTS['坤为地']).toContain('元亨');
    expect(HEXAGRAM_JUDGMENTS['火天大有']).toBe('元亨。');
  });

  it('every hexagram name in HEXAGRAM_MAP has a judgment entry', () => {
    const names = Object.values(HEXAGRAM_MAP).flatMap((row) => Object.values(row));
    for (const name of names) {
      expect(HEXAGRAM_JUDGMENTS[name], `missing judgment for ${name}`).toBeDefined();
    }
  });
});

describe('liuyao/data — 爻辞 retrieval', () => {
  it('returns the 6 specific 爻辞 for a hexagram that has them', () => {
    const texts = getLineTexts('乾为天', [1, 1, 1, 1, 1, 1]);
    expect(texts).toHaveLength(6);
    expect(texts[0]).toBe('潜龙勿用。');
    expect(texts[4]).toBe('飞龙在天，利见大人。');
    expect(texts[5]).toBe('亢龙有悔。');
    expect(texts).toEqual(HEXAGRAM_LINE_TEXTS['乾为天']);
  });

  it('falls back to generic per-line text for a hexagram without specific 爻辞', () => {
    // 风天小畜 has a judgment but no HEXAGRAM_LINE_TEXTS entry
    expect(HEXAGRAM_LINE_TEXTS['风天小畜']).toBeUndefined();
    const lines = [1, 0, 1, 0, 1, 0];
    const texts = getLineTexts('风天小畜', lines);
    expect(texts).toHaveLength(6);
    // generic text mirrors yin/yang per position; none are undefined
    texts.forEach((t) => expect(typeof t).toBe('string'));
    expect(texts[0]).toBe(getGenericLineText(0, 'yang')); // line[0]=1
    expect(texts[1]).toBe(getGenericLineText(1, 'yin')); // line[1]=0
  });

  it('getGenericLineText returns distinct yin/yang templates per position', () => {
    expect(getGenericLineText(0, 'yang')).toContain('阳');
    expect(getGenericLineText(0, 'yin')).toContain('阴');
    expect(getGenericLineText(0, 'yang')).not.toBe(getGenericLineText(5, 'yang'));
  });
});

describe('liuyao/data — 爻位标题 (line titles)', () => {
  it('generates 初九/上九 for yang and 初六/上六 for yin', () => {
    expect(getLineTitle(0, 'yang')).toBe('初九');
    expect(getLineTitle(5, 'yang')).toBe('上九');
    expect(getLineTitle(0, 'yin')).toBe('初六');
    expect(getLineTitle(1, 'yin')).toBe('六二');
    expect(getLineTitle(4, 'yin')).toBe('六五');
  });
});

describe('liuyao/data — changed/derived hexagram from moving lines', () => {
  // Flip moving-line positions to derive the 变卦, then re-identify it.
  function applyMovingLines(lines: number[], moving: number[]): number[] {
    return lines.map((l, i) => (moving.includes(i) ? (l === 1 ? 0 : 1) : l));
  }

  it('乾为天 with all 6 lines moving derives 坤为地', () => {
    const original = [1, 1, 1, 1, 1, 1];
    const derived = applyMovingLines(original, [0, 1, 2, 3, 4, 5]);
    expect(derived).toEqual([0, 0, 0, 0, 0, 0]);
    const { upperKey, lowerKey } = identifyTrigrams(derived);
    expect(getHexagramName(upperKey, lowerKey)).toBe('坤为地');
  });

  it('乾为天 with only the bottom line moving derives 天风姤', () => {
    const original = [1, 1, 1, 1, 1, 1];
    const derived = applyMovingLines(original, [0]); // 初爻 1→0
    expect(derived).toEqual([0, 1, 1, 1, 1, 1]);
    const { upperKey, lowerKey } = identifyTrigrams(derived);
    // lower = (0,1,1)=巽 xun, upper = (1,1,1)=乾 qian → 天风姤
    expect(lowerKey).toBe('xun');
    expect(upperKey).toBe('qian');
    expect(getHexagramName(upperKey, lowerKey)).toBe('天风姤');
  });
});
