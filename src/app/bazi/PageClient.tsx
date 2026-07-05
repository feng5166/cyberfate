'use client';

import { Fragment, type ReactNode, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  History,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Share2,
  Sparkles,
  Trash2,
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
import {
  DAYMASTER_TRAITS,
  DIZHI_LIST,
  TIANGAN_LIST,
  TIANGAN_WUXING,
  WUXING_KEYS,
  getCurrentDayun,
  getDayunStart,
  getDayunTimeline,
  getLunarDate,
  getYearGanzhi,
  describeDayun,
  analyzeLiunian,
  analyzeLiuyueRange,
  analyzeShensha,
  shenshaNature,
} from '@/lib/bazi';
import type { DayunDetail } from '@/lib/bazi';
import type {
  BaziApiResult,
  BaziHistoryRecord,
  BaziResult,
  BaziTrait,
  DayunTimelineItem,
  Gender,
  MingGeInfo,
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

type ResultTab = '性格特质' | '事业财运' | '婚姻健康' | '十神详解' | '大运流年';
type AiSectionKey = 'dayMaster' | 'personality' | 'career' | 'wealth' | 'relationship' | 'health' | 'dayun';

type TagVariant = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

interface TabContent {
  scores: Array<{ label: string; value: number }>;
  points: string[];
  detail: string;
}

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
  zodiac?: string;
  trueSolarOffsetMinutes?: number | null;
  trueSolarCorrection?: string;
  trueSolarTime?: string;
  dayunStartDescription?: string;
  dayunStartAt?: string;
  cacheKey?: string;
  baziResult?: BaziResult;
  dayunExtra?: DayunExtra;
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
}

const MAX_LOGGED_IN_PROFILES = 5;
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
 * 恢复/切换命盘时，确保神煞/流年/流月在位且为当前年：
 * - 神煞为静态，从四柱重算（本地历史记录从未持久化神煞，否则会空）
 * - 流年/流月永远按当前年现算，避免显示去年快照
 * - 大运当前高亮按当前年刷新
 * 取不到四柱（极旧无 pillars 记录）则原样返回。
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
    const liunian = analyzeLiunian(chart, year);
    const liuyue = analyzeLiuyueRange(chart, year, 1, 12);
    const dayunTimeline = result.dayunTimeline?.map((d) => ({
      ...d,
      isCurrent: year >= d.yearStart && year <= d.yearEnd,
    }));
    return { ...result, shensha, liunian, liuyue, ...(dayunTimeline ? { dayunTimeline } : {}) };
  } catch {
    return result;
  }
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

