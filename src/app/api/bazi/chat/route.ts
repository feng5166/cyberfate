import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth-session';
import { isUserVip, atomicCheckAndConsume, refundQuota } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { PRIMARY_MODEL } from '@/lib/ai/models';
import { getPrimaryProvider } from '@/lib/ai/provider';
import { attachClientAbort, proxyLLMDeltaStream } from '@/lib/ai/streamProxy';
import { SSE_HEADERS } from '@/lib/ai/sse';
import { calculateBazi } from '@/lib/bazi/calculator';
import { runBaziToolchain, toolchainToPromptFacts, type ToolStepResult } from '@/lib/bazi/tools';
import { redis } from '@/lib/cache/redis';
import type { Gender } from '@/lib/bazi/types';
import { getBeijingDate } from '@/lib/timezone';

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

// ── analysis 领域细化：每个领域指明"该看哪些命理要素" ──────────────
interface AnalysisDomain {
  key: string;
  label: string;
  test: RegExp;
  focus: string;
}

// 顺序即优先级：具体领域在前，综合兜底在后
const ANALYSIS_DOMAINS: AnalysisDomain[] = [
  {
    key: 'career', label: '事业',
    test: /事业|工作|职业|职场|升职|升迁|晋升|前途|发展|创业|官运|事业编|体制|跳槽|换工作|事业方向/,
    focus: '聚焦官杀(事业/权力/约束/上司)、食伤(才华/技术/表达)、正偏财(事业变现)、印星(平台/资源/学历靠山)、月柱(事业宫)与当前大运十神；区分体制管理路线(重官印)与创业技术路线(重食伤财)。结合地支刑冲会合看事业波动、合作与小人风险。',
  },
  {
    key: 'wealth', label: '财运',
    test: /财运|财富|钱财|赚钱|求财|发财|进财|破财|投资|理财|偏财|正财|收入|财库|生意|经商/,
    focus: '聚焦正财(稳定正职收入)、偏财(机会/投资/副业/外财)、食伤生财(以才华手艺生财)、比劫(竞争/破财/合伙散财)、财星是否居用神之位与财库藏蓄；结合大运流年看财运起伏、聚散与最佳求财方式。',
  },
  {
    key: 'marriage', label: '婚姻感情',
    test: /婚姻|感情|姻缘|配偶|对象|另一半|伴侣|老公|老婆|妻子|丈夫|结婚|婚期|正缘|脱单|恋爱|桃花|离婚|复合|何时.*婚|什么时候.*婚/,
    focus: '聚焦夫妻宫(日支)的稳定度与刑冲合害、配偶星(男命以财星为妻、女命以官杀为夫)的旺衰与所在柱位、桃花/红艳等感情神煞；据此判断正缘特征、相处模式、婚姻宫受损与否、宜早婚或晚婚，并结合大运流年引动配偶星/夫妻宫推断感情或婚姻应期。',
  },
  {
    key: 'health', label: '健康',
    test: /健康|身体|疾病|病|养生|体质|寿|精力|肝|心|脾|肺|肾/,
    focus: '聚焦五行的偏枯与受克(金主肺/大肠、木主肝胆、水主肾/泌尿、火主心/血、土主脾胃)、日主强弱、忌神所在与刑冲对健康宫的冲击；指出需重点调养的脏腑与作息方向。仅作养生提醒，不作医疗诊断。',
  },
  {
    key: 'study', label: '学业考试',
    test: /学业|学习|考试|读书|升学|高考|考研|考公|考证|功名|文凭|学历|成绩/,
    focus: '聚焦印星(学习力/记忆/文凭)、文昌/太极/华盖等利学神煞、食伤(才思/创造/发挥)、官印相生(考试功名)；结合当前大运是否走印运/官运，判断学业与考试的节奏与有利时段。',
  },
  {
    key: 'children', label: '子女',
    test: /子女|孩子|生育|怀孕|要孩子|几个孩子|儿女|后代/,
    focus: '聚焦时柱(子女宫)的旺衰刑冲、子女星(男命以官杀为子、女命以食伤为子)的状态、相关神煞；据此判断子女缘分厚薄、早晚与相处，并结合大运流年看生育有利时段。',
  },
  {
    key: 'relatives', label: '六亲',
    test: /父母|母亲|父亲|爸|妈|兄弟|姐妹|家人|六亲|家庭关系/,
    focus: '聚焦印星(母)、财星(父)、比劫(兄弟姐妹)及其所在宫位的旺衰与刑冲生克；据此说明与各六亲的缘分厚薄、助力与相处。',
  },
  {
    key: 'suit', label: '适合方向',
    test: /适合.*行业|适合.*工作|行业|开运|方位|颜色|幸运|喜用|忌讳|改运|风水|发展方向|去哪/,
    focus: '先据日主强弱与命局定出喜用神五行，再据用神映射到落地建议：行业(木→文教/木材/服装；火→能源/电子/餐饮；土→地产/农牧/建筑；金→金融/机械/五金；水→贸易/流通/物流)、方位(木东/火南/土中/金西/水北)、颜色与数字。',
  },
  {
    key: 'personality', label: '性格天赋',
    test: /性格|个性|脾气|为人|天赋|才华|特质|心性|内向|外向|人缘|情商/,
    focus: '聚焦日主五行本性与月令旺衰、十神组合(食伤主才华表达、官杀主自律责任、比劫主行动竞争、印主内敛沉稳)、利才神煞(华盖主孤高才艺、文昌主聪慧)与日主强弱；归纳性格优势、短板与相处/扬长避短建议。',
  },
  {
    key: 'timing', label: '应期时机',
    test: /何时|什么时候|几岁|哪一年|哪年|应期|时机|转运|时来运转/,
    focus: '聚焦与问题相关的用神星(婚=配偶星/夫妻宫、事业=官印、财=财星)被大运流年引动(合冲会刑)的年份，结合当前大运给出大致应期区间，强调命理应期仅供参考、需结合现实努力。',
  },
  {
    key: 'general', label: '命格综合',
    test: /.*/,
    focus: '综合格局、日主强弱、喜用忌神、最突出的十神与神煞贵人，归纳命格的核心结构。问优势则突出吉神/得用十神/有利组合(可提炼"核心铁三角")；问劣势/短板则突出忌神、刑冲、凶煦与失衡处，并给出补救方向。',
  },
];

