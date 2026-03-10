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
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          return null
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
        }
        
        // 将数据库 ID 存到 user 对象
        user.id = existingUser.id
      }
      
      if (account?.provider === 'wechat') {
        // 微信登录：查找或创建用户
        const wechatProfile = profile as any
        const existingUser = await prisma.user.findUnique({
          where: { wechatOpenId: wechatProfile.openid },
        })

        if (!existingUser) {
          // 创建新用户
          await prisma.user.create({
            data: {
              id: user.id,
              wechatOpenId: wechatProfile.openid,
              wechatUnionId: wechatProfile.unionid,
              nickname: wechatProfile.nickname,
              avatar: wechatProfile.headimgurl,
            },
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
}

export default NextAuth(authOptions)
