import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { getProviderStatus, setActiveProviderId, PROVIDER_IDS, type ProviderId } from '@/lib/ai/provider';

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  return null;
}

// 当前激活 provider + 各 provider 状态（是否配了 key）
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const status = await getProviderStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[admin/llm] GET error:', error);
    return NextResponse.json({ error: '读取 LLM provider 状态失败' }, { status: 500 });
  }
}

// 切换激活 provider：body = { provider: 'deepseek-official' | 'modelverse' }
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const body = await req.json().catch(() => ({}));
    const provider = body?.provider as ProviderId;
    if (!PROVIDER_IDS.includes(provider)) {
      return NextResponse.json(
        { error: `无效的 provider，仅支持：${PROVIDER_IDS.join(' / ')}` },
        { status: 400 },
      );
    }
    await setActiveProviderId(provider);
    const status = await getProviderStatus();
    return NextResponse.json({ ok: true, ...status });
  } catch (error) {
    console.error('[admin/llm] POST error:', error);
    return NextResponse.json({ error: '切换 LLM provider 失败（Redis 是否可用？）' }, { status: 500 });
  }
}
