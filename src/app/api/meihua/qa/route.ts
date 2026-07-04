import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { PRIMARY_MODEL } from '@/lib/ai/models';
import { getPrimaryProvider } from '@/lib/ai/provider';
import { applyChaos } from '@/lib/chaos-middleware';
import { attachClientAbort } from '@/lib/ai/streamProxy';

export const maxDuration = 60;

interface QaRequestBody {
  question: string;
  hexagramContext: {
    primaryGuaName: string;
    changedGuaName?: string;
    analysis: string;
    originalQuestion: string;
    overallAdvice?: string;
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
  if (typeof ctx.primaryGuaName !== 'string' || ctx.primaryGuaName.trim().length === 0) {
    return { valid: false, error: '卦象上下文字段缺失：primaryGuaName' };
  }
  if (typeof ctx.analysis !== 'string' || ctx.analysis.trim().length === 0) {
    return { valid: false, error: '卦象上下文字段缺失：analysis' };
  }
  return {
    valid: true,
    data: {
      question: (b.question as string).trim().slice(0, 200),
      hexagramContext: {
        primaryGuaName: ctx.primaryGuaName as string,
        changedGuaName: typeof ctx.changedGuaName === 'string' ? ctx.changedGuaName : undefined,
        analysis: ctx.analysis as string,
        originalQuestion: typeof ctx.originalQuestion === 'string' ? ctx.originalQuestion : '（未填写）',
        overallAdvice: typeof ctx.overallAdvice === 'string' ? ctx.overallAdvice : undefined,
      },
    },
  };
}

function buildSystemPrompt(ctx: QaRequestBody['hexagramContext']): string {
  const changedPart = ctx.changedGuaName ? `  变卦：${ctx.changedGuaName}` : '';
  const advicePart = ctx.overallAdvice ? `- 已有解读摘要：${ctx.overallAdvice.slice(0, 400)}` : '';
  return `你是梅花易数占卜分析师，精通体用互变、五行生克、卦辞爻辞解读。用户已完成一次梅花易数起卦，现在就卦象进行追问。

卦象背景（不要重复解释这些，直接基于它回答问题）：
- 本卦：${ctx.primaryGuaName}${changedPart}
- 卦象分析：${ctx.analysis}
- 用户原始问题：${ctx.originalQuestion}
${advicePart}

回答规则：
- 直接回答用户追问，不要重复上面已有的卦象基本信息
- 结合梅花易数理论（体用生克、五行、爻辞）给出具体的、针对追问的深度分析
- 300-400字，语气温和客观，文笔流畅
- 引用相关卦辞/爻辞原文加强说服力（如果适用）
- 不做绝对预言，用"建议"、"倾向"、"从卦象来看"等表述
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

  const { getAuthSession } = await import('@/lib/auth-session');
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'LOGIN_REQUIRED', message: '请登录后使用' }, { status: 401 });
  }

  const rl = await checkRateLimit('ai_meihua_qa', session.user.id, 5, 60);
  if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });

  // 统一配额策略 v1：AI 问答免费 1 次/天，VIP 不限
  const { checkMeihuaQaQuota } = await import('@/lib/quota');
  const qaQuota = await checkMeihuaQaQuota(session.user.id);
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

  const provider = await getPrimaryProvider();
  if (!provider) {
    return NextResponse.json({ error: 'AI 服务未配置' }, { status: 503 });
  }

  const abortHandle = attachClientAbort(req);

  const upstream = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    signal: abortHandle.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
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
