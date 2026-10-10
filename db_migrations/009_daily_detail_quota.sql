-- 每日深度分析额度（免费登录用户 1 次/日，按北京时间生成日计数；VIP 不限）
-- 原实现按「目标日期」查 daily_detail_history 判重，免费用户换日期即可无限生成
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "dailyDetailCount" INTEGER NOT NULL DEFAULT 0;
