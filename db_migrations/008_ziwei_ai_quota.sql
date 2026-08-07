-- 紫微逐宫 AI 解读额度（PRD-ZIWEI-V2 P0-B：免费登录用户 3 宫/日，VIP 不限）
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "ziweiAiCount" INTEGER NOT NULL DEFAULT 0;
