import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '赛博命理师 CyberFate'
export const size = { width: 500, height: 400 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1C1A16',
          backgroundImage:
            'radial-gradient(circle at 30% 30%, rgba(167, 139, 90, 0.15) 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: 600,
            color: '#E8E4DC',
            fontFamily: '"Noto Serif SC", "Songti SC", serif',
            letterSpacing: 3,
          }}
        >
          赛博命理师
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#a78b5a',
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            letterSpacing: 4,
            marginTop: 6,
          }}
        >
          CYBERFATE
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'rgba(232, 228, 220, 0.45)',
            marginTop: 20,
            letterSpacing: 1,
          }}
        >
          AI 驱动的东方智慧
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
