import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isVip } from '@/lib/subscription';
import { calculateBazi, getCurrentDayun, getDayGanzhi, getLunarDate, getYearGanzhi } from '@/lib/bazi';
import { DAILY_DETAIL_SYSTEM_PROMPT, buildDailyDetailUserPrompt } from '@/lib/ai/prompts-daily-detail';
import { getEnvVar } from '@/lib/utils/api-wrapper';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';

function getBeijingDateString(): string {
  const now = new Date();
  const beijingOffset = 8 * 60 * 60 * 1000;
  const beijingTime = new Date(now.getTime() + beijingOffset);
  return beijingTime.toISOString().split('T')[0];
}

const TIANGAN_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const userId = session.user.id;

  let body: { date?: string } = {};
  try { body = await req.json(); } catch {}
  const targetDate = body.date || getBeijingDateString();

  const vip = await isVip(userId);
  if (!vip) {
    const existing = await prisma.dailyDetailHistory.findUnique({
      where: { userId_date: { userId, date: targetDate } },
    });
    if (existing) {
      return new Response(JSON.stringify({ error: '今日免费次数已用完', code: 'DAILY_LIMIT_REACHED' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { birthDate: true, birthHour: true, gender: true } });
  if (!user?.birthDate || user.birthHour === null || user.birthHour === undefined) {
    return new Response(JSON.stringify({ error: '请先在个人中心填写出生信息', code: 'NO_BIRTH_INFO' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const birthHour = parseInt(user.birthHour || '6', 10);
  const baziResult = calculateBazi({
    birthDate: user.birthDate,
    birthHour: (birthHour === -1 ? 6 : birthHour) as any,
    gender: (user as any).gender || 'male',
  });
  const dayMaster = baziResult.dayMaster;
  const dayMasterElement = TIANGAN_WUXING[dayMaster] || '未知';
  const dayGanzhi = getDayGanzhi(targetDate);
  const lunarDate = getLunarDate(targetDate);
  const yearGanzhi = getYearGanzhi(targetDate);
  const dayunResult = getCurrentDayun(user.birthDate, (user as any).gender || 'male');
  const dayun = `${dayunResult.gan}${dayunResult.zhi}(${dayunResult.wuxing})`;
  const liunian = yearGanzhi;

  const userPrompt = buildDailyDetailUserPrompt({
    dayMaster,
    dayMasterElement,
    dayGanzhi,
    targetDate,
    lunarDate,
    yearGanzhi,
    dayun,
    liunian,
    gender: user.gender || 'male',
  });

  const encoder = new TextEncoder();
  let fullContent = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiKey = getEnvVar('DEEPSEEK_API_KEY');
        if (!apiKey) throw new Error('DEEPSEEK_API_KEY 未配置');

        const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: PRIMARY_MODEL,
            messages: [
              { role: 'system', content: DAILY_DETAIL_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 1500,
            temperature: 0.7,
            enable_thinking: false,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`DeepSeek API error ${response.status}: ${errText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch {}
          }
        }

        const summary = fullContent.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 2).join(' ').slice(0, 100);

        const record = await prisma.dailyDetailHistory.upsert({
          where: { userId_date: { userId, date: targetDate } },
          update: { summary, fullContent, llmModel: PRIMARY_MODEL, generatedAt: new Date() },
          create: { userId, date: targetDate, summary, fullContent, llmModel: PRIMARY_MODEL },
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, id: record.id })}\n\n`));
        controller.close();
      } catch (error: any) {
        console.error('[daily-detail-analysis] Error:', error);

        try {
          const anthropicKey = getEnvVar('ANTHROPIC_API_KEY');
          if (anthropicKey) {
            const fallbackResponse = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1500,
                system: DAILY_DETAIL_SYSTEM_PROMPT,
                messages: [{ role: 'user', content: userPrompt }],
                stream: true,
              }),
            });

            if (fallbackResponse.ok) {
              const reader = fallbackResponse.body?.getReader();
              if (reader) {
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;
                    try {
                      const json = JSON.parse(trimmed.slice(6));
                      if (json.type === 'content_block_delta' && json.delta?.text) {
                        fullContent += json.delta.text;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: json.delta.text })}\n\n`));
                      }
                    } catch {}
                  }
                }

                const summary = fullContent.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 2).join(' ').slice(0, 100);
                const record = await prisma.dailyDetailHistory.upsert({
                  where: { userId_date: { userId, date: targetDate } },
                  update: { summary, fullContent, llmModel: 'claude-sonnet-4-20250514', generatedAt: new Date() },
                  create: { userId, date: targetDate, summary, fullContent, llmModel: 'claude-sonnet-4-20250514' },
                });

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, id: record.id })}\n\n`));
                controller.close();
                return;
              }
            }
          }
        } catch (fallbackError) {
          console.error('[daily-detail-analysis] Fallback error:', fallbackError);
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '分析生成失败，请稍后重试' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
