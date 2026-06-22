// 原始 SQL 迁移运行器（db_migrations/*.sql）
//
// - 用追踪表 _sql_migrations 记录已应用的文件，保证每个迁移只跑一次。
// - 首次创建追踪表时，把自动化之前已手工应用的历史迁移（BASELINE）登记为「已应用」，避免重复执行。
// - 每个迁移在独立事务中执行；失败则回滚并使进程非零退出（在 CI/部署中即中断构建）。
// - 无 PostgreSQL 连接串时直接跳过（本地 SQLite / 预览环境），不阻断构建。
//
// 由 scripts/run-build.js 在 `next build` 前调用；也可手动 `npm run migrate`。

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'db_migrations');

// 自动化之前已通过手工方式应用到生产库的历史迁移：首次建表时登记为已应用，不再重跑。
const BASELINE = [
  '001_add_missing_indexes.sql',
  '002_soft_delete.sql',
  '003_data_integrity.sql',
];

const dbUrl =
  process.env.POSTGRES_PRISMA_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  '';

const isPostgresUrl = /^postgres(ql)?:\/\//i.test(dbUrl);

async function main() {
  if (!isPostgresUrl) {
    console.log('[migrate] 跳过：未检测到 PostgreSQL 连接串（DATABASE_URL）。');
    return;
  }

  // 仅在确有连接串时才加载 pg —— 避免无 DB 环境（本地/预览，或 node_modules 未装 pg）
  // 因顶层 import 失败而中断构建。
  const { default: pg } = await import('pg');

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = new pg.Client({
    connectionString: dbUrl,
    // 多数托管 PG（Supabase/Neon/Vercel PG）需要 TLS；本地可用 sslmode=disable 覆盖。
    ssl: /sslmode=disable/.test(dbUrl) ? false : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    // 检测追踪表是否「本次新建」，用于首跑登记 baseline。
    const existed = await client.query(
      "SELECT to_regclass('public._sql_migrations') IS NOT NULL AS existed",
    );
    const tableExisted = existed.rows[0]?.existed === true;

    await client.query(
      'CREATE TABLE IF NOT EXISTS _sql_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    );

    if (!tableExisted) {
      for (const name of BASELINE) {
        await client.query(
          'INSERT INTO _sql_migrations(name) VALUES ($1) ON CONFLICT DO NOTHING',
          [name],
        );
      }
      console.log(`[migrate] 初始化追踪表，登记 ${BASELINE.length} 个历史迁移为已应用。`);
    }

    const appliedRes = await client.query('SELECT name FROM _sql_migrations');
    const applied = new Set(appliedRes.rows.map((r) => r.name));

    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) {
      console.log('[migrate] 无待应用迁移，数据库已是最新。');
      return;
    }

    for (const file of pending) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`[migrate] 应用 ${file} ...`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _sql_migrations(name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[migrate] ✓ ${file}`);
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw new Error(`迁移 ${file} 失败：${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log(`[migrate] 完成，应用了 ${pending.length} 个迁移。`);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error('[migrate] 失败：', err instanceof Error ? err.message : err);
  process.exit(1);
});
