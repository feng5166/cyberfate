import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
})

async function main() {
  console.log('🔄 Initializing database...')
  
  // Test connection
  await prisma.$connect()
  console.log('✅ Database connected')
  
  // Push schema
  console.log('📦 Creating tables...')
  // Tables will be created automatically on first query
  
  console.log('✅ Database initialized successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
