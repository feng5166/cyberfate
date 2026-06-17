import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isUserVip } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';
import { calculateBazi } from '@/lib/bazi/calculator';
import { runBaziToolchain, toolchainToPromptFacts, type ToolStepResult } from '@/lib/bazi/tools';
import type { Gender } from '@/lib/bazi/types';

// 出生信息：用于服务端重算命盘 + 跑真实工具链（不信任前端命盘）
const birthInputSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '出生日期格式应为 YYYY-MM-DD'),
  gender: z.enum(['male', 'female']).optional(),
  birthHourNum: z.number().int().min(0).max(23).optional(),
  birthMinute: z.number().int().min(0).max(59).optional(),
  knowTime: z.boolean().optional(),
}).strict();

/** 北京时间当天 YYYY-MM-DD */
function beijingToday(): string {
  const bj = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return bj.toISOString().slice(0, 10);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

    // 识别「运势走势/某段时间」类问题：需要逐月流月数据 + 长篇结构化输出
    const TREND_INTENT_RE = /下半年|上半年|今年|明年|后年|未来|这半年|后半年|半年|全年|几个月|这几个月|每个月|逐月|各月|运势|走势|趋势|流年|流月|年底|年初|季度|\d+\s*月/;
    const isTrendQuestion = TREND_INTENT_RE.test(question);
    const liuyueMonths = isTrendQuestion ? 8 : 1;

    // 出生信息（可选）：提供后服务端重算命盘并跑真实工具链，得到确定性命理事实
    let toolSteps: ToolStepResult[] = [];
    let promptFacts = '';
    let chartFacts = '';
    const birthParsed = birthInputSchema.safeParse(rawBody?.birthInput);
    if (birthParsed.success) {
      try {
        const b = birthParsed.data;
        const gender: Gender = b.gender === 'female' ? 'female' : 'male';
        const knowTime = b.knowTime !== false && typeof b.birthHourNum === 'number';
        const result = calculateBazi({
          gender,
          birthDate: b.birthDate,
          birthHourNum: knowTime ? b.birthHourNum : undefined,
          birthMinute: knowTime ? b.birthMinute : undefined,
          knowTime,
        });
        toolSteps = runBaziToolchain({
          chart: result.chart,
          birth: { birthDate: b.birthDate, gender, birthHourNum: knowTime ? b.birthHourNum : undefined, birthMinute: knowTime ? b.birthMinute : undefined },
          today: beijingToday(),
          liuyueMonths,
        });
        promptFacts = toolchainToPromptFacts(toolSteps);
        chartFacts = JSON.stringify({
          pillars: result.chart,
          wuxing: result.wuxing,
          dayMaster: result.dayMaster,
          zodiac: result.zodiac,
        }, null, 2);
      } catch (toolErr) {
        const msg = toolErr instanceof Error ? toolErr.message : String(toolErr);
        logger.error(SERVICE, `toolchain error: ${msg}`);
        // 工具链失败不阻断问答，退回纯命盘数据
        toolSteps = [];
        promptFacts = '';
      }
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      logger.error(SERVICE, 'DEEPSEEK_API_KEY not configured');
      return Response.json({ error: '服务配置异常' }, { status: 500 });
    }

    const systemPrompt = `你是赛博命理师的AI八字问答助手。

${promptFacts ? `## 命理推算事实（确定性本地计算，务必以此为依据，不得编造其他命理结论）\n${promptFacts}\n` : ''}## 用户八字命盘
${chartFacts || JSON.stringify({ ...baziData, aiAnalysis: undefined }, null, 2)}${baziData.aiAnalysis ? `\n\n## 已有AI分析摘要\n${baziData.aiAnalysis.slice(0, 2000)}` : ''}

## 回答规则
- 严格基于上方「命理推算事实」与命盘数据回答，引用具体干支/十神/大运/流年/流月/刑冲会合/神煞等推算结论，不得编造未提供的命理结论
${isTrendQuestion
  ? `- 本问涉及一段时间的运势走势，请输出**结构化逐月分析**（篇幅可长，约 1000–2000 字）：
  1. 先「结论先行」：用一句话概括整体走势（如先扬后抑），并点出关键风险月与机会月
  2. 再**逐月解析**：按上方流月事实逐月展开，每月标注【流月干支 · 主要十神】，结合该月地支与命局的刑冲会合、神煞，给出该月运势关键词与具体可执行建议
  3. 最后给 2–3 条核心行动建议
  4. 可用小标题、表格、列表、少量 emoji 提升可读性`
  : `- 回答简明扼要，控制在 200 字以内`}
- 使用友好、温暖的口吻
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
        max_tokens: isTrendQuestion ? 3500 : 800,
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

        // 先逐条推送真实工具链步骤（带轻微节奏，纯展示节奏，结果均为真实计算）
        for (const step of toolSteps) {
          if (ac.signal.aborted) break;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'step', name: step.name, label: step.label, data: step.data })}\n\n`),
          );
          await sleep(150);
        }

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
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
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
