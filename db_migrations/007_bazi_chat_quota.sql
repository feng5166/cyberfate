-- 八字 AI 追问免费额度（PRD-BAZI-V2 P1-A：免费登录用户 1 次/日，VIP 不限）
ALTER TABLE "usage_quotas" ADD COLUMN IF NOT EXISTS "baziChatCount" INTEGER NOT NULL DEFAULT 0;
