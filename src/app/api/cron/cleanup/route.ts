import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/cron/cleanup —— Vercel Cron 每日调用的历史数据清理。
 *
 * 这些表只增不删：塔罗/每日详批/运势问答/音乐签的历史随日活线性增长，
 * 半年前的记录既没人翻也不能变现，却在持续吃 Neon 存储与索引体积。
 * 过期的重置令牌同理，留着只是徒增 email 索引扫描面。
 */
export const dynamic = 'force-dynamic'

// 历史记录保留 180 天：覆盖「去年今日」类回看诉求，再久的价值趋近于零
const RETENTION_DAYS = 180

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  // 未配置密钥就直接拒绝，绝不裸奔：这个端点能删生产数据
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET 未配置' }, { status: 503 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const now = new Date()

  try {
    // 各表互不依赖，并行删；每条都带日期条件，绝不会出现无条件全表删
    const [tarotReadings, dailyDetailHistory, dailyFortuneQaHistory, musicOracleRecords, passwordResetTokens] =
      await Promise.all([
        prisma.tarotReading.deleteMany({ where: { createdAt: { lt: cutoff } } }),
        // DailyDetailHistory 没有 createdAt，时间字段是 generatedAt
        prisma.dailyDetailHistory.deleteMany({ where: { generatedAt: { lt: cutoff } } }),
        prisma.dailyFortuneQaHistory.deleteMany({ where: { createdAt: { lt: cutoff } } }),
        prisma.musicOracleRecord.deleteMany({ where: { createdAt: { lt: cutoff } } }),
        // 重置令牌按自身过期时间清，无需等 180 天
        prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      ])

    return NextResponse.json({
      ok: true,
      cutoff: cutoff.toISOString(),
      retentionDays: RETENTION_DAYS,
      deleted: {
        tarotReadings: tarotReadings.count,
        dailyDetailHistory: dailyDetailHistory.count,
        dailyFortuneQaHistory: dailyFortuneQaHistory.count,
        musicOracleRecords: musicOracleRecords.count,
        passwordResetTokens: passwordResetTokens.count,
      },
    })
  } catch (err) {
    console.error('[cron/cleanup] 清理失败:', err)
    return NextResponse.json({ error: '清理失败' }, { status: 500 })
  }
}
