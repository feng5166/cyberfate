'use strict';

const { execSync } = require('node:child_process');

const dbUrl =
  process.env.POSTGRES_PRISMA_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  '';

const isPostgresUrl = /^postgres(ql)?:\/\//i.test(dbUrl);
const skipDbPush = process.env.SKIP_PRISMA_DB_PUSH === '1';
const forceDbPush = process.env.FORCE_PRISMA_DB_PUSH === '1';
const shouldRunDbPush = !skipDbPush && (forceDbPush || isPostgresUrl);

function run(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: 'inherit' });
}

function tryRun(command) {
  try {
    run(command);
    return true;
  } catch (error) {
    if (process.env.CI === 'true' || forceDbPush) {
      console.error(`\n${command} failed and the build cannot continue.`);
      throw error;
    }
    console.warn(`\n${command} failed (likely because PostgreSQL is unavailable). Continuing because CI is not set. Set FORCE_PRISMA_DB_PUSH=1 to make this failure fatal.`);
    return false;
  }
}

if (shouldRunDbPush) {
  tryRun('npx prisma db push --accept-data-loss');
} else if (skipDbPush) {
  console.log('Skipping `prisma db push` because SKIP_PRISMA_DB_PUSH=1.');
} else if (!isPostgresUrl) {
  console.log('Skipping `prisma db push` because DATABASE_URL is not a PostgreSQL connection string.');
}

run('npx prisma generate');
run('next build --webpack');
