import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// Bundle analyzer: enable with `ANALYZE=true npm run build`
// Requires: npm install -D @next/bundle-analyzer
let withBundleAnalyzer: (config: NextConfig) => NextConfig = (c) => c;
try {
  const mod = require("@next/bundle-analyzer");
  if (mod?.default) {
    withBundleAnalyzer = mod.default({ enabled: true, openAnalyzer: false });
  }
} catch {
  // @next/bundle-analyzer not installed, skip
}

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline.html",
  },
  workboxOptions: {
    disableDevLogs: true,
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
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/www\.cyberfate\.me\/(?:bazi|daily|tarot|ziwei|meihua|huangli|pricing|knowledge)?(?:\/.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          expiration: { maxEntries: 16, maxAgeSeconds: 24 * 60 * 60 },
          networkTimeoutSeconds: 10,
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
      "connect-src 'self' https://api.stripe.com https://api.modelverse.cn https://open.feishu.cn https://*.upstash.io https://www.google-analytics.com https://analytics.google.com https://app.posthog.com https://us.i.posthog.com https://eu.i.posthog.com",
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
