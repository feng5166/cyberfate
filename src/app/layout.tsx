import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { AuthProvider } from "@/stores/authStore";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { JsonLd } from "@/components/seo/JsonLd";

const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "600", "700"],
  variable: "--font-heading",
  display: "swap",
  // 不指定 subsets，让 next/font 自动加载所需字符（包括中文）
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display-secondary",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cyberfate.me"),
  title: {
    default: "赛博命理师 CyberFate - AI 驱动的东方智慧",
    template: "%s | 赛博命理师",
  },
  description: "融合传统命理与现代 AI 技术，为你提供科学、理性的命理分析参考。八字分析、每日运势、紫微斗数、塔罗占卜。",
  keywords: ["八字分析", "命理分析", "AI算命", "每日运势", "紫微斗数", "塔罗牌", "生辰八字", "五行分析"],
  authors: [{ name: "CyberFate" }],
  creator: "CyberFate",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://www.cyberfate.me",
    siteName: "赛博命理师 CyberFate",
    title: "赛博命理师 CyberFate - AI 驱动的东方智慧",
    description: "融合传统命理与现代 AI 技术，为你提供科学、理性的命理分析参考。",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "赛博命理师 CyberFate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "赛博命理师 CyberFate - AI 驱动的东方智慧",
    description: "融合传统命理与现代 AI 技术，为你提供科学、理性的命理分析参考。",
    images: ["/og-image.svg"],
  },
  icons: {
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${notoSerifSC.variable} ${cormorantGaramond.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[99999] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:rounded-lg focus:shadow-lg focus:text-[#1C1A16] focus:border focus:border-[#1C1A16]/20"
        >
          跳到主要内容
        </a>
        <JsonLd />
        <SessionProvider>
          <AuthProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
