import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Prisma will auto-create tables on first query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    return Response.json({ 
      success: true, 
      message: 'Database connected successfully',
      result 
    })
  } catch (error: any) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
