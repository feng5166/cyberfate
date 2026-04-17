import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Resend } from 'resend';
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

const MINUTE_LIMIT = 3;
const DAY_LIMIT = 20;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type Bucket = { timestamps: number[] };
const ipBuckets = new Map<string, Bucket>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

function checkRateLimit(ip: string): { ok: boolean } {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < DAY_MS);

  const recentMinute = bucket.timestamps.filter((t) => now - t < MINUTE_MS);
  if (recentMinute.length >= MINUTE_LIMIT) {
    ipBuckets.set(ip, bucket);
    return { ok: false };
  }
  if (bucket.timestamps.length >= DAY_LIMIT) {
    ipBuckets.set(ip, bucket);
    return { ok: false };
  }

  bucket.timestamps.push(now);
  ipBuckets.set(ip, bucket);
  return { ok: true };
}

function generateFeedbackId(): string {
  return 'fb_' + crypto.randomBytes(6).toString('hex');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendFeedbackEmail(payload: {
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
  const to = 'feng5166@gmail.com';

  if (!process.env.RESEND_API_KEY) {
    console.log('=== 用户反馈（开发模式，未配置 RESEND_API_KEY） ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('=== 反馈结束 ===');
    return;
  }

  const typeLabel = payload.type ? TYPE_LABEL[payload.type] : '未分类';
  const subject = `[CyberFate 反馈] ${typeLabel} - ${payload.id}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background: #FAF9F6;">
      <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid rgba(28,26,22,0.06);">
        <h2 style="margin: 0 0 16px; color: #1C1A16; font-size: 18px;">新的用户反馈</h2>
        <p style="margin: 0 0 8px; color: #6B6560; font-size: 13px;">ID: <code>${payload.id}</code></p>
        <p style="margin: 0 0 8px; color: #6B6560; font-size: 13px;">类型: <strong>${typeLabel}</strong></p>
        <p style="margin: 0 0 16px; color: #6B6560; font-size: 13px;">时间: ${payload.createdAt}</p>
        <div style="background: #FAF9F6; border-radius: 8px; padding: 16px; margin: 16px 0; white-space: pre-wrap; color: #1C1A16; font-size: 14px; line-height: 1.6;">${escapeHtml(payload.content)}</div>
        <hr style="border: none; border-top: 1px solid rgba(28,26,22,0.06); margin: 16px 0;" />
        <p style="margin: 0 0 6px; color: #B8B4AE; font-size: 12px;">用户: ${payload.userEmail ? escapeHtml(payload.userEmail) : '(未登录)'}</p>
        ${payload.userId ? `<p style="margin: 0 0 6px; color: #B8B4AE; font-size: 12px;">UID: ${escapeHtml(payload.userId)}</p>` : ''}
        <p style="margin: 0 0 6px; color: #B8B4AE; font-size: 12px;">IP: ${escapeHtml(payload.ip)}</p>
        ${payload.pageUrl ? `<p style="margin: 0 0 6px; color: #B8B4AE; font-size: 12px;">页面: ${escapeHtml(payload.pageUrl)}</p>` : ''}
        ${payload.userAgent ? `<p style="margin: 0 0 6px; color: #B8B4AE; font-size: 12px; word-break: break-all;">UA: ${escapeHtml(payload.userAgent)}</p>` : ''}
      </div>
    </div>
  `.trim();

  const text = [
    `新的用户反馈`,
    `ID: ${payload.id}`,
    `类型: ${typeLabel}`,
    `时间: ${payload.createdAt}`,
    ``,
    `内容:`,
    payload.content,
    ``,
    `用户: ${payload.userEmail || '(未登录)'}`,
    payload.userId ? `UID: ${payload.userId}` : '',
    `IP: ${payload.ip}`,
    payload.pageUrl ? `页面: ${payload.pageUrl}` : '',
    payload.userAgent ? `UA: ${payload.userAgent}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'CyberFate <noreply@cyberfate.me>',
      to: [to],
      subject,
      html,
      text,
      replyTo: payload.userEmail,
    });
    if (error) {
      console.error('[feedback] resend error:', error);
    }
  } catch (err) {
    console.error('[feedback] send email exception:', err);
  }
}

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
          { success: false, error: 'CONTENT_EMPTY', message: '反馈类型无效' },
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

    void sendFeedbackEmail(record);

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[feedback] internal error:', err);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
