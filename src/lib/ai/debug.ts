/**
 * 调试模式：请求带正确的 x-debug-token 头时，绕过登录/限流/配额（仅内部测试用）。
 * 收敛原先散落在各命理路由里对 TAROT_DEBUG_TOKEN 的硬编码判断。
 */
export function isDebugRequest(req: Request): boolean {
  const token = req.headers.get('x-debug-token');
  return !!(token && token === process.env.TAROT_DEBUG_TOKEN);
}
