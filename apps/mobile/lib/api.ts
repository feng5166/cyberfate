// 流式请求走 expo/fetch（SDK 52+ 的 WinterCG fetch）：RN 全局 fetch 不支持
// ReadableStream，只有它能做到 SSE 逐帧解析；普通 JSON 请求仍用全局 fetch。
import { fetch as fetchStream } from 'expo/fetch';

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

// 默认超时：普通请求 60s；塔罗解读链路更长（抽牌 + 长文生成），放宽到 120s。
const DEFAULT_TIMEOUT_MS = 60_000;
export const TAROT_TIMEOUT_MS = 120_000;

/** 所有请求通用的可选项：超时可覆盖，abort 句柄经回调暴露给调用方（用于手动取消）。 */
export interface RequestOpts {
  timeoutMs?: number;
  onController?: (controller: AbortController) => void;
}

/** SSE 请求可选项：传 onDelta 时逐段上抛增量；不传则保持旧行为（聚合后一次性返回）。 */
export interface SSEOpts<M = unknown> extends RequestOpts {
  onMeta?: (meta: M) => void;
  onDelta?: (chunk: string) => void;
}

function authHeaders(): Record<string, string> {
  const token = useAuth.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 结构化最小依赖：同时兼容全局 Response 与 expo/fetch 的 FetchResponse。
async function parseError(res: { status: number; text(): Promise<string> }): Promise<never> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    /* 读 body 失败时仅用状态码报错 */
  }
  // 服务端错误体约定为 { message?, error? }，解析失败时降级为状态码文案。
  let data: { message?: string; error?: string } | null = null;
  try {
    data = text ? (JSON.parse(text) as { message?: string; error?: string }) : null;
  } catch {
    /* non-JSON body */
  }
  const msg = data?.message || data?.error || `请求失败 (${res.status})`;
  throw new ApiError(msg, res.status, data?.error);
}

/**
 * 带超时的请求上下文：定时器触发 abort 后据 timedOut 区分「超时」与「用户取消」，
 * 两者对 UI 的文案与重试建议不同。
 */
function createRequestContext(opts: RequestOpts) {
  const controller = new AbortController();
  opts.onController?.(controller);
  const limitMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let timedOut = false;
  let timer = setTimeout(onTimeout, limitMs);
  function onTimeout() {
    timedOut = true;
    controller.abort();
  }
  // 流式场景用「静默超时」：每收到一帧就重置计时，避免正常但耗时较久的长文
  // 解读（塔罗/八字动辄上百秒）被固定总时限误杀；只有真正卡住不出帧才判超时。
  const resetTimer = () => {
    if (timedOut || controller.signal.aborted) return;
    clearTimeout(timer);
    timer = setTimeout(onTimeout, limitMs);
  };
  const toError = (err: unknown): ApiError => {
    if (err instanceof ApiError) return err;
    if (controller.signal.aborted) {
      return timedOut
        ? new ApiError('请求超时，请稍后重试', 0, 'TIMEOUT')
        : new ApiError('请求已取消', 0, 'ABORTED');
    }
    return new ApiError('网络连接失败，请检查网络后重试', 0, 'NETWORK');
  };
  return { controller, toError, resetTimer, cleanup: () => clearTimeout(timer) };
}

async function postJson<T>(path: string, body: unknown, opts: RequestOpts = {}): Promise<T> {
  const ctx = createRequestContext(opts);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
      signal: ctx.controller.signal,
    });
    if (!res.ok) return await parseError(res);
    return (await res.json()) as T;
  } catch (err) {
    throw ctx.toError(err);
  } finally {
    ctx.cleanup();
  }
}

/**
 * 调用返回 SSE 流的 route（命理 AI 解读普遍用 buildStream）。
 * 帧格式：data: {"meta": {...}} → 多个 data: {"content": "片段"} → data: [DONE]
 * - 传 opts.onDelta 时逐帧上抛增量（expo/fetch ReadableStream 逐段读取）；
 * - 不传则聚合后一次性返回 { meta, content }，与旧调用方完全兼容。
 * - meta 帧后到者覆盖先到者：服务端塔罗新协议的终帧携带完整结构化结果，
 *   聚合模式下取最后一个 meta 即为完整数据。
 */
