import { NextResponse } from 'next/server';

export async function GET() {
  // 测试1: DNS 解析
  let dnsResult = 'unknown';
  try {
    const dnsStart = Date.now();
    const dnsRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: 'cli_a9296a8b2a615bc4', appSecret: 'bckaWsC4bzt8L7XgAA5RQd7CdrvP7Tj2' }),
    });
    const dnsData = await dnsRes.json();
    const dnsMs = Date.now() - dnsStart;
    dnsResult = JSON.stringify({ code: dnsData.code, msg: dnsData.msg, ms: dnsMs, status: dnsRes.status, headers: Object.fromEntries(dnsRes.headers.entries()) });
  } catch (e) {
    dnsResult = `fetch_error: ${e}`;
  }

  // 测试2: 用另一个 HTTPS 站点对比（确保 fetch 本身能用）
  let httpTest = 'unknown';
  try {
    const httpStart = Date.now();
    const httpRes = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });
    const httpMs = Date.now() - httpStart;
    const httpData = await httpRes.json();
    httpTest = JSON.stringify({ ms: httpMs, status: httpRes.status });
  } catch (e) {
    httpTest = `fetch_error: ${e}`;
  }

  return NextResponse.json({
    feishu: dnsResult,
    httpbin: httpTest,
    timestamp: new Date().toISOString(),
  });
}
