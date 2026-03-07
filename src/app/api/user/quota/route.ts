import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkQuota } from '@/lib/subscription'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return Response.json({ error: '未登录' }, { status: 401 })
  }

  const { baziAiCount, limit, hasQuota } = await checkQuota(session.user.id)

  return Response.json({
    baziAiCount,
    baziAiLimit: limit === Infinity ? -1 : limit,
    isMember: limit === Infinity,
    hasQuota,
  })
}