async function postSSE<M = unknown>(
  path: string,
  body: unknown,
  opts: SSEOpts<M> = {},
): Promise<{ meta: M | null; content: string }> {
  const ctx = createRequestContext(opts);
  let meta: M | null = null;
  let content = '';

  // 处理一个 SSE 帧块；返回 true 表示遇到 [DONE] 终止信号。
  // 按 SSE 规范逐行取 data: 字段，兼容 \r\n 换行与帧内夹带的注释/event 行。
  const handleFrame = (block: string): boolean => {
    for (const rawLine of block.split('\n')) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return true;
      try {
        // 兼容两套服务端帧命名：老协议 {meta}/{content}，塔罗新协议的
        // 终帧 {result} 与增量 {delta}——后到的结构化帧覆盖先到者。
        const obj = JSON.parse(payload) as {
          meta?: M;
          result?: M;
          content?: string;
          delta?: string;
        };
        const structured = obj.meta ?? obj.result;
        if (structured) {
          meta = structured;
          opts.onMeta?.(structured);
        }
        const piece = typeof obj.content === 'string' ? obj.content : obj.delta;
        if (typeof piece === 'string' && piece) {
          content += piece;
          opts.onDelta?.(piece);
        }
      } catch {
        /* 跳过无法解析的帧 */
      }
    }
    return false;
  };

  try {
    const res = await fetchStream(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
      signal: ctx.controller.signal,
    });
    if (!res.ok) return await parseError(res);

    if (res.body) {
      // 增量路径：按 \n\n 切帧，末段留在 buffer 等待补全。
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;
      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        ctx.resetTimer(); // 有数据进来即视为链路健康
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';
        for (const b of blocks) {
          if (handleFrame(b)) {
            finished = true;
            break;
          }
        }
      }
      if (!finished) {
        buffer += decoder.decode(); // flush 多字节字符的尾部残留（中文正文必需）
        if (buffer) handleFrame(buffer);
      }
      if (finished) {
        // 已收到 [DONE]，主动取消剩余流，尽早释放连接。
        reader.cancel().catch(() => {});
      }
    } else {
      // 兜底：无流式 body 时退回整段缓冲解析（行为等同旧实现）。
      const raw = await res.text();
      for (const block of raw.split('\n\n')) {
        if (handleFrame(block)) break;
      }
    }
  } catch (err) {
    throw ctx.toError(err);
  } finally {
    ctx.cleanup();
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

// ───────────────────────── 塔罗（SSE）─────────────────────────

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
 * 新协议的终帧 meta 携带完整结构化结果，postSSE 取最后一个 meta 即可。
 * 传 opts.onDelta 可增量渲染解读正文。
 */
export async function drawTarot(
  question: string,
  spread = 'single',
  opts: SSEOpts<{ cards?: TarotCard[]; caution?: string }> = {},
): Promise<TarotResult> {
  const { meta, content } = await postSSE<{ cards?: TarotCard[]; caution?: string }>(
    '/tarot/draw',
    { spread, question },
    { timeoutMs: TAROT_TIMEOUT_MS, ...opts },
  );
  return { reading: content, cards: meta?.cards ?? [], caution: meta?.caution };
}

// ───────────────────────── GET helper ─────────────────────────

async function getJson<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const ctx = createRequestContext(opts);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { ...authHeaders() },
      signal: ctx.controller.signal,
    });
    if (!res.ok) return await parseError(res);
    return (await res.json()) as T;
  } catch (err) {
    throw ctx.toError(err);
  } finally {
    ctx.cleanup();
  }
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

