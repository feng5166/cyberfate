import type { NextRequest } from 'next/server';

/**
 * 从请求头提取客户端 IP（Vercel 部署适配）
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  return (
    (headers instanceof Headers ? headers.get('x-vercel-forwarded-for') : null)?.split(',')[0]?.trim() ||
    (headers instanceof Headers ? headers.get('x-forwarded-for') : null)?.split(',')[0]?.trim() ||
    'unknown'
  );
}
