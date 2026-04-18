import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Geo-aware routing: route to nearest region based on user's country
const REGION_MAP: Record<string, string> = {
  // Asia
  CN: 'hkg1',  // China -> Hong Kong
  HK: 'hkg1',  // Hong Kong
  MO: 'hkg1',  // Macau
  TW: 'hkg1',  // Taiwan
  JP: 'nrt1',  // Japan -> Tokyo
  KR: 'icn1',  // Korea -> Seoul
  SG: 'sin1',  // Singapore
  MY: 'sin1',  // Malaysia
  TH: 'bkk1',  // Thailand
  ID: 'sin1',  // Indonesia
  PH: 'sin1',  // Philippines
  VN: 'sin1',  // Vietnam
  IN: 'bom1',  // India -> Mumbai
  // Oceania
  AU: 'syd1',  // Australia -> Sydney
  NZ: 'akl1',  // New Zealand -> Auckland
  // Europe
  GB: 'lhr1',  // UK -> London
  DE: 'fra1',  // Germany -> Frankfurt
  FR: 'cdg1',  // France -> Paris
  NL: 'ams1',  // Netherlands -> Amsterdam
  IT: 'lin1',  // Italy -> Milan
  ES: 'mad1',  // Spain -> Madrid
  RU: 'led1',  // Russia
  // Americas
  US: 'iad1',  // US -> Washington DC (East)
  CA: 'yqr1',  // Canada -> Vancouver
  BR: 'gru1',  // Brazil -> Sao Paulo
  MX: 'iad1',  // Mexico -> US East
  // Default fallback -> Hong Kong (good for Asia majority)
}

function getRegion(country: string): string {
  return REGION_MAP[country] || REGION_MAP['__default__'] || 'hkg1'
}

export function middleware(request: NextRequest) {
  // Only apply to page requests, not API/static assets
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const country = request.geo?.country || ''
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