export async function castLiuyao(
  question: string,
  opts: SSEOpts<LiuyaoMeta> = {},
): Promise<LiuyaoResult> {
  const { lines, movingLines } = castLines();
  const { meta, content } = await postSSE<LiuyaoMeta>(
    '/liuyao',
    { method: 'coin', question, hexagrams: { lines, movingLines } },
    opts,
  );
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

export async function drawMeihua(opts: SSEOpts<MeihuaMeta> = {}): Promise<MeihuaResult> {
  const { meta, content } = await postSSE<MeihuaMeta>('/meihua/draw', { method: 'time' }, opts);
  return { meta, reading: content };
}

// ───────────────────────── 合婚（默认硬数据 → JSON）─────────────────────────
// 用默认接口（非 ?ai）：确定性评分 + 四柱串，后者是合婚追问 marriage/qa 的必需上下文。

export interface MarriageSide {
  name: string;
  gender: 'male' | 'female';
  zodiac: string;
  dayMaster: string;
  bazi: string;
}

export interface MarriageResult {
  score: number;
  hearts: string;
  level: string;
  maleBazi: string;
  femaleBazi: string;
  male?: MarriageSide;
  female?: MarriageSide;
  details: string[];
  disclaimer?: string;
}

export function matchMarriage(
  input: {
    maleName: string;
    maleBirthDate: string;
    maleBirthHour: number;
    femaleName: string;
    femaleBirthDate: string;
    femaleBirthHour: number;
  },
  opts: RequestOpts = {},
) {
  return postJson<MarriageResult>(
    '/bazi/marriage',
    {
      maleName: input.maleName || undefined,
      maleBirthDate: input.maleBirthDate,
      maleBirthHour: String(input.maleBirthHour),
      femaleName: input.femaleName || undefined,
      femaleBirthDate: input.femaleBirthDate,
      femaleBirthHour: String(input.femaleBirthHour),
    },
    opts,
  );
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

export async function musicOracle(
  question: string,
  birthYear?: number,
  opts: SSEOpts<{ success: boolean; data: MusicOracleData }> = {},
): Promise<MusicOracleResult> {
  const { meta, content } = await postSSE<{ success: boolean; data: MusicOracleData }>(
    '/music-oracle',
    { question, birthYear },
    opts,
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
export async function askBazi(
  p: BirthProfile,
  question: string,
  opts: SSEOpts = {},
): Promise<string> {
  const knowTime = p.birthHour >= 0;
  const { content } = await postSSE(
    '/bazi/chat',
    {
      question,
      birthInput: {
        birthDate: p.birthDate,
        gender: p.gender,
        knowTime,
        birthHourNum: knowTime ? shichenToClockHour(p.birthHour) : undefined,
        birthMinute: 0,
      },
    },
    opts,
  );
  return content;
}

/** 每日运势追问：服务端用账号已存的出生信息作答。SSE。需先同步档案。 */
export async function askDaily(question: string, opts: SSEOpts = {}): Promise<string> {
  const { content } = await postSSE('/daily/fortune-qa', { question, date: todayStr() }, opts);
  return content;
}

/** 黄历追问：按当日黄历作答，无需出生信息。SSE。 */
export async function askHuangli(question: string, opts: SSEOpts = {}): Promise<string> {
  const { content } = await postSSE('/huangli/ask', { question, date: todayStr() }, opts);
  return content;
}

/** 六爻追问：携带卦象上下文。SSE。ctx 七字段后端强校验，均传字符串。 */
export interface LiuyaoQaContext {
  hexagramName: string;
  upperTrigram: string;
  lowerTrigram: string;
  judgment: string;
  originalQuestion: string;
  overallNarrative: string;
  summary: string;
}
export async function askLiuyao(
  ctx: LiuyaoQaContext,
  question: string,
  opts: SSEOpts = {},
): Promise<string> {
  const { content } = await postSSE('/liuyao/qa', { question, hexagramContext: ctx }, opts);
  return content;
}

/** 梅花追问：携带卦象上下文。SSE。primaryGuaName 与 analysis 必填非空。 */
export interface MeihuaQaContext {
  primaryGuaName: string;
  analysis: string;
  changedGuaName?: string;
  originalQuestion?: string;
  overallAdvice?: string;
}
export async function askMeihua(
  ctx: MeihuaQaContext,
  question: string,
  opts: SSEOpts = {},
): Promise<string> {
  const { content } = await postSSE('/meihua/qa', { question, hexagramContext: ctx }, opts);
  return content;
}

/** 合婚追问：携带双方八字上下文。返回普通 JSON { answer }。 */
export interface MarriageQaContext {
  maleBazi: string;
  femaleBazi: string;
  maleName?: string;
  femaleName?: string;
  score?: number;
  level?: string;
}
export async function askMarriage(
  ctx: MarriageQaContext,
  question: string,
  opts: RequestOpts = {},
): Promise<string> {
  const res = await postJson<{ answer?: string }>('/bazi/marriage/qa', { ...ctx, question }, opts);
  return res.answer ?? '';
}
