import { NextResponse } from 'next/server';

export async function GET() {
  const appId = process.env.FEISHU_BOT_APP_ID;
  const appSecret = process.env.FEISHU_BOT_APP_SECRET ? '***configured***' : 'MISSING';
  const userOpenId = process.env.FEISHU_USER_OPEN_ID;

  let tokenTest: unknown = null;
  let sendTest: unknown = null;

  if (appId && process.env.FEISHU_BOT_APP_SECRET && userOpenId) {
    try {
      // 1. 获取 token
      const tokenRes = await fetch(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_id: appId, app_secret: process.env.FEISHU_BOT_APP_SECRET }),
        }
      );
      tokenTest = await tokenRes.json();
      const token = (tokenTest as any)?.tenant_access_token;

      if ((tokenTest as any)?.code === 0 && token) {
        // 2. 发送诊断消息
        const sendRes = await fetch(
          'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              receive_id: userOpenId,
              msg_type: 'text',
              content: JSON.stringify({
                text: '🔧 飞书诊断测试 - 如果你收到这条，说明线上飞书完全正常！',
              }),
            }),
          }
        );
        sendTest = await sendRes.json();
      }
    } catch (e: unknown) {
      tokenTest = { error: String(e) };
    }
  }

  return NextResponse.json({
    env: { appId, appSecret, userOpenId },
    tokenTest,
    sendTest,
    timestamp: new Date().toISOString(),
  });
}
