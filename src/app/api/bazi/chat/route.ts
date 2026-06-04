import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isUserVip } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';

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

    const { baziData, question } = await req.json();
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return Response.json({ error: '请输入问题' }, { status: 400 });
    }
    if (question.length > 200) {
      return Response.json({ error: '问题不得超过200字' }, { status: 400 });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      logger.error(SERVICE, 'DEEPSEEK_API_KEY not configured');
      return Response.json({ error: '服务配置异常' }, { status: 500 });
    }

    const systemPrompt = `你是赛博命理师的AI八字问答助手。

## 用户八字信息
${JSON.stringify(baziData, null, 2)}

## 回答规则
- 基于用户八字命盘数据回答问题
- 使用友好、温暖的口吻
- 回答控制在 200 字以内
- 涉及投资/疾病/死亡等敏感话题时，给出温和提醒
- 如有困扰请拨打心理援助热线 400-161-9995
- 本产品为文化娱乐，分析仅供参考`;

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
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
      logger.error(SERVICE, `DeepSeek API error: ${response.status}`);
      return Response.json({ error: '服务暂时不可用' }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const upstreamBody = response.body;
    const readable = new ReadableStream({
      async start(controller) {
        const reader = upstreamBody.getReader();
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
          controller.close();
        }
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
