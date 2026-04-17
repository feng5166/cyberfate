import { NextResponse } from 'next/server';

export async function GET() {
  // 用 URLSearchParams 方式（form encoded）代替 JSON body
  // 飞书 API 也支持 form 格式
  const params = new URLSearchParams();
  params.set('app_id', 'cli_a9296a8b2a615bc4');
  params.set('app_secret', 'bckaWsC4bzt8L7XgAA5RQd7CdrvP7Tj2');

  let tokenResult: unknown;
  try {
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    tokenResult = await tokenRes.json();
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  if ((tokenResult as any).code !== 0 || !(tokenResult as any).tenant_access_token) {
    return NextResponse.json({ error: 'token_failed', result: tokenResult, method: 'urlencoded' });
  }

  const token = (tokenResult as any).tenant_access_token;

  // 发消息用 text 类型
  const msgBody = new URLSearchParams();
  msgBody.set('receive_id', 'ou_d89016d494198c864ceb11bdcdb1127a');
  msgBody.set('msg_type', 'text');
  msgBody.set('content', JSON.stringify({ text: '🔧 Form-encoded 测试 - 确认能否收到' }));

  let sendResult: unknown;
  try {
    const sendRes = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: msgBody.toString(),
    });
    sendResult = await sendRes.json();
  } catch (e) {
    return NextResponse.json({ error: String(e), tokenOk: true }, { status: 500 });
  }

  return NextResponse.json({
    success: (sendResult as any).code === 0,
    sendResult,
    method: 'urlencoded',
    timestamp: new Date().toISOString(),
  });
}
