import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// Bundle analyzer: enable with `ANALYZE=true npm run build`
// Requires: npm install -D @next/bundle-analyzer
let withBundleAnalyzer: (config: NextConfig) => NextConfig = (c) => c;
try {
  const mod = require("@next/bundle-analyzer");
  if (mod?.default) {
    // 仅在显式 ANALYZE=true 时启用，避免日常构建产出分析报告拖慢速度
    withBundleAnalyzer = mod.default({ enabled: process.env.ANALYZE === "true", openAnalyzer: false });
  }
} catch {
  // @next/bundle-analyzer not installed, skip
}

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  // 禁用联网恢复自动刷新：整页 reload 会杀掉正在等待 60-110s 的 AI 占卜请求
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline.html",
  },
  // 大体积静态资源不进 precache（塔罗牌图 4.4MB + 截图/启动图），改由 runtimeCaching 按需缓存
  publicExcludes: ["!images/**", "!screenshots/**", "!splash/**"],
  workboxOptions: {
    disableDevLogs: true,
    // CJK woff2 分片 5.9MB（106 个），浏览器按 unicode-range 只取用得到的几片，无需全量预缓存；
    // 用不带前缀的正则——workbox 匹配的是构建产物内的相对路径（static/media/xxx.woff2），
    // 带 /_next/ 前缀的写法匹配不到。仍由 static-assets 的 runtimeCaching 按需缓存。
    exclude: [/\.woff2$/],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        // 塔罗牌图单独建缓存：93 张牌面文件量大且不可变，用 CacheFirst 长期缓存，
        // 避免挤占 static-assets 的 LRU 名额导致持续互相逐出
        urlPattern: /\/images\/tarot\/.*\.(?:jpg|webp|png)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "tarot-cards",
          expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 128, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        // 日历整月农历标注 /api/huangli?month=YYYY-MM：纯确定性历法计算，服务端已声明
        // `public, s-maxage=31536000, immutable`。此前 runtimeCaching 无任何 /api 规则，
        // 客户端日历每次切月都真打网络（离线更是直接缺农历小字），故按同一语义补 CacheFirst。
        // 放在 pages 之前只为可读性：workbox 首个命中的路由生效，而上面三条（google-fonts /
        // tarot-cards / static-assets 正则均以 $ 收尾）与 pages（只匹配 8 个白名单页面路径，
        // 带 query 的 /api/* 匹配不到）都不会命中本 URL，故实际无冲突，仅新增不改动既有条目。
        // 若日后 days 响应结构变更，改 cacheName 强制换缓存桶（等同 CDN immutable 的换 URL 手法）。
        urlPattern: /\/api\/huangli\?month=\d{4}-\d{2}/i,
        handler: "CacheFirst",
        options: {
          cacheName: "huangli-month",
          // 24 个月足够覆盖来回翻月的浏览窗口；TTL 与服务端 s-maxage(1 年) 对齐
          expiration: { maxEntries: 24, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/www\.cyberfate\.me\/(?:bazi|daily|tarot|ziwei|meihua|huangli|pricing|knowledge)?(?:\/.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          // 4h：旧 HTML 里烤着构建期数据，缓存越久水合失败越严重
          expiration: { maxEntries: 16, maxAgeSeconds: 4 * 60 * 60 },
          // 3s：弱网导航尽快回退缓存，不让用户干等 10s
          networkTimeoutSeconds: 3,
        },
      },
    ],
  },
});

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // 新增安全头
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // COEP require-corp 已移除：会阻止加载无 CORP 头的跨域资源（如 Google 头像）
  // { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://checkout.stripe.com https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://app.posthog.com https://us-assets.i.posthog.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
      "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      // 仅保留浏览器端真正会直连的域名；AI(modelverse)/飞书/Upstash 均为服务端调用，
      // 不应出现在 connect-src（既无必要也避免信息暴露）。
      "connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://app.posthog.com https://us.i.posthog.com https://eu.i.posthog.com",
      "frame-src https://checkout.stripe.com https://js.stripe.com",
      "frame-ancestors 'self' https://checkout.stripe.com https://js.stripe.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withPWA(withBundleAnalyzer(nextConfig));
