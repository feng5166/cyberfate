import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { calculateHuangli } from '@/lib/huangli/calculator';
import { sanitizeUserInput } from '@/lib/utils/sanitize';
import { withAiTimeout } from '@/lib/ai/withTimeout';
import { withCircuitBreaker } from '@/lib/ai/circuitBreaker';
import { applyChaos } from '@/lib/chaos-middleware';
import { logger } from '@/lib/logger';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';

const SERVICE = 'api/huangli/ask';

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  // Security Fix: SEC-012 — 添加登录检查
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  const rl = await checkRateLimit('ai_huangli', session.user.id, 10, 60);
  if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });

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

    const apiResponse = await withCircuitBreaker('deepseek-huangli-v4pro', () =>
      withAiTimeout(
        (signal) => fetch(`${AI_BASE_URL}/chat/completions`, {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: PRIMARY_MODEL,
            max_tokens: 500,
            temperature: 0.6,
            enable_thinking: false,
            messages: [{ role: 'user', content: prompt }],
          }),
        }),
        15_000
      )
    );

    if (!apiResponse.ok) {
      throw new Error(`AI API responded with ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    const answer = apiData.choices?.[0]?.message?.content || '抱歉，AI 暂时无法回答，请稍后再试。';

    return NextResponse.json({ answer });
  } catch (err) {
    logger.error(SERVICE, 'Huangli ask error', err instanceof Error ? err : undefined);
    return NextResponse.json(
      { answer: '抱歉，AI 暂时无法回答。请检查网络连接后重试。' },
      { status: 500 }
    );
  }
}
