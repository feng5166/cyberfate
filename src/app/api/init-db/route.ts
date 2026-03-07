import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Test connection and create tables
    await prisma.$executeRaw`SELECT 1`
    
    // Create tables if not exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE,
        "emailVerified" TIMESTAMP,
        "passwordHash" TEXT,
        "wechatOpenId" TEXT UNIQUE,
        "wechatUnionId" TEXT,
        "nickname" TEXT,
        "avatar" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "accounts" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        UNIQUE("provider", "providerAccountId")
      )
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" TEXT PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP NOT NULL
      )
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "verification_tokens" (
        "identifier" TEXT NOT NULL,
        "token" TEXT UNIQUE NOT NULL,
        "expires" TIMESTAMP NOT NULL,
        UNIQUE("identifier", "token")
      )
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "plan" TEXT NOT NULL,
        "status" TEXT DEFAULT 'active',
        "startAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "expireAt" TIMESTAMP NOT NULL,
        "autoRenew" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "plan" TEXT NOT NULL,
        "amount" INTEGER NOT NULL,
        "payMethod" TEXT,
        "status" TEXT DEFAULT 'pending',
        "outTradeNo" TEXT UNIQUE NOT NULL,
        "transactionId" TEXT,
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "usage_quotas" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "baziAiCount" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "date")
      )
    `
    
    return Response.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    })
  } catch (error: any) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