function resolveAnalysisDomain(question: string): AnalysisDomain {
  return ANALYSIS_DOMAINS.find(d => d.test.test(question)) ?? ANALYSIS_DOMAINS[ANALYSIS_DOMAINS.length - 1];
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
  const bj = getBeijingDate();
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
const DEEPSEEK_MODEL = PRIMARY_MODEL;

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await getAuthSession(req);
    } catch (sessionErr) {
      const msg = sessionErr instanceof Error ? sessionErr.message : String(sessionErr);
      console.error('[bazi/chat] getAuthSession error:', msg);
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
    // 三层门禁（PRD-BAZI-V2 P1-A）：VIP 不限；免费登录 1 次/日；超限引导订阅
    if (!isVip) {
      const quota = await atomicCheckAndConsume(session.user.id, 'baziChatCount', 1, false);
      if (!quota.hasQuota) {
        return Response.json(
          { error: 'SUBSCRIPTION_REQUIRED', message: '今日 1 次免费追问已用完，会员不限次' },
          { status: 403 },
        );
      }
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

    // analysis 类细化到具体领域（事业/财运/婚姻/健康…）
    const domain = intent === 'analysis' ? resolveAnalysisDomain(question) : null;

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
    let promptGender = '';
    const birthParsed = birthInputSchema.safeParse(rawBody?.birthInput);
    if (birthParsed.success) {
      try {
        const b = birthParsed.data;
        const gender: Gender = b.gender === 'female' ? 'female' : 'male';
        promptGender = gender === 'female' ? '女' : '男';
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
        // 缓存命中不应消耗免费追问次数（与 stream 路由「缓存命中不扣配额」策略一致）
        if (!isVip) {
          try { await refundQuota(session.user.id, 'baziChatCount'); } catch {}
        }
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

    const provider = await getPrimaryProvider();
    if (!provider) {
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
        ? `- 本问聚焦【${domain?.label ?? '命格综合'}】，请输出**按维度的结构化长文**（约 1000–1800 字），用 Markdown：
  · 分析要领（务必据此选择展开的维度，并逐条落到命理事实上）：${domain?.focus ?? ''}
  1. \`#\` 标题点题；先「**结论先行**」：用一句话给出核心判断，并用一个 Markdown 表格列出 2–4 个关键维度（维度｜核心结论｜命局支撑：引用具体干支/十神/神煞/刑冲/大运）
  2. 再「**逐层拆解**」：每个维度一节（\`##\`），逐条引用确定性事实展开论证，**每个论点都要落到具体的干支/十神/神煞/刑冲/大运上**，不泛泛而谈
  3. 再「**协同与应用**」：说明各维度如何相互作用，并给出可落地的方向或建议
  4. 末尾「**注意事项**」：给出反面风险与应对
  5. 善用小标题、表格、列表、少量 emoji 提升可读性`
        : `- 回答简明扼要、口语化，控制在 200 字以内，直接回应问题`;

    const systemPrompt = `你是赛博命理师的AI八字问答助手，擅长把确定性命理事实组织成专业、有层次、可落地的解读。

${promptGender ? `## 命主性别：${promptGender}（配偶星：男命以财星为妻、女命以官杀为夫；子女星：男命以官杀、女命以食伤）\n` : ''}${promptFacts ? `## 命理推算事实（确定性本地计算，务必以此为唯一依据，不得编造其他命理结论）\n${promptFacts}\n` : ''}## 用户八字命盘
${chartFacts || JSON.stringify({ ...baziData, aiAnalysis: undefined }, null, 2)}${baziData.aiAnalysis ? `\n\n## 已有AI分析摘要\n${baziData.aiAnalysis.slice(0, 2000)}` : ''}

## 回答规则
- 严格基于上方「命理推算事实」与命盘数据回答，引用具体干支/十神/大运/流年/流月/刑冲会合/神煞等推算结论，不得编造未提供的命理结论
${answerRule}
- 使用友好、温暖、专业的口吻
- 涉及投资/疾病/死亡等敏感话题时，给出温和提醒
- 本产品为文化娱乐，分析仅供参考`;

    // 上限只作安全兜底，实际长度由 prompt 控制；宁可给足余量，不让回复因 max_tokens 截断
    const maxTokens =
      intent === 'trend'
        ? (liuyueMonths >= 10 ? 6000 : liuyueMonths >= 6 ? 5000 : liuyueMonths >= 3 ? 4000 : 3000)
        : intent === 'analysis'
        ? 6000
        : 2000;

    // 客户端断连立即关掉上游，避免烧 token
    const abortHandle = attachClientAbort(req);

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
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
        max_tokens: maxTokens,
        temperature: 0.7,
        enable_thinking: false,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      abortHandle.release();
      logger.error(SERVICE, `DeepSeek API error: ${response.status}`);
      return Response.json({ error: '服务暂时不可用' }, { status: 502 });
    }

    return new Response(
      proxyLLMDeltaStream(response, abortHandle, {
        // 工具链步骤先逐条推送作「推算中」动画（结果均为真实计算）
        prefixFrames: toolSteps.map((step) => ({
          frame: { type: 'step', name: step.name, label: step.label, data: step.data },
          delayMs: 150,
        })),
        contentFrame: (content) => ({ type: 'content', content }),
        // 免费追问（1 次/日）回答尾部追加升级引导（PRD-BAZI-V2 P1-A，仅非 VIP）
        suffixFrames: isVip
          ? undefined
          : [{ type: 'content', content: '\n\n---\n今日免费追问已用完，[会员不限次继续问 →](/pricing)' }],
        label: 'bazi/chat',
        // 流读完且未被中断、未被截断的完整答案 → 写结果缓存（TTL 7 天）
        onComplete: async (fullAnswer, aborted, truncated) => {
          if (cacheKey && !aborted && !truncated && fullAnswer.trim().length > 30) {
            try { await redis.set(cacheKey, fullAnswer, { ex: 604800 }); } catch {}
          }
        },
      }),
      { headers: SSE_HEADERS },
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    logger.error(SERVICE, `Chat API fatal error: ${errMsg}`, error instanceof Error ? error : undefined);
    console.error('[bazi/chat] Fatal error:', errMsg, errStack);
    return Response.json({ error: '服务器错误', detail: errMsg }, { status: 500 });
  }
}
