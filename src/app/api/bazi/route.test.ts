import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks (hoisted) ---
// These routes use STATIC imports, so the mock factories run before normal
// top-level consts are initialized. Use vi.hoisted to share the spies safely.
const h = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  checkRateLimit: vi.fn(),
  checkBaziQuota: vi.fn(),
  refundQuota: vi.fn(),
  isUserVip: vi.fn(),
  generateBaziAnalysis: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: h.getServerSession }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/lib/chaos-middleware', () => ({ applyChaos: vi.fn(async () => null) }));

vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: h.checkRateLimit }));

vi.mock('@/lib/quota', () => ({
  checkBaziQuota: h.checkBaziQuota,
  refundQuota: h.refundQuota,
  isUserVip: h.isUserVip,
}));

vi.mock('@/lib/ai', () => ({
  generateBaziAnalysis: h.generateBaziAnalysis,
}));

const { getServerSession, checkRateLimit, checkBaziQuota, refundQuota, generateBaziAnalysis } = h;

vi.mock('@/lib/ai/circuitBreaker', () => ({
  withCircuitBreaker: (_key: string, fn: () => unknown) => fn(),
}));
vi.mock('@/lib/ai/withTimeout', () => ({
  // Run the wrapped fn directly; ignore timeout/fallback machinery.
  withAiTimeout: (fn: () => unknown) => fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// NOTE: @/lib/bazi, zod and @/lib/utils/sanitize are kept real (deterministic calc + real validation).

import { POST } from './route';
import { getDayunStart, getLunarDate, getYearGanzhi } from '@/lib/bazi';
import { getTodayBeijing } from '@/lib/timezone';

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://test/api/bazi', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

const validBody = {
  name: '测试',
  gender: 'male',
  birthDate: '1990-06-15',
  birthHour: 6,
};

// ── 大运锚点不变式 ───────────────────────────────────────────────
// 四柱（calculateBazi）与大运（getDayunStart/getCurrentDayun/getDayunTimeline）必须出自
// 同一个出生时刻。二者各走一套 lunar-javascript 调用，只靠「起运年月＝大运表首格年月」
// 这类响应内部的自洽断言查不出锚点错配——那两项本就共用同一个 dayunHour，会一起错。
// 唯一能把两条链路绑在一起的判据是：大运首格干支必须由 pillars.month 推得。
const GAN_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI_LIST = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 干支 → 六十甲子序号(0-59)；不合法返回 -1 */
function jiaziIndex(gan: string, zhi: string): number {
  const gi = GAN_LIST.indexOf(gan);
  const zi = ZHI_LIST.indexOf(zhi);
  if (gi < 0 || zi < 0) return -1;
  for (let i = 0; i < 60; i++) if (i % 10 === gi && i % 12 === zi) return i;
  return -1;
}

/** 六十甲子序号 → 干支（自动取模，可传负数） */
function jiaziAt(index: number): string {
  const i = ((index % 60) + 60) % 60;
  return `${GAN_LIST[i % 10]}${ZHI_LIST[i % 12]}`;
}

/**
 * 断言大运确实排自本响应的四柱，而不是另一副盘：
 * 1. 首格干支 = 月柱的下一步（阳男阴女顺行 +1、阴男阳女逆行 -1，阴阳看年干）；
 * 2. 顺/逆方向沿续到后续各格（每格再走一步）；
 * 3. 起运年月 = 大运表首格年月（同一响应内两个字段的一致性）。
 *
 * 判据 1 是本文件唯一能发现「四柱按 0 点排、大运按时辰起始小时排」的断言：
 * 跨节气日（每年约 12 天）两个锚点会落进不同月柱，跨立春日甚至落进不同年柱、连顺逆都反过来。
 */
function expectDayunAnchoredToPillars(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any,
  gender: 'male' | 'female',
) {
  const timeline = json.dayunTimeline as Array<{ gan: string; zhi: string; yearStart: number; startMonth: number }>;
  expect(timeline.length).toBeGreaterThan(0);

  const yangYear = GAN_LIST.indexOf(json.pillars.year.gan) % 2 === 0;
  const forward = yangYear === (gender === 'male'); // 阳男 / 阴女 顺行
  const monthIndex = jiaziIndex(json.pillars.month.gan, json.pillars.month.zhi);
  expect(monthIndex).toBeGreaterThanOrEqual(0);

  timeline.forEach((item, i) => {
    expect(`${item.gan}${item.zhi}`).toBe(jiaziAt(monthIndex + (forward ? i + 1 : -(i + 1))));
  });

  expect(`${timeline[0].yearStart}年${timeline[0].startMonth}月起运`).toBe(json.dayunStartAt);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network blocked'); }));
  getServerSession.mockResolvedValue({ user: { id: 'u1' } });
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
  checkBaziQuota.mockResolvedValue({ hasQuota: true, isVip: false });
  refundQuota.mockResolvedValue(undefined);
  generateBaziAnalysis.mockResolvedValue({
    dayMasterAnalysis: '日主分析', personality: '性格', career: '事业',
    wealth: '财运', relationship: '感情', health: '健康',
    dayunAnalysis: '大运', traits: ['稳重'], _source: 'deepseek',
  });
});

describe('POST /api/bazi', () => {
  it('returns 400 for an invalid birthDate format (zod)', async () => {
    const res = await POST(makeReq({ ...validBody, birthDate: '06/15/1990' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('输入数据格式错误');
  });

  it('returns 400 for an impossible date (Feb 30)', async () => {
    const res = await POST(makeReq({ ...validBody, birthDate: '1990-02-30' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('输入数据格式错误');
  });

  it('accepts a missing birthHour（时辰未知 → 按未知时辰排盘，birthHour 现为可选）', async () => {
    // 移动端 M0 起 birthHour 改为 optional（schema .optional()，缺失时按 -1「时辰未知」处理），
    // 故缺 birthHour 不再 400，而是正常排盘返回 200。
    const { birthHour, ...noHour } = validBody;
    void birthHour;
    const res = await POST(makeReq(noHour));
    expect(res.status).toBe(200);
  });

  it('does NOT gate quota at /api/bazi — 排盘开放，AI 配额改在 /api/bazi/stream 生成处校验', async () => {
    // 即使配额耗尽，排盘端点仍返回命盘：避免与 stream 双重计费，并堵住「重新分析」直打 stream 绕过配额
    checkBaziQuota.mockResolvedValue({ hasQuota: false, isVip: false });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    expect((await res.json()).pillars).toBeDefined();
  });

  it('returns 429 when rate limited', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
  });

  it('valid payload with quota allowed returns 200 with computed pillars', async () => {
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pillars).toBeDefined();
    expect(json.pillars.year).toBeDefined();
    expect(json.wuxing).toBeDefined();
    // 现行架构：本路由只做确定性排盘，AI 解读延迟到 /api/bazi/stream（按 cacheKey 流式）。
    // 故 aiAnalysis 为空串占位，且本路由不调用 generateBaziAnalysis。
    expect(json.aiAnalysis).toBe('');
    expect(json.cacheKey).toMatch(/^v6:bazi:/);
    expect(generateBaziAnalysis).not.toHaveBeenCalled();
    // 首屏结构化命盘模块：神煞/流年/流月(12)/终身大运表
    expect(Array.isArray(json.shensha)).toBe(true);
    if (json.shensha.length) {
      expect(json.shensha[0]).toHaveProperty('name');
      expect(['吉', '凶', '中']).toContain(json.shensha[0].nature);
    }
    expect(json.liunian).toHaveProperty('ganzhi');
    expect(json.liuyue).toHaveLength(12);
    expect(Array.isArray(json.dayunTimeline)).toBe(true);
    expect(json.dayunTimeline.length).toBeGreaterThan(6);
  });

  it('cacheKey 区分精确时分/农历/晚子时，不再串档', async () => {
    const keyOf = async (body: unknown) => (await (await POST(makeReq(body))).json()).cacheKey as string;

    // 同一粗时辰、不同精确分钟 → 必须不同 key
    const base = { ...validBody, knowTime: true, birthHourNum: 6, birthMinute: 10 };
    const k0610 = await keyOf(base);
    const k0650 = await keyOf({ ...base, birthMinute: 50 });
    expect(k0610).not.toBe(k0650);

    // 农历 vs 阳历同年月日 → 必须不同 key
    const kSolar = await keyOf(validBody);
    const kLunar = await keyOf({ ...validBody, isLunar: true });
    expect(kSolar).not.toBe(kLunar);

    // 晚子时 vs 早子时 → 必须不同 key
    const ziBase = { ...validBody, knowTime: true, birthHourNum: 23, birthMinute: 30 };
    const kEarly = await keyOf(ziBase);
    const kLate = await keyOf({ ...ziBase, lateZiShi: true });
    expect(kEarly).not.toBe(kLate);

    // 逻辑相同的输入 → 必须同 key（缓存可复用，不碎裂）
    expect(await keyOf(validBody)).toBe(await keyOf({ ...validBody, name: '另一个名字' }));
  });

  // AI 解读在 Redis 里存 30 天，key 由本路由下发。keyMaterial 的任何改动都会整片作废缓存，
  // 代价是真金白银的重算，故用 golden 值把「阳历用户的 key」钉死：
  // 农历同源修复往 keyMaterial 里加了 solarDate，但阳历分支该键为 undefined、被
  // JSON.stringify 丢弃，哈希必须逐字不变。本用例失败只有两种可能：
  //   1) 有人无意间改了 keyMaterial 的字段/顺序 → 正在悄悄作废全量缓存，应改回；
  //   2) 确实要作废（口径变更） → 连同 v6 前缀一起升版，再更新这里的 golden 值。
  it('阳历输入的 cacheKey 是 golden 值：农历修复不得牵连阳历用户的 AI 缓存', async () => {
    const json = await (await POST(makeReq(validBody))).json();
    expect(json.cacheKey).toBe('v6:bazi:a414c32e5091e94c');
  });

  // bazi 页客户端已脱 lunar-javascript：农历串/起运/当前流年干支改由本路由返回。
  // 这些字段必须与「迁走前客户端的计算口径」逐字一致，否则用户看到的展示值会在上线后跳变。
  describe('lunar 派生字段（客户端脱 lunar-javascript 后由服务端下发）', () => {
    it('只知粗略时辰时，起运与四柱同锚（当日 0 点），不按时辰起始小时', async () => {
      // validBody.birthHour = 6 → 午时。粗时辰分支下 calculateBazi 的年/月/日三柱由
      // Solar.fromYmd(当日 0 点) 排出，故起运/大运表也必须传 undefined（buildEightChar 同样退回 0 点）。
      // 曾经这里传过「时辰起始小时 11」，导致 pillars 与 dayunTimeline 出自两副盘，见 dayunAnchor 用例。
      const json = await (await POST(makeReq(validBody))).json();
      const expected = getDayunStart('1990-06-15', 'male', undefined, undefined);
      expect(json.dayunStartDescription).toBe(expected.description);
      expect(json.dayunStartAt).toBe(expected.at);
      expectDayunAnchoredToPillars(json, 'male');
      expect(json.lunarDate).toBe(getLunarDate('1990-06-15'));
      expect(json.currentYearGanzhi).toBe(getYearGanzhi(getTodayBeijing()));
      expect(json.flowYear).toBe(new Date(Date.now() + 8 * 3600 * 1000).getUTCFullYear());
    });

    // currentYearGanzhi 按立春换年，flowYear 按公历年——每年 1/1~立春 之间两者不同步。
    // 前端长期缓存命盘时必须拿 ganzhiValidUntil 判这一项是否过期，否则那 30 多天会显示上一轮干支。
    it('ganzhiValidUntil = 下一个「年干支换年日」的北京 00:00，且换年当天干支确实变了', async () => {
      const json = await (await POST(makeReq(validBody))).json();
      expect(typeof json.ganzhiValidUntil).toBe('number');
      // 尚未到期：此刻的干支就是响应里的那个
      expect(Date.now()).toBeLessThan(json.ganzhiValidUntil);

      // 反解出北京日期，验证它就是换年日：当天干支 ≠ 前一天干支，且当天干支 ≠ 今天的干支
      const boundary = new Date(json.ganzhiValidUntil + 8 * 3600 * 1000).toISOString().slice(0, 10);
      const dayBefore = new Date(json.ganzhiValidUntil + 8 * 3600 * 1000 - 86400000)
        .toISOString().slice(0, 10);
      expect(getYearGanzhi(boundary)).not.toBe(getYearGanzhi(dayBefore));
      expect(getYearGanzhi(dayBefore)).toBe(json.currentYearGanzhi);
      // 立春恒落在 2/3~2/5，date 口径的换年日落在 2/4~2/6
      expect(boundary.slice(5)).toMatch(/^02-0[456]$/);
    });

    it('知精确时分时，起运按 birthHourNum/birthMinute 算', async () => {
      const body = { ...validBody, gender: 'female', birthDate: '1988-11-03', knowTime: true, birthHourNum: 13, birthMinute: 25 };
      const json = await (await POST(makeReq(body))).json();
      const expected = getDayunStart('1988-11-03', 'female', 13, 25);
      expect(json.dayunStartDescription).toBe(expected.description);
      expect(json.dayunStartAt).toBe(expected.at);
    });

    it('时辰未知(-1) 时，起运不传小时', async () => {
      const json = await (await POST(makeReq({ ...validBody, birthDate: '2001-02-10', birthHour: -1 }))).json();
      expect(json.dayunStartDescription).toBe(getDayunStart('2001-02-10', 'male', undefined, undefined).description);
      expectDayunAnchoredToPillars(json, 'male');
    });

    it('立春前后：ganzhiValidUntil 跟立春走，不跟公历年走', async () => {
      const beijingMidnight = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) - 8 * 3600 * 1000;
      vi.useFakeTimers();
      try {
        // 北京 2026-01-20：公历年已经是 2026，但年干支还是乙巳（2026-02-05 才换丙午）。
        // 这正是 flowYear 判不出过期的那 30 多天。
        vi.setSystemTime(new Date('2026-01-20T04:00:00Z'));
        let json = await (await POST(makeReq(validBody))).json();
        expect(json.flowYear).toBe(2026);
        expect(json.currentYearGanzhi).toBe('乙巳');
        expect(json.ganzhiValidUntil).toBe(beijingMidnight(2026, 2, 5));

        // 换年当天：干支已翻到丙午，有效期顺延到下一年的换年日
        vi.setSystemTime(new Date('2026-02-05T04:00:00Z'));
        json = await (await POST(makeReq(validBody))).json();
        expect(json.currentYearGanzhi).toBe('丙午');
        expect(json.ganzhiValidUntil).toBe(beijingMidnight(2027, 2, 5));

        // 换年日前一天：仍是乙巳，且有效期正好是次日 00:00（北京）
        vi.setSystemTime(new Date('2026-02-04T04:00:00Z'));
        json = await (await POST(makeReq(validBody))).json();
        expect(json.currentYearGanzhi).toBe('乙巳');
        expect(json.ganzhiValidUntil).toBe(beijingMidnight(2026, 2, 5));
      } finally {
        vi.useRealTimers();
      }
    });

    // 存量命盘的「重发补齐」是把历史记录里的原始入参再发一遍。历史记录一度只存粗时辰码，
    // 于是补齐只能按当日 0 点折算——本用例钉死这条链路的根因：同一副四柱下，
    // 粗时辰与精确时分给出的起运/大运表并不相同。故记录必须持久化精确时刻并原样透传，
    // 否则屏幕上的起运（记录里的精确值）与大运表（重算的粗值）会是两套边界。
    it('同一副四柱：精确 21:30 与粗时辰(亥时，按 0 点折算)，起运与大运表并不相同', async () => {
      const base = { name: '测试', gender: 'male', birthDate: '1990-06-15', birthHour: 11 };
      const coarse = await (await POST(makeReq(base))).json();
      const precise = await (await POST(makeReq({
        ...base, knowTime: true, birthHourNum: 21, birthMinute: 30,
      }))).json();

      // 四柱逐字相同（含时柱己亥）→ 前端的 isSameChart 会放行，光靠比四柱拦不住精度错配
      expect(precise.pillars).toEqual(coarse.pillars);
      // 两种精度各自内部自洽，但彼此不同（实测 1997年9月 vs 1998年1月，连大运表首格年份都差一年）
      expect(coarse.dayunStartAt).toBe(getDayunStart('1990-06-15', 'male', undefined, undefined).at);
      expect(precise.dayunStartAt).toBe(getDayunStart('1990-06-15', 'male', 21, 30).at);
      expect(precise.dayunStartAt).not.toBe(coarse.dayunStartAt);
      expect(precise.dayunTimeline[0]).not.toEqual(coarse.dayunTimeline[0]);
      // 但两边都必须排自各自的四柱（此处 6/15 远离节气，两副盘月柱相同，故首格干支一致、只有年月不同）
      expectDayunAnchoredToPillars(coarse, 'male');
      expectDayunAnchoredToPillars(precise, 'male');
      // cacheKey 也必须分开，避免两种精度共用一份 AI 解读
      expect(precise.cacheKey).not.toBe(coarse.cacheKey);
    });

    // —— 回归：粗时辰的大运锚点必须与四柱一致 ——
    // 曾经粗时辰分支给大运传 SHICHEN_START_HOUR[birthHour]，而四柱仍按当日 0 点排。
    // 平日无感，跨「节」/立春日直接给出两副盘拼起来的响应。下面两条是实测出的原始反例。
    describe('大运锚点必须与四柱同源（粗时辰不得另取代表时刻）', () => {
      it('跨节日 1990-06-06 亥时男：大运首格必须是月柱辛巳的下一步壬午，不能跳到癸未', async () => {
        // 0 点排出的月柱是辛巳(芒种前)，21 点那副盘已进壬午(芒种后)。
        // 按 21 点算大运会返回癸未(2000起)——从辛巳顺行整整跳掉壬午一步，等于抹掉 10 年。
        const json = await (await POST(makeReq({
          name: '测试', gender: 'male', birthDate: '1990-06-06', birthHour: 11,
        }))).json();
        expect(`${json.pillars.month.gan}${json.pillars.month.zhi}`).toBe('辛巳');
        expect(`${json.dayunTimeline[0].gan}${json.dayunTimeline[0].zhi}`).toBe('壬午');
        expectDayunAnchoredToPillars(json, 'male');
      });

      it('立春日 1990-02-04 亥时男：年柱己巳(阴)→阴男逆行，大运不得顺行', async () => {
        // 0 点排出己巳年/丁丑月(立春前)，21 点已过立春算庚午年(阳)。
        // 按 21 点算大运会返回己卯/庚辰/辛巳（顺行），与四柱给出的「阴男逆行」直接矛盾。
        const json = await (await POST(makeReq({
          name: '测试', gender: 'male', birthDate: '1990-02-04', birthHour: 11,
        }))).json();
        expect(`${json.pillars.year.gan}${json.pillars.year.zhi}`).toBe('己巳');
        expect(`${json.pillars.month.gan}${json.pillars.month.zhi}`).toBe('丁丑');
        expect(json.dayunTimeline.slice(0, 3).map((d: { gan: string; zhi: string }) => `${d.gan}${d.zhi}`))
          .toEqual(['丙子', '乙亥', '甲戌']);
        expectDayunAnchoredToPillars(json, 'male');
      });

      it('精确时分分支：四柱与大运同走精确时刻，锚点同样自洽', async () => {
        // 1990-06-06 21:30 排出的月柱是壬午，大运首格就该是癸未——「按 21 点算大运」本身不错，
        // 错的是「四柱按 0 点、大运按 21 点」。用户填了精确时刻，两边一起走精确时刻即可。
        const json = await (await POST(makeReq({
          name: '测试', gender: 'male', birthDate: '1990-06-06', birthHour: 11,
          knowTime: true, birthHourNum: 21, birthMinute: 30,
        }))).json();
        expect(`${json.pillars.month.gan}${json.pillars.month.zhi}`).toBe('壬午');
        expect(`${json.dayunTimeline[0].gan}${json.dayunTimeline[0].zhi}`).toBe('癸未');
        expectDayunAnchoredToPillars(json, 'male');
      });

      it('女命同样成立（顺逆判定反向）', async () => {
        const json = await (await POST(makeReq({
          name: '测试', gender: 'female', birthDate: '1990-02-04', birthHour: 11,
        }))).json();
        expectDayunAnchoredToPillars(json, 'female');
      });
    });

    // —— 回归：农历生日的大运锚点必须与四柱同源 ——
    // calculateBazi 对 isLunar=true 会先 Lunar→Solar 折算再排四柱，而 getDayunStart /
    // getCurrentDayun / getDayunTimeline / getLunarDate 只认公历串。曾经这里把农历原串
    // 直接喂给后四者，于是农历用户的四柱与大运长期出自两副盘（HEAD 亦然）。
    // 与粗时辰那组反例不同，这一组不是「跨节气才犯」——农历日与公历日恒不相等，
    // 每一个农历用户都中招，错位幅度可达一步干支 + 数年。
    describe('农历生日必须先折算成公历（isLunar=true 时四柱与大运同源）', () => {
      it('农历 1990-06-15 男：大运排自公历 1990-08-05 的月柱癸未，首格甲申(1991)，不是癸未(1998)', async () => {
        // 修复前：大运排自「1990-06-15 当公历」那副盘（月柱壬午）→ 首格癸未(1998 起)、
        // 起运 7 岁 7 个月；正解是甲申(1991 起)、起运 1 岁 0 个月。
        const json = await (await POST(makeReq({ ...validBody, isLunar: true }))).json();
        expect(`${json.pillars.year.gan}${json.pillars.year.zhi}`).toBe('庚午');
        expect(`${json.pillars.month.gan}${json.pillars.month.zhi}`).toBe('癸未');
        expect(`${json.pillars.day.gan}${json.pillars.day.zhi}`).toBe('壬寅');
        expect(`${json.dayunTimeline[0].gan}${json.dayunTimeline[0].zhi}`).toBe('甲申');
        expect(json.dayunTimeline[0].yearStart).toBe(1991);
        expect(json.dayunStartDescription).toBe('1岁起运');
        expect(json.dayunStartAt).toBe('1991年8月起运');
        // 唯一能把四柱与大运两条链路绑死的判据
        expectDayunAnchoredToPillars(json, 'male');
        // 与「用折算后的公历日直接排」逐字一致
        expect(json.dayunStartAt).toBe(getDayunStart('1990-08-05', 'male', undefined, undefined).at);
        expect(json.solarBirthDate).toBe('1990-08-05');
        // 农历串必须回显用户填的那一天；修复前显示的是「庚午年五月廿三」（另一天）
        expect(json.lunarDate).toBe('庚午年六月十五');
        expect(json.lunarDate).toBe(getLunarDate('1990-08-05'));
      });

      it('跨立春的农历日 1990-01-15 男：年柱庚午(阳)→阳男顺行，修复前按己巳(阴)整个反向', async () => {
        // 农历 1990-01-15 → 公历 1990-02-10（立春后，庚午年）。
        // 原串「1990-01-15」当公历落在立春前 → 己巳年(阴) → 阴男逆行，
        // 于是大运给出丙子/乙亥/甲戌（逆行），与四柱推出的顺行方向直接相反。
        // 这是最恶性的一档：不只是错位几年，整条大运走向是反的。
        const json = await (await POST(makeReq({
          name: '测试', gender: 'male', birthDate: '1990-01-15', birthHour: -1, isLunar: true,
        }))).json();
        expect(`${json.pillars.year.gan}${json.pillars.year.zhi}`).toBe('庚午');
        expect(`${json.pillars.month.gan}${json.pillars.month.zhi}`).toBe('戊寅');
        expect(json.dayunTimeline.slice(0, 3).map((d: { gan: string; zhi: string }) => `${d.gan}${d.zhi}`))
          .toEqual(['己卯', '庚辰', '辛巳']);
        expect(json.solarBirthDate).toBe('1990-02-10');
        expectDayunAnchoredToPillars(json, 'male');
      });

      it('农历 + 精确时分 + 女命：折算后的公历日与时分一起送进大运，锚点仍自洽', async () => {
        // 农历 1988-11-03 13:25 女 → 公历 1988-12-11 13:25，四柱 戊辰/甲子/庚子/癸未。
        // 戊(阳)年女命逆行 → 首格癸亥(1990 起)、起运 1 岁 5 个月。
        // 修复前按原串算得辛酉(1997 起)、起运 8 岁 8 个月。
        const json = await (await POST(makeReq({
          name: '测试', gender: 'female', birthDate: '1988-11-03', birthHour: 7,
          isLunar: true, knowTime: true, birthHourNum: 13, birthMinute: 25,
        }))).json();
        expect(`${json.pillars.month.gan}${json.pillars.month.zhi}`).toBe('甲子');
        expect(`${json.pillars.hour.gan}${json.pillars.hour.zhi}`).toBe('癸未');
        expect(`${json.dayunTimeline[0].gan}${json.dayunTimeline[0].zhi}`).toBe('癸亥');
        expect(json.dayunStartAt).toBe('1990年5月起运');
        expect(json.dayunStartDescription).toBe('1岁5个月起运');
        // 精确分支下折算后的公历日 + 时分必须一起传给大运
        expect(json.dayunStartAt).toBe(getDayunStart('1988-12-11', 'female', 13, 25).at);
        expectDayunAnchoredToPillars(json, 'female');
        expect(json.solarBirthDate).toBe('1988-12-11');
      });

      it('阳历输入不受影响：solarBirthDate 即原始 birthDate，大运逐字不变', async () => {
        const json = await (await POST(makeReq(validBody))).json();
        expect(json.solarBirthDate).toBe('1990-06-15');
        expect(json.dayunStartAt).toBe(getDayunStart('1990-06-15', 'male', undefined, undefined).at);
        expect(json.lunarDate).toBe(getLunarDate('1990-06-15'));
        expectDayunAnchoredToPillars(json, 'male');
      });

      it('农历用户的 cacheKey 必须与修复前不同（旧 AI 解读按错误大运生成，不可复用）', async () => {
        const json = await (await POST(makeReq({ ...validBody, isLunar: true }))).json();
        // 修复前 keyMaterial 无 solarDate，同一输入的 key 是这个值。命中即说明缓存未作废。
        expect(json.cacheKey).not.toBe('v6:bazi:df455d23dbb89a65');
      });
    });

    it('透传精确时刻后，重算结果与当初排盘逐字一致（补齐链路的正确性前提）', async () => {
      const input = {
        name: '测试', gender: 'female', birthDate: '1988-11-03',
        birthHour: 7, knowTime: true, birthHourNum: 13, birthMinute: 25,
      };
      const first = await (await POST(makeReq(input))).json();
      // 恢复记录后的补齐请求：同一份入参再发一遍（前端 ensureFullResult 的 body 形状）
      const refilled = await (await POST(makeReq({ ...input, name: '缘主' }))).json();

      expect(refilled.dayunStartAt).toBe(first.dayunStartAt);
      expect(refilled.dayunStartDescription).toBe(first.dayunStartDescription);
      expect(refilled.dayunTimeline).toEqual(first.dayunTimeline);
      expect(refilled.lunarDate).toBe(first.lunarDate);
      // 姓名不参与排盘，cacheKey 也应一致（补齐时前端会用 '缘主' 兜底）
      expect(refilled.cacheKey).toBe(first.cacheKey);
    });

    it('八字直输模式无出生日期：农历/起运缺省，dayunTimeline 为空数组', async () => {
      const body = {
        name: '测试', gender: 'male',
        pillars: { yearGan: '庚', yearZhi: '午', monthGan: '壬', monthZhi: '午', dayGan: '甲', dayZhi: '子' },
      };
      const res = await POST(makeReq(body));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.lunarDate).toBeUndefined();
      expect(json.dayunStartDescription).toBeUndefined();
      expect(json.dayunTimeline).toEqual([]);
      // 当前流年干支与命盘无关，八字直输模式同样返回
      expect(json.currentYearGanzhi).toBeTruthy();
    });
  });

  it('allows a guest (no session) when guest rate limit permits', async () => {
    getServerSession.mockResolvedValue(null);
    const res = await POST(makeReq(validBody));
    // Guests are allowed to try (no quota gate); should compute a result.
    expect(res.status).toBe(200);
    // guest path should not touch user quota
    expect(checkBaziQuota).not.toHaveBeenCalled();
  });
});
