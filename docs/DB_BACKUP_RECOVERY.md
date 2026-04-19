# DB 备份与恢复方案

## 数据库托管方式

**生产环境**：Prisma Postgres（`db.prisma.io`）—— Prisma 托管的 PostgreSQL 服务  
**本地开发**：SQLite（`file:./dev.db`）

---

## 备份策略

### Prisma Postgres 自动备份

Prisma Postgres 提供平台级自动备份（具体保留周期参见 [Prisma 文档](https://www.prisma.io/docs/postgres)）。建议：

- 确认控制台中已启用自动备份
- 重大发布前手动触发 snapshot（通过 Prisma Console 或 CLI）

### 手动备份（pg_dump）

```bash
# 导出完整数据库
pg_dump "$DATABASE_URL" \
  --no-acl --no-owner \
  -Fc -Z 9 \
  -f "backup_$(date +%Y%m%d_%H%M%S).dump"

# 建议：每日定时执行，保留最近 30 天
# 示例 cron（服务器端）：
# 0 3 * * * pg_dump "$DATABASE_URL" -Fc -Z 9 -f /backups/cyberfate_$(date +\%Y\%m\%d).dump
```

### 推荐备份频率

| 环境 | 频率 | 保留周期 |
|------|------|----------|
| 生产 | 每日自动 | 30 天 |
| 生产 | 重大发布前手动 | 永久存档 |
| 暂存 | 按需 | 7 天 |

---

## RTO / RPO 目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **RPO**（最大可接受数据丢失） | ≤ 24 小时 | 每日备份保证 |
| **RTO**（最大可接受恢复时间） | ≤ 2 小时 | pg_restore 单库恢复估算 |

如需更低 RPO，可启用 WAL 归档或升级至 Prisma Postgres 高可用套餐。

---

## 恢复步骤

### 从 pg_dump 文件恢复

```bash
# 1. 创建空数据库（如目标库不存在）
createdb -h <host> -U <user> cyberfate_restore

# 2. 恢复数据
pg_restore \
  --no-acl --no-owner \
  -d "$DATABASE_URL" \
  backup_20260419_030000.dump

# 3. 验证行数
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM orders;"
```

### 从 Prisma Postgres 平台快照恢复

1. 登录 [Prisma Console](https://console.prisma.io)
2. 进入对应项目 → **Backups**
3. 选择目标快照 → **Restore**
4. 恢复完成后更新 `DATABASE_URL` 环境变量（如切换了新实例）

---

## 迁移脚本执行顺序

迁移脚本均位于 `db_migrations/` 目录，**必须按序执行**：

```bash
# 在生产库执行迁移（使用 psql 或 Prisma Studio）
psql "$DATABASE_URL" -f db_migrations/001_add_missing_indexes.sql
psql "$DATABASE_URL" -f db_migrations/002_soft_delete.sql
psql "$DATABASE_URL" -f db_migrations/003_data_integrity.sql
```

> **注意**：执行前先备份。执行后验证约束是否生效：
> ```sql
> SELECT conname, contype FROM pg_constraint WHERE conrelid = 'orders'::regclass;
> ```

---

## 回滚方案

### 002_soft_delete.sql 回滚

```sql
-- 删除 partial indexes
DROP INDEX IF EXISTS idx_tarot_readings_deleted;
DROP INDEX IF EXISTS idx_orders_deleted;

-- 删除新增列（⚠️ 数据不可恢复）
ALTER TABLE "tarot_readings" DROP COLUMN IF EXISTS "deletedAt";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "deletedAt";
```

### 003_data_integrity.sql 回滚

```sql
-- 删除约束（不影响现有数据）
ALTER TABLE "usage_quotas" DROP CONSTRAINT IF EXISTS "chk_baziAiCount_nonneg";
ALTER TABLE "usage_quotas" DROP CONSTRAINT IF EXISTS "chk_tarotSingleCount_nonneg";
ALTER TABLE "usage_quotas" DROP CONSTRAINT IF EXISTS "chk_tarotThreeCount_nonneg";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "chk_amount_positive";
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "chk_expire_after_start";
```

### 001_add_missing_indexes.sql 回滚

```sql
DROP INDEX IF EXISTS idx_subscription_userId_status;
DROP INDEX IF EXISTS idx_order_userId_status;
DROP INDEX IF EXISTS idx_tarot_reading_userId;
```

---

## 注意事项

- 所有 `ALTER TABLE ... ADD CONSTRAINT` 在数据量大时会全表扫描，**建议在低峰期执行**
- `003_data_integrity.sql` 中的约束若现有数据违反，会**执行失败**——执行前需先清洗脏数据
- Soft delete 字段（`deletedAt`）查询时**务必加过滤条件** `WHERE "deletedAt" IS NULL`，避免读取已删除数据
