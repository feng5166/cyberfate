import type { NextConfig } from "next";

// Bundle analyzer: enable with `ANALYZE=true npm run build`
// Requires: npm install -D @next/bundle-analyzer
let withBundleAnalyzer: (config: NextConfig) => NextConfig | Promise<NextConfig> = (c) => c;
try {
  const mod = require("@next/bundle-analyzer");
  if (mod?.default) {
    withBundleAnalyzer = mod.default({ enabled: true, openAnalyzer: false });
  }
} catch {
  // @next/bundle-analyzer not installed, skip
}

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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.stripe.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
      "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.stripe.com https://api.modelverse.cn https://open.feishu.cn https://*.upstash.io",
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

export default withBundleAnalyzer(nextConfig);
