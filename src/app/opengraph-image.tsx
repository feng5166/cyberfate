import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '赛博命理师 CyberFate · 我不懂命理，你说人话我就懂'
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
          backgroundColor: '#17130F',
          backgroundImage:
            'radial-gradient(circle at 30% 18%, rgba(231, 169, 79, 0.16) 0%, transparent 52%), radial-gradient(circle at 74% 84%, rgba(174, 101, 30, 0.14) 0%, transparent 50%)',
        }}
      >
        {/* 装饰环 */}
        <div style={{ position: 'absolute', top: 54, right: 96, width: 210, height: 210, borderRadius: '50%', border: '1px solid rgba(231,169,79,0.18)' }} />
        <div style={{ position: 'absolute', bottom: 70, left: 78, width: 150, height: 150, borderRadius: '50%', border: '1px solid rgba(231,169,79,0.13)' }} />

        {/* 罗盘命星徽章 */}
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'radial-gradient(circle at 32% 26%, #E7A94F 0%, #AE651E 52%, #17130F 100%)',
            boxShadow: '0 18px 44px rgba(0,0,0,0.45)',
          }}
        >
          <svg width="104" height="104" viewBox="0 0 512 512">
            <circle cx="256" cy="256" r="196" fill="none" stroke="#FBEEDD" strokeOpacity="0.55" strokeWidth="6" />
            <circle cx="256" cy="60" r="6" fill="#FBEEDD" fillOpacity="0.55" />
            <circle cx="256" cy="452" r="6" fill="#FBEEDD" fillOpacity="0.55" />
            <circle cx="60" cy="256" r="6" fill="#FBEEDD" fillOpacity="0.55" />
            <circle cx="452" cy="256" r="6" fill="#FBEEDD" fillOpacity="0.55" />
            <path d="M256 104 L290 222 L408 256 L290 290 L256 408 L222 290 L104 256 L222 222 Z" fill="#FBEEDD" />
            <circle cx="256" cy="256" r="21" fill="#E7A94F" />
            <circle cx="256" cy="256" r="9" fill="#17130F" fillOpacity="0.85" />
          </svg>
        </div>

        {/* 字标 CYBER / FATE 双色重 */}
        <div style={{ display: 'flex', marginTop: 34, fontSize: 82, letterSpacing: 6, lineHeight: 1 }}>
          <span style={{ color: '#C9B79C', fontWeight: 400 }}>CYBER</span>
          <span style={{ color: '#FBEEDD', fontWeight: 800 }}>FATE</span>
        </div>

        {/* Slogan */}
        <div style={{ display: 'flex', marginTop: 26, fontSize: 34, letterSpacing: 3 }}>
          <span style={{ color: 'rgba(251,238,221,0.72)' }}>我不懂命理，</span>
          <span style={{ color: '#E7A94F', fontWeight: 600 }}>你说人话我就懂</span>
        </div>

        {/* 分隔线 */}
        <div style={{ width: 72, height: 2, backgroundColor: 'rgba(231,169,79,0.4)', marginTop: 34 }} />

        {/* 模块 */}
        <div style={{ display: 'flex', gap: 18, marginTop: 26, fontSize: 19, color: 'rgba(201,183,156,0.7)', letterSpacing: 2 }}>
          {['八字', '紫微', '六爻', '梅花', '塔罗', '每日运势'].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
