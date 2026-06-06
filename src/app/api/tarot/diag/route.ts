import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.DEEPSEEK_API_KEY;
  return NextResponse.json({
    hasKey: !!key,
    keyLen: key?.length ?? 0,
    keyPreview: key ? key.slice(0, 8) + '...' : null,
    baseUrl: process.env.AI_BASE_URL ?? null,
  });
}
