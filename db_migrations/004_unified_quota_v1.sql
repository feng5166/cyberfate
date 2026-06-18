-- 统一配额策略 v1：UsageQuota 新增配额列（免费用户主解读/问答各 1 次/天）
-- 纯加列，带默认值 0，可安全在线执行（无锁表风险）。完全幂等，可重复运行。

ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "huangliCount"    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "musicCount"      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "marriageCount"   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "meihuaDrawCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "dailyQaCount"    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "liuyaoQaCount"   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "meihuaQaCount"   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "marriageQaCount" INTEGER NOT NULL DEFAULT 0;

-- 非负约束（幂等：仅在不存在时添加，便于重复执行）
DO $$
DECLARE
  cols TEXT[] := ARRAY['huangliCount','musicCount','marriageCount','meihuaDrawCount','dailyQaCount','liuyaoQaCount','meihuaQaCount','marriageQaCount'];
  c TEXT;
  cname TEXT;
BEGIN
  FOREACH c IN ARRAY cols LOOP
    cname := 'chk_' || c || '_nonneg';
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = cname) THEN
      EXECUTE format('ALTER TABLE "usage_quotas" ADD CONSTRAINT %I CHECK (%I >= 0)', cname, c);
    END IF;
  END LOOP;
END $$;
