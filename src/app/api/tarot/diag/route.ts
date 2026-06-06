import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET() {
  const raw = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.modelverse.cn/v1';

  return NextResponse.json({
    hasRaw: !!raw,
    rawLen: raw?.length ?? 0,
    rawPreview: raw ? raw.slice(0, 8) + '...' : null,
    baseUrl,
    nodeEnv: process.env.NODE_ENV,
    // 列出所有 DEEPSEEK/AI 相关 env
    envKeys: Object.keys(process.env).filter(k => k.includes('DEEPSEEK') || k.includes('AI_') || k.includes('PRIMARY')),
  });
}
