import { describe, it, expect } from 'vitest';
import { describeDayun } from './dayunDetail';
import { getTenGod } from './helpers';

describe('describeDayun', () => {
  const item = { gan: '壬' as const, zhi: '午' as const, wuxing: '水' as const };

  it('computes 天干十神 relative to day master', () => {
    // 日主庚金，壬为庚所生 → 食神
    const d = describeDayun(item, '庚');
    expect(d.ganShiShen).toBe('食神');
    expect(d.ganShiShen).toBe(getTenGod('庚', '壬'));
    expect(d.ganZhi).toBe('壬午');
    expect(d.wuxing).toBe('水');
  });

  it('lists 地支藏干 with their 十神 (本气在前)', () => {
    // 午藏 丁、己
    const d = describeDayun(item, '庚');
    expect(d.hiddenGods.map(h => h.gan)).toEqual(['丁', '己']);
    d.hiddenGods.forEach(h => expect(h.shishen).toBe(getTenGod('庚', h.gan)));
  });

  it('provides 纳音 and 四维 aspects for a known 十神', () => {
    const d = describeDayun(item, '庚');
    expect(d.naYin).toBe('杨柳木'); // 壬午 → 杨柳木
    expect(d.aspects.length).toBe(4);
    expect(d.aspects.map(a => a.label)).toEqual(['事业', '财运', '感情', '健康']);
  });

  it('judges 吉 when 大运五行 equals 用神', () => {
    const d = describeDayun(item, '庚', '水', '土');
    expect(d.fortune).toBe('吉');
    expect(d.fortuneReason).toContain('喜用神');
  });

  it('judges 凶 when 大运五行 equals 忌神 (and does not feed 用神)', () => {
    // 大运水：用神火(水不生火)，忌神水(命中) → 凶
    const d = describeDayun(item, '庚', '火', '水');
    expect(d.fortune).toBe('凶');
    expect(d.fortuneReason).toContain('忌神');
  });

  it('falls back to day-master relation when 用忌神 absent', () => {
    // 大运水，日主庚金 → 金生水（泄），既非生扶也非克制 → 平
    const d = describeDayun(item, '庚');
    expect(['吉', '平', '凶']).toContain(d.fortune);
  });
});
