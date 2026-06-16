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
          return false
        }
      }
      
      if (account?.provider === 'wechat') {
        // H6: 微信登录用户创建修复 —— 不再用 openid 当主键，让 DB 自动生成 cuid。
        // 先按 openid/unionid 查询已有用户，找不到才新建，并补写 Account 表记录。
        const wechatProfile = profile as { openid?: string; unionid?: string; nickname?: string; headimgurl?: string }
        const openid = wechatProfile.openid
        const unionid = wechatProfile.unionid
        if (!openid) {
          console.error('[auth] WeChat profile missing openid')
          return false
        }
        const providerAccountId = unionid || openid

        try {
          await prisma.$transaction(async (tx) => {
            let existingUser = await tx.user.findUnique({
              where: { wechatOpenId: openid },
            })

            // 兜底：unionId 查找（同一账号在不同公众号/小程序下 openid 不同，但 unionId 相同）
            if (!existingUser && unionid) {
              existingUser = await tx.user.findFirst({
                where: { wechatUnionId: unionid },
              })
              if (existingUser && !existingUser.wechatOpenId) {
                existingUser = await tx.user.update({
                  where: { id: existingUser.id },
                  data: { wechatOpenId: openid },
                })
              }
            }

            const syntheticEmail = `wechat.${unionid || openid}@cyberfate.internal`

            if (!existingUser) {
              existingUser = await tx.user.create({
                data: {
                  email: syntheticEmail,
                  emailVerified: new Date(),
                  wechatOpenId: openid,
                  wechatUnionId: unionid,
                  nickname: wechatProfile.nickname,
                  avatar: wechatProfile.headimgurl,
                },
              })
            } else if (!existingUser.email || existingUser.email.endsWith('@cyberfate.internal')) {
              existingUser = await tx.user.update({
                where: { id: existingUser.id },
                data: { email: syntheticEmail, emailVerified: new Date() },
              })
            }

            // 与 Google OAuth 路径保持一致：写入/更新 Account 记录
            await tx.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: 'wechat',
                  providerAccountId,
                },
              },
              update: {
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
              },
              create: {
                userId: existingUser.id,
                type: account.type,
                provider: 'wechat',
                providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
              },
            })

            // 同步 NextAuth user 对象，让后续回调拿到正确的数据库 id / email
            user.id = existingUser.id
            user.email = existingUser.email ?? syntheticEmail
          })
        } catch (error) {
          console.error('[auth] WeChat signIn transaction failed:', error)
          return false
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
