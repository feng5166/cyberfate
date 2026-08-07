import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { calculateHuangli } from '@/lib/huangli/calculator';
import { sanitizeUserInput } from '@/lib/utils/sanitize';
import { applyChaos } from '@/lib/chaos-middleware';
import { logger } from '@/lib/logger';
import { PRIMARY_MODEL } from '@/lib/ai/models';
import { getPrimaryProvider } from '@/lib/ai/provider';
import { attachClientAbort, proxyLLMDeltaStream } from '@/lib/ai/streamProxy';
import { SSE_HEADERS } from '@/lib/ai/sse';

const SERVICE = 'api/huangli/ask';

// 不给 question 设上限：sanitizeUserInput 已截断到 200 字，加 max 会把「超长即截断」变成「超长即 400」
const AskSchema = z.object({
  question: z.string().min(1),
  date: z.string().min(1).max(32),
});

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

  // 先解析 + 校验请求体，再扣配额：原顺序在 body 非法时已扣且不退，用户白丢一次免费额度
  const raw = await req.json().catch(() => null);
  const parsed = AskSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  }
  const { date } = parsed.data;
  const sanitizedQuestion = sanitizeUserInput(parsed.data.question, 200).trim();
  if (!sanitizedQuestion) {
    return NextResponse.json({ error: '问题内容无效' }, { status: 400 });
  }

  // 统一配额策略 v1：黄历 AI 问答免费 1 次/天，VIP 不限。
  // 会员态取自 JWT（isSubscribed），省一次跨区 DB 往返；「刚付费未刷新」由 quota 内部兜底复核
  const userId = session.user.id;
  const { checkHuangliQuota, refundQuota } = await import('@/lib/quota');
  const hlQuota = await checkHuangliQuota(userId, session.user.isSubscribed);
  if (!hlQuota.hasQuota) {
    return NextResponse.json({ error: 'QUOTA_EXCEEDED', message: '今日免费次数已用完，升级 VIP 不限量' }, { status: 429 });
  }
  // VIP 不计数（checkHuangliQuota 直接放行），只有免费用户这一次是真扣了额度
  const quotaConsumed = !hlQuota.isVip;
  // 「一个字都没吐出来就失败」的分支必须退还，否则用户白丢当天唯一一次免费问答。
  // 注意：只覆盖 SSE 开流之前的失败；流开始后中途断开无法再改状态码，也就不退（视作已交付部分内容）
  const refundIfConsumed = async () => {
    if (!quotaConsumed) return;
    try {
      await refundQuota(userId, 'huangliCount');
    } catch (err) {
      logger.error(SERVICE, 'refund huangli quota failed', err instanceof Error ? err : undefined);
    }
  };

  try {
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

    const provider = await getPrimaryProvider();
    if (!provider) {
      logger.error(SERVICE, 'DEEPSEEK_API_KEY not configured');
      await refundIfConsumed();
      return NextResponse.json({ error: '服务配置异常' }, { status: 500 });
    }

    const abortHandle = attachClientAbort(req);

    const apiResponse = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: abortHandle.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 1500,
        temperature: 0.6,
        enable_thinking: false,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!apiResponse.ok || !apiResponse.body) {
      abortHandle.release();
      logger.error(SERVICE, `AI API responded with ${apiResponse.status}`);
      await refundIfConsumed();
      return NextResponse.json({ error: '服务暂时不可用' }, { status: 502 });
    }

    return new Response(proxyLLMDeltaStream(apiResponse, abortHandle, { label: 'huangli/ask' }), { headers: SSE_HEADERS });
  } catch (err) {
    logger.error(SERVICE, 'Huangli ask error', err instanceof Error ? err : undefined);
    await refundIfConsumed();
    return NextResponse.json(
      { error: '抱歉，AI 暂时无法回答。请检查网络连接后重试。' },
      { status: 500 }
    );
  }
}
