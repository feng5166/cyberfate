# PRD-PWA-V1 — CyberFate PWA 移动端支持方案

**版本**: v1.0  
**日期**: 2026-06-03  
**作者**: 产品虾 🦐  
**状态**: 待代码虾实施

---

## 一、目标与背景

### 1.1 目标

让 cyberfate.me 在 Android 和 iOS 设备上具备"接近原生 App"的体验：
- 可添加到主屏幕（A2HS），启动无浏览器地址栏
- 启动画面品牌化
- 关键页面离线可用（缓存 Shell）
- 推送通知预留能力（当前不上线，仅做基建）

### 1.2 为什么选 PWA 而非 React Native App

- 无需过审 App Store / Google Play，随时发版
- 复用现有 Next.js 代码库，零重写成本
- 海外用户（目标市场）的 Android 占比高，PWA 安装体验接近原生
- iOS 16.4+ 已支持 PWA 推送，门槛大幅降低
- 与 4/28 拍板的 React Native 路线不冲突——PWA 先跑流量，RN 后跑深度

---

## 二、技术选型

### 2.1 方案：`next-pwa`（基于 Workbox）

**选型理由**：
- 专为 Next.js 设计，配置最简
- 自动生成 Service Worker（Workbox 策略）
- 支持 precaching（App Shell）+ runtimecaching（API 缓存）
- 维护活跃，兼容 Next.js 14+（App Router）

**包**: `@ducanh2912/next-pwa`（社区活跃维护版，原 `next-pwa` 的继承者）

### 2.2 不选 Serwist 的理由

Serwist 配置更复杂，适合大型应用；当前体量用 next-pwa 足够。

---

## 三、实施清单

### 3.1 安装依赖

```bash
npm install @ducanh2912/next-pwa
```

### 3.2 next.config.ts 改造

用 `withPWA` 包裹现有配置：

```ts
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",           // sw.js / workbox-*.js 输出到 public/
  cacheOnFrontEndNav: true, // 前端导航时也走缓存
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // 开发环境关闭，避免干扰
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // 1. Google Fonts
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      // 2. 静态资源（图片、JS、CSS）
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      // 3. 页面路由（App Shell 策略）
      {
        urlPattern: /^https:\/\/www\.cyberfate\.me\/(?:bazi|daily|tarot|ziwei|meihua|huangli|pricing|knowledge)?(?:\/.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          expiration: { maxEntries: 16, maxAgeSeconds: 24 * 60 * 60 },
          networkTimeoutSeconds: 10,
        },
      },
      // 4. API 路由：不缓存（保证数据实时）
      // /api/* 不加入 runtimeCaching，默认 NetworkOnly
    ],
  },
});

// 用 withPWA 包裹原来的 nextConfig export
export default withPWA(nextConfig);
```

注意：现有 `nextConfig` 对象（含 securityHeaders、withBundleAnalyzer）保持不变，只在最外层套 `withPWA`。

### 3.3 site.webmanifest 完整升级

替换 `public/site.webmanifest`：

```json
{
  "name": "赛博命理师 CyberFate",
  "short_name": "CyberFate",
  "description": "AI 驱动的东方命理分析 · 八字合婚 · 每日运势",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FAF9F6",
  "theme_color": "#1C1A16",
  "lang": "zh-CN",
  "categories": ["lifestyle", "entertainment"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "CyberFate 首页"
    },
    {
      "src": "/screenshots/mobile-bazi.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "八字分析"
    }
  ]
}
```

**设计说明**：
- `theme_color` 改为 `#1C1A16`（全站主色，顶部状态栏会变暗色，与设计一致）
- `background_color` 改为 `#FAF9F6`（暖米白，启动画面底色）
- `start_url` 带 `?source=pwa` 便于 GA 区分流量来源
- `display: standalone` 隐藏地址栏，接近原生

### 3.4 PWA 图标生成

**需要的图标文件**（放在 `public/icons/`）：
- 72/96/128/144/152/192/384/512 共 8 种尺寸 PNG
- 192 和 512 需要 maskable 版本（安全区域内不裁切内容）

**生成方式**：
用现有 `public/favicon.svg` 作为源文件，通过以下工具生成：
```bash
# 安装 sharp CLI 或用 pwa-asset-generator
npx pwa-asset-generator public/favicon.svg public/icons \
  --icon-only \
  --background "#FAF9F6" \
  --padding "15%"
```

