import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { calculateHuangli } from '@/lib/huangli/calculator';
import { sanitizeUserInput } from '@/lib/utils/sanitize';
import { applyChaos } from '@/lib/chaos-middleware';
import { logger } from '@/lib/logger';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';
import { attachClientAbort } from '@/lib/ai/streamProxy';

const SERVICE = 'api/huangli/ask';

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const { getAuthSession } = await import('@/lib/auth-session');
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  const rl = await checkRateLimit('ai_huangli', session.user.id, 10, 60);
  if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });

  // 统一配额策略 v1：黄历 AI 问答免费 1 次/天，VIP 不限
  const { checkHuangliQuota } = await import('@/lib/quota');
  const hlQuota = await checkHuangliQuota(session.user.id);
  if (!hlQuota.hasQuota) {
    return NextResponse.json({ error: 'QUOTA_EXCEEDED', message: '今日免费次数已用完，升级 VIP 不限量' }, { status: 429 });
  }

  try {
    const { question, date } = await req.json();

    if (!question || !date) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const sanitizedQuestion = sanitizeUserInput(String(question), 200).trim();
    if (!sanitizedQuestion) {
      return NextResponse.json({ error: '问题内容无效' }, { status: 400 });
    }

    const huangli = calculateHuangli(date);

    const prompt = `你是"赛博命理师"的 AI老黄历助手，擅长结合传统黄历数据给出现代生活建议。

当日黄历数据：
- 公历：${huangli.solar}（${huangli.weekday}）
- 农历：${huangli.lunarFull}
- 干支：${huangli.yearGanzhi}年 ${huangli.monthGanzhi}月 ${huangli.dayGanzhi}日
- 日五行：${huangli.dayWuxing}（${huangli.dayNayin}）
- 冲煞：冲${huangli.chongDesc} 煞${huangli.sha}
- 建除：${huangli.zhiXing}日
- 宜：${huangli.yi.join('、')}
- 忌：${huangli.ji.join('、')}
- 吉神：${huangli.jiShen.join('、')}
- 凶神：${huangli.xiongSha.join('、')}

用户问题：${sanitizedQuestion}

【回复规则】
1. 开头直接回答用户的问题（适合/不适合/需注意等）
2. 结合当日的宜忌、五行、冲煞等数据给出理由
3. 结尾给出 1-2 条具体的行动建议
4. 语气温和专业，像一位懂命理的朋友在聊天
5. 字数控制在 100-250 字
6. 纯文本回复，不要用 markdown 格式`;

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      logger.error(SERVICE, 'DEEPSEEK_API_KEY not configured');
      return NextResponse.json({ error: '服务配置异常' }, { status: 500 });
    }

    const abortHandle = attachClientAbort(req);

    const apiResponse = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: abortHandle.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 500,
        temperature: 0.6,
        enable_thinking: false,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!apiResponse.ok || !apiResponse.body) {
      abortHandle.release();
      logger.error(SERVICE, `AI API responded with ${apiResponse.status}`);
      return NextResponse.json({ error: '服务暂时不可用' }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const upstreamBody = apiResponse.body;
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
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {}
            }
          }
        } catch (err) {
          logger.error(SERVICE, 'Stream error', err instanceof Error ? err : undefined);
        } finally {
          abortHandle.release();
          controller.close();
        }
      },
      async cancel() {
        await abortHandle.cancel(reader);
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    logger.error(SERVICE, 'Huangli ask error', err instanceof Error ? err : undefined);
    return NextResponse.json(
      { error: '抱歉，AI 暂时无法回答。请检查网络连接后重试。' },
      { status: 500 }
    );
  }
}
