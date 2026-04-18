import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import WechatProvider from '@/lib/wechat-provider'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

export const isGoogleAuthEnabled = !!(googleClientId && googleClientSecret)

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    // Google 登录（仅在配置了 Client ID/Secret 时注册）
    ...(isGoogleAuthEnabled
      ? [GoogleProvider({ clientId: googleClientId!, clientSecret: googleClientSecret! })]
      : []),
    // 微信登录
    WechatProvider({
      clientId: process.env.WECHAT_APP_ID || '',
      clientSecret: process.env.WECHAT_APP_SECRET || '',
    }),
    // 邮箱密码登录
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('请输入邮箱和密码')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          return null
        }

        if (!user.passwordHash) {
          throw new Error('该账号通过 Google 注册，请使用 Google 登录')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          throw new Error('密码错误，请重新输入')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          image: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // 先做只读查询，在事务外避免不必要的锁
          const existingUserBefore = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          await prisma.$transaction(async (tx) => {
            let existingUser = existingUserBefore

            if (!existingUser) {
              existingUser = await tx.user.create({
                data: {
                  email: user.email!,
                  nickname: user.name || user.email!.split('@')[0],
                  avatar: user.image,
                },
              })
            } else {
              // BUG-003: 邮箱已存在（含密码账号），link Google — 更新头像但不覆盖 passwordHash
              if (!existingUser.avatar && user.image) {
                await tx.user.update({
                  where: { id: existingUser.id },
                  data: { avatar: user.image },
                })
              }
            }

            // 将数据库 ID 存到 user 对象
            user.id = existingUser.id

            // 写入 Account 记录，关联 Google provider
            await tx.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: 'google',
                  providerAccountId: (profile as { sub?: string })?.sub ?? account.providerAccountId,
                },
              },
              update: {
                access_token: account.access_token,
                expires_at: account.expires_at,
                id_token: account.id_token,
                scope: account.scope,
                token_type: account.token_type,
              },
              create: {
                userId: existingUser.id,
                type: account.type,
                provider: 'google',
                providerAccountId: (profile as { sub?: string })?.sub ?? account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                id_token: account.id_token,
                scope: account.scope,
                token_type: account.token_type,
              },
            })
          })
        } catch (error) {
          console.error('[auth] Google signIn transaction failed:', error)
        }
      }
      
      if (account?.provider === 'wechat') {
        // 微信登录：查找或创建用户
        // Security Fix: SEC-010 — 使用明确接口代替 any
        const wechatProfile = profile as { openid?: string; unionid?: string; nickname?: string; headimgurl?: string }
        const existingUser = await prisma.user.findUnique({
          where: { wechatOpenId: wechatProfile.openid },
        })

        if (!existingUser) {
          // 创建新用户 — 微信无邮箱，生成合成邮箱以确保唯一性
          const syntheticEmail = `wechat.${wechatProfile.unionid || wechatProfile.openid}@cyberfate.internal`
          await prisma.user.create({
            data: {
              id: user.id,
              email: syntheticEmail,
              emailVerified: new Date(),
              wechatOpenId: wechatProfile.openid,
              wechatUnionId: wechatProfile.unionid,
              nickname: wechatProfile.nickname,
              avatar: wechatProfile.headimgurl,
            },
          })
          // 同步更新 session user 的 email（否则后续流程拿不到）
          user.email = syntheticEmail
        } else if (!existingUser.email || existingUser.email.endsWith('@cyberfate.internal')) {
          // 老用户补丁：如果之前创建时没有 email，补上
          const syntheticEmail = `wechat.${existingUser.wechatUnionId || existingUser.wechatOpenId}@cyberfate.internal`
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { email: syntheticEmail, emailVerified: new Date() },
          })
          user.email = syntheticEmail
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      const DB_TTL_MS = 5 * 60 * 1000
      const now = Date.now()
      const needsRefresh =
        !!user ||
        trigger === 'update' ||
        !token.dbCheckedAt ||
        now - token.dbCheckedAt > DB_TTL_MS

      if (needsRefresh) {
        if (user) {
          token.id = user.id
        }
        const dbUser = await prisma.user.findUnique({
          where: { id: (token.id ?? user?.id) as string },
          select: {
            passwordChangedAt: true,
            avatar: true,
            nickname: true,
            subscriptions: {
              where: { status: 'active', expireAt: { gt: new Date() } },
              select: { id: true },
              take: 1,
            },
          },
        })
        token.passwordChangedAt = dbUser?.passwordChangedAt?.getTime() ?? null
        token.avatar = dbUser?.avatar ?? null
        token.nickname = dbUser?.nickname ?? null
        token.isSubscribed = (dbUser?.subscriptions?.length ?? 0) > 0
        token.dbCheckedAt = now
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.nickname ?? session.user.name
        session.user.image = token.avatar ?? null
        session.user.isSubscribed = token.isSubscribed ?? false
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
}

export default NextAuth(authOptions)
