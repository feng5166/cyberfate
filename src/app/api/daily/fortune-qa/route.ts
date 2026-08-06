import { NextRequest } from 'next/server';
import { getAuthSession } from '@/lib/auth-session';
import { checkDailyQaQuota } from '@/lib/quota';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';
import { withCircuitBreaker } from '@/lib/ai/circuitBreaker';
import { PRIMARY_MODEL } from '@/lib/ai/models';
import { getPrimaryProvider } from '@/lib/ai/provider';
import { attachClientAbort, proxyLLMDeltaStream } from '@/lib/ai/streamProxy';
import { SSE_HEADERS } from '@/lib/ai/sse';
import { getTodayBeijing } from '@/lib/timezone';

const SERVICE = 'api/daily/fortune-qa';
const DEEPSEEK_MODEL = PRIMARY_MODEL;

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);

    if (!session?.user?.id) {
      return Response.json({ error: 'LOGIN_REQUIRED', message: '请登录后使用' }, { status: 401 });
    }

    const userId = session.user.id;

    // 统一配额策略 v1：每日运势问答免费 1 次/天，VIP 不限。
    // JWT 里的 isSubscribed 只作提示传入，VIP 判定由 checkDailyQaQuota 内部查 DB 完成 ——
    // 早期用 if (!isVip) 在外层 gate，陈旧的 isSubscribed:true 会让配额检查整个被跳过
    const qaQuota = await checkDailyQaQuota(userId, session.user.isSubscribed);
    if (!qaQuota.hasQuota) {
      return Response.json(
        { error: 'DAILY_LIMIT_REACHED', message: '今日问答次数已用完，升级 Pro 无限提问' },
        { status: 429 }
      );
    }

    const { question, date } = await req.json();
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return Response.json({ error: '请输入问题' }, { status: 400 });
    }
    if (question.length > 300) {
      return Response.json({ error: '问题不得超过300字' }, { status: 400 });
    }

    const provider = await getPrimaryProvider();
    if (!provider) {
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
      fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: abortHandle.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
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

    return new Response(
      proxyLLMDeltaStream(response, abortHandle, {
        // 流读完后落库历史（onComplete 内部错误被 helper 吞，不影响出流）
        onComplete: async (fullAnswer) => {
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
        },
      }),
      { headers: SSE_HEADERS },
    );
  } catch (error) {
    logger.error(SERVICE, 'Fortune QA error', error instanceof Error ? error : undefined);
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}
