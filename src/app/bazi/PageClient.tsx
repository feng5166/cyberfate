'use client';

import { Fragment, type ReactNode, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Heart,
  History,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { saveBirthInfo, loadBirthInfo } from '@/lib/utils/storage';
import { deleteRecord, getRecordById, loadRecords, saveRecord } from '@/lib/utils/history';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import { QuotaLimitModal } from '@/components/QuotaLimitModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/pricing/UpgradeModal';
import { Container } from '@/components/ui/Container';
import { CitySearch } from '@/components/ui/CitySearch';
import { track } from '@/lib/analytics';
import { Tag } from '@/components/ui/Tag';
import { Footer } from '@/components/layout/Footer';
import { AiDisclaimer } from '@/components/ui/AiDisclaimer';
import { PageShell, SplitLayout } from '@/components/ui';
// 直引具体子模块，不走 '@/lib/bazi' barrel：barrel 会 re-export calculator / liunian /
// yingqi / tools / lifeKline，它们（后几个经 calculator 间接）顶层 import lunar-javascript ——
// 一个 436KB 的 CJS 单文件（打包后 299KB raw / 97KB gz、无法 tree-shake），
// 只要有一处 value-import 就会把整库压进 bazi 首屏。
import {
  DAYMASTER_TRAITS,
  DIZHI_LIST,
  TIANGAN_LIST,
  TIANGAN_WUXING,
  WUXING_KEYS,
} from '@/lib/bazi/constants';
// 以下子模块的 import 链里都没有 lunar-javascript（纯查表 / 纯计算），可安全直引：
//   dayunDetail → constants + helpers + geju；shensha / interactions / geju / persona → constants + helpers；
//   quickRead → dayunDetail + constants（对 liunian 只有 import type，编译期擦除）。
import { describeDayun } from '@/lib/bazi/dayunDetail';
import type { DayunDetail } from '@/lib/bazi/dayunDetail';
import { analyzeShensha, shenshaNature } from '@/lib/bazi/shensha';
import { analyzeInteractions } from '@/lib/bazi/interactions';
import { analyzeMingGe } from '@/lib/bazi/geju';
import type { GejuName } from '@/lib/bazi/geju';
import { buildQuickRead } from '@/lib/bazi/quickRead';
import { personaFor } from '@/lib/bazi/persona';
// 注意：这里刻意不 import '@/lib/bazi/calculator' / '@/lib/bazi/liunian' / '@/lib/bazi/yingqi'
// —— 静态、动态都不 import。原先本页现算的那些量（农历串、起运、终身大运表、流年、流月、
// 当前流年干支、关键应期）全部改读 /api/bazi 响应字段（服务端用同一套实现算出，口径一致）。
// 存量数据（本地历史记录 / 上线前写入的档案缓存 / 跨年过期的流年快照）缺字段时改为
// 「重发一次 /api/bazi 取权威结果」补齐（见 ensureFullResult），而不是在客户端再养一套计算实现。
// 因此本页在任何路径下都不会加载 lunar-javascript。
import type {
  BaziApiResult,
  BaziHistoryRecord,
  BaziResult,
  BaziTrait,
  DayunTimelineItem,
  MingGeInfo,
  TianGan,
  WuxingCount,
  WuXing,
} from '@/lib/bazi/types';

const _loadingSpinner = () => (
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
  </div>
);

const BasicInfoCard = dynamic(() => import('@/components/bazi/BasicInfoCard').then(m => m.BasicInfoCard), { ssr: false, loading: _loadingSpinner });
const BaziChart = dynamic(() => import('@/components/bazi/BaziChart').then(m => m.BaziChart), { ssr: false, loading: _loadingSpinner });
const DayMasterSummaryCard = dynamic(() => import('@/components/bazi/DayMasterSummaryCard').then(m => m.DayMasterSummaryCard), { ssr: false, loading: _loadingSpinner });
const ShareCard = dynamic(() => import('@/components/bazi/ShareCard').then(m => m.ShareCard), { ssr: false, loading: _loadingSpinner });
const ShishenDetailTab = dynamic(() => import('@/components/bazi/ShishenDetailTab').then(m => m.ShishenDetailTab), { ssr: false, loading: _loadingSpinner });
const WuxingChart = dynamic(() => import('@/components/bazi/WuxingChart').then(m => m.WuxingChart), { ssr: false, loading: _loadingSpinner });
const ShenshaCard = dynamic(() => import('@/components/bazi/ShenshaCard').then(m => m.ShenshaCard), { ssr: false, loading: _loadingSpinner });
const LiunianLiuyueCard = dynamic(() => import('@/components/bazi/LiunianLiuyueCard').then(m => m.LiunianLiuyueCard), { ssr: false, loading: _loadingSpinner });
const BaziChatSection = dynamic(() => import('@/components/bazi/BaziChatSection').then(m => m.BaziChatSection), { ssr: false, loading: _loadingSpinner });
const QuickReadCard = dynamic(() => import('@/components/bazi/QuickReadCard').then(m => m.QuickReadCard), { ssr: false, loading: _loadingSpinner });
const TopicReadSection = dynamic(() => import('@/components/bazi/TopicReadSection').then(m => m.TopicReadSection), { ssr: false, loading: _loadingSpinner });
const InteractionsCard = dynamic(() => import('@/components/bazi/InteractionsCard').then(m => m.InteractionsCard), { ssr: false, loading: _loadingSpinner });
const YingqiCard = dynamic(() => import('@/components/bazi/YingqiCard').then(m => m.YingqiCard), { ssr: false, loading: _loadingSpinner });

type AiSectionKey = 'dayMaster' | 'personality' | 'career' | 'wealth' | 'relationship' | 'health' | 'dayun';

type TagVariant = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

interface FaqItem {
  question: string;
  answer: string;
}

interface DayunExtra {
  ageStart?: number;
  ageEnd?: number;
  endYear?: number;
  nextGanZhi?: string;
  nextStartYear?: number;
}

type BaziPageResult = BaziApiResult & {
  dayMasterElement?: WuXing;
  lunarDate?: string;
  /**
   * 本命盘实际锚定的**公历**出生日（由 /api/bazi 算出并下发）。农历输入时它 ≠ 表单里的 birthDate：
   * 农历 1990-06-15 → 公历 1990-08-05，四柱与大运全部排自后者。
   * 凡是「再拿出生日期算命理」的下游（AI 解读工具链的大运/起运/流年、AI 问答的服务端重排、周岁）
   * 都必须用它，否则会算出与屏幕上不同的第二副盘。
   * 存量结果（本地历史记录、上线前写入的档案缓存）没有这一项：那些路径回落到表单原值，
   * 农历用户的兜底放在服务端（请求里同时带 isLunar，由服务端按同一口径自行折算）。
   */
  solarBirthDate?: string;
  zodiac?: string;
  trueSolarOffsetMinutes?: number | null;
  trueSolarCorrection?: string;
  trueSolarTime?: string;
  dayunStartDescription?: string;
  dayunStartAt?: string;
  cacheKey?: string;
  baziResult?: BaziResult;
  dayunExtra?: DayunExtra;
  /** 当前流年干支（服务端按北京当日算，含立春换年）。旧缓存结果无此字段 */
  currentYearGanzhi?: string;
  /**
   * currentYearGanzhi 的失效时刻（epoch ms，＝下一个立春换年日的北京 00:00）。
   * 该值按立春换年，用 flowYear（公历年）判新鲜度会在每年 1/1~立春 的一个多月里误判为「未过期」，
   * 从而显示早一年的流年干支，故单独下发有效期。旧缓存结果无此字段 → 一律按过期处理。
   */
  ganzhiValidUntil?: number;
  /** liunian / liuyue 所属公历年（二者按公历年采样）；与今年不符即为跨年过期，需重取 */
  flowYear?: number;
};

interface BaziProfileData {
  id: string;
  label: string;
  name: string;
  gender: string;
  birthDate: string;
  birthHour: string;
  birthPlace?: string | null;
  isLunar?: boolean;
  isPrimary?: boolean;
  baziResult?: BaziPageResult | null;
  // 精确出生时刻（可选）：游客「档案」实为本地历史记录的映射，记录里存了这几项就必须带过来——
  // 否则补齐请求按粗时辰重算，会与记录里的精确值判为不同源（起运可差数月），甚至因 isLunar 丢失排出另一副四柱。
  // 登录用户的 DB 档案没有这几列，缺失时回落粗时辰，与既有行为一致。
  knowTime?: boolean;
  birthHourNum?: number;
  birthMinute?: number;
  lateZiShi?: boolean;
}

const MAX_LOGGED_IN_PROFILES = 5;
const MAX_VIP_PROFILES = 20; // PRD-BAZI-V2 P1-B：与服务端 profiles/route.ts 保持一致
const MAX_GUEST_PROFILES = 2;

const shichenOptions = [
  { value: '', label: '请选择时辰' },
  { value: '0', label: '子时 (23:00-00:59)' },
  { value: '1', label: '丑时 (01:00-02:59)' },
  { value: '2', label: '寅时 (03:00-04:59)' },
  { value: '3', label: '卯时 (05:00-06:59)' },
  { value: '4', label: '辰时 (07:00-08:59)' },
  { value: '5', label: '巳时 (09:00-10:59)' },
  { value: '6', label: '午时 (11:00-12:59)' },
  { value: '7', label: '未时 (13:00-14:59)' },
  { value: '8', label: '申时 (15:00-16:59)' },
  { value: '9', label: '酉时 (17:00-18:59)' },
  { value: '10', label: '戌时 (19:00-20:59)' },
  { value: '11', label: '亥时 (21:00-22:59)' },
  { value: '-1', label: '不知道（默认午时）' },
];

const SHICHEN_START_HOUR: Record<string, number> = {
  '0': 23, '1': 1, '2': 3, '3': 5, '4': 7, '5': 9,
  '6': 11, '7': 13, '8': 15, '9': 17, '10': 19, '11': 21,
};

function hourToShichenCode(hour: number): string {
  if (hour >= 23 || hour < 1) return '0';
  if (hour < 3) return '1';
  if (hour < 5) return '2';
  if (hour < 7) return '3';
  if (hour < 9) return '4';
  if (hour < 11) return '5';
  if (hour < 13) return '6';
  if (hour < 15) return '7';
  if (hour < 17) return '8';
  if (hour < 19) return '9';
  if (hour < 21) return '10';
  return '11';
}

const hourNumOptions = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, '0')} 时`,
}));

const minuteOptions = Array.from({ length: 12 }, (_, i) => {
  const m = i * 5;
  return { value: String(m), label: `${String(m).padStart(2, '0')} 分` };
});

const aiSectionTitleMap: Record<AiSectionKey, string[]> = {
  dayMaster: ['日主分析'],
  personality: ['性格特点', '性格特质'],
  career: ['事业运势', '事业分析'],
  wealth: ['财运分析', '财富分析'],
  relationship: ['感情运势', '婚姻分析'],
  health: ['健康提示', '健康分析'],
  dayun: ['大运流年', '流年趋势', '当前运势重点', '当前运势'],
};

const wuxingDisplay: Array<{ key: keyof WuxingCount; label: WuXing; variant: TagVariant }> = [
  { key: 'metal', label: '金', variant: 'metal' },
  { key: 'wood', label: '木', variant: 'wood' },
  { key: 'water', label: '水', variant: 'water' },
  { key: 'fire', label: '火', variant: 'fire' },
  { key: 'earth', label: '土', variant: 'earth' },
];

const faqItems: FaqItem[] = [
  {
    question: '八字分析结果会一直保存吗？',
    answer: '本地历史默认最多保留 3 条新记录，超过后会自动覆盖最旧记录。建议及时查看并补充自己的行动计划。',
  },
  {
    question: '同一天出生的人，结果一定一样吗？',
    answer: '不会。出生时辰、出生地、性别与解读模型的综合分析都会影响结果展示，细节差异会较大。',
  },
  {
    question: '"喜用神"和"忌神"可以怎么用？',
    answer: '可以把喜用神理解为更适合补强的能量方向，忌神理解为需要控制投入的方向，用于日常决策优先级排序。',
  },
  {
    question: '大运流年怎么看更实用？',
    answer: '建议用十年看战略、按年度看节奏。先关注当前阶段重点，再拆分到季度和月度动作，避免一次性做太多重大决策。',
  },
  {
    question: '结果和现实冲突时该怎么处理？',
    answer: '优先以现实数据和专业建议为准。命理内容适合作为自我观察与复盘参考，不建议直接替代医疗、法律或投资判断。',
  },
];

/** 去除模型偶尔混入的 Markdown 残留符号，保持纯文本展示 */
function stripMarkdown(s: string): string {
  return s
    .replace(/^#{1,6}\s*/gm, '')       // 标题井号
    .replace(/\*\*(.+?)\*\*/g, '$1')   // 粗体
    .trim();
}

/**
 * 从【章节名】分段文本中取出指定章节内容。
 * 健壮性：容忍标题内外空白、单/多换行；章节结束于下一个【任意标题】或文本末尾
 * （不再依赖「双换行 + 【」，避免模型少打一个换行就把后续章节整段吞进来）。
 * 流式未完成时下一个标题尚未到达，则匹配到末尾返回当前已生成部分。
 */
function parseSection(text: string, titles: string[]): string {
  if (!text) return '';
  for (const title of titles) {
    const t = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 转义正则元字符
    const re = new RegExp(`【\\s*${t}\\s*】[ \\t]*\\n?([\\s\\S]*?)(?=\\n*【[^】]{1,12}】|$)`);
    const match = re.exec(text);
    if (match?.[1]?.trim()) return stripMarkdown(match[1]);
  }
  return '';
}

function extractAiSections(aiAnalysis: string): Record<AiSectionKey, string> {
  return {
    dayMaster: parseSection(aiAnalysis, aiSectionTitleMap.dayMaster),
    personality: parseSection(aiAnalysis, aiSectionTitleMap.personality),
    career: parseSection(aiAnalysis, aiSectionTitleMap.career),
    wealth: parseSection(aiAnalysis, aiSectionTitleMap.wealth),
    relationship: parseSection(aiAnalysis, aiSectionTitleMap.relationship),
    health: parseSection(aiAnalysis, aiSectionTitleMap.health),
    dayun: parseSection(aiAnalysis, aiSectionTitleMap.dayun),
  };
}

/** 判断缓存的 AI 解读是否「完整可展示」（含足够章节）。不完整则应放出「开始AI解读」按钮。 */
function isAiAnalysisComplete(aiAnalysis?: string): boolean {
  if (!aiAnalysis || aiAnalysis.trim().length < 80) return false;
  const s = extractAiSections(aiAnalysis);
  const filled = [s.dayMaster, s.personality, s.career, s.wealth, s.relationship, s.health, s.dayun]
    .filter((x) => x && x.trim().length > 0).length;
  return filled >= 3;
}

/** 北京时间当前公历年 */
function beijingYear(): number {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).getUTCFullYear();
}

/**
 * 取命盘四柱：优先用持久化的 baziResult.chart，否则从展示用 pillars 重建
 * （本地历史记录只存了 pillars，没有 baziResult）。无时柱则 hour=null。
 */
function chartFromResult(result: BaziPageResult): BaziResult['chart'] | null {
  const fromBazi = result.baziResult?.chart;
  if (fromBazi?.year && fromBazi?.month && fromBazi?.day) return fromBazi;
  const pr = result.pillars;
  if (!pr?.year || !pr?.month || !pr?.day) return null;
  const hasHour = result.hasHour !== false;
  return { year: pr.year, month: pr.month, day: pr.day, hour: hasHour ? (pr.hour ?? null) : null };
}

/**
 * currentYearGanzhi 是否已过期。
 * 该值按立春换年，只能拿服务端下发的 ganzhiValidUntil 判；没有这个字段的存量结果一律按过期处理
 * （用 flowYear 的公历年口径判会在每年 1/1~立春 之间误判为「还新鲜」，显示早一年的干支）。
 */
function isGanzhiStale(result: BaziPageResult): boolean {
  if (!result.currentYearGanzhi) return true;
  if (typeof result.ganzhiValidUntil !== 'number') return true;
  return Date.now() >= result.ganzhiValidUntil;
}

/**
 * 恢复/切换命盘时同步刷新「不依赖 lunar-javascript 的模块」，并剥离已过期的快照：
 * - 神煞为静态且纯查表，从四柱重算（本地历史记录从未持久化神煞，否则会空）
 * - 格局（mingGe）纯查表，旧历史/档案记录未存时补算，速读卡/人设分享卡才有数据（V2）
 * - 大运当前高亮按当前年刷新（缓存命盘可能是去年算的）
 * - 跨年过期的流年/流月、过了立春的流年干支一律置空
 * 取不到四柱（极旧无 pillars 记录）则原样返回。
 *
 * 为什么剥离而不是留着等补齐：流年/流月的干支要经 calculator 走 lunar-javascript，客户端算不了，
 * 只能靠 /api/bazi 补齐（见 ensureFullResult），而补齐可能失败、也可能因为用户没滚到那儿就没触发。
 * 留着旧快照＝在没有任何提示的情况下把去年的流年当今年展示；剥离后卡片自带
 * `result.liunian || result.liuyue?.length` / `currentLiunian &&` 渲染守卫会自动隐藏。
 * 宁可不显示，也不显示去年的数据。
 */
function withFreshModules(result: BaziPageResult): BaziPageResult {
  const chart = chartFromResult(result);
  if (!chart) return result;
  try {
    const year = beijingYear();
    const shensha = analyzeShensha(chart).map((s) => ({
      name: s.name,
      pillars: s.pillars,
      branch: s.branch,
      nature: shenshaNature(s.name),
    }));
    const dayunTimeline = result.dayunTimeline?.map((d) => ({
      ...d,
      isCurrent: year >= d.yearStart && year <= d.yearEnd,
    }));
    const mingGe = result.mingGe ?? analyzeMingGe(chart);
    const flowStale = result.flowYear !== year;
    return {
      ...result,
      shensha,
      mingGe,
      ...(dayunTimeline ? { dayunTimeline } : {}),
      ...(flowStale ? { liunian: undefined, liuyue: undefined } : {}),
      ...(isGanzhiStale(result) ? { currentYearGanzhi: undefined, ganzhiValidUntil: undefined } : {}),
    };
  } catch {
    return result;
  }
}

// ── 存量命盘的「重发排盘接口」补齐 ────────────────────────────────
// 存量数据（本地历史记录 / 上线前写入的档案缓存）里没有 lunar 派生字段：农历串、起运描述、
// 终身大运表、流年流月、当前流年干支、关键应期；缓存里的流年快照还会跨年过期。
// 这些一律靠重发 /api/bazi 补齐——该接口是纯确定性排盘、无 AI 成本、自带限流，
// 一次请求补齐全部字段并顺带拿到 cacheKey/baziResult，客户端因此无需第二套计算实现。
//
// 时序（详见组件内 armRefill / ensureFullResult）：
//   恢复命盘 → armRefill 登记（不发请求）
//     ├─ 缺首屏可见字段（农历/起运）→ 立即 ensureFullResult
//     └─ 只缺折叠线以下模块 → 等哨兵（挂在大运时间轴/排盘细节组正上方）进入视口再 ensureFullResult
//   ensureFullResult → 按输入指纹查 Promise 表（fetch 前占位，故并发同输入只打一次接口）
//     → 代次校验（换盘则丢弃）→ 四柱校验（对不上则整份丢弃并提示重排）→ mergeServerRefill
//   失败一律上可见提示条：网络/限流给「重试」，参数缺失给「重新填写出生信息」。

/**
 * 补齐请求的 HTTP 失败。用异常而不是返回值传递，是为了让「共享同一个 Promise 的多个调用方」
 * 都能拿到同一份失败结论（429 与其它错误的提示文案不同，故带上 status）。
 */
class RefillHttpError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`refill failed: ${status}`);
    this.name = 'RefillHttpError';
    this.status = status;
  }
}

/** 重发排盘所需的原始输入。历史记录与档案都存了这几项（见 BaziHistoryRecord / BaziProfileData） */
type RefillInput = {
  name?: string;
  gender?: string;
  birthDate: string;
  /** 时辰码字符串，'-1' 表示不知时辰 */
  birthHour?: string;
  birthPlace?: string | null;
  isLunar?: boolean;
  // —— 精确出生时刻（可选）——
  // 有就透传给 /api/bazi，服务端据此走精确分支，算出与存量记录同精度的起运/大运表；
  // 没有（新增这几项之前保存的记录）才回落到上面的粗时辰码。为什么必须透传见 BaziHistoryRecord 的注释：
  // 子时尤其明显，精确 00:30 与按子时起始 23:00 折算的大运边界能差 4 个月，而四柱一模一样。
  knowTime?: boolean;
  birthHourNum?: number;
  birthMinute?: number;
  lateZiShi?: boolean;
};

/** 入参是否带精确出生时刻（与 /api/bazi 的 hasPrecise 判据同构：knowTime + 小时数俱全才算） */
function hasPreciseTime(input: RefillInput): boolean {
  return input.knowTime === true && typeof input.birthHourNum === 'number';
}

/**
 * 时辰码归一：存量记录里理论上只会是 '-1'~'11'，但历史数据来源杂（早期版本、手工导入），
 * 解析不出合法值时按「不知时辰」处理，避免把 NaN 序列化成 null 送进接口被 zod 打回 400。
 */
function normalizeBirthHour(value?: string): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isInteger(n) && n >= -1 && n <= 11 ? n : -1;
}

/**
 * 会话内去重键：同一份输入只打一次排盘接口，来回切档案不重复请求。
 * 精确时刻必须进键——同一天同一时辰、精确到分不同的两条记录，服务端给出的起运/大运表可以不同
 * （子时最明显），共用一份缓存响应等于把 A 的大运贴到 B 上。
 */
function refillKey(input: RefillInput): string {
  const precision = hasPreciseTime(input)
    ? `P${input.birthHourNum}:${input.birthMinute ?? 0}${input.lateZiShi ? 'Z' : ''}`
    : 'C';
  return `${input.birthDate}|${normalizeBirthHour(input.birthHour)}|${input.gender || 'unknown'}|${input.isLunar ? 'L' : 'S'}|${precision}`;
}

/** 年/月/日三柱指纹 */
function ymdSignature(pillars?: BaziApiResult['pillars'] | null): string {
  if (!pillars?.year || !pillars?.month || !pillars?.day) return '';
  return `${pillars.year.gan}${pillars.year.zhi}|${pillars.month.gan}${pillars.month.zhi}|${pillars.day.gan}${pillars.day.zhi}`;
}

/**
 * 命盘身份（含时柱）。仅用于判断「是不是换了一副盘」，补齐字段/AI 文本落地不会改变它。
 */
function chartSignature(result: BaziPageResult): string {
  const ymd = ymdSignature(result.pillars);
  if (!ymd) return '';
  const hour = result.hasHour !== false && result.pillars?.hour
    ? `${result.pillars.hour.gan}${result.pillars.hour.zhi}`
    : '';
  return `${ymd}|${hour}`;
}

/**
 * 重算结果是否与存量命盘是同一副盘。
 *
 * 这一步是整条补齐链路的安全阀：历史记录没保存 isLunar / 晚子时 / 精确分钟，
 * 按公历重发会得到另一副命盘（农历生日尤其明显）。四柱对不上就整份丢弃，
 * 宁可少显示几个模块，也不能把「别人的大运/流年」贴到用户命盘上。
 * 年月日三柱必须逐字相同；双方都声明有时柱时时柱也要相同（一方没时柱属信息缺失，不算冲突）。
 */
function isSameChart(stored: BaziPageResult, fresh: BaziPageResult): boolean {
  const storedYmd = ymdSignature(stored.pillars);
  if (!storedYmd || storedYmd !== ymdSignature(fresh.pillars)) return false;
  if (stored.hasHour !== false && fresh.hasHour !== false) {
    const a = stored.pillars?.hour;
    const b = fresh.pillars?.hour;
    if (a && b && (a.gan !== b.gan || a.zhi !== b.zhi)) return false;
  }
  return true;
}

/**
 * 这份结果是否缺少「只有服务端算得出」的字段（全部由 lunar-javascript 派生）：
 * - flowYear ≠ 今年：流年/流月缺失（存量数据无此字段）或已跨年过期。仅对这两项有效——
 *   它们按公历年采样，而 currentYearGanzhi 按立春换年，两者口径不同不能共用一个判据
 * - isGanzhiStale：当前流年干支缺失或已过立春（用 ganzhiValidUntil 判，见该函数注释）
 * - dayunTimeline === undefined：终身大运表缺失。必须用 undefined 判而非 length——
 *   服务端在「性别未知」时会刻意返回空数组，那是权威的「无大运」，重算也补不出东西
 * - lunarDate / dayunStartDescription 为空：农历串、起运描述缺失
 */
function needsServerRefill(result: BaziPageResult, year: number): boolean {
  return (
    result.flowYear !== year ||
    isGanzhiStale(result) ||
    result.dayunTimeline === undefined ||
    !result.lunarDate ||
    !result.dayunStartDescription
  );
}

/**
 * VIP 却只拿到截断的关键应期表：这份缓存写于开通会员之前（/api/bazi 按请求时的会话分层，
 * 非 VIP 只下发最近 1 条）。重发一次接口带上当前会话即可拿到全表。
 *
 * 刻意与 needsServerRefill 分开：它只在「登记补齐 / 决定要不要发请求」时参与判断，
 * 不参与「拿回来的 fresh 是否仍然过期」的缓存逐出判断——服务端若确实判定非 VIP，
 * 重发多少次都还是截断表，混进逐出判据会让每次切档案都白打一次接口。
 */
function needsYingqiUnlock(result: BaziPageResult, isVip: boolean): boolean {
  const y = result.yingqi;
  return !!(isVip && y && y.items.length < y.total);
}

/** 首屏信息条（农历串 / 起运）当前就缺内容——这两项在页面顶部可见，不能等滚动到详情区再补 */
function needsAboveFoldRefill(result: BaziPageResult): boolean {
  // 判据必须覆盖「首屏就要用到」的每一项，否则那块会一直空着等哨兵——而哨兵在折叠线以下，
  // 用户不滚动就永远不触发。liunian 是速读卡（QuickReadCard，V2 的首屏模块）的输入，
  // 且 withFreshModules 会在 flowYear 过期时主动置空它；客户端已无 lunar-javascript 补不了，
  // 只能靠服务端补齐，所以缺它同样要立即发请求。
  return (
    !result.lunarDate ||
    !result.dayunStartDescription ||
    !result.dayunStartAt ||
    !result.liunian
  );
}

/**
 * 存量命盘里的「起运」与本次重算结果是否同源（出自同一个出生时刻）。
 *
 * 判据就是起运本身：它是出生时刻的直接函数（服务端的 getDayunStart 只依赖生辰与节气，与「现在」无关），
 * 两边都有值却不相等，只可能是入参精度不同——存量记录保存于「精确出生时刻未持久化」之前，
 * 这次只能按当日 0 点重算（实测同一天：精确 21:30 得 1997年9月、按 0 点折算得 1998年1月），
 * 也可能是更早版本的起运算法。
 *
 * 注意这**不决定合并取舍**（大运整组一律取 fresh，见 mergeServerRefill），只用来决定
 * 要不要给用户一条「这条记录的大运边界按时辰折算、可能有几个月误差」的信息提示。
 *
 * 一边缺值则无从比较，按对齐处理——缺的那边正要靠本次补齐填上，不存在「两套值打架」。
 */
function isDayunSourceAligned(prev: BaziPageResult, fresh: BaziPageResult): boolean {
  if (prev.dayunStartAt && fresh.dayunStartAt && prev.dayunStartAt !== fresh.dayunStartAt) return false;
  if (
    prev.dayunStartDescription &&
    fresh.dayunStartDescription &&
    prev.dayunStartDescription !== fresh.dayunStartDescription
  ) return false;
  return true;
}

/**
 * 把重算结果里的 lunar 派生字段与结构化模块并进存量命盘。
 *
 * 刻意用白名单而不是 `{ ...prev, ...fresh }`：/api/bazi 返回的是纯排盘结果，
 * 里面 aiAnalysis 恒为 ''、traits 恒为 []，整体展开会把历史记录里最值钱的 AI 长文直接清空。
 * 每项都做空值兜底，接口没给的字段不覆盖已有值。
 *
 * 「谁优先」按三类处理：
 * - 农历串 fresh 优先：/api/bazi 的 lunarDate 取自「折算后的公历日」，对农历用户 prev 可能是旧的错值
 *   （把农历串当公历解释算出来的），继续 prev 优先等于把错值锁死。fresh 是权威口径。
 * - 大运整组（起运 description/at + 终身大运表 + dayunExtra + solarBirthDate）**整体取自同一侧**：
 *   fresh 给得出起运就整组换成 fresh，给不出（八字直输等）才整组保持 prev。绝不混搭——
 *   任何一项跨侧都会让屏幕上的起运、大运时间轴、送进 /api/bazi/stream 的「当前/下一步大运」
 *   出自不同的盘。
 *   为什么是「取 fresh」而不是「保持 prev」：存量记录压根没持久化过 dayunTimeline，
 *   保持 prev 等于把大运时间轴、选中大运详情、四维简评整块隐藏掉，比补齐前还少。
 *   代价只是「按时辰折算、可能与记录当初的精确起运差几个月」，这一点由 isDayunSourceAligned
 *   判出后以信息提示告知，并给出「重新填写出生信息」入口。
 * - 流年流月 / 流年干支 / 神煞 / 格局 / 刑冲会合害 / 关键应期 fresh 优先：它们只由四柱与年份决定
 *   （四柱已由 isSameChart 校验逐字相同），与出生时刻精度无关，且存量值要么没有、要么已跨年过期。
 */
function mergeServerRefill(prev: BaziPageResult, fresh: BaziPageResult): BaziPageResult {
  // 大运整组的取舍：只看 fresh 拿不拿得出起运（date 模式恒有；八字直输/异常才没有）。
  // 一个布尔量决定五个字段，从结构上杜绝混搭。
  // solarBirthDate 归入本组而非单独取值：它就是这组大运的计算锚点，跨侧取会得到
  //「A 的锚点配 B 的大运表」——AI 解读的工具链拿它重算，又会排出第三副盘。
  const useFreshDayun = !!(fresh.dayunStartAt || fresh.dayunStartDescription);
  const dayunGroup = useFreshDayun
    ? {
        dayunStartDescription: fresh.dayunStartDescription,
        dayunStartAt: fresh.dayunStartAt,
        dayunTimeline: fresh.dayunTimeline,
        dayunExtra: fresh.dayunExtra,
        solarBirthDate: fresh.solarBirthDate,
      }
    : {
        dayunStartDescription: prev.dayunStartDescription,
        dayunStartAt: prev.dayunStartAt,
        dayunTimeline: prev.dayunTimeline,
        dayunExtra: prev.dayunExtra,
        solarBirthDate: prev.solarBirthDate,
      };
  return {
    ...prev,
    lunarDate: fresh.lunarDate || prev.lunarDate,
    // 干支与其有效期必须成对取，混搭会得到「新干支配旧有效期」（立刻又判过期）
    // 或「旧干支配新有效期」（过期值被当成新鲜的锁住一整年）。
    ...(fresh.currentYearGanzhi
      ? { currentYearGanzhi: fresh.currentYearGanzhi, ganzhiValidUntil: fresh.ganzhiValidUntil }
      : { currentYearGanzhi: prev.currentYearGanzhi, ganzhiValidUntil: prev.ganzhiValidUntil }),
    flowYear: fresh.flowYear ?? prev.flowYear,
    liunian: fresh.liunian ?? prev.liunian,
    liuyue: fresh.liuyue ?? prev.liuyue,
    ...dayunGroup,
    shensha: fresh.shensha ?? prev.shensha,
    mingGe: fresh.mingGe ?? prev.mingGe,
    // V2 模块：刑冲会合害为四柱静态量；关键应期含服务端 VIP 分层，一律以服务端为准
    interactions: fresh.interactions ?? prev.interactions,
    yingqi: fresh.yingqi ?? prev.yingqi,
    zodiac: prev.zodiac || fresh.zodiac,
    // cacheKey / baziResult：存量记录（历史记录）本就没有，补上后「开始AI解读 / 重新分析 / 议题解读」
    // 不必再各自兜底重算一次（那几处原本都要先打一遍 /api/bazi）。已有值一律不覆盖。
    // 唯一带 prev.baziResult 的是档案缓存，而它就是同一组入参打同一个 /api/bazi 得来的，
    // 与 fresh 逐字相同，不存在「prev 的 baziResult 配 fresh 的大运」这种跨侧问题。
    // 大运换过侧且与存量不同源时，缓存身份必须一起跟着换 —— 否则「作废旧解读」这件事会落空：
    // /api/bazi 在 keyMaterial 里加 solarDate，正是为了让农历用户那份「按错误大运生成的 AI 解读」
    // 失效（农历串当公历算出的大运，年份可差数年、方向甚至相反）。若这里仍保留 prev.cacheKey，
    // 用户点「重新分析」会命中旧键、把那份错解读原样取回来，等于白修。
    // 同时清掉 prev.aiAnalysis：它的正文就是按错误大运写的，留着是在展示错内容；
    // 清空后 showAiButton 会亮出「开始AI解读」，用户一键拿到与新大运一致的版本。
    ...(useFreshDayun && !isDayunSourceAligned(prev, fresh)
      ? { cacheKey: fresh.cacheKey ?? prev.cacheKey, baziResult: fresh.baziResult ?? prev.baziResult, aiAnalysis: '' }
      : { cacheKey: prev.cacheKey ?? fresh.cacheKey, baziResult: prev.baziResult ?? fresh.baziResult }),
  };
}

function firstSentence(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const sentences = trimmed
    .split(/[。！？\n]/)
    .map(chunk => chunk.trim().replace(/^[–—\-]+\s*/, '').trim())
    .filter(Boolean);
  if (!sentences.length) return trimmed;
  return `${sentences[0]}。`;
}

/**
 * 「命理计算锚点」：拿出生日期再算任何命理（大运/起运/周岁）都必须用公历日。
 *
 * 阳历输入（绝大多数用户）直接返回表单原值——一个字符都不变，不受本函数影响。
 * 农历输入才去取服务端算好的 solarBirthDate；存量结果（老历史记录/老档案缓存）没有这一项时
 * 只能退回农历原串（客户端刻意不打包 lunar-javascript，本地折算不了），
 * 与改动前一致，且这一支在服务端还有 isLunar 兜底（见 runAiStream 里送出的字段）。
 */
function solarAnchorOf(result: BaziPageResult | null | undefined, birthDate: string, isLunar: boolean): string {
  if (!isLunar) return birthDate;
  return result?.solarBirthDate || birthDate;
}

function getAge(birthDate: string): number {
  const [year, month, day] = birthDate.split('-').map(Number);
  if (!year || !month || !day) return 0;

  const now = new Date();
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() + 1 - month;
  const dayDiff = now.getDate() - day;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return Math.max(0, age);
}

function toGenderLabel(gender: string): string {
  if (gender === 'male') return '男';
  if (gender === 'female') return '女';
  return '未填写';
}

function toHourLabel(hourValue: string): string {
  return shichenOptions.find(option => option.value === hourValue)?.label || '未知时辰';
}

function buildBaziText(result: BaziPageResult, hasHour: boolean): string {
  return [
    `${result.pillars.year.gan}${result.pillars.year.zhi}`,
    `${result.pillars.month.gan}${result.pillars.month.zhi}`,
    `${result.pillars.day.gan}${result.pillars.day.zhi}`,
    hasHour ? `${result.pillars.hour.gan}${result.pillars.hour.zhi}` : '时柱未知',
  ].join(' ');
}

function getZodiacByBirthDate(birthDate: string): string {
  const year = Number(birthDate.split('-')[0]);
  if (!year) return '未提供';
  const zodiac = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  return zodiac[(year - 4 + 1200) % 12] || '未提供';
}

/**
 * 给终身大运表补 React key。大运本体已由 /api/bazi 随排盘返回（同一 getDayunTimeline 实现、
 * 同一批参数），客户端不再自己跑一遍——那会把 lunar-javascript 拖进首屏。
 */
function withDayunKeys(timeline: DayunTimelineItem[]): Array<DayunTimelineItem & { key: string }> {
  return timeline.map(item => ({
    ...item,
    key: `${item.gan}${item.zhi}_${item.ageStart}`,
  }));
}

/** 该大运在人生中的阶段定位（已过 / 当前 / 未来） */
function getDayunPhaseText(item: DayunTimelineItem | null, birthDate: string): string {
  if (!item) return '';
  const age = getAge(birthDate);
  return item.isCurrent
    ? '当前正在经历该阶段。'
    : age < item.ageStart
      ? '这是未来阶段，可提前布局。'
      : '这是已走过阶段，可用于复盘成长轨迹。';
}

/**
 * 从「大运流年」AI 章节里按「XX大运」标记精确抽取该大运的专属解读。
 * 命中头标记后采集后续行，遇到下一个 `「.+大运」` 头标记停止。
 */
function extractDayunAiText(item: DayunTimelineItem | null, aiSections: Record<AiSectionKey, string>): string {
  if (!item) return '';
  const dayunFullText = aiSections.dayun || '';
  if (!dayunFullText) return '';
  const ganZhi = `${item.gan}${item.zhi}`;
  const lines = dayunFullText.split('\n');
  let capturing = false;
  const captured: string[] = [];
  for (const line of lines) {
    if (line.includes(`「${ganZhi}大运」`)) {
      capturing = true;
      continue;
    }
    if (capturing) {
      if (/「.+大运」/.test(line)) break;
      if (line.trim()) captured.push(line);
    }
  }
  return captured.join('\n').trim();
}

const BAZI_TERMS_LIST = [
  '印星', '比肩', '劫财', '食神', '伤官', '正财', '偏财', '正官', '七杀',
  '正印', '偏印', '羊刃', '用神', '忌神', '日主', '大运', '流年', '格局',
];
const BAZI_TERMS_REGEX = new RegExp(`(${BAZI_TERMS_LIST.join('|')})`, 'g');
const SUBTITLE_REGEX = /([^：，。；、\s①②③④⑤⑥⑦⑧⑨⑩]{1,8})：/g;

function renderHighlightedLine(line: string): ReactNode {
  if (!line) return line;

  const subtitleMatches: Array<{ start: number; end: number; text: string }> = [];
  let sm: RegExpExecArray | null;
  const subtitleRegex = new RegExp(SUBTITLE_REGEX.source, 'g');
  while ((sm = subtitleRegex.exec(line)) !== null) {
    subtitleMatches.push({ start: sm.index, end: sm.index + sm[1].length, text: sm[1] });
  }

  const parts: ReactNode[] = [];
  let cursor = 0;
  let keyCounter = 0;

  const pushTermHighlighted = (segment: string, baseKey: string) => {
    if (!segment) return;
    const splitParts = segment.split(BAZI_TERMS_REGEX);
    splitParts.forEach((piece, idx) => {
      if (!piece) return;
      if (BAZI_TERMS_LIST.includes(piece)) {
        parts.push(
          <span key={`${baseKey}-t${idx}`} className="text-[#1C1A16] font-medium">{piece}</span>
        );
      } else {
        parts.push(<Fragment key={`${baseKey}-x${idx}`}>{piece}</Fragment>);
      }
    });
  };

  for (const sub of subtitleMatches) {
    if (sub.start > cursor) {
      pushTermHighlighted(line.slice(cursor, sub.start), `seg${keyCounter++}`);
    }
    parts.push(
      <span key={`sub${keyCounter++}`} className="font-semibold text-[#1C1A16]">{sub.text}</span>
    );
    cursor = sub.end;
  }
  if (cursor < line.length) {
    pushTermHighlighted(line.slice(cursor), `seg${keyCounter++}`);
  }

  return <>{parts}</>;
}

function renderSectionContent(content: string): ReactNode {
  let normalizedContent = content;

  // 0. 去掉 AI 输出的方括号及其内容（如 [\u6c34\u6728\u884c\u4e1a]\uff09
  normalizedContent = normalizedContent.replace(/\[[^\]]{1,20}\]/g, '');

  // 1. 数字+点+空格 (如 "1. 内容" "2. 内容") 前加换行
  normalizedContent = normalizedContent.replace(/(?<!\n)(\d+\.\s)/g, '\n\n$1');

  // 1.5 将 AI 输出的各种破折号 bullet（–—\\-）统一转为 "- "
  normalizedContent = normalizedContent.replace(/^[\s]*[\u2013\u2014\-]{1,2}\s+/gm, '- ');

  // 2. "- " 开头的 bullet 行前确保有换行
  normalizedContent = normalizedContent.replace(/(?<!\n)(- )/g, '\n$1');

  // 2.5 将孤立短行(仅含1-3个汉字且不是 bullet)与下一行合并，防止 AI 在词中间插入换行
  {
    const lines = normalizedContent.split('\n');
    const merged: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const isBullet = trimmed.startsWith('- ');
      const isShortOrphan = !isBullet && /^[\u4e00-\u9fa5a-zA-Z]{1,3}$/.test(trimmed);
      if (isShortOrphan && i + 1 < lines.length) {
        // 并到下一行开头
        lines[i + 1] = trimmed + lines[i + 1].trimStart();
      } else {
        merged.push(lines[i]);
      }
    }
    normalizedContent = merged.join('\n');
  }

  // 3. 清理多余空行
  normalizedContent = normalizedContent.replace(/\n{3,}/g, '\n\n').trim();

  const paragraphs = normalizedContent.split(/\n\n+/);

  return (
    <div className="text-sm leading-loose text-[#1C1A16]/75 space-y-3">
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        const isNumbered = /^[①②③④⑤⑥⑦⑧⑨⑩]/.test(trimmed);
        const lines = para.split('\n');

        // 段落内含 bullet 行时，每行独立渲染
        const hasBullet = lines.some(l => l.trimStart().startsWith('- '));

        if (hasBullet) {
          return (
            <div key={i} className="space-y-1.5">
              {lines.map((line, j) => {
                const trimmedLine = line.trimStart();
                if (trimmedLine.startsWith('- ')) {
                  const bulletContent = trimmedLine.slice(2);
                  return (
                    <div key={j} className="flex gap-2 pl-1">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1C1A16]/60" />
                      <span className="flex-1">{renderHighlightedLine(bulletContent)}</span>
                    </div>
                  );
                }
                if (!trimmedLine) return null;
                return (
                  <p key={j}>{renderHighlightedLine(line)}</p>
                );
              })}
            </div>
          );
        }

        return (
          <p key={i} className={isNumbered ? 'pl-5 -indent-5' : ''}>
            {lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderHighlightedLine(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

interface ProfileFormValues {
  label: string;
  name: string;
  gender: string;
  birthDate: string;
  knowTime: boolean;
  birthHour: string;
  birthPlace: string;
  isLunar: boolean;
}

function ProfileFormModal({
  initial,
  loading,
  error,
  onSubmit,
  onClose,
}: {
  initial: BaziProfileData | null;
  loading: boolean;
  error: string;
  onSubmit: (v: ProfileFormValues) => void;
  onClose: () => void;
}) {
  const knowInitial = !!initial && initial.birthHour !== '-1';
  const [values, setValues] = useState<ProfileFormValues>({
    label: initial?.label || '',
    name: initial?.name || '',
    gender: initial?.gender || '',
    birthDate: initial?.birthDate || '',
    knowTime: knowInitial,
    birthHour: knowInitial ? initial!.birthHour : '0',
    birthPlace: initial?.birthPlace || '',
    isLunar: !!initial?.isLunar,
  });

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-[#1C1A16]/10">
        <div className="sticky top-0 bg-white border-b border-[#1C1A16]/8 px-5 py-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#1C1A16]">
            {initial ? '编辑命盘档案' : '新增命盘档案'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#1C1A16]/50 hover:text-[#1C1A16] transition-colors"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 基本信息 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#1C1A16]/50 tracking-wide">基本信息</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#1C1A16]/70">姓名</label>
                <input
                  type="text"
                  value={values.name}
                  maxLength={10}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value, label: e.target.value }))}
                  placeholder="如：妈妈、周峰"
                  className="w-full min-h-[44px] rounded-lg border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#1C1A16]/70">性别</label>
                <Select
                  options={[
                    { value: '', label: '请选择性别', disabled: true },
                    { value: 'male', label: '男' },
                    { value: 'female', label: '女' },
                  ]}
                  value={values.gender}
                  onChange={(e) => setValues((v) => ({ ...v, gender: e.target.value }))}
                  className="min-h-[44px] rounded-lg border border-[#1C1A16]/15 bg-white px-3 text-sm text-[#1C1A16]"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#1C1A16]/8" />

          {/* 时间信息 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#1C1A16]/50 tracking-wide">时间信息</p>
            <DatePicker
              label={values.isLunar ? '出生日期（农历）' : '出生日期（阳历）'}
              value={values.birthDate}
              onChange={(value) => setValues((v) => ({ ...v, birthDate: value }))}
              className="space-y-1.5"
              triggerClassName="min-h-[44px] rounded-lg"
            />
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={values.isLunar}
                onChange={(e) => setValues((v) => ({ ...v, isLunar: e.target.checked }))}
                className="mt-1 w-4 h-4 accent-[#1C1A16]"
              />
              <div>
                <p className="text-sm font-medium text-[#1C1A16]">这是农历生日</p>
                <p className="text-xs text-[#1C1A16]/55 mt-0.5">只记得农历生日就勾选，系统会自动换算（闰月自动处理）。</p>
              </div>
            </label>
          </div>

          <hr className="border-[#1C1A16]/8" />

          {/* 时辰信息 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#1C1A16]/50 tracking-wide">时辰信息</p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={values.knowTime}
                onChange={(e) => setValues((v) => ({ ...v, knowTime: e.target.checked }))}
                className="mt-1 w-4 h-4 accent-[#1C1A16]"
              />
              <div>
                <p className="text-sm font-medium text-[#1C1A16]">我知道出生时间</p>
                <p className="text-xs text-[#1C1A16]/55 mt-0.5">不勾选时按无时辰排盘，时柱将缺失。</p>
              </div>
            </label>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#1C1A16]/70">出生时辰</label>
              <Select
                options={shichenOptions.filter((o) => o.value !== '')}
                value={values.birthHour}
                disabled={!values.knowTime}
                onChange={(e) => setValues((v) => ({ ...v, birthHour: e.target.value }))}
                className={`min-h-[44px] rounded-lg border border-[#1C1A16]/15 bg-white px-3 text-sm text-[#1C1A16] ${
                  !values.knowTime ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div className={!values.knowTime ? 'opacity-50 pointer-events-none' : ''}>
              <CitySearch
                label="出生地"
                placeholder="如 北京市、上海市"
                value={values.birthPlace}
                onInputChange={(value) => setValues((v) => ({ ...v, birthPlace: value }))}
                onSelect={(city) => setValues((v) => ({ ...v, birthPlace: city.name }))}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#1C1A16]/8 px-5 py-4">
          <Button
            type="button"
            loading={loading}
            onClick={() => onSubmit(values)}
            className="w-full min-h-[44px] text-sm font-medium rounded-xl bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors"
          >
            {loading ? '正在保存...' : '开始解读'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface StreamingReportProps {
  /** 父组件把「节流后的流式全文」经此 ref 注入的 setter 推进来（详见组件头注释） */
  flushRef: { current: ((text: string) => void) | null };
  /** 父级累积缓冲：挂载时同步一次，防 delta 早于挂载导致丢字 */
  bufRef: { current: string };
}

/**
 * 流式解读的「渲染下沉」组件：SSE delta 高频到达时只重渲染这一小块，
 * 而不是整棵 ~3000 行的 BaziPageContent 树（低端安卓上曾把主线程打满）。
 * 数据流：父级把全文累积在 ref、150ms 节流后调用 flushRef.current(text)，
 * 本组件用自己的 state 接住；7 处 parseSection 全文正则也随之只按 flush 频率重算。
 *
 * 本组件只在 aiStreaming 期间挂载，因此内部所有 effect 都不必再判 aiStreaming。
 */
function StreamingReport({ flushRef, bufRef }: StreamingReportProps) {
  // 初值置空、由挂载 effect 从 bufRef 同步（render 期间不许读 ref）
  const [text, setText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    flushRef.current = setText;
    setText(bufRef.current);
    return () => {
      flushRef.current = null;
    };
  }, [flushRef, bufRef]);

  // 页面级跟随到底部（解读在页面正常流内，非独立滚动容器）。
  // 按「滚动方向」判定用户意图：向上滚（只可能来自用户）→ 立即停跟随；
  // 滚回底部附近 → 恢复。距离阈值判定与高频更新存在竞态（刚上滚就被拽回），弃用。
  const followRef = useRef(true);
  const prevScrollYRef = useRef(0);
  useEffect(() => {
    prevScrollYRef.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < prevScrollYRef.current - 2) {
        followRef.current = false;
      } else if (!followRef.current) {
        const el = containerRef.current;
        if (el && el.getBoundingClientRect().bottom < window.innerHeight + 80) {
          followRef.current = true;
        }
      }
      prevScrollYRef.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!text || !followRef.current) return;
    // 跟随频率已被父级的 150ms flush 节流限住，这里无需再节流
    containerRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' });
  }, [text]);

  // parseSection 是全文正则扫描：memo 后只随 flush（150ms 一次）重算，不再每 delta × 7 次
  const streamSections = useMemo(
    () =>
      [
        { title: '一、日主强弱判断', content: parseSection(text, ['日主分析']) },
        { title: '二、性格特征分析', content: parseSection(text, ['性格特点', '性格特质']) },
        { title: '三、事业发展方向', content: parseSection(text, ['事业运势', '事业分析']) },
        { title: '四、财运分析', content: parseSection(text, ['财运分析', '财富分析']) },
        { title: '五、感情婚姻分析', content: parseSection(text, ['感情运势', '婚姻分析']) },
        { title: '六、健康提示', content: parseSection(text, ['健康提示', '健康分析']) },
        { title: '七、当前运势重点', content: parseSection(text, ['大运流年', '流年趋势', '当前运势重点', '当前运势']) },
      ].filter((s) => s.content.trim()),
    [text],
  );

  return (
    <div ref={containerRef} className="pr-1">
      {text ? (
        streamSections.length > 0 ? (
          <div>
            {streamSections.map((section, index) => (
              <div key={section.title}>
                {index > 0 && <hr className="border-[#1C1A16]/8 my-6" />}
                <h4 className="border-l-4 pl-3 text-base font-semibold mb-3 text-[#1C1A16]" style={{ borderColor: '#1D4ED8' }}>
                  {section.title}
                </h4>
                <div className="text-sm leading-loose text-[#1C1A16]/85">
                  {renderSectionContent(section.content)}
                </div>
              </div>
            ))}
            <div ref={streamEndRef} />
          </div>
        ) : (
          <div className="text-sm leading-loose text-[#1C1A16]/75 whitespace-pre-wrap">
            {text}
            <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-[#1C1A16] animate-pulse" />
            <div ref={streamEndRef} />
          </div>
        )
      ) : (
        <div className="py-6 flex justify-center">
          <RefreshCw className="w-6 h-6 text-[#1C1A16] animate-spin" />
        </div>
      )}
    </div>
  );
}

function BaziPageContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('record');
  const resultRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    birthHour: '-1',
    birthPlace: '',
    isLunar: false,
    knowTime: false,
    birthHourNum: 12,
    birthMinute: 0,
    lateZiShi: false,
  });
  const [loading, setLoading] = useState(false);
  /** 用户主动提交排盘的次数。只用于「同一副盘重排也要滚动到结果区」，见下方滚动 effect */
  const [submitSeq, setSubmitSeq] = useState(0);
  const [loadingLong, setLoadingLong] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authReason, setAuthReason] = useState<{ title: string; desc: string } | undefined>(undefined);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHepanPicker, setShowHepanPicker] = useState(false);
  const [fullReadExpanded, setFullReadExpanded] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [selectedDayunIndex, setSelectedDayunIndex] = useState(2);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BaziPageResult | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [aiStreaming, setAiStreaming] = useState(false);
  // 流式文本不进顶层 state：SSE delta 每秒 10-30 次，若直接 setState 会让整棵组件树
  // 以同频重渲染 30-60s。改为 ref 累积 + 150ms 节流 flush 到下沉的 StreamingReport。
  const aiStreamBufRef = useRef('');
  const aiStreamFlushRef = useRef<((text: string) => void) | null>(null);
  const aiStreamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 仅在首个非空 delta 时翻转一次（推算步骤标题从「推算中」切「已完成」用），代替原 aiStreamText 真值判断
  const [aiStreamStarted, setAiStreamStarted] = useState(false);

  const pushAiStreamDelta = useCallback((fullText: string) => {
    aiStreamBufRef.current = fullText;
    if (!aiStreamTimerRef.current) {
      // 150ms 一批：肉眼仍是连续打字，但渲染频率从「每 delta 一次」降到约 6.7 次/秒
      aiStreamTimerRef.current = setTimeout(() => {
        aiStreamTimerRef.current = null;
        aiStreamFlushRef.current?.(aiStreamBufRef.current);
      }, 150);
    }
  }, []);

  const resetAiStream = useCallback(() => {
    if (aiStreamTimerRef.current) {
      clearTimeout(aiStreamTimerRef.current);
      aiStreamTimerRef.current = null;
    }
    aiStreamBufRef.current = '';
    aiStreamFlushRef.current?.('');
    setAiStreamStarted(false);
  }, []);
  const [aiSteps, setAiSteps] = useState<string[]>([]); // 工具链推算步骤（首屏「推算中」动画）
  const [stepsExpanded, setStepsExpanded] = useState(false); // 推算步骤折叠态：默认折叠（含流式中），点击展开看推算链条
  const [showAiButton, setShowAiButton] = useState(false);
  const autoLoadAttemptedRef = useRef(false);

  // 多人档案
  const [profiles, setProfiles] = useState<BaziProfileData[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [pendingDeleteProfile, setPendingDeleteProfile] = useState<{ id: string; label: string } | null>(null);
  const [editingProfile, setEditingProfile] = useState<BaziProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  // —— 存量命盘的服务端补齐（见文件上方 needsServerRefill / mergeServerRefill 的说明）——
  /**
   * 补齐相关的可见提示。
   * - tone='warn'：有东西没显示出来（请求失败 / 四柱对不上整份丢弃），用户需要行动。
   * - tone='info'：内容都在、只是精度打了折（大运按时辰折算）。不是错误，别用告警配色吓人。
   * - retryable=false 表示重试也没用（参数缺失或精度不可恢复），只能重新排盘。
   */
  const [refillNotice, setRefillNotice] = useState<
    { text: string; retryable: boolean; tone: 'warn' | 'info' } | null
  >(null);
  const [refilling, setRefilling] = useState(false);
  /** 已登记但尚未发出的补齐任务（等哨兵进入视口再发），见 armRefill */
  const [refillArmed, setRefillArmed] = useState(false);
  /** 补齐请求代次：切换命盘/重新排盘后自增，旧响应的提示不再上屏 */
  const refillSeqRef = useRef(0);
  /**
   * 会话内的补齐请求表（键=原始输入指纹）。存的是「进行中的 Promise」而不是结算后的结果：
   * 结果值要等响应回来才写得进去，那期间并发的同 key 调用会各发一次请求。
   * 存 Promise 才能在 fetch 之前就完成占位，做到同一份输入全程只打一次接口。
   */
  const refillCacheRef = useRef(new Map<string, Promise<BaziPageResult>>());
  /** 最近一次补齐的入参，供「等视口触发」与失败后的「重试」按钮复用 */
  const refillPendingRef = useRef<{ stored: BaziPageResult; input: RefillInput } | null>(null);
  /**
   * 补齐触发哨兵：挂在「真正依赖补齐数据的块」正上方，进入视口才发请求。
   *
   * 为什么不挂在结果区顶部：恢复命盘后有个 100ms 的
   * `resultRef.scrollIntoView({ block: 'start' })` 把结果区顶到视口顶部，挂太靠上首帧就会落进
   * IO 的 200px 预取窗口——「等滚动再补」形同虚设，仍是挂载即发、只晚几百毫秒。
   * 现在下沉到两处真正的消费点：
   *  ① 大运时间轴之前（在 AI 长文「当前运势重点」小节内）
   *  ② 排盘细节组（十神/神煞/流年流月/关键应期）之前
   * 为什么是两个而不是一个：① 只在 AI 长文渲染出该小节时存在，而大运时间轴恰好嵌在同一小节里、
   * 与之共存亡；② 恒在。任一进入视口即触发，覆盖「有/无 AI 长文」两种形态。
   */
  const refillSentinelDayunRef = useRef<HTMLDivElement>(null);
  const refillSentinelDetailRef = useRef<HTMLDivElement>(null);
  /**
   * result 的最新镜像。ensureFullResult 是异步的：它闭包里的 stored 是登记那一刻的快照，
   * 用快照判「现在还缺不缺」永远只会重现登记时的结论——期间用户点了「重新分析」、
   * 完整结果早已落地，仍会白打一次接口。改判这份镜像才是真的复查。
   */
  const latestResultRef = useRef<BaziPageResult | null>(null);
  useEffect(() => {
    latestResultRef.current = result;
  }, [result]);
  /**
   * isMember 的镜像。补齐回调刻意保持 `[]`/稳定依赖（它被 effect 依赖，重建会让 IO 反复重挂），
   * 而「VIP 却拿到截断的应期表」这一条判据需要读最新会员态，故走 ref 而非依赖项。
   */
  const isMemberRef = useRef(false);
  useEffect(() => {
    isMemberRef.current = isMember;
  }, [isMember]);

  /** 放弃在途补齐的结果并清掉提示。新排盘/清空结果时调用，避免旧提示挂在新命盘上 */
  const dropPendingRefill = useCallback(() => {
    refillSeqRef.current += 1;
    refillPendingRef.current = null;
    setRefillNotice(null);
    setRefilling(false);
    setRefillArmed(false);
  }, []);

  /**
   * 恢复存量命盘后补齐缺失字段：重发一次 /api/bazi 取权威结果。
   * - 不缺字段（本次改动后写入的档案缓存）直接返回，不发请求
   * - 八字直输（无出生日期）服务端也算不出这些字段，不发请求
   * - 四柱对不上（存量记录丢了 isLunar / 晚子时等参数）整份丢弃并提示重新排盘
   * - 网络/限流失败给可见提示 + 重试入口，不静默吞
   *
   * 只由 armRefill（视口触发）与「重试」按钮调用，不在挂载时直接调。
   */
  const ensureFullResult = useCallback(async (stored: BaziPageResult, input: RefillInput) => {
    // 代次先自增：哪怕这次不需要补齐，也要让在途的上一份补齐作废，
    // 否则「切到一份字段齐全的档案」时，旧命盘的响应仍会把提示落到新命盘上。
    const seq = ++refillSeqRef.current;
    refillPendingRef.current = null;
    setRefillNotice(null);

    // 判「还缺不缺」用最新的 result，不用登记时冻结的 stored（见 latestResultRef 的注释）。
    // 但只在「最新的仍是同一副盘」时才认它：armRefill 是在 setResult 的同一批次里同步调用的，
    // 那一刻镜像还停在上一副盘（effect 尚未提交），直接拿来判会张冠李戴。
    const latest = latestResultRef.current;
    const current = latest && isSameChart(stored, latest) ? latest : stored;

    // 只判 current（最新镜像）即可：armRefill 在登记时已把镜像同步推进到刚恢复的那一份，
    // 所以「先正常排盘 → 再选中同一个人的旧档案」不会再被上一份齐全结果误判为「不需补齐」。
    // 反过来，若等待期间结果已被别的路径（如「开始AI解读」重打 /api/bazi）补齐，这里就能正确早退，
    // 不白花一次限流名额——这正是不能拿冻结的 stored 兜底的原因。
    const year = beijingYear();
    if (
      !input.birthDate ||
      (!needsServerRefill(current, year) && !needsYingqiUnlock(current, isMemberRef.current))
    ) {
      setRefilling(false); // 在途请求已作废，别把「重试中」按钮卡在禁用态
      return;
    }
    refillPendingRef.current = { stored, input };

    const key = refillKey(input);
    let pending = refillCacheRef.current.get(key);
    if (!pending) {
      // 占位先于 fetch 写入：并发的同 key 调用会直接复用这个 Promise，只打一次接口。
      // 这里刻意不 setState，纯 IO；上屏与否由下面的代次校验决定。
      const precise = hasPreciseTime(input);
      pending = (async () => {
        const res = await fetch('/api/bazi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: input.name || '缘主',
            gender: input.gender || 'unknown',
            birthDate: input.birthDate,
            birthHour: normalizeBirthHour(input.birthHour),
            birthPlace: input.birthPlace || undefined,
            isLunar: input.isLunar,
            // 精确出生时刻：记录里存了就原样透传，服务端据此走精确分支，算出的起运/大运表
            // 与这条记录当初显示的完全一致（不再有「粗时辰折算 vs 精确时分」的两套边界）。
            // 存量记录没有这几项 → 全部 undefined → JSON.stringify 整键省略 → 服务端
            // hasPrecise=false 自动回落到粗时辰码，行为与本次改动前完全一致。
            knowTime: precise ? true : undefined,
            birthHourNum: precise ? input.birthHourNum : undefined,
            birthMinute: precise ? (input.birthMinute ?? 0) : undefined,
            lateZiShi: precise ? input.lateZiShi === true : undefined,
          }),
        });
        if (!res.ok) {
          await res.json().catch(() => undefined); // 读掉错误体，别让连接悬着
          throw new RefillHttpError(res.status);
        }
        // 200 但 JSON 解析失败属于真异常：让它 reject，走「网络异常 + 重试」而不是
        // 被当成一份空结果去比四柱、误报成「记录参数缺失」。
        return (await res.json()) as BaziPageResult;
      })();
      refillCacheRef.current.set(key, pending);
      // 失败的请求不能留在表里，否则「重试」永远拿到同一个已拒绝的 Promise、再也发不出请求。
      // 成功的结果留着：它只取决于入参，来回切档案可直接复用。
      // 四柱不匹配也算成功结果照留——不匹配是这份输入的固有结论，重发也不会变。
      pending.catch(() => {
        if (refillCacheRef.current.get(key) === pending) refillCacheRef.current.delete(key);
      });
    }

    setRefilling(true);
    try {
      const fresh = await pending;
      // 会话跨过了元旦/立春，缓存里这份也过期了：逐出，让下一次补齐重新取（本次仍先用它，有总比没有强）。
      // 刻意不把 needsYingqiUnlock 混进来，理由见该函数注释。
      if (needsServerRefill(fresh, beijingYear())) {
        if (refillCacheRef.current.get(key) === pending) refillCacheRef.current.delete(key);
      }
      // 已切到别的命盘：丢弃过期响应（既不落数据也不上提示）
      if (seq !== refillSeqRef.current) return;

      if (!isSameChart(current, fresh)) {
        setRefillNotice({
          text: '这条记录没有保存完整的排盘参数（如农历生日、晚子时），终身大运与流年流月无法自动恢复。重新填写出生信息即可得到完整命盘。',
          retryable: false,
          tone: 'warn',
        });
        return;
      }
      // 四柱相同、起运却对不上：这条记录保存于「精确出生时刻未持久化」之前（或出自更早版本的起运算法）。
      // mergeServerRefill 会把大运整组换成本次重算的这一套（起运/大运表/dayunExtra 同侧），
      // 全屏口径统一、大运表照常显示，代价只是边界按时辰折算、可能有几个月误差。
      // 所以这是信息级提示而非告警：没有任何内容因此消失，用户想要更高精度重排一次即可。
      // stored 与 current 都比一遍：前者是屏幕上这条记录，后者是同一副盘的最新镜像。
      if (!isDayunSourceAligned(stored, fresh) || !isDayunSourceAligned(current, fresh)) {
        setRefillNotice({
          text: '本条记录未保存精确出生时刻，大运边界按时辰折算，可能有几个月误差；重新排盘可获得更高精度。',
          retryable: false,
          tone: 'info',
        });
      }
      // 落库前再比一次：即便代次校验放行，也只把结果合并到同一副盘上
      setResult(prev => (prev && isSameChart(prev, fresh) ? mergeServerRefill(prev, fresh) : prev));
    } catch (refillError) {
      if (seq !== refillSeqRef.current) return;
      setRefillNotice({
        text: refillError instanceof RefillHttpError
          ? (refillError.status === 429
              ? '排盘请求过于频繁，终身大运与流年流月暂未补全，请稍后重试。'
              : '终身大运与流年流月加载失败，请重试。')
          : '网络异常，终身大运与流年流月未能加载，请重试。',
        retryable: true,
        tone: 'warn',
      });
    } finally {
      if (seq === refillSeqRef.current) setRefilling(false);
    }
  }, []);

  /**
   * 登记一次补齐，但**不在此刻发请求**。
   *
   * 补齐打的是 /api/bazi，与用户主动排盘共用同一个限流桶（登录 30 次/60s、游客 20 次/3600s）。
   * 若在恢复命盘时立即发，等于「打开页面就先替用户花掉一次额度」，多副盘来回切还会叠加，
   * 极端情况下把用户自己的排盘打成 429。
   *
   * 改为分级触发：
   * - 首屏信息条上的农历串/起运缺失 → 立即发。这两项就在页面顶部，用户此刻正看着它们的「—」，
   *   等滚动再补等于让首屏一直缺内容。这种缺失只发生在「本次改动上线前写入的档案缓存」上
   *   （历史记录/游客档案都持久化了这两项），是个会随时间归零的存量集合。
   * - 只缺折叠线以下的模块（终身大运表/流年流月/流年干支/关键应期）→ 只登记，等哨兵进入视口再发。
   * 任一时刻最多只有一个已登记任务（换盘即覆盖），加上按输入指纹去重的 Promise 表，
   * 请求数不会随档案数量放大。
   */
  const armRefill = useCallback((stored: BaziPageResult, input: RefillInput) => {
    // 与 ensureFullResult 同理：先作废上一份，避免旧命盘的在途响应/提示落到新命盘上
    refillSeqRef.current += 1;
    refillPendingRef.current = null;
    setRefillNotice(null);
    setRefilling(false);

    // 登记的同时把镜像推进到「刚恢复出来的这一份」：armRefill 与 setResult 在同一批次里同步执行，
    // 镜像此刻还停在上一副盘上（effect 尚未提交）。同步推进后，ensureFullResult 就能只信 current，
    // 不必再拿冻结的 stored 兜底——那个快照永远停在「缺字段」，会让「等待期间已被别的路径补齐」的
    // 情形照发一次多余请求（游客桶只有 20 次/3600s）。
    latestResultRef.current = stored;

    if (
      !input.birthDate ||
      (!needsServerRefill(stored, beijingYear()) && !needsYingqiUnlock(stored, isMemberRef.current))
    ) {
      setRefillArmed(false);
      return;
    }
    if (needsAboveFoldRefill(stored)) {
      setRefillArmed(false);
      void ensureFullResult(stored, input);
      return;
    }
    refillPendingRef.current = { stored, input };
    setRefillArmed(true);
  }, [ensureFullResult]);

  // 已登记的补齐：等哨兵进入视口再发。哨兵就挂在依赖补齐数据的块正上方（见两个 sentinel ref 的注释），
  // 因此触发时这些块仍在视口下方，数据落地只会向下插入内容，不会把用户正在读的段落顶走。
  useEffect(() => {
    if (!refillArmed) return;
    const fire = () => {
      const pending = refillPendingRef.current;
      setRefillArmed(false);
      if (pending) void ensureFullResult(pending.stored, pending.input);
    };
    const targets = [refillSentinelDayunRef.current, refillSentinelDetailRef.current]
      .filter((node): node is HTMLDivElement => node !== null);
    // 一个哨兵都拿不到，或环境不支持 IO（老浏览器/jsdom）：直接补。
    // 宁可多发一次请求，也不能出现「永远补不上」。
    if (!targets.length || typeof IntersectionObserver === 'undefined') {
      fire();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      fire();
    }, { rootMargin: '200px 0px' });
    targets.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [refillArmed, ensureFullResult]);

  useEffect(() => {
    if (status !== 'authenticated') {
      setIsMember(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/quota');
        if (!res.ok) return;
        const data = (await res.json()) as { isMember?: boolean };
        if (cancelled) return;
        const member = Boolean(data?.isMember);
        setIsMember(member);

        if (
          member &&
          !recordId &&
          !result &&
          !autoLoadAttemptedRef.current
        ) {
          autoLoadAttemptedRef.current = true;
          const records = loadRecords();
          const latest = records[0];
          if (!latest) return;

          setFormData(prev => ({
            ...prev,
            name: latest.name || '',
            gender: latest.gender || '',
            birthDate: latest.birthDate,
            birthHour: latest.birthHour,
            birthPlace: latest.birthPlace || '',
            // 精确出生时刻按记录**覆盖**（而不是沿用 prev）：表单必须如实描述当前这副盘。
            // 沿用会把上一次排盘残留的时分带到这条记录上——AI 问答的代表时刻、
            // 解读完成后的自动存档都读这几项，带错就会把别人的出生时间写进这条记录。
            // 记录里没有（新增这几项之前保存的）就回落到「只知粗时辰」，与旧行为一致。
            isLunar: !!latest.isLunar,
            knowTime: !!latest.knowTime,
            birthHourNum: latest.birthHourNum ?? 12,
            birthMinute: latest.birthMinute ?? 0,
            lateZiShi: !!latest.lateZiShi,
          }));

          // 本地历史记录未存神煞/格局，按四柱重算补齐（纯查表，不依赖 lunar）
          const restored = withFreshModules({
            pillars: latest.pillars,
            hasHour: latest.birthHour !== '-1',
            wuxing: latest.wuxing,
            aiAnalysis: latest.aiAnalysis,
            fiveDimensions: latest.fiveDimensions,
            traits: latest.traits,
            birthPlace: latest.birthPlace,
            dayMasterElement: latest.dayMasterElement,
            lunarDate: latest.lunarDate,
            zodiac: latest.zodiac,
            trueSolarOffsetMinutes: latest.trueSolarOffsetMinutes,
            dayunStartDescription: latest.dayunStartDescription,
            dayunStartAt: latest.dayunStartAt,
            _source: 'history',
          });
          setResult(restored);

          setError('');
          setActionMessage('已为您显示上次的命盘解读');

          // 历史记录从未持久化终身大运表/流年流月，也没有 flowYear —— 登记一次补齐，
          // 等用户真正滚到详情区再发请求（armRefill 说明了为什么不在这里直接发）。
          // 精确出生时刻原样透传：有它服务端才算得出与本条记录同精度的起运/大运表。
          armRefill(restored, {
            name: latest.name,
            gender: latest.gender,
            birthDate: latest.birthDate,
            birthHour: latest.birthHour,
            birthPlace: latest.birthPlace,
            isLunar: latest.isLunar,
            knowTime: latest.knowTime,
            birthHourNum: latest.birthHourNum,
            birthMinute: latest.birthMinute,
            lateZiShi: latest.lateZiShi,
          });
        }
      } catch (quotaError) {
        console.error('Failed to load user quota:', quotaError);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    /**
     * 账号 birth-info / localStorage 都只存「生日 + 粗时辰 + 性别 + 出生地」这一组，
     * 没有农历标记，也没有精确时刻。所以覆盖 birthDate/birthHour 时必须把这 5 项精度字段
     * 一并复位，否则会拼出「日期来自 A、精度来自 B」的表单。
     *
     * 具体路径：会员挂载时另有一个 effect 先按历史记录恢复表单（带 isLunar/knowTime/birthHourNum），
     * 本 effect 随后用账号资料覆盖 birthDate/birthHour；不复位就会残留上一条记录的时分，
     * 而 chatBirthHourNum、/api/bazi/stream 的工具链、以及解读完成后的自动存档全都读这几项——
     * 用户点「开始解读」会排出第三副盘，落盘时还把错配的时刻写进新记录。
     * 两处 setFormData 都要复位（哪一条分支生效取决于账号有没有存生日）。
     */
    const RESET_PRECISION = {
      isLunar: false,
      knowTime: false,
      birthHourNum: 12,
      birthMinute: 0,
      lateZiShi: false,
    } as const;

    async function loadUserBirthInfo() {
      if (status === 'authenticated') {
        try {
          const res = await fetch('/api/user/birth-info');
          if (res.ok) {
            const { data } = await res.json();
            if (data?.birthDate) {
              const localSaved = loadBirthInfo();
              setFormData(prev => ({
                ...prev,
                name: data.nickname || '',
                birthDate: data.birthDate || '',
                birthHour: data.birthHour || '-1',
                gender: data.gender || '',
                birthPlace: localSaved?.birthPlace || prev.birthPlace || '',
                ...RESET_PRECISION,
              }));
              return;
            }
          }
        } catch (loadError) {
          console.error('Failed to load birth info:', loadError);
        }
      }

      const saved = loadBirthInfo();
      if (saved) {
        setFormData(prev => ({
          ...prev,
          birthDate: saved.birthDate || '',
          birthHour: saved.birthHour || '-1',
          gender: saved.gender || '',
          birthPlace: saved.birthPlace || '',
          ...RESET_PRECISION,
        }));
      }
    }

    if (status !== 'loading' && !recordId) {
      loadUserBirthInfo();
    }
  }, [status, recordId]);

  useEffect(() => {
    if (!recordId) return;

    const record = getRecordById(recordId);
    if (!record) {
      setError('未找到对应历史记录，请返回历史页重新选择。');
      return;
    }

    setFormData(prev => ({
      ...prev,
      name: record.name || '',
      gender: record.gender || '',
      birthDate: record.birthDate,
      birthHour: record.birthHour,
      birthPlace: record.birthPlace || '',
      // 同上：精确出生时刻按记录覆盖，不沿用上一副盘的残留值
      isLunar: !!record.isLunar,
      knowTime: !!record.knowTime,
      birthHourNum: record.birthHourNum ?? 12,
      birthMinute: record.birthMinute ?? 0,
      lateZiShi: !!record.lateZiShi,
    }));

    // 本地历史记录未存神煞/格局，按四柱重算补齐（纯查表，不依赖 lunar）
    const restored = withFreshModules({
      pillars: record.pillars,
      hasHour: record.birthHour !== '-1',
      wuxing: record.wuxing,
      aiAnalysis: record.aiAnalysis,
      fiveDimensions: record.fiveDimensions,
      traits: record.traits,
      birthPlace: record.birthPlace,
      dayMasterElement: record.dayMasterElement,
      lunarDate: record.lunarDate,
      zodiac: record.zodiac,
      trueSolarOffsetMinutes: record.trueSolarOffsetMinutes,
      dayunStartDescription: record.dayunStartDescription,
      dayunStartAt: record.dayunStartAt,
      _source: 'history',
    });
    setResult(restored);

    setError('');
    setActionMessage('已加载历史命盘记录');

    // 历史记录从未持久化终身大运表/流年流月，也没有 flowYear —— 登记一次补齐（见 armRefill）。
    // 精确出生时刻原样透传，缺失时服务端自动回落到粗时辰码。
    armRefill(restored, {
      name: record.name,
      gender: record.gender,
      birthDate: record.birthDate,
      birthHour: record.birthHour,
      birthPlace: record.birthPlace,
      isLunar: record.isLunar,
      knowTime: record.knowTime,
      birthHourNum: record.birthHourNum,
      birthMinute: record.birthMinute,
      lateZiShi: record.lateZiShi,
    });
  }, [recordId, armRefill]);

  // 加载已登录用户的档案；未登录用户走 localStorage 兼容
  const refreshProfiles = useCallback(async (autoSelectId?: string) => {
    if (status === 'authenticated') {
      try {
        const res = await fetch('/api/bazi/profiles');
        if (!res.ok) return;
        const { data } = (await res.json()) as { data?: BaziProfileData[] };
        if (!Array.isArray(data)) return;
        // merge: 保留前端已有的 baziResult，避免刷新后命盘数据丢失
        setProfiles((prev) => {
          return data.map((remote) => {
            const local = prev.find((p) => p.id === remote.id);
            return local ? { ...remote, baziResult: local.baziResult ?? remote.baziResult } : remote;
          });
        });
        if (autoSelectId) {
          const found = data.find((p) => p.id === autoSelectId);
          if (found) setSelectedProfileId(found.id);
        }
      } catch {
        // ignore
      }
    } else if (status === 'unauthenticated') {
      try {
        const records = loadRecords();
        const mapped: BaziProfileData[] = records.map((r) => ({
          id: r.id,
          label: r.name || '缘主',
          name: r.name || '缘主',
          gender: r.gender || '',
          birthDate: r.birthDate,
          birthHour: r.birthHour,
          birthPlace: r.birthPlace || '',
          // 按记录原样映射，不再抹平：写死 isLunar:false 会让农历记录的补齐请求按公历重算，
          // 排出另一副四柱 → 被判「参数缺失」丢弃，大运表与流年流月整块消失（且告警与事实相反）。
          isLunar: !!r.isLunar,
          knowTime: r.knowTime,
          birthHourNum: r.birthHourNum,
          birthMinute: r.birthMinute,
          lateZiShi: r.lateZiShi,
          isPrimary: false,
          baziResult: {
            pillars: r.pillars,
            wuxing: r.wuxing,
            aiAnalysis: r.aiAnalysis,
            fiveDimensions: r.fiveDimensions,
            traits: r.traits,
            birthPlace: r.birthPlace,
            dayMasterElement: r.dayMasterElement,
            lunarDate: r.lunarDate,
            zodiac: r.zodiac,
            trueSolarOffsetMinutes: r.trueSolarOffsetMinutes,
            dayunStartDescription: r.dayunStartDescription,
            dayunStartAt: r.dayunStartAt,
          },
        }));
        setProfiles(mapped);
        if (autoSelectId) {
          const found = mapped.find((p) => p.id === autoSelectId);
          if (found) setSelectedProfileId(found.id);
        }
      } catch {
        // ignore
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    if (status !== 'loading') {
      void refreshProfiles();
    }
    return () => {
      cancelled = true;
      void cancelled;
    };
  }, [status]);

  const aiSections = useMemo(() => extractAiSections(result?.aiAnalysis || ''), [result?.aiAnalysis]);

  const personalityText = useMemo(() => {
    return aiSections.personality || firstSentence(result?.aiAnalysis || '') || '';
  }, [aiSections.personality, result?.aiAnalysis]);

  const dayMasterInsight = useMemo(() => {
    if (!result) return null;

    const dayPillar = result.pillars.day;
    const dayElement = dayPillar.ganWuxing;
    const dayKey = WUXING_KEYS[dayElement];
    const dayValue = result.wuxing[dayKey];
    const total = Object.values(result.wuxing).reduce((sum, value) => sum + value, 0);
    const average = total / 5 || 1;
    const delta = dayValue - average;

    let level: '偏旺' | '偏弱' | '平衡' = '平衡';
    if (delta >= 1) level = '偏旺';
    if (delta <= -1) level = '偏弱';

    const sortedElements = wuxingDisplay
      .map(({ key, label }) => ({ label, value: result.wuxing[key] }))
      .sort((a, b) => a.value - b.value);

    const favorableGods = sortedElements.slice(0, 2).map(item => item.label);
    const avoidGods = sortedElements.slice(-2).map(item => item.label);
    const trait = DAYMASTER_TRAITS[dayPillar.gan] || '';
    const personalityBrief = firstSentence(personalityText);
    const corePersonality = personalityBrief ? (trait ? `${personalityBrief} ${trait}` : personalityBrief) : trait;

    return {
      title: `${dayPillar.gan}${dayPillar.ganWuxing}`,
      ganZhi: `${dayPillar.gan}${dayPillar.zhi}`,
      personality: `${corePersonality} 日主${level}。`,
      favorableGods,
      avoidGods,
    };
  }, [result, personalityText]);

  // 终身大运表直接取接口结果（服务端同实现同参数算好）。存量结果缺该字段时由 ensureFullResult 重发接口回填。
  const dayunTimeline = useMemo(
    () => withDayunKeys(result?.dayunTimeline ?? []),
    [result?.dayunTimeline]
  );

  useEffect(() => {
    if (!dayunTimeline.length) {
      setSelectedDayunIndex(0);
      return;
    }
    const currentIndex = dayunTimeline.findIndex(item => item.isCurrent);
    setSelectedDayunIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [dayunTimeline]);

  const selectedDayun = dayunTimeline[selectedDayunIndex] ?? null;

  // 命盘身份：四柱变了才算「换了一副盘」。存量命盘的服务端补齐、AI 长文落地都只改字段、不改四柱。
  const chartId = useMemo(() => (result ? chartSignature(result) : ''), [result]);

  // 换盘时滚到结果区。原来依赖 [result]，任何一次 setResult 都会重滚——
  // 补齐结果落地会让页面二次 smooth scroll，AI 流式结束写回 aiAnalysis 也会把用户从正文拽回顶部。
  //
  // 但只看 chartId 不够：用户对同一生辰再点一次「开始解读」时四柱逐字相同、chartId 不变，
  // effect 不重跑，用户点了按钮却没有任何滚动反馈。故再加一个「本次是用户主动提交」的信号，
  // 主动提交必滚，被动写回（补齐/AI 长文）仍不滚。
  useEffect(() => {
    if (!chartId || !resultRef.current) return;
    const timer = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, [chartId, submitSeq]);

  // 流式跟随滚动已随渲染一起下沉进 StreamingReport（判据仍是 V2 的「滚动方向」口径）
  const aiReadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (loading) {
      setLoadingLong(false);
      timer = setTimeout(() => setLoadingLong(true), 8000);
    } else {
      setLoadingLong(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // 选中大运的确定性结构化详情（十神 / 藏干 / 纳音 / 吉凶 / 四维），不依赖 AI
  const dayunDetailRich = useMemo<DayunDetail | null>(() => {
    if (!selectedDayun || !result) return null;
    return describeDayun(
      selectedDayun,
      result.pillars.day.gan,
      result.mingGe?.yongShen,
      result.mingGe?.jiShen,
    );
  }, [selectedDayun, result]);

  /**
   * 本副盘的公历出生日。农历用户的表单值是农历串，拿它算周岁会偏一个多月（跨年的农历腊月生日
   * 甚至差一整岁），进而把「已走过/当前/未来」的大运阶段判错。见 solarAnchorOf。
   */
  const solarBirthDate = solarAnchorOf(result, formData.birthDate, formData.isLunar);

  const dayunPhaseText = useMemo(
    () => getDayunPhaseText(selectedDayun, solarBirthDate),
    [selectedDayun, solarBirthDate]
  );

  const dayunAiText = useMemo(
    () => extractDayunAiText(selectedDayun, aiSections),
    [selectedDayun, aiSections]
  );

  // 「当前流年」干支改读接口字段（服务端按北京当日算，含立春换年）。口径也因此统一到北京日——
  // 旧客户端用 getYearGanzhi(浏览器本地日) 现算，跨时区/跨年边界会与服务端给出不同干支。
  // 存量结果缺该字段时由 ensureFullResult 重发接口回填；仍拿不到就不展示这一行，避免「当前流年：」空值。
  const currentLiunian = result?.currentYearGanzhi ?? '';

  // 是否存在真实时柱：优先用 API 的 hasHour；历史记录无该字段时按时辰是否为「不知道」推断
  const hasHourPillar = result?.hasHour ?? (formData.birthHour !== '-1' && formData.birthHour !== '');

  // 传给 AI 问答的代表小时：精确时间用 birthHourNum；否则把粗略时辰转为该时辰起始小时；
  // 真不知道时辰（-1/空）才不传。修复问答丢时柱导致身强弱判错的问题。
  const chatBirthHourNum: number | undefined = formData.knowTime
    ? formData.birthHourNum
    : (formData.birthHour !== '-1' && formData.birthHour !== ''
        ? SHICHEN_START_HOUR[formData.birthHour]
        : undefined);

  const basicInfoData = useMemo(() => {
    if (!result) return null;

    const hasBirthDate = !!formData.birthDate;
    // 农历串 / 起运（节气数日法，精确到月）原本在这里现算，会把 lunar-javascript 拖进首屏；
    // 现改读 /api/bazi 返回的同名字段（服务端用同一实现、同一代表时刻算出）。
    // 八字直输无出生日期：二者本就不可得，显示「未提供」/「—」。
    // 存量结果缺字段时先留空（卡片显示「—」），由 ensureFullResult 重发接口异步回填。
    const lunarDate = hasBirthDate ? (result.lunarDate || '') : '未提供';

    return {
      baziText: buildBaziText(result, hasHourPillar),
      name: formData.name || '缘主',
      gender: toGenderLabel(formData.gender),
      birthTime: hasBirthDate ? `${formData.birthDate} ${toHourLabel(formData.birthHour)}` : '未提供（八字直输）',
      lunarDate,
      zodiac: result.zodiac || (hasBirthDate ? getZodiacByBirthDate(formData.birthDate) : '未知'),
      dayunStartDescription: hasBirthDate ? (result.dayunStartDescription || '') : '',
      dayunStartAt: hasBirthDate ? (result.dayunStartAt || '') : '',
    };
  }, [formData.birthDate, formData.birthHour, formData.gender, formData.name, result, hasHourPillar]);

  // —— V2 派生数据（PRD-BAZI-V2）：全部本地确定性计算，零 AI 成本 ——

  /** 命盘速读三句话（P0-A）：盘面定性 / 当下处境 / 今年流年 */
  const quickReadLines = useMemo<string[]>(() => {
    if (!result?.mingGe) return [];
    try {
      return buildQuickRead({
        dayGan: result.pillars.day.gan as TianGan,
        mingGe: {
          geju: result.mingGe.geju as GejuName,
          rizhuStrength: result.mingGe.rizhuStrength,
          yongShen: result.mingGe.yongShen,
          jiShen: result.mingGe.jiShen,
        },
        dayunTimeline: result.dayunTimeline ?? [],
        liunian: result.liunian ?? null,
        currentYear: beijingYear(),
      });
    } catch {
      return [];
    }
  }, [result]);

  /** 命格人设（P0-B）：分享卡主文案 */
  const persona = useMemo(() => {
    if (!result?.mingGe) return undefined;
    try {
      return personaFor(result.mingGe.geju as GejuName, result.pillars.day.gan as TianGan);
    } catch {
      return undefined;
    }
  }, [result]);

  /** 刑冲会合害（P1-C）：API 已带则直用；历史/档案记录按四柱现算 */
  const interactionsData = useMemo(() => {
    if (result?.interactions) return result.interactions;
    const chart = result ? chartFromResult(result) : null;
    if (!chart) return [];
    try {
      return analyzeInteractions(chart);
    } catch {
      return [];
    }
  }, [result]);

  /**
   * 关键应期（P1-D）：一律以 /api/bazi 下发的为准（服务端已按会话做 VIP 分层）。
   *
   * V2 原本在这里用 scanYingqi 本地补算「缓存记录缺 yingqi」和「VIP 却拿到截断表」两种情况，
   * 但 yingqi → liunian → calculator → lunar-javascript，为它单独把 97KB(gz) 拉进首屏不划算。
   * 两种情况改由服务端补齐覆盖，能力不缺：
   * - 缺 yingqi 的存量命盘必然也缺 flowYear/dayunTimeline → armRefill 会重发 /api/bazi，
   *   mergeServerRefill 把 yingqi 一并并回来；
   * - 「VIP 却拿到截断表」由 needsYingqiUnlock 单独触发补齐，重发时带上当前会话即得全表。
   */
  const yingqiData = result?.yingqi ?? null;

  const summaryPoints = useMemo(() => {
    const sections = [
      aiSections.dayMaster,
      aiSections.personality,
      aiSections.career,
      aiSections.wealth,
      aiSections.relationship,
      aiSections.health,
    ].filter(Boolean);
    return sections
      .map(s => {
        // 跳过 bullet 行，找第一句正文内容
        const lines = s.split('\n');
        const firstMeaningfulLine = lines.find(l => l.trim() && !l.trim().startsWith('- ')) || lines[0];
        const cleaned = (firstMeaningfulLine || '').replace(/^[-\s]+/, '').trim();
        const first = cleaned.split(/[。！？]/)[0]?.trim();
        return first ? `${first}。` : '';
      })
      .filter(Boolean)
      .slice(0, 6);
  }, [aiSections]);

  const fullReadSections = useMemo(() => {
    const sections = [
      { title: '一、日主强弱判断', content: aiSections.dayMaster },
      { title: '二、性格特征分析', content: aiSections.personality },
      { title: '三、事业发展方向', content: aiSections.career },
      { title: '四、财运分析', content: aiSections.wealth },
      { title: '五、感情婚姻分析', content: aiSections.relationship },
      { title: '六、健康提示', content: aiSections.health },
      { title: '七、当前运势重点', content: aiSections.dayun || '' },
    ];
    return sections.filter(s => s.content.trim());
  }, [aiSections]);

  /**
   * 写进历史记录的「原始出生输入」。恢复这条记录时要靠它重发 /api/bazi 得到**同精度**的
   * 起运与终身大运表（为什么必须存见 BaziHistoryRecord 上的注释）。
   *
   * 只有用户确实填了精确出生时刻才写这一组；没填就整组不写（而不是写 knowTime:false + 默认 12:00），
   * 恢复时回落到 birthHour 粗时辰码，与本次改动前的行为完全一致。
   * formData 在恢复命盘时已按记录整组覆盖，故这里读到的一定是当前这副盘的输入。
   */
  const birthPrecisionToPersist = (): Pick<
    BaziHistoryRecord,
    'isLunar' | 'knowTime' | 'birthHourNum' | 'birthMinute' | 'lateZiShi'
  > => ({
    // 农历生日不存下来，重算会按公历解释同一串日期，排出的是另一副盘（isSameChart 会整份丢弃）
    isLunar: formData.isLunar || undefined,
    ...(formData.knowTime
      ? {
          knowTime: true,
          birthHourNum: formData.birthHourNum,
          birthMinute: formData.birthMinute,
          lateZiShi: formData.lateZiShi,
        }
      : {}),
  });

  const autoSaveRecord = (data: BaziPageResult, source: string) => {
    if (source === 'fallback') return;
    try {
      saveRecord({
        name: formData.name || '缘主',
        gender: formData.gender || 'unknown',
        birthDate: formData.birthDate,
        birthHour: formData.birthHour,
        birthPlace: formData.birthPlace,
        ...birthPrecisionToPersist(),
        dayMaster: data.pillars?.day?.gan || '',
        aiSummary: (data.aiAnalysis || '').split(/[。！？]/)[0] || '已保存命盘记录。',
        aiAnalysis: data.aiAnalysis || '',
        pillars: data.pillars,
        wuxing: data.wuxing,
        fiveDimensions: data.fiveDimensions,
        traits: data.traits,
        dayMasterElement: data.pillars?.day?.ganWuxing,
        lunarDate: data.lunarDate,
        zodiac: data.zodiac,
        trueSolarOffsetMinutes: data.trueSolarOffsetMinutes ?? null,
        dayunStartDescription: data.dayunStartDescription,
        dayunStartAt: data.dayunStartAt,
      });
    } catch (e) {
      console.error('auto save failed', e);
    }

    // 登录用户：把含 AI 解读的命盘写回当前档案（按档案ID持久化，切回即时见、无需重点解读）
    if (status === 'authenticated' && selectedProfileId && data.aiAnalysis) {
      void fetch(`/api/bazi/profiles/${selectedProfileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baziResult: { ...data, _source: undefined } }),
      }).catch(() => {});
    }
  };

  const runAiStream = async (forceRefresh: boolean, overrideResult?: BaziPageResult): Promise<boolean> => {
    const activeResult = overrideResult ?? result;
    if (!activeResult?.cacheKey || !activeResult?.baziResult) {
      setError('命盘数据缺失，请先点击「开始解读」');
      return false;
    }

    setShowAiButton(false);
    setAiStreaming(true);
    resetAiStream();
    setAiSteps([]);
    setStepsExpanded(false); // 流式中也默认折叠，仅标题显示进度，点击可展开

    try {
      const response = await fetch('/api/bazi/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cacheKey: activeResult.cacheKey,
          baziResult: activeResult.baziResult,
          name: formData.name || '缘主',
          gender: formData.gender || 'unknown',
          birthDate: formData.birthDate,
          // 工具链（大运/起运/流年）只能锚在公历日：农历用户的 birthDate 是农历串，
          // 直接拿去算等于给 AI 喂另一副盘的事实（屏幕上的大运表与解读正文互相矛盾）。
          // 这里给服务端两条线索，谁都可能缺，缺一条还有另一条：
          //   solarBirthDate —— 本次排盘算出的公历锚点（与同请求送出的 baziResult 同源，优先级最高）；
          //                     存量命盘（老历史记录/老档案缓存）没有这一项 → 保持 undefined 不发。
          //                     这里刻意不用 solarAnchorOf 兜底：它拿不到锚点时会退回农历原串，
          //                     而服务端把本字段当作权威公历日，一发就会屏蔽掉下面 isLunar 那条兜底路。
          //   isLunar        —— 表单标记，服务端据此自行折算（口径与 /api/bazi 相同）。
          // 阳历用户两条线索都指向同一个日期，行为逐字不变。
          solarBirthDate: activeResult.solarBirthDate,
          isLunar: formData.isLunar || undefined,
          birthHour: parseInt(formData.birthHour, 10),
          // 精确时分 + 是否知时：供服务端跑工具链（大运起运更准）
          knowTime: formData.knowTime,
          birthHourNum: formData.knowTime ? formData.birthHourNum : undefined,
          birthMinute: formData.knowTime ? formData.birthMinute : undefined,
          forceRefresh,
          // 存量农历命盘（没有 solarBirthDate 锚点）的 dayunExtra 是按「农历串当公历」算出来的错值 ——
          // 而服务端工具链此刻已改用 isLunar 折算后的正确日期，两者同送等于给 AI 喂两个互相矛盾的大运。
          // 这种情况下不发，让工具链成为唯一大运来源；有锚点或阳历用户则与此前逐字一致。
          dayunExtra:
            formData.isLunar && !activeResult.solarBirthDate ? undefined : activeResult.dayunExtra,
        }),
      });

      if (!response.ok) {
        let errCode = '';
        let errMsg = '';
        try {
          const data = await response.json();
          errCode = data?.error || '';
          errMsg = data?.message || '';
        } catch {}
        // 配额用尽（免费用户）→ 升级引导弹窗
        if (response.status === 403 && errCode === 'QUOTA_EXCEEDED') {
          setShowQuotaModal(true);
          setShowAiButton(true);
          return false;
        }
        // 全盘详批为 VIP 专属（V2）：会员态过期/未同步时兜底弹升级
        if (response.status === 403 && errCode === 'SUBSCRIPTION_REQUIRED') {
          track('bazi_full_paywall_show', { from: 'stream_403' });
          setShowUpgradeModal(true);
          setShowAiButton(true);
          return false;
        }
        // 游客每日次数用尽 → 登录引导；其它 429 为请求过频
        if (response.status === 429) {
          if (errCode === 'GUEST_LIMIT_REACHED') {
            setAuthReason({
              title: '今日免费 AI 解读已用完',
              desc: '游客每天可免费体验 1 次 AI 深度解读。登录后每天可继续免费解读，并保存命盘随时查看。',
            });
            setShowAuthModal(true);
          } else {
            setError(errMsg || '请求过于频繁，请稍后再试');
          }
          setShowAiButton(true);
          return false;
        }
        if (response.status === 401) {
          setAuthReason({
            title: '登录后即可使用',
            desc: '登录或注册账号即可免费体验 AI 解读；开通会员不限次并解锁更多权益。',
          });
          setShowAuthModal(true);
          setShowAiButton(true);
          return false;
        }
        throw new Error('AI 解读请求失败');
      }

      const source = response.headers.get('X-Source');

      // 缓存命中：直接拿完整文本
      if (source === 'cache') {
        const text = await response.text();
        setResult(prev => {
          const next = prev ? { ...prev, aiAnalysis: text, _source: 'cache' } : prev;
          if (next) autoSaveRecord(next, 'cache');
          return next;
        });
        return true;
      }

      // SSE 流式
      const reader = response.body?.getReader();
      if (!reader) throw new Error('流式响应不可读');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let finalSource: string | null = null;
      let finalAiAnalysis: string | null = null;
      let isPartial = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n\n')) >= 0) {
          const chunk = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 2);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (!payload) continue;
            try {
              const obj = JSON.parse(payload);
              if (obj.type === 'step' && typeof obj.label === 'string') {
                setAiSteps(prev => [...prev, obj.label]);
              }
              if (typeof obj.delta === 'string') {
                if (!fullText && obj.delta) setAiStreamStarted(true); // 首个非空 delta：只翻转一次
                fullText += obj.delta;
                pushAiStreamDelta(fullText);
              }
              if (obj.done) {
                finalSource = obj.source || 'deepseek';
                if (typeof obj.aiAnalysis === 'string') finalAiAnalysis = obj.aiAnalysis;
                // 服务端因上游中途断流而收尾：正文保留给用户看，但它是半截的，
                // 服务端已刻意不写 Redis —— 客户端必须同样不落盘，否则本地又把它固化一遍。
                if (obj.partial === true) isPartial = true;
              }
              if (obj.fallback) {
                finalSource = 'fallback';
                fullText = typeof obj.text === 'string' ? obj.text : fullText;
              }
            } catch {
              // skip
            }
          }
        }
      }

      const resolvedSource = finalSource || 'deepseek';
      const resolvedAnalysis = finalAiAnalysis || fullText;
      setResult(prev => {
        const next = prev ? { ...prev, aiAnalysis: resolvedAnalysis, _source: resolvedSource } : prev;
        // 半截解读不落盘（与服务端不写 Redis 成对），并留着「重新生成」入口让用户拿完整版
        if (next && !isPartial) autoSaveRecord(next, resolvedSource);
        return next;
      });
      if (isPartial) setShowAiButton(true);
      return true;
    } catch (streamErr) {
      setError(streamErr instanceof Error ? streamErr.message : 'AI 解读失败，请重试');
      setShowAiButton(true);
      return false;
    } finally {
      // 撤掉未触发的节流 flush：随 aiStreaming=false 流式区整体卸载，
      // 完整文本已通过 setResult(aiAnalysis) 走正常渲染，不会丢内容
      if (aiStreamTimerRef.current) {
        clearTimeout(aiStreamTimerRef.current);
        aiStreamTimerRef.current = null;
      }
      setAiStreaming(false);
      setStepsExpanded(false); // 推算完成默认折叠，保留可展开
    }
  };

  const handleStartAiReading = async () => {
    setError('');
    setActionMessage('');
    // 缓存档案/本地历史可能缺 cacheKey/baziResult（如游客记录、上次未完成）；
    // 先重算拿到 cacheKey 再流式，避免「命盘数据缺失」且让游客也能补全完整解读。
    if (!result?.cacheKey || !result?.baziResult) {
      try {
        const baseResp = await fetch('/api/bazi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name || '缘主',
            gender: formData.gender || 'unknown',
            birthDate: formData.birthDate,
            birthHour: parseInt(formData.birthHour, 10),
            birthPlace: formData.birthPlace,
            isLunar: formData.isLunar,
            knowTime: formData.knowTime,
            birthHourNum: formData.knowTime ? formData.birthHourNum : undefined,
            birthMinute: formData.knowTime ? formData.birthMinute : undefined,
            lateZiShi: formData.knowTime ? formData.lateZiShi : undefined,
          }),
        });
        const baseData = (await baseResp.json()) as BaziPageResult & { error?: string };
        if (!baseResp.ok) {
          if (baseResp.status === 401) { window.location.href = '/auth/login?redirect=/bazi'; return; }
          if (baseData.error === 'QUOTA_EXCEEDED') { setShowQuotaModal(true); return; }
          throw new Error(baseData.error || '服务器错误，请稍后重试');
        }
        setResult(baseData);
        void runAiStream(false, baseData as BaziPageResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'AI 解读失败，请重试');
      }
      return;
    }
    void runAiStream(false);
  };

  /** 组装 /api/bazi/stream 请求体（不含 topic）。与 runAiStream 保持同一字段口径 */
  const buildStreamBody = (r: BaziPageResult): Record<string, unknown> => ({
    cacheKey: r.cacheKey,
    baziResult: r.baziResult,
    name: formData.name || '缘主',
    gender: formData.gender || 'unknown',
    birthDate: formData.birthDate,
    // 与 runAiStream 同口径：公历锚点 + 农历标记，两条线索保证工具链不会排出第二副盘（见那里的长注释）
    solarBirthDate: r.solarBirthDate,
    isLunar: formData.isLunar || undefined,
    birthHour: parseInt(formData.birthHour, 10),
    knowTime: formData.knowTime,
    birthHourNum: formData.knowTime ? formData.birthHourNum : undefined,
    birthMinute: formData.knowTime ? formData.birthMinute : undefined,
    dayunExtra: formData.isLunar && !r.solarBirthDate ? undefined : r.dayunExtra,
  });

  /** 议题式 AI（P0-A）：历史/档案记录缺 cacheKey 时先静默重算排盘补齐 */
  const ensureTopicPayload = async (): Promise<Record<string, unknown> | null> => {
    if (result?.cacheKey && result?.baziResult) return buildStreamBody(result);
    try {
      const baseResp = await fetch('/api/bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || '缘主',
          gender: formData.gender || 'unknown',
          birthDate: formData.birthDate,
          birthHour: parseInt(formData.birthHour, 10),
          birthPlace: formData.birthPlace,
          isLunar: formData.isLunar,
          knowTime: formData.knowTime,
          birthHourNum: formData.knowTime ? formData.birthHourNum : undefined,
          birthMinute: formData.knowTime ? formData.birthMinute : undefined,
          lateZiShi: formData.knowTime ? formData.lateZiShi : undefined,
        }),
      });
      const baseData = (await baseResp.json()) as BaziPageResult & { error?: string };
      if (!baseResp.ok) return null;
      // 合并而非覆盖：保留历史记录里已有的完整 AI 长文
      setResult(prev =>
        prev
          ? { ...baseData, aiAnalysis: prev.aiAnalysis || baseData.aiAnalysis, _source: prev._source }
          : baseData,
      );
      return buildStreamBody(baseData);
    } catch {
      return null;
    }
  };

  /** 命格人设分享（P0-B）：接通 ShareCard 弹层 */
  const handleShare = () => {
    track('bazi_share_open', { persona: Boolean(persona) });
    setShowShareModal(true);
  };

  /** 档案一键合盘（P1-B）：双方出生信息经 sessionStorage 传给合婚页 */
  const handleHepanPick = (other: BaziProfileData) => {
    const self = profiles.find((p) => p.id === selectedProfileId);
    if (!self) return;
    try {
      const pack = (p: BaziProfileData) => JSON.stringify({
        name: p.name,
        gender: p.gender,
        birthDate: p.birthDate,
        birthHour: p.birthHour,
        birthPlace: p.birthPlace || '',
        isLunar: Boolean(p.isLunar),
      });
      sessionStorage.setItem('selfBaziData', pack(self));
      sessionStorage.setItem('otherBaziData', pack(other));
    } catch {}
    track('bazi_profile_hepan_click');
    window.location.href = '/bazi/marriage';
  };

  const applyProfileToForm = (profile: BaziProfileData) => {
    setFormData((prev) => ({
      ...prev,
      name: profile.name || '',
      gender: profile.gender || '',
      birthDate: profile.birthDate || '',
      birthHour: profile.birthHour || '-1',
      birthPlace: profile.birthPlace || '',
      isLunar: Boolean(profile.isLunar),
      // 精度字段与 birthDate 同批原子写入：游客档案（本地记录映射）可能带精确时刻，
      // 沿用 prev 会让「日期来自本档案、时刻来自上一副盘」，进而污染 AI 问答与落盘记录。
      knowTime: Boolean(profile.knowTime),
      birthHourNum: profile.knowTime && typeof profile.birthHourNum === 'number' ? profile.birthHourNum : 12,
      birthMinute: profile.knowTime && typeof profile.birthMinute === 'number' ? profile.birthMinute : 0,
      lateZiShi: Boolean(profile.knowTime && profile.lateZiShi),
    }));
    if (profile.baziResult) {
      // 静态命盘走缓存秒出；神煞/格局/大运高亮先按当前年本地刷新，避免缺模块
      const restored = withFreshModules({ ...profile.baziResult, _source: 'history' });
      setResult(restored);
      setError('');
      // 缓存的 AI 解读不完整（如上次中断/游客早退）时，放出「开始AI解读」按钮以便重新生成
      setShowAiButton(!isAiAnalysisComplete(profile.baziResult.aiAnalysis));
      // 上线前写入的档案缓存缺 lunar 派生字段；跨年后流年/流月快照也过期 —— 登记一次补齐（见 armRefill）。
      // 档案存了 isLunar，重算参数比历史记录完整，四柱几乎必然对得上。
      armRefill(restored, {
        name: profile.name,
        gender: profile.gender,
        birthDate: profile.birthDate,
        birthHour: profile.birthHour,
        birthPlace: profile.birthPlace,
        isLunar: profile.isLunar,
        // 游客档案由本地记录映射而来，可能带精确时刻：透传后重算才与记录同源（登录档案无这几项，回落粗时辰）
        knowTime: profile.knowTime,
        birthHourNum: profile.birthHourNum,
        birthMinute: profile.birthMinute,
        lateZiShi: profile.lateZiShi,
      });
    } else {
      setResult(null);
      setShowAiButton(false);
      dropPendingRefill();
    }
    setActionMessage('');
  };

  const handleSelectProfile = (profileId: string) => {
    track('bazi_profile_switch');
    setSelectedProfileId(profileId);
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) applyProfileToForm(profile);
  };

  // 档案加载后自动选中默认档案（主档案优先，否则第一个）并回填表单+读取缓存命盘。
  // 修复：下拉框「看起来已选中」但 selectedProfileId 为空、表单空白、命盘未读。
  useEffect(() => {
    if (recordId || selectedProfileId || result) return;
    if (profiles.length === 0) return;
    const def = profiles.find((p) => p.isPrimary) ?? profiles[0];
    if (def) {
      setSelectedProfileId(def.id);
      applyProfileToForm(def);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles]);

  const computeBaziForProfile = async (profile: BaziProfileData): Promise<BaziPageResult | null> => {
    const response = await fetch('/api/bazi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profile.name || '缘主',
        gender: profile.gender || 'unknown',
        birthDate: profile.birthDate,
        birthHour: parseInt(profile.birthHour, 10),
        birthPlace: profile.birthPlace || undefined,
        isLunar: profile.isLunar,
      }),
    });

    const data = (await response.json()) as BaziPageResult & { error?: string };
    if (!response.ok) {
      if (data.error === 'QUOTA_EXCEEDED') {
        setShowQuotaModal(true);
        return null;
      }
      throw new Error(data.error || '服务器错误，请稍后重试');
    }
    return data;
  };

  const handleOpenAddProfile = () => {
    setProfileError('');
    setEditingProfile(null);
    setShowAddProfileModal(true);
  };

  const handleOpenEditProfile = () => {
    setProfileError('');
    const target = profiles.find((p) => p.id === selectedProfileId);
    if (target) {
      setEditingProfile(target);
      setShowAddProfileModal(true);
      return;
    }
    // 无已选档案（如游客刚解读、未存档案）：用当前表单/命盘构造临时档案供编辑
    if (result) {
      setEditingProfile({
        id: selectedProfileId || `local_${Date.now()}`,
        label: formData.name || '我的命盘',
        name: formData.name || '',
        gender: formData.gender || '',
        birthDate: formData.birthDate || '',
        birthHour: formData.birthHour || '-1',
        birthPlace: formData.birthPlace || '',
        isLunar: Boolean(formData.isLunar),
        isPrimary: false,
      });
      setShowAddProfileModal(true);
    }
  };

  const handleDeleteProfile = () => {
    const target = profiles.find((p) => p.id === selectedProfileId);
    if (!target) return;
    if (target.isPrimary) {
      setActionMessage('主档案不可删除');
      return;
    }
    setPendingDeleteProfile({ id: target.id, label: target.label });
  };

  const confirmDeleteProfile = async () => {
    const target = pendingDeleteProfile;
    if (!target) return;
    try {
      if (status === 'authenticated') {
        const res = await fetch(`/api/bazi/profiles/${target.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({ error: '' }));
          throw new Error(msg || '删除失败');
        }
      } else {
        deleteRecord(target.id);
      }
      const next = profiles.filter((p) => p.id !== target.id);
      setProfiles(next);
      const first = next[0];
      if (first) {
        setSelectedProfileId(first.id);
        applyProfileToForm(first);
      } else {
        setSelectedProfileId('');
        setResult(null);
        dropPendingRefill();
      }
      setActionMessage('档案已删除');
    } catch (e) {
      setActionMessage(e instanceof Error ? e.message : '删除失败，请重试');
    }
  };

  const handleProfileFormSubmit = async (input: {
    label: string;
    name: string;
    gender: string;
    birthDate: string;
    knowTime: boolean;
    birthHour: string;
    birthPlace: string;
    isLunar: boolean;
  }) => {
    setProfileError('');
    if (!input.label.trim()) { setProfileError('请填写显示名称'); return; }
    if (!input.name.trim()) { setProfileError('请填写姓名'); return; }
    if (input.gender !== 'male' && input.gender !== 'female') { setProfileError('请选择性别'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) { setProfileError('请选择出生日期'); return; }

    const effectiveHour = input.knowTime ? input.birthHour : '-1';
    const effectivePlace = input.knowTime ? input.birthPlace : '';

    setProfileLoading(true);
    try {
      const isAuth = status === 'authenticated';
      const isEditing = Boolean(editingProfile);

      // 上限校验（仅新建）；服务端为最终裁决
      if (!isEditing) {
        const authCap = isMember ? MAX_VIP_PROFILES : MAX_LOGGED_IN_PROFILES;
        if (isAuth && profiles.length >= authCap) {
          setProfileError(
            isMember
              ? `最多可保存${MAX_VIP_PROFILES}个命盘`
              : `免费版最多保存${MAX_LOGGED_IN_PROFILES}个命盘，升级 VIP 可存 ${MAX_VIP_PROFILES} 个`,
          );
          setProfileLoading(false);
          return;
        }
        if (!isAuth && profiles.length >= MAX_GUEST_PROFILES) {
          setProfileError(`未登录最多保存${MAX_GUEST_PROFILES}个命盘，请登录后使用`);
          setProfileLoading(false);
          return;
        }
      }

      let profileId = editingProfile?.id || '';
      let savedProfile: BaziProfileData | null = null;

      if (isAuth) {
        if (isEditing) {
          const res = await fetch(`/api/bazi/profiles/${profileId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: input.label,
              name: input.name,
              gender: input.gender,
              birthDate: input.birthDate,
              birthHour: effectiveHour,
              birthPlace: effectivePlace,
              isLunar: input.isLunar,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error || '保存失败');
          savedProfile = json.data as BaziProfileData;
        } else {
          const res = await fetch('/api/bazi/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: input.label,
              name: input.name,
              gender: input.gender,
              birthDate: input.birthDate,
              birthHour: effectiveHour,
              birthPlace: effectivePlace,
              isLunar: input.isLunar,
              isPrimary: profiles.length === 0,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error || '保存失败');
          savedProfile = json.data as BaziProfileData;
          profileId = savedProfile.id;
        }
      } else {
        // 游客：localStorage（暂存基本字段，baziResult 计算后补全）
        profileId = editingProfile?.id || `local_${Date.now()}`;
        savedProfile = {
          id: profileId,
          label: input.label,
          name: input.name,
          gender: input.gender,
          birthDate: input.birthDate,
          birthHour: effectiveHour,
          birthPlace: effectivePlace,
          isLunar: input.isLunar,
          isPrimary: false,
        };
      }

      // 调用计算接口
      const computed = await computeBaziForProfile({
        ...savedProfile,
        birthPlace: effectivePlace,
      });
      if (!computed) {
        // QUOTA_EXCEEDED 已处理
        setProfileLoading(false);
        return;
      }

      // 已登录：把 baziResult 缓存到档案
      if (isAuth && profileId) {
        try {
          await fetch(`/api/bazi/profiles/${profileId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ baziResult: computed }),
          });
        } catch {
          // 缓存失败不阻塞主流程
        }
      } else if (!isAuth) {
        // 游客：复用 saveRecord 写入 localStorage（兼容 BaziHistoryRecord）
        try {
          const persisted = saveRecord({
            id: profileId,
            name: input.name,
            gender: input.gender,
            birthDate: input.birthDate,
            birthHour: effectiveHour,
            birthPlace: effectivePlace,
            // 档案是按农历填的话，birthDate 存的就是农历年月日：不记下来，恢复时按公历重算会得到另一副盘。
            // 档案表单没有「精确到分」的入口（computeBaziForProfile 也只发粗时辰码），故这里没有 knowTime 一组。
            isLunar: input.isLunar || undefined,
            dayMaster: computed.pillars?.day?.gan || '',
            aiSummary: (computed.aiAnalysis || '').split(/[。！？]/)[0] || '已保存命盘记录。',
            aiAnalysis: computed.aiAnalysis || '',
            pillars: computed.pillars,
            wuxing: computed.wuxing,
            fiveDimensions: computed.fiveDimensions,
            traits: computed.traits,
            dayMasterElement: computed.pillars?.day?.ganWuxing,
            lunarDate: computed.lunarDate,
            zodiac: computed.zodiac,
            trueSolarOffsetMinutes: computed.trueSolarOffsetMinutes ?? null,
            dayunStartDescription: computed.dayunStartDescription,
            dayunStartAt: computed.dayunStartAt,
          });
          if (persisted) profileId = persisted.id;
        } catch {
          // ignore
        }
      }

      const finalProfile: BaziProfileData = {
        ...(savedProfile as BaziProfileData),
        id: profileId,
        baziResult: computed,
      };

      setProfiles((prev) => {
        const without = prev.filter((p) => p.id !== finalProfile.id);
        return isEditing ? prev.map((p) => (p.id === finalProfile.id ? finalProfile : p)) : [...without, finalProfile];
      });
      setSelectedProfileId(finalProfile.id);
      applyProfileToForm(finalProfile);
      // 与正常「开始解读」一致：呈现为新鲜解读并放出「开始AI解读」按钮，
      // 使后续 AI 解读走统一的游客/登录/配额守门（此前漏置导致按钮不出、游客流程被跳过）
      setResult(computed);
      setShowAiButton(true);
      setShowAddProfileModal(false);
      setEditingProfile(null);
      setActionMessage(isEditing ? '档案已更新' : '档案已新增');
      // 从服务端刷新档案列表，确保下拉显示最新数据
      void refreshProfiles(finalProfile.id);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : '操作失败，请重试');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setActionMessage('');
    setShowAiButton(false);
    setAiStreaming(false);
    resetAiStream();
    // 新排盘的结果自带全部字段，在途的存量补齐及其提示一律作废
    dropPendingRefill();

    if (!formData.gender) {
      setError('请选择性别');
      return;
    }

    if (!formData.birthDate) {
      setError('请选择出生日期');
      return;
    }
    if (formData.knowTime) {
      // 知道时间, 走精确分支, 不再要求 birthHour
    } else if (!formData.birthHour) {
      setError('请选择出生时辰');
      return;
    }

    setLoading(true);
    track('tool_submit', { tool: 'bazi' });
    saveBirthInfo({
      birthDate: formData.birthDate,
      birthHour: formData.birthHour,
      gender: formData.gender,
      birthPlace: formData.birthPlace,
    });

    if (status === 'authenticated') {
      try {
        await fetch('/api/user/birth-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            birthDate: formData.birthDate,
            birthHour: formData.birthHour,
            gender: formData.gender,
          }),
        });
      } catch (saveError) {
        console.error('Failed to save birth info:', saveError);
      }
    }

    try {
      const response = await fetch('/api/bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || '缘主',
          gender: formData.gender || 'unknown',
          birthDate: formData.birthDate,
          birthHour: parseInt(formData.birthHour, 10),
          birthPlace: formData.birthPlace,
          isLunar: formData.isLunar,
          knowTime: formData.knowTime,
          birthHourNum: formData.knowTime ? formData.birthHourNum : undefined,
          birthMinute: formData.knowTime ? formData.birthMinute : undefined,
          lateZiShi: formData.knowTime ? formData.lateZiShi : undefined,
        }),
      });

      const data = (await response.json()) as BaziPageResult & { error?: string };
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/auth/login?redirect=/bazi';
          return;
        }
        if (data.error === 'QUOTA_EXCEEDED') {
          setShowQuotaModal(true);
          return;
        }
        throw new Error(data.error || '服务器错误，请稍后重试');
      }

      setResult(data);
      // 主动提交信号：同一副盘重排时 chartId 不变，靠它让滚动 effect 重跑
      setSubmitSeq(n => n + 1);
      setShowAiButton(true);
      track('tool_result_view', { tool: 'bazi' });
      track('bazi_paipan_complete'); // V2 漏斗起点（P0-C）
      setFullReadExpanded(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentRecord = () => {
    if (!result || !dayMasterInsight || !basicInfoData) return;

    // 农历串/起运可能还没补齐（存量命盘的补齐在途、失败、或用户还没滚到触发点）。
    // basicInfoData 里它们以 '' 兜底，直接写进历史记录会把空串固化下来——下次读这条记录时
    // needsServerRefill 仍判为缺失，但记录本身已被「写过一次」的假象污染。
    // 空值一律不写：BaziHistoryRecord 的这几项本就是可选字段，缺失比空串诚实。
    const nonEmpty = (value: string) => (value.trim() ? value : undefined);
    const toSave: Omit<BaziHistoryRecord, 'id' | 'createdAt'> = {
      name: formData.name || '缘主',
      gender: formData.gender || 'unknown',
      birthDate: formData.birthDate,
      birthHour: formData.birthHour,
      birthPlace: formData.birthPlace,
      // 原始出生输入（精确时刻/农历），恢复这条记录时靠它重算出同精度的大运，见 birthPrecisionToPersist
      ...birthPrecisionToPersist(),
      dayMaster: dayMasterInsight.title,
      aiSummary: firstSentence(personalityText) || '已保存命盘记录。',
      aiAnalysis: result.aiAnalysis,
      pillars: result.pillars,
      wuxing: result.wuxing,
      fiveDimensions: result.fiveDimensions,
      traits: result.traits,
      dayMasterElement: result.pillars.day.ganWuxing,
      lunarDate: nonEmpty(basicInfoData.lunarDate),
      zodiac: basicInfoData.zodiac,
      trueSolarOffsetMinutes: result.trueSolarOffsetMinutes ?? null,
      dayunStartDescription: nonEmpty(basicInfoData.dayunStartDescription),
      dayunStartAt: nonEmpty(basicInfoData.dayunStartAt),
    };

    const saved = saveRecord(toSave);
    if (!saved) {
      setActionMessage('保存失败，请重试');
      return;
    }
    // 有字段没落地就如实说明，别让用户以为存下来的是完整命盘
    // （八字直输无出生日期时这两项本就不可得，不算「没补齐」）
    const incomplete = !!formData.birthDate && (!toSave.lunarDate || !toSave.dayunStartDescription);
    setActionMessage(
      incomplete
        ? '命盘已保存到历史记录（最多保留3条）。农历/起运尚未补齐，未写入本条记录。'
        : '命盘已保存到历史记录（最多保留3条）'
    );
  };

  const clearResultState = (message: string) => {
    setResult(null);
    setError('');
    setActionMessage(message);
    setFullReadExpanded(false);
    dropPendingRefill();
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('record');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleReset = () => {
    clearResultState('已重置结果，请重新测算');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditBasicInfo = () => {
    clearResultState('请修改信息后重新测算。');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteBasicInfo = () => {
    let message = '已清空当前结果。';
    if (recordId) {
      const deleted = deleteRecord(recordId);
      message = deleted ? '已删除该历史记录并清空结果。' : '已清空结果（历史记录不存在或删除失败）。';
    }
    clearResultState(message);
    setFormData({
      name: '',
      gender: '',
      birthDate: '',
      birthHour: '-1',
      birthPlace: '',
      isLunar: false,
      knowTime: false,
      birthHourNum: 12,
      birthMinute: 0,
      lateZiShi: false,
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReanalyze = async () => {
    // 重新分析需重新生成 AI（消耗配额）。游客不支持，引导登录。
    if (status !== 'authenticated') {
      setAuthReason({
        title: '重新分析需要登录',
        desc: '游客可查看本次解读。登录后每天可免费重新分析 1 次；开通会员不限次。',
      });
      setShowAuthModal(true);
      return;
    }
    setError('');
    setActionMessage('');
    setFullReadExpanded(false);
    setReanalyzing(true);
    // 滚动到 AI 解读卡片
    setTimeout(() => {
      aiReadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    try {
      // 历史记录场景下没有 cacheKey/baziResult，需先 POST /api/bazi 重新计算
      if (!result?.cacheKey || !result?.baziResult) {
        const baseResp = await fetch('/api/bazi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name || '缘主',
            gender: formData.gender || 'unknown',
            birthDate: formData.birthDate,
            birthHour: parseInt(formData.birthHour, 10),
            birthPlace: formData.birthPlace,
            isLunar: formData.isLunar,
            knowTime: formData.knowTime,
            birthHourNum: formData.knowTime ? formData.birthHourNum : undefined,
            birthMinute: formData.knowTime ? formData.birthMinute : undefined,
            lateZiShi: formData.knowTime ? formData.lateZiShi : undefined,
          }),
        });
        const baseData = (await baseResp.json()) as BaziPageResult & { error?: string };
        if (!baseResp.ok) {
          if (baseData.error === 'QUOTA_EXCEEDED') {
            setShowQuotaModal(true);
            return;
          }
          throw new Error(baseData.error || '服务器错误，请稍后重试');
        }
        setResult(baseData);
        const ok = await runAiStream(true, baseData as BaziPageResult);
        if (ok) setActionMessage('重新分析完成');
        return;
      }

      const ok = await runAiStream(true);
      if (ok) setActionMessage('重新分析完成');
    } catch (err) {
      setError(err instanceof Error ? err.message : '重新分析失败，请稍后重试');
    } finally {
      setReanalyzing(false);
    }
  };

  const inputClass =
    'w-full min-h-[44px] rounded-lg border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10 outline-none transition-all';
  const cardClass =
    'rounded-2xl border border-[#1C1A16]/8 shadow-none bg-white hover:shadow-card-hover transition-shadow duration-300';

  return (
    <div className="min-h-dvh bg-[#FAF9F6]">
      <div className="text-center pt-6 md:pt-12 pb-8">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-[0.08em]"
          style={{ background: '#DBEAFE', color: '#1D4ED8' }}
        >
          <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
          AI 四柱推算
        </span>
        <h1 className="mt-4 font-display text-3xl md:text-[40px] font-bold text-[#1C1A16] leading-tight tracking-[0.08em]">
          八字分析
        </h1>
        <p className="mt-3 text-sm md:text-base text-[#1C1A16]/55 tracking-wider">精准解析生辰八字，揭示命盘奥秘</p>
      </div>

      <Container>
        {/* 命盘档案选择器：无档案时不渲染 */}
        {profiles.length > 0 && (
        <div className="max-w-page mx-auto w-full mb-4">
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Select
              value={selectedProfileId}
              onChange={(e) => handleSelectProfile(e.target.value)}
              options={profiles.map((p) => ({
                value: p.id,
                label: `${p.label || p.name} (${p.birthDate || '未填'})`,
              }))}
              className="!w-auto h-8 min-w-[240px] max-w-[280px] rounded-lg border border-[#1C1A16]/15 bg-white px-3 pr-8 text-sm text-[#1C1A16]"
            />
            {(() => {
              const isAuth = status === 'authenticated';
              const cap = isAuth ? (isMember ? MAX_VIP_PROFILES : MAX_LOGGED_IN_PROFILES) : MAX_GUEST_PROFILES;
              const disabled = profiles.length >= cap;
              const tip = disabled
                ? isAuth
                  ? isMember
                    ? `最多可保存${MAX_VIP_PROFILES}个命盘`
                    : `免费版最多保存${cap}个命盘，升级 VIP 可存 ${MAX_VIP_PROFILES} 个`
                  : `未登录最多保存${cap}个命盘，请登录后使用`
                : '新增八字';
              return (
                <button
                  type="button"
                  onClick={handleOpenAddProfile}
                  disabled={disabled}
                  title={tip}
                  className={`inline-flex items-center gap-1 h-8 px-3 rounded-lg text-sm font-medium transition-colors ${
                    disabled
                      ? 'bg-[#1C1A16]/8 text-[#1C1A16]/40 cursor-not-allowed'
                      : 'bg-brand-accent text-white hover:bg-brand-accent-hover'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  新增八字
                </button>
              );
            })()}
            {selectedProfileId && profiles.length > 0 && (() => {
              const current = profiles.find((p) => p.id === selectedProfileId);
              if (!current) return null;
              return (
                <div className="flex items-center gap-1">
                  {profiles.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => setShowHepanPicker(true)}
                      title="与其他档案合盘"
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[#1C1A16]/15 text-[#1C1A16]/70 hover:bg-[#FCE7F3]/60 hover:text-[#BE185D] hover:border-[#BE185D]/30 transition-colors text-xs font-medium"
                      aria-label="与其他档案合盘"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      合盘
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenEditProfile}
                    title="编辑档案"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#1C1A16]/15 text-[#1C1A16]/70 hover:bg-[#1C1A16]/5 transition-colors"
                    aria-label="编辑档案"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    disabled={!!current.isPrimary}
                    title={current.isPrimary ? '主档案不可删除' : '删除档案'}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                      current.isPrimary
                        ? 'border-[#1C1A16]/8 text-[#1C1A16]/25 cursor-not-allowed'
                        : 'border-[#1C1A16]/15 text-[#1C1A16]/70 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                    }`}
                    aria-label="删除档案"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
        )}

        {result && !loading && basicInfoData && (
          <div className="max-w-page mx-auto w-full mb-6 lg:mb-8">
          <Card className={`${cardClass} p-0`}>
            <BasicInfoCard
              baziText={basicInfoData.baziText}
              name={basicInfoData.name}
              gender={basicInfoData.gender}
              birthTime={basicInfoData.birthTime}
              lunarDate={basicInfoData.lunarDate}
              zodiac={basicInfoData.zodiac}
              dayunStartDescription={basicInfoData.dayunStartDescription}
              dayunStartAt={basicInfoData.dayunStartAt}
              isAuthenticated={status === 'authenticated'}
              onEdit={handleOpenEditProfile}
              onDelete={handleDeleteBasicInfo}
              onReanalyze={handleReanalyze}
              reanalyzing={reanalyzing || aiStreaming}
            />
          </Card>
          </div>
        )}
        <form onSubmit={handleSubmit}>
        <div className="max-w-page mx-auto w-full flex flex-col pb-20 md:pb-26">
          {(!result || loading) && (
          <div className="bazi-input-card w-full rounded-2xl bg-white shadow-none px-6 py-6 sm:px-8 sm:py-8 border border-[#1C1A16]/8 space-y-6">
          {/* 基本信息：姓名 + 性别 */}
          <div>
            <p className="text-sm font-semibold text-[#1C1A16]/50 mb-3 tracking-wide">基本信息</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="bazi-name" className="block text-sm font-medium text-[#1C1A16]/70">姓名</label>
                <input
                  id="bazi-name"
                  type="text"
                  placeholder="请输入姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#1C1A16]/70">性别</label>
                <Select
                  options={[
                    { value: '', label: '请选择性别', disabled: true },
                    { value: 'male', label: '男' },
                    { value: 'female', label: '女' },
                  ]}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="min-h-[44px] rounded-lg border border-[#1C1A16]/15 bg-white px-3 text-sm text-[#1C1A16]"
                />
              </div>
            </div>
          </div>
          <hr className="border-[#1C1A16]/8" />

          {/* 时间信息 */}
          <p className="text-sm font-semibold text-[#1C1A16]/50 tracking-wide">时间信息</p>

              <DatePicker
                label={formData.isLunar ? '出生日期（农历）' : '出生日期（阳历）'}
                value={formData.birthDate}
                onChange={(value) => setFormData({ ...formData, birthDate: value })}
                className="space-y-1.5"
                triggerClassName="min-h-[44px] rounded-lg"
              />

              {/* 农历输入（P2-B）：isLunar 全链路已通，此处只是开关 */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isLunar}
                  onChange={(e) => setFormData({ ...formData, isLunar: e.target.checked })}
                  className="mt-1 w-4 h-4 accent-[#1C1A16]"
                />
                <div>
                  <p className="text-sm font-medium text-[#1C1A16]">这是农历生日</p>
                  <p className="text-xs text-[#1C1A16]/55 mt-0.5">
                    只记得农历生日就勾选，系统会自动换算（闰月自动处理）。
                  </p>
                </div>
              </label>
              <hr className="border-[#1C1A16]/8" />
          {/* 时辰组 */}
              <fieldset className="space-y-4">
                <p className="text-sm font-semibold text-[#1C1A16]/50 tracking-wide">时辰信息</p>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.knowTime}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        knowTime: checked,
                        birthHour: checked ? hourToShichenCode(prev.birthHourNum) : prev.birthHour,
                      }));
                    }}
                    className="mt-1 w-4 h-4 accent-[#1C1A16]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#1C1A16]">知道出生时间</p>
                    <p className="text-xs text-[#1C1A16]/55 mt-0.5">
                      精确到分有助于排准时柱；不知道时按无时辰处理，命盘精度会下降。
                    </p>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.knowTime ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[#1C1A16]/70">时（小时）</label>
                        <Select
                          options={hourNumOptions}
                          value={String(formData.birthHourNum)}
                          onChange={(e) => {
                            const hour = Number(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              birthHourNum: hour,
                              birthHour: hourToShichenCode(hour),
                            }));
                          }}
                          className="min-h-[44px] rounded-lg border border-[#1C1A16]/15 bg-white px-3 text-sm text-[#1C1A16]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[#1C1A16]/70">分</label>
                        <Select
                          options={minuteOptions}
                          value={String(formData.birthMinute)}
                          onChange={(e) => setFormData({ ...formData, birthMinute: Number(e.target.value) })}
                          className="min-h-[44px] rounded-lg border border-[#1C1A16]/15 bg-white px-3 text-sm text-[#1C1A16]"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <label htmlFor="bazi-birth-hour" className="block text-sm font-medium text-[#1C1A16]/70">出生时辰（粗略）</label>
                      <Select
                        id="bazi-birth-hour"
                        options={shichenOptions}
                        value={formData.birthHour}
                        onChange={(e) => setFormData({ ...formData, birthHour: e.target.value })}
                        className="min-h-[44px] rounded-lg border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16]"
                      />
                    </div>
                  )}

                  <CitySearch
                    label="出生地"
                    placeholder="如 北京市、上海市"
                    value={formData.birthPlace}
                    onInputChange={(value) => setFormData(prev => ({ ...prev, birthPlace: value }))}
                    onSelect={(city) => setFormData(prev => ({ ...prev, birthPlace: city.name }))}
                  />
                </div>

                {formData.knowTime && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.lateZiShi}
                      onChange={(e) => setFormData({ ...formData, lateZiShi: e.target.checked })}
                      className="mt-1 w-4 h-4 accent-[#1C1A16]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#1C1A16]">晚子时（23:00 后归次日日柱）</p>
                      <p className="text-xs text-[#1C1A16]/55 mt-0.5">
                        专业命理项，仅当出生在 23:00-23:59 时影响日柱。
                      </p>
                    </div>
                  </label>
                )}

                {!formData.knowTime && formData.birthHour === '-1' && (
                  <p className="rounded-lg bg-stone-100 border border-stone-300 px-3 py-2 text-xs text-[#1C1A16]">
                    ⚠️ 未提供出生时间将按无时辰排盘，时柱缺失会显著降低分析精度。
                  </p>
                )}
              </fieldset>

              {error && <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

              <Button
                type="submit"
                loading={loading}
                className="mx-auto flex w-full sm:w-auto sm:min-w-[260px] sm:px-12 min-h-[48px] items-center justify-center text-[14px] font-medium rounded-xl bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors"
              >
                {loading ? '正在计算...' : '开始解读'}
              </Button>
          </div>
          )}

          <div className="w-full">
            {loading && (
              <Card className={`flex flex-col items-center justify-center py-16 ${cardClass}`}>
                <BaguaSpinner size={64} />
                <p className="mt-4 text-[#1C1A16] font-medium">正在计算您的命盘...</p>
                <p className="text-sm text-[#6B7280] mt-2">
                  {loadingLong ? 'AI 解读耗时较长，正在为您准备基础解读...' : 'AI 正在解读中，请稍候'}
                </p>
              </Card>
            )}

            {!result && !loading && (
              <Card className={`flex flex-col items-center justify-center py-20 text-center ${cardClass}`}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#DBEAFE' }}>
                  <Sparkles className="w-8 h-8" strokeWidth={1.5} style={{ color: '#1D4ED8' }} />
                </div>
                <p className="text-[#1C1A16] font-medium text-lg">开始您的命盘解读</p>
                <p className="text-sm text-[#6B7280] mt-2 max-w-[260px]">填写上方出生信息，AI 将生成专属八字解读</p>
                <div className="mt-6 text-left bg-[#FAF9F6] rounded-xl p-4 max-w-[300px] w-full">
                  <p className="text-xs font-medium text-[#1C1A16]/60 mb-2">填写提示</p>
                  <ul className="space-y-1.5 text-xs text-[#1C1A16]/55">
                    <li>• 出生日期：如 1990-01-15</li>
                    <li>• 时辰不确定可选&ldquo;不知道&rdquo;</li>
                    <li>• 出生地影响真太阳时计算</li>
                  </ul>
                </div>
              </Card>
            )}

            {result && !loading && basicInfoData && dayMasterInsight && (
              <PageShell width="page" className="px-0 sm:px-0">
              <div ref={resultRef} className="space-y-6 animate-fadeIn" aria-live="polite">
                {result._source !== 'history' && !isMember && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F6F4F1] border border-[#1C1A16]/10 px-4 py-3">
                    <p className="text-sm text-[#1C1A16]">✨ 解读已生成！开通会员可不限次解读，并解锁 AI 八字问答</p>
                    <Link href="/pricing" className="shrink-0 text-xs font-medium text-[#1C1A16] border border-stone-400 rounded-lg px-3 py-1.5 hover:bg-stone-200 transition-colors">
                      了解会员
                    </Link>
                  </div>
                )}
                {result._source === 'fallback' && (
                  <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200/60 px-4 py-3">
                    <span className="text-blue-500 text-lg">ℹ️</span>
                    <p className="text-sm text-blue-700">AI 解读耗时较长，已为您准备基础解读（简化版解读，完整版需会员）</p>
                  </div>
                )}
                {/* 存量命盘补齐的可见出口：不静默吞。网络类失败给「重试」；
                    参数缺失/精度打折类重试也没用，只能重排——注意此时出生信息表单是卸载状态
                    （{(!result || loading) && …form…}），光写「请在上方表单重新排盘」用户找不到入口，
                    必须给按钮走 handleEditBasicInfo 把表单重新挂回来。
                    配色分级：tone='warn' 用琥珀（确实有东西没显示出来），tone='info' 用中性灰
                    （内容都在、只是大运边界按时辰折算，用告警色会把「精度提示」误传成「出错了」）。 */}
                {refillNotice && (
                  <div
                    className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 border ${
                      refillNotice.tone === 'info'
                        ? 'bg-[#F6F4F1] border-[#1C1A16]/10'
                        : 'bg-amber-50 border-amber-200/70'
                    }`}
                  >
                    <p className={`text-sm ${refillNotice.tone === 'info' ? 'text-[#1C1A16]/70' : 'text-amber-800'}`}>
                      {refillNotice.text}
                    </p>
                    {refillNotice.retryable ? (
                      <button
                        type="button"
                        disabled={refilling}
                        onClick={() => {
                          const pending = refillPendingRef.current;
                          if (pending) void ensureFullResult(pending.stored, pending.input);
                        }}
                        className="shrink-0 text-xs font-medium text-amber-900 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                      >
                        {refilling ? '重试中…' : '重试'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEditBasicInfo}
                        className={`shrink-0 text-xs font-medium border rounded-lg px-3 py-1.5 transition-colors ${
                          refillNotice.tone === 'info'
                            ? 'text-[#1C1A16] border-stone-400 hover:bg-stone-200'
                            : 'text-amber-900 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        重新填写出生信息
                      </button>
                    )}
                  </div>
                )}
                {/* 命盘速读（P0-A）：置顶三句话，3 秒读懂盘面/大运/流年，零 AI 成本 */}
                {quickReadLines.length > 0 && <QuickReadCard lines={quickReadLines} />}

                {/* 桌面也走单栏：概览(四柱/五行/日主)在上、AI 解读长文在下,收窄到 page(840) 舒适阅读宽,避免两栏「左短右长」留白/停靠。 */}
                <SplitLayout
                  asidePosition="left"
                  singleColumn
                  aside={
                    <div className="space-y-6">
                <Card className={cardClass}>
                  <BaziChart pillars={result.pillars} hasHour={hasHourPillar} />
                </Card>

                <Card className={cardClass}>
                  <WuxingChart wuxing={result.wuxing} dayMasterElement={result.pillars.day.ganWuxing} />
                </Card>

                <Card className={`${cardClass} p-0`}>
                  <DayMasterSummaryCard
                    dayMaster={dayMasterInsight.title}
                    personality={dayMasterInsight.personality}
                    favorableGods={dayMasterInsight.favorableGods}
                    avoidGods={dayMasterInsight.avoidGods}
                    mingGe={result.mingGe}
                  />
                </Card>
                    </div>
                  }
                  main={
                    <div className="space-y-6">

                {result?.traits && result.traits.length > 0 && (
                  <Card className={cardClass}>
                    <h3 className="text-base font-semibold text-[#1C1A16] mb-4">命理特质</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.traits.map((trait: BaziTrait, index: number) => (
                        <div
                          key={`${trait.label}_${index}`}
                          className="rounded-xl border border-[#1C1A16]/6 bg-[#FAF9F6] px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-[#1C1A16]/90">{trait.label}</p>
                          <p className="text-xs text-brand-gray mt-1.5 leading-relaxed">{trait.desc}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div ref={aiReadingRef}>
                <Card className={`${cardClass} relative`}>
                  {reanalyzing && !aiStreaming && (
                    <div className="absolute inset-0 z-10 rounded-2xl bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 text-[#1C1A16] animate-spin" />
                      <p className="text-sm font-medium text-[#1C1A16]/70">AI 正在重新解读中…</p>
                    </div>
                  )}
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-1">AI 解读</h2>
                  <p className="text-xs text-brand-gray mb-4 flex items-center gap-2">
                    AI 命理解读 · 仅供参考
                    {!showAiButton && !aiStreaming && result.aiAnalysis && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        result._source === 'history' || result._source === 'cache'
                          ? 'bg-[#F5F3EF] text-[#1C1A16]/50'
                          : (result._source === 'fallback' || result._source === 'unknown')
                          ? 'bg-red-50 text-red-400'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {result._source === 'history' || result._source === 'cache'
                          ? 'from cache'
                          : (result._source === 'fallback' || result._source === 'unknown')
                          ? 'AI failed'
                          : 'from AI'}
                      </span>
                    )}
                  </p>

                  {/* AI解读引言区块 */}
                  <div className="mb-4 rounded-lg bg-[#FAF9F6] px-4 py-3">
                    <p className="text-xs italic text-[#1C1A16]/50 mb-2">
                      以专业八字分析师的身份，为您进行深度分析。所有分析均严格基于您提供的八字信息。
                    </p>
                    <p className="text-sm text-[#1C1A16]/70 leading-relaxed">
                      <span className="font-semibold text-[#1C1A16]">命主八字排盘分析</span>
                      <br />
                      <span className="text-[#1C1A16]/50">八字：</span>
                      <span className="font-medium text-[#1C1A16]">
                        {result.pillars.year.gan}{result.pillars.year.zhi}{' '}
                        {result.pillars.month.gan}{result.pillars.month.zhi}{' '}
                        {result.pillars.day.gan}{result.pillars.day.zhi}{' '}
                        {hasHourPillar ? `${result.pillars.hour.gan}${result.pillars.hour.zhi}` : '时柱未知'}
                      </span>
                      {'　'}
                      <span className="text-[#1C1A16]/50">性别：</span>
                      <span className="font-medium text-[#1C1A16]">{formData.gender === 'male' ? '男' : formData.gender === 'female' ? '女' : '未知'}</span>
                      {'　'}
                      <span className="text-[#1C1A16]/50">出生公历：</span>
                      <span className="font-medium text-[#1C1A16]">
                        {formData.birthDate ? new Date(formData.birthDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        {formData.birthHour !== undefined && formData.birthHour !== '' ? ` ${SHICHEN_START_HOUR[formData.birthHour] ?? ''}:00` : ''}
                      </span>
                      {'　'}
                      <span className="text-[#1C1A16]/50">当前时间：</span>
                      <span className="font-medium text-[#1C1A16]">
                        {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </p>
                  </div>

                  {/* 推算步骤：流式中展开看进度，完成后默认折叠，可随时展开看推算链条 */}
                  {aiSteps.length > 0 && (
                    <div className="mb-4 rounded-xl border border-[#1C1A16]/8 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setStepsExpanded((v) => !v)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#FAF9F6] transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5 text-[#1C1A16] flex-shrink-0" />
                        <span className="text-xs text-[#1C1A16]/60 flex-1">
                          {aiStreaming && !aiStreamStarted
                            ? `正在排盘推算 · 已完成 ${aiSteps.length} 步…`
                            : `命理推算完成 · 共 ${aiSteps.length} 步真实排盘`}
                        </span>
                        {stepsExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-[#1C1A16]/30" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[#1C1A16]/30" />
                        )}
                      </button>
                      {stepsExpanded && (
                        <div className="px-3 pb-2 pt-1 space-y-1.5 border-t border-[#1C1A16]/5">
                          {aiSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-[#1C1A16]/55 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 议题式 AI（P0-A）：六议题入口替代单一「开始AI解读」按钮；全盘详批改 VIP 专属 */}
                  {!aiStreaming && (
                    <div className={showAiButton ? '' : 'mb-5'}>
                      <TopicReadSection
                        cacheKey={result.cacheKey ?? null}
                        ensurePayload={ensureTopicPayload}
                        isVip={isMember}
                        hasFullAnalysis={!showAiButton && Boolean(result.aiAnalysis)}
                        onStartFullRead={handleStartAiReading}
                        onQuotaExceeded={() => setShowQuotaModal(true)}
                        onNeedAuth={(reason) => {
                          setAuthReason(reason);
                          setShowAuthModal(true);
                        }}
                        onNeedVip={() => setShowUpgradeModal(true)}
                      />
                    </div>
                  )}

                  {aiStreaming && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-[#1C1A16]/50 mb-4">
                        <RefreshCw className="w-3.5 h-3.5 text-[#1C1A16] animate-spin" />
                        AI 正在解读中…
                      </div>

                      {/* 渲染下沉：delta 只驱动 StreamingReport 重渲染，父树在流式期间保持静止 */}
                      <StreamingReport flushRef={aiStreamFlushRef} bufRef={aiStreamBufRef} />
                    </div>
                  )}

                  {!showAiButton && !aiStreaming && summaryPoints.length > 0 && (
                    <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5">
                      <p className="text-sm font-medium text-[#1C1A16] mb-3">AI 要点</p>
                      <ul className="space-y-2">
                        {summaryPoints.map((point, index) => (
                          <li key={`${point}_${index}`} className="text-sm text-[#1C1A16]/85 leading-relaxed flex items-start gap-2">
                            <span className="text-[#1C1A16] mt-0.5">✓</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!showAiButton && !aiStreaming && result.aiAnalysis && (
                    <div className="mt-5">
                      <div>
                      {fullReadSections.map((section, index) => {
                        const isDayunSection = section.title.includes('运势重点');
                        return (
                        <div key={section.title}>
                          {index > 0 && <hr className="border-[#1C1A16]/8 my-8" />}
                          <h4
                            className={`border-l-4 pl-3 font-semibold mb-3 text-[#1C1A16] ${
                              isDayunSection
                                ? 'text-lg pb-2 border-b border-b-[#1C1A16]/30'
                                : 'text-base'
                            }`}
                            style={{ borderLeftColor: '#1D4ED8' }}
                          >
                            {section.title}
                          </h4>
                          {renderSectionContent(section.content)}
                          {/* 补齐哨兵①：紧贴大运时间轴上沿（存量命盘缺 dayunTimeline 时那一整块不渲染，
                              所以哨兵必须独立于它存在，否则「该补的时候没人触发」）。
                              零高度 + 外边距清零：只做锚点，不占版面、不影响任何间距。 */}
                          {isDayunSection && (
                            <div
                              ref={refillSentinelDayunRef}
                              aria-hidden
                              className="h-0"
                              style={{ marginTop: 0, marginBottom: 0 }}
                            />
                          )}
                          {isDayunSection && dayunTimeline.length > 0 && (
                            <div className="mt-4 rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-4 sm:p-5">
                              <p className="text-sm font-medium text-[#1C1A16] mb-3">大运时间轴</p>
                              <div className="overflow-x-auto md:overflow-x-visible">
                                <div className="flex gap-3 snap-x snap-mandatory pb-1 md:grid md:grid-cols-4 md:snap-none md:pb-0 lg:grid-cols-8">
                                  {dayunTimeline.map((item, idx) => (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() => setSelectedDayunIndex(idx)}
                                      className={`min-w-[160px] md:min-w-0 snap-start rounded-xl border p-3 text-left transition-colors ${
                                        idx === selectedDayunIndex
                                          ? item.isCurrent
                                            ? 'border-[#1C1A16] bg-[#FFF6E8] text-[#1C1A16] ring-1 ring-[#1C1A16]/40'
                                            : 'border-[#1C1A16] bg-[#FAF9F6] text-[#1C1A16]'
                                          : item.isCurrent
                                            ? 'border-[#1C1A16]/30 bg-[#FFF6E8] text-[#1C1A16]'
                                            : 'border-[#1C1A16]/12 bg-white text-[#1C1A16]'
                                      }`}
                                    >
                                      <p className="text-lg font-semibold tracking-[0.08em]">{item.gan}{item.zhi}</p>
                                      <p className="text-xs mt-1 opacity-80">{item.ageStart}-{item.ageEnd} 岁</p>
                                      <p className="text-[11px] mt-0.5 opacity-60">{item.startMonth ? `${item.yearStart}年${item.startMonth}月起` : `${item.yearStart}-${item.yearEnd} 年`}</p>
                                      {item.isCurrent && <p className="text-[11px] mt-1 font-medium text-[#1C1A16]">当前大运</p>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {selectedDayun && dayunDetailRich && (
                                <div className="mt-4 rounded-xl border border-[#1C1A16]/10 bg-white p-4 sm:p-5">
                                  {/* 标题：干支大运 + 吉凶 + 阶段 */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-base font-semibold tracking-[0.08em] text-[#1C1A16]">
                                      {dayunDetailRich.ganZhi}大运
                                    </span>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        dayunDetailRich.fortune === '吉'
                                          ? 'bg-emerald-50 text-emerald-600'
                                          : dayunDetailRich.fortune === '凶'
                                          ? 'bg-rose-50 text-rose-500'
                                          : 'bg-[#F5F3EF] text-[#1C1A16]/60'
                                      }`}
                                    >
                                      {dayunDetailRich.fortune === '吉' ? '偏吉' : dayunDetailRich.fortune === '凶' ? '偏凶' : '中平'}
                                    </span>
                                    {selectedDayun.isCurrent && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFF6E8] text-[#1C1A16]">
                                        当前大运
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-1.5 text-xs text-[#1C1A16]/55">
                                    {selectedDayun.ageStart}-{selectedDayun.ageEnd} 岁 · {selectedDayun.startMonth ? `${selectedDayun.yearStart}年${selectedDayun.startMonth}月 ~ ${selectedDayun.yearEnd + 1}年${selectedDayun.startMonth}月` : `${selectedDayun.yearStart}-${selectedDayun.yearEnd} 年`} · {dayunPhaseText}
                                  </p>

                                  {/* 命理要素：天干十神 / 藏干 / 纳音 / 五行 */}
                                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                                    <div>
                                      <span className="text-brand-gray">天干十神</span>
                                      <p className="mt-0.5 font-medium text-[#1C1A16]">{dayunDetailRich.ganShiShen}</p>
                                    </div>
                                    <div>
                                      <span className="text-brand-gray">大运五行</span>
                                      <p className="mt-0.5 font-medium text-[#1C1A16]">{dayunDetailRich.wuxing}</p>
                                    </div>
                                    <div>
                                      <span className="text-brand-gray">地支藏干</span>
                                      <p className="mt-0.5 font-medium text-[#1C1A16]">
                                        {dayunDetailRich.hiddenGods.map(h => `${h.gan}·${h.shishen}`).join('，')}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-brand-gray">纳音</span>
                                      <p className="mt-0.5 font-medium text-[#1C1A16]">{dayunDetailRich.naYin}</p>
                                    </div>
                                  </div>

                                  {/* 吉凶依据 + 阶段主题 */}
                                  <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/75">
                                    {dayunDetailRich.fortuneReason}
                                    {dayunDetailRich.theme !== '—' && ` 本阶段主题：${dayunDetailRich.theme}。`}
                                  </p>
                                  {currentLiunian && (
                                    <p className="mt-1 text-xs text-[#1C1A16]/50">当前流年：{currentLiunian}</p>
                                  )}

                                  {/* 四维简评 */}
                                  {dayunDetailRich.aspects.length > 0 && (
                                    <div className="mt-3 space-y-2 border-t border-[#1C1A16]/8 pt-3">
                                      {dayunDetailRich.aspects.map(a => (
                                        <div key={a.label} className="flex gap-2 text-sm">
                                          <span className="flex-shrink-0 w-9 font-medium text-[#1C1A16]">{a.label}</span>
                                          <span className="flex-1 text-[#1C1A16]/75 leading-relaxed">{a.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* AI 针对该大运的专属解读（若有） */}
                                  {dayunAiText && (
                                    <div className="mt-3 border-t border-[#1C1A16]/8 pt-3">
                                      <p className="text-xs font-medium text-[#1C1A16]/55 mb-1">AI 专属解读</p>
                                      <p className="text-sm leading-loose text-[#1C1A16]/75 whitespace-pre-wrap">{dayunAiText}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                  )}

                </Card>
                </div>
                    </div>
                  }
                />

                <BaziChatSection
                  baziData={{
                    pillars: result.pillars,
                    wuxing: result.wuxing,
                    aiAnalysis: result.aiAnalysis,
                    mingGe: result.mingGe,
                    traits: result.traits,
                  }}
                  birthInput={{
                    // 必须送公历日：/api/bazi/chat 用它重排命盘 + 跑工具链，且**不认 isLunar**
                    //（birthInputSchema 是 .strict()，多送字段会让整个 safeParse 失败、确定性事实全丢）。
                    // 送农历原串的后果比大运错更严重：那边连四柱都会排成另一副盘。
                    // 存量命盘取不到锚点时回落原值，与改动前一致。
                    birthDate: solarBirthDate,
                    gender: formData.gender === 'female' ? 'female' : 'male',
                    knowTime: chatBirthHourNum !== undefined,
                    birthHourNum: chatBirthHourNum,
                    birthMinute: formData.knowTime ? formData.birthMinute : 0,
                  }}
                  isLoggedIn={status === 'authenticated'}
                  isVip={isMember}
                />

                {/* 补齐哨兵②：排盘细节组（十神/神煞/流年流月/关键应期）之前。流年流月与关键应期是这组里
                    依赖补齐数据的那两块；AI 长文缺失时哨兵①不存在（大运时间轴同样不渲染），此处就是唯一触发点。
                    父容器是 space-y-6：外边距清零后本元素不改变任何相邻间距（无论 space-y 实现为
                    「后一个加 margin-top」还是「前一个加 margin-bottom」，被清零的都只是它自己那一份）。 */}
                <div
                  ref={refillSentinelDetailRef}
                  aria-hidden
                  className="h-0"
                  style={{ marginTop: 0, marginBottom: 0 }}
                />

                {/* 排盘细节模块（确定性命盘数据，置于 AI 问答之后）：十神 / 神煞 / 流年流月 */}
                <Card className={cardClass}>
                  <h3 className="text-base font-semibold text-[#1C1A16] mb-1">十神详解</h3>
                  <p className="text-xs text-brand-gray mb-4">四柱天干十神与日主的关系及含义</p>
                  <ShishenDetailTab pillars={result.pillars} dayGan={result.pillars.day.gan} />
                </Card>

                {/* 刑冲会合害可视化（P1-C）：全站独有的专业感视觉，置于神煞卡之前 */}
                <Card className={cardClass}>
                  <InteractionsCard
                    interactions={interactionsData}
                    branches={{
                      year: result.pillars.year.zhi,
                      month: result.pillars.month.zhi,
                      day: result.pillars.day.zhi,
                      hour: hasHourPillar ? result.pillars.hour.zhi : null,
                    }}
                    hasHour={hasHourPillar}
                  />
                </Card>

                <Card className={cardClass}>
                  <ShenshaCard shensha={result.shensha} />
                </Card>

                {(result.liunian || (result.liuyue && result.liuyue.length > 0)) && (
                  <Card className={cardClass}>
                    <LiunianLiuyueCard liunian={result.liunian} liuyue={result.liuyue} />
                  </Card>
                )}

                {/* 关键应期（P1-D）：免费最近 1 条 + 模糊占位；VIP 全表 */}
                {yingqiData && (
                  <Card className={cardClass}>
                    <YingqiCard
                      items={yingqiData.items}
                      total={yingqiData.total}
                      isVip={isMember}
                      onUnlockClick={() => setShowUpgradeModal(true)}
                    />
                  </Card>
                )}

                <div className="group relative overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-[#F6F4F1] p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                    style={{ background: '#BE185D' }}
                  />
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.08em]"
                    style={{ background: '#FCE7F3', color: '#BE185D' }}
                  >
                    合婚配对
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-[#1C1A16]">情侣缘分测算</h3>
                  <p className="text-sm text-[#1C1A16]/60 mt-1">AI 智能正缘匹配系统</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-[#1C1A16]/75">你们的五行相合还是相克？</p>
                    <p className="text-sm text-[#1C1A16]/75">两人性格是互补还是冲突？</p>
                    <p className="text-sm text-[#1C1A16]/75">感情和谐指数究竟有多高？</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (result?.pillars) {
                        try {
                          sessionStorage.setItem(
                            'selfBaziData',
                            JSON.stringify({
                              name: formData.name,
                              gender: formData.gender,
                              birthDate: formData.birthDate,
                              birthHour: formData.birthHour,
                              pillars: result.pillars,
                            })
                          );
                        } catch {}
                      }
                      window.location.href = '/bazi/marriage';
                    }}
                    className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-1 hover:gap-2 px-8 py-3 rounded-xl bg-white border border-[#1C1A16]/25 text-[#1C1A16] font-medium text-sm hover:border-[#1C1A16] hover:bg-[#FDFBF7] transition-all"
                  >
                    输入对方生辰，立即测算
                    <ArrowRight className="w-4 h-4" style={{ color: '#BE185D' }} />
                  </button>
                </div>

                {/* 模块C: AI每日运势引流 */}
                <div className="group relative overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                    style={{ background: '#B0870F' }}
                  />
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.08em]"
                    style={{ background: '#FBF1D0', color: '#B0870F' }}
                  >
                    每日运势
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-[#1C1A16]">AI 每日运势分析</h3>
                  <p className="text-sm text-[#1C1A16]/60 mt-1">基于你的八字命盘，AI 为你解读今日运势</p>
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <ul className="space-y-2">
                      <li className="text-sm text-[#1C1A16]/75 flex items-start gap-2">
                        <span className="text-[#1C1A16] mt-0.5">•</span>
                        专属日签生成与宜忌建议
                      </li>
                      <li className="text-sm text-[#1C1A16]/75 flex items-start gap-2">
                        <span className="text-[#1C1A16] mt-0.5">•</span>
                        实时 AI 流式解读过程
                      </li>
                      <li className="text-sm text-[#1C1A16]/75 flex items-start gap-2">
                        <span className="text-[#1C1A16] mt-0.5">•</span>
                        免费功能 · 每日更新
                      </li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => { window.location.href = '/daily'; }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 hover:gap-2 px-8 py-3 rounded-xl bg-white border border-[#1C1A16]/25 text-[#1C1A16] font-medium text-sm hover:border-[#1C1A16] hover:bg-[#FDFBF7] transition-all whitespace-nowrap"
                    >
                      查看今日 AI 运势
                      <ArrowRight className="w-4 h-4" style={{ color: '#B0870F' }} />
                    </button>
                  </div>
                </div>

                {/* 人生K线引流（P2-A）：出生信息已在本地 storage，K线页自动出图 */}
                <div className="group relative overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                    style={{ background: '#059669' }}
                  />
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.08em]"
                    style={{ background: '#D1FAE5', color: '#059669' }}
                  >
                    人生K线
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-[#1C1A16]">把这个命盘画成百年运势曲线</h3>
                  <p className="text-sm text-[#1C1A16]/60 mt-1">大运流年逐年打分，一眼看到人生的高点与蓄力期</p>
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <ul className="space-y-2">
                      <li className="text-sm text-[#1C1A16]/75 flex items-start gap-2">
                        <span className="text-[#1C1A16] mt-0.5">•</span>
                        0-100 岁运势曲线，K线式呈现
                      </li>
                      <li className="text-sm text-[#1C1A16]/75 flex items-start gap-2">
                        <span className="text-[#1C1A16] mt-0.5">•</span>
                        出生信息自动带入，无需重填
                      </li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        track('bazi_to_kline_click');
                        window.location.href = '/life-kline';
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 hover:gap-2 px-8 py-3 rounded-xl bg-white border border-[#1C1A16]/25 text-[#1C1A16] font-medium text-sm hover:border-[#1C1A16] hover:bg-[#FDFBF7] transition-all whitespace-nowrap"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" style={{ color: '#059669' }} />
                      生成我的人生K线
                      <ArrowRight className="w-4 h-4" style={{ color: '#059669' }} />
                    </button>
                  </div>
                </div>

                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-5 text-center">八字常见问题</h2>
                  <div className="space-y-3">
                    {faqItems.map((item) => (
                      <details key={item.question} className="group rounded-xl border border-[#1C1A16]/8 bg-white px-5 py-4">
                        <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-semibold text-[#1C1A16]">
                          {item.question}
                          <span aria-hidden className="text-[#1C1A16]/40 group-open:rotate-180 transition-transform">⌄</span>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/65">{item.answer}</p>
                      </details>
                    ))}
                  </div>
                </Card>

                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-5">操作栏</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSaveCurrentRecord}
                      className="justify-center border border-[#1C1A16]/25 bg-white text-[#1C1A16] hover:border-[#1C1A16] hover:bg-[#FDFBF7]"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存命盘
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleShare}
                      className="justify-center border border-[#1C1A16]/25 bg-white text-[#1C1A16] hover:border-[#1C1A16] hover:bg-[#FDFBF7]"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      分享命格人设卡
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReset}
                      className="justify-center border border-[#1C1A16]/25 bg-white text-[#1C1A16] hover:border-[#1C1A16] hover:bg-[#FDFBF7]"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新测算
                    </Button>
                    <Link href="/history" className="w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-center border border-[#1C1A16]/25 bg-white text-[#1C1A16] hover:border-[#1C1A16] hover:bg-[#FDFBF7]"
                      >
                        <History className="w-4 h-4 mr-2" />
                        查看历史
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                  {actionMessage && <p className="mt-3 text-sm text-[#6B7280]">{actionMessage}</p>}
                </Card>

                <AiDisclaimer />
                <div className="text-center text-xs text-[#6B7280] p-3 bg-white rounded-2xl border border-[#1C1A16]/10">
                  ⚠️ 免责声明：本站所有命理分析仅供娱乐参考，不构成任何决策建议。命运掌握在自己手中，请理性对待。
                </div>
              </div>
              </PageShell>
            )}
          </div>
        </div>
        </form>
      </Container>

      {showQuotaModal && <QuotaLimitModal onClose={() => setShowQuotaModal(false)} />}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setAuthReason(undefined); }}
        reason={authReason}
      />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* 命格人设分享弹层（P0-B） */}
      {showShareModal && result && dayMasterInsight && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-[#1C1A16]/10">
            <div className="sticky top-0 z-10 bg-white border-b border-[#1C1A16]/8 px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1C1A16]">分享命格人设卡</h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-[#1C1A16]/50 hover:text-[#1C1A16] transition-colors"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <ShareCard
                pillars={result.pillars}
                dayMaster={dayMasterInsight.title}
                zodiac={result.zodiac || '未知'}
                summary={dayMasterInsight.personality.split('。')[0] + '。'}
                hasHour={hasHourPillar}
                persona={persona}
                wuxing={result.wuxing}
              />
            </div>
          </div>
        </div>
      )}

      {/* 档案合盘选择弹层（P1-B） */}
      {showHepanPicker && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHepanPicker(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl border border-[#1C1A16]/10">
            <div className="border-b border-[#1C1A16]/8 px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1C1A16]">选择与谁合盘</h3>
              <button
                type="button"
                onClick={() => setShowHepanPicker(false)}
                className="text-[#1C1A16]/50 hover:text-[#1C1A16] transition-colors"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="p-3 max-h-[50vh] overflow-y-auto space-y-1">
              {profiles.filter((p) => p.id !== selectedProfileId).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setShowHepanPicker(false);
                    handleHepanPick(p);
                  }}
                  className="w-full text-left rounded-xl px-4 py-3 hover:bg-[#FAF9F6] border border-transparent hover:border-[#1C1A16]/10 transition-colors"
                >
                  <p className="text-sm font-medium text-[#1C1A16]">
                    {p.label || p.name}
                    <span className="ml-2 text-xs text-[#1C1A16]/50">{p.gender === 'female' ? '女' : p.gender === 'male' ? '男' : ''}</span>
                  </p>
                  <p className="text-xs text-[#1C1A16]/55 mt-0.5">{p.birthDate || '未填生日'}</p>
                </button>
              ))}
            </div>
            <p className="px-5 pb-4 text-[11px] text-[#1C1A16]/45">
              将带上双方出生信息跳转合婚页自动测算（合婚配额另计）。
            </p>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDeleteProfile !== null}
        onClose={() => setPendingDeleteProfile(null)}
        onConfirm={confirmDeleteProfile}
        title="删除档案"
        message={`确认删除「${pendingDeleteProfile?.label ?? ''}」的命盘档案？此操作无法撤销。`}
        confirmText="删除"
        danger
      />

      {showAddProfileModal && (
        <ProfileFormModal
          initial={editingProfile}
          loading={profileLoading}
          error={profileError}
          onSubmit={handleProfileFormSubmit}
          onClose={() => {
            if (profileLoading) return;
            setShowAddProfileModal(false);
            setEditingProfile(null);
            setProfileError('');
          }}
        />
      )}

      <div className="hidden" data-version="20260407-v3"></div>
    </div>
  );
}

export default function BaziPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#FAF9F6] flex items-center justify-center"><BaguaSpinner size={48} /></div>}>
      <BaziPageContent />
    </Suspense>
  );
}
