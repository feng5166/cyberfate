import crypto from 'crypto';
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
import { redis } from '@/lib/cache/redis';
import type { Gender } from '@/lib/bazi/types';

// ── 问题意图分类 ──────────────────────────────────────────
// 时间走势类：需要逐月流月 + 长篇逐月结构化
const TREND_RE = /下半年|上半年|今年|明年|后年|未来|这半年|后半年|半年|全年|几个月|这几个月|每个月|逐月|各月|运势|走势|趋势|流年|流月|年底|年初|季度|\d+\s*月/;
// 深度分析类：命格/六亲/事业财运婚姻等"求解读"问题 → 按维度长篇结构化
const ANALYSIS_RE = /优势|劣势|短板|长处|优点|缺点|格局|命格|命理|十神|用神|喜用|事业|工作|职业|行业|创业|财运|财富|赚钱|婚姻|感情|姻缘|配偶|另一半|对象|健康|身体|性格|脾气|个性|学业|考试|学习|天赋|潜力|适合|方向|建议|如何|怎样|怎么|为什么|为何|提升|改善|改运|特点|特质|六亲|父母|子女|孩子|贵人|桃花|婚期|何时|什么时候/;

type ChatIntent = 'trend' | 'analysis' | 'simple';
function classifyIntent(question: string): ChatIntent {
  if (TREND_RE.test(question)) return 'trend';
  if (ANALYSIS_RE.test(question)) return 'analysis';
  return 'simple';
}

// ── 流月时间窗口解析（trend 类）──────────────────────────────
const CN_NUM: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
  十: 10, 十一: 11, 十二: 12,
};
function parseCnNum(s: string): number | null {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return CN_NUM[s] ?? null;
}

interface LiuyueWindow { start: { year: number; month: number }; months: number }

