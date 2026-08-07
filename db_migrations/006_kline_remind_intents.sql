-- 换大运提醒意向表（PRD-LIFE-KLINE-V2 P2-B）
-- V2 仅收集意向，通知通道（邮件/push）在 V2.1 选型后按 targetYear 触达。

CREATE TABLE IF NOT EXISTS "kline_remind_intents" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "birthHash"   TEXT NOT NULL,
  "targetYear"  INTEGER NOT NULL,
  "dayunGanZhi" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "kline_remind_intents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "kline_remind_intents_userId_birthHash_targetYear_key"
  ON "kline_remind_intents"("userId", "birthHash", "targetYear");

CREATE INDEX IF NOT EXISTS "kline_remind_intents_targetYear_idx"
  ON "kline_remind_intents"("targetYear");
