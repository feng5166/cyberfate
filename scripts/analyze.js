#!/usr/bin/env node
// Run: node scripts/analyze.js
// Generates bundle analysis reports in .next/analyze/

const { execSync } = require('child_process');

process.env.ANALYZE = 'true';
execSync('next build', { stdio: 'inherit', env: { ...process.env, ANALYZE: 'true' } });