/** 把"下半年/明年/未来N月/X月"等解析成流月起点 + 月数 */
function resolveLiuyueWindow(q: string, Y: number, M: number): LiuyueWindow {
  if (/后年/.test(q)) return { start: { year: Y + 2, month: 1 }, months: 12 };
  if (/明年/.test(q)) {
    if (/上半年/.test(q)) return { start: { year: Y + 1, month: 1 }, months: 6 };
    if (/下半年|后半年/.test(q)) return { start: { year: Y + 1, month: 7 }, months: 6 };
    return { start: { year: Y + 1, month: 1 }, months: 12 };
  }
  const mN = q.match(/(?:未来|接下来|今后|之后)\s*(\d{1,2}|十[一二]?|[一二三四五六七八九])\s*个月/);
  if (mN) {
    const n = parseCnNum(mN[1]);
    if (n) return { start: { year: Y, month: M }, months: Math.min(12, Math.max(1, n)) };
  }
  if (/下半年|后半年/.test(q)) {
    const s = Math.min(Math.max(M, 7), 12);
    return { start: { year: Y, month: s }, months: 13 - s };
  }
  if (/上半年/.test(q)) {
    if (M <= 6) return { start: { year: Y, month: M }, months: 7 - M };
    return { start: { year: Y, month: 1 }, months: 6 };
  }
  if (/半年/.test(q)) return { start: { year: Y, month: M }, months: 6 };
  if (/今年|全年|这一年/.test(q)) return { start: { year: Y, month: M }, months: 13 - M };
  const mMon = q.match(/(\d{1,2}|十[一二]?|[一二三四五六七八九])\s*月份?/);
  if (mMon) {
    const mm = parseCnNum(mMon[1]);
    if (mm && mm >= 1 && mm <= 12) {
      const yy = mm >= M ? Y : Y + 1;
      return { start: { year: yy, month: mm }, months: 1 };
    }
  }
  // 泛走势：当月起 8 个月
  return { start: { year: Y, month: M }, months: 8 };
}

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

    // 问题意图：trend(走势,逐月) / analysis(深度解读,按维度) / simple(简单)
    const intent = classifyIntent(question);
    const today = beijingToday();
    const curY = Number(today.slice(0, 4));
    const curM = Number(today.slice(5, 7));

    // trend 类解析时间窗口；其余仅当月
    const window: LiuyueWindow = intent === 'trend'
      ? resolveLiuyueWindow(question, curY, curM)
      : { start: { year: curY, month: curM }, months: 1 };
    const liuyueMonths = window.months;
    const liuyueStart = window.start;

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
          today,
          liuyueMonths,
          liuyueStart,
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

    // 结果缓存键：同命盘 + 同问题 + 同窗口 → 复用，省 token（仅在有确定性事实时启用）
    const normQuestion = question.trim().replace(/\s+/g, ' ');
    const cacheKey = promptFacts
      ? `v1:bazi:chat:${crypto.createHash('sha256').update(JSON.stringify({
          b: rawBody?.birthInput ?? null,
          q: normQuestion,
          w: window,
          intent,
        })).digest('hex').slice(0, 24)}`
      : '';

    // 缓存命中：重放工具链步骤 + 缓存答案（分块模拟流式），跳过 DeepSeek 省 token
    if (cacheKey) {
      const cached = await redis.get(cacheKey);
      const cachedText = typeof cached === 'string' ? cached : (cached == null ? '' : String(cached));
      if (cachedText && cachedText.trim().length > 30) {
        const enc = new TextEncoder();
        const replay = new ReadableStream({
          async start(controller) {
            for (const step of toolSteps) {
              if (req.signal.aborted) break;
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: 'step', name: step.name, label: step.label, data: step.data })}\n\n`));
              await sleep(60);
            }
            const CHUNK = 60;
            for (let i = 0; i < cachedText.length && !req.signal.aborted; i += CHUNK) {
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: 'content', content: cachedText.slice(i, i + CHUNK) })}\n\n`));
              await sleep(12);
            }
            controller.enqueue(enc.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });
        return new Response(replay, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Source': 'cache' },
        });
      }
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      logger.error(SERVICE, 'DEEPSEEK_API_KEY not configured');
      return Response.json({ error: '服务配置异常' }, { status: 500 });
    }

    const answerRule =
      intent === 'trend'
        ? `- 本问涉及一段时间的运势走势，请输出**结构化逐月分析**（篇幅可长，约 1000–2000 字），用 Markdown：
  1. \`#\` 标题点题；先「**结论先行**」：一句话概括整体走势（如先扬后抑），并用一个 Markdown 表格列出各月（月份｜流月干支｜主十神｜关键词）
  2. 再「**逐月解析**」：按上方流月事实逐月展开，每月标注【流月干支·主十神】，结合该月地支与命局的刑冲会合、引动神煞，给出运势关键词与可执行建议
  3. 末尾「**核心行动建议**」给 2–3 条`
        : intent === 'analysis'
        ? `- 本问是对命格的深度解读，请输出**按维度的结构化长文**（约 1000–1800 字），用 Markdown：
  1. \`#\` 标题点题；先「**结论先行**」：用一句话给出核心判断，并用一个 Markdown 表格列出 2–4 个关键维度（维度｜核心结论｜命局支撑：引用具体干支/十神/神煞/刑冲/大运）
  2. 再「**逐层拆解**」：每个维度一节（\`##\`），逐条引用确定性事实展开论证，**每个论点都要落到具体的干支/十神/神煞/刑冲/大运上**
  3. 再「**协同与应用**」：说明各维度如何相互作用、最适合的方向或场景
  4. 末尾「**注意事项**」：给出该优势/特点的反面与应对
  5. 善用小标题、表格、列表、少量 emoji 提升可读性`
        : `- 回答简明扼要、口语化，控制在 200 字以内，直接回应问题`;

    const systemPrompt = `你是赛博命理师的AI八字问答助手，擅长把确定性命理事实组织成专业、有层次、可落地的解读。

${promptFacts ? `## 命理推算事实（确定性本地计算，务必以此为唯一依据，不得编造其他命理结论）\n${promptFacts}\n` : ''}## 用户八字命盘
${chartFacts || JSON.stringify({ ...baziData, aiAnalysis: undefined }, null, 2)}${baziData.aiAnalysis ? `\n\n## 已有AI分析摘要\n${baziData.aiAnalysis.slice(0, 2000)}` : ''}

## 回答规则
- 严格基于上方「命理推算事实」与命盘数据回答，引用具体干支/十神/大运/流年/流月/刑冲会合/神煞等推算结论，不得编造未提供的命理结论
${answerRule}
- 使用友好、温暖、专业的口吻
- 涉及投资/疾病/死亡等敏感话题时，给出温和提醒
- 如有困扰请拨打心理援助热线 400-161-9995
- 本产品为文化娱乐，分析仅供参考`;

    const maxTokens =
      intent === 'trend'
        ? (liuyueMonths >= 10 ? 4000 : liuyueMonths >= 6 ? 3500 : liuyueMonths >= 3 ? 2800 : 1800)
        : intent === 'analysis'
        ? 3500
        : 800;

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
        max_tokens: maxTokens,
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

        let fullAnswer = '';
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
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
                }
              } catch {}
            }
          }
          // 写结果缓存（TTL 7 天；仅缓存非空且未被中断的完整答案）
          if (cacheKey && !ac.signal.aborted && fullAnswer.trim().length > 30) {
            try { await redis.set(cacheKey, fullAnswer, { ex: 604800 }); } catch {}
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
