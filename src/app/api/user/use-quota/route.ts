import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkQuota } from '@/lib/subscription'
import { prisma } from '@/lib/db'

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return Response.json({ error: '未登录' }, { status: 401 })
  }

  const userId = session.user.id
  const { date, hasQuota } = await checkQuota(userId)

  if (!hasQuota) {
    return Response.json({ success: false, error: '今日次数已用完' }, { status: 429 })
  }

  await prisma.usageQuota.upsert({
    where: { userId_date: { userId, date } },
    update: { baziAiCount: { increment: 1 } },
    create: { userId, date, baziAiCount: 1 },
  })

  return Response.json({ success: true })
}
