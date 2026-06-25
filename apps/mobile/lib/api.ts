import { API_BASE } from './config';
import { useAuth, type AuthUser } from './auth-store';
import type { BirthProfile } from './profile-store';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function authHeaders(): Record<string, string> {
  const token = useAuth.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(res: Response): Promise<never> {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }
  const msg = data?.message || data?.error || `请求失败 (${res.status})`;
  throw new ApiError(msg, res.status, data?.error);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('网络连接失败，请检查网络后重试', 0);
  }
  if (!res.ok) return parseError(res);
  return (await res.json()) as T;
}

/**
 * 调用返回 SSE 流的 route（命理 AI 解读普遍用 buildStream）。
 * M0/M1 不做增量渲染：整段读完后切帧解析，返回 { meta, content }。
 * 帧格式：data: {"meta": {...}} → 多个 data: {"content": "片段"} → data: [DONE]
 */
async function postSSE<M = unknown>(
  path: string,
  body: unknown,
): Promise<{ meta: M | null; content: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('网络连接失败，请检查网络后重试', 0);
  }
  if (!res.ok) return parseError(res);

  const raw = await res.text();
  let meta: M | null = null;
  let content = '';

  for (const block of raw.split('\n\n')) {
    const line = block.trim();
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') break;
    try {
      const obj = JSON.parse(payload);
      if (obj.meta) meta = obj.meta as M;
      if (typeof obj.content === 'string') content += obj.content;
    } catch {
      /* 跳过无法解析的帧 */
    }
  }

  return { meta, content: content.trim() };
}

// ───────────────────────── 认证 ─────────────────────────

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: AuthUser;
}

export function mobileLogin(email: string, password: string) {
  return postJson<LoginResponse>('/auth/mobile-login', { email, password });
}

export function register(email: string, password: string, nickname?: string) {
  return postJson<{ id: string; email: string }>('/auth/register', { email, password, nickname });
}

// ───────────────────────── 八字 ─────────────────────────

export interface Pillar {
  gan: string;
  zhi: string;
  ganWuxing: string;
  zhiWuxing: string;
}

export interface BaziResponse {
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar };
  hasHour: boolean;
  zodiac: string;
  wuxing: Record<string, number>;
  mingGe?: { dayMaster?: string; strength?: string; [k: string]: unknown };
  baziResult?: Record<string, unknown>;
}

export function getBazi(p: BirthProfile) {
  return postJson<BaziResponse>('/bazi', {
    name: p.name || undefined,
    gender: p.gender,
    birthDate: p.birthDate,
    birthHour: p.birthHour,
  });
}

// ───────────────────────── 每日运势 ─────────────────────────

export interface DailyResponse {
  date: string;
  lunarDate: string;
  dayGanzhi: string;
  overall: number;
  overallLabel: string;
  ratings: {
    career: number;
    wealth: number;
    love: number;
    health: number;
    studies: number;
    social: number;
  };
  suitable: string[];
  avoid: string[];
  lucky?: Record<string, unknown>;
  luckyHour?: string;
  advice?: string;
  headline?: string | null;
}

export function getDaily(p: BirthProfile) {
  return postJson<DailyResponse>('/daily', {
    gender: p.gender,
    birthDate: p.birthDate,
    birthHour: p.birthHour,
  });
}

// ───────────────────────── 塔罗（SSE → 缓冲解析）─────────────────────────

export interface TarotCard {
  name_zh?: string;
  name?: string;
  orientation?: 'upright' | 'reversed';
  image_url?: string;
  meaning?: string;
  position?: string;
}

export interface TarotResult {
  reading: string;
  cards: TarotCard[];
  caution?: string;
}

/**
 * 塔罗抽牌。后端返回 text/event-stream：
 *   data: {"meta": {...cards...}}   → 牌面信息
 *   data: {"content": "片段"}        → 解读正文（多帧拼接）
 *   data: [DONE]
 * M0 不做增量渲染：整段读完后切帧解析。
 */
