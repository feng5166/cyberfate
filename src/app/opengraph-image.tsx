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
          backgroundColor: '#100D0A',
          backgroundImage:
            'radial-gradient(circle at 30% 18%, rgba(255,255,255,0.06) 0%, transparent 52%), radial-gradient(circle at 74% 84%, rgba(255,255,255,0.04) 0%, transparent 50%)',
        }}
      >
        {/* 装饰环 */}
        <div style={{ position: 'absolute', top: 54, right: 96, width: 210, height: 210, borderRadius: '50%', border: '1px solid rgba(245,243,239,0.12)' }} />
        <div style={{ position: 'absolute', bottom: 70, left: 78, width: 150, height: 150, borderRadius: '50%', border: '1px solid rgba(245,243,239,0.09)' }} />

        {/* 罗盘命星徽章 */}
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'radial-gradient(circle at 32% 26%, #3A352E 0%, #201C17 52%, #100D0A 100%)',
            boxShadow: '0 18px 44px rgba(0,0,0,0.5)',
          }}
        >
          <svg width="104" height="104" viewBox="0 0 512 512">
            <circle cx="256" cy="256" r="196" fill="none" stroke="#F5F3EF" strokeOpacity="0.5" strokeWidth="6" />
            <circle cx="256" cy="60" r="6" fill="#F5F3EF" fillOpacity="0.5" />
            <circle cx="256" cy="452" r="6" fill="#F5F3EF" fillOpacity="0.5" />
            <circle cx="60" cy="256" r="6" fill="#F5F3EF" fillOpacity="0.5" />
            <circle cx="452" cy="256" r="6" fill="#F5F3EF" fillOpacity="0.5" />
            <path d="M256 104 L290 222 L408 256 L290 290 L256 408 L222 290 L104 256 L222 222 Z" fill="#F7F5F1" />
            <circle cx="256" cy="256" r="21" fill="#F7F5F1" />
            <circle cx="256" cy="256" r="9" fill="#100D0A" fillOpacity="0.9" />
          </svg>
        </div>

        {/* 字标 CYBER / FATE 双色重 */}
        <div style={{ display: 'flex', marginTop: 34, fontSize: 82, letterSpacing: 6, lineHeight: 1 }}>
          <span style={{ color: '#9A9A9A', fontWeight: 400 }}>CYBER</span>
          <span style={{ color: '#F5F3EF', fontWeight: 800 }}>FATE</span>
        </div>

        {/* Slogan */}
        <div style={{ display: 'flex', marginTop: 26, fontSize: 34, letterSpacing: 3 }}>
          <span style={{ color: 'rgba(245,243,239,0.66)' }}>我不懂命理，</span>
          <span style={{ color: '#FFFFFF', fontWeight: 600 }}>你说人话我就懂</span>
        </div>

        {/* 分隔线 */}
        <div style={{ width: 72, height: 2, backgroundColor: 'rgba(245,243,239,0.35)', marginTop: 34 }} />

        {/* 模块 */}
        <div style={{ display: 'flex', gap: 18, marginTop: 26, fontSize: 19, color: 'rgba(200,200,200,0.6)', letterSpacing: 2 }}>
          {['八字', '紫微', '六爻', '梅花', '塔罗', '每日运势'].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
