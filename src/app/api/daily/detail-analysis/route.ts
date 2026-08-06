import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isVip } from '@/lib/subscription';
import { calculateBazi, getCurrentDayun, getDayGanzhi, getLunarDate, getYearGanzhi } from '@/lib/bazi';
import { DAILY_DETAIL_SYSTEM_PROMPT, buildDailyDetailUserPrompt } from '@/lib/ai/prompts-daily-detail';
import { PRIMARY_MODEL, FALLBACK_MODEL } from '@/lib/ai/models';
import { getPrimaryProvider } from '@/lib/ai/provider';
import { attachClientAbort } from '@/lib/ai/streamProxy';
import { getTodayBeijing } from '@/lib/timezone';

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
  const targetDate = body.date || getTodayBeijing();

  // 首字节前的三次 DB 查询原为串行（isVip → 当日记录 → 用户资料），hkg1↔DB 跨区下白等两个 RTT。
  // 三者互不依赖，并行取回；多查的那一次（VIP 也查当日记录）不增加墙钟时间
  const [vip, existing, user] = await Promise.all([
    isVip(userId),
    prisma.dailyDetailHistory.findUnique({
      where: { userId_date: { userId, date: targetDate } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { birthDate: true, birthHour: true, gender: true } }),
  ]);

  if (!vip && existing) {
    return new Response(JSON.stringify({ error: '今日免费次数已用完', code: 'DAILY_LIMIT_REACHED' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

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

  const abortHandle = attachClientAbort(req);
  let activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const provider = await getPrimaryProvider();
      try {
        if (!provider) throw new Error('DEEPSEEK_API_KEY 未配置');

        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          signal: abortHandle.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
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
        activeReader = reader;

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
        abortHandle.release();
        controller.close();
      } catch (error: any) {
        console.error('[daily-detail-analysis] Error:', error);

        // M7: fallback 前重置 fullContent，避免主路径残段被拼到 fallback 输出里
        // 同时若主路径已有输出就跳过 fallback，避免向客户端二次喷流
        if (fullContent) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '分析生成失败，请稍后重试' })}\n\n`));
          abortHandle.release();
          controller.close();
          return;
        }
        fullContent = '';

        try {
          if (provider) {
            const fallbackResponse = await fetch(`${provider.baseUrl}/chat/completions`, {
              method: 'POST',
              signal: abortHandle.signal,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`,
              },
              body: JSON.stringify({
                model: FALLBACK_MODEL,
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

            if (fallbackResponse.ok) {
              const reader = fallbackResponse.body?.getReader();
              if (reader) {
                activeReader = reader;
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
                  update: { summary, fullContent, llmModel: FALLBACK_MODEL, generatedAt: new Date() },
                  create: { userId, date: targetDate, summary, fullContent, llmModel: FALLBACK_MODEL },
                });

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, id: record.id })}\n\n`));
                abortHandle.release();
                controller.close();
                return;
              }
            }
          }
        } catch (fallbackError) {
          console.error('[daily-detail-analysis] Fallback error:', fallbackError);
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '分析生成失败，请稍后重试' })}\n\n`));
        abortHandle.release();
        controller.close();
      }
    },
    async cancel() {
      await abortHandle.cancel(activeReader);
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
