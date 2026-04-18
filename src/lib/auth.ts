import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import WechatProvider from '@/lib/wechat-provider'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    // Google 登录
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
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
        // Google 登录：查找或创建用户
        let existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        if (!existingUser) {
          existingUser = await prisma.user.create({
            data: {
              email: user.email!,
              nickname: user.name || user.email!.split('@')[0],
              avatar: user.image,
            },
          })
        } else {
          // BUG-003: 邮箱已存在（含密码账号），link Google — 更新头像但不覆盖 passwordHash
          if (!existingUser.avatar && user.image) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { avatar: user.image },
            })
          }
        }

        // 将数据库 ID 存到 user 对象
        user.id = existingUser.id
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { passwordChangedAt: true },
        })
        token.passwordChangedAt = dbUser?.passwordChangedAt?.getTime() ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            nickname: true,
            avatar: true,
            passwordChangedAt: true,
            subscriptions: {
              where: { status: 'active', expireAt: { gt: new Date() } },
              select: { id: true },
              take: 1,
            },
          },
        })
        // Invalidate token if password was changed after token was issued
        const dbChangedAt = dbUser?.passwordChangedAt?.getTime() ?? null
        if (dbChangedAt !== null && token.passwordChangedAt !== dbChangedAt) {
          return null as never
        }
        session.user.name = dbUser?.nickname ?? session.user.name
        session.user.image = dbUser?.avatar ?? null
        session.user.isSubscribed = (dbUser?.subscriptions?.length ?? 0) > 0
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
}

export default NextAuth(authOptions)
