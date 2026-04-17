import { NextResponse } from 'next/server';

export async function GET() {
  // 直接硬编码测试，排除环境变量问题
  const appId = 'cli_a9296a8b2a615bc4';
  const appSecret = 'bckaWsC4bzt8L7XgAA5RQd7CdrvP7Tj2';
  const userOpenId = 'ou_d89016d494198c864ceb11bdcdb1127a';

  try {
    const tokenRes = await fetch(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, appSecret }),
      }
    );
    const tokenData = await tokenRes.json();

    if (tokenData.code !== 0) {
      return NextResponse.json({ error: 'token_failed', tokenData });
    }

    const textContent = [
      '🔧 硬编码诊断测试',
      '',
      '如果你收到这条，说明 Vercel→飞书完全打通！',
      '时间：' + new Date().toISOString(),
    ].join('\n');

    const sendRes = await fetch(
      'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenData.tenant_access_token}`,
        },
        body: JSON.stringify({
          receive_id: userOpenId,
          msg_type: 'text',
          content: JSON.stringify({ text: textContent }),
        }),
      }
    );
    const sendData = await sendRes.json();

    return NextResponse.json({ success: sendData.code === 0, code: sendData.code, msg: sendData.msg, messageId: sendData.data?.message_id });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
