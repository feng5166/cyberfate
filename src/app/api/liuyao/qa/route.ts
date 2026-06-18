import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getEnvVar } from '@/lib/utils/api-wrapper';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';
import { applyChaos } from '@/lib/chaos-middleware';
import { attachClientAbort } from '@/lib/ai/streamProxy';

export const maxDuration = 60;

interface QaRequestBody {
  question: string;
  hexagramContext: {
    hexagramName: string;
    upperTrigram: string;
    lowerTrigram: string;
    judgment: string;
    originalQuestion: string;
    overallNarrative: string;
    summary: string;
  };
}

function validate(body: unknown): { valid: true; data: QaRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') return { valid: false, error: '请求体不能为空' };
  const b = body as Record<string, unknown>;
  if (typeof b.question !== 'string' || b.question.trim().length === 0) {
    return { valid: false, error: '请输入追问' };
  }
  if (!b.hexagramContext || typeof b.hexagramContext !== 'object') {
    return { valid: false, error: '缺少卦象上下文' };
  }
  const ctx = b.hexagramContext as Record<string, unknown>;
  const stringFields = ['hexagramName', 'upperTrigram', 'lowerTrigram', 'judgment', 'originalQuestion', 'overallNarrative', 'summary'] as const;
  for (const f of stringFields) {
    if (typeof ctx[f] !== 'string') return { valid: false, error: `卦象上下文字段缺失：${f}` };
  }
  return {
    valid: true,
    data: {
      question: (b.question as string).trim().slice(0, 200),
      hexagramContext: {
        hexagramName: ctx.hexagramName as string,
        upperTrigram: ctx.upperTrigram as string,
        lowerTrigram: ctx.lowerTrigram as string,
        judgment: ctx.judgment as string,
        originalQuestion: ctx.originalQuestion as string,
        overallNarrative: ctx.overallNarrative as string,
        summary: ctx.summary as string,
      },
    },
  };
}

function buildSystemPrompt(ctx: QaRequestBody['hexagramContext']): string {
  return `你是六爻占卜分析师。用户已完成一次六爻占卜，现在就卦象进行追问。

卦象背景（不要重复解释这些，直接基于它回答问题）：
- 本卦：${ctx.hexagramName}（上卦${ctx.upperTrigram}·下卦${ctx.lowerTrigram}）
- 卦辞：${ctx.judgment}
- 用户原始问题：${ctx.originalQuestion}
- 综合分析摘要：${ctx.overallNarrative}

回答规则：
- 直接回答用户追问，不要重复卦象基本信息
- 结合六爻理论给出具体的、针对追问的分析
- 200-300字，语气温和客观
- 不做绝对预言，用"建议"、"倾向"等表述
- 只输出回答文字，不要 JSON，不要 markdown 标题`;
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const;

function encodeSse(data: object | string): Uint8Array {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return new TextEncoder().encode(`data: ${payload}\n\n`);
}

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'LOGIN_REQUIRED', message: '请登录后使用' }, { status: 401 });
  }

  const rl = await checkRateLimit('ai_liuyao_qa', session.user.id, 5, 60);
  if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });

  // 统一配额策略 v1：AI 问答免费 1 次/天，VIP 不限
  const { checkLiuyaoQaQuota } = await import('@/lib/quota');
  const qaQuota = await checkLiuyaoQaQuota(session.user.id);
  if (!qaQuota.hasQuota) {
    return NextResponse.json({ error: 'QUOTA_EXCEEDED', message: '今日免费问答次数已用完，升级 VIP 不限量' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const validation = validate(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { question, hexagramContext } = validation.data;
  const systemPrompt = buildSystemPrompt(hexagramContext);

  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  if (!apiKey) {
    return NextResponse.json({ error: 'AI 服务未配置' }, { status: 503 });
  }

  const abortHandle = attachClientAbort(req);

  const upstream = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: abortHandle.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: PRIMARY_MODEL,
      max_tokens: 600,
      temperature: 0.5,
      stream: true,
      enable_thinking: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    }),
  }).catch((err: unknown) => {
    abortHandle.release();
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `AI 请求失败：${msg}` }), { status: 502 });
  });

  if (!upstream.ok || !upstream.body) {
    abortHandle.release();
    let errMsg = 'AI 请求失败';
    try {
      const errText = await upstream.text();
      errMsg = errText.slice(0, 200) || errMsg;
    } catch {}
    return NextResponse.json({ error: errMsg }, { status: 502 });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const ln of lines) {
            const t = ln.trim();
            if (!t || !t.startsWith('data:')) continue;
            const d = t.slice(5).trim();
            if (d === '[DONE]') continue;
            try {
              const json = JSON.parse(d);
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                controller.enqueue(encodeSse({ content: delta }));
              }
            } catch {}
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encodeSse({ error: msg }));
      } finally {
        controller.enqueue(encodeSse('[DONE]'));
        abortHandle.release();
        controller.close();
      }
    },
    async cancel() {
      await abortHandle.cancel(reader);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
