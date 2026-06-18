-- 统一配额策略 v1：UsageQuota 新增配额列（免费用户主解读/问答各 1 次/天）
-- 纯加列，带默认值 0，可安全在线执行（无锁表风险）。

ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "huangliCount"    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "musicCount"      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "marriageCount"   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "meihuaDrawCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "dailyQaCount"    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "liuyaoQaCount"   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "meihuaQaCount"   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "marriageQaCount" INTEGER NOT NULL DEFAULT 0;

-- 非负约束（与 003 风格一致）
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_huangliCount_nonneg"    CHECK ("huangliCount" >= 0);
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_musicCount_nonneg"      CHECK ("musicCount" >= 0);
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_marriageCount_nonneg"   CHECK ("marriageCount" >= 0);
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_meihuaDrawCount_nonneg" CHECK ("meihuaDrawCount" >= 0);
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_dailyQaCount_nonneg"    CHECK ("dailyQaCount" >= 0);
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_liuyaoQaCount_nonneg"   CHECK ("liuyaoQaCount" >= 0);
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_meihuaQaCount_nonneg"   CHECK ("meihuaQaCount" >= 0);
ALTER TABLE "usage_quotas" ADD CONSTRAINT "chk_marriageQaCount_nonneg" CHECK ("marriageQaCount" >= 0);