如果 favicon.svg 不适合作为 App icon（过于简单），美术虾需要提供一个 512x512 的品牌图标源文件。

**截图文件**（`public/screenshots/`）：
- `mobile-home.png`：390x844，首页截图（可用 playwright 生成）
- `mobile-bazi.png`：390x844，八字分析页截图（可用 playwright 生成）

### 3.5 layout.tsx 的 iOS 专项 meta 标签

在 `<head>` 补充 iOS Safari 专项配置（在 `generateMetadata` 或 layout 的 `<head>` 里）。

在 `src/app/layout.tsx` 的 `export const metadata` 里补充：

```ts
export const metadata: Metadata = {
  // ...现有内容保持不变...
  
  // 新增 PWA 相关
  applicationName: "CyberFate",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",  // 状态栏透明叠加
    title: "CyberFate",
    startupImage: [
      // iPhone 14 Pro Max (430x932 逻辑像素 @3x = 1290x2796)
      {
        url: "/splash/apple-splash-1290-2796.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
      },
      // iPhone 14 / 13 / 12 (390x844 @3x = 1170x2532)
      {
        url: "/splash/apple-splash-1170-2532.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
      },
      // iPhone SE (375x667 @2x = 750x1334)
      {
        url: "/splash/apple-splash-750-1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
      },
    ]
  },
  formatDetection: {
    telephone: false,  // 禁止 iOS 自动把电话号码变蓝色链接
  },
};
```

**iOS Splash 生成**：

iOS Safari 不读 manifest 的 screenshots，需要单独的 `apple-touch-startup-image`。用 pwa-asset-generator 一并生成：

```bash
npx pwa-asset-generator public/favicon.svg public/splash \
  --splash-only \
  --background "#FAF9F6" \
  --portrait-only
```

文件放入 `public/splash/`。

### 3.6 离线降级页面

新建 `public/offline.html`（纯 HTML，不依赖 Next.js 渲染）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>暂时无法访问 · CyberFate</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #FAF9F6; color: #1C1A16;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; text-align: center; padding: 24px; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    p  { color: rgba(28,26,22,0.6); font-size: 15px; }
    button { margin-top: 24px; background: #C2762B; color: white;
             border: none; padding: 12px 32px; border-radius: 100px;
             font-size: 15px; cursor: pointer; }
  </style>
</head>
<body>
  <div>
    <div style="font-size:48px;margin-bottom:16px">🌙</div>
    <h1>暂时无法访问</h1>
    <p>网络连接中断，请检查网络后重试</p>
    <button onclick="location.reload()">重新连接</button>
  </div>
