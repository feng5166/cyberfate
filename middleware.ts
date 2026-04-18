import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const REGION_MAP: Record<string, string> = {
  CN: 'hkg1', HK: 'hkg1', MO: 'hkg1', TW: 'hkg1',
  JP: 'nrt1', KR: 'icn1', SG: 'sin1', MY: 'sin1',
  TH: 'bkk1', ID: 'sin1', PH: 'sin1', VN: 'sin1',
  IN: 'bom1',
  AU: 'syd1', NZ: 'akl1',
  GB: 'lhr1', DE: 'fra1', FR: 'cdg1', NL: 'ams1',
  IT: 'lin1', ES: 'mad1', RU: 'led1',
  US: 'iad1', CA: 'yqr1', BR: 'gru1', MX: 'iad1',
}

function getRegion(country: string): string {
  return REGION_MAP[country] || 'hkg1'
}

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // @ts-ignore - geo is available at runtime on Vercel
  const country = (request as any).geo?.country || ''
  const region = getRegion(country)

  const response = NextResponse.rewrite(request.nextUrl)
  response.headers.set('x-vercel-region', region)
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest|.*\\..*).*)',
  ],
}
