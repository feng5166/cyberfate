-- P2 DB Schema: Data integrity constraints

-- UsageQuota count 字段非负约束
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_baziAiCount_nonneg" CHECK ("baziAiCount" >= 0);
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_tarotSingleCount_nonneg" CHECK ("tarotSingleCount" >= 0);
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_tarotThreeCount_nonneg" CHECK ("tarotThreeCount" >= 0);

-- Order amount 正数约束
ALTER TABLE "orders" ADD CONSTRAINT "chk_amount_positive" CHECK (amount > 0);

-- Subscription 日期逻辑约束（expireAt > startAt）
ALTER TABLE "subscriptions" ADD CONSTRAINT "chk_expire_after_start" CHECK ("expireAt" > "startAt");