export async function drawTarot(question: string, spread = 'single'): Promise<TarotResult> {
  const { meta, content } = await postSSE<{ cards?: TarotCard[]; caution?: string }>(
    '/tarot/draw',
    { spread, question },
  );
  return { reading: content, cards: meta?.cards ?? [], caution: meta?.caution };
}

// ───────────────────────── GET helper ─────────────────────────

async function getJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeaders() } });
  } catch {
    throw new ApiError('网络连接失败，请检查网络后重试', 0);
  }
  if (!res.ok) return parseError(res);
  return (await res.json()) as T;
}

// ───────────────────────── 紫微斗数 ─────────────────────────

export interface ZiweiPalace {
  name?: string;
  branch?: string;
  stars?: Array<{ name?: string } | string>;
  [k: string]: unknown;
}

export interface ZiweiResponse {
  wuxingju: string;
  mingzhu: string;
  shenzhu: string;
  mingGong?: { name?: string; branch?: string; [k: string]: unknown };
  shenGong?: { name?: string; [k: string]: unknown };
  palaces?: ZiweiPalace[];
  lunar?: { lunarDate?: string };
  name: string;
  birthHourName: string;
}

export function getZiwei(p: BirthProfile) {
  return postJson<ZiweiResponse>('/ziwei', {
    birthDate: p.birthDate,
    gender: p.gender,
    hour: p.birthHour >= 0 ? p.birthHour : 0,
    name: p.name || undefined,
  });
}

// ───────────────────────── 六爻（客户端摇卦 → SSE）─────────────────────────

export interface LiuyaoMeta {
  hexagramName: string;
  upperTrigram?: string;
  lowerTrigram?: string;
  upperSymbol?: string;
  lowerSymbol?: string;
  lines?: Array<{ index: number; type: 'yin' | 'yang'; title?: string; interpretation?: string }>;
  judgment?: string;
  actionAdvice?: { summary?: string; positives?: string[]; cautions?: string[]; actions?: string[] };
}

export interface LiuyaoResult {
  meta: LiuyaoMeta | null;
  reading: string;
}

/** 三枚铜钱摇六爻：6=老阴(动) 7=少阳 8=少阴 9=老阳(动)。 */
export function castLines(): { lines: number[]; movingLines: number[] } {
  const lines: number[] = [];
  const movingLines: number[] = [];
  for (let i = 0; i < 6; i++) {
    const sum = [0, 0, 0].reduce((acc) => acc + (Math.random() < 0.5 ? 2 : 3), 0); // 6..9
    const yang = sum === 7 || sum === 9;
    lines.push(yang ? 1 : 0);
    if (sum === 6 || sum === 9) movingLines.push(i);
  }
  return { lines, movingLines };
}

export async function castLiuyao(question: string): Promise<LiuyaoResult> {
  const { lines, movingLines } = castLines();
  const { meta, content } = await postSSE<LiuyaoMeta>('/liuyao', {
    method: 'coin',
    question,
    hexagrams: { lines, movingLines },
  });
  return { meta, reading: content };
}

// ───────────────────────── 梅花易数（时间起卦 → SSE）─────────────────────────

export interface MeihuaSide {
  guaName?: string;
  upper?: { name?: string };
  lower?: { name?: string };
}

export interface MeihuaMeta {
  guaName?: string;
  changedGuaName?: string;
  movingLine?: number;
  primary?: MeihuaSide;
  changed?: MeihuaSide;
  _source?: string;
}

export interface MeihuaResult {
  meta: MeihuaMeta | null;
  reading: string;
}

export async function drawMeihua(): Promise<MeihuaResult> {
  const { meta, content } = await postSSE<MeihuaMeta>('/meihua/draw', { method: 'time' });
  return { meta, reading: content };
}

// ───────────────────────── 合婚（?ai=1 → JSON）─────────────────────────

export interface MarriageDimension {
  key: string;
  title: string;
  score: number;
  content: string;
}

export interface MarriageResult {
  score: number;
  dimensions: MarriageDimension[];
  advices: string[];
  highlight: string;
  analysis?: string;
}