function buildPoints(sourceText: string, fallback: string): string[] {
  const pieces = sourceText
    .replace(/[\t\r]/g, ' ')
    .split(/[。！？\n]/)
    .map(line => line.replace(/^[-•*\s]+/, '').trim())
    .filter(Boolean);

  const selected = (pieces.length ? pieces : [fallback]).slice(0, 5);
  while (selected.length < 3) {
    selected.push(fallback);
  }

  const prefixes = ['✓', '⚠', '💡', '✓', '💡'];
  return selected.map((item, index) => `${prefixes[index]} ${item}`);
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

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function getScoreStyle(score: number): { barClass: string; textClass: string } {
  if (score >= 80) return { barClass: 'bg-emerald-500', textClass: 'text-emerald-600' };
  if (score >= 60) return { barClass: 'bg-[#1C1A16]', textClass: 'text-stone-600' };
  return { barClass: 'bg-rose-500', textClass: 'text-rose-600' };
}

function buildDayunTimeline(
  birthDate: string,
  genderValue: string,
  birthHourNum?: number,
  birthMinute?: number,
): Array<DayunTimelineItem & { key: string }> {
  if (!birthDate) return [];

  const gender: Gender = genderValue === 'female' ? 'female' : 'male';
  const timeline = getDayunTimeline(birthDate, gender, birthHourNum, birthMinute);

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

/** 组合纯文本版大运详情（供通用 Tab 模板 / buildPoints 使用） */
function buildDayunDetail(
  item: DayunTimelineItem | null,
  aiSections: Record<AiSectionKey, string>,
  birthDate: string
): string {
  if (!item) return '暂无大运信息';
  const yearGanzhi = getYearGanzhi(getDateString(new Date()));
  const parts = [
    `${item.gan}${item.zhi}大运（${item.ageStart}-${item.ageEnd}岁）。${getDayunPhaseText(item, birthDate)}`,
    `当前流年：${yearGanzhi}。`,
  ];
  const aiText = extractDayunAiText(item, aiSections);
  if (aiText) parts.push(aiText);
  return parts.join('\n');
}

function scoreValue(score?: number): number {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
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
              label="出生日期（阳历）"
              value={values.birthDate}
              onChange={(value) => setValues((v) => ({ ...v, birthDate: value }))}
              className="space-y-1.5"
              triggerClassName="min-h-[44px] rounded-lg"
            />
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

function BaziPageContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('record');
  const resultRef = useRef<HTMLDivElement>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);

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
  const [loadingLong, setLoadingLong] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authReason, setAuthReason] = useState<{ title: string; desc: string } | undefined>(undefined);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [fullReadExpanded, setFullReadExpanded] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [selectedDayunIndex, setSelectedDayunIndex] = useState(2);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BaziPageResult | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiStreamText, setAiStreamText] = useState('');
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
          }));

          // 本地历史记录未存神煞/流年/流月，按四柱与当前年重算补齐
          setResult(withFreshModules({
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
          }));

          setError('');
          setActionMessage('已为您显示上次的命盘解读');
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
    }));

    // 本地历史记录未存神煞/流年/流月，按四柱与当前年重算补齐
    setResult(withFreshModules({
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
    }));

    setError('');
    setActionMessage('已加载历史命盘记录');
  }, [recordId]);

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
          isLunar: false,
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

  const dayunTimeline = useMemo(
    () => buildDayunTimeline(
      formData.birthDate,
      formData.gender,
      formData.knowTime ? formData.birthHourNum : undefined,
      formData.knowTime ? formData.birthMinute : undefined,
    ),
    [formData.birthDate, formData.gender, formData.knowTime, formData.birthHourNum, formData.birthMinute]
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

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  // 流式输出时页面级跟随到底部（解读已在页面正常流内，非独立滚动容器）
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const aiReadingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aiStreaming || !aiStreamText) return;
    // 把正在生成的解读底部滚入视野（整页滚动，四柱一并随页面移动）
    streamContainerRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' });
  }, [aiStreamText, aiStreaming]);

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

  const dayunDetail = useMemo(() => {
    return buildDayunDetail(selectedDayun, aiSections, formData.birthDate);
  }, [selectedDayun, aiSections, formData.birthDate]);

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

  const dayunPhaseText = useMemo(
    () => getDayunPhaseText(selectedDayun, formData.birthDate),
    [selectedDayun, formData.birthDate]
  );

  const dayunAiText = useMemo(
    () => extractDayunAiText(selectedDayun, aiSections),
    [selectedDayun, aiSections]
  );

  const currentLiunian = useMemo(() => getYearGanzhi(getDateString(new Date())), []);

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
    // 八字直输无出生日期：起运/农历/出生时间均不可得，置空（卡片显示「—」）
    // 精确到月：走库的节气数日法（含性别顺逆 + 已知时辰更准），不再用粗略估算。
    const dayunFallback = hasBirthDate
      ? getDayunStart(
          formData.birthDate,
          formData.gender === 'female' ? 'female' : 'male',
          chatBirthHourNum,
          formData.knowTime ? formData.birthMinute : undefined,
        )
      : { description: '', at: '' };

    const lunarDate = hasBirthDate ? getLunarDate(formData.birthDate) : '未提供';

    return {
      baziText: buildBaziText(result, hasHourPillar),
      name: formData.name || '缘主',
      gender: toGenderLabel(formData.gender),
      birthTime: hasBirthDate ? `${formData.birthDate} ${toHourLabel(formData.birthHour)}` : '未提供（八字直输）',
      lunarDate,
      zodiac: result.zodiac || (hasBirthDate ? getZodiacByBirthDate(formData.birthDate) : '未知'),
      dayunStartDescription: result.dayunStartDescription || dayunFallback.description,
      dayunStartAt: result.dayunStartAt || dayunFallback.at,
    };
  }, [formData.birthDate, formData.birthHour, formData.gender, formData.name, formData.knowTime, formData.birthMinute, chatBirthHourNum, result, hasHourPillar]);

  const tabContent = useMemo<Record<ResultTab, TabContent>>(() => {
    const dimensions = result?.fiveDimensions;
    const careerScore = dimensions ? scoreValue((dimensions.career + dimensions.wealth) / 2) : 0;
    const relationScore = dimensions ? scoreValue((dimensions.relationship + dimensions.health) / 2) : 0;
    const personalityScore = dimensions ? scoreValue((dimensions.studies + dimensions.health) / 2) : 0;

    return {
      性格特质: {
        scores: dimensions
          ? [
              { label: '性格稳定度', value: personalityScore },
              { label: '学习成长', value: scoreValue(dimensions.studies) },
            ]
          : [],
        points: buildPoints(aiSections.personality || aiSections.dayMaster, '保持稳定节奏，持续优化自我表达'),
        detail: aiSections.personality || aiSections.dayMaster || result?.aiAnalysis || '暂无详细解读。',
      },
      事业财运: {
        scores: dimensions
          ? [
              { label: '事业', value: scoreValue(dimensions.career) },
              { label: '财运', value: scoreValue(dimensions.wealth) },
              { label: '综合', value: careerScore },
            ]
          : [],
        points: buildPoints(`${aiSections.career}\n${aiSections.wealth}`, '稳健行动，先做确定性更高的选择'),
        detail: `${aiSections.career || '暂无事业解读。'}\n\n${aiSections.wealth || '暂无财运解读。'}`,
      },
      婚姻健康: {
        scores: dimensions
          ? [
              { label: '关系', value: scoreValue(dimensions.relationship) },
              { label: '健康', value: scoreValue(dimensions.health) },
              { label: '综合', value: relationScore },
            ]
          : [],
        points: buildPoints(`${aiSections.relationship}\n${aiSections.health}`, '关注沟通质量与作息管理，减少内耗'),
        detail: `${aiSections.relationship || '暂无婚姻关系解读。'}\n\n${aiSections.health || '暂无健康解读。'}`,
      },
      十神详解: {
        scores: [],
        points: [],
        detail: '十神详解通过独立组件渲染，不使用通用模板。',
      },
      大运流年: {
        scores: dimensions
          ? [
              { label: '阶段节奏', value: scoreValue((dimensions.career + dimensions.relationship) / 2) },
            ]
          : [],
        points: buildPoints(`${aiSections.dayun}\n${dayunDetail}`, '以十年为周期制定目标，按年度滚动调整'),
        detail: `${aiSections.dayun || '暂无大运流年专项解读。'}\n\n${dayunDetail}`,
      },
    };
  }, [aiSections, dayunDetail, result]);

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

  const autoSaveRecord = (data: BaziPageResult, source: string) => {
    if (source === 'fallback') return;
    try {
      saveRecord({
        name: formData.name || '缘主',
        gender: formData.gender || 'unknown',
        birthDate: formData.birthDate,
        birthHour: formData.birthHour,
        birthPlace: formData.birthPlace,
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
    setAiStreamText('');
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
          birthHour: parseInt(formData.birthHour, 10),
          // 精确时分 + 是否知时：供服务端跑工具链（大运起运更准）
          knowTime: formData.knowTime,
          birthHourNum: formData.knowTime ? formData.birthHourNum : undefined,
          birthMinute: formData.knowTime ? formData.birthMinute : undefined,
          forceRefresh,
          dayunExtra: activeResult.dayunExtra,
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
          setError('请登录后使用');
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
                fullText += obj.delta;
                setAiStreamText(fullText);
              }
              if (obj.done) {
                finalSource = obj.source || 'deepseek';
                if (typeof obj.aiAnalysis === 'string') finalAiAnalysis = obj.aiAnalysis;
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
        if (next) autoSaveRecord(next, resolvedSource);
        return next;
      });
      return true;
    } catch (streamErr) {
      setError(streamErr instanceof Error ? streamErr.message : 'AI 解读失败，请重试');
      setShowAiButton(true);
      return false;
    } finally {
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

  const applyProfileToForm = (profile: BaziProfileData) => {
    setFormData((prev) => ({
      ...prev,
      name: profile.name || '',
      gender: profile.gender || '',
      birthDate: profile.birthDate || '',
      birthHour: profile.birthHour || '-1',
      birthPlace: profile.birthPlace || '',
      isLunar: Boolean(profile.isLunar),
      knowTime: false,
    }));
    if (profile.baziResult) {
      // 静态命盘走缓存秒出；神煞/流年/流月/大运高亮按当前年现算，避免旧快照或缺模块
      setResult(withFreshModules({ ...profile.baziResult, _source: 'history' }));
      setError('');
      // 缓存的 AI 解读不完整（如上次中断/游客早退）时，放出「开始AI解读」按钮以便重新生成
      setShowAiButton(!isAiAnalysisComplete(profile.baziResult.aiAnalysis));
    } else {
      setResult(null);
      setShowAiButton(false);
    }
    setActionMessage('');
  };

  const handleSelectProfile = (profileId: string) => {
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

      // 上限校验（仅新建）
      if (!isEditing) {
        if (isAuth && profiles.length >= MAX_LOGGED_IN_PROFILES) {
          setProfileError(`免费版最多保存${MAX_LOGGED_IN_PROFILES}个命盘，升级 VIP 无限制`);
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
    setAiStreamText('');

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
      setShowAiButton(true);
      track('tool_result_view', { tool: 'bazi' });
      setFullReadExpanded(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentRecord = () => {
    if (!result || !dayMasterInsight || !basicInfoData) return;

    const toSave: Omit<BaziHistoryRecord, 'id' | 'createdAt'> = {
      name: formData.name || '缘主',
      gender: formData.gender || 'unknown',
      birthDate: formData.birthDate,
      birthHour: formData.birthHour,
      birthPlace: formData.birthPlace,
      dayMaster: dayMasterInsight.title,
      aiSummary: firstSentence(personalityText) || '已保存命盘记录。',
      aiAnalysis: result.aiAnalysis,
      pillars: result.pillars,
      wuxing: result.wuxing,
      fiveDimensions: result.fiveDimensions,
      traits: result.traits,
      dayMasterElement: result.pillars.day.ganWuxing,
      lunarDate: basicInfoData.lunarDate,
      zodiac: basicInfoData.zodiac,
      trueSolarOffsetMinutes: result.trueSolarOffsetMinutes ?? null,
      dayunStartDescription: basicInfoData.dayunStartDescription,
      dayunStartAt: basicInfoData.dayunStartAt,
    };

    const saved = saveRecord(toSave);
    setActionMessage(saved ? '命盘已保存到历史记录（最多保留3条）' : '保存失败，请重试');
  };

  const handleSharePlaceholder = () => {
    setActionMessage('分享功能开发中，敬请期待。');
  };

  const clearResultState = (message: string) => {
    setResult(null);
    setError('');
    setActionMessage(message);
    setFullReadExpanded(false);
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
        <h1 className="font-display text-h1 md:text-[44px] text-[#1C1A16]" style={{ letterSpacing: '10px' }}>
          八字分析
        </h1>
        <p className="text-body-sm text-[#1C1A16]/70 mt-3">精准解析生辰八字，揭示命盘奥秘</p>
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
              const cap = isAuth ? MAX_LOGGED_IN_PROFILES : MAX_GUEST_PROFILES;
              const disabled = profiles.length >= cap;
              const tip = disabled
                ? isAuth
                  ? `免费版最多保存${cap}个命盘，升级 VIP 无限制`
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
                label="出生日期（阳历）"
                value={formData.birthDate}
                onChange={(value) => setFormData({ ...formData, birthDate: value })}
                className="space-y-1.5"
                triggerClassName="min-h-[44px] rounded-lg"
              />
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
                className="w-full min-h-[52px] text-[14px] font-medium rounded-xl bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors"
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
                <div className="w-16 h-16 rounded-full bg-[#F2EEE6] flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[#6B7280]" />
                </div>
                <p className="text-[#1C1A16] font-medium text-lg">开始您的命盘解读</p>
                <p className="text-sm text-[#6B7280] mt-2 max-w-[260px]">填写上方出生信息，AI 将生成专属八字解读</p>
                <div className="mt-6 text-left bg-[#FAF9F6] rounded-xl p-4 max-w-[300px] w-full">
                  <p className="text-xs font-medium text-[#1C1A16]/60 mb-2">填写提示</p>
                  <ul className="space-y-1.5 text-xs text-[#1C1A16]/55">
                    <li>• 出生日期：如 1990-01-15</li>
                    <li>• 时辰不确定可选"不知道"</li>
                    <li>• 出生地影响真太阳时计算</li>
                  </ul>
                </div>
              </Card>
            )}

            {result && !loading && basicInfoData && dayMasterInsight && (
              <PageShell width="page" className="px-0 sm:px-0">
              <div ref={resultRef} className="space-y-6 animate-fadeIn" aria-live="polite">
                {result._source !== 'history' && !isMember && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-stone-100 to-stone-100 border border-stone-300/60 px-4 py-3">
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
                          className="rounded-xl border border-stone-400/60 bg-[#FFFBF5] px-4 py-3"
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
                          {aiStreaming && !aiStreamText
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

                  {showAiButton && (
                    <button
                      type="button"
                      onClick={handleStartAiReading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-medium text-sm transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      开始 AI 解读
                    </button>
                  )}

                  {aiStreaming && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-[#1C1A16]/50 mb-4">
                        <RefreshCw className="w-3.5 h-3.5 text-[#1C1A16] animate-spin" />
                        AI 正在解读中…
                      </div>

                      <div ref={streamContainerRef} className="pr-1">
                      {aiStreamText ? (() => {
                        const streamSections = [
                          { title: '一、日主强弱判断', content: parseSection(aiStreamText, ['日主分析']) },
                          { title: '二、性格特征分析', content: parseSection(aiStreamText, ['性格特点', '性格特质']) },
                          { title: '三、事业发展方向', content: parseSection(aiStreamText, ['事业运势', '事业分析']) },
                          { title: '四、财运分析', content: parseSection(aiStreamText, ['财运分析', '财富分析']) },
                          { title: '五、感情婚姻分析', content: parseSection(aiStreamText, ['感情运势', '婚姻分析']) },
                          { title: '六、健康提示', content: parseSection(aiStreamText, ['健康提示', '健康分析']) },
                          { title: '七、当前运势重点', content: parseSection(aiStreamText, ['大运流年', '流年趋势', '当前运势重点', '当前运势']) },
                        ].filter(s => s.content.trim());
                        return streamSections.length > 0 ? (
                          <div>
                            {streamSections.map((section, index) => (
                              <div key={section.title}>
                                {index > 0 && <hr className="border-[#1C1A16]/8 my-6" />}
                                <h4 className="border-l-4 border-[#1C1A16] pl-3 text-base font-semibold mb-3 text-[#8B3A2A]">
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
                            {aiStreamText}
                            <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-[#1C1A16] animate-pulse" />
                            <div ref={streamEndRef} />
                          </div>
                        );
                      })() : (
                        <div className="py-6 flex justify-center">
                          <RefreshCw className="w-6 h-6 text-[#1C1A16] animate-spin" />
                        </div>
                      )}
                      </div>
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
                            className={`border-l-4 border-[#1C1A16] pl-3 font-semibold mb-3 text-[#8B3A2A] ${
                              isDayunSection
                                ? 'text-lg pb-2 border-b border-[#1C1A16]/30'
                                : 'text-base'
                            }`}
                          >
                            {section.title}
                          </h4>
                          {renderSectionContent(section.content)}
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
                                  <p className="mt-1 text-xs text-[#1C1A16]/50">当前流年：{currentLiunian}</p>

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
                    birthDate: formData.birthDate,
                    gender: formData.gender === 'female' ? 'female' : 'male',
                    knowTime: chatBirthHourNum !== undefined,
                    birthHourNum: chatBirthHourNum,
                    birthMinute: formData.knowTime ? formData.birthMinute : 0,
                  }}
                  isLoggedIn={status === 'authenticated'}
                  isVip={isMember}
                />

                {/* 排盘细节模块（确定性命盘数据，置于 AI 问答之后）：十神 / 神煞 / 流年流月 */}
                <Card className={cardClass}>
                  <h3 className="text-base font-semibold text-[#1C1A16] mb-1">十神详解</h3>
                  <p className="text-xs text-brand-gray mb-4">四柱天干十神与日主的关系及含义</p>
                  <ShishenDetailTab pillars={result.pillars} dayGan={result.pillars.day.gan} />
                </Card>

                <Card className={cardClass}>
                  <ShenshaCard shensha={result.shensha} />
                </Card>

                {(result.liunian || (result.liuyue && result.liuyue.length > 0)) && (
                  <Card className={cardClass}>
                    <LiunianLiuyueCard liunian={result.liunian} liuyue={result.liuyue} />
                  </Card>
                )}

                <div className="rounded-2xl bg-[#FDF6F0] p-6 md:p-8">
                  <h3 className="text-lg font-semibold text-[#1C1A16]">情侣缘分测算</h3>
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
                    className="mt-6 w-full sm:w-auto px-8 py-3 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-medium text-sm transition-colors"
                  >
                    输入对方生辰，立即测算 →
                  </button>
                </div>

                {/* 模块C: AI每日运势引流 */}
                <div className="rounded-2xl border-l-4 border-[#1C1A16] bg-white p-6 md:p-8">
                  <h3 className="text-lg font-semibold text-[#1C1A16]">✨ AI 每日运势分析</h3>
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
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-medium text-sm transition-colors whitespace-nowrap"
                    >
                      查看今日 AI 运势 →
                    </button>
                  </div>
                </div>

                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-5 text-center">八字常见问题</h2>
                  <div className="space-y-4">
                    {faqItems.map((item) => (
                      <div key={item.question} className="rounded-2xl border border-[#1C1A16]/8 bg-white px-5 py-4">
                        <p className="text-sm font-semibold text-[#1C1A16] mb-2">{item.question}</p>
                        <p className="text-sm leading-relaxed text-[#1C1A16]/60">{item.answer}</p>
                      </div>
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
                      className="justify-center border border-[#1C1A16]/20 bg-transparent text-[#1C1A16] hover:bg-[#1C1A16]/5"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存命盘
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSharePlaceholder}
                      className="justify-center border border-[#1C1A16]/20 bg-transparent text-[#1C1A16] hover:bg-[#1C1A16]/5"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      分享
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReset}
                      className="justify-center border border-[#1C1A16]/20 bg-transparent text-[#1C1A16] hover:bg-[#1C1A16]/5"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新测算
                    </Button>
                    <Link href="/history" className="w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-center border border-[#1C1A16]/20 bg-transparent text-[#1C1A16] hover:bg-[#1C1A16]/5"
                      >
                        <History className="w-4 h-4 mr-2" />
                        查看历史
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                  {actionMessage && <p className="mt-3 text-sm text-[#6B7280]">{actionMessage}</p>}
                </Card>

                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-5">分享卡片</h2>
                  <ShareCard
                    pillars={result.pillars}
                    dayMaster={dayMasterInsight.title}
                    zodiac={result.zodiac || '未知'}
                    summary={dayMasterInsight.personality.split('。')[0] + '。'}
                    hasHour={hasHourPillar}
                  />
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
