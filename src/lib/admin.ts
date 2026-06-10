/**
 * Admin 鉴权工具函数
 * 统一使用 ADMIN_EMAILS（逗号分隔）环境变量
 */

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.toLowerCase().trim()).filter(Boolean);
  return adminEmails.includes(email.toLowerCase().trim());
}