export function matchMarriage(input: {
  maleName: string;
  maleBirthDate: string;
  maleBirthHour: number;
  femaleName: string;
  femaleBirthDate: string;
  femaleBirthHour: number;
}) {
  return postJson<MarriageResult>('/bazi/marriage?ai=1', {
    maleName: input.maleName || undefined,
    maleBirthDate: input.maleBirthDate,
    maleBirthHour: String(input.maleBirthHour),
    femaleName: input.femaleName || undefined,
    femaleBirthDate: input.femaleBirthDate,
    femaleBirthHour: String(input.femaleBirthHour),
  });
}

// ───────────────────────── 音乐运势签（游客可用 → SSE）─────────────────────────

export interface MusicOracleData {
  songName: string;
  artist: string;
  lyricsQuote: string;
  musicTags?: string[];
  wuxingNote?: string;
  todayGanzhi?: string;
  recordId?: string;
}

export interface MusicOracleResult {
  data: MusicOracleData | null;
  oracleText: string;
}

export async function musicOracle(question: string, birthYear?: number): Promise<MusicOracleResult> {
  const { meta, content } = await postSSE<{ success: boolean; data: MusicOracleData }>(
    '/music-oracle',
    { question, birthYear },
  );
  return { data: meta?.data ?? null, oracleText: content };
}

// ───────────────────────── 黄历（公开 GET）─────────────────────────

export interface HuangliResponse {
  solar: string;
  weekday: string;
  lunarFull: string;
  shengxiao: string;
  dayGanzhi: string;
  dayNayin: string;
  chong: string;
  chongDesc: string;
  sha: string;
  zhiXing: string;
  dayWuxing: string;
  yi: string[];
  ji: string[];
  taishen: string;
  pengzuGan: string;
  pengzuZhi: string;
  xiu: string;
  xiuLuck: string;
  jiShen: string[];
  xiongSha: string[];
  jieqi: string;
}

export function getHuangli(date?: string) {
  return getJson<HuangliResponse>(`/huangli${date ? `?date=${date}` : ''}`);
}

// ───────────────────────── 档案同步 + 追问 ─────────────────────────

/** 本地日期 YYYY-MM-DD（用于运势/黄历的「今日」）。 */
export function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 时辰索引(-1..11) → 代表小时(0-23)，供需要 birthHourNum 的后端用。 */
function shichenToClockHour(birthHour: number): number {
  return birthHour < 0 ? 12 : (birthHour * 2) % 24;
}

/**
 * 把本地出生档案同步到服务端用户记录。
 * 部分功能（如每日运势追问）依赖服务端存储的出生信息，登录后需同步一次。
 */
export async function saveBirthInfo(p: BirthProfile): Promise<void> {
  await postJson<{ success: boolean }>('/user/birth-info', {
    name: p.name || undefined,
    birthDate: p.birthDate,
    birthHour: p.birthHour,
    gender: p.gender,
  });
}

/** 八字追问：携带出生信息重算命盘后回答。SSE。 */
export async function askBazi(p: BirthProfile, question: string): Promise<string> {
  const knowTime = p.birthHour >= 0;
  const { content } = await postSSE('/bazi/chat', {
    question,
    birthInput: {
      birthDate: p.birthDate,
      gender: p.gender,
      knowTime,
      birthHourNum: knowTime ? shichenToClockHour(p.birthHour) : undefined,
      birthMinute: 0,
    },
  });
  return content;
}

/** 每日运势追问：服务端用账号已存的出生信息作答。SSE。需先同步档案。 */
export async function askDaily(question: string): Promise<string> {
  const { content } = await postSSE('/daily/fortune-qa', { question, date: todayStr() });
  return content;
}

/** 黄历追问：按当日黄历作答，无需出生信息。SSE。 */
export async function askHuangli(question: string): Promise<string> {
  const { content } = await postSSE('/huangli/ask', { question, date: todayStr() });
  return content;
}
