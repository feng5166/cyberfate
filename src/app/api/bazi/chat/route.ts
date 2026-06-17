import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isUserVip } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';

// H5: 限定 baziData 的字段与长度，防止 prompt 注入 / 超长上下文
const pillarSchema = z.object({
  gan: z.string().max(8).optional(),
  zhi: z.string().max(8).optional(),
  ganWuxing: z.string().max(8).optional(),
  zhiWuxing: z.string().max(8).optional(),
}).strict().partial();

const baziDataSchema = z.object({
  pillars: z.object({
    year: pillarSchema.optional(),
    month: pillarSchema.optional(),
    day: pillarSchema.optional(),
    hour: pillarSchema.optional(),
  }).strict().partial().optional(),
  wuxing: z.record(z.string().max(20), z.number()).optional(),
  mingGe: z.object({
    geju: z.string().max(100).optional(),
    rizhuStrength: z.string().max(100).optional(),
    yongShen: z.union([z.string().max(100), z.array(z.string().max(50))]).optional(),
    jiShen: z.union([z.string().max(100), z.array(z.string().max(50))]).optional(),
  }).strict().partial().optional(),
  zodiac: z.string().max(20).optional(),
  dayMaster: z.string().max(20).optional(),
  traits: z.array(z.string().max(100)).max(10).optional(),
  fiveDimensions: z.object({
    career: z.number().optional(),
    wealth: z.number().optional(),
    relationship: z.number().optional(),
    health: z.number().optional(),
    studies: z.number().optional(),
  }).strict().partial().optional(),
  aiAnalysis: z.string().max(4000).optional(),
}).strict().partial();

const SERVICE = 'api/bazi/chat';
const DEEPSEEK_BASE_URL = AI_BASE_URL;
const DEEPSEEK_MODEL = PRIMARY_MODEL;

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionErr) {
      const msg = sessionErr instanceof Error ? sessionErr.message : String(sessionErr);
      console.error('[bazi/chat] getServerSession error:', msg);
      return Response.json({ error: '认证服务异常，请刷新重试' }, { status: 503 });
    }

    if (!session?.user?.id) {
      return Response.json({ error: 'LOGIN_REQUIRED', message: '请登录后使用' }, { status: 401 });
    }

    let isVip = false;
    try {
      isVip = await isUserVip(session.user.id);
    } catch (vipErr) {
      const msg = vipErr instanceof Error ? vipErr.message : String(vipErr);
      console.error('[bazi/chat] isUserVip error:', msg);
      return Response.json({ error: '服务暂时不可用，请稍后重试' }, { status: 503 });
    }
    if (!isVip) {
      return Response.json({ error: 'SUBSCRIPTION_REQUIRED', message: '此功能需要订阅会员' }, { status: 403 });
    }

    try {
      const rl = await checkRateLimit('bazi_chat', session.user.id, 20, 60);
      if (!rl.allowed) {
        return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
      }
    } catch (rlErr) {
      const msg = rlErr instanceof Error ? rlErr.message : String(rlErr);
      console.error('[bazi/chat] checkRateLimit error:', msg);
    }

    const rawBody = await req.json();
    const question = rawBody?.question;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return Response.json({ error: '请输入问题' }, { status: 400 });
    }
    if (question.length > 200) {
      return Response.json({ error: '问题不得超过200字' }, { status: 400 });
    }

    // H5: 校验并裁剪 baziData
    const parsed = baziDataSchema.safeParse(rawBody?.baziData ?? {});
    if (!parsed.success) {
      return Response.json({ error: '八字数据格式错误', detail: parsed.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }
    const baziData = parsed.data;

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      logger.error(SERVICE, 'DEEPSEEK_API_KEY not configured');
      return Response.json({ error: '服务配置异常' }, { status: 500 });
    }

    const systemPrompt = `你是赛博命理师的AI八字问答助手。

## 用户八字命盘
${JSON.stringify({ ...baziData, aiAnalysis: undefined }, null, 2)}${baziData.aiAnalysis ? `\n\n## 已有AI分析摘要\n${baziData.aiAnalysis.slice(0, 2000)}` : ''}

## 回答规则
- 基于用户八字命盘数据回答问题
- 使用友好、温暖的口吻
- 回答控制在 200 字以内
- 涉及投资/疾病/死亡等敏感话题时，给出温和提醒
- 如有困扰请拨打心理援助热线 400-161-9995
- 本产品为文化娱乐，分析仅供参考`;

    // H4: AbortController — 客户端断连立即关掉上游，避免烧 token
    const ac = new AbortController();
    const onClientAbort = () => ac.abort();
    req.signal.addEventListener('abort', onClientAbort);

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: ac.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question.trim() },
        ],
        max_tokens: 500,
        temperature: 0.7,
        enable_thinking: false,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      req.signal.removeEventListener('abort', onClientAbort);
      logger.error(SERVICE, `DeepSeek API error: ${response.status}`);
      return Response.json({ error: '服务暂时不可用' }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const upstreamBody = response.body;
    const reader = upstreamBody.getReader();
    const readable = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const data = trimmed.slice(5).trim();
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch {}
            }
          }
        } catch (err) {
          logger.error(SERVICE, 'Stream error', err instanceof Error ? err : undefined);
        } finally {
          req.signal.removeEventListener('abort', onClientAbort);
          controller.close();
        }
      },
      async cancel() {
        ac.abort();
        try { await reader.cancel(); } catch {}
        req.signal.removeEventListener('abort', onClientAbort);
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    logger.error(SERVICE, `Chat API fatal error: ${errMsg}`, error instanceof Error ? error : undefined);
    console.error('[bazi/chat] Fatal error:', errMsg, errStack);
    return Response.json({ error: '服务器错误', detail: errMsg }, { status: 500 });
  }
}
