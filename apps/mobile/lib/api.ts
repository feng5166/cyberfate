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
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/tarot/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ spread, question }),
    });
  } catch {
    throw new ApiError('网络连接失败，请检查网络后重试', 0);
  }
  if (!res.ok) return parseError(res);

  const raw = await res.text();
  let meta: { cards?: TarotCard[]; caution?: string } | null = null;
  let content = '';

  for (const block of raw.split('\n\n')) {
    const line = block.trim();
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') break;
    try {
      const obj = JSON.parse(payload);
      if (obj.meta) meta = obj.meta;
      if (typeof obj.content === 'string') content += obj.content;
    } catch {
      /* 跳过无法解析的帧 */
    }
  }

  return { reading: content.trim(), cards: meta?.cards ?? [], caution: meta?.caution };
}
