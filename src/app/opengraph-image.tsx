import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '赛博命理师 CyberFate'
export const size = { width: 1200, height: 630 }
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
            'radial-gradient(circle at 30% 20%, rgba(167, 139, 90, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(167, 139, 90, 0.1) 0%, transparent 50%)',
        }}
      >
        {/* 装饰圆 */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 100,
            width: 200,
            height: 200,
            borderRadius: '50%',
            border: '1px solid rgba(167, 139, 90, 0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 80,
            width: 140,
            height: 140,
            borderRadius: '50%',
            border: '1px solid rgba(167, 139, 90, 0.15)',
          }}
        />

        {/* 主标题 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              color: '#E8E4DC',
              fontFamily: '"Noto Serif SC", "Songti SC", serif',
              letterSpacing: 4,
              lineHeight: 1.2,
            }}
          >
            赛博命理师
          </div>
          <div
            style={{
              fontSize: 36,
              color: '#a78b5a',
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              letterSpacing: 8,
              marginTop: 8,
            }}
          >
            CYBERFATE
          </div>
          <div
            style={{
              fontSize: 20,
              color: 'rgba(232, 228, 220, 0.5)',
              marginTop: 32,
              letterSpacing: 2,
            }}
          >
            AI 驱动的东方智慧 · 八字 · 紫微 · 塔罗 · 梅花易数
          </div>
        </div>

        {/* 底部装饰线 */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {['八字', '紫微', '塔罗', '梅花', '六爻'].map((text) => (
            <span
              key={text}
              style={{
                fontSize: 14,
                color: 'rgba(167, 139, 90, 0.6)',
                letterSpacing: 2,
              }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
