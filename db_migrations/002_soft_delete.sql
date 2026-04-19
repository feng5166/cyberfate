-- P2 DB Schema: Soft delete support for tarot_readings and orders

ALTER TABLE "tarot_readings" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

-- Partial indexes: only index active (non-deleted) rows for common query patterns
CREATE INDEX IF NOT EXISTS idx_tarot_readings_deleted ON "tarot_readings"("userId", "createdAt") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_deleted ON "orders"("userId", "createdAt") WHERE "deletedAt" IS NULL;
