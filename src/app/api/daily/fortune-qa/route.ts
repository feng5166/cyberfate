import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isUserVip } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';
import { withCircuitBreaker } from '@/lib/ai/circuitBreaker';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';
import { attachClientAbort } from '@/lib/ai/streamProxy';
import { getTodayBeijing } from '@/lib/timezone';

const SERVICE = 'api/daily/fortune-qa';
const DEEPSEEK_BASE_URL = AI_BASE_URL;
const DEEPSEEK_MODEL = PRIMARY_MODEL;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: 'LOGIN_REQUIRED', message: '请登录后使用' }, { status: 401 });
    }

    const userId = session.user.id;
    const isVip = await isUserVip(userId);

    // 免费用户 3次/天，Pro 无限
    if (!isVip) {
      const rl = await checkRateLimit('daily_fortune_qa', userId, 3, 86400);
      if (!rl.allowed) {
        return Response.json(
          { error: 'DAILY_LIMIT_REACHED', message: '今日问答次数已用完，升级 Pro 无限提问' },
          { status: 429 }
        );
      }
    }

    const { question, date } = await req.json();
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return Response.json({ error: '请输入问题' }, { status: 400 });
    }
    if (question.length > 300) {
      return Response.json({ error: '问题不得超过300字' }, { status: 400 });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      logger.error(SERVICE, 'DEEPSEEK_API_KEY not configured');
      return Response.json({ error: '服务配置异常' }, { status: 500 });
    }

    // 读取用户八字 profile
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true, birthHour: true, gender: true },
    });

    if (!profile || !profile.birthDate) {
      return Response.json(
        { error: 'NO_BIRTH_INFO', message: '请先在个人中心填写出生信息' },
        { status: 400 }
      );
    }

    const targetDate = date || getTodayBeijing();

    const systemPrompt = `你是赛博命理师的 AI 运势问答助手。

## 用户八字信息
- 出生日期：${profile.birthDate}
- 出生时辰：${profile.birthHour}时
- 性别：${profile.gender === 'male' ? '男' : '女'}
- 日期：${targetDate}

## 回答规则
- 基于用户八字和当日天干地支信息，回答运势相关问题
- 使用友好、温暖、专业的口吻
- 回答控制在 300 字以内，重点突出
- 可以给出具体建议和注意事项
- 只回答运势/命理/生活建议相关问题
- 如果用户问政治/医疗/违法等越界问题，温和拒绝并引导回运势话题
- 涉及投资/疾病等敏感话题时，给出温和提醒
- 本产品为文化娱乐，分析仅供参考`;

    const abortHandle = attachClientAbort(req);

    const response = await withCircuitBreaker('deepseek-fortune-qa-v4pro', () =>
      fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        signal: abortHandle.signal,
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
          max_tokens: 1200,
          temperature: 0.7,
          enable_thinking: false,
          stream: true,
        }),
      })
    );

    if (!response.ok || !response.body) {
      abortHandle.release();
      logger.error(SERVICE, `DeepSeek API error: ${response.status}`);
      return Response.json({ error: '服务暂时不可用' }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const upstreamBody = response.body;
    const reader = upstreamBody.getReader();
    let fullAnswer = '';

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
                  fullAnswer += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch {}
            }
          }

          // 写入历史记录
          try {
            await prisma.dailyFortuneQaHistory.create({
              data: {
                userId,
                question: question.trim(),
                answer: fullAnswer || null,
                llmModel: DEEPSEEK_MODEL,
              },
            });
          } catch (dbErr) {
            logger.error(SERVICE, 'Failed to save QA history', dbErr instanceof Error ? dbErr : undefined);
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
  } catch (error) {
    logger.error(SERVICE, 'Fortune QA error', error instanceof Error ? error : undefined);
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}
