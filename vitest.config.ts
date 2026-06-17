import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // 仅统计已纳入测试范围的模块,门槛才有意义;每扩一块测试就把路径加进来。
      // 重 I/O / 难单测的基础设施(lib/ai、stripe、redis、logger、utils 等)暂不计入。
      include: [
        'src/lib/bazi/**',
        'src/lib/ziwei/**',
        'src/lib/huangli/**',
        'src/lib/liuyao/**',
        'src/lib/marriage/**',
        'src/lib/meihua/**',
        'src/lib/music-oracle/wuxing-music-map.ts',
        'src/lib/quota.ts',
        'src/lib/subscription.ts',
        'src/lib/pricing-config.ts',
      ],
      thresholds: { lines: 85, functions: 85, branches: 70 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
