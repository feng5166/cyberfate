import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getWuxingMusicProfile,
  getWuxingProfileByElement,
  getTodayTiangan,
} from './wuxing-music-map';

describe('music-oracle — 天干 → 五行 → music profile', () => {
  it('maps each 天干 to its 五行 profile', () => {
    expect(getWuxingMusicProfile('甲').wuxing).toBe('木');
    expect(getWuxingMusicProfile('乙').wuxing).toBe('木');
    expect(getWuxingMusicProfile('丙').wuxing).toBe('火');
    expect(getWuxingMusicProfile('丁').wuxing).toBe('火');
    expect(getWuxingMusicProfile('戊').wuxing).toBe('土');
    expect(getWuxingMusicProfile('己').wuxing).toBe('土');
    expect(getWuxingMusicProfile('庚').wuxing).toBe('金');
    expect(getWuxingMusicProfile('辛').wuxing).toBe('金');
    expect(getWuxingMusicProfile('壬').wuxing).toBe('水');
    expect(getWuxingMusicProfile('癸').wuxing).toBe('水');
  });

  it('returns a fully-populated profile (styles, mood, gradient, icon)', () => {
    const p = getWuxingMusicProfile('丙'); // 火
    expect(p.musicStyles.length).toBeGreaterThan(0);
    expect(p.icon).toBe('🔥');
    expect(p.gradientFrom).toContain('from-');
    expect(p.gradientTo).toContain('to-');
    expect(p.emotion).toBeTruthy();
    expect(p.mood).toBeTruthy();
  });

  it('falls back to 木 profile for an unknown 天干 (not undefined)', () => {
    const p = getWuxingMusicProfile('X');
    expect(p).toBeDefined();
    expect(p.wuxing).toBe('木');
  });
});

describe('music-oracle — getWuxingProfileByElement', () => {
  it('returns the profile for each of the five elements', () => {
    expect(getWuxingProfileByElement('木').icon).toBe('🌿');
    expect(getWuxingProfileByElement('火').icon).toBe('🔥');
    expect(getWuxingProfileByElement('土').icon).toBe('🏔');
    expect(getWuxingProfileByElement('金').icon).toBe('✨');
    expect(getWuxingProfileByElement('水').icon).toBe('💧');
  });

  it('falls back to 木 for an unknown element', () => {
    expect(getWuxingProfileByElement('unknown').wuxing).toBe('木');
  });
});

// 相生/相克/比和 relation logic derived from the element mapping.
// (五行 relations are not a single exported fn here; we assert them via the
//  documented element ordering used across profiles.)
describe('music-oracle — 五行 相生/相克/比和 invariants', () => {
  const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE: Record<string, string> = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };

  it('相生 cycle is a closed loop of 5 elements', () => {
    let cur = '木';
    const seen = new Set<string>();
    for (let i = 0; i < 5; i++) {
      seen.add(cur);
      cur = SHENG[cur];
    }
    expect(seen.size).toBe(5);
    expect(cur).toBe('木'); // back to start
  });

  it('two 天干 of the same element are 比和 (same profile)', () => {
    // 甲 and 乙 both 木 → identical profile object
    expect(getWuxingMusicProfile('甲')).toBe(getWuxingMusicProfile('乙'));
  });

  it('相生 pair: profile of generator differs from generated', () => {
    // 甲(木) generates 丙(火)
    const wood = getWuxingMusicProfile('甲');
    const fire = getWuxingMusicProfile('丙');
    expect(SHENG[wood.wuxing]).toBe(fire.wuxing);
    expect(wood).not.toBe(fire);
  });

  it('相克 pair maps correctly via KE table', () => {
    // 甲(木) controls 戊(土)
    const wood = getWuxingMusicProfile('甲');
    const earth = getWuxingMusicProfile('戊');
    expect(KE[wood.wuxing]).toBe(earth.wuxing);
  });
});

describe('music-oracle — getTodayTiangan under fixed fake time', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns valid 干支/天干/五行 for 2026-06-17 (Beijing)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T10:00:00+08:00'));

    const r = getTodayTiangan();

    // golden: 2026-06-17 → 壬戌, 壬→水
    expect(r.tiangan).toBe('壬');
    expect(r.ganzhi).toBe('壬戌');
    expect(r.wuxing).toBe('水');
    expect(r.description).toContain('水');
    expect(r.description).toContain('壬');
  });

  it('天干 is always one of the 10 干 and 五行 one of the 5 元素', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T10:00:00+08:00'));

    const r = getTodayTiangan();
    expect('甲乙丙丁戊己庚辛壬癸').toContain(r.tiangan);
    expect(['木', '火', '土', '金', '水']).toContain(r.wuxing);
    expect(r.ganzhi).toHaveLength(2);
    expect(r.ganzhi.startsWith(r.tiangan)).toBe(true);
  });
});
