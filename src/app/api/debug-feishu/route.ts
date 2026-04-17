import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. 检查环境变量
  const appId = process.env.FEISHU_BOT_APP_ID;
  const appSecret = process.env.FEISHU_BOT_APP_SECRET;
  const userOpenId = process.env.FEISHU_USER_OPEN_ID;

  results.env = {
    FEISHU_BOT_APP_ID: appId ? `${appId.slice(0, 8)}...` : '❌ 未配置',
    FEISHU_BOT_APP_SECRET: appSecret ? `${appSecret.slice(0, 8)}...` : '❌ 未配置',
    FEISHU_USER_OPEN_ID: userOpenId || '❌ 未配置',
  };

  if (!appId || !appSecret) {
    return NextResponse.json({ ...results, error: '缺少 FEISHU_BOT_APP_ID 或 FEISHU_BOT_APP_SECRET' });
  }

  try {
    // 2. 获取 token
    const tokenParams = new URLSearchParams();
    tokenParams.set('app_id', appId);
    tokenParams.set('app_secret', appSecret);

    const tokenRes = await fetch(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      }
    );
    const tokenData = (await tokenRes.json()) as { code: number; tenant_access_token?: string; msg?: string };
    results.tokenResponse = tokenData;

    if (tokenData.code !== 0 || !tokenData.tenant_access_token) {
      return NextResponse.json({ ...results, error: 'Token 获取失败' });
    }

    results.tokenOk = true;

    // 3. 发送测试消息
    if (!userOpenId) {
      return NextResponse.json({ ...results, error: 'FEISHU_USER_OPEN_ID 未配置，跳过发送测试' });
    }

    const msgParams = new URLSearchParams();
    msgParams.set('receive_id', userOpenId);
    msgParams.set('msg_type', 'text');
    msgParams.set('content', JSON.stringify({ text: '🔧 CyberFate 飞书连接测试 - 如果你看到这条消息，说明飞书通知正常！' }));

    const sendRes = await fetch(
      'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.tenant_access_token}`,
        },
        body: msgParams.toString(),
      }
    );
    const sendData = await sendRes.json() as { code: number; msg?: string };
    results.sendResponse = sendData;

    return NextResponse.json({
      ...results,
      success: sendData.code === 0,
      message: sendData.code === 0 ? '✅ 飞书消息发送成功！请检查飞书是否收到。' : `❌ 发送失败: ${sendData.msg}`,
    });
  } catch (err) {
    results.exception = String(err);
    return NextResponse.json({ ...results, error: '异常: ' + String(err) });
  }
}
