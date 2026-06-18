# 数据库迁移约定

本目录存放**原始 SQL 迁移**（`NNN_描述.sql`）。部署时由 `scripts/migrate.mjs` 自动应用，无需手动跑 SQL。

## 怎么加一个迁移

1. 新建文件 `db_migrations/00X_简短描述.sql`，**序号递增、补零三位**（如 `005_add_xxx.sql`）。
2. 写 SQL。**务必幂等**（见下方规范），保证可安全重复执行。
3. 提交并部署即可——构建时自动应用。

就这样，不需要改任何运行器代码。

## 自动应用机制

构建链路（`scripts/run-build.js`）：

```
prisma generate → node scripts/migrate.mjs → next build
```

运行器 `scripts/migrate.mjs`：

- 用 `pg` 连 `DATABASE_URL`（兼容 `POSTGRES_PRISMA_URL` / `POSTGRES_PRISMA_DATABASE_URL`）。
- 追踪表 `_sql_migrations` 记录已应用文件，**每个迁移只跑一次**。
- 按**文件名排序**依次执行待应用的迁移，每个在**独立事务**中运行；失败即回滚并**中断构建**（避免上线缺列导致接口 500）。
- 无 PostgreSQL 连接串时**自动跳过**（本地 SQLite / 预览环境不被阻断）。

> 首次创建追踪表时，会把自动化之前已手工应用的历史迁移（`001`、`002`、`003`，即 `scripts/migrate.mjs` 里的 `BASELINE`）登记为「已应用」，不再重跑。新迁移无需关心这点。

## 编写规范

- **幂等优先**：
  - 加列：`ALTER TABLE "t" ADD COLUMN IF NOT EXISTS "c" ... ;`
  - 加约束（PG 不支持 `IF NOT EXISTS`）：用 `DO $$ ... pg_constraint ... $$;` 守卫，或先 `DROP CONSTRAINT IF EXISTS` 再 `ADD`。
  - 建索引：`CREATE INDEX IF NOT EXISTS ...;`（大表用 `CONCURRENTLY` 时注意不能放在事务里）。
  - 参考 `004_unified_quota_v1.sql` 的写法。
- **只做加法/可在线执行**：尽量避免锁表的破坏性变更（删列、改类型、加 `NOT NULL` 无默认值）。确需破坏性变更时，分多步迁移并在 PR 说明。
- **与 Prisma schema 同步**：改了表结构，记得同步 `prisma/schema.prisma` 并 `npx prisma generate`，让客户端类型一致。
- **一个迁移做一件事**，描述清晰，便于回溯。

## 手动执行（可选）

```bash
# 应用所有待执行迁移（与部署同逻辑）
npm run migrate

# 或直接对某个连接串执行单个文件
psql "$DATABASE_URL" -f db_migrations/00X_xxx.sql
```

## 环境变量

迁移在 **Vercel 构建阶段**执行，因此 `DATABASE_URL`（或 `POSTGRES_PRISMA_URL`）需对 **Build 阶段可见**。
若构建日志出现 `[migrate] 跳过：未检测到 PostgreSQL 连接串`，请在 Vercel 把连接串勾选给 Production/Build 环境。

成功时日志形如：

```
[migrate] 应用 005_xxx.sql ...
[migrate] ✓ 005_xxx.sql
[migrate] 完成，应用了 1 个迁移。
```
