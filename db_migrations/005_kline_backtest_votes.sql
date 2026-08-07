-- 人生K线回测投票表（PRD-LIFE-KLINE-V2 P0-A）
-- 「准」占比 ≥55% 是传播推广的护栏指标，数据源即此表。

CREATE TABLE IF NOT EXISTS "kline_backtest_votes" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "birthHash" TEXT NOT NULL,
  "year"      INTEGER NOT NULL,
  "age"       INTEGER NOT NULL,
  "score"     INTEGER NOT NULL,
  "level"     TEXT NOT NULL,
  "kind"      TEXT NOT NULL,
  "vote"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "kline_backtest_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "kline_backtest_votes_userId_birthHash_year_key"
  ON "kline_backtest_votes"("userId", "birthHash", "year");

CREATE INDEX IF NOT EXISTS "kline_backtest_votes_createdAt_idx"
  ON "kline_backtest_votes"("createdAt");
