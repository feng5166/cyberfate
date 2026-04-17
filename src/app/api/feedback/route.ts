import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/auth';

const VALID_TYPES = ['suggestion', 'bug', 'experience', 'other'] as const;
type FeedbackType = (typeof VALID_TYPES)[number];

const TYPE_LABEL: Record<FeedbackType, string> = {
  suggestion: '功能建议',
  bug: 'Bug反馈',
  experience: '体验问题',
  other: '其他',
};

// ── 频率限制 ──────────────────────────────────────────────
const MINUTE_LIMIT = 3;
const DAY_LIMIT = 20;
const ipBuckets = new Map<string, { timestamps: number[] }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { ok: boolean } {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < 24 * 60 * 60 * 1000);
  if (
    bucket.timestamps.filter((t) => now - t < 60 * 1000).length >= MINUTE_LIMIT ||
    bucket.timestamps.length >= DAY_LIMIT
  ) {
    ipBuckets.set(ip, bucket);
    return { ok: false };
  }
  bucket.timestamps.push(now);
  ipBuckets.set(ip, bucket);
  return { ok: true };
}

// ── 飞书消息通知 ─────────────────────────────────────────
/**
 * 通过飞书 Bot 发送消息到 Frank 的飞书私聊。
 * 使用 Bot Token 调用飞书开放 API 发送富文本消息。
 *
 * 环境变量：
 *   FEISHU_BOT_APP_ID     — 飞书 App ID（如需要）
 *   FEISHU_BOT_APP_SECRET — 飞书 App Secret（用于获取 tenant_access_token）
 *   FEISHU_USER_OPEN_ID   — Frank 的 open_id（消息接收人）
 */
async function sendFeishuNotification(payload: {
  id: string;
  content: string;
  type?: FeedbackType;
  pageUrl?: string;
  userAgent?: string;
  ip: string;
  userEmail?: string;
  userId?: string;
  createdAt: string;
}): Promise<void> {
  const appId = process.env.FEISHU_BOT_APP_ID;
  const appSecret = process.env.FEISHU_BOT_APP_SECRET;
  const userOpenId = process.env.FEISHU_USER_OPEN_ID;

  if (!appId || !appSecret || !userOpenId) {
    // 未配置飞书时降级为 console.log
    console.log('=== 📝 CyberFate 用户反馈（飞书未配置，降级输出） ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('=== 反馈结束 ===');
    return;
  }

  try {
    // 1. 获取 tenant_access_token
    const tokenParams = new URLSearchParams();
    tokenParams.set('app_id', appId);
    tokenParams.set('app_secret', appSecret);

    const tokenRes = await fetch(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      }
    );
    const tokenData = (await tokenRes.json()) as {
      code: number;
      tenant_access_token?: string;
      msg?: string;
    };
    if (tokenData.code !== 0 || !tokenData.tenant_access_token) {
      console.error('[feedback] feishu token error:', tokenData);
      return;
    }

    // 2. 构建消息内容（使用 text 类型，兼容性最好）
    const typeLabel = payload.type ? TYPE_LABEL[payload.type] : '未分类';
    const userLabel = payload.userEmail ? `${payload.userEmail}` : '匿名';

    const now = new Date(payload.createdAt);
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const textContent = [
      `📝 CyberFate 收到新反馈`,
      ``,
      `类型：${typeLabel}`,
      `内容：${payload.content}`,
      ...(payload.pageUrl ? [`页面：${payload.pageUrl}`] : []),
      `时间：${timeStr}`,
      `用户：${userLabel}`,
      `ID：${payload.id}`,
    ].join('\n');

    // 3. 发送消息（text 类型，使用 URLSearchParams 兼容 Vercel Serverless）
    const msgParams = new URLSearchParams();
    msgParams.set('receive_id', userOpenId);
    msgParams.set('msg_type', 'text');
    msgParams.set('content', JSON.stringify({ text: textContent }));

    const sendRes = await fetch(
      'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.tenant_access_token}`,
        },
        body: msgParams.toString(),
      }
    );
    const sendData = await sendRes.json() as { code: number; msg?: string };
    if (sendData.code !== 0) {
      console.error('[feedback] feishu send error:', sendData);
    }
  } catch (err) {
    console.error('[feedback] feishu notification exception:', err);
  }
}

// ── 主逻辑 ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    const limit = checkRateLimit(ip);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMITED', message: '提交过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      content?: unknown;
      type?: unknown;
      pageUrl?: unknown;
      userAgent?: unknown;
    } | null;

    if (!body || typeof body.content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'CONTENT_EMPTY', message: '反馈内容不能为空' },
        { status: 400 }
      );
    }

    const content = body.content.trim();
    if (content.length === 0) {
      return NextResponse.json(
        { success: false, error: 'CONTENT_EMPTY', message: '反馈内容不能为空' },
        { status: 400 }
      );
    }
    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'CONTENT_TOO_LONG', message: '反馈内容超过 500 字' },
        { status: 400 }
      );
    }

    let type: FeedbackType | undefined;
    if (typeof body.type === 'string' && body.type.length > 0) {
      if (!VALID_TYPES.includes(body.type as FeedbackType)) {
        return NextResponse.json(
          { success: false, error: 'INVALID_TYPE', message: '反馈类型无效' },
          { status: 400 }
        );
      }
      type = body.type as FeedbackType;
    }

    const pageUrl =
      typeof body.pageUrl === 'string' ? body.pageUrl.slice(0, 500) : undefined;
    const userAgent =
      typeof body.userAgent === 'string'
        ? body.userAgent.slice(0, 500)
        : req.headers.get('user-agent') || undefined;

    const session = await getServerSession(authOptions).catch(() => null);
    const userEmail = session?.user?.email || undefined;
    const userId = (session?.user as { id?: string } | undefined)?.id;

    const id = generateFeedbackId();
    const createdAt = new Date().toISOString();

    const record = {
      id,
      content,
      type,
      pageUrl,
      userAgent,
      ip,
      userEmail,
      userId,
      createdAt,
    };

    console.log('[feedback] received:', {
      id,
      type,
      length: content.length,
      userEmail: userEmail || '(anon)',
      ip,
      pageUrl,
    });

    // 异步发送飞书通知（不阻塞响应）
    void sendFeishuNotification(record);

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[feedback] internal error:', err);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

function generateFeedbackId(): string {
  return 'fb_' + crypto.randomBytes(6).toString('hex');
}
