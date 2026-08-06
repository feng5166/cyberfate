import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { decode } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'

/**
 * 统一鉴权入口：兼容「Web Cookie Session」与「移动端 Bearer JWT」两种来源，
 * 返回与 NextAuth `getServerSession` 相同形态的对象，便于各 route 无缝替换。
 *
 * - Web：浏览器带 NextAuth Cookie → 走 getServerSession。
 * - 移动端：原生 fetch 无 Cookie，改带 `Authorization: Bearer <jwt>`，
 *   该 JWT 由 `/api/auth/mobile-login` 用同一 NEXTAUTH_SECRET 签发，
 *   故可直接用 next-auth/jwt 的 decode 解出同样的 payload。
 */
export interface AuthUser {
  id: string
  name?: string | null
  image?: string | null
  isSubscribed?: boolean
}

export interface AuthSession {
  user: AuthUser
}

const secret = process.env.NEXTAUTH_SECRET

export async function getAuthSession(req: NextRequest): Promise<AuthSession | null> {
  // 1) Web：NextAuth Cookie Session
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return {
      user: {
        id: session.user.id,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        isSubscribed: session.user.isSubscribed ?? false,
      },
    }
  }

  // 2) 移动端：Authorization: Bearer <jwt>
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (header?.startsWith('Bearer ') && secret) {
    const token = header.slice(7).trim()
    if (token) {
      try {
        const payload = await decode({ token, secret })
        if (payload?.id) {
          return {
            user: {
              id: payload.id as string,
              name: (payload.nickname as string | undefined) ?? null,
              image: (payload.avatar as string | undefined) ?? null,
              // 移动端 token MAX_AGE 30 天，且这里只 decode 不查库：payload 里的
              // isSubscribed:true 可能是订阅早已到期的陈旧值，不能作为 VIP 放行凭证透传，
              // 一律降级为 undefined（= 未知）交给 quota/subscription 层真查 DB 复核。
              // false 是保守方向可以透传，仍能给配额层省掉常规免费用户的那次订阅查询。
              isSubscribed: payload.isSubscribed === true ? undefined : false,
            },
          }
        }
      } catch {
        // token 无效/过期 → 视为未登录
      }
    }
  }

  return null
}
