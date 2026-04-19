-- P2 DB Schema: Add missing indexes for common query patterns
-- NOTE: Prisma already manages composite indexes that cover these patterns via prefix matching:
--   subscriptions: (userId, status, expireAt) covers (userId, status) queries
--   orders:        (userId, status, createdAt) covers (userId, status) queries
--   tarot_readings:(userId, createdAt)         covers (userId) queries
--
-- These standalone indexes are provided for explicit documentation and
-- in case the query planner benefits from narrower index statistics.

CREATE INDEX IF NOT EXISTS idx_subscription_userId_status ON "subscriptions"("userId", "status");
CREATE INDEX IF NOT EXISTS idx_order_userId_status ON "orders"("userId", "status");
CREATE INDEX IF NOT EXISTS idx_tarot_reading_userId ON "tarot_readings"("userId");
