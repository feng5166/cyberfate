// 飞书机器人通知（给运营发消息）。原先 bazi/stream、feedback、debug-feishu 各存一份
// 「取 tenant_access_token → 发文本消息」的管道，这里统一。各调用方只负责构造文案。

const TOKEN_URL = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
const MESSAGE_URL = 'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id';

/** 是否已配置飞书机器人（App ID/Secret + 接收人 open_id） */
export function feishuConfigured(): boolean {
  return !!(
    process.env.FEISHU_BOT_APP_ID &&
    process.env.FEISHU_BOT_APP_SECRET &&
    process.env.FEISHU_USER_OPEN_ID
  );
}

/**
 * 给运营（FEISHU_USER_OPEN_ID）发一条飞书文本消息。
 * 未配置 / 取 token 失败 / 发送失败均静默返回 false，不抛（通知非关键路径，不应阻断主流程）。
 */
export async function sendFeishuText(text: string): Promise<boolean> {
  const appId = process.env.FEISHU_BOT_APP_ID;
  const appSecret = process.env.FEISHU_BOT_APP_SECRET;
  const openId = process.env.FEISHU_USER_OPEN_ID;
  if (!appId || !appSecret || !openId) return false;

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    const tokenData = (await tokenRes.json()) as { code?: number; tenant_access_token?: string };
    const token = tokenData.tenant_access_token;
    if (!token) return false;

    const res = await fetch(MESSAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ receive_id: openId, msg_type: 'text', content: JSON.stringify({ text }) }),
    });
    return res.ok;
  } catch (e) {
    console.error('[feishu] send failed:', e);
    return false;
  }
}