</body>
</html>
```

在 `workboxOptions` 里注册离线页：

```ts
workboxOptions: {
  // ...runtimeCaching...
  fallbacks: {
    document: "/offline.html",
  },
}
```

### 3.7 .gitignore 更新

`next-pwa` 会在 `public/` 生成 `sw.js`、`workbox-*.js`，这些是构建产物，加入 gitignore：

```
# PWA generated files
/public/sw.js
/public/sw.js.map
/public/workbox-*.js
/public/workbox-*.js.map
```

---

## 四、iOS vs Android 差异说明

| 能力 | Android Chrome | iOS Safari |
|------|---------------|------------|
| 安装到主屏幕 | ✅ 浏览器自动弹安装提示 | ✅ 手动"添加到主屏幕" |
| 隐藏地址栏（standalone） | ✅ | ✅ iOS 11.3+ |
| Splash Screen | ✅ manifest screenshots | ⚠️ 需要 apple-touch-startup-image |
| Service Worker | ✅ 完整支持 | ✅ iOS 11.3+ |
| 推送通知 | ✅ | ✅ iOS 16.4+（需用户先授权） |
| 后台同步 | ✅ | ❌ iOS 不支持 Background Sync |
| 安装提示横幅（BeforeInstallPromptEvent） | ✅ | ❌ iOS 没有此 API |

**iOS 安装引导**：iOS 没有原生安装横幅，需要我们自己做一个引导提示。在 3.8 里处理。

### 3.8 iOS 安装引导组件（A2HS Prompt）

新建 `src/components/pwa/InstallPrompt.tsx`：

```tsx
'use client';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 已在 standalone 模式（已安装）就不显示
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // iOS 检测
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = ('standalone' in navigator) && (navigator as any).standalone;
    if (isIOS && !isInStandaloneMode) {
      // 7 天内已提示过就不再显示
      const lastPrompt = localStorage.getItem('ios-install-prompted');
      if (!lastPrompt || Date.now() - Number(lastPrompt) > 7 * 24 * 3600 * 1000) {
        setTimeout(() => setShowIOSGuide(true), 3000); // 3s 后出现
      }
    }
    // Android：监听 beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowAndroidPrompt(false);
    setDeferredPrompt(null);
  };

  const dismissIOS = () => {
    localStorage.setItem('ios-install-prompted', String(Date.now()));
    setShowIOSGuide(false);
  };

  if (showAndroidPrompt) return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-[#1C1A16] text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
      <span className="text-2xl">🔮</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">添加到主屏幕</p>
        <p className="text-xs text-white/60">像 App 一样使用 CyberFate</p>
      </div>
      <button onClick={handleAndroidInstall} className="bg-[#C2762B] text-white text-sm px-4 py-2 rounded-xl">安装</button>
      <button onClick={() => setShowAndroidPrompt(false)} className="text-white/40 text-xs px-2">✕</button>
    </div>
  );

  if (showIOSGuide) return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E0D8] rounded-t-2xl p-5 shadow-2xl">
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm font-semibold text-[#1C1A16]">添加到主屏幕</p>
        <button onClick={dismissIOS} className="text-[#1C1A16]/40 text-lg leading-none">✕</button>
      </div>
      <p className="text-sm text-[#1C1A16]/70 mb-4">
        点击底部 <span className="inline-block px-1.5 py-0.5 bg-[#FAF3EC] rounded text-[#C2762B] font-medium">□↑ 分享</span> 按钮，然后选择「添加到主屏幕」
      </p>
      <div className="flex items-center gap-2 text-xs text-[#1C1A16]/50">
        <span>🔮</span>
        <span>像 App 一样启动，无需地址栏</span>
      </div>
    </div>
  );

  return null;
}
```

在 `src/app/layout.tsx` 的 `<body>` 里引入：

```tsx
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
// ...
<body>
  {/* ...现有内容... */}
  <InstallPrompt />
</body>
```

---

## 五、验收标准

### 5.1 Android 验收

- [ ] Chrome 访问 cyberfate.me，顶部或底部出现"添加到主屏幕"横幅
- [ ] 安装后桌面图标显示正确（非浏览器图标）
- [ ] 点击桌面图标，启动无地址栏，有 Splash
- [ ] 断网访问已缓存页面（首页/八字页），显示内容而非 Chrome 恐龙页
- [ ] 断网访问未缓存页面，显示 offline.html 降级页

### 5.2 iOS 验收

- [ ] Safari 访问 cyberfate.me，3s 后出现引导提示
- [ ] 按提示操作，添加到主屏幕成功
- [ ] 点击图标，启动无 Safari 地址栏，有 Splash（暖米白底 + 图标）
- [ ] status bar 显示黑色（black-translucent 样式）
- [ ] 页面内链接跳转不弹出 Safari（停留在 standalone 模式）

### 5.3 Lighthouse PWA 评分

- [ ] Lighthouse PWA 评分 ≥ 90
- [ ] "Installable" 所有检查项通过
- [ ] "PWA Optimized" 通过

---

## 六、实施顺序（代码虾执行）

1. 安装 `@ducanh2912/next-pwa`
2. 更新 `next.config.ts`，套 `withPWA`
3. 更新 `.gitignore`
4. 运行 `npx pwa-asset-generator` 生成全套图标和 iOS splash
5. 替换 `public/site.webmanifest`
6. 新建 `public/offline.html`
7. 更新 `src/app/layout.tsx` 的 metadata（补 appleWebApp + formatDetection）
8. 新建 `src/components/pwa/InstallPrompt.tsx`
9. 在 `layout.tsx` 引入 `<InstallPrompt />`
10. 本地 build 验证（`npm run build`，检查 public/ 下是否生成 sw.js）
11. 用 Chrome DevTools → Application → Service Worker 验证注册成功
12. 用 Lighthouse 跑 PWA 评分
13. commit + push

---

## 七、不在本期范围内

- 推送通知（基建已预留，不上线 UI）
- 后台同步（iOS 不支持，Android 暂不需要）
- 离线完整可用（当前只做 Shell 缓存，API 数据仍需联网）

---

_产品虾 🦐 | 2026-06-03_
