import type { Metadata } from "next";
import { Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cyberfate.vercel.app"),
  title: {
    default: "赛博命理师 CyberFate - AI 驱动的东方智慧",
    template: "%s | 赛博命理师",
  },
  description: "融合传统命理与现代 AI 技术，为你提供科学、理性的命理分析参考。八字算命、每日运势、紫微斗数、塔罗占卜。",
  keywords: ["八字算命", "命理分析", "AI算命", "每日运势", "紫微斗数", "塔罗牌", "生辰八字", "五行分析"],
  authors: [{ name: "CyberFate" }],
  creator: "CyberFate",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://cyberfate.vercel.app",
    siteName: "赛博命理师 CyberFate",
    title: "赛博命理师 CyberFate - AI 驱动的东方智慧",
    description: "融合传统命理与现代 AI 技术，为你提供科学、理性的命理分析参考。",
    images: [
      {
        url: "/og-image.png",
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
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
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
    <html lang="zh-CN" className={notoSerifSC.variable}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
