import { NextResponse } from 'next/server';

export async function GET() {
  const appId = process.env.FEISHU_BOT_APP_ID;
  const appSecret = process.env.FEISHU_BOT_APP_SECRET;
  const userOpenId = process.env.FEISHU_USER_OPEN_ID;

  const steps: unknown[] = [];

  try {
    // Step 1: 检查变量
    steps.push({ step: 1, appId: appId?.slice(0, 20), hasSecret: !!appSecret, openId: userOpenId?.slice(0, 20), openIdLen: userOpenId?.length });

    if (!appId || !appSecret || !userOpenId) {
      return NextResponse.json({ error: 'missing_vars', steps });
    }

    // Step 2: 获取 token
    const tokenRes = await fetch(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_secret }),
      }
    );
    const tokenData = await tokenRes.json();
    steps.push({ step: 2, tokenCode: tokenData.code, tokenMsg: tokenData.msg });

    if (tokenData.code !== 0 || !tokenData.tenant_access_token) {
      return NextResponse.json({ error: 'token_failed', steps, tokenData });
    }

    // Step 3: 构建消息（和 feedback API 完全一致的方式）
    const textContent = [
      '📝 CyberFate 收到新反馈',
      '',
      '类型：功能建议',
      '内容：线上诊断测试 - 请确认收到',
      '页面：/api/debug-feishu',
      '时间：' + new Date().toISOString(),
      '用户：debug',
      'ID：fb_debug_001'
    ].join('\n');

    const requestBody = JSON.stringify({
      receive_id: userOpenId,
      msg_type: 'text',
      content: JSON.stringify({ text: textContent }),
    });

    steps.push({ step: 3, bodyPreview: requestBody.slice(0, 200) });

    // Step 4: 发送消息
    const sendRes = await fetch(
      'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenData.tenant_access_token}`,
        },
        body: requestBody,
      }
    );
    const sendData = await sendRes.json();
    steps.push({ step: 4, sendCode: sendData.code, sendMsg: sendData.msg, messageId: sendData.data?.message_id });

    return NextResponse.json({
      success: sendData.code === 0,
      steps,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    steps.push({ error: String(err) });
    return NextResponse.json({ error: 'exception', steps }, { status: 500 });
  }
}
